use crate::{
    bytes_error_result, bytes_success_result,
    encryption::field::field_from_value,
    ensure_record_ciphertext_storage, ensure_record_plaintext_storage, ensure_view_key_storage,
    ffi, get_next_id,
    types::{
        ExecutionNative, InputNative, OutputNative, ProgramNative, RecordCiphertextNative,
        RecordPlaintextNative, TransactionNative, TransitionNative, U64Native,
    },
    FieldHandle,
};
use serde_json::{json, Value};
use snarkvm_console::prelude::{Error as ConsoleError, FromBytes, ToBytes};
use std::{ops::Deref, str::FromStr, sync::Mutex};

pub type Result<T> = std::result::Result<T, String>;

pub struct TransactionHandle {
    inner: Mutex<TransactionNative>,
}

impl TransactionHandle {
    pub(crate) fn new(transaction: TransactionNative) -> Self {
        Self {
            inner: Mutex::new(transaction),
        }
    }

    fn with<R>(&self, f: impl FnOnce(&TransactionNative) -> R) -> R {
        let guard = self.inner.lock().expect("Transaction mutex poisoned");
        f(guard.deref())
    }

    pub fn transaction_clone(&self) -> Box<TransactionHandle> {
        let cloned = self.with(|transaction| transaction.clone());
        Box::new(TransactionHandle::new(cloned))
    }

    pub fn transaction_to_string(&self) -> String {
        self.with(|transaction| transaction.to_string())
    }

    pub fn transaction_to_bytes_le(&self) -> ffi::BytesResult {
        self.with(|transaction| match transaction.to_bytes_le() {
            Ok(bytes) => bytes_success_result(bytes),
            Err(error) => bytes_error_result(error.to_string()),
        })
    }

    pub fn transaction_contains_serial_number(&self, serial_number_handle: &FieldHandle) -> bool {
        let serial_number = serial_number_handle.clone_value();
        self.with(|transaction| transaction.contains_serial_number(&serial_number))
    }

    pub fn transaction_contains_commitment(&self, commitment_handle: &FieldHandle) -> bool {
        let commitment = commitment_handle.clone_value();
        self.with(|transaction| transaction.contains_commitment(&commitment))
    }

    pub fn transaction_find_record(&self, commitment_handle: &FieldHandle) -> ffi::HandleResult {
        let commitment = commitment_handle.clone_value();
        self.with(|transaction| {
            if let Some(record) = transaction.find_record(&commitment) {
                let handle_id = store_record_ciphertext(&record);
                ffi::HandleResult {
                    success: true,
                    handle: handle_id,
                    error: String::new(),
                }
            } else {
                ffi::HandleResult {
                    success: false,
                    handle: 0,
                    error: "Record not found".to_string(),
                }
            }
        })
    }

    pub fn transaction_base_fee_amount(&self) -> u64 {
        self.with(|transaction| unwrap_u64_result(transaction.base_fee_amount()))
    }

    pub fn transaction_fee_amount(&self) -> u64 {
        self.with(|transaction| unwrap_u64_result(transaction.fee_amount()))
    }

    pub fn transaction_priority_fee_amount(&self) -> u64 {
        self.with(|transaction| unwrap_u64_result(transaction.priority_fee_amount()))
    }

    pub fn transaction_is_deploy(&self) -> bool {
        self.with(|transaction| transaction.is_deploy())
    }

    pub fn transaction_is_execute(&self) -> bool {
        self.with(|transaction| transaction.is_execute())
    }

    pub fn transaction_is_fee(&self) -> bool {
        self.with(|transaction| transaction.is_fee())
    }

    pub fn transaction_id(&self) -> String {
        self.with(|transaction| transaction.id().to_string())
    }

    pub fn transaction_type(&self) -> String {
        self.with(|transaction| match transaction {
            TransactionNative::Deploy(..) => "deploy".to_string(),
            TransactionNative::Execute(..) => "execute".to_string(),
            TransactionNative::Fee(..) => "fee".to_string(),
        })
    }

    pub fn transaction_owned_records(&self, view_key_handle: &ffi::ViewKeyHandle) -> Vec<u64> {
        let storage = ensure_view_key_storage();
        let view_keys = storage.lock().unwrap();
        let Some(view_key) = view_keys.get(&view_key_handle.id) else {
            return Vec::new();
        };

        self.with(|transaction| {
            transaction
                .records()
                .filter_map(|(_, record_ciphertext)| {
                    record_ciphertext
                        .decrypt(view_key)
                        .ok()
                        .map(|plaintext| store_record_plaintext(&plaintext))
                })
                .collect()
        })
    }

