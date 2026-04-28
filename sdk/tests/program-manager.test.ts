import {
    Account,
    Address,
    AleoKeyProvider,
    Authorization,
    CREDITS_PROGRAM_KEYS,
    ExecutionRequest,
    ExecutionResponse,
    Field,
    ImportedPrograms,
    ImportedVerifyingKeys,
    OfflineQuery,
    PrivateKey,
    Program,
    Proof,
    ProgramManager,
    ProvingRequest,
    RecordPlaintext,
    Transaction,
    verifyFunctionExecution,
    Value,
    verifyProof,
    verifyBatchProof,
    VerifyingKey,
    ViewKey,
} from "@provablehq/sdk/%%NETWORK%%.js";
import {
    beaconAddressString,
    beaconPrivateKeyString,
    helloProgram,
    recordStatePathv0,
    statePathRecordv0,
    statePathRecordv1,
    statePathv0RecordOwnerPrivateKey,
    stateRootv0,
} from "./data/account-data.js";
import { IMPORT_1, IMPORT_2, MINT_VERIFYING_KEY, PROGRAM, SPEND_VERIFYING_KEY, SPIN_VERIFYING_KEY } from "./data/program.js";
import { RECORD_PLAINTEXT_V1_STRING } from "./data/records";
import { SAMPLE_VERIFYING_KEY, SAMPLE_PROOF, SAMPLE_INPUTS } from "./data/snark-verify.js";
import { expect } from "chai";
import {
    PUZZLE_SPINNER_PROGRAM_ID,
    PUZZLE_SPINNER_V002_INPUT_0,
    PUZZLE_SPINNER_V002_INPUT_1,
    PUZZLE_SPINNER_V002_INPUT_2
} from "./data/proving.js";
import * as process from "node:process";
import { ProvingResponse } from "../src/models/provingResponse.js";
import { encryptProvingRequest } from "../src/browser";
import sodium from "libsodium-wrappers";

