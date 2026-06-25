import { expect } from "chai";
import { Address, AleoNetworkClient, CREDITS_PROGRAM_KEYS, DynamicRecord, ExecutionRequest, Field, FunctionKeyPair, Plaintext, PrivateKey, ViewKey, Signature, RecordCiphertext, RecordPlaintext, PrivateKeyCiphertext, EncryptionToolkit, Transition, Value, VerifyingKey, AleoKeyProvider, getOrInitConsensusVersionTestHeights} from "../src/node.js";
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
} from "./data/account-data.js";
import {
    CREDITS_RECORD_V1,
    CREDITS_RECORD_VIEW_KEY,
    CREDITS_SENDER_CIPHERTEXT,
    CREDITS_SENDER_PLAINTEXT,
    RECORD_CIPHERTEXT_STRING,
    RECORD_CIPHERTEXT_STRING_COPY,
    RECORD_CIPHERTEXT_STRING_NOT_OWNED,
    RECORD_CIPHERTEXT_STRING_NOT_OWNED2,
    RECORD_PLAINTEXT_V0_STRING,
    RECORD_VIEW_KEY_STRING,
    VIEW_KEY_STRING,
} from "./data/records.js";
import process from "node:process";

describe('WASM Objects', () => {
    describe('Address', () => {
        it('can be constructed from a private key', () => {
            const privateKey = PrivateKey.from_string(privateKeyString);
            const address = Address.from_private_key(privateKey);

            // Ensure the address is an instance of Address
            expect(address).instanceof(Address);
            // Ensure the address string matches the expected value
            expect(address.to_string()).string(addressString);
        });

        it('can be constructed from view key', () => {
            const viewKey = ViewKey.from_string(viewKeyString);
            const address = Address.from_view_key(viewKey);

            // Ensure the address is an instance of Address
            expect(address).instanceof(Address);
            // Ensure the address string matches the expected value
            expect(address.to_string()).string(addressString);
        });

        it('can be constructed from an address string', () => {
            const address = Address.from_string(addressString);

            // Ensure the address is an instance of Address
            expect(address).instanceof(Address);
            // Ensure the address string matches the expected value
            expect(address.to_string()).string(addressString);
        });

        it('can verify a message signed by the correct private key', () => {
            const privateKey = PrivateKey.from_string(privateKeyString);
            const signature = privateKey.sign(message);
            const address = Address.from_private_key(privateKey);
            const result = address.verify(message, signature);

            // Ensure the result is a boolean
            expect(typeof result).equal('boolean');
            // Ensure the signature verified
            expect(result).equal(true);
        });

        it('cannot verify a message signed by the wrong private key', () => {
            const privateKey = new PrivateKey();
            const otherPrivateKey = new PrivateKey();
            const signature = otherPrivateKey.sign(message);
            const address = Address.from_private_key(privateKey);
            const result = address.verify(message, signature);

            // Ensure the result is a boolean
            expect(typeof result).equal('boolean');
            // Ensure the signature failed to verify
            expect(result).equal(false);
        });

        it('validates a correct address string with isValid', () => {
            const result = Address.isValid(addressString);
            expect(result).equal(true);
        });

        it('returns false for an invalid address string with isValid', () => {
            expect(Address.isValid('invalid_address')).equal(false);
            expect(Address.isValid('aleo1xyz')).equal(false);
            expect(Address.isValid('')).equal(false);
        });

        it('validates correct address bytes with isValid', () => {
            const address = Address.from_string(addressString);
            const bytes = address.toBytesLe();
            expect(Address.isValid(bytes)).equal(true);
        });

        it('returns false for invalid address bytes with isValid', () => {
            expect(Address.isValid(new Uint8Array([1, 2, 3]))).equal(false);
            expect(Address.isValid(new Uint8Array([]))).equal(false);
        });

        it('accepts uppercase address strings with isValid (auto-lowercased)', () => {
            const uppercaseAddress = addressString.toUpperCase();
            expect(Address.isValid(uppercaseAddress)).equal(true);
        });

        it('accepts mixed case address strings with isValid (auto-lowercased)', () => {
            const mixedCaseAddress = addressString.charAt(0).toUpperCase() + addressString.slice(1);
            expect(Address.isValid(mixedCaseAddress)).equal(true);
        });

        it('auto-lowercases address strings in from_string', () => {
            const uppercaseAddress = addressString.toUpperCase();
            const mixedCaseAddress = addressString.charAt(0).toUpperCase() + addressString.slice(1);

            const expected = Address.from_string(addressString);
            expect(Address.from_string(uppercaseAddress).to_string()).equal(expected.to_string());
            expect(Address.from_string(mixedCaseAddress).to_string()).equal(expected.to_string());
        });
    });

    describe('PrivateKey', () => {
        it ('creates new accounts from sampling an rng for the initial seed', () => {
            const privateKey = new PrivateKey();
            const privateKey2 = new PrivateKey();

            // Ensure the private key is a PrivateKey instance
            expect(privateKey).instanceof(PrivateKey);
            // Ensure the private key is a PrivateKey instance
            expect(privateKey2).instanceof(PrivateKey);
            // Ensure the private keys are different
            expect(privateKey.to_string()).not.equal(privateKey2.to_string());
        });

        it('constructs properly from a seed', () => {
            const privateKey = PrivateKey.from_seed_unchecked(seed);

            // Ensure the private key is a PrivateKey instance
            expect(privateKey).instanceof(PrivateKey);
            // Ensure the private key is the correct value
            expect(privateKey.to_string()).string(beaconPrivateKeyString);
        });

        it('constructs properly from a private key string', () => {
            const privateKey = PrivateKey.from_string(privateKeyString);

            // Ensure the private key is a PrivateKey instance
            expect(privateKey).instanceof(PrivateKey);
            // Ensure the private key is the correct value
            expect(privateKey.to_string()).string(privateKeyString);
        });

        it('derives the correct view key and address', () => {
            const privateKey = PrivateKey.from_string(privateKeyString);
            const viewKey = privateKey.to_view_key();
            const address = privateKey.to_address();

            // Ensure the view key and address are the correct types
            expect(viewKey).instanceof(ViewKey);
            expect(address).instanceof(Address);
            // Ensure the view key and address are the correct values
            expect(viewKey.to_string()).string(viewKeyString);
            expect(address.to_string()).string(addressString);
        });

        it('can construct directly to ciphertext and then decrypt to a private key', () => {
            const secret = 'mypassword';
            const ciphertext = PrivateKey.newEncrypted(secret);
            const privateKeyFromCiphertext = PrivateKey.fromPrivateKeyCiphertext(ciphertext, secret);

            // Ensure the ciphertext is a PrivateKeyCiphertext instance
            expect(ciphertext).instanceof(PrivateKeyCiphertext);
            // Ensure the decrypted private key is a PrivateKey instance
            expect(privateKeyFromCiphertext).instanceof(PrivateKey);
        });

        it('encrypts and decrypts to and from ciphertext', () => {
            const secret = 'mypassword';
            const privateKey = new PrivateKey();
            const ciphertext = privateKey.toCiphertext(secret);

            // Ensure the ciphertext is a PrivateKeyCiphertext instance
            expect(ciphertext).instanceof(PrivateKeyCiphertext);
            const privateKeyFromCiphertext = PrivateKey.fromPrivateKeyCiphertext(ciphertext, secret);
            // Ensure the decrypted private key is a PrivateKey instance
            expect(privateKeyFromCiphertext).instanceof(PrivateKey);
            // Ensure the decrypted private key is the same as the original
            expect(privateKeyFromCiphertext.to_string()).equal(privateKey.to_string());
        });

        it('properly assesses equality and inequality', () => {
            const privateKey1 = new PrivateKey();
            const privateKey2 = PrivateKey.from_string(privateKeyString);
            const privateKey3 = PrivateKey.from_string(privateKeyString);

            // Ensure the different private keys are not equal
            expect(privateKey1).not.equal(privateKey2);
            // Ensure the same private keys are equal
            expect(privateKey2).equal(privateKey2);
            expect(privateKey2.to_string()).equal(privateKey3.to_string());
        });

        it('has different ciphertexts for the same password, but decrypts to the same key', () => {
            const secret = 'mypassword';
            const privateKey = PrivateKey.from_string(privateKeyString);
            const ciphertext = privateKey.toCiphertext(secret);
            const ciphertext2 = privateKey.toCiphertext(secret);
            const decryptedPrivateKey = PrivateKey.fromPrivateKeyCiphertext(ciphertext, secret);
            const decryptedPrivateKey2 = PrivateKey.fromPrivateKeyCiphertext(ciphertext2, secret);

            // Ensure the ciphertexts are different
            expect(ciphertext).not.equal(ciphertext2);
            // Ensure the decrypted private keys are both PrivateKey instances
            expect(decryptedPrivateKey).instanceof(PrivateKey);
            expect(decryptedPrivateKey2).instanceof(PrivateKey);
            // Ensure the decrypted private keys are the same as the original
            expect(decryptedPrivateKey.to_string()).equal(privateKeyString);
            expect(decryptedPrivateKey2.to_string()).equal(privateKeyString);
            expect(decryptedPrivateKey.to_string()).equal(decryptedPrivateKey2.to_string());
        });
    });

    describe('ViewKey', () => {
        const viewKey = ViewKey.from_string(viewKeyString);

        it('constructs properly from a string', () => {
            // Ensure the view key is a ViewKey instance
            expect(viewKey).instanceof(ViewKey);
            // Ensure the view key is the correct value
            expect(viewKey.to_string()).string(viewKeyString);
        });

        it('derives the correct address', () => {
            const address = viewKey.to_address();

            // Ensure the address is an Address instance
            expect(address).instanceof(Address);
            // Ensure the address is the correct value
            expect(address.to_string()).string(addressString);
        });

        it('properly assesses equality and inequality', () => {
            const viewKey1 = new ViewKey();
            const viewKey2 = ViewKey.from_string(viewKeyString);
            const viewKey3 = ViewKey.from_string(viewKeyString);

            // Ensure the different view keys are not equal
            expect(viewKey1).not.equal(viewKey2);
            // Ensure the same view keys are equal
            expect(viewKey2).equal(viewKey2);
            expect(viewKey2.to_string()).equal(viewKey3.to_string());
        });

        it('can decrypt a record generated by the account', () => {
            const decryptedRecord = viewKey.decrypt(recordCiphertextString);

            // Ensure it decrypts to the correct data
            expect(decryptedRecord).equal(recordPlaintextString);
        });
    });

    describe('Signature', () => {
        const privateKey = new PrivateKey();

        it('can verify a message signed by the correct private key', () => {
            const address = Address.from_private_key(privateKey);
            const signature = Signature.sign(privateKey, message);
            const result = signature.verify(address, message);

            // Ensure the result is a boolean
            expect(typeof result).equal('boolean');
            // Ensure the signature verified
            expect(result).equal(true);
        });

        it('cannot verify a message signed by the wrong private key', () => {
            const address = Address.from_private_key(privateKey);
            const otherPrivateKey = PrivateKey.from_string(privateKeyString);
            const signature = Signature.sign(otherPrivateKey, message);
            const result = signature.verify(address, message);

            // Ensure the result is a boolean
            expect(typeof result).equal('boolean');
            // Ensure the signature failed to verify
            expect(result).equal(false);
        });

        it('can go to and from string', () => {
            const signature = Signature.sign(privateKey, message);
            const signatureString = signature.to_string();
            const signatureFromString = Signature.from_string(signatureString);

            // Ensure the signature is a Signature instance
            expect(signature).instanceof(Signature);
            // Ensure from_string returns a Signature instance
            expect(signatureFromString).instanceof(Signature);
            // Ensure the signature to_string matches the expected values
            expect(signature.to_string()).equal(signatureString);
            expect(signatureFromString.to_string()).equal(signatureString);
        });
    });

    describe('PrivateKeyCipherText', () => {
        const privateKey = PrivateKey.from_string(privateKeyString);
        const secret = 'mypassword';
        const ciphertext = PrivateKeyCiphertext.encryptPrivateKey(privateKey, secret);

        it('should encrypt and decrypt a private key to and from ciphertext', () => {
            const decryptedKey = ciphertext.decryptToPrivateKey(secret);

            // Ensure the decrypted key is a PrivateKey instance and is the same as the original
            expect(decryptedKey).instanceof(PrivateKey);
            expect(decryptedKey.to_string()).equal(privateKeyString);
        });

        it('should fail to decrypt with a bad secret', () => {
            const badSecret = 'badpassword';

            try {
                ciphertext.decryptToPrivateKey(badSecret);
                // Should not get here
                expect(true).equal(false);
            } catch (e) {
                // Should error out
                expect(true).equal(true);
            }
        });

        it('should not create ciphertexts that match for the same password, but should decrypt to the same key', () => {
            const ciphertext2 = PrivateKeyCiphertext.encryptPrivateKey(privateKey, secret);
            const decryptedKey = ciphertext.decryptToPrivateKey(secret);
            const decryptedKey2 = ciphertext2.decryptToPrivateKey(secret);

            // Ensure the ciphertexts are different
            expect(ciphertext).not.equal(ciphertext2);
            // Ensure the decrypted are both private key instances and have the same key
            expect(decryptedKey).instanceof(PrivateKey);
            expect(decryptedKey2).instanceof(PrivateKey);
            expect(decryptedKey.to_string()).equal(privateKeyString);
            expect(decryptedKey2.to_string()).equal(privateKeyString);
        });

        it('round trip to and from string for PrivateKeyCiphertext', () => {
            const private_key = new PrivateKey();
            const password = "mypassword";
            const privateKeyCiphertext = PrivateKeyCiphertext.encryptPrivateKey(private_key, password);
            const privateKeyCipherText2 = PrivateKeyCiphertext.fromString(privateKeyCiphertext.toString());

            // Assert the round trip to and from string journey results in the same key
            expect(privateKeyCiphertext.toString()).equal(privateKeyCipherText2.toString());
        });

        it('decryption of PrivateKeyCiphertext with edge cases', () => {
            const privateKeyString = "APrivateKey1zkpAYS46Dq4rnt9wdohyWMwdmjmTeMJKPZdp5AhvjXZDsVG";
            const privateKey = PrivateKey.from_string(privateKeyString);
            const ciphertext = "ciphertext1qvqg7rgvam3xdcu55pwu6sl8rxwefxaj5gwthk0yzln6jv5fastzup0qn0qftqlqq7jcckyx03fzv9kke0z9puwd7cl7jzyhxfy2f2juplz39dkqs6p24urhxymhv364qm3z8mvyklv5gr52n4fxr2z59jgqytyddj8";
            const bad_ciphertext = "ciphertext1qvqg7rgvam3xdcu55pwu6sl8rxwefxaj5gwthk0yzln6jv5fastzup0qn0qftqlqq7jcckyx03fzv9kke0z9puwd7cl7jzyhxfy2f2juplz39dkqs6p24urhxymhv364qm3z8mvyklv5er52n4fxr2z59jgqytyddj8";
            const privateKeyCiphertext = PrivateKeyCiphertext.fromString(ciphertext);
            const decryptedPrivateKey = privateKeyCiphertext.decryptToPrivateKey("mypassword");

            // Assert that the private key is the same as the original for a valid ciphertext and secret
            expect(privateKey.to_string()).equal(decryptedPrivateKey.to_string());
            // Assert the incorrect secret fails
            expect(() => {
                privateKeyCiphertext.decryptToPrivateKey("badpassword");
            }).throw();
            // Ensure invalid ciphertexts fail
            expect(() => {
                PrivateKeyCiphertext.fromString(bad_ciphertext);
            }).throw();
        });
    });

    describe('RecordCiphertext', () => {
        const viewKey = ViewKey.from_string(viewKeyString);
        const ciphertext = RecordCiphertext.fromString(recordCiphertextString);

        it('can be created from and output to a string', () => {
            const ciphertext = RecordCiphertext.fromString(recordCiphertextString);

            // Ensure the string matches the string the record was created from
            expect(ciphertext.toString()).equal(recordCiphertextString);
        });

        it('can be decrypted and identified as owner with a valid view key', () => {
            const plaintext = ciphertext.decrypt(viewKey);
            const isOwner = ciphertext.isOwner(viewKey);

            // Ensure the record ciphertext is decrypted correctly
            expect(plaintext.toString()).equal(recordPlaintextString);
            // Ensure the view key is identified as the owner of the record
            expect(isOwner).equal(true);
        });

        it('cant be decrypted nor identified as owner with a foreign view key', () => {
            const foreignViewKey = ViewKey.from_string(foreignViewKeyString);

            // Ensure the record ciphertext cannot be decrypted with a foreign view key
            expect(ciphertext.isOwner(foreignViewKey)).equal(false);
            // Ensure the record ciphertext cannot be decrypted with a foreign view key
            expect(() => ciphertext.decrypt(foreignViewKey)).throw();
        });

        it('can be decrypted with a valid record view key', () => {
            const recordViewKey = ciphertext.recordViewKey(viewKey);
            const plaintext = ciphertext.decryptWithRecordViewKey(recordViewKey);
            const isOwner = ciphertext.isOwner(viewKey);

            // Ensure the record ciphertext is decrypted correctly
            expect(plaintext.toString()).equal(recordPlaintextString);
            expect(isOwner).equal(true);
        })

        it('cannot be decrypted with an invalid record view key', () => {
            const badRecordViewKey = ciphertext.recordViewKey(ViewKey.from_string(foreignViewKeyString));
            // Ensure the record ciphertext cannot be decrypted with an invalid record view key
            expect(() => ciphertext.decryptWithRecordViewKey(badRecordViewKey)).throw();
        })
    });

    describe('RecordPlaintext', () => {
        it('can be created from a string gives the correct number of microcredits, and can export to a string', () => {
            const plaintext = RecordPlaintext.fromString(recordPlaintextString);

            // Ensure the string matches the string the record was created from
            expect(plaintext.toString()).equal(recordPlaintextString);
            // Ensure the record has the correct number of microcredits
            expect(plaintext.microcredits()).equal(BigInt(1500000000000000));
        });
    });

    describe('DynamicRecord', () => {
        // A credits record with _version: 1u8 (hiding variant)
        const creditsRecord = RecordPlaintext.fromString(CREDITS_RECORD_V1);
        const dynamicRecord = DynamicRecord.fromRecord(creditsRecord);
        const dynamicRecordString = dynamicRecord.toString();

        it('can be created from a RecordPlaintext', () => {
            expect(dynamicRecord).instanceof(DynamicRecord);
        });

        it('round-trips through toString and fromString', () => {
            const parsed = DynamicRecord.fromString(dynamicRecordString);
            expect(parsed.toString()).equal(dynamicRecordString);
        });

        it('returns the correct owner address', () => {
            expect(dynamicRecord.owner().to_string()).equal('aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a');
        });

        it('returns the correct nonce', () => {
            expect(dynamicRecord.nonce().toString()).equal('3634848344765318974603121890869676775499130077229666060613233255327643175219group');
        });

        it('returns a non-empty root field', () => {
            const root = dynamicRecord.root();
            expect(root.toString()).to.be.a('string');
            expect(root.toString()).to.include('field');
        });

        it('is a hiding variant because _version is 1', () => {
            expect(dynamicRecord.isHiding()).equal(true);
        });

        it('round-trips through bytes', () => {
            const bytes = dynamicRecord.toBytesLe();
            const recovered = DynamicRecord.fromBytesLe(bytes);
            expect(recovered.owner().to_string()).equal(dynamicRecord.owner().to_string());
            expect(recovered.root().toString()).equal(dynamicRecord.root().toString());
            expect(recovered.nonce().toString()).equal(dynamicRecord.nonce().toString());
        });

        it('returns a non-empty array of field elements', () => {
            const fields = dynamicRecord.toFields();
            expect(fields).to.be.an('array');
            expect(fields.length).greaterThan(0);
        });

        it('returns a non-empty bit array', () => {
            const bits = dynamicRecord.toBitsLe();
            expect(bits).to.be.an('array');
            expect(bits.length).greaterThan(0);
        });

        it('can convert back to a RecordPlaintext', () => {
            const recovered = dynamicRecord.toRecord(true);
            expect(recovered).instanceof(RecordPlaintext);
            // Owner and nonce should round-trip
            expect(recovered.toString()).to.include('aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private');
        });

        it('throws on an invalid string', () => {
            expect(() => DynamicRecord.fromString('not a record')).throw();
        });
    });

    describe('Transition', () => {
        const transitionStringTestnet = `{"id":"au1u62jasyx78x9hktak24awyj38fz73aseq8g9cx98u8egd9pj9uxq3u6s2z","program":"hello_hello.aleo","function":"hello","inputs":[{"type":"public","id":"3748790614260807060977840590007893602934308327222309419419577452790958781330field","value":"1u32"},{"type":"private","id":"5954208307642819953251922459490586292095132973876550778604572231610245257004field","value":"ciphertext1qyq0m5mp0d2gzh2pv9p25z70gz2avhqdt3dp8y8thzwf3aq6g35zcqcuyptz3"}],"outputs":[{"type":"private","id":"1557506318887190915592751299113729867877933642317637206076176689093854281418field","value":"ciphertext1qyqzmhw8ln9r6uuyh0n5jrsqlt25wdggqp3d9yqyttpr3g7g00k2sysdf9rmv"}],"tpk":"7532444547840484531569841377269810017844130178606467837628364672670182422388group","tcm":"7292056195970541935877520517416922164990366931599720071937561392936678536563field","scm":"8283770351301010771186520129040704279224805960417079922462917369178354050332field"}`;
        const transitionTestnet = Transition.fromString(transitionStringTestnet);
        const transitionDecryptedStringTestnet = `{"id":"au1mhdz6jqm973v5vfkz2pwgv63p340c9tpvydxha2zs8w03746qcpqvx3yye","program":"hello_hello.aleo","function":"hello","inputs":[{"type":"public","id":"3748790614260807060977840590007893602934308327222309419419577452790958781330field","value":"1u32"},{"type":"public","id":"5954208307642819953251922459490586292095132973876550778604572231610245257004field","value":"2u32"}],"outputs":[{"type":"public","id":"1557506318887190915592751299113729867877933642317637206076176689093854281418field","value":"3u32"}],"tpk":"7532444547840484531569841377269810017844130178606467837628364672670182422388group","tcm":"7292056195970541935877520517416922164990366931599720071937561392936678536563field","scm":"8283770351301010771186520129040704279224805960417079922462917369178354050332field"}`
        const transitionDecryptedTestnet = Transition.fromString(transitionDecryptedStringTestnet);
        const transitionViewKeyStringTestnet = "3975242887442171718863200089461896014344887434842278474302914755871123010247field";

        const transitionStringMainnet = `{"id":"au1mguuz0dh20f78802m4z0py7n08xhl0pz60llzck63mhl8pc8l5xqxpwgtn","program":"hello_hello.aleo","function":"main","inputs":[{"type":"public","id":"6393584049543470937057043098611271993206122889317039351966319038535020834557field","value": "1u32"},{"type":"private","id":"8207446256045172951742235001162005156507562935942883128759030124682934277495field","value":"ciphertext1qyqqgz9qnupeld9vr4vuwp6yrpmhgtkvmgag5m7mmrruw0r6je666qgqdswk3"}],"outputs":[{"type":"private","id":"127469473292952941321346770257126666363371158501875622169294663492714835110field","value":"ciphertext1qyqyapkjuxm9dcslgyjf7hkr2k3dek500z40gjspnwvll0uawj23vzgggc405"}],"tpk":"7647553513996966044119163122930125808381703910407273818947266861843062002251group","tcm":"4479413938380109857414238205380483440836495997450846894155088299187217672609field","scm":"6461007226176477784737642021400489186736987671609840640950580467598882134642field"}`;
        const transitionMainnet = Transition.fromString(transitionStringMainnet);
        const transitionDecryptedStringMainnet = `{"id":"au1jl2ur42sj7hwe4r0alv6gnklqxj0fszrvu3q82gjcls5x6q9pyzqdgmu2k","program":"hello_hello.aleo","function":"main","inputs":[{"type":"public","id":"6393584049543470937057043098611271993206122889317039351966319038535020834557field","value":"1u32"},{"type":"public","id":"8207446256045172951742235001162005156507562935942883128759030124682934277495field","value":"2u32"}],"outputs":[{"type":"public","id":"127469473292952941321346770257126666363371158501875622169294663492714835110field","value":"3u32"}],"tpk":"7647553513996966044119163122930125808381703910407273818947266861843062002251group","tcm":"4479413938380109857414238205380483440836495997450846894155088299187217672609field","scm":"6461007226176477784737642021400489186736987671609840640950580467598882134642field"}`;
        const transitionDecryptedMainnet = Transition.fromString(transitionDecryptedStringMainnet);
        const transitionViewKeyStringMainnet = "8161419549946991944867064830365679191883723972221767444308198038592561311302field";

        const invalidTransitionViewKeyString = "5089075468761042335883809641276568724119791331127957254389204093712358605127field"
        const invalidTransitionViewKey = Field.fromString(invalidTransitionViewKeyString);
        const privateKey = PrivateKey.from_string("APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH");
        const viewKey = privateKey.to_view_key();

        let connection = new AleoNetworkClient("https://api.provable.com/v2");

        if (connection.network === "testnet") {
        it('can be decrypted with a valid transition view key', () => {
            const tvk = transitionTestnet.tvk(viewKey);
            const transitionDecryptedWithTVK = transitionTestnet.decryptTransition(tvk);
            // Ensure the transition is valid
            expect(transitionDecryptedWithTVK.toString()).equal(transitionDecryptedTestnet.toString());
        });

        it('cannot be decrypted with an invalid transition view key', () => {
            expect(() => transitionTestnet.decryptTransition(invalidTransitionViewKey).toThrow());
        });

        it('can generate a transition view key from a valid view key', () => {
            const generatedTransitionViewKey = transitionTestnet.tvk(viewKey);

            // Ensure the generated transition view key is the same as the one used to decrypt
            expect(generatedTransitionViewKey.toString()).equal(transitionViewKeyStringTestnet);
        });
    }
    if (connection.network === "mainnet") {
        const tvk = transitionMainnet.tvk(viewKey);
        it('can be decrypted with a valid transition view key', () => {
            const transitionDecryptedWithTVK = transitionMainnet.decryptTransition(tvk);
            // Ensure the transition is valid
            expect(transitionDecryptedWithTVK.toString()).equal(transitionDecryptedMainnet.toString());
        });

        it('cannot be decrypted with an invalid transition view key', () => {
            expect(() => transitionMainnet.decryptTransition(invalidTransitionViewKey)).to.throw();
        });

        it('can generate a transition view key from a valid view key', () => {
            const generatedTransitionViewKey = transitionMainnet.tvk(viewKey);

            // Ensure the generated transition view key is the same as the one used to decrypt
            expect(generatedTransitionViewKey.toString()).equal(transitionViewKeyStringMainnet);
        });
    }
});

    describe('EncryptionToolkit', () => {
        const recordCiphertext = RecordCiphertext.fromString(RECORD_CIPHERTEXT_STRING);
        const recordCiphertextNotOwned = RecordCiphertext.fromString(RECORD_CIPHERTEXT_STRING_NOT_OWNED);
        const recordCiphertextNotOwned2 = RecordCiphertext.fromString(RECORD_CIPHERTEXT_STRING_NOT_OWNED2);
        const recordCiphertextArray = [recordCiphertext, recordCiphertextNotOwned, recordCiphertextNotOwned2];
        const recordCiphertextArrayCopy = recordCiphertextArray.map(record => record.clone());
        const recordPlaintext = RecordPlaintext.fromString(RECORD_PLAINTEXT_V0_STRING);
        const recordPlaintextCopy = recordPlaintext.clone();
        const viewKey = ViewKey.from_string(VIEW_KEY_STRING);
        const recordViewKey = Field.fromString(RECORD_VIEW_KEY_STRING);
        
        it('can generate a record view key from a view key and a record ciphertext', () => {
            const generatedRecordViewKey = EncryptionToolkit.generateRecordViewKey(viewKey, recordCiphertext);
            // Ensure the generated record view key is the same as the one used to decrypt
            expect(generatedRecordViewKey.toString()).equal(recordViewKey.toString());
        });
        it('can decrypt a record ciphertext with the record view key', () => {
            const decryptedRecord = EncryptionToolkit.decryptRecordWithRVk(recordViewKey, recordCiphertext);
            // Ensure the decrypted record is the same as the plaintext
            expect(decryptedRecord.toString()).equal(recordPlaintext.toString());
        });
        it('cannot decrypt a record ciphertext with an invalid record view key', () => {
            const invalidRecordViewKey = Field.fromString("4445718830394614891114647247073357114867447866913203502139893824059966201724field");
            expect(() => EncryptionToolkit.decryptRecordWithRVk(invalidRecordViewKey, recordCiphertext)).to.throw();
        });
        it('can check if a record ciphertext from an array of record ciphertexts is owned by a view key', () => {
            const ownedRecords = EncryptionToolkit.checkOwnedRecords(viewKey, recordCiphertextArray);
            // Ensure the record ciphertext is owned by the view key
            expect(ownedRecords[0].toString()).equal(RECORD_CIPHERTEXT_STRING_COPY.toString());
        });
        it('can decrypt a record ciphertext from an array of record ciphertexts', () => {
            const decryptedRecords = EncryptionToolkit.decryptOwnedRecords(viewKey, recordCiphertextArrayCopy);
            // Ensure the decrypted record is the same as the plaintext
            expect(decryptedRecords[0].toString()).equal(recordPlaintextCopy.toString());
        });
        it('can decrypt sender ciphertexts', () => {
            // Get the private key corresponding to the record.
            const private_key = PrivateKey.from_string(<string>process.env["PUZZLE_PK"]);
            const view_key = ViewKey.from_private_key(private_key);

            // Construct the record and the sender ciphertext.
            const record = RecordPlaintext.fromString(CREDITS_RECORD_V1);
            const record_view_key = Field.fromString(CREDITS_RECORD_VIEW_KEY);
            const sender_ciphertext = Field.fromString(CREDITS_SENDER_CIPHERTEXT);

            // Decrypt the sender ciphertext using the record object and ensure it's from the expected address.
            let sender = record.decryptSender(view_key, sender_ciphertext);
            expect(sender.to_string()).to.equal(CREDITS_SENDER_PLAINTEXT);

            // Decrypt the sender ciphertext using the EncryptionToolkit function and ensure it's from the expected address.
            sender = EncryptionToolkit.decryptSender(view_key, record, sender_ciphertext);
            expect(sender.to_string()).to.equal(CREDITS_SENDER_PLAINTEXT);

            // Decrypt the sender ciphertext using only the record view key and ensure it's from the expected address.
            sender = EncryptionToolkit.decryptSenderWithRvk(record_view_key, sender_ciphertext);
            expect(sender.to_string()).to.equal(CREDITS_SENDER_PLAINTEXT);
        })
        it('can decryption')
    });
    describe('VerifyingKey', () => {
        it('can get the number of constraints', async () => {
            const keyProvider = new AleoKeyProvider();
            const [transferPublicProver, transferPublicVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public);
            const numConstraints = transferPublicVerifier.numConstraints();
            expect(numConstraints).to.equal(12326);
        });
    });
    describe('Set development consensus version heights', () => {
        it('Consensus version heights can be set externally', async () => {
            if (process.env["RUN_SKIPPED"]) {
                const heights = getOrInitConsensusVersionTestHeights("0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15");
                console.log(heights);
                expect(heights).to.deep.equal([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);
            }
        });
    });
    describe('Value', () => {
        const plaintextLiteral = "100u64";
        const plaintextStruct = "{\n  microcredits: 100000000u64,\n  height: 1653124u32\n}";
        const recordValue = "{ owner: aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah.private, token_amount: 100u64.private, _nonce: 0group.public }";
        const futureValue = "{\n  program_id: credits.aleo,\n  function_name: transfer,\n  arguments: [\n    aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah,\n    100000000u64\n  ]\n}";

        it('can parse a plaintext literal and round-trip via string', () => {
            const value = Value.fromString(plaintextLiteral);
            expect(value.toString()).to.equal(plaintextLiteral);
            expect(value.valueType()).to.equal("plaintext");
            expect(value.isPlaintext()).to.be.true;
            expect(value.isRecord()).to.be.false;
            expect(value.isFuture()).to.be.false;
        });

        it('can parse a plaintext struct and round-trip via string', () => {
            const value = Value.fromString(plaintextStruct);
            expect(value.toString()).to.equal(plaintextStruct);
            expect(value.valueType()).to.equal("plaintext");
            expect(value.isPlaintext()).to.be.true;
        });

        it('can parse a record value', () => {
            const value = Value.fromString(recordValue);
            expect(value.valueType()).to.equal("record");
            expect(value.isRecord()).to.be.true;
            expect(value.isPlaintext()).to.be.false;
        });

        it('can parse a future value', () => {
            const value = Value.fromString(futureValue);
            expect(value.valueType()).to.equal("future");
            expect(value.isFuture()).to.be.true;
            expect(value.isPlaintext()).to.be.false;
            expect(value.isRecord()).to.be.false;
        });

        it('can round-trip all variants via bytes', () => {
            for (const str of [plaintextLiteral, plaintextStruct, recordValue, futureValue]) {
                const value = Value.fromString(str);
                const bytes = value.toBytesLe();
                const recovered = Value.fromBytesLe(bytes);
                expect(recovered.toString()).to.equal(value.toString());
            }
        });

        it('can extract inner Plaintext', () => {
            const value = Value.fromString(plaintextLiteral);
            const plaintext = value.toPlaintext();
            expect(plaintext.toString()).to.equal(plaintextLiteral);
        });

        it('can extract inner RecordPlaintext', () => {
            const value = Value.fromString(recordValue);
            const record = value.toRecordPlaintext();
            expect(record.toString()).to.equal(value.toString());
        });

        it('throws on wrong variant extraction', () => {
            const plaintextValue = Value.fromString(plaintextLiteral);
            expect(() => plaintextValue.toRecordPlaintext()).to.throw();

            const recordVal = Value.fromString(recordValue);
            expect(() => recordVal.toPlaintext()).to.throw();
        });

        it('throws on invalid string', () => {
            expect(() => Value.fromString("not_a_valid_value")).to.throw();
        });

        it('can produce bits', () => {
            const value = Value.fromString(plaintextLiteral);
            const bits = value.toBitsLe();
            expect(bits.length).to.be.greaterThan(0);
        });

        it('can produce fields and raw fields', () => {
            const value = Value.fromString(plaintextLiteral);
            const fields = value.toFields();
            expect(fields.length).to.be.greaterThan(0);
            const fieldsRaw = value.toFieldsRaw();
            expect(fieldsRaw.length).to.be.greaterThan(0);
        });

        it('can construct from Plaintext object', () => {
            const plaintext = Plaintext.fromString(plaintextLiteral);
            const value = Value.fromPlaintext(plaintext);
            expect(value.isPlaintext()).to.be.true;
            expect(value.toString()).to.equal(plaintextLiteral);
        });

        it('can construct from RecordPlaintext object', () => {
            const record = RecordPlaintext.fromString(recordValue);
            const value = Value.fromRecordPlaintext(record);
            expect(value.isRecord()).to.be.true;
        });
    });

    describe("ProgramID", () => {
        let connection = new AleoNetworkClient("https://api.explorer.provable.com/v2");
        it("Can can successfully get the correct address from a ProgramID string.", () => {
            const programIDString = "credits.aleo";
            if (connection.network === "mainnet") {
                const programAddress = Address.fromProgramId(programIDString);
                expect(programAddress.to_string()).to.equal("aleo1lqmly7ez2k48ajf5hs92ulphaqr05qm4n8qwzj8v0yprmasgpqgsez59gg");
            }
            if (connection.network === "testnet") {
                const programAddress = Address.fromProgramId(programIDString);
                expect(programAddress.to_string()).to.equal("aleo1lqmly7ez2k48ajf5hs92ulphaqr05qm4n8qwzj8v0yprmasgpqgsez59gg");
            }
        });
    })
});

describe('ExecutionRequest error handling', () => {
    it('Should throw a descriptive error for structurally invalid requests', () => {
        const invalidRequest = JSON.stringify({
            signer: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
            network: "1u16",
            program: "credits.aleo",
            function: "transfer_public",
            input_ids: [{ type: "public", id: "0field" }],
            inputs: ["aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "100u64"],
            signature: "sign1invalid",
            sk_tag: "0field",
            tvk: "0field",
            tcm: "0field",
            scm: "0field",
        });

        let threw = false;
        try {
            ExecutionRequest.fromString(invalidRequest);
        } catch (e) {
            threw = true;
            expect(e).to.not.be.instanceOf(WebAssembly.RuntimeError);
        }
        expect(threw, "Expected fromString to throw for invalid request").to.be.true;
    });

    it('Should throw a descriptive error for completely invalid strings', () => {
        let threw = false;
        try {
            ExecutionRequest.fromString("not a valid request at all");
        } catch (e) {
            threw = true;
            expect(e).to.not.be.instanceOf(WebAssembly.RuntimeError);
        }
        expect(threw, "Expected fromString to throw for invalid string").to.be.true;
    });

    it('Should throw a descriptive error when sign() receives invalid inputs', () => {
        const privateKey = PrivateKey.from_string(
            "APrivateKey1zkp7Vc4xJt8HqW9U7VhY6h32d8Z9Xi5C6ZZX3gtXxbBSJmj"
        );

        try {
            ExecutionRequest.sign(
                privateKey,
                "credits.aleo",
                "nonexistent_function",
                ["invalid_input"],
                ["invalid_type"],
                undefined,
                undefined,
                true,
            );
            expect.fail("Should have thrown an error");
        } catch (e) {
            const msg = `${e}`;
            expect(e).to.not.be.instanceOf(WebAssembly.RuntimeError);
            expect(msg).to.include("Failed to deserialize input");
        }
    });
});
