import { expect } from "chai";
import {
    beaconAddressString,
    helloProgram,
    recordStatePath,
    statePathRecord,
    statePathRecordOwnerPrivateKey,
    stateRoot
} from "./data/account-data";
import { Account, ExecutionResponse, OfflineQuery, ProgramManager, RecordPlaintext } from "../src/node";

describe('Program Manager', () => {
    const programManager = new ProgramManager("https://api.explorer.provable.com/v1", undefined, undefined);
    programManager.setAccount(new Account({privateKey: statePathRecordOwnerPrivateKey}));

    describe('Execute offline', () => {
        it.skip('Program manager should execute offline and verify the resulting proof correctly', async () => {
            const execution_result = <ExecutionResponse>await programManager.run(helloProgram, "hello", ["5u32", "5u32"], true, undefined, undefined, undefined, undefined, undefined, undefined)
            expect(execution_result.getOutputs()[0]).equal("10u32");
            programManager.verifyExecution(execution_result);
        });
    });

    describe('Offline query', () => {
        it.skip('The offline query should work as expected', async () => {
            const offlineQuery = new OfflineQuery(stateRoot);
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
