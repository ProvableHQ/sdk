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
}

module.exports.Account = Account;

console.log(new Account().address());
