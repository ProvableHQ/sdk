import { expect } from "chai";
import {
    Address,
    ExecutionRequest,
    Field,
    Group,
    Plaintext,
    PrivateKey,
    RecordPlaintext,
    Signature,
    ViewKey,
    computeExternalSigningInputs,
    toField,
    toGroup,
    toViewKey,
    toSignature,
    toAddress,
    buildRequestFromExternallySignedData,
    buildRequestFromExternallySignedDataWithViewKey,
    buildRequestFromExternallySignedDataWithInputIds,
} from "../src/node.js";
import {
    privateKeyString,
    viewKeyString,
    addressString,
    beaconPrivateKeyString,
} from "./data/account-data.js";

const message = Uint8Array.from([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]);

describe('MPC Utilities', () => {
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

    describe('buildRequestFromExternallySignedData', () => {
        it('builds a request with public inputs using string parameters', () => {
            const tvk = Field.fromString("1field");
            const skTag = Field.fromString("1field");
            const sigString = signature.to_string();
            const tvkString = tvk.toString();
            const skTagString = skTag.toString();

            try {
                const result = buildRequestFromExternallySignedData(
                    "credits.aleo",
                    "transfer_public",
                    [addressString, "100u64"],
                    ["address.public", "u64.public"],
                    sigString,
                    tvkString,
                    addressString,
                    skTagString,
                );
                expect(result).instanceof(ExecutionRequest);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts Uint8Array parameters for signature, tvk, address, sk_tag', () => {
            const tvk = Field.fromString("1field");
            const skTag = Field.fromString("1field");

            try {
                const result = buildRequestFromExternallySignedData(
                    "credits.aleo",
                    "transfer_public",
                    [addressString, "100u64"],
                    ["address.public", "u64.public"],
                    signature.toBytesLe(),
                    tvk.toBytesLe(),
                    address.toBytesLe(),
                    skTag.toBytesLe(),
                );
                expect(result).instanceof(ExecutionRequest);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts WASM object parameters directly', () => {
            const tvk = Field.fromString("1field");
            const skTag = Field.fromString("1field");

            try {
                const result = buildRequestFromExternallySignedData(
                    "credits.aleo",
                    "transfer_public",
                    [addressString, "100u64"],
                    ["address.public", "u64.public"],
                    signature,
                    tvk,
                    address,
                    skTag,
                );
                expect(result).instanceof(ExecutionRequest);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });
    });

    describe('buildRequestFromExternallySignedDataWithViewKey', () => {
        it('accepts a view key as string', () => {
            const tvk = Field.fromString("1field");
            const skTag = Field.fromString("1field");

            try {
                buildRequestFromExternallySignedDataWithViewKey(
                    "credits.aleo",
                    "transfer_public",
                    [addressString, "100u64"],
                    ["address.public", "u64.public"],
                    signature,
                    tvk,
                    address,
                    skTag,
                    viewKeyString,
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts a view key as Uint8Array', () => {
            const tvk = Field.fromString("1field");
            const skTag = Field.fromString("1field");

            try {
                buildRequestFromExternallySignedDataWithViewKey(
                    "credits.aleo",
                    "transfer_public",
                    [addressString, "100u64"],
                    ["address.public", "u64.public"],
                    signature,
                    tvk,
                    address,
                    skTag,
                    viewKey.toBytesLe(),
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });
    });

    describe('buildRequestFromExternallySignedDataWithInputIds', () => {
        it('accepts Field input IDs (public inputs)', () => {
            const tvk = Field.fromString("1field");
            const skTag = Field.fromString("1field");
            const inputId = Field.fromString("1field");

            try {
                buildRequestFromExternallySignedDataWithInputIds(
                    "credits.aleo",
                    "transfer_public",
                    [addressString, "100u64"],
                    ["address.public", "u64.public"],
                    signature,
                    tvk,
                    address,
                    skTag,
                    [inputId, inputId],
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts tuple input IDs (record inputs)', () => {
            const tvk = Field.fromString("1field");
            const skTag = Field.fromString("1field");
            const f = Field.fromString("1field");
            const g = Group.fromString("2group");
            const recordInputId: [Field, Group, Field, Field, Field] = [f, g, f, f, f];

            try {
                buildRequestFromExternallySignedDataWithInputIds(
                    "credits.aleo",
                    "transfer_public",
                    [addressString],
                    ["address.public"],
                    signature,
                    tvk,
                    address,
                    skTag,
                    [recordInputId],
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts string input IDs', () => {
            const tvk = Field.fromString("1field");
            const skTag = Field.fromString("1field");

            try {
                buildRequestFromExternallySignedDataWithInputIds(
                    "credits.aleo",
                    "transfer_public",
                    [addressString, "100u64"],
                    ["address.public", "u64.public"],
                    signature,
                    tvk,
                    address,
                    skTag,
                    ["1field", "1field"],
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts Uint8Array input IDs', () => {
            const tvk = Field.fromString("1field");
            const skTag = Field.fromString("1field");
            const fieldBytes = Field.fromString("1field").toBytesLe();

            try {
                buildRequestFromExternallySignedDataWithInputIds(
                    "credits.aleo",
                    "transfer_public",
                    [addressString, "100u64"],
                    ["address.public", "u64.public"],
                    signature,
                    tvk,
                    address,
                    skTag,
                    [fieldBytes, fieldBytes],
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });

        it('accepts tuple input IDs with string/Uint8Array elements', () => {
            const tvk = Field.fromString("1field");
            const skTag = Field.fromString("1field");
            const groupBytes = Group.fromString("2group").toBytesLe();
            const fieldBytes = Field.fromString("1field").toBytesLe();
            const recordInputId: [string, Uint8Array, string, Uint8Array, string] = [
                "1field", groupBytes, "1field", fieldBytes, "1field"
            ];

            try {
                buildRequestFromExternallySignedDataWithInputIds(
                    "credits.aleo",
                    "transfer_public",
                    [addressString],
                    ["address.public"],
                    signature,
                    tvk,
                    address,
                    skTag,
                    [recordInputId],
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                expect(msg).to.not.include("is not a string");
                expect(msg).to.not.include("is not a Uint8Array");
            }
        });
    });

    describe('computeExternalSigningInputs', () => {
        it('computes external signing inputs for a public transfer', async () => {
            const result = await computeExternalSigningInputs({
                programName: "credits.aleo",
                functionName: "transfer_public",
                inputs: [addressString, "100u64"],
                inputTypes: ["address.public", "u64.public"],
                isRoot: true,
            });

            expect(result).to.have.property('functionId');
            expect(result).to.have.property('isRoot');
            expect(result).to.have.property('requestInputs');
            expect(result.requestInputs).to.be.an('array');
            expect(result.requestInputs.length).to.equal(2);
        });
    });
});

describe('MPC ExecutionRequest integration', () => {
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
        expect(externalSigningInputs.isRoot).to.equal("1field");
        expect(externalSigningInputs.checksum).to.satisfy((v: unknown) => v === null || v === undefined);
        expect(externalSigningInputs.requestInputs).to.be.an("array").with.lengthOf(2);

        const [firstInput, secondInput] = externalSigningInputs.requestInputs;
        expect(firstInput).to.have.property("outputType", "public");
        expect(firstInput).to.have.property("index", "0field");
        expect(firstInput).to.have.property("data").that.is.an("array");
        expect(firstInput.data.length).to.be.greaterThan(0);
        expect(secondInput).to.have.property("outputType", "public");
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

        // Build the same request via fromExternallySignedDataWithViewKey using view_key to compute input_ids.
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

        // Build the same request via fromExternallySignedDataWithInputIds using pre-computed input_ids.
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

    it('Should match ExecutionRequest.sign for transfer_private', async () => {
        // Use beacon private key - record is owned by beacon address
        const privateKey = PrivateKey.from_string(beaconPrivateKeyString);
        const beaconRecord = RecordPlaintext.fromString(recordBeaconOwned);
        const gamma = beaconRecord.gamma("credits.aleo", "credits", privateKey);
        const beaconViewKey = ViewKey.from_private_key(PrivateKey.from_string(beaconPrivateKeyString));
        const externalSigningInputs = await computeExternalSigningInputs({
            programName: "credits.aleo",
            functionName: "transfer_private",
            inputs: transferPrivateInputs,
            inputTypes: transferPrivateInputTypes,
            isRoot: true,
            checksum: null,
            viewKey: beaconViewKey,
        });
        expect(externalSigningInputs.signer).to.be.ok;
        expect(externalSigningInputs.skTag).to.be.ok;
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
        expect(signedRequest.program_id()).to.equal("credits.aleo");
        expect(signedRequest.function_name()).to.equal("transfer_private");
        expect(signedRequest.inputs().length).to.equal(3);
        expect(externalSigningInputs.requestInputs.length).to.equal(signedRequest.inputs().length);

        const sig = signedRequest.signature();
        const tvk = signedRequest.tvk();
        // Use pre-computed input_ids via fromExternallySignedDataWithInputIds
        const externallySignedRequest = ExecutionRequest.fromExternallySignedDataWithInputIds(
            "credits.aleo",
            "transfer_private",
            transferPrivateInputs,
            transferPrivateInputTypes,
            sig,
            tvk,
            signedRequest.signer(),
            signedRequest.sk_tag(),
            signedRequest.input_ids(),
        );
        expect(externallySignedRequest.program_id()).to.equal(signedRequest.program_id());
        expect(externallySignedRequest.function_name()).to.equal(signedRequest.function_name());
        expect(externallySignedRequest.inputs().length).to.equal(signedRequest.inputs().length);
        expect(externallySignedRequest.input_ids().length).to.equal(signedRequest.input_ids().length);
        expect(externallySignedRequest.toString()).to.equal(signedRequest.toString());
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
        expect(externalSigningInputs.isRoot).to.equal("1field");
        expect(externalSigningInputs.checksum).to.satisfy((v: unknown) => v === null || v === undefined);
        expect(externalSigningInputs.requestInputs).to.be.an("array").with.lengthOf(3);

        const [firstInput, secondInput, thirdInput] = externalSigningInputs.requestInputs;
        expect(firstInput).to.have.property("outputType", "record");
        expect(firstInput).to.have.property("index", "0field");
        expect(firstInput).to.have.property("data").that.is.an("array");
        expect(firstInput.data.length).to.be.greaterThan(0);
        expect(secondInput).to.have.property("outputType", "private");
        expect(secondInput).to.have.property("index", "1field");
        expect(secondInput).to.have.property("data").that.is.an("array");
        expect(thirdInput).to.have.property("outputType", "private");
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
});
