import { Account } from '../src'
import { PrivateKey, ViewKey, Address } from '@aleohq/wasm';

/// Test vectors created from a run of SnarkOS local network
const seed = new Uint8Array([94, 91, 52, 251, 240, 230, 226, 35, 117, 253, 224, 210, 175, 13, 205, 120, 155, 214, 7, 169, 66, 62, 206, 50, 188, 40, 29, 122, 40, 250, 54, 18]);
const privateKey = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"
const viewKey = "AViewKey1mSnpFFC8Mj4fXbK5YiWgZ3mjiV8CxA79bYNa8ymUpTrw"
const address = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"
const ciphertext = "record1qyqspnp6w0fmrr66xsx5rwh4cp2qy7c3rp0ra0rf8rqd0t8u30d28nqxqyqsqqmnjvj7a8cs2es783xmd8sc2u46essh2f7w6vm26s4cks865lq0qzszm3clnh2vlpazmcjhan74nq0rr6hrtagwnw0grkrzuevg2x8sjjy02jy";
const foreignCiphertext = "record1qqj3a67efazf0awe09grqqg44htnh9vaw7l729vl309c972x7ldquqq2k2cax8s7qsqqyqtpgvqqyqsq4seyrzvfa98fkggzccqr68af8e9m0q8rzeqh8a8aqql3a854v58sgrygdv4jn9s8ckwfd48vujrmv0rtfasqh8ygn88ch34ftck8szspvfpsqqszqzvxx9t8s9g66teeepgxmvnw5ymgapcwt2lpy9d5eus580k08wpq544jcl437wjv206u5pxst6few9ll4yhufwldgpx80rlwq8nhssqywmfsd85skg564vqhm3gxsp8q6r30udmqxrxmxx2v8xycdg8pn5ps3dhfvv"
const expectedDecryptedRecord = "{\n  owner: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px.private,\n  gates: 550000000000000u64.private,\n  _nonce: 4324037486175223501017904251644658173467860078798396792350707407904752217504group.public\n}";

