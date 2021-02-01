const aleo = require('aleo-wasm');

class Account {
    constructor() {
        this.account = new aleo.Account();
    }

    privateKey() {
        return this.account.to_private_key();
    }

    viewKey() {
        return this.account.to_view_key();
    }

    address() {
        return this.account.to_address();
    }
}

module.exports.Account = Account;

console.log(new Account().address());
