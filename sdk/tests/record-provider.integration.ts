import {jest} from '@jest/globals'
import { beaconPrivateKeyString } from "./data/account-data";
import { Account, AleoNetworkClient, NetworkRecordProvider, RecordPlaintext } from "../src/node";
jest.retryTimes(3);

describe('RecordProvider', () => {
    let account: Account;
    let networkClient: AleoNetworkClient;
    let recordProvider: NetworkRecordProvider;

    beforeEach(() => {
        account = new Account({privateKey: beaconPrivateKeyString});
        networkClient = new AleoNetworkClient("http://0.0.0.0:3030");
        recordProvider = new NetworkRecordProvider(account, networkClient);
    });

    describe('Record provider', () => {
        it('should find credits records', async () => {
            try {
                // Find two records with findCreditsRecords
                const nonces: string[] = [];
                const records = await recordProvider.findCreditsRecords([100, 200], true, []);
                if (Array.isArray(records)) {
                    expect(records.length).toEqual(2);
                    records.forEach((record) => {
                       nonces.push(record.nonce());
                    });
                } else {
                    expect(Array.isArray(records)).toBe(true);
                }

                // Get another two records with findCreditsRecords and ensure they are unique
                const records2 = await recordProvider.findCreditsRecords([100, 200], true, nonces);
                if (Array.isArray(records2)) {
                    expect(records2.length).toEqual(2);
                    records2.forEach((record) => {
                        expect(nonces.includes(record.nonce())).toBe(false);
                        nonces.push(record.nonce());
                    });
                } else {
                    expect(Array.isArray(records2)).toBe(true);
                }
            } catch (e) {
                throw e;
            }
        }, 60000);
    });
});
