import { AleoNetworkClient, DevelopmentClient } from '../src';
import {addressString, privateKeyString, helloProgram, helloProgramId} from './data/account-data';
import { log } from 'console';

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('DevelopmentServer', () => {
    let devClient: DevelopmentClient;
    let localApiClient: AleoNetworkClient;
    let remoteDevClient: DevelopmentClient;

    beforeEach(() => {
        devClient = new DevelopmentClient("http://0.0.0.0:4040");
        localApiClient = new AleoNetworkClient("http://0.0.0.0:3030");
        remoteDevClient = new DevelopmentClient("http://0.0.0.0:5050");
    });

    describe('Deploy & Execute', () => {

        it("can make value transfers with the aleo development server", async () => {
            let transaction_id = "";
            for (let i = 0; i < 4; i++) {
                try {
                    transaction_id = await devClient.transfer(1000, 0, addressString, privateKeyString);
                    break;
                } catch (e) {
                }
            }

            // If the transaction failed above, try one more time
            if (transaction_id === "") {
                transaction_id = await devClient.transfer(1000, 0, addressString, privateKeyString);
            }
            expect(transaction_id).toBeTruthy();
        }, 120000);

        it('can run deploy and execute on the aleo development server', async () => {
            let deploy_transaction_id = "";
            for (let i = 0; i < 4; i++) {
                try {
                    log("Attempting to deploy sup.aleo");
                    deploy_transaction_id = await devClient.deployProgram(helloProgram, 6000000, privateKeyString);
                    log("Deploy transaction id: " + deploy_transaction_id);
                    await wait(30000);
                    const program = await localApiClient.getProgram("sup.aleo");
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
                log("Attempting to deploy sup.aleo one final time")
                await devClient.deployProgram(helloProgram, 6000000, privateKeyString);
                await wait(30000);
                const program = await localApiClient.getProgram("sup.aleo");
                log("Program: " + program);
                expect(program).toBeTruthy();
            }
            await wait(30000);

            let execute_transaction_id = "";
            for (let i = 0; i < 3; i++) {
                try {
                    log("Attempting to execute sup.aleo - main..");
                    execute_transaction_id = await devClient.executeProgram(helloProgramId, "main", 0, ["5u32", "5u32"], privateKeyString);
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
                log("Attempting to execute sup.aleo - main one final time..");
                execute_transaction_id = await devClient.executeProgram(helloProgramId, "main", 0, ["5u32", "5u32"], privateKeyString);
                expect(execute_transaction_id).toBeTruthy();
            }
        }, 300000);

        it('can execute a program using a server started with a private key ciphertext', async () => {
            let transaction_id = "";
            for (let i = 0; i < 3; i++) {
                try {
                    log("Attempting to execute program hello.aleo - main..");
                    transaction_id = await remoteDevClient.executeProgram("hello.aleo", "main", 0, ["5u32", "5u32"], undefined, "password");
                    log("Execute transaction id: " + transaction_id);
                    expect(transaction_id).toBeTruthy();
                    break;
                } catch (e) {
                    log("Execution failed, retrying in 5 seconds");
                }
            }

            // If the transaction failed above, try one more time
            if (transaction_id === "") {
                log("Attempting to execute hello.aleo - main one final time..");
                transaction_id = await remoteDevClient.executeProgram("hello.aleo", "main", 0, ["5u32", "5u32"], undefined, "password");
            }
            expect(transaction_id).toBeTruthy();
        }, 150000);
    });
});