describe('Account', () => {
    describe('constructors', () => {
        test('creates a new account if no parameters are passed', () => {
            // Generate account from rng
            const account = new Account();
            // Test object member type consistency
            expect(account.pk).toBeInstanceOf(PrivateKey);
            expect(account.vk).toBeInstanceOf(ViewKey);
            expect(account.adr).toBeInstanceOf(Address);
            // Test convenience method type consistency
            expect(account.privateKey()).toBeInstanceOf(PrivateKey);
            expect(account.viewKey()).toBeInstanceOf(ViewKey);
            expect(account.address()).toBeInstanceOf(Address);
        });

        test('creates a new from seed', () => {
            // Generate account from a seed
            const account = new Account({seed: seed});
            // Test object member type consistency
            expect(account.pk).toBeInstanceOf(PrivateKey);
            expect(account.vk).toBeInstanceOf(ViewKey);
            expect(account.adr).toBeInstanceOf(Address);
            // Test convenience method type consistency
            expect(account.privateKey()).toBeInstanceOf(PrivateKey);
            expect(account.viewKey()).toBeInstanceOf(ViewKey);
            expect(account.address()).toBeInstanceOf(Address);
            // Test that expected output is generated
            expect(account.privateKey().to_string()).toEqual(privateKey);
            expect(account.viewKey().to_string()).toEqual(viewKey);
            expect(account.address().to_string()).toEqual(address);
            expect(account.toString()).toEqual(address);
        });

        test('throws an error if parameters are invalid', () => {
            expect(() => new Account({privateKey: 'invalidPrivateKey'})).toThrow();
        });

        test('creates an account object from a valid private key string', () => {
            // Generate account from valid private key string
            const account = new Account( {privateKey: privateKey});
            // Test object member type consistency
            expect(account.pk).toBeInstanceOf(PrivateKey);
            expect(account.vk).toBeInstanceOf(ViewKey);
            expect(account.adr).toBeInstanceOf(Address);
            // Test convenience method type consistency
            expect(account.privateKey()).toBeInstanceOf(PrivateKey);
            expect(account.viewKey()).toBeInstanceOf(ViewKey);
            expect(account.address()).toBeInstanceOf(Address);
            // Test that expected output is generated
            expect(account.privateKey().to_string()).toEqual(privateKey);
            expect(account.viewKey().to_string()).toEqual(viewKey);
            expect(account.address().to_string()).toEqual(address);
            expect(account.toString()).toEqual(address);
        });
    });

    describe('View Key Record Decryption', () => {
        test('decrypts a record in ciphertext form', () => {
            const account = new Account({privateKey: privateKey});
            const decrypt_spy = jest.spyOn(account.vk, 'decrypt');
            // Decrypt record the private key owns
            const decryptedRecord = account.decryptRecord(ciphertext);
            // Ensure the underlying wasm is being called with the right data
            expect(decrypt_spy).toHaveBeenCalledWith(ciphertext);
            // Ensure it decrypts to the correct data
            expect(decryptedRecord).toBe(expectedDecryptedRecord);
        });

        test('doesnt decrypt records from other accounts', () => {
            function tryDecrypt() {
                try {
                    return account.decryptRecord(foreignCiphertext);
                } catch (err) {
                    expect(String(err)).toMatch("RuntimeError: unreachable");
                    throw("Record didn't decrypt")
                }
            }
            const account = new Account({privateKey: privateKey});
            const decrypt_spy = jest.spyOn(account.vk, 'decrypt');
            // Ensure a foreign record decryption attempt throws
            expect(tryDecrypt).toThrow();
            // Ensure the underlying wasm is being called with the right data
            expect(decrypt_spy).toHaveBeenCalledWith(foreignCiphertext);
        });

        test('decrypts an array of records in ciphertext form', () => {
            const account = new Account({privateKey: privateKey});
            const ciphertexts = [ciphertext, ciphertext];
            const decrypt_spy = jest.spyOn(account.vk, 'decrypt');
            const decryptedRecords = account.decryptRecords(ciphertexts);
            // Ensure the right number of calls were called and right inputs were passed
            expect(decrypt_spy).toHaveBeenCalledTimes(2);
            expect(decrypt_spy).toHaveBeenCalledWith(ciphertexts[0]);
            expect(decrypt_spy).toHaveBeenCalledWith(ciphertexts[1]);
            // Ensure the records were decrypted to the correct data
            expect(decryptedRecords).toEqual([expectedDecryptedRecord, expectedDecryptedRecord]);
        });
    });

    describe('Sign and Verify', () => {

        test("verifies the signature on a message", () => {
            const account = new Account();
            const message = Uint8Array.from([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]);
            const other_message = Uint8Array.from([104, 101, 108, 108, 111, 32, 120, 121, 114, 108, 99]);
            const sign_spy = jest.spyOn(account.pk, 'sign');
            const signature = account.sign(message);
            // Ensure the signature was called with the right message
            expect(sign_spy).lastCalledWith(message);
            const other_signature = account.sign(other_message);
            // Ensure the signature was called with the right message and the right number of times
            expect(sign_spy).lastCalledWith(other_message);
            expect(sign_spy).toHaveBeenCalledTimes(2);
            const verify_spy = jest.spyOn(account.adr, 'verify');
            const isValid = account.verify(message, signature);
            expect(verify_spy).lastCalledWith(message, signature);
            const isSigValidForWrongMessage = account.verify(other_message, signature);
            expect(verify_spy).lastCalledWith(other_message, signature);
            const isSigValidForMultipleMessages = account.verify(other_message, other_signature);
            expect(verify_spy).lastCalledWith(other_message, other_signature);
            expect(verify_spy).toHaveBeenCalledTimes(3);
            // Ensure the signature was valid
            expect(isValid).toBe(true);
            // Ensure the second message was valid
            expect(isSigValidForMultipleMessages).toBe(true);
            // Ensure a signature & message mismatch is invalid
            expect(isSigValidForWrongMessage).toBe(false);
        });
    });
});