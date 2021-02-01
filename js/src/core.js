const aleo = require('aleo-wasm');

class Account {
    constructor() {
        const account = new aleo.Account();
        this.privateKey = account.to_string();
    }

    to_string() {
        return this.privateKey;
    }
}

module.exports.Account = Account;

console.log(new Account().to_string());
