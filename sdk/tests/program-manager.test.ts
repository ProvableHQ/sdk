import {jest} from '@jest/globals'
import {beaconPrivateKeyString, helloProgram} from "./data/account-data";
import { Account, ExecutionResponse, ProgramManager } from "../src/node";
jest.retryTimes(3);

describe('Program Manager', () => {
    const programManager = new ProgramManager("https://api.explorer.aleo.org/v1", undefined, undefined);
    programManager.setAccount(new Account());

    describe('Execute offline', () => {
        it('Program manager should execute offline and verify the resulting proof correctly', async () => {
            const execution_result = <ExecutionResponse>await programManager.executeOffline(helloProgram, "hello", ["5u32", "5u32"], true, undefined, undefined, undefined, undefined, undefined)
            expect(execution_result.getOutputs()[0]).toEqual("10u32");
            programManager.verifyExecution(execution_result);
        }, 420000);
    });
});