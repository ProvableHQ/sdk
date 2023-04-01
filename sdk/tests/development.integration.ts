import { DevelopmentClient } from '../src';
import {addressString, privateKeyString, helloProgram, helloProgramId} from './data/account-data';

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('DevelopmentServer', () => {
    describe('Deploy & Execute', () => {
        it("creates the develop object successfully", async () => {
            const develop = new DevelopmentClient("http://localhost:4321");
            expect(develop).toBeTruthy();
        });

        it("can make transfers with the aleo development server", async () => {
            const develop = new DevelopmentClient("http://localhost:4321");
            for (let i = 0; i < 10; i++) {
                try {
                    const transfer_transaction_id: string = await develop.transfer(1000, 0, addressString, privateKeyString);
                    expect(transfer_transaction_id).toBeTruthy();
                    break;
                } catch (e) {
                }
            }
        }, 90000);

        it('can run deploy and execute on the aleo development server', async () => {
            const develop = new DevelopmentClient("http://localhost:4321");
            for (let i = 0; i < 10; i++) {
                try {
                    await develop.deployProgram(helloProgram, 6000000, privateKeyString);
                    break;
                }
                catch (e) {
                }
            }
            await wait(10000);

            for (let i = 0; i < 5; i++) {
                try {
                    await develop.deployProgram(helloProgram, 6000000, privateKeyString);
                    const execute_transaction_id: string = await develop.executeProgram(helloProgramId, "main", 0, ["5u32", "5u32"], privateKeyString);
                    expect(execute_transaction_id).toBeTruthy();
                    break;
                } catch (e) {
                }
            }
        }, 120000);
    });
});