describe('Program Manager', async () => {
    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);
    const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider);
    programManager.setAccount(new Account({ privateKey: statePathv0RecordOwnerPrivateKey }));
    const network = programManager.networkClient.network;
    programManager.networkClient.setProverUri("https://accelerate.provable.com");
    describe('Instantiate with AleoNetworkClientOptions', () => {
        it('should have the specified headers when instantiated', async () => {
            const newProgramManager = new ProgramManager("https://api.provable.com/v2", undefined, undefined, { headers: { 'X-Test-Header': 'programManager' } });
            expect(Object.keys(newProgramManager.networkClient.headers).length).equal(1);
            expect(newProgramManager.networkClient.headers['X-Test-Header']).equal('programManager');
            expect(newProgramManager.networkClient.headers['X-Aleo-SDK-Version']).undefined;
        })
    });

    describe('networkClient header methods', () => {
        it('should correctly udpdate the networkClient headers map', async () => {
            programManager.setHeader('X-Added-Header', 'programManager');
            expect(programManager.networkClient.headers['X-Added-Header']).equal('programManager');
        })

        it('should remove header from the networkClient headers map', async () => {
            programManager.removeHeader('X-Added-Header');
            expect(programManager.networkClient.headers['X-Added-Header']).undefined;
        })
    })

    describe('Execute offline', () => {
        it.skip('Program manager should execute offline and verify the resulting proof correctly', async () => {
            const execution_result = <ExecutionResponse>await programManager.run(helloProgram, "hello", ["5u32", "5u32"], true, undefined, undefined, undefined, undefined, undefined, undefined)
            expect(execution_result.getOutputs()[0]).equal("10u32");
            programManager.verifyExecution(execution_result, 10_300_000);
        });
    });

    describe('Verify execution with multiple imports', () => {
        it('Program manager should verify an execution with multiple imports', async () => {
            if (network === "mainnet") {
                // Get the execution, program, and verifying key from the transaction.
                const transaction = <Transaction>await programManager.networkClient.getTransactionObject("at1ve39dz2nlm636ewq6g3wl978kmsfqafcvhaj9px4mk28hk855srq06veqh");
                const execution = transaction.execution();
                const program = Program.fromString(PROGRAM);
                const verifyingKey = VerifyingKey.fromString(SPIN_VERIFYING_KEY);

                // Create the imports and verifying keys for the imported programs.
                const imports = <ImportedPrograms>{
                    "puzzle_arcade_coin_v002.aleo": IMPORT_1,
                    "puzzle_arcade_ticket_v002.aleo": IMPORT_2
                };
                const importedVerifyingKeys = <ImportedVerifyingKeys>{
                    "puzzle_arcade_coin_v002.aleo": [["spend", SPEND_VERIFYING_KEY]],
                    "puzzle_arcade_ticket_v002.aleo": [["mint", MINT_VERIFYING_KEY]]
                };
                if (!execution) {
                    throw new Error("Execution is undefined");
                } else {
                    const verified = verifyFunctionExecution(execution, verifyingKey, program, "spin", imports, importedVerifyingKeys, 6291400);
                    expect(verified).equal(true);
                }
            }
        });
    });

    describe('Offline query', () => {
        it.skip('The offline query should work as expected', async () => {
            const offlineQuery = new OfflineQuery(10_300_000, stateRootv0);
            const record_plaintext = RecordPlaintext.fromString(statePathRecordv0);
            const pk = PrivateKey.from_string("APrivateKey1zkpAZAjaJJvPS7EJ7zvk5fb3QcZDCDxMSHSN5ap7ep4FAD7");
            const vk = ViewKey.from_private_key(pk);
            const record_vk = record_plaintext.recordViewKey(vk);
            const commitment = record_plaintext.commitment("credits.aleo", "credits", record_vk.toString()).toString();
            offlineQuery.addStatePath(commitment, recordStatePathv0);
            const credits = <string>await programManager.networkClient.getProgram("credits.aleo");

            const execution_result = <ExecutionResponse>await programManager.run(credits, "transfer_private", [statePathRecordv0, beaconAddressString, "5u64"], true, undefined, undefined, undefined, undefined, undefined, offlineQuery);
            const verified = programManager.verifyExecution(execution_result, 10_300_000);
            expect(verified).equal(true);
        });
    });

    describe('ProgramManager Executions', () => {
        it.skip('Should create a split transaction without fees', async function() {
            this.retries(3);

            if (network === "testnet") {
                const keyPair = await programManager.keyProvider.splitKeys();
                programManager.keyProvider.cacheKeys("credits.aleo/split", keyPair);
                const pk = PrivateKey.from_string(<string>process.env["PUZZLE_PK"]);

                const tx = <Transaction>await programManager.buildExecutionTransaction({
                    programName: "credits.aleo",
                    functionName: "split",
                    priorityFee: 0.0,
                    privateFee: false,
                    inputs: [statePathRecordv1, "10u64"],
                    keySearchParams: { "cacheKey": CREDITS_PROGRAM_KEYS.split.locator },
                    privateKey: pk
                });

                expect(tx.feeAmount()).equal(BigInt(0));
            }
        });

        it('Should create a split ProvingRequest without fees', async function() {
            this.retries(3);

            if (network === "testnet") {
                const pk = PrivateKey.from_string(<string>process.env["PUZZLE_PK"]);

                const request = <ProvingRequest>await programManager.provingRequest({
                    programName: "credits.aleo",
                    functionName: "split",
                    priorityFee: 0.0,
                    privateFee: false,
                    inputs: [statePathRecordv1, "10u64"],
                    broadcast: false,
                    privateKey: pk
                });

                expect(request.feeAuthorization()).equal(undefined);
            }
        });

        it('Should execute an encrypted proving request', async function() {
            this.retries(3);

            if (network === "testnet") {
                const pk = PrivateKey.from_string(
                    <string>process.env["PUZZLE_PK"],
                );

                const provingRequest = <ProvingRequest>(
                    await programManager.provingRequest({
                        programName: "hello_hello.aleo",
                        functionName: "hello",
                        priorityFee: 0.0,
                        privateFee: false,
                        inputs: ["1u32", "1u32"],
                        broadcast: false,
                        privateKey: pk,
                    })
                );

                // Ensure an encryption roundtrip works locally.
                await sodium.ready;
                const keyPair = sodium.crypto_box_keypair();
                const ciphertext = await encryptProvingRequest(
                    sodium.to_base64(
                        keyPair.publicKey,
                        sodium.base64_variants.ORIGINAL,
                    ),
                    provingRequest,
                );
                const plaintextBytes = sodium.crypto_box_seal_open(
                    sodium.from_base64(
                        ciphertext,
                        sodium.base64_variants.ORIGINAL,
                    ),
                    keyPair.publicKey,
                    keyPair.privateKey,
                );
                const deserializedProvingRequest =
                    ProvingRequest.fromBytesLe(plaintextBytes);
                expect(deserializedProvingRequest.broadcast).equals(
                    provingRequest.broadcast,
                );

                // Submit the proving request using the safe method.
                const safeResult =
                    await programManager.networkClient.submitProvingRequestSafe(
                        {
                            provingRequest,
                            dpsPrivacy: true,
                        },
                    );

                if (!safeResult.ok) {
                    console.log(safeResult);
                }
                expect(safeResult.ok).to.equal(true);
                if (safeResult.ok) {
                    expect(safeResult.data).to.have.property("transaction");
                    expect(safeResult.data.transaction).to.have.property("id");
                    expect(safeResult.data).to.have.property("broadcast_result");
                    expect(safeResult.data.broadcast_result.status).to.equal(
                        "Skipped",
                    );
                }

                // Submit the proving request using the regular method.
                const result =
                    await programManager.networkClient.submitProvingRequest(
                        {
                            provingRequest,
                            dpsPrivacy: true,
                        },
                    );

                expect(result).to.have.property("transaction");
                expect(result).to.have.property("broadcast_result");
                expect(result.broadcast_result.status).to.equal("Skipped");
            }
        });
    });

    describe('Proving Requests and Authorizations', () => {
        it('Should build correct authorizations from Proving Request', async () => {
            // Build a proving request for the "spin" function of "puzzle_spinner_v002.aleo".
            const provingRequest = await programManager.provingRequest({
                programName: PUZZLE_SPINNER_PROGRAM_ID,
                functionName: "spin",
                priorityFee: 0,
                privateFee: false,
                inputs: [
                    PUZZLE_SPINNER_V002_INPUT_0,
                    PUZZLE_SPINNER_V002_INPUT_1,
                    PUZZLE_SPINNER_V002_INPUT_2,
                ],
                broadcast: false,
                privateKey: PrivateKey.from_string(<string>process.env["PUZZLE_PK"])
            });

            // Ensure serialization methods lead to the expected.
            const provingRequestFromString = ProvingRequest.fromString(provingRequest.toString());
            const provingRequestFromBytes = ProvingRequest.fromBytesLe(provingRequest.toBytesLe());

            // Ensure all authorizations are equal.
            expect(provingRequestFromString.equals(provingRequestFromBytes));
            expect(provingRequestFromString.equals(provingRequest));

            // Ensure the broadcast flag is set to false.
            expect(provingRequest.broadcast()).equal(false);

            // Get the authorizations.
            const authorization = provingRequest.authorization();
            const feeAuthorization = <Authorization>provingRequest.feeAuthorization();

            // Ensure the authorizations have the correct number of transitions.
            expect(authorization.transitions().length).equal(3);
            expect(feeAuthorization.transitions().length).equal(1);
        });

        it('Should build proving request without fee authorization when useFeeMaster is set', async () => {
            const provingRequest = await programManager.provingRequest({
                programName: PUZZLE_SPINNER_PROGRAM_ID,
                functionName: "spin",
                priorityFee: 0,
                privateFee: false,
                inputs: [
                    PUZZLE_SPINNER_V002_INPUT_0,
                    PUZZLE_SPINNER_V002_INPUT_1,
                    PUZZLE_SPINNER_V002_INPUT_2,
                ],
                broadcast: false,
                useFeeMaster: true,
                privateKey: PrivateKey.from_string(<string>process.env["PUZZLE_PK"])
            });

            expect(provingRequest.feeAuthorization()).equal(undefined);

            const authorization = provingRequest.authorization();
            expect(authorization.transitions().length).equal(3);
        });

        it('Should build proving request from ExecutionRequest', async () => {
            const privateKey = PrivateKey.from_string(
                "APrivateKey1zkp7Vc4xJt8HqW9U7VhY6h32d8Z9Xi5C6ZZX3gtXxbBSJmj"
            );
            const inputs = [
                "aleo1wp5f52cujua034ts029lq96ke2p505sqc0yrt7yx7x0fcel82yxqe867q9",
                "500u64",
            ];
            const inputTypes = ["address.public", "u64.public"];
            const executionRequest = ExecutionRequest.sign(
                privateKey,
                "credits.aleo",
                "transfer_public",
                inputs,
                inputTypes,
                undefined,
                undefined,
                true,
                false,
            );
            
            // Ensure the execution request is valid.
            const provingRequest = await programManager.provingRequest({
                programName: "credits.aleo",
                functionName: "transfer_public",
                priorityFee: 0,
                privateFee: false,
                broadcast: false,
                executionRequest,
            });

            const authorization = provingRequest.authorization();
            expect(authorization.len()).equal(1);
            expect(authorization.transitions().length).equal(1);
            expect(provingRequest.feeAuthorization()).equal(undefined);
        });

        it('Should build correct authorizations', async () => {
            // Build an authorization for the spin function of "puzzle_spinner_v002.aleo".
            const authorization = await programManager.buildAuthorization({
                programName: PUZZLE_SPINNER_PROGRAM_ID,
                functionName: "spin",
                inputs: [
                    PUZZLE_SPINNER_V002_INPUT_0,
                    PUZZLE_SPINNER_V002_INPUT_1,
                    PUZZLE_SPINNER_V002_INPUT_2,
                ],
                privateKey: PrivateKey.from_string(<string>process.env["PUZZLE_PK"])
            });

            // Ensure serialization methods lead to the expected.
            const authorizationFromString = Authorization.fromString(authorization.toString());
            const authorizationFromBytes = Authorization.fromBytesLe(authorization.toBytesLe());

            // Ensure all authorizations are equal.
            expect(authorizationFromString.equals(authorizationFromBytes));
            expect(authorizationFromString.equals(authorization));

            const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization({
                authorization,
                programName: PUZZLE_SPINNER_PROGRAM_ID,
            });
            const baseFeeCredits = Number(baseFeeMicrocredits) / 1000000;

            // Get execution ID from previous authorization.
            const executionId = authorization.toExecutionId().toString();
            const feeAuthorization = await programManager.buildFeeAuthorization({
                deploymentOrExecutionId: executionId,
                baseFeeCredits,
            });

            // Ensure the authorizations have the correct number of transitions.
            expect(authorization.transitions().length).equal(3);
            expect(feeAuthorization.transitions().length).equal(1);
        });

        it('Should build correct authorizations when using the unchecked version', async () => {
            // Build an authorization for the spin function of "puzzle_spinner_v002.aleo".
            if (network === "mainnet") {
                const authorization = await programManager.buildAuthorizationUnchecked({
                    programName: PUZZLE_SPINNER_PROGRAM_ID,
                    functionName: "spin",
                    inputs: [
                        PUZZLE_SPINNER_V002_INPUT_0,
                        PUZZLE_SPINNER_V002_INPUT_1,
                        PUZZLE_SPINNER_V002_INPUT_2,
                    ],
                    privateKey: PrivateKey.from_string(<string>process.env["PUZZLE_PK"])
                });

                // Ensure serialization methods lead to the expected.
                const authorizationFromString = Authorization.fromString(authorization.toString());
                const authorizationFromBytes = Authorization.fromBytesLe(authorization.toBytesLe());

                // Ensure all authorizations are equal.
                expect(authorizationFromString.equals(authorizationFromBytes));
                expect(authorizationFromString.equals(authorization));

                const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization({
                    authorization,
                    programName: PUZZLE_SPINNER_PROGRAM_ID,
                });
                const baseFeeCredits = Number(baseFeeMicrocredits) / 1000000;

                // Get execution ID from previous authorization.
                const executionId = authorization.toExecutionId().toString();
                const feeAuthorization = await programManager.buildFeeAuthorization({
                    deploymentOrExecutionId: executionId,
                    baseFeeCredits,
                });

                // Ensure the authorizations have the correct number of transitions.
                expect(authorization.transitions().length).equal(3);
                expect(feeAuthorization.transitions().length).equal(1);
            }

        });

        it('Should estimate the fee correctly for credits.aleo functions', async () => {
            const transferFeeMicrocredits = await programManager.estimateExecutionFee({
                programName: "credits.aleo",
                functionName: "transfer_public"
            });

            const bondFeeMicrocredits = await programManager.estimateExecutionFee({
                programName: "credits.aleo",
                functionName: "transfer_public_to_private"
            });
            expect(transferFeeMicrocredits).equal(BigInt(2725));
            expect(bondFeeMicrocredits).equal(BigInt(2304));

        });
    });

    describe('Program Manager record retrieval', () => {
        it('Should return records without searching for them if records are passed', async () => {
            const retrievedRecord1 = await programManager.getCreditsRecord(
                50000,
                [],
                RECORD_PLAINTEXT_V1_STRING,
            );
            expect(RECORD_PLAINTEXT_V1_STRING).equal(retrievedRecord1.toString())

            const retrievedRecord2 = await programManager.getCreditsRecord(
                50000,
                [],
                RecordPlaintext.fromString(RECORD_PLAINTEXT_V1_STRING)
            );
            expect(RECORD_PLAINTEXT_V1_STRING).equal(retrievedRecord2.toString());
        });

        it('Should search for a record if none is specified', async () => {
            try {
                await programManager.getCreditsRecord(
                    50000,
                    [],
                );
            } catch (e) {
                expect(`${e}`).contain("findCreditsRecord");
            }
        });
    });

    describe('SNARK Verification', () => {
        it('Proof should round-trip via string', () => {
            const proof = Proof.fromString(SAMPLE_PROOF);
            expect(proof.toString()).to.equal(SAMPLE_PROOF);
        });

        it('Proof should round-trip via bytes', () => {
            const proof = Proof.fromString(SAMPLE_PROOF);
            const bytes = proof.toBytes();
            const recovered = Proof.fromBytes(bytes);
            expect(recovered.toString()).to.equal(SAMPLE_PROOF);
        });

        it('VerifyingKey.verify should return true for a valid proof', () => {
            const vk = VerifyingKey.fromString(SAMPLE_VERIFYING_KEY);
            const proof = Proof.fromString(SAMPLE_PROOF);
            const result = vk.verify(SAMPLE_INPUTS, proof);
            expect(result).to.equal(true);
        });

        it('VerifyingKey.verify should return false for wrong inputs', () => {
            const vk = VerifyingKey.fromString(SAMPLE_VERIFYING_KEY);
            const proof = Proof.fromString(SAMPLE_PROOF);
            const result = vk.verify(["1field", "2field"], proof);
            expect(result).to.equal(false);
        });

        it('VerifyingKey.verifyBatch should return true for a valid proof', () => {
            const proof = Proof.fromString(SAMPLE_PROOF);
            const result = VerifyingKey.verifyBatch(
                [SAMPLE_VERIFYING_KEY],
                [[SAMPLE_INPUTS]],
                proof,
            );
            expect(result).to.equal(true);
        });

        it('VerifyingKey.verifyBatch should throw when verifying keys and inputs length mismatch', () => {
            const proof = Proof.fromString(SAMPLE_PROOF);
            expect(() => VerifyingKey.verifyBatch(["vk1", "vk2"], [[SAMPLE_INPUTS]], proof)).to.throw();
        });

        it('VerifyingKey.verifyBatch should return false for wrong inputs', () => {
            const proof = Proof.fromString(SAMPLE_PROOF);
            const result = VerifyingKey.verifyBatch(
                [SAMPLE_VERIFYING_KEY],
                [[["1field", "2field"]]],
                proof,
            );
            expect(result).to.equal(false);
        });
    });

    describe('Standalone SNARK Verification', () => {
        it('verifyProof should accept raw field inputs', () => {
            expect(verifyProof({ verifyingKey: SAMPLE_VERIFYING_KEY, inputs: SAMPLE_INPUTS, proof: SAMPLE_PROOF })).to.equal(true);
        });

        it('verifyProof should convert Aleo types to fields', () => {
            // The sample circuit expects [1field, 1field]. Passing "1field" as a field literal
            // and verifying it still works through the conversion path.
            expect(verifyProof({ verifyingKey: SAMPLE_VERIFYING_KEY, inputs: ["1field", "1field"], proof: SAMPLE_PROOF })).to.equal(true);
        });

        it('Value.toFields should convert Aleo types to field elements', () => {
            // Verify the conversion pipeline works for various Aleo types.
            const u32Fields = Value.fromString("1u32").toFields();
            expect(u32Fields.length).to.be.greaterThan(0);
            for (const f of u32Fields) {
                expect(f.toString()).to.match(/field$/);
            }

            const boolFields = Value.fromString("true").toFields();
            expect(boolFields.length).to.be.greaterThan(0);

            const structFields = Value.fromString("{ x: 1u8, y: 2u8 }").toFields();
            expect(structFields.length).to.be.greaterThan(0);
        });

        it('verifyProof should return false when converted inputs do not match the proof', () => {
            // 5u32 is a valid Aleo type but produces different field elements than the proof expects.
            expect(verifyProof({ verifyingKey: SAMPLE_VERIFYING_KEY, inputs: ["5u32", "5u32"], proof: SAMPLE_PROOF })).to.equal(false);
        });

        it('verifyBatchProof should return true for valid inputs', () => {
            expect(verifyBatchProof({
                verifyingKeys: [SAMPLE_VERIFYING_KEY],
                inputs: [[SAMPLE_INPUTS]],
                proof: SAMPLE_PROOF,
            })).to.equal(true);
        });

        it('verifyBatchProof should return false for wrong inputs', () => {
            expect(verifyBatchProof({
                verifyingKeys: [SAMPLE_VERIFYING_KEY],
                inputs: [[["1field", "2field"]]],
                proof: SAMPLE_PROOF,
            })).to.equal(false);
        });
    });

    describe('Program.toChecksum', () => {
        it('should return an array of exactly 32 elements', () => {
            const program = Program.fromString(PROGRAM);
            const checksum = program.toChecksum();
            expect(checksum).to.be.an('array');
            expect(checksum.length).to.equal(32);
        });

        it('should equal the expected keccak256 hash of the program string', () => {
            const program = Program.fromString(IMPORT_1);
            const checksum = program.toChecksum();
            // keccak256 of Program.fromString(IMPORT_1).toString() as UTF-8 bytes
            const expected: number[] = [/* TODO: fill in after running */];
            expect(checksum).to.deep.equal(expected);
        });
    });
});
