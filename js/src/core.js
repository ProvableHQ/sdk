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
}

class CipherTextRecord {
    constructor(cipherTextRecord) {
        this.cipher_text_record = CipherTextRecord.fromString()
    }

    decrypt(view_key) {
        this.cipher_text_record.decrypt(view_key)
    }

    is_owner(view_key) {
        return this.cipher_text_record.is_owner(view_key)
    }

    static fromString(cipherTextRecord) {
        return aleo.CipherTextRecord.from_string(cipherTextRecord);
    }
}

class PlainTextRecord {
    constructor(plainTextRecord) {
        this.plain_text_record = PlainTextRecord.fromString()
    }

    gates() {
        return this.plain_text_record.gates();
    }

    static fromString(plainTextRecord) {
        return aleo.PlainTextRecord.from_string(plainTextRecord);
    }
}

module.exports.Account = Account;
module.exports.CipherTextRecord = CipherTextRecord;
module.exports.PlainTextRecord = PlainTextRecord;