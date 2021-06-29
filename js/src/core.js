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

class Record {
    constructor() {
        this.record = new aleo.Record();
    }

    to_string() {
        return this.record.to_string();
    }

    owner() {
        return this.record.owner();
    }

    value() {
        return this.record.value();
    }

    is_dummy() {
        return this.record.is_dummy();
    }

    payload() {
        return this.record.payload();
    }

    birth_program_id() {
        return this.record.birth_program_id();
    }

    death_program_id() {
        return this.record.death_program_id();
    }

    serial_number_nonce() {
        return this.record.serial_number_nonce();
    }

    commitment() {
        return this.record.commitment();
    }

    commitment_randomness() {
        return this.record.commitment_randomness();
    }
}

class Transaction {
    constructor() {
        this.transaction = new aleo.Transaction();
    }

    to_string() {
        return this.transaction.to_string();
    }

    transaction_id() {
        return this.transaction.transaction_id();
    }

    network_id() {
        return this.transaction.network_id();
    }

    ledger_digest() {
        return this.transaction.ledger_digest();
    }

    inner_circuit_id() {
        return this.transaction.inner_circuit_id();
    }

    old_serial_numbers() {
        return this.transaction.old_serial_numbers();
    }

    new_commitments() {
        return this.transaction.new_commitments();
    }

    program_commitment() {
        return this.transaction.program_commitment();
    }

    local_data_root() {
        return this.transaction.local_data_root();
    }

    value_balance() {
        return this.transaction.value_balance();
    }

    encrypted_records() {
        return this.transaction.encrypted_records();
    }

    memorandum() {
        return this.transaction.memorandum();
    }

    size() {
        return this.transaction.size();
    }
}

module.exports.Account = Account;
module.exports.Record = Record;
module.exports.Transaction = Transaction;

console.log("New Account:");
console.log(new Account().address());
console.log("");

console.log("New Record:");
console.log(new Record().to_string());
console.log("");

