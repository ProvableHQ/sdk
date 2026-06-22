import { expect } from "chai";
import {
    Address,
    Authorization,
    ExecutionRequest,
    Field,
    Group,
    OfflineQuery,
    Plaintext,
    Poseidon2,
    Poseidon4,
    Poseidon8,
    PrivateKey,
    Program,
    ProgramImportsBuilder,
    ProgramManagerBase,
    ProvingRequest,
    QueryOption,
    RecordPlaintext,
    Signature,
    ViewKey,
    computeExternalSigningInputs,
    toField,
    toGroup,
    toViewKey,
    toSignature,
    toAddress,
    buildExecutionRequestFromExternallySignedData,
} from "../src/node.js";
import type {
    FieldLike,
    SignatureLike,
    AddressLike,
    InputStrategy,
    ExternalSigningInput,
} from "../src/node.js";
import {
    isViewKeyStrategy,
    isInputIdStrategy,
    isRecordViewKeyStrategy,
} from "../src/node.js";
import {
    privateKeyString,
    viewKeyString,
    addressString,
    beaconPrivateKeyString,
} from "./data/account-data.js";
import { MULTIPLY_PROGRAM, DOUBLE_PROGRAM, LDGBATCHER_P28_PROGRAM } from "./data/test-programs.js";

const message = Uint8Array.from([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]);

/**
 * Output of the signer-side {@link fromPreprocessedInputs}: the freshly-sampled transition view key,
 * the derived transition commitment, the request signature, and the gammas of the static-record
 * inputs (one per record input, in input order).
 */
interface PreprocessedSigningResult {
    tvk: Field;
    tcm: Field;
    signature: Signature;
    gammas: Group[];
}

/**
 * Produces a request signature from preprocessed inputs, mirroring the standard request
 * signing algorithm. The signer holds the private key; the preprocessed inputs (produced by the
 * authorizer via {@link computeExternalSigningInputs}) contain the to-fields representation of each
 * input except for static records, where they contain the (`H`, `tag`) tuple.
 *
 * The function:
 *   1. Samples a fresh transition view key `tvk` and derives `tcm = Hash(tvk)`.
 *   2. Builds the message payload corresponding to each non-static-record input.
 *   3. Calls `ExecutionRequest.signRequestFromPreprocessedInputs`, which samples the
 *      transition secret `r`, computes `r * H` and `gamma = sk_sig * H` for every record, assembles
 *      the message, and signs it.
 *
 * @returns The sampled `tvk`, the `tcm`, the `signature`, and the per-record `gammas`.
 */
function fromPreprocessedInputs(
    privateKey: PrivateKey,
    programName: string,
    functionName: string,
    authExternalInputs: ExternalSigningInput<"string">,
): PreprocessedSigningResult {

    // Initialize the hashers.
    const poseidon4 = new Poseidon4();
    const poseidon8 = new Poseidon8();

    // The WASM bindings take `Field` arguments by value and consume (move) them: a `Field` instance
    // cannot be reused across two WASM calls. We therefore keep the reused values as strings and mint
    // a fresh `Field` for each use via `f(...)`.
    const str_to_f = (s: string): Field => Field.fromString(s);

    // Sample the transition view key and derive the transition commitment `tcm = Hash(tvk)`.
    const tvkStr = Field.random().toString();
    const tcmStr = new Poseidon2().hash([str_to_f(tvkStr)]).toString();
    const functionIdStr = authExternalInputs.functionId;

    // Build the per-input signing material. Records are passed as `[H, tag]` (the signer derives
    // `r * H` and `gamma`); every other input is passed as its precomputed input ID field, which is
    // derived from the freshly-sampled `tvk` exactly as the standard signing algorithm does.
    const inputIds = authExternalInputs.requestInputs.map((input): Field | [Field, Field] => {
        const index = input.index;
        const data = (): Field[] => input.data.map(str_to_f);
        switch (input.signingInputType) {
            case "record":
                return [str_to_f(input.h!), str_to_f(input.tag!)];
            case "constant":
            case "public":
                // `Hash(function_id || data || tcm || index)`.
                return poseidon8.hash([str_to_f(functionIdStr), ...data(), str_to_f(tcmStr), str_to_f(index)]);
            case "private": {
                // Encrypt with input view key `Hash(function_id || tvk || index)`, hash the ciphertext.
                const inputViewKey = poseidon4.hash([str_to_f(functionIdStr), str_to_f(tvkStr), str_to_f(index)]);
                const ciphertext = Plaintext.fromFields(data()).encryptSymmetric(inputViewKey);
                return poseidon8.hash(Array.from(ciphertext.toFields() as ArrayLike<Field>));
            }
            case "external_record":
            case "dynamic_record":
                // `Hash(function_id || data || tvk || index)`.
                return poseidon8.hash([str_to_f(functionIdStr), ...data(), str_to_f(tvkStr), str_to_f(index)]);
            default:
                throw new Error(`Unsupported signing input type: ${input.signingInputType}`);
        }
    });

    const checksum = authExternalInputs.checksum != null ? str_to_f(authExternalInputs.checksum) : undefined;

    const signed: any = (ExecutionRequest as any).signRequestFromPreprocessedInputs(
        privateKey,
        programName,
        functionName,
        str_to_f(tvkStr),
        authExternalInputs.isRoot,
        checksum,
        inputIds,
    );

    return {
        tvk: signed.tvk as Field,
        tcm: signed.tcm as Field,
        signature: signed.signature as Signature,
        gammas: Array.from(signed.gammas as ArrayLike<Group>),
    };
}

/**
 * Computes the nonce of a static output record minted at `outputIndex` by a request whose transition
 * view key is `tvk`, exactly as the `cast` instruction does on-chain:
 *   `nonce = g * HashToScalar([tvk, output_index])`.
 */
function computeMintedNonce(tvk: Field, outputIndex: number): Group {
    const index = Field.fromString(`${outputIndex}field`);
    const randomizer = new Poseidon2().hashToScalar([tvk, index]);
    // The nonce uses the Aleo account/signature generator `G` (Network::g_scalar_multiply), not the
    // curve's prime-subgroup generator returned by `Group.generator()`.
    return Group.gScalarMultiply(randomizer);
}

/**
 * Writes a freshly-minted record nonce into the consumer input that receives it: replaces the
 * `_nonce` of the record at `inputsByRequest[consumerRequestIndex][inputIndex]`.
 */
function applyMintedNonce(
    inputsByRequest: string[][],
    consumerRequestIndex: number,
    inputIndex: number,
    nonce: Group,
): void {
    const inputs = inputsByRequest[consumerRequestIndex];
    inputs[inputIndex] = inputs[inputIndex].replace(/_nonce:\s*\d+group/, `_nonce: ${nonce.toString()}`);
}

