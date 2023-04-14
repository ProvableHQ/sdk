import {Account, AleoNetworkClient} from "../src";
import {privateKeyString} from "./data/account-data";
jest.retryTimes(3);

describe('NodeConnection', () => {
    let localApiClient: AleoNetworkClient;
    let remoteApiClientWithPrivateKey: AleoNetworkClient;

    beforeEach(() => {
        localApiClient = new AleoNetworkClient("http://0.0.0.0:3030");
        remoteApiClientWithPrivateKey = new AleoNetworkClient("http://0.0.0.0:3030");
        remoteApiClientWithPrivateKey.setAccount(new Account({privateKey: privateKeyString}));
    });

    describe('findUnspentRecords', () => {

        // Integration tests to be run with a local node (run with -s flag)
        it('should find records', async () => {
            const records = await localApiClient.findUnspentRecords(0, undefined, privateKeyString, undefined, undefined);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should find records when a private key is pre-configured', async () => {
            const records = await remoteApiClientWithPrivateKey.findUnspentRecords(0, undefined, undefined, undefined, 100);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should find records even when block height specified is higher than current block height', async () => {
            const records = await localApiClient.findUnspentRecords(0, 50000000000000, privateKeyString, undefined, 100);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should find records with specified amounts', async () => {
            let records = await localApiClient.findUnspentRecords(0, undefined, privateKeyString, [100, 200], undefined);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBe(2);
            }

            records = await localApiClient.findUnspentRecords(0, undefined, privateKeyString, undefined, 1000);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);
    });
});