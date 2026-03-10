import sinon from "sinon";
import { expect } from "chai";
import { Account, Address, ComputeKey, PrivateKey, RecordCiphertext, ViewKey, zeroizeBytes } from "../src/node.js";
import { seed, message, beaconPrivateKeyString, beaconViewKeyString, beaconAddressString, recordCiphertextString, foreignCiphertextString, recordPlaintextString } from "./data/account-data.js";

describe('Account', () => {
    afterEach(() => {
        sinon.restore();
    });

    describe('constructors', () => {
        it('creates a new account if no parameters are passed', () => {
            // Generate account from rng
            const account = new Account();

            // Test object member type consistency
            expect(account._privateKey).instanceof(PrivateKey);
            expect(account._viewKey).instanceof(ViewKey);
            expect(account._address).instanceof(Address);
            expect(account._computeKey).instanceOf(ComputeKey);
            // Test convenience method type consistency
            expect(account.privateKey()).instanceof(PrivateKey);
            expect(account.viewKey()).instanceof(ViewKey);
            expect(account.address()).instanceof(Address);
            expect(account.computeKey()).instanceOf(ComputeKey);
        });

        it('creates a new from seed', () => {
            // Generate account from a seed
            const account = new Account({seed: seed});

            // Test object member type consistency
            expect(account._privateKey).instanceof(PrivateKey);
            expect(account._viewKey).instanceof(ViewKey);
            expect(account._address).instanceof(Address);
            expect(account._computeKey).instanceOf(ComputeKey);
            // Test convenience method type consistency
            expect(account.privateKey()).instanceof(PrivateKey);
            expect(account.viewKey()).instanceof(ViewKey);
            expect(account.address()).instanceof(Address);
            expect(account.computeKey()).instanceOf(ComputeKey);
            // Test that expected output is generated
            expect(account.privateKey().to_string()).equal(beaconPrivateKeyString);
            expect(account.viewKey().to_string()).equal(beaconViewKeyString);
            expect(account.address().to_string()).equal(beaconAddressString);
            expect(account.toString()).equal(beaconAddressString);
        });

        it('throws an error if parameters are invalid', () => {
            expect(() => new Account({privateKey: 'invalidPrivateKey'})).throw();
        });

        it('creates an account object from a valid private key string', () => {
            // Generate account from valid private key string
            const account = new Account( {privateKey: beaconPrivateKeyString});

            // Test object member type consistency
            expect(account._privateKey).instanceof(PrivateKey);
            expect(account._viewKey).instanceof(ViewKey);
            expect(account._address).instanceof(Address);
            // Test convenience method type consistency
            expect(account.privateKey()).instanceof(PrivateKey);
            expect(account.viewKey()).instanceof(ViewKey);
            expect(account.address()).instanceof(Address);
            // Test that expected output is generated
            expect(account.privateKey().to_string()).equal(beaconPrivateKeyString);
            expect(account.viewKey().to_string()).equal(beaconViewKeyString);
            expect(account.address().to_string()).equal(beaconAddressString);
            expect(account.toString()).equal(beaconAddressString);
        });

        it('can encrypt an account and decrypt to the same account', () => {
            const newAccount = new Account();
            const privateKeyCiphertext = newAccount.encryptAccount("mypassword");
            const privateKeyCiphertextString = privateKeyCiphertext.toString();

            // Generate account from valid private key string
            const accountFromString = Account.fromCiphertext(privateKeyCiphertextString, "mypassword");
            const accountFromObject = Account.fromCiphertext(privateKeyCiphertext, "mypassword");

            for (const account of [accountFromString, accountFromObject]) {
                // Test that expected output is generated
                expect(account.privateKey().to_string()).equal(newAccount.privateKey().to_string());
                expect(account.viewKey().to_string()).equal(newAccount.viewKey().to_string());
                expect(account.address().to_string()).equal(newAccount.toString());
                expect(account.toString()).equal(newAccount.toString());
            }
        });

        it('fails to create an account from a bad password', () => {
            const newAccount = new Account();
            const privateKeyCiphertext = newAccount.encryptAccount("mypassword");
            const privateKeyCiphertextString = privateKeyCiphertext.toString();

            try {
                Account.fromCiphertext(privateKeyCiphertextString, "badpassword");
                Account.fromCiphertext(privateKeyCiphertext, "badpassword");

                // Should not get here
                expect(true).equal(false);
            } catch (err) {
                // The account should fail to decrypt
                expect(true).equal(true);
            }
        });
    });

    describe('isValidAddress', () => {
        it('returns true for a valid address string', () => {
            expect(Account.isValidAddress(beaconAddressString)).equal(true);
        });

        it('returns false for invalid address strings', () => {
            expect(Account.isValidAddress('invalid_address')).equal(false);
            expect(Account.isValidAddress('aleo1xyz')).equal(false);
            expect(Account.isValidAddress('')).equal(false);
        });

        it('returns true for valid address bytes', () => {
            const address = Address.from_string(beaconAddressString);
            const bytes = address.toBytesLe();
            expect(Account.isValidAddress(bytes)).equal(true);
        });

        it('returns false for invalid address bytes', () => {
            expect(Account.isValidAddress(new Uint8Array([1, 2, 3]))).equal(false);
            expect(Account.isValidAddress(new Uint8Array([]))).equal(false);
        });
    });

    describe('View Key Record Decryption', () => {
        it('decrypts a record in ciphertext form', () => {
            const account = new Account({privateKey: "APrivateKey1zkpJkyYRGYtkeHDaFfwsKtUJzia7csiWhfBWPXWhXJzy9Ls"});

            const decrypt_spy = sinon.spy(account._viewKey, 'decrypt');

            // Decrypt record the private key owns
            const decryptedRecord = account.decryptRecord(recordCiphertextString);

            // Ensure the underlying wasm is being called with the right data
            expect(decrypt_spy.calledWith(recordCiphertextString)).equal(true);
            // Ensure it decrypts to the correct data
            expect(decryptedRecord).equal(recordPlaintextString);
        });

        it('doesnt decrypt records from other accounts nor identifies them as the record owner', () => {
            function tryDecrypt() {
                try {
                    return account.decryptRecord(foreignCiphertextString);
                } catch (err) {
                    throw("Record didn't decrypt")
                }
            }
            const account = new Account({privateKey: "APrivateKey1zkpJkyYRGYtkeHDaFfwsKtUJzia7csiWhfBWPXWhXJzy9Ls"});
            const decrypt_spy = sinon.spy(account._viewKey, 'decrypt');
            const recordCiphertext = RecordCiphertext.fromString(foreignCiphertextString);

            // Ensure a foreign record decryption attempt throws
            expect(tryDecrypt).throw();
            // Ensure the underlying wasm is being called with the right data
            expect(decrypt_spy.calledWith(foreignCiphertextString)).equal(true);
            // Ensure the account doesn't identify the record ciphertext as its own from both string and object forms
            expect(account.ownsRecordCiphertext(foreignCiphertextString)).equal(false);
            expect(account.ownsRecordCiphertext(recordCiphertext)).equal(false);

        });

        it('decrypts an array of records in ciphertext form', () => {
            const account = new Account({privateKey: "APrivateKey1zkpJkyYRGYtkeHDaFfwsKtUJzia7csiWhfBWPXWhXJzy9Ls"});
            const ciphertexts = [recordCiphertextString, recordCiphertextString];
            const decrypt_spy = sinon.spy(account._viewKey, 'decrypt');
            const decryptedRecords = account.decryptRecords(ciphertexts);

            // Ensure the right number of calls were called and right inputs were passed
            expect(decrypt_spy.callCount).equal(2);
            expect(decrypt_spy.calledWith(ciphertexts[0])).equal(true);
            expect(decrypt_spy.calledWith(ciphertexts[1])).equal(true);
            // Ensure the records were decrypted to the correct data
            expect(decryptedRecords).deep.equal([recordPlaintextString, recordPlaintextString]);
        });
    });

    describe('Sign and Verify', () => {

        it("verifies the signature on a message", () => {
            const account = new Account();
            const other_message = Uint8Array.from([104, 101, 108, 108, 111, 32, 120, 121, 114, 108, 99]);
            const sign_spy = sinon.spy(account._privateKey, 'sign');
            const signature = account.sign(message);

            // Ensure the signature was called with the right message
            expect(sign_spy.calledWith(message)).equal(true);
            const other_signature = account.sign(other_message);
            // Ensure the signature was called with the right message and the right number of times
            expect(sign_spy.calledWith(other_message)).equal(true);
            expect(sign_spy.callCount).equal(2);

            const verify_spy = sinon.spy(account._address, 'verify');
            const isValid = account.verify(message, signature);
            expect(verify_spy.calledWith(message, signature)).equal(true);
            const isSigValidForWrongMessage = account.verify(other_message, signature);
            expect(verify_spy.calledWith(other_message, signature)).equal(true);
            const isSigValidForMultipleMessages = account.verify(other_message, other_signature);
            expect(verify_spy.calledWith(other_message, other_signature)).equal(true);
            expect(verify_spy.callCount).equal(3);
            // Ensure the signature was valid
            expect(isValid).equal(true);
            // Ensure the second message was valid
            expect(isSigValidForMultipleMessages).equal(true);
            // Ensure a signature & message mismatch is invalid
            expect(isSigValidForWrongMessage).equal(false);
        });
    });

    describe('Account Lifecycle & Zeroization', () => {
        it('destroy prevents further use of the account', () => {
            const account = new Account();
            account.destroy();

            expect(() => account.privateKey()).to.throw(/destroyed/);
            expect(() => account.viewKey()).to.throw(/destroyed/);
            expect(() => account.computeKey()).to.throw(/destroyed/);
            expect(() => account.address()).to.throw(/destroyed/);
            expect(() => account.sign(message)).to.throw(/destroyed/);
            expect(() => account.verify(message, new Account().sign(message))).to.throw(/destroyed/);
            expect(() => account.clone()).to.throw(/destroyed/);
            expect(() => account.toString()).to.throw(/destroyed/);
            expect(() => account.encryptAccount("password")).to.throw(/destroyed/);
            expect(() => account.decryptRecord("ciphertext")).to.throw(/destroyed/);
            expect(() => account.decryptRecords(["ciphertext"])).to.throw(/destroyed/);
        });

        it('destroy is idempotent', () => {
            const account = new Account();
            account.destroy();
            expect(() => account.destroy()).to.not.throw();
        });

        it('Symbol.dispose triggers destroy', () => {
            const account = new Account();
            account[Symbol.dispose]();

            expect(() => account.privateKey()).to.throw(/destroyed/);
        });

        it('clone produces a working independent copy', () => {
            const account = new Account({seed: seed});
            const cloned = account.clone();

            // Verify the clone has the same keys
            expect(cloned.privateKey().to_string()).to.equal(account.privateKey().to_string());
            expect(cloned.viewKey().to_string()).to.equal(account.viewKey().to_string());
            expect(cloned.address().to_string()).to.equal(account.address().to_string());

            // Destroying the original should not affect the clone
            account.destroy();
            expect(() => cloned.privateKey()).to.not.throw();
            expect(cloned.privateKey().to_string()).to.equal(beaconPrivateKeyString);

            cloned.destroy();
        });

        it('fromCiphertext produces a working account', () => {
            const account = new Account();
            const ciphertext = account.encryptAccount("testpassword");
            const recovered = Account.fromCiphertext(ciphertext, "testpassword");

            expect(recovered.privateKey().to_string()).to.equal(account.privateKey().to_string());
            expect(recovered.viewKey().to_string()).to.equal(account.viewKey().to_string());
            expect(recovered.address().to_string()).to.equal(account.address().to_string());

            account.destroy();
            recovered.destroy();
        });

        it('accepts a PrivateKey object in AccountParam', () => {
            const original = new Account({seed: seed});
            const pk = original.privateKey();

            // Create account from PrivateKey object (byte-serialization path, no string leak)
            const fromPk = new Account({privateKey: pk});
            expect(fromPk.privateKey().to_string()).to.equal(beaconPrivateKeyString);
            expect(fromPk.viewKey().to_string()).to.equal(beaconViewKeyString);
            expect(fromPk.address().to_string()).to.equal(beaconAddressString);

            original.destroy();
            fromPk.destroy();
        });

        it('zeroizeBytes clears a byte array', () => {
            const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            expect(bytes.some(b => b !== 0)).to.equal(true);

            zeroizeBytes(bytes);
            expect(bytes.every(b => b === 0)).to.equal(true);
        });
    });
});