/**
 * Maps a function-input definition returned by {@link Program.getFunctionInputs} to its snarkVM
 * value-type string (the format consumed by `computeExternalSigningInputs`, the
 * `fromExternallySignedData*` methods and `verify`). The shape returned by `getFunctionInputs`
 * differs per input kind, so a plain `${type}.${visibility}` is only correct for literals.
 */
function valueTypeFromInputDef(def: any): string {
    switch (def.type) {
        case "record":
            // Internal record: `<record_name>.record`.
            return `${def.record}.record`;
        case "external_record":
            // External record: `<program_id>/<record_name>.record`.
            return `${def.locator}.record`;
        case "future":
            return `${def.locator}.future`;
        case "struct":
            return `${def.struct_id}.${def.visibility}`;
        case "dynamic.record":
        case "dynamic.future":
            return def.type;
        default:
            // Literal plaintext (address, u64, field, ...): `<type>.<visibility>`.
            return `${def.type}.${def.visibility}`;
    }
}

// TODO (Antonio) duplicated from external-signing.test.ts
describe('External Signing Utilities', () => {
    const privateKey = PrivateKey.from_string(privateKeyString);
    const viewKey = privateKey.to_view_key();
    const address = privateKey.to_address();
    const signature = privateKey.sign(message);

    describe('toField', () => {
        it('passes through a Field instance', () => {
            const field = Field.fromString("1field");
            const result = toField(field);
            expect(result).instanceof(Field);
            expect(result.toString()).equal(field.toString());
        });

        it('converts a string to a Field', () => {
            const result = toField("1field");
            expect(result).instanceof(Field);
            expect(result.toString()).equal("1field");
        });

        it('converts a Uint8Array to a Field', () => {
            const field = Field.fromString("1field");
            const bytes = field.toBytesLe();
            const result = toField(bytes);
            expect(result).instanceof(Field);
            expect(result.toString()).equal(field.toString());
        });
    });

    describe('toGroup', () => {
        it('passes through a Group instance', () => {
            const group = Group.fromString("2group");
            const result = toGroup(group);
            expect(result).instanceof(Group);
            expect(result.toString()).equal(group.toString());
        });

        it('converts a string to a Group', () => {
            const result = toGroup("2group");
            expect(result).instanceof(Group);
            expect(result.toString()).equal("2group");
        });

        it('converts a Uint8Array to a Group', () => {
            const group = Group.fromString("2group");
            const bytes = group.toBytesLe();
            const result = toGroup(bytes);
            expect(result).instanceof(Group);
            expect(result.toString()).equal(group.toString());
        });

        it('converts a Field instance to a Group (x-coordinate)', () => {
            const group = Group.fromString("2group");
            const xCoord = group.toXCoordinate();
            const result = toGroup(xCoord);
            expect(result).instanceof(Group);
            expect(result.toString()).equal(group.toString());
        });

        it('converts a field string to a Group (x-coordinate)', () => {
            const group = Group.fromString("2group");
            const xCoordStr = group.toXCoordinate().toString();
            const result = toGroup(xCoordStr);
            expect(result).instanceof(Group);
            expect(result.toString()).equal(group.toString());
        });

        it('converts a field Uint8Array to a Group (x-coordinate fallback)', () => {
            const group = Group.fromString("2group");
            const xCoord = group.toXCoordinate();
            const fieldBytes = xCoord.toBytesLe();
            const result = toGroup(fieldBytes);
            expect(result).instanceof(Group);
            expect(result.toString()).equal(group.toString());
        });
    });

    describe('toViewKey', () => {
        it('passes through a ViewKey instance', () => {
            const result = toViewKey(viewKey);
            expect(result).instanceof(ViewKey);
            expect(result.to_string()).equal(viewKeyString);
        });

        it('converts a string to a ViewKey', () => {
            const result = toViewKey(viewKeyString);
            expect(result).instanceof(ViewKey);
            expect(result.to_string()).equal(viewKeyString);
        });

        it('converts a Uint8Array to a ViewKey', () => {
            const bytes = viewKey.toBytesLe();
            const result = toViewKey(bytes);
            expect(result).instanceof(ViewKey);
            expect(result.to_string()).equal(viewKeyString);
        });
    });

    describe('toSignature', () => {
        it('passes through a Signature instance', () => {
            const result = toSignature(signature);
            expect(result).instanceof(Signature);
            expect(result.to_string()).equal(signature.to_string());
        });

        it('converts a string to a Signature', () => {
            const sigString = signature.to_string();
            const result = toSignature(sigString);
            expect(result).instanceof(Signature);
            expect(result.to_string()).equal(sigString);
        });

        it('converts a Uint8Array to a Signature', () => {
            const bytes = signature.toBytesLe();
            const result = toSignature(bytes);
            expect(result).instanceof(Signature);
            expect(result.to_string()).equal(signature.to_string());
        });
    });

    describe('toAddress', () => {
        it('passes through an Address instance', () => {
            const result = toAddress(address);
            expect(result).instanceof(Address);
            expect(result.to_string()).equal(addressString);
        });

        it('converts a string to an Address', () => {
            const result = toAddress(addressString);
            expect(result).instanceof(Address);
            expect(result.to_string()).equal(addressString);
        });

        it('converts a Uint8Array to an Address', () => {
            const bytes = address.toBytesLe();
            const result = toAddress(bytes);
            expect(result).instanceof(Address);
            expect(result.to_string()).equal(addressString);
        });
    });

    describe('buildExecutionRequestFromExternallySignedData', () => {
        const commonParams = {
            programId: "credits.aleo",
            functionName: "transfer_public",
            inputs: [addressString, "100u64"],
            inputTypes: ["address.public", "u64.public"],
            signature: signature as SignatureLike,
            tvk: Field.fromString("1field") as FieldLike,
            signer: address as AddressLike,
            skTag: Field.fromString("1field") as FieldLike,
        };

        it('builds a request with public inputs using string parameters', () => {
            try {
                const result = buildExecutionRequestFromExternallySignedData({
                    ...commonParams,
                    signature: signature.to_string(),
                    tvk: "1field",
                    signer: addressString,
                    skTag: "1field",
                });
                expect(result).instanceof(ExecutionRequest);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts Uint8Array parameters for signature, tvk, address, sk_tag', () => {
            try {
                const result = buildExecutionRequestFromExternallySignedData({
                    ...commonParams,
                    signature: signature.toBytesLe(),
                    tvk: Field.fromString("1field").toBytesLe(),
                    signer: address.toBytesLe(),
                    skTag: Field.fromString("1field").toBytesLe(),
                });
                expect(result).instanceof(ExecutionRequest);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts WASM object parameters directly', () => {
            try {
                const result = buildExecutionRequestFromExternallySignedData(commonParams);
                expect(result).instanceof(ExecutionRequest);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts a view key resolution as string', () => {
            try {
                buildExecutionRequestFromExternallySignedData(commonParams, { viewKey: viewKeyString });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts a view key resolution as Uint8Array', () => {
            try {
                buildExecutionRequestFromExternallySignedData(commonParams, { viewKey: viewKey.toBytesLe() });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts Field input IDs (public inputs)', () => {
            const inputId = Field.fromString("1field");

            try {
                buildExecutionRequestFromExternallySignedData(commonParams, { inputIds: [inputId, inputId] });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts tuple input IDs (record inputs)', () => {
            const f = Field.fromString("1field");
            const g = Group.fromString("2group");
            const recordInputId: [Field, Group, Field, Field, Field] = [f, g, f, f, f];

            try {
                buildExecutionRequestFromExternallySignedData(
                    { ...commonParams, inputs: [addressString], inputTypes: ["address.public"] },
                    { inputIds: [recordInputId] },
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts string input IDs', () => {
            try {
                buildExecutionRequestFromExternallySignedData(commonParams, { inputIds: ["1field", "1field"] });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts Uint8Array input IDs', () => {
            const fieldBytes = Field.fromString("1field").toBytesLe();

            try {
                buildExecutionRequestFromExternallySignedData(commonParams, { inputIds: [fieldBytes, fieldBytes] });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts tuple input IDs with string/Uint8Array elements', () => {
            const groupBytes = Group.fromString("2group").toBytesLe();
            const fieldBytes = Field.fromString("1field").toBytesLe();
            const recordInputId: [string, Uint8Array, string, Uint8Array, string] = [
                "1field", groupBytes, "1field", fieldBytes, "1field"
            ];

            try {
                buildExecutionRequestFromExternallySignedData(
                    { ...commonParams, inputs: [addressString], inputTypes: ["address.public"] },
                    { inputIds: [recordInputId] },
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('throws on invalid strategy', () => {
            expect(() => buildExecutionRequestFromExternallySignedData(commonParams, { bogus: true } as unknown as InputStrategy)).to.throw(
                "buildExecutionRequestFromExternallySignedData: strategy must be a RecordViewKeyStrategy",
            );
        });
    });

    describe('InputStrategy type guards', () => {
        it('isRecordViewKeyStrategy identifies empty object', () => {
            const s: InputStrategy = {};
            expect(isRecordViewKeyStrategy(s)).to.be.true;
            expect(isViewKeyStrategy(s)).to.be.false;
            expect(isInputIdStrategy(s)).to.be.false;
        });

        it('isRecordViewKeyStrategy identifies recordViewKeys + gammas', () => {
            const s: InputStrategy = { recordViewKeys: ["1field"], gammas: ["2group"] };
            expect(isRecordViewKeyStrategy(s)).to.be.true;
            expect(isViewKeyStrategy(s)).to.be.false;
            expect(isInputIdStrategy(s)).to.be.false;
        });

        it('isViewKeyStrategy identifies viewKey', () => {
            const s: InputStrategy = { viewKey: viewKeyString };
            expect(isViewKeyStrategy(s)).to.be.true;
            expect(isRecordViewKeyStrategy(s)).to.be.false;
            expect(isInputIdStrategy(s)).to.be.false;
        });

        it('isViewKeyStrategy identifies viewKey + gammas', () => {
            const s: InputStrategy = { viewKey: viewKeyString, gammas: ["2group"] };
            expect(isViewKeyStrategy(s)).to.be.true;
            expect(isRecordViewKeyStrategy(s)).to.be.false;
            expect(isInputIdStrategy(s)).to.be.false;
        });

        it('isInputIdStrategy identifies inputIds', () => {
            const s: InputStrategy = { inputIds: ["1field"] };
            expect(isInputIdStrategy(s)).to.be.true;
            expect(isRecordViewKeyStrategy(s)).to.be.false;
            expect(isViewKeyStrategy(s)).to.be.false;
        });
    });

    describe('computeExternalSigningInputs', () => {
        it('computes external signing inputs for a public transfer (string format)', async () => {
            const result = await computeExternalSigningInputs({
                programName: "credits.aleo",
                functionName: "transfer_public",
                inputs: [addressString, "100u64"],
                inputTypes: ["address.public", "u64.public"],
                isRoot: true,
            });

            expect(result.functionId).to.be.a('string');
            expect(result.isRoot).to.equal(true);
            expect(result.requestInputs).to.be.an('array');
            expect(result.requestInputs.length).to.equal(2);
            expect(result.requestInputs[0].index).to.be.a('string');
            expect(result.requestInputs[0].data[0]).to.be.a('string');
        });

        it('computes external signing inputs for a public transfer (bytes format)', async () => {
            const result = await computeExternalSigningInputs({
                programName: "credits.aleo",
                functionName: "transfer_public",
                inputs: [addressString, "100u64"],
                inputTypes: ["address.public", "u64.public"],
                isRoot: true,
                outputFormat: "bytes",
            });

            expect(result.functionId).to.be.instanceOf(Uint8Array);
            expect(result.isRoot).to.equal(true);
            expect(result.requestInputs).to.be.an('array');
            expect(result.requestInputs.length).to.equal(2);
            expect(result.requestInputs[0].index).to.be.instanceOf(Uint8Array);
            expect(result.requestInputs[0].data[0]).to.be.instanceOf(Uint8Array);
        });

        it('bytes and string outputs round-trip through Field', async () => {
            const strResult = await computeExternalSigningInputs({
                programName: "credits.aleo",
                functionName: "transfer_public",
                inputs: [addressString, "100u64"],
                inputTypes: ["address.public", "u64.public"],
                isRoot: true,
            });
            const bytesResult = await computeExternalSigningInputs({
                programName: "credits.aleo",
                functionName: "transfer_public",
                inputs: [addressString, "100u64"],
                inputTypes: ["address.public", "u64.public"],
                isRoot: true,
                outputFormat: "bytes",
            });

            // functionId round-trips
            const functionIdFromBytes = Field.fromBytesLe(bytesResult.functionId).toString();
            expect(functionIdFromBytes).to.equal(strResult.functionId);

            // first input index round-trips
            const indexFromBytes = Field.fromBytesLe(bytesResult.requestInputs[0].index).toString();
            expect(indexFromBytes).to.equal(strResult.requestInputs[0].index);

            // first input data[0] round-trips
            const dataFromBytes = Field.fromBytesLe(bytesResult.requestInputs[0].data[0]).toString();
            expect(dataFromBytes).to.equal(strResult.requestInputs[0].data[0]);
        });
    });
});

describe('External Signing ExecutionRequest integration', () => {
    const privateKeyStr = "APrivateKey1zkp7Vc4xJt8HqW9U7VhY6h32d8Z9Xi5C6ZZX3gtXxbBSJmj";
    const beaconAddress = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
    const transferPublicInputs = [
        beaconAddress,
        "100u64",
    ];
    const transferPublicInputTypes = ["address.public", "u64.public"];
    const recordBeaconOwned = `{ owner: ${beaconAddress}.private, microcredits: 1000000u64.private, _nonce: 3634848344765318974603121890869676775499130077229666060613233255327643175219group.public, _version: 1u8.public }`;
    const transferPrivateInputs = [
        recordBeaconOwned,
        "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
        "100u64",
    ];
    const transferPrivateInputTypes = ["credits.record", "address.private", "u64.private"];

    it('Should compute external signing inputs and return ExternalSigningInput shape (functionId, isRoot, requestInputs, checksum)', async () => {
        const externalSigningInputs = await computeExternalSigningInputs({
            programName: "credits.aleo",
            functionName: "transfer_public",
            inputs: transferPublicInputs,
            inputTypes: transferPublicInputTypes,
            isRoot: true,
            checksum: null,
        });

        expect(externalSigningInputs).to.be.an("object");
        expect(externalSigningInputs).to.have.property("functionId");
        expect(externalSigningInputs).to.have.property("isRoot");
        expect(externalSigningInputs).to.have.property("requestInputs");
        expect(externalSigningInputs.functionId).to.be.a("string");
        expect(externalSigningInputs.functionId.length).to.be.greaterThan(0);
        expect(externalSigningInputs.functionId).to.match(/field$/);
        expect(externalSigningInputs.isRoot).to.equal(true);
        expect(externalSigningInputs.checksum).to.satisfy((v: unknown) => v === null || v === undefined);
        expect(externalSigningInputs.requestInputs).to.be.an("array").with.lengthOf(2);

        const [firstInput, secondInput] = externalSigningInputs.requestInputs;
        expect(firstInput).to.have.property("signingInputType", "public");
        expect(firstInput).to.have.property("index", "0field");
        expect(firstInput).to.have.property("data").that.is.an("array");
        expect(firstInput.data.length).to.be.greaterThan(0);
        expect(secondInput).to.have.property("signingInputType", "public");
        expect(secondInput).to.have.property("index", "1field");
        expect(secondInput).to.have.property("data").that.is.an("array");

        const assertFieldsRoundTripThroughPlaintext = (fieldStrings: string[], expectedString: string) => {
            const fields = fieldStrings.map((s: string) => Field.fromString(s));
            const plaintext = Plaintext.fromFields(fields);
            const backFields = plaintext.toFields();
            const backStrings = Array.from(backFields).map((f: Field) => f.toString());
            expect(backStrings).to.deep.equal(fieldStrings);
            expect(plaintext.toString()).to.equal(expectedString);
        };
        assertFieldsRoundTripThroughPlaintext(firstInput.data, transferPublicInputs[0]);
        assertFieldsRoundTripThroughPlaintext(secondInput.data, transferPublicInputs[1]);
    });

    it('Should match ExecutionRequest.sign for transfer_public', async () => {
        const privateKey = PrivateKey.from_string(privateKeyStr);
        const viewKey = ViewKey.from_private_key(privateKey);
        const externalSigningInputs = await computeExternalSigningInputs({
            programName: "credits.aleo",
            functionName: "transfer_public",
            inputs: transferPublicInputs,
            inputTypes: transferPublicInputTypes,
            isRoot: true,
            checksum: null,
        });

        const signedRequest = ExecutionRequest.sign(
            privateKey,
            "credits.aleo",
            "transfer_public",
            transferPublicInputs,
            transferPublicInputTypes,
            undefined,
            undefined,
            true,
        );
        expect(signedRequest.program_id()).to.equal("credits.aleo");
        expect(signedRequest.function_name()).to.equal("transfer_public");
        expect(signedRequest.inputs().length).to.equal(2);
        expect(externalSigningInputs.requestInputs.length).to.equal(signedRequest.inputs().length);

        // Build the same request via buildExecutionRequestFromExternallySignedDataWithViewKey using view_key to compute input_ids.
        const externallySignedRequest = ExecutionRequest.fromExternallySignedDataWithViewKey(
            "credits.aleo",
            "transfer_public",
            transferPublicInputs,
            transferPublicInputTypes,
            signedRequest.signature(),
            signedRequest.tvk(),
            signedRequest.signer(),
            signedRequest.sk_tag(),
            viewKey,
        );
        expect(externallySignedRequest.program_id()).to.equal(signedRequest.program_id());
        expect(externallySignedRequest.function_name()).to.equal(signedRequest.function_name());
        expect(externallySignedRequest.inputs().length).to.equal(signedRequest.inputs().length);
        expect(externallySignedRequest.input_ids().length).to.equal(signedRequest.input_ids().length);
        expect(externallySignedRequest.toString()).to.equal(signedRequest.toString());

        // Build the same request via buildExecutionRequestFromExternallySignedDataWithInputIds using pre-computed input_ids.
        const externallySignedFromInputIds = ExecutionRequest.fromExternallySignedDataWithInputIds(
            "credits.aleo",
            "transfer_public",
            transferPublicInputs,
            transferPublicInputTypes,
            signedRequest.signature(),
            signedRequest.tvk(),
            signedRequest.signer(),
            signedRequest.sk_tag(),
            signedRequest.input_ids(),
        );
        expect(externallySignedFromInputIds.toString()).to.equal(signedRequest.toString());
    });

    it('Should match ExecutionRequest.sign for nested transfer', async () => {
        // Deploy scenario: double_test.aleo (parent) calls multiply_test.aleo/multiply (child).

        const privateKey = PrivateKey.from_string(privateKeyStr);
        const viewKey = ViewKey.from_private_key(privateKey);
        const address = Address.from_private_key(privateKey);

        // --- Part 1: mocked nested authorization via sampleAuthorization ---
        const ChildProgramName = "multiply_test.aleo";
        const ParentProgramName = "double_test.aleo";
        const imports = new ProgramImportsBuilder();
        imports.addProgram(ChildProgramName, MULTIPLY_PROGRAM);
        imports.addProgram(ParentProgramName, DOUBLE_PROGRAM);

        const parentInputs = ["5u32"];
        const parentInputTypes = ["u32.private"];
        const parentFunctionName = "double_it";

        // sampleAuthorization traverses the call graph without a private key and produces one
        // mocked request per transition: double_it (root) + multiply (child) = 2 requests.
        const authorization = await ProgramManagerBase.sampleAuthorization(
            address,
            DOUBLE_PROGRAM,
            parentFunctionName,
            parentInputs,
            undefined,  // legacy imports object (unused when program_imports is provided)
            undefined,  // edition (defaults to 1)
            imports,
        );

        // The authorization must contain exactly two requests: one for each transition.
        expect(authorization.len()).to.equal(2);
        expect(authorization.isEmpty()).to.equal(false);
        expect(authorization.functionName()).to.equal(parentFunctionName);

        // Round-trip through string serialization.
        const roundTripped = Authorization.fromString(authorization.toString());
        expect(roundTripped.len()).to.equal(2);
        expect(roundTripped.equals(authorization)).to.equal(true);

        // --- Part 2: verify the external-signing pipeline ---

        // computeExternalSigningInputs returns the per-input data an external signer needs
        // to construct a matching request without running the full WASM stack locally.
        const externalInputs = await computeExternalSigningInputs({
            programName: ParentProgramName,
            functionName: parentFunctionName,
            inputs: parentInputs,
            inputTypes: parentInputTypes,
            isRoot: true,
            checksum: null,
        });
        expect(externalInputs.isRoot).to.equal(true);
        let signedParentRequest = authorization.requests()[0];
        let signedChildRequest = authorization.requests()[1];
        expect(externalInputs.requestInputs.length).to.equal(signedParentRequest.inputs().length);

        // fromExternallySignedDataWithViewKey reconstructs the full request from the
        // signature + tvk + view key and must produce a request identical to the original.
        const externallySignedParentRequest = ExecutionRequest.fromExternallySignedDataWithViewKey(
            ParentProgramName,
            parentFunctionName,
            parentInputs,
            parentInputTypes,
            signedParentRequest.signature(),
            signedParentRequest.tvk(),
            signedParentRequest.signer(),
            signedParentRequest.sk_tag(),
            viewKey,
        );
    
        // NOTE: the input_ids, tcm and scm will be different from the
        // signedParentRequest because stack.sample_authorization sampled a
        // random view_key.
        expect(externallySignedParentRequest.signer().toString()).to.equal(signedParentRequest.signer().toString());
        expect(externallySignedParentRequest.signature().toString()).to.equal(signedParentRequest.signature().toString());
        expect(externallySignedParentRequest.tvk().toString()).to.equal(signedParentRequest.tvk().toString());
        expect(externallySignedParentRequest.sk_tag().toString()).to.equal(signedParentRequest.sk_tag().toString());
        expect(externallySignedParentRequest.inputs().length).to.equal(signedParentRequest.inputs().length);

        // --- Part 3: reconstruct the child request (multiply_test.aleo/multiply) ---
        // Resolve child inputs directly from the mocked request — Request::sample preserves
        // the actual computed values passed by the parent call instruction.
        const childInputs = Array.from(signedChildRequest.inputs() as ArrayLike<any>)
            .map((v: any) => v.toString());

        // Derive input types from the child program's function definition so the test
        // stays correct even if the program signature changes.
        const childProgram = Program.fromString(MULTIPLY_PROGRAM);
        const childFunctionInputDefs = Array.from(childProgram.getFunctionInputs("multiply")) as any[];
        const childInputTypes = childFunctionInputDefs.map((def: any) => `${def.type}.${def.visibility}`);

        // ViewKey is taken by value (consumed) in Part 2; create a fresh instance for Part 3.
        const viewKeyForChild = ViewKey.from_private_key(privateKey);

        const externallySignedChildRequest = ExecutionRequest.fromExternallySignedDataWithViewKey(
            ChildProgramName,
            "multiply",
            childInputs,
            childInputTypes,
            signedChildRequest.signature(),
            signedChildRequest.tvk(),      // child's own tvk
            signedChildRequest.signer(),
            signedChildRequest.sk_tag(),
            viewKeyForChild,
            undefined,                        // no record inputs → no gammas
            signedParentRequest.tvk(),        // root_tvk = parent's tvk
        );

        // Signer, tvk, sk_tag, and signature come directly from the passed parameters and
        // must be reproduced verbatim by the reconstruction regardless of tcm/scm.
        //
        // NOTE: sampleAuthorization uses Request::sample which randomises tcm and scm
        // independently of tvk, so tcm/scm equality cannot be asserted here.  The
        // root_tvk parameter is needed for REAL child requests (signed via
        // ExecutionRequest.sign with is_root:false) where scm = hash(signer, root_tvk).
        expect(externallySignedChildRequest.signer().toString()).to.equal(signedChildRequest.signer().toString());
        expect(externallySignedChildRequest.tvk().toString()).to.equal(signedChildRequest.tvk().toString());
        expect(externallySignedChildRequest.sk_tag().toString()).to.equal(signedChildRequest.sk_tag().toString());
        expect(externallySignedChildRequest.signature().toString()).to.equal(signedChildRequest.signature().toString());

        // --- Part 4: bundle both signed requests into a ProvingRequest (Request variant) ---
        //
        // The root (double_it) and child (multiply) requests are passed together so the DPS
        // server can authorize the full nested call graph in one shot.
        const provingRequest = ProgramManagerBase.buildProvingRequestFromExecutionRequest(
            [signedParentRequest, signedChildRequest],
            undefined,  // no fee request
            false,      // don't broadcast
        );

        expect(provingRequest.kind()).to.equal("request");
        const prRequests = provingRequest.requests();
        expect(prRequests.length).to.equal(2);

        // Requests are returned in the same order they were passed in.
        expect(Array.from(prRequests as ArrayLike<any>)[0].program_id()).to.equal(ParentProgramName);
        expect(Array.from(prRequests as ArrayLike<any>)[1].program_id()).to.equal(ChildProgramName);

        // Serialization round-trip preserves both requests.
        const roundTrippedPR = ProvingRequest.fromString(provingRequest.toString());
        expect(roundTrippedPR.kind()).to.equal("request");
        expect(roundTrippedPR.requests().length).to.equal(2);
    });

    it('Should not include recordViewKey on inputs when no viewKey is provided', async () => {
        const externalSigningInputs = await computeExternalSigningInputs({
            programName: "credits.aleo",
            functionName: "transfer_private",
            inputs: transferPrivateInputs,
            inputTypes: transferPrivateInputTypes,
            isRoot: true,
            checksum: null,
        });
        // Record input should not have recordViewKey without a view key
        expect(externalSigningInputs.requestInputs[0].recordViewKey).to.be.undefined;
    });

    it('Should return per-input recordViewKey in bytes format when outputFormat is bytes', async () => {
        // Create separate ViewKey instances since WASM consumes them on each call
        const strViewKey = ViewKey.from_private_key(PrivateKey.from_string(beaconPrivateKeyString));
        const bytesViewKey = ViewKey.from_private_key(PrivateKey.from_string(beaconPrivateKeyString));
        const strResult = await computeExternalSigningInputs({
            programName: "credits.aleo",
            functionName: "transfer_private",
            inputs: transferPrivateInputs,
            inputTypes: transferPrivateInputTypes,
            isRoot: true,
            checksum: null,
            viewKey: strViewKey,
        });
        const bytesResult = await computeExternalSigningInputs({
            programName: "credits.aleo",
            functionName: "transfer_private",
            inputs: transferPrivateInputs,
            inputTypes: transferPrivateInputTypes,
            isRoot: true,
            checksum: null,
            viewKey: bytesViewKey,
            outputFormat: "bytes",
        });

        // Verify per-input recordViewKey in bytes format
        expect(bytesResult.requestInputs[0].recordViewKey).to.be.instanceOf(Uint8Array);
        const perInputRvkFromBytes = Field.fromBytesLe(bytesResult.requestInputs[0].recordViewKey!).toString();
        expect(perInputRvkFromBytes).to.equal(strResult.requestInputs[0].recordViewKey);

        // Non-record inputs should not have recordViewKey
        expect(bytesResult.requestInputs[1].recordViewKey).to.be.undefined;
    });

    it('Should produce per-input recordViewKey usable with buildExecutionRequestFromExternallySignedData', async () => {
        const privateKey = PrivateKey.from_string(beaconPrivateKeyString);
        const beaconRecord = RecordPlaintext.fromString(recordBeaconOwned);
        const gamma = beaconRecord.gamma("credits.aleo", "credits", privateKey);
        const beaconViewKey = ViewKey.from_private_key(privateKey);
        const externalSigningInputs = await computeExternalSigningInputs({
            programName: "credits.aleo",
            functionName: "transfer_private",
            inputs: transferPrivateInputs,
            inputTypes: transferPrivateInputTypes,
            isRoot: true,
            checksum: null,
            viewKey: beaconViewKey,
        });

        const signedRequest = ExecutionRequest.sign(
            privateKey,
            "credits.aleo",
            "transfer_private",
            transferPrivateInputs,
            transferPrivateInputTypes,
            undefined,
            undefined,
            true,
        );

        // Extract recordViewKeys from per-input data
        const recordViewKeys = externalSigningInputs.requestInputs
            .filter(input => input.recordViewKey != null)
            .map(input => input.recordViewKey!);

        // Use the extracted recordViewKeys to build a request
        const requestFromRecordViewKeys = buildExecutionRequestFromExternallySignedData(
            {
                programId: "credits.aleo",
                functionName: "transfer_private",
                inputs: transferPrivateInputs,
                inputTypes: transferPrivateInputTypes,
                signature: signedRequest.signature(),
                tvk: signedRequest.tvk(),
                signer: signedRequest.signer(),
                skTag: signedRequest.sk_tag(),
            },
            { recordViewKeys, gammas: [gamma] },
        );

        expect(requestFromRecordViewKeys.toString()).to.equal(signedRequest.toString());
    });

    it('Should compute external signing inputs and return ExternalSigningInput shape for private transfer', async () => {
        const externalSigningInputs = await computeExternalSigningInputs({
            programName: "credits.aleo",
            functionName: "transfer_private",
            inputs: transferPrivateInputs,
            inputTypes: transferPrivateInputTypes,
            isRoot: true,
            checksum: null,
        })

        expect(externalSigningInputs).to.be.an("object");
        expect(externalSigningInputs).to.have.property("functionId");
        expect(externalSigningInputs).to.have.property("isRoot");
        expect(externalSigningInputs).to.have.property("requestInputs");
        expect(externalSigningInputs.functionId).to.be.a("string");
        expect(externalSigningInputs.functionId.length).to.be.greaterThan(0);
        expect(externalSigningInputs.functionId).to.match(/field$/);
        expect(externalSigningInputs.isRoot).to.equal(true);
        expect(externalSigningInputs.checksum).to.satisfy((v: unknown) => v === null || v === undefined);
        expect(externalSigningInputs.requestInputs).to.be.an("array").with.lengthOf(3);

        const [firstInput, secondInput, thirdInput] = externalSigningInputs.requestInputs;
        expect(firstInput).to.have.property("signingInputType", "record");
        expect(firstInput).to.have.property("index", "0field");
        expect(firstInput).to.have.property("data").that.is.an("array");
        expect(firstInput.data.length).to.be.greaterThan(0);
        expect(secondInput).to.have.property("signingInputType", "private");
        expect(secondInput).to.have.property("index", "1field");
        expect(secondInput).to.have.property("data").that.is.an("array");
        expect(thirdInput).to.have.property("signingInputType", "private");
        expect(thirdInput).to.have.property("index", "2field");
        expect(thirdInput).to.have.property("data").that.is.an("array");

        const assertFieldsRoundTripThroughPlaintext = (fieldStrings: string[], expectedString: string) => {
            const fields = fieldStrings.map((s: string) => Field.fromString(s));
            const plaintext = Plaintext.fromFields(fields);
            const backFields = plaintext.toFields();
            const backStrings = Array.from(backFields).map((f: Field) => f.toString());
            expect(backStrings).to.deep.equal(fieldStrings);
            expect(plaintext.toString()).to.equal(expectedString);
        };
        assertFieldsRoundTripThroughPlaintext(secondInput.data, transferPrivateInputs[1]);
        assertFieldsRoundTripThroughPlaintext(thirdInput.data, transferPrivateInputs[2]);
    });


    it('Should match ExecutionRequest.sign for arbitrary flow with multiple requests', async () => {
        // Deploy scenario: ldgbatcher_p28.aleo batches three minted credits.aleo records into a
        // single private transfer via transfer_private_3
        // Nonetheless, the authorization/signing procedure below is general and should work for
        // any flow of calls and records in a valid transaction.

        // Below, we prefix the names of some authorizer-side variables with "auth" and signer-side
        // ones with "sig"
        const sigPrivateKeyStr = privateKeyStr;
        const sigPrivateKey = PrivateKey.from_string(sigPrivateKeyStr);

        const authViewKeyStr = ViewKey.from_private_key(sigPrivateKey).to_string();

        const addressStr = Address.from_private_key(sigPrivateKey).to_string();
         

        // -----------------------------------------------------------------------------------------
        // Setup: deploy ldgbatcher_p28.aleo and mint three credits.aleo records

        //   1. "Deploy" ldgbatcher_p28.aleo (which imports credits.aleo) by registering its
        //      source in the imports builder. credits.aleo is always available in the process,
        //      so addProgram does not need to be called for it.
        //   2. Produce three private credits.aleo records. Since the SDK test has no local
        //      ledger, instead of executing transfer_public_to_private three times we use
        //      pre-generated credits.aleo/credits record plaintexts owned by the caller.
        const ProgramName = "ldgbatcher_p28.aleo";
        const imports = new ProgramImportsBuilder();
        imports.addProgram(ProgramName, LDGBATCHER_P28_PROGRAM);

        // Each record contains 1_000_000 microcredits owned by the caller. The nonces are
        // distinct, valid group elements so each record is a distinct, parseable credits record.
        const shieldAmount = "1000000u64";
        const recordNonces = [
            "3634848344765318974603121890869676775499130077229666060613233255327643175219group",
            "3077450429259593211617823051143573281856129402760267155982965992208217472983group",
            "8327477210335641151082470829879168522735279120730137538049818239556464339772group",
        ];
        const records = recordNonces.map((nonce) =>
            RecordPlaintext.fromString(
                `{ owner: ${addressStr}.private, microcredits: ${shieldAmount}.private, _nonce: ${nonce}.public, _version: 1u8.public }`,
            ),
        );
        expect(records.length).to.equal(3);

        // Auxiliary function to resolve the program given its name: imported programs (e.g. the
        // root ldgbatcher_p28.aleo) live in the imports builder, whereas credits.aleo is built into
        // the process and not registered as an import. This is only used for resolving input types
        // and can be done in different ways (for instance, sample_authorization_extended could
        // return this information directly instead).
        const programForRequest = (programName: string): Program => {
            const source = imports.getProgram(programName);
            if (source != null) {
                return Program.fromString(source);
            }
            if (programName === "credits.aleo") {
                return Program.getCreditsProgram();
            }
            throw new Error(`No program source available for ${programName}`);
        };

        // -----------------------------------------------------------------------------------------
        // Part 1 [Authorizer]: Call sampleAuthorizationExtended to produce the mock authorization
        //                      and auxiliary data

        // Prepare the root-call target and inputs
        const recipientPrivateKey = new PrivateKey();
        const recipientAddress = Address.from_private_key(recipientPrivateKey);
        const transferAmount = "2000000u64";
        const functionName = "transfer_private_3";
        const inputs = [
            records[0].toString(),
            records[1].toString(),
            records[2].toString(),
            recipientAddress.to_string(),
            transferAmount,
        ];

        // ldgbatcher_p28.aleo declares `constructor: assert.eq edition 0u16;`.
        const EDITION = 0;
        
        const extended: any = await (ProgramManagerBase as any).sampleAuthorizationExtended(
            Address.from_string(addressStr),
            LDGBATCHER_P28_PROGRAM,
            functionName,
            inputs,
            undefined,  // legacy imports object
            EDITION,
            imports.clone(),  // clone: the builder is consumed (moved) by value
        );

        // Convert the returned object into the expected shapes
        const authMockAuthorization = extended.authorization;
        
        const authRecordTracking = extended.recordTracking as Array<{
            minterRequestIndex: number;
            outputIndex: number;
            consumers: Array<{ consumerRequestIndex: number; inputIndex: number }>;
        }>;

        const authProgramChecksums = extended.programChecksums as Array<{ requestIndex: number; checksum: string }>;

        // Note that extended.recordNames is not needed in this flow.

        // The authorization should contain exactly four requests:
        // 0. ldgbatcher_p28.aleo/transfer_private_3
        //    1. credits.aleo/join
        //    2. credits.aleo/join
        //    3. credits.aleo/transfer_private
        // This is verified at the end, alongside various other assertions.

        // -----------------------------------------------------------------------------------------
        // Part 2: Populate the requests, updating future tvk-dependent inputs eagerly
        //         Each request requires a round of authorizer-signer communication

        const authSignedRequests = Array.from(authMockAuthorization.requests() as ArrayLike<any>);

        // Mutable per-request inputs. As the signer progressively samples request tvks, if one of
        // them mints a static record which is passed to a subsequent request (possibly after
        // conversion to a external or dynamic record), the authorizer patches the corresponding
        // inputs of the receiving requests with record nonces computed from the actual tvk of the
        // minter.
        const authInputsByRequest: string[][] = authSignedRequests.map((request: any) =>
            Array.from(request.inputs() as ArrayLike<any>).map((v: any) => v.toString()),
        );

        // The root request's tvk (index 0), kept as a string. Every child request needs it to
        // compute its scm. It is set on the first loop iteration and read by every subsequent one.
        // (WASM `Field`s are consumed when passed by value, so we store the string and mint fresh
        // `Field` instances at each use site.)
        let rootTvkStr!: string;

        // This list will accumulate the finalised, correct requests produced by the authorizer
        // after receiving the signatures and other related data.
        const authPopulatedRequests: ExecutionRequest[] = [];

        // Traversal order is fundamental: the order in the requests of the mock authorization
        // guarantees subsequent-request inputs will have the nonces of the relevant inputs
        // populated in time.
        for (const [requestIndex, signedRequest] of authSignedRequests.entries()) {

            // [Authorizer]
            // The authorizer pre-processes inputs, preparing "H" and "tag" in the case of records.
            // Note that, crucially, the tvk-dependent nonces of static, external and dynamic records
            // has been patched correctly by previous iterations of the loop.
            const isRoot = requestIndex === 0;
            const programName: string = signedRequest.program_id();
            const requestFunctionName: string = signedRequest.function_name();

            // Read the (nonce-patched, if relevant) inputs for this request.
            const requestInputs = authInputsByRequest[requestIndex];

            // Resolve the input types from the program's function definition.
            const program = programForRequest(programName);
            const inputDefs = Array.from(program.getFunctionInputs(requestFunctionName)) as any[];
            const inputTypes = inputDefs.map(valueTypeFromInputDef);

            const checksum = authProgramChecksums.find((c) => c.requestIndex === requestIndex)?.checksum ?? null;

            // [Authorizer]
            // Preprocess the inputs. Passing the view key computes "H", "tag", and the record view
            // key for static-record inputs (whose tvk-dependent nonces have already been patched in by
            // previous iterations), along with the signer and sk_tag.
            const authExternalInputs = await computeExternalSigningInputs({
                programName,
                functionName: requestFunctionName,
                inputs: requestInputs,
                inputTypes,
                isRoot,
                checksum,
                viewKey: authViewKeyStr,
            });

            // [Authorizer] sends [Signer] the target program and function

            // [Signer]
            // Produce the signature from the preprocessed inputs: this samples the tvk and r,
            // derives `r * H` and gamma for the record inputs, constructs the message payload and
            // signs it. A fresh private key is used because the WASM consumes (moves) the private
            // key passed by value.
            const signed = fromPreprocessedInputs(
                PrivateKey.from_string(sigPrivateKeyStr),
                programName,
                requestFunctionName,
                authExternalInputs,
            );

            const tvkStr = (signed.tvk as Field).toString();

            if (isRoot) {
                rootTvkStr = tvkStr;
            }

            // [Signer] sends [Authorizer] the tvk, signature and record-input gammas.

            // [Authorizer]
            // Reconstruct the full request from the signed data and the learnt tvk.
            const rebuilt = ExecutionRequest.fromExternallySignedDataWithViewKey(
                programName,
                requestFunctionName,
                requestInputs,
                inputTypes,
                signed.signature,
                Field.fromString(tvkStr),
                Address.from_string(addressStr),
                Field.fromString(authExternalInputs.skTag!),
                ViewKey.from_string(authViewKeyStr),
                signed.gammas,
                Field.fromString(rootTvkStr),
            );

            authPopulatedRequests.push(rebuilt);

            // [Authorizer]
            // Patch the nonces of static/external/dynamic records input to subsequent requests and
            // coming from static records minted by this request. The nonce needs to be recomputed
            // using the actual tvk returned by the signer. The record-tracking information returned
            // by sampleAuthorizationExtended indicates which request inputs must be updated.
            for (const entry of authRecordTracking) {
                if (entry.minterRequestIndex === requestIndex) {
                    const nonce = computeMintedNonce(Field.fromString(tvkStr), entry.outputIndex);
                    for (const consumer of entry.consumers) {
                        applyMintedNonce(authInputsByRequest, consumer.consumerRequestIndex, consumer.inputIndex, nonce);
                    }
                }
            }
        }

        // -----------------------------------------------------------------------------------------
        // Checks
        //  The flow is now complete. We verify each reconstructed request.

        // Every request in the authorization was reconstructed.
        expect(authPopulatedRequests.length).to.equal(authSignedRequests.length);

        // The authorization must contain exactly four requests with the expected program/function
        // targets, in call order.
        const expectedTargets = [
            { programId: "ldgbatcher_p28.aleo", functionName: "transfer_private_3" },
            { programId: "credits.aleo", functionName: "join" },
            { programId: "credits.aleo", functionName: "join" },
            { programId: "credits.aleo", functionName: "transfer_private" },
        ];
        expect(authPopulatedRequests.length).to.equal(expectedTargets.length);
        for (const [requestIndex, rebuilt] of authPopulatedRequests.entries()) {
            expect(rebuilt.program_id()).to.equal(expectedTargets[requestIndex].programId);
            expect(rebuilt.function_name()).to.equal(expectedTargets[requestIndex].functionName);
        }

        // Each reconstructed request must pass verification: this recomputes the input IDs from the
        // inputs and tvk and checks the signature against the signer.
        for (const [requestIndex, rebuilt] of authPopulatedRequests.entries()) {
            const isRoot = requestIndex === 0;
            const program = programForRequest(rebuilt.program_id());
            const inputDefs = Array.from(program.getFunctionInputs(rebuilt.function_name())) as any[];
            const inputTypes = inputDefs.map(valueTypeFromInputDef);
            const checksum = authProgramChecksums.find((c) => c.requestIndex === requestIndex)?.checksum ?? null;

            expect(
                rebuilt.verify(inputTypes, isRoot, checksum != null ? Field.fromString(checksum) : undefined),
            ).to.equal(true);
        }

        // -----------------------------------------------------------------------------------------
        // Build the on-chain Authorization from the reconstructed requests via snarkVM's
        // `authorize_requests`. This re-traverses the call graph of the root function, consuming the
        // supplied requests to populate the authorization, so a successful build already proves the
        // reconstructed requests are mutually consistent (correct input IDs, signatures, tvks, scms).
        //
        // NOTE: `buildAuthorizationFromExecutionRequests` consumes (moves) each ExecutionRequest, so
        // `authPopulatedRequests` must not be used after this call.
        const authorization = await (ProgramManagerBase as any).buildAuthorizationFromExecutionRequests(
            authPopulatedRequests,
            LDGBATCHER_P28_PROGRAM,
            EDITION,
            undefined,  // legacy imports object
            imports.clone(),
        );

        // The authorization has one transition per request, targets the root function, and yields a
        // derivable execution id.
        expect(authorization.len()).to.equal(expectedTargets.length);
        expect(Array.from(authorization.transitions() as ArrayLike<any>).length).to.equal(expectedTargets.length);
        expect(authorization.functionName()).to.equal(functionName);
        expect(authorization.toExecutionId().toString().length).to.be.greaterThan(0);

        // -----------------------------------------------------------------------------------------
        // Prove the authorization and verify the resulting execution proof, fully offline.
        //
        // The three original credits.aleo records are consumed (as serial numbers) by the nested
        // credits.aleo/join and transfer_private calls, so the execution needs an inclusion proof
        // for each of their commitments. Since the SDK test has no ledger, we fabricate a single
        // self-consistent global state root that contains all three commitments and serve the
        // corresponding state paths via an OfflineQuery. The intermediate (joined) records are
        // created and consumed within the same execution, so they use local inclusion and need no
        // state path.
        const recordCommitments = records.map((record) => {
            const recordViewKey = record.recordViewKey(ViewKey.from_string(authViewKeyStr));
            return record.commitment("credits.aleo", "credits", recordViewKey.toString()).toString();
        });

        // V16 is active at u32::MAX on the (non-test) testnet consensus schedule; this matches the
        // height the mock authorization and records were generated for.
        const V16_BLOCK_HEIGHT = 4294967295;
        const offlineQuery = OfflineQuery.sampleStatePaths(V16_BLOCK_HEIGHT, recordCommitments);

        // proveAndVerifyAuthorization consumes (moves) the authorization, so it must come last.
        const proofVerified = await (ProgramManagerBase as any).proveAndVerifyAuthorization(
            authorization,
            LDGBATCHER_P28_PROGRAM,
            QueryOption.offlineQuery(offlineQuery),
            EDITION,
            undefined,  // legacy imports object
            imports.clone(),
        );
        expect(proofVerified).to.equal(true);
    });
});
