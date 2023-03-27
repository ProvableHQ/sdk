import { addressString, privateKeyString, helloProgram } from './data/account-data';
import { DevelopmentClient, NodeConnection } from "../src";

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('DevelopmentServer', () => {
    describe('Deploy & Execute', () => {
        it.only("creates the develop object successfully", async () => {
            const develop = new DevelopmentClient("http://localhost:4321");
            expect(develop).toBeTruthy();
        });

        it("can make transfers with the aleo development server", async () => {
            const develop = new DevelopmentClient("http://localhost:4321");
            const transfer_transaction_id: string = await develop.transfer(1000, 0, addressString, privateKeyString);
            expect(transfer_transaction_id).toBeTruthy();
        }, 20000);

        it('can run deploy and execute on the aleo development server', async () => {
            const develop = new DevelopmentClient("http://localhost:4321");

            await develop.deployProgram(helloProgram, 6000000, privateKeyString);
            await wait(10000)

            const execute_transaction_id: string = await develop.executeProgram("hello.aleo", "main", 0, ["5u32", "5u32"], privateKeyString);
            expect(execute_transaction_id).toBeTruthy();
        }, 75000);
    });
});