    pub fn transaction_records(&self) -> Vec<ffi::TransactionRecordEntry> {
        self.with(|transaction| {
            transaction
                .records()
                .map(
                    |(commitment, record_ciphertext)| ffi::TransactionRecordEntry {
                        commitment: field_from_value(commitment.clone()),
                        record_handle: store_record_ciphertext(record_ciphertext),
                    },
                )
                .collect()
        })
    }

    pub fn transaction_deployed_program(&self) -> Result<Box<crate::program::ProgramHandle>> {
        self.with(|transaction| {
            if let Some(deployment) = transaction.deployment() {
                let program: ProgramNative = deployment.program().clone();
                Ok(Box::new(crate::program::ProgramHandle::new(program)))
            } else {
                Err("Transaction is not a deployment transaction".to_string())
            }
        })
    }

    pub fn transaction_verifying_keys(&self) -> Vec<ffi::TransactionVerifyingKey> {
        self.with(|transaction| {
            transaction
                .deployment()
                .map(|deployment| {
                    deployment
                        .verifying_keys()
                        .iter()
                        .map(|(function_name, (verifying_key, certificate))| {
                            ffi::TransactionVerifyingKey {
                                program: deployment.program_id().to_string(),
                                function: function_name.to_string(),
                                verifying_key: verifying_key.to_string(),
                                certificate: certificate.to_string(),
                            }
                        })
                        .collect()
                })
                .unwrap_or_default()
        })
    }

    pub fn transaction_transitions(&self) -> Vec<String> {
        self.with(|transaction| {
            transaction
                .transitions()
                .map(|transition| transition.to_string())
                .collect()
        })
    }

    pub fn transaction_summary(&self) -> Result<String> {
        self.with(|transaction| build_summary(transaction))
    }
}

pub fn transaction_from_string(transaction: &str) -> Result<Box<TransactionHandle>> {
    TransactionNative::from_str(transaction)
        .map_err(|error| error.to_string())
        .map(|transaction| Box::new(TransactionHandle::new(transaction)))
}

pub fn transaction_from_bytes_le(bytes: Vec<u8>) -> Result<Box<TransactionHandle>> {
    TransactionNative::from_bytes_le(&bytes)
        .map_err(|error| error.to_string())
        .map(|transaction| Box::new(TransactionHandle::new(transaction)))
}

fn unwrap_u64_result(value: std::result::Result<U64Native, ConsoleError>) -> u64 {
    value.ok().map(|fee| *fee).unwrap_or(0)
}

fn store_record_ciphertext(record: &RecordCiphertextNative) -> u64 {
    let id = get_next_id();
    let storage = ensure_record_ciphertext_storage();
    let mut records = storage.lock().unwrap();
    records.insert(id, record.clone());
    id
}

fn store_record_plaintext(record: &RecordPlaintextNative) -> u64 {
    let id = get_next_id();
    let storage = ensure_record_plaintext_storage();
    let mut records = storage.lock().unwrap();
    records.insert(id, record.clone());
    id
}

fn build_summary(transaction: &TransactionNative) -> Result<String> {
    let execution = if transaction.is_execute() {
        transaction
            .execution()
            .map(|execution| execution_to_json(execution, transaction.transitions()))
            .unwrap_or(Value::Null)
    } else {
        Value::Null
    };

    let deployment = transaction
        .deployment()
        .map(|deployment| {
            json!({
                "edition": deployment.edition(),
                "program": deployment.program_id().to_string(),
                "functions": deployment.verifying_keys().iter().map(|(function_name, (verifying_key, certificate))| json!({
                    "name": function_name.to_string(),
                    "constraints": verifying_key.circuit_info.num_constraints as u32,
                    "variables": verifying_key.num_variables() as u32,
                    "verifyingKey": verifying_key.to_string(),
                    "certificate": certificate.to_string(),
                })).collect::<Vec<_>>(),
            })
        })
        .unwrap_or(Value::Null);

    let owner = transaction
        .owner()
        .map(|owner| {
            json!({
                "address": owner.address().to_string(),
                "signature": owner.signature().to_string(),
            })
        })
        .unwrap_or(Value::Null);

    let fee_value = transaction_fee_execution(transaction).unwrap_or(Value::Null);

    let summary = json!({
        "id": transaction.id().to_string(),
        "type": match transaction {
            TransactionNative::Deploy(..) => "deploy",
            TransactionNative::Execute(..) => "execute",
            TransactionNative::Fee(..) => "fee",
        },
        "execution": execution,
        "deployment": deployment,
        "fee": fee_value,
        "owner": owner,
        "feeAmount": unwrap_u64_result(transaction.fee_amount()),
        "baseFee": unwrap_u64_result(transaction.base_fee_amount()),
        "priorityFee": unwrap_u64_result(transaction.priority_fee_amount()),
    });

    serde_json::to_string(&summary).map_err(|error| error.to_string())
}

