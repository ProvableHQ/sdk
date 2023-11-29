import {beaconAddressString, beaconPrivateKeyString} from "./data/account-data";
import {Account, AleoNetworkClient} from "../src";
jest.retryTimes(3);

describe('NetworkClient', () => {
    let localApiClient: AleoNetworkClient;
    let remoteApiClientWithPrivateKey: AleoNetworkClient;

    beforeEach(() => {
        localApiClient = new AleoNetworkClient("http://0.0.0.0:3030");
        remoteApiClientWithPrivateKey = new AleoNetworkClient("http://0.0.0.0:3030");
        remoteApiClientWithPrivateKey.setAccount(new Account({privateKey: beaconPrivateKeyString}));
    });

    describe('findUnspentRecords', () => {

        // Integration tests to be run with a local node (run with -s flag)
        it('should find records', async () => {
            const records = await localApiClient.findUnspentRecords(0, undefined, beaconPrivateKeyString, undefined, undefined, []);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should find records when a private key is pre-configured', async () => {
            const records = await remoteApiClientWithPrivateKey.findUnspentRecords(0, undefined, undefined, undefined, 100, []);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should find records even when block height specified is higher than current block height', async () => {
            const records = await localApiClient.findUnspentRecords(0, 50000000000000, beaconPrivateKeyString, undefined, 100, []);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should find records with specified amounts', async () => {
            let records = await localApiClient.findUnspentRecords(0, 3, beaconPrivateKeyString, [100, 200], undefined, []);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBe(2);
            }

            records = await localApiClient.findUnspentRecords(0, undefined, beaconPrivateKeyString, undefined, 1000, []);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should not find records with existing nonces', async () => {
            const nonces: string[] = [];
            const records = await localApiClient.findUnspentRecords(0, 3, beaconPrivateKeyString, [100, 200], undefined, []);
            expect(Array.isArray(records)).toBe(true);

            // Find two records and store their nonces
            if (!(records instanceof Error)) {
                expect(records.length).toBe(2);

                records.forEach((record) => {
                    nonces.push(record.nonce());
                });
                // Check the next records found do not have the same nonces
                const new_records = await localApiClient.findUnspentRecords(0, 3, beaconPrivateKeyString, [100, 200], undefined, nonces);
                expect(Array.isArray(records)).toBe(true);
                if (!(new_records instanceof Error)) {
                    expect(new_records.length).toBe(2);
                    new_records.forEach((record) => {
                        expect(nonces.includes(record.nonce())).toBe(false);
                    });
                }
            }

        }, 60000);
    });
});
