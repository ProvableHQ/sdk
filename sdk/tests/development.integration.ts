import {DevelopmentClient} from '../src';
import {addressString, privateKeyString, helloProgram, helloProgramId} from './data/account-data';

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('DevelopmentServer', () => {
    let client: DevelopmentClient;

    beforeEach(() => {
        client = new DevelopmentClient("http://0.0.0.0:4321");
    });

    describe('Deploy & Execute', () => {

        it("can make transfers with the aleo development server", async () => {
            let transaction_id = "";
            for (let i = 0; i < 4; i++) {
                try {
                    transaction_id = await client.transfer(1000, 0, addressString, privateKeyString);
                    break;
                } catch (e) {
                }
            }

            // If the transaction failed above, try one more time
            if (transaction_id === "") {
                transaction_id = await client.transfer(1000, 0, addressString, privateKeyString);
            }
            expect(transaction_id).toBeTruthy();
        }, 120000);

        it('can run deploy and execute on the aleo development server', async () => {
            let deploy_transaction_id = "";
            for (let i = 0; i < 4; i++) {
                try {
                    deploy_transaction_id = await client.deployProgram(helloProgram, 6000000, privateKeyString);
                    break;
                }
                catch (e) {
                }
            }
            // If the transaction failed above, try one more time
            if (deploy_transaction_id === "") {
                deploy_transaction_id = await client.deployProgram(helloProgram, 6000000, privateKeyString);
            }
            expect(deploy_transaction_id).toBeTruthy();

            await wait(10000);

            let execute_transaction_id = "";
            for (let i = 0; i < 3; i++) {
                try {
                    execute_transaction_id = await client.executeProgram(helloProgramId, "main", 0, ["5u32", "5u32"], privateKeyString);
                    expect(execute_transaction_id).toBeTruthy();
                    break;
                } catch (e) {
                }
            }

            // If the transaction failed above, try one more time
            if (execute_transaction_id === "") {
                execute_transaction_id = await client.deployProgram(helloProgram, 6000000, privateKeyString);
            }
            expect(execute_transaction_id).toBeTruthy();
        }, 150000);
    });
});