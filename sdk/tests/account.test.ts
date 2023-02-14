import { Account } from '../src'
import { PrivateKey, ViewKey, Address } from '@aleohq/wasm';

/// Test vectors created from a run of SnarkOS local network
const seed = new Uint8Array([94, 91, 52, 251, 240, 230, 226, 35, 117, 253, 224, 210, 175, 13, 205, 120, 155, 214, 7, 169, 66, 62, 206, 50, 188, 40, 29, 122, 40, 250, 54, 18]);
const privateKey = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"
const viewKey = "AViewKey1mSnpFFC8Mj4fXbK5YiWgZ3mjiV8CxA79bYNa8ymUpTrw"
const address = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"
const ciphertext = "record1qyqspnp6w0fmrr66xsx5rwh4cp2qy7c3rp0ra0rf8rqd0t8u30d28nqxqyqsqqmnjvj7a8cs2es783xmd8sc2u46essh2f7w6vm26s4cks865lq0qzszm3clnh2vlpazmcjhan74nq0rr6hrtagwnw0grkrzuevg2x8sjjy02jy";
const expectedDecryptedRecord = "{\n  owner: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px.private,\n  gates: 550000000000000u64.private,\n  _nonce: 4324037486175223501017904251644658173467860078798396792350707407904752217504group.public\n}";

describe('Account', () => {
    describe('constructor', () => {
        test('creates a new account if no parameters are passed', () => {
            const account = new Account();
            expect(account.pk).toBeInstanceOf(PrivateKey);
            expect(account.vk).toBeInstanceOf(ViewKey);
            expect(account.adr).toBeInstanceOf(Address);
        });

        test('creates a new from seed', () => {
            const account = new Account({seed: seed});
            expect(account.pk).toBeInstanceOf(PrivateKey);
            expect(account.vk).toBeInstanceOf(ViewKey);
            expect(account.adr).toBeInstanceOf(Address);
            expect(account.pk.to_string()).toEqual(privateKey);
            expect(account.vk.to_string()).toEqual(viewKey);
            expect(account.adr.to_string()).toEqual(address);
        });

        test('throws an error if parameters are invalid', () => {
            expect(() => new Account({privateKey: 'invalidPrivateKey'})).toThrow();
        });

        test('creates an account object from a valid private key string', () => {
            const account = new Account( {privateKey: privateKey});
            expect(account.pk).toBeInstanceOf(PrivateKey);
            expect(account.vk).toBeInstanceOf(ViewKey);
            expect(account.adr).toBeInstanceOf(Address);
            expect(account.pk.to_string()).toEqual(privateKey);
            expect(account.vk.to_string()).toEqual(viewKey);
            expect(account.adr.to_string()).toEqual(address);
        });
    });

    describe('decryptRecord', () => {
        test('decrypts a record in ciphertext form', () => {
            const account = new Account({privateKey: privateKey});
            const decrypt_spy = jest.spyOn(account.vk, 'decrypt');
            const decryptedRecord = account.decryptRecord(ciphertext);
            expect(decrypt_spy).toHaveBeenCalledWith(ciphertext);
            expect(decryptedRecord).toBe(expectedDecryptedRecord);
        });
    });

    describe('decryptRecords', () => {
        test('decrypts an array of records in ciphertext form', () => {
            const account = new Account({privateKey: privateKey});
            const ciphertexts = [ciphertext, ciphertext];
            const decrypt_spy = jest.spyOn(account.vk, 'decrypt');
            const decryptedRecords = account.decryptRecords(ciphertexts);
            expect(decrypt_spy).toHaveBeenCalledTimes(2);
            expect(decrypt_spy).toHaveBeenCalledWith(ciphertexts[0]);
            expect(decrypt_spy).toHaveBeenCalledWith(ciphertexts[1]);
            expect(decryptedRecords).toEqual([expectedDecryptedRecord, expectedDecryptedRecord]);
        });
    });

    describe('sign', () => {
        test('signs a message with the account private key', () => {
            const account = new Account({privateKey: privateKey});
            const message = new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]);
            const sign_spy = jest.spyOn(account.pk, 'sign');
            const signature = account.sign(message);
            console.log("signature: " + signature.to_string());
            expect(sign_spy).toHaveBeenCalledWith(message);
        });
    });

    describe("verify", () => {
        test("verifies the signature on a message", () => {
            const account = new Account();
            const message = Uint8Array.from([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]);
            const signature = account.sign(message);
            const isValid = account.verify(message, signature);
            expect(isValid).toBe(true);
        });
    });
});