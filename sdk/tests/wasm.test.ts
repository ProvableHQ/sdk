import { Address, PrivateKey, ViewKey, Signature, RecordCiphertext, RecordPlaintext, PrivateKeyCiphertext } from "@aleohq/nodejs";
import {
    seed,
    message,
    privateKeyString,
    viewKeyString,
    addressString,
    recordCiphertextString,
    foreignViewKeyString,
    recordPlaintextString,
    beaconPrivateKeyString
} from './data/account-data';


describe('WASM Objects', () => {
    describe('Address', () => {
        it('can be constructed from a private key', () => {
            const privateKey = PrivateKey.from_string(privateKeyString);
            const address = Address.from_private_key(privateKey);

            // Ensure the address is an instance of Address
            expect(address).toBeInstanceOf(Address);
            // Ensure the address string matches the expected value
            expect(address.to_string()).toMatch(addressString);
        });

        it('can be constructed from view key', () => {
            const viewKey = ViewKey.from_string(viewKeyString);
            const address = Address.from_view_key(viewKey);

            // Ensure the address is an instance of Address
            expect(address).toBeInstanceOf(Address);
            // Ensure the address string matches the expected value
            expect(address.to_string()).toMatch(addressString);
        });

        it('can be constructed from an address string', () => {
            const address = Address.from_string(addressString);

            // Ensure the address is an instance of Address
            expect(address).toBeInstanceOf(Address);
            // Ensure the address string matches the expected value
            expect(address.to_string()).toMatch(addressString);
        });

        it('can verify a message signed by the correct private key', () => {
            const privateKey = PrivateKey.from_string(privateKeyString);
            const signature = privateKey.sign(message);
            const address = Address.from_private_key(privateKey);
            const result = address.verify(message, signature);

            // Ensure the result is a boolean
            expect(typeof result).toBe('boolean');
            // Ensure the signature verified
            expect(result).toBe(true);
        });

        it('cannot verify a message signed by the wrong private key', () => {
            const privateKey = new PrivateKey();
            const otherPrivateKey = new PrivateKey();
            const signature = otherPrivateKey.sign(message);
            const address = Address.from_private_key(privateKey);
            const result = address.verify(message, signature);

            // Ensure the result is a boolean
            expect(typeof result).toBe('boolean');
            // Ensure the signature failed to verify
            expect(result).toBe(false);
        });
    });

    describe('PrivateKey', () => {
        it ('creates new accounts from sampling an rng for the initial seed', () => {
            const privateKey = new PrivateKey();
            const privateKey2 = new PrivateKey();

            // Ensure the private key is a PrivateKey instance
            expect(privateKey).toBeInstanceOf(PrivateKey);
            // Ensure the private key is a PrivateKey instance
            expect(privateKey2).toBeInstanceOf(PrivateKey);
            // Ensure the private keys are different
            expect(privateKey.to_string()).not.toBe(privateKey2.to_string());
        });

        it('constructs properly from a seed', () => {
            const privateKey = PrivateKey.from_seed_unchecked(seed);

            // Ensure the private key is a PrivateKey instance
            expect(privateKey).toBeInstanceOf(PrivateKey);
            // Ensure the private key is the correct value
            expect(privateKey.to_string()).toMatch(beaconPrivateKeyString);
        });

        it('constructs properly from a private key string', () => {
            const privateKey = PrivateKey.from_string(privateKeyString);

            // Ensure the private key is a PrivateKey instance
            expect(privateKey).toBeInstanceOf(PrivateKey);
            // Ensure the private key is the correct value
            expect(privateKey.to_string()).toMatch(privateKeyString);
        });

        it('derives the correct view key and address', () => {
            const privateKey = PrivateKey.from_string(privateKeyString);
            const viewKey = privateKey.to_view_key();
            const address = privateKey.to_address();

            // Ensure the view key and address are the correct types
            expect(viewKey).toBeInstanceOf(ViewKey);
            expect(address).toBeInstanceOf(Address);
            // Ensure the view key and address are the correct values
            expect(viewKey.to_string()).toMatch(viewKeyString);
            expect(address.to_string()).toMatch(addressString);
        });

        it('can construct directly to ciphertext and then decrypt to a private key', () => {
            const secret = 'mypassword';
            const ciphertext = PrivateKey.newEncrypted(secret);
            const privateKeyFromCiphertext = PrivateKey.fromPrivateKeyCiphertext(ciphertext, secret);

            // Ensure the ciphertext is a PrivateKeyCiphertext instance
            expect(ciphertext).toBeInstanceOf(PrivateKeyCiphertext);
            // Ensure the decrypted private key is a PrivateKey instance
            expect(privateKeyFromCiphertext).toBeInstanceOf(PrivateKey);
        });

        it('encrypts and decrypts to and from ciphertext', () => {
            const secret = 'mypassword';
            const privateKey = new PrivateKey();
            const ciphertext = privateKey.toCiphertext(secret);

            // Ensure the ciphertext is a PrivateKeyCiphertext instance
            expect(ciphertext).toBeInstanceOf(PrivateKeyCiphertext);
            const privateKeyFromCiphertext = PrivateKey.fromPrivateKeyCiphertext(ciphertext, secret);
            // Ensure the decrypted private key is a PrivateKey instance
            expect(privateKeyFromCiphertext).toBeInstanceOf(PrivateKey);
            // Ensure the decrypted private key is the same as the original
            expect(privateKeyFromCiphertext.to_string()).toBe(privateKey.to_string());
        });

        it('properly assesses equality and inequality', () => {
            const privateKey1 = new PrivateKey();
            const privateKey2 = PrivateKey.from_string(privateKeyString);
            const privateKey3 = PrivateKey.from_string(privateKeyString);

            // Ensure the different private keys are not equal
            expect((privateKey1 === privateKey2)).toBeFalsy();
            // Ensure the same private keys are equal
            expect((privateKey2 === privateKey2)).toBeTruthy();
            expect(privateKey2.to_string()).toBe(privateKey3.to_string());
        });

        it('has different ciphertexts for the same password, but decrypts to the same key', () => {
            const secret = 'mypassword';
            const privateKey = PrivateKey.from_string(privateKeyString);
            const ciphertext = privateKey.toCiphertext(secret);
            const ciphertext2 = privateKey.toCiphertext(secret);
            const decryptedPrivateKey = PrivateKey.fromPrivateKeyCiphertext(ciphertext, secret);
            const decryptedPrivateKey2 = PrivateKey.fromPrivateKeyCiphertext(ciphertext2, secret);

            // Ensure the ciphertexts are different
            expect(ciphertext).not.toBe(ciphertext2);
            // Ensure the decrypted private keys are both PrivateKey instances
            expect(decryptedPrivateKey).toBeInstanceOf(PrivateKey);
            expect(decryptedPrivateKey2).toBeInstanceOf(PrivateKey);
            // Ensure the decrypted private keys are the same as the original
            expect(decryptedPrivateKey.to_string()).toBe(privateKeyString);
            expect(decryptedPrivateKey2.to_string()).toBe(privateKeyString);
            expect(decryptedPrivateKey.to_string()).toBe(decryptedPrivateKey2.to_string());
        });
    });

    describe('ViewKey', () => {
        const viewKey = ViewKey.from_string(viewKeyString);

        it('constructs properly from a string', () => {
            // Ensure the view key is a ViewKey instance
            expect(viewKey).toBeInstanceOf(ViewKey);
            // Ensure the view key is the correct value
            expect(viewKey.to_string()).toMatch(viewKeyString);
        });

        it('derives the correct address', () => {
            const address = viewKey.to_address();

            // Ensure the address is an Address instance
            expect(address).toBeInstanceOf(Address);
            // Ensure the address is the correct value
            expect(address.to_string()).toMatch(addressString);
        });

        it('properly assesses equality and inequality', () => {
            const viewKey1 = new ViewKey();
            const viewKey2 = ViewKey.from_string(viewKeyString);
            const viewKey3 = ViewKey.from_string(viewKeyString);

            // Ensure the different view keys are not equal
            expect((viewKey1 === viewKey2)).toBeFalsy();
            // Ensure the same view keys are equal
            expect((viewKey2 === viewKey2)).toBeTruthy();
            expect(viewKey2.to_string()).toBe(viewKey3.to_string());
        });

        it('can decrypt a record generated by the account', () => {
            const decryptedRecord = viewKey.decrypt(recordCiphertextString);

            // Ensure it decrypts to the correct data
            expect(decryptedRecord).toBe(recordPlaintextString);
        });
    });

    describe('Signature', () => {
        const privateKey = new PrivateKey();

        it('can verify a message signed by the correct private key', () => {
            const address = Address.from_private_key(privateKey);
            const signature = Signature.sign(privateKey, message);
            const result = signature.verify(address, message);

            // Ensure the result is a boolean
            expect(typeof result).toBe('boolean');
            // Ensure the signature verified
            expect(result).toBe(true);
        });

        it('cannot verify a message signed by the wrong private key', () => {
            const address = Address.from_private_key(privateKey);
            const otherPrivateKey = PrivateKey.from_string(privateKeyString);
            const signature = Signature.sign(otherPrivateKey, message);
            const result = signature.verify(address, message);

            // Ensure the result is a boolean
            expect(typeof result).toBe('boolean');
            // Ensure the signature failed to verify
            expect(result).toBe(false);
        });

        it('can go to and from string', () => {
            const signature = Signature.sign(privateKey, message);
            const signatureString = signature.to_string();
            const signatureFromString = Signature.from_string(signatureString);

            // Ensure the signature is a Signature instance
            expect(signature).toBeInstanceOf(Signature);
            // Ensure from_string returns a Signature instance
            expect(signatureFromString).toBeInstanceOf(Signature);
            // Ensure the signature to_string matches the expected values
            expect(signature.to_string()).toBe(signatureString);
            expect(signatureFromString.to_string()).toBe(signatureString);
        });
    });

    describe('PrivateKeyCipherText', () => {
        const privateKey = PrivateKey.from_string(privateKeyString);
        const secret = 'mypassword';
        const ciphertext = PrivateKeyCiphertext.encryptPrivateKey(privateKey, secret);

        it('should encrypt and decrypt a private key to and from ciphertext', () => {
            const decryptedKey = ciphertext.decryptToPrivateKey(secret);

            // Ensure the decrypted key is a PrivateKey instance and is the same as the original
            expect(decryptedKey).toBeInstanceOf(PrivateKey);
            expect(decryptedKey.to_string()).toBe(privateKeyString);
        });

        it('should fail to decrypt with a bad secret', () => {
            const badSecret = 'badpassword';

            try {
                ciphertext.decryptToPrivateKey(badSecret);
                // Should not get here
                expect(true).toBe(false);
            } catch (e) {
                // Should error out
                expect(true).toBe(true);
            }
        });

        it('should not create ciphertexts that match for the same password, but should decrypt to the same key', () => {
            const ciphertext2 = PrivateKeyCiphertext.encryptPrivateKey(privateKey, secret);
            const decryptedKey = ciphertext.decryptToPrivateKey(secret);
            const decryptedKey2 = ciphertext2.decryptToPrivateKey(secret);

            // Ensure the ciphertexts are different
            expect(ciphertext).not.toBe(ciphertext2);
            // Ensure the decrypted are both private key instances and have the same key
            expect(decryptedKey).toBeInstanceOf(PrivateKey);
            expect(decryptedKey2).toBeInstanceOf(PrivateKey);
            expect(decryptedKey.to_string()).toBe(privateKeyString);
            expect(decryptedKey2.to_string()).toBe(privateKeyString);
        });

        it('round trip to and from string for PrivateKeyCiphertext', () => {
            const private_key = new PrivateKey();
            const password = "mypassword";
            const privateKeyCiphertext = PrivateKeyCiphertext.encryptPrivateKey(private_key, password);
            const privateKeyCipherText2 = PrivateKeyCiphertext.fromString(privateKeyCiphertext.toString());

            // Assert the round trip to and from string journey results in the same key
            expect(privateKeyCiphertext.toString()).toEqual(privateKeyCipherText2.toString());
        });

        it('decryption of PrivateKeyCiphertext with edge cases', () => {
            const privateKeyString = "APrivateKey1zkpAYS46Dq4rnt9wdohyWMwdmjmTeMJKPZdp5AhvjXZDsVG";
            const privateKey = PrivateKey.from_string(privateKeyString);
            const ciphertext = "ciphertext1qvqg7rgvam3xdcu55pwu6sl8rxwefxaj5gwthk0yzln6jv5fastzup0qn0qftqlqq7jcckyx03fzv9kke0z9puwd7cl7jzyhxfy2f2juplz39dkqs6p24urhxymhv364qm3z8mvyklv5gr52n4fxr2z59jgqytyddj8";
            const bad_ciphertext = "ciphertext1qvqg7rgvam3xdcu55pwu6sl8rxwefxaj5gwthk0yzln6jv5fastzup0qn0qftqlqq7jcckyx03fzv9kke0z9puwd7cl7jzyhxfy2f2juplz39dkqs6p24urhxymhv364qm3z8mvyklv5er52n4fxr2z59jgqytyddj8";
            const privateKeyCiphertext = PrivateKeyCiphertext.fromString(ciphertext);
            const decryptedPrivateKey = privateKeyCiphertext.decryptToPrivateKey("mypassword");

            // Assert that the private key is the same as the original for a valid ciphertext and secret
            expect(privateKey.to_string()).toEqual(decryptedPrivateKey.to_string());
            // Assert the incorrect secret fails
            expect(() => {
                privateKeyCiphertext.decryptToPrivateKey("badpassword");
            }).toThrow();
            // Ensure invalid ciphertexts fail
            expect(() => {
                PrivateKeyCiphertext.fromString(bad_ciphertext);
            }).toThrow();
        });
    });

    describe('RecordCiphertext', () => {
        const viewKey = ViewKey.from_string(viewKeyString);
        const ciphertext = RecordCiphertext.fromString(recordCiphertextString);

        it('can be created from and output to a string', () => {
            const ciphertext = RecordCiphertext.fromString(recordCiphertextString);

            // Ensure the string matches the string the record was created from
            expect(ciphertext.toString()).toEqual(recordCiphertextString);
        });

        it('can be decrypted and identified as owner with a valid view key', () => {
            const plaintext = ciphertext.decrypt(viewKey);
            const isOwner = ciphertext.isOwner(viewKey);

            // Ensure the record ciphertext is decrypted correctly
            expect(plaintext.toString()).toEqual(recordPlaintextString);
            // Ensure the view key is identified as the owner of the record
            expect(isOwner).toBe(true);
        });

        it('cant be decrypted nor identified as owner with a foreign view key', () => {
            const foreignViewKey = ViewKey.from_string(foreignViewKeyString);

            // Ensure the record ciphertext cannot be decrypted with a foreign view key
            expect(ciphertext.isOwner(foreignViewKey)).toBe(false);
            // Ensure the record ciphertext cannot be decrypted with a foreign view key
            expect(() => ciphertext.decrypt(foreignViewKey)).toThrow();
        });
    });

    describe('RecordPlaintext', () => {
        it('can be created from a string gives the correct number of microcredits, and can export to a string', () => {
            const plaintext = RecordPlaintext.fromString(recordPlaintextString);

            // Ensure the string matches the string the record was created from
            expect(plaintext.toString()).toEqual(recordPlaintextString);
            // Ensure the record has the correct number of microcredits
            expect(plaintext.microcredits()).toEqual(BigInt(1500000000000000));
        });
    });

    
});