fn execution_to_json<'a>(
    execution: &ExecutionNative,
    transitions: impl Iterator<Item = &'a TransitionNative>,
) -> Value {
    let transitions_json = transitions
        .map(|transition| transition_to_json(transition))
        .collect::<Vec<_>>();

    json!({
        "global_state_root": execution.global_state_root().to_string(),
        "proof": execution.proof().map(|proof| proof.to_string()).unwrap_or_default(),
        "transitions": transitions_json,
    })
}

fn transaction_fee_execution(transaction: &TransactionNative) -> Option<Value> {
    let fee = match transaction {
        TransactionNative::Deploy(_, _, _, _, fee) => Some(fee),
        TransactionNative::Execute(_, _, _, fee) => fee.as_ref(),
        TransactionNative::Fee(_, fee) => Some(fee),
    }?;

    let inputs = fee
        .inputs()
        .iter()
        .map(|input| input_to_json(input))
        .collect::<Vec<_>>();
    let outputs = fee
        .outputs()
        .iter()
        .map(|output| output_to_json(output))
        .collect::<Vec<_>>();

    Some(json!({
        "global_state_root": fee.global_state_root().to_string(),
        "proof": fee.proof().map(|proof| proof.to_string()).unwrap_or_default(),
        "transition": json!({
            "program": fee.program_id().to_string(),
            "function": fee.function_name().to_string(),
            "id": fee.id().to_string(),
            "inputs": inputs,
            "outputs": outputs,
            "tpk": fee.tpk().to_string(),
            "tcm": fee.tcm().to_string(),
            "scm": fee.scm().to_string(),
        })
    }))
}

fn transition_to_json(transition: &TransitionNative) -> Value {
    let inputs = transition
        .inputs()
        .iter()
        .map(|input| input_to_json(input))
        .collect::<Vec<_>>();
    let outputs = transition
        .outputs()
        .iter()
        .map(|output| output_to_json(output))
        .collect::<Vec<_>>();

    json!({
        "program": transition.program_id().to_string(),
        "function": transition.function_name().to_string(),
        "id": transition.id().to_string(),
        "inputs": inputs,
        "outputs": outputs,
        "tpk": transition.tpk().to_string(),
        "tcm": transition.tcm().to_string(),
        "scm": transition.scm().to_string(),
    })
}

fn input_to_json(input: &InputNative) -> Value {
    match input {
        InputNative::Constant(id, plaintext) => json!({
            "type": "constant",
            "id": id.to_string(),
            "value": plaintext.as_ref().map(|value| value.to_string()),
        }),
        InputNative::Public(id, plaintext) => json!({
            "type": "public",
            "id": id.to_string(),
            "value": plaintext.as_ref().map(|value| value.to_string()),
        }),
        InputNative::Private(id, ciphertext) => json!({
            "type": "private",
            "id": id.to_string(),
            "value": ciphertext.as_ref().map(|value| value.to_string()),
        }),
        InputNative::Record(serial_number, tag) => json!({
            "type": "record",
            "id": serial_number.to_string(),
            "tag": tag.to_string(),
        }),
        InputNative::ExternalRecord(commitment) => json!({
            "type": "external_record",
            "id": commitment.to_string(),
        }),
    }
}

fn output_to_json(output: &OutputNative) -> Value {
    match output {
        OutputNative::Constant(id, plaintext) => json!({
            "type": "constant",
            "id": id.to_string(),
            "value": plaintext.as_ref().map(|value| value.to_string()),
        }),
        OutputNative::Public(id, plaintext) => json!({
            "type": "public",
            "id": id.to_string(),
            "value": plaintext.as_ref().map(|value| value.to_string()),
        }),
        OutputNative::Private(id, ciphertext) => json!({
            "type": "private",
            "id": id.to_string(),
            "value": ciphertext.as_ref().map(|value| value.to_string()),
        }),
        OutputNative::Record(commitment, checksum, record_ciphertext, sender_ciphertext) => json!({
            "type": "record",
            "id": commitment.to_string(),
            "checksum": checksum.to_string(),
            "value": record_ciphertext.as_ref().map(|value| value.to_string()),
            "sender_ciphertext": sender_ciphertext.as_ref().map(|value| value.to_string()),
        }),
        OutputNative::ExternalRecord(commitment) => json!({
            "type": "external_record",
            "id": commitment.to_string(),
        }),
        OutputNative::Future(id, future) => json!({
            "type": "future",
            "id": id.to_string(),
            "value": future.as_ref().map(|value| value.to_string()),
        }),
    }
}
