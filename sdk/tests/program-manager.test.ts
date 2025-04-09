import { expect } from "chai";
import {
    beaconAddressString,
    helloProgram,
    recordStatePath,
    statePathRecord,
    statePathRecordOwnerPrivateKey,
    stateRoot
} from "./data/account-data";
import { EXECUTION, IMPORT_1, IMPORT_2, MINT_VERIFYING_KEY, PROGRAM, SPEND_VERIFYING_KEY, SPIN_VERIFYING_KEY } from "./data/program";
import {
    Account,
    ExecutionResponse,
    ImportedPrograms, ImportedVerifyingKeys,
    OfflineQuery,
    ProgramManager,
    RecordPlaintext
} from "../src/node";
import { verifyFunctionExecution, Execution, VerifyingKey } from "@provablehq/wasm";

describe('Program Manager', () => {
    const programManager = new ProgramManager("https://api.explorer.provable.com/v1");
    programManager.setAccount(new Account({privateKey: statePathRecordOwnerPrivateKey}));

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
        it.skip('Program manager should execute offline and verify the resulting proof correctly', async () => {
            const execution = Execution.fromString(EXECUTION);
            const verifyingKey = VerifyingKey.fromString(SPIN_VERIFYING_KEY);

            const imports = <ImportedPrograms>{ "puzzle_arcade_coin_v002.aleo" : IMPORT_1, "puzzle_arcade_ticket_v002.aleo": IMPORT_2 };
            const importedVerifyingKeys = <ImportedVerifyingKeys>{ "puzzle_arcade_coin_v002.aleo" : [["spend", SPEND_VERIFYING_KEY]], "puzzle_arcade_ticket_v002.aleo" : [["mint", MINT_VERIFYING_KEY]] };
            expect(verifyFunctionExecution(execution, verifyingKey, PROGRAM, "spin", imports, importedVerifyingKeys)).equal(true);
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

    describe('Staking - Bond Public', () => {
        it.skip('Should execute bondPublic', async () => {
            // TODO
        });
    });
});
