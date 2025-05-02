import { expect } from "chai";
import { beaconPrivateKeyString } from "./data/account-data.js";
import { Account, AleoNetworkClient, NetworkRecordProvider, RecordPlaintext } from "../src/node.js";

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
                const records = await recordProvider.findCreditsRecords({
                    microcredits: [100, 200],
                    unspent: true,
                    nonces: [],
                });
                if (Array.isArray(records)) {
                    expect(records.length).equal(2);
                    records.forEach((record) => {
                       nonces.push(record.nonce());
                    });
                } else {
                    expect(Array.isArray(records)).equal(true);
                }

                // Get another two records with findCreditsRecords and ensure they are unique
                const records2 = await recordProvider.findCreditsRecords({
                    microcredits: [100, 200],
                    unspent: true,
                    nonces: nonces,
                });
                if (Array.isArray(records2)) {
                    expect(records2.length).equal(2);
                    records2.forEach((record) => {
                        expect(nonces.includes(record.nonce())).equal(false);
                        nonces.push(record.nonce());
                    });
                } else {
                    expect(Array.isArray(records2)).equal(true);
                }
            } catch (e) {
                throw e;
            }
        });
    });
});
