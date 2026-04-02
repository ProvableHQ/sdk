use crate::types::*;
use serde_json::{json, Value};
use snarkvm_console::program::{EntryType, Identifier, PlaintextType, ValueType};
use std::{ops::Deref, str::FromStr, sync::Mutex};

type Result<T> = std::result::Result<T, String>;

pub struct ProgramHandle {
    inner: Mutex<ProgramNative>,
}

impl ProgramHandle {
    pub(crate) fn new(program: ProgramNative) -> Self {
        Self {
            inner: Mutex::new(program),
        }
    }

    fn with<R>(&self, f: impl FnOnce(&ProgramNative) -> R) -> R {
        let guard = self.inner.lock().expect("Program mutex poisoned");
        f(guard.deref())
    }

    pub fn program_clone(&self) -> Box<ProgramHandle> {
        let cloned = self.with(|program| program.clone());
        Box::new(ProgramHandle::new(cloned))
    }

    pub fn program_to_string(&self) -> String {
        self.with(|program| program.to_string())
    }

    pub fn program_has_function(&self, function_name: &str) -> bool {
        self.with(|program| {
            Identifier::<CurrentNetwork>::from_str(function_name)
                .ok()
                .and_then(|identifier| program.functions().get(&identifier))
                .is_some()
        })
    }

    pub fn program_get_functions(&self) -> Vec<String> {
        self.with(|program| {
            program
                .functions()
                .values()
                .map(|function| function.name().to_string())
                .collect()
        })
    }

    pub fn program_get_function_inputs(&self, function_name: &str) -> Result<String> {
        self.with(|program| {
            let identifier =
                Identifier::<CurrentNetwork>::from_str(function_name).map_err(|e| e.to_string())?;
            let function = program.functions().get(&identifier).ok_or_else(|| {
                format!("function {} not found in {}", function_name, program.id())
            })?;

            let inputs: Vec<Value> = function
                .inputs()
                .iter()
                .map(|input| {
                    let register = input.register().to_string();
                    match input.value_type() {
                        ValueType::Constant(plaintext) => add_register(
                            get_plaintext_input(program, plaintext, Some("constant"), None)?,
                            register,
                        ),
                        ValueType::Public(plaintext) => add_register(
                            get_plaintext_input(program, plaintext, Some("public"), None)?,
                            register,
                        ),
                        ValueType::Private(plaintext) => add_register(
                            get_plaintext_input(program, plaintext, Some("private"), None)?,
                            register,
                        ),
                        ValueType::Record(identifier) => {
                            let mut record =
                                get_record_members_value(program, &identifier.to_string())?;
                            record["register"] = json!(register);
                            Ok(record)
                        }
                        ValueType::ExternalRecord(locator) => Ok(json!({
                            "type": "external_record",
                            "locator": locator.to_string(),
                            "register": register,
                        })),
                        ValueType::Future(locator) => Ok(json!({
                            "type": "future",
                            "locator": locator.to_string(),
                            "register": register,
                        })),
                    }
                })
                .collect::<Result<_>>()?;

            serde_json::to_string(&inputs).map_err(|e| e.to_string())
        })
    }

    pub fn program_get_mappings(&self) -> Result<String> {
        self.with(|program| {
            let mappings: Vec<Value> = program
                .mappings()
                .iter()
                .map(|(name, mapping)| {
                    json!({
                        "name": name.to_string(),
                        "key_type": mapping.key().plaintext_type().to_string(),
                        "value_type": mapping.value().plaintext_type().to_string(),
                    })
                })
                .collect();
            serde_json::to_string(&mappings).map_err(|e| e.to_string())
        })
    }

    pub fn program_get_record_members(&self, record_name: &str) -> Result<String> {
        self.with(|program| {
            let value = get_record_members_value(program, record_name)?;
            serde_json::to_string(&value).map_err(|e| e.to_string())
        })
    }

    pub fn program_get_struct_members(&self, struct_name: &str) -> Result<String> {
        self.with(|program| {
            let identifier =
                Identifier::<CurrentNetwork>::from_str(struct_name).map_err(|e| e.to_string())?;
            let structure = program
                .get_struct(&identifier)
                .map_err(|_| format!("struct {} not found in {}", struct_name, program.id()))?;
            let members: Vec<Value> = structure
                .members()
                .iter()
                .map(|(name, member_type)| {
                    get_plaintext_input(program, member_type, None, Some(name.to_string()))
                })
                .collect::<Result<_>>()?;
            serde_json::to_string(&members).map_err(|e| e.to_string())
        })
    }

