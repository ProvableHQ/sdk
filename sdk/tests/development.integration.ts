import { AleoNetworkClient, DevelopmentClient } from '../src';
import {
    fundedAddressString,
    fundedPrivateKeyString,
    helloProgram,
    helloProgramId,
    helloProgramMainFunction
} from './data/account-data';
import { log } from 'console';

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('DevelopmentServer', () => {
    let devClient: DevelopmentClient;
    let localApiClient: AleoNetworkClient;
    let privateDevClient: DevelopmentClient;

    beforeEach(() => {
        devClient = new DevelopmentClient("http://0.0.0.0:4040");
        localApiClient = new AleoNetworkClient("http://0.0.0.0:3030");
        privateDevClient = new DevelopmentClient("http://0.0.0.0:5050");
    });

    describe('Deploy & Execute', () => {
        it("can make value transfers with the aleo development server", async () => {
            let transaction_id = "";
            for (let i = 0; i < 4; i++) {
                try {
                    log("Attempting to make a value transfer");
                    transaction_id = await devClient.transfer(1000, 1, fundedAddressString, "private", fundedPrivateKeyString);
                    break;
                } catch (e) {
                    log("Transaction failed, retrying in 5 seconds");
                    await wait(5000);
                }
            }

            // If the transaction failed above, try one more time
            if (transaction_id === "") {
                transaction_id = await devClient.transfer(1000, 1, fundedAddressString, fundedPrivateKeyString);
            }
            expect(transaction_id).toBeTruthy();
        }, 120000);

        it('can run deploy and execute on the aleo development server', async () => {
            let deploy_transaction_id = "";
            for (let i = 0; i < 4; i++) {
                try {
                    log("Attempting to deploy " + helloProgram);
                    deploy_transaction_id = await devClient.deployProgram(helloProgram, 8, fundedPrivateKeyString);
                    log("Deploy transaction id: " + deploy_transaction_id);
                    await wait(45000);
                    const program = await localApiClient.getProgram(helloProgramId);
                    log("Program: " + program);
                    expect(program).toBeTruthy();
                    break;
                }
                catch (e) {
                    log("Deployment failed, retrying in 5 seconds");
                    await wait(5000);
                }
            }
            // If the transaction failed above, try one more time
            if (deploy_transaction_id === "") {
                log("Attempting to deploy " + helloProgramId + " one final time")
                await devClient.deployProgram(helloProgram, 8, fundedPrivateKeyString);
                await wait(30000);
                const program = await localApiClient.getProgram(helloProgramId);
                log("Program: " + program);
                expect(program).toBeTruthy();
            }
            await wait(30000);

            let execute_transaction_id = "";
            for (let i = 0; i < 3; i++) {
                try {
                    log("Attempting to execute " + helloProgramId + " - " + helloProgramMainFunction + "..");
                    execute_transaction_id = await devClient.executeProgram(helloProgramId, helloProgramMainFunction, 5, ["5u32", "5u32"], fundedPrivateKeyString);
                    log("Execute transaction id: " + execute_transaction_id);
                    expect(execute_transaction_id).toBeTruthy();
                    break;
                } catch (e) {
                    log("Execution failed, retrying in 5 seconds");
                    await wait(5000);
                }
            }

            // If the transaction failed above, try one more time
            if (execute_transaction_id === "") {
                log("Attempting to execute " + helloProgramId + " - " + helloProgramMainFunction +" one final time..");
                execute_transaction_id = await devClient.executeProgram(helloProgramId, helloProgramMainFunction, 5, ["5u32", "5u32"], fundedPrivateKeyString);
                expect(execute_transaction_id).toBeTruthy();
            }
        }, 300000);

        it('can execute a program using a server started with a private key ciphertext', async () => {
            let transaction_id = "";
            for (let i = 0; i < 3; i++) {
                try {
                    log("Attempting to execute " + helloProgramId + " - " + helloProgramMainFunction +" with a server started with a private key ciphertext..");
                    transaction_id = await privateDevClient.executeProgram(helloProgramId, helloProgramMainFunction, 1, ["5u32", "5u32"], undefined, "password");
                    log("Execute transaction id: " + transaction_id);
                    expect(transaction_id).toBeTruthy();
                    break;
                } catch (e) {
                    log("Execution failed, retrying in 5 seconds");
                }
            }

            // If the transaction failed above, try one more time
            if (transaction_id === "") {
                log("Attempting to execute " + helloProgramId + " - " + helloProgramMainFunction +" with a server started with a private key ciphertext one final time..");
                transaction_id = await privateDevClient.executeProgram(helloProgramId, helloProgramMainFunction, 1, ["5u32", "5u32"], undefined, "password");
            }
            expect(transaction_id).toBeTruthy();
        }, 150000);
    });
});