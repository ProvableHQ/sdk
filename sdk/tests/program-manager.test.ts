import {
    Account,
    Authorization,
    ExecutionResponse,
    ImportedPrograms,
    ImportedVerifyingKeys,
    OfflineQuery,
    PrivateKey,
    Program,
    ProgramManager,
    ProvingRequest,
    RecordPlaintext,
    Transaction,
    verifyFunctionExecution,
    VerifyingKey
} from "@provablehq/sdk/%%NETWORK%%.js";
import {
    beaconAddressString,
    helloProgram,
    recordStatePath,
    statePathRecord,
    statePathRecordOwnerPrivateKey,
    stateRoot
} from "./data/account-data";
import {
    IMPORT_1,
    IMPORT_2,
    MINT_VERIFYING_KEY,
    PROGRAM,
    SPEND_VERIFYING_KEY,
    SPIN_VERIFYING_KEY
} from "./data/program";
import { expect } from "chai";
import {
    PUZZLE_SPINNER_PROGRAM_ID,
    PUZZLE_SPINNER_V002_INPUT_0,
    PUZZLE_SPINNER_V002_INPUT_1,
    PUZZLE_SPINNER_V002_INPUT_2
} from "./data/proving";
import * as process from "node:process";

describe('Program Manager', () => {
    const programManager = new ProgramManager("https://api.explorer.provable.com/v1");
    programManager.setAccount(new Account({privateKey: statePathRecordOwnerPrivateKey}));
    const network = programManager.networkClient.network;

    describe('Instantiate with AleoNetworkClientOptions', () => {
        it('should have the specified headers when instantiated', async () => {
            const newProgramManager = new ProgramManager("https://api.explorer.provable.com/v1", undefined, undefined, { headers: {'X-Test-Header': 'programManager'} });
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
            programManager.verifyExecution(execution_result);
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
                    const verified = verifyFunctionExecution(execution, verifyingKey, program, "spin", imports, importedVerifyingKeys);
                    expect(verified).equal(true);
                }
            }
        });
    });

    describe('Offline query', () => {
        it.skip('The offline query should work as expected', async () => {
            const offlineQuery = new OfflineQuery(1, stateRoot);
            const record_plaintext = RecordPlaintext.fromString(statePathRecord);
            const commitment = record_plaintext.commitment("credits.aleo", "credits").toString();
            offlineQuery.addStatePath(commitment, recordStatePath);
            const credits = <string>await programManager.networkClient.getProgram("credits.aleo");

            const execution_result = <ExecutionResponse>await programManager.run(credits, "transfer_private", [statePathRecord, beaconAddressString, "5u64"], true, undefined, undefined, undefined, undefined, undefined, offlineQuery);
            const verified = programManager.verifyExecution(execution_result);
            expect(verified).equal(true);
        });
    });

    describe('Proving Requests', () => {
        it('Should build correct authorizations', async () => {
            const provingRequest = await programManager.provingRequest({
                programName: PUZZLE_SPINNER_PROGRAM_ID,
                functionName: "spin",
                baseFee: 1000000,
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
            const fee_authorization = <Authorization>provingRequest.feeAuthorization();

            // Ensure the authorizations have the correct number of transitions.
            expect(authorization.transitions().length).equal(3);
            expect(fee_authorization.transitions().length).equal(1);
        });
    });
});