    pub fn program_get_imports(&self) -> Vec<String> {
        self.with(|program| program.imports().keys().map(|id| id.to_string()).collect())
    }

    pub fn program_id(&self) -> String {
        self.with(|program| program.id().to_string())
    }

    pub fn program_address(&self) -> Result<String> {
        self.with(|program| {
            program
                .id()
                .to_address()
                .map(|address| address.to_string())
                .map_err(|e| e.to_string())
        })
    }

    pub fn program_is_equal(&self, other: &ProgramHandle) -> bool {
        let lhs = self.with(|program| program.clone());
        let rhs = other.with(|program| program.clone());
        lhs == rhs
    }
}

pub fn program_from_string(program: &str) -> Result<Box<ProgramHandle>> {
    let native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
    Ok(Box::new(ProgramHandle::new(native)))
}

pub fn program_get_credits_program() -> Result<Box<ProgramHandle>> {
    let program = ProgramNative::credits().map_err(|e| e.to_string())?;
    Ok(Box::new(ProgramHandle::new(program)))
}

fn add_register(mut value: Value, register: String) -> Result<Value> {
    if let Value::Object(ref mut map) = value {
        map.insert("register".to_string(), json!(register));
        Ok(value)
    } else {
        Err("Expected object when adding register".to_string())
    }
}

fn get_plaintext_input(
    program: &ProgramNative,
    plaintext: &PlaintextType<CurrentNetwork>,
    visibility: Option<&str>,
    name: Option<String>,
) -> Result<Value> {
    let mut input = match plaintext {
        PlaintextType::Array(array_type) => {
            let element_type =
                get_plaintext_input(program, array_type.base_element_type(), None, None)?;
            json!({
                "type": "array",
                "element_type": element_type,
                "length": **array_type.length(),
            })
        }
        PlaintextType::Literal(literal_type) => {
            json!({
                "type": literal_type.to_string(),
            })
        }
        PlaintextType::Struct(struct_id) => {
            let struct_name = struct_id.to_string();
            let members = get_struct_members_value(program, &struct_name)?;
            json!({
                "type": "struct",
                "struct_id": struct_name,
                "members": members,
            })
        }
    };

    if let Some(name) = name {
        if let Value::Object(ref mut map) = input {
            map.insert("name".to_string(), json!(name));
        }
    }

    if let Some(visibility) = visibility {
        if let Value::Object(ref mut map) = input {
            map.insert("visibility".to_string(), json!(visibility));
        }
    }

    Ok(input)
}

fn get_record_members_value(program: &ProgramNative, record_name: &str) -> Result<Value> {
    let identifier =
        Identifier::<CurrentNetwork>::from_str(record_name).map_err(|e| e.to_string())?;
    let record = program
        .get_record(&identifier)
        .map_err(|_| format!("struct {} not found in {}", record_name, program.id()))?;

    let mut members: Vec<Value> = record
        .entries()
        .iter()
        .map(|(name, entry)| match entry {
            EntryType::Constant(plaintext) => {
                get_plaintext_input(program, plaintext, Some("constant"), Some(name.to_string()))
            }
            EntryType::Public(plaintext) => {
                get_plaintext_input(program, plaintext, Some("public"), Some(name.to_string()))
            }
            EntryType::Private(plaintext) => {
                get_plaintext_input(program, plaintext, Some("private"), Some(name.to_string()))
            }
        })
        .collect::<Result<_>>()?;

    members.push(json!({
        "name": "_nonce",
        "type": "group",
        "visibility": "public",
    }));

    Ok(json!({
        "type": "record",
        "record": record_name,
        "members": members,
    }))
}

fn get_struct_members_value(program: &ProgramNative, struct_name: &str) -> Result<Vec<Value>> {
    let identifier =
        Identifier::<CurrentNetwork>::from_str(struct_name).map_err(|e| e.to_string())?;
    let structure = program
        .get_struct(&identifier)
        .map_err(|_| format!("struct {} not found in {}", struct_name, program.id()))?;

    structure
        .members()
        .iter()
        .map(|(name, member_type)| {
            get_plaintext_input(program, member_type, None, Some(name.to_string()))
        })
        .collect()
}
