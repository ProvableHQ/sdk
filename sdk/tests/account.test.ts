import { Account } from '../src'
import { PrivateKey, ViewKey, Address, RecordCiphertext } from '@aleohq/nodejs';
import { seed, message, beaconPrivateKeyString, beaconViewKeyString, beaconAddressString, recordCiphertextString, foreignCiphertextString, recordPlaintextString } from './data/account-data';


describe('Account', () => {
    describe('constructors', () => {
        test('creates a new account if no parameters are passed', () => {
            // Generate account from rng
            const account = new Account();

            // Test object member type consistency
            expect(account._privateKey).toBeInstanceOf(PrivateKey);
            expect(account._viewKey).toBeInstanceOf(ViewKey);
            expect(account._address).toBeInstanceOf(Address);
            // Test convenience method type consistency
            expect(account.privateKey()).toBeInstanceOf(PrivateKey);
            expect(account.viewKey()).toBeInstanceOf(ViewKey);
            expect(account.address()).toBeInstanceOf(Address);
        });

        test('creates a new from seed', () => {
            // Generate account from a seed
            const account = new Account({seed: seed});

            // Test object member type consistency
            expect(account._privateKey).toBeInstanceOf(PrivateKey);
            expect(account._viewKey).toBeInstanceOf(ViewKey);
            expect(account._address).toBeInstanceOf(Address);
            // Test convenience method type consistency
            expect(account.privateKey()).toBeInstanceOf(PrivateKey);
            expect(account.viewKey()).toBeInstanceOf(ViewKey);
            expect(account.address()).toBeInstanceOf(Address);
            // Test that expected output is generated
            expect(account.privateKey().to_string()).toEqual(beaconPrivateKeyString);
            expect(account.viewKey().to_string()).toEqual(beaconViewKeyString);
            expect(account.address().to_string()).toEqual(beaconAddressString);
            expect(account.toString()).toEqual(beaconAddressString);
        });

        test('throws an error if parameters are invalid', () => {
            expect(() => new Account({privateKey: 'invalidPrivateKey'})).toThrow();
        });

        test('creates an account object from a valid private key string', () => {
            // Generate account from valid private key string
            const account = new Account( {privateKey: beaconPrivateKeyString});

            // Test object member type consistency
            expect(account._privateKey).toBeInstanceOf(PrivateKey);
            expect(account._viewKey).toBeInstanceOf(ViewKey);
            expect(account._address).toBeInstanceOf(Address);
            // Test convenience method type consistency
            expect(account.privateKey()).toBeInstanceOf(PrivateKey);
            expect(account.viewKey()).toBeInstanceOf(ViewKey);
            expect(account.address()).toBeInstanceOf(Address);
            // Test that expected output is generated
            expect(account.privateKey().to_string()).toEqual(beaconPrivateKeyString);
            expect(account.viewKey().to_string()).toEqual(beaconViewKeyString);
            expect(account.address().to_string()).toEqual(beaconAddressString);
            expect(account.toString()).toEqual(beaconAddressString);
        });

        test('can encrypt an account and decrypt to the same account', () => {
            const newAccount = new Account();
            const privateKeyCiphertext = newAccount.encryptAccount("mypassword");
            const privateKeyCiphertextString = privateKeyCiphertext.toString();

            // Generate account from valid private key string
            const accountFromString = Account.fromCiphertext(privateKeyCiphertextString, "mypassword");
            const accountFromObject = Account.fromCiphertext(privateKeyCiphertext, "mypassword");

            for (const account of [accountFromString, accountFromObject]) {
                // Test that expected output is generated
                expect(account.privateKey().to_string()).toEqual(newAccount.privateKey().to_string());
                expect(account.viewKey().to_string()).toEqual(newAccount.viewKey().to_string());
                expect(account.address().to_string()).toEqual(newAccount.toString());
                expect(account.toString()).toEqual(newAccount.toString());
            }
        });

        test('fails to create an account from a bad password', () => {
            const newAccount = new Account();
            const privateKeyCiphertext = newAccount.encryptAccount("mypassword");
            const privateKeyCiphertextString = privateKeyCiphertext.toString();

            try {
                Account.fromCiphertext(privateKeyCiphertextString, "badpassword");
                Account.fromCiphertext(privateKeyCiphertext, "badpassword");

                // Should not get here
                expect(true).toBe(false);
            } catch (err) {
                // The account should fail to decrypt
                expect(true).toBe(true);
            }
        });
    });

    describe('View Key Record Decryption', () => {
        test('decrypts a record in ciphertext form', () => {
            const account = new Account({privateKey: "APrivateKey1zkpJkyYRGYtkeHDaFfwsKtUJzia7csiWhfBWPXWhXJzy9Ls"});
            const decrypt_spy = jest.spyOn(account._viewKey, 'decrypt');
            // Decrypt record the private key owns
            const decryptedRecord = account.decryptRecord(recordCiphertextString);

            // Ensure the underlying wasm is being called with the right data
            expect(decrypt_spy).toHaveBeenCalledWith(recordCiphertextString);
            // Ensure it decrypts to the correct data
            expect(decryptedRecord).toBe(recordPlaintextString);
        });

        test('doesnt decrypt records from other accounts nor identifies them as the record owner', () => {
            function tryDecrypt() {
                try {
                    return account.decryptRecord(foreignCiphertextString);
                } catch (err) {
                    throw("Record didn't decrypt")
                }
            }
            const account = new Account({privateKey: "APrivateKey1zkpJkyYRGYtkeHDaFfwsKtUJzia7csiWhfBWPXWhXJzy9Ls"});
            const decrypt_spy = jest.spyOn(account._viewKey, 'decrypt');
            const recordCiphertext = RecordCiphertext.fromString(foreignCiphertextString);

            // Ensure a foreign record decryption attempt throws
            expect(tryDecrypt).toThrow();
            // Ensure the underlying wasm is being called with the right data
            expect(decrypt_spy).toHaveBeenCalledWith(foreignCiphertextString);
            // Ensure the account doesn't identify the record ciphertext as its own from both string and object forms
            expect(account.ownsRecordCiphertext(foreignCiphertextString)).toBe(false);
            expect(account.ownsRecordCiphertext(recordCiphertext)).toBe(false);

        });

        test('decrypts an array of records in ciphertext form', () => {
            const account = new Account({privateKey: "APrivateKey1zkpJkyYRGYtkeHDaFfwsKtUJzia7csiWhfBWPXWhXJzy9Ls"});
            const ciphertexts = [recordCiphertextString, recordCiphertextString];
            const decrypt_spy = jest.spyOn(account._viewKey, 'decrypt');
            const decryptedRecords = account.decryptRecords(ciphertexts);

            // Ensure the right number of calls were called and right inputs were passed
            expect(decrypt_spy).toHaveBeenCalledTimes(2);
            expect(decrypt_spy).toHaveBeenCalledWith(ciphertexts[0]);
            expect(decrypt_spy).toHaveBeenCalledWith(ciphertexts[1]);
            // Ensure the records were decrypted to the correct data
            expect(decryptedRecords).toEqual([recordPlaintextString, recordPlaintextString]);
        });
    });

    describe('Sign and Verify', () => {

        test("verifies the signature on a message", () => {
            const account = new Account();
            const other_message = Uint8Array.from([104, 101, 108, 108, 111, 32, 120, 121, 114, 108, 99]);
            const sign_spy = jest.spyOn(account._privateKey, 'sign');
            const signature = account.sign(message);

            // Ensure the signature was called with the right message
            expect(sign_spy).lastCalledWith(message);
            const other_signature = account.sign(other_message);
            // Ensure the signature was called with the right message and the right number of times
            expect(sign_spy).lastCalledWith(other_message);
            expect(sign_spy).toHaveBeenCalledTimes(2);
            const verify_spy = jest.spyOn(account._address, 'verify');
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