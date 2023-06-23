import {Account, AleoNetworkClient} from "../src";
import {beaconPrivateKeyString} from "./data/account-data";
jest.retryTimes(3);

describe('NodeConnection', () => {
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
            const records = await localApiClient.findUnspentRecords(0, undefined, beaconPrivateKeyString, undefined, undefined);
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
            const records = await localApiClient.findUnspentRecords(0, 50000000000000, beaconPrivateKeyString, undefined, 100);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should find records with specified amounts', async () => {
            let records = await localApiClient.findUnspentRecords(0, 3, beaconPrivateKeyString, [100, 200], undefined);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBe(2);
            }

            records = await localApiClient.findUnspentRecords(0, undefined, beaconPrivateKeyString, undefined, 1000);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBeGreaterThan(0);
            }
        }, 60000);

        it('should find finalize scope values', async () => {
            const mappings = await localApiClient.getProgramMappingNames("credits.aleo");
            if (!(mappings instanceof Error)) {
                expect(mappings[0]).toBe("account");
            }
            const mappingValue = await localApiClient.getMappingValue("credits.aleo", "account", "aleo1zrtqrkrr9l09lgnj2qvzyr9sjgs6r5rfqneaj4a9kh7l7tsn2c9qeevqcm");
            if (!(mappingValue instanceof Error)) {
                expect(mappingValue).toBe("0u64");
            }
        }, 60000);
    });
});
