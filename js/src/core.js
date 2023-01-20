const aleo = require('aleo-wasm');

class Account {
    constructor() {
        this.private_key = new aleo.PrivateKey();
    }

    privateKey() {
        return this.private_key.to_string();
    }

    viewKey() {
        return this.private_key.to_view_key();
    }

    address() {
        return this.private_key.to_address();
    }

    sign(message) {
        return this.private_key.sign(message);
    }

    verify(message, signature) {
        return this.private_key.to_address().verify(message, signature);
    }

    static fromPrivateKey(privateKey) {
        return aleo.PrivateKey.from_string(privateKey);
    }

    static viewKeyFromString(viewKey) {
        return aleo.ViewKey.from_string(viewKey);
    }

    static addressFromString(address) {
        return aleo.Address.from_string(address);
    }
}

class RecordCiphertext {
    constructor(ciphertext) {
        this.ciphertext = RecordCiphertext.from_string(ciphertext)
    }

    decrypt(viewKey) {
        this.ciphertext.decrypt(viewKey)
    }

    isOwner(viewKey) {
        return this.ciphertext.is_owner(viewKey)
    }

    static fromString(ciphertext) {
        return aleo.RecordCiphertext.from_string(ciphertext);
    }
}

class RecordPlaintext {
    constructor(plaintext) {
        this.plaintext = RecordPlaintext.from_string(plaintext)
    }

    gates() {
        return this.plaintext.gates();
    }

    static fromString(plaintext) {
        return aleo.RecordPlaintext.from_string(plaintext);
    }
}

module.exports.Account = Account;
module.exports.RecordCiphertext = RecordCiphertext;
module.exports.RecordPlaintext = RecordPlaintext;
