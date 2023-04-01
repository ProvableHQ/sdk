import {Account, AleoNetworkClient} from "../src";
import {privateKeyString} from "./data/account-data";
jest.retryTimes(3);

describe('NodeConnection', () => {
    let local_connection: AleoNetworkClient;
    let configured_connection: AleoNetworkClient;

    beforeEach(() => {
        local_connection = new AleoNetworkClient("http://0.0.0.0:3030");
        configured_connection = new AleoNetworkClient("http://0.0.0.0:3030");
        configured_connection.setAccount(new Account({privateKey: privateKeyString}));
    });

    describe('findUnspentRecords', () => {

        // Integration tests to be run with a local node (run with -s flag)
        it('should find records', async () => {
            const records = await local_connection.findUnspentRecords(0, undefined, privateKeyString, undefined, undefined);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should find records when a private key is pre-configured', async () => {
            const records = await configured_connection.findUnspentRecords(0, undefined, undefined, undefined, 100);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should find records even when block height specified is higher than current block height', async () => {
            const records = await local_connection.findUnspentRecords(0, 50000000000000, privateKeyString, undefined, 100);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should find records with specified amounts', async () => {
            let records = await local_connection.findUnspentRecords(0, undefined, privateKeyString, [100, 200], undefined);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBe(2);
            }

            records = await local_connection.findUnspentRecords(0, undefined, privateKeyString, undefined, 1000);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);
    });
});