use crate::types::*;
use std::str::FromStr;
use std::sync::{Mutex, MutexGuard};

type Result<T> = std::result::Result<T, String>;

pub struct ScalarHandle {
    inner: Mutex<Scalar<CurrentNetwork>>,
}

impl ScalarHandle {
    pub fn new(scalar: Scalar<CurrentNetwork>) -> Self {
        Self {
            inner: Mutex::new(scalar),
        }
    }

    fn lock(&self) -> MutexGuard<'_, Scalar<CurrentNetwork>> {
        self.inner.lock().expect("Scalar mutex poisoned")
    }

    fn with<R>(&self, f: impl FnOnce(&Scalar<CurrentNetwork>) -> R) -> R {
        let guard = self.lock();
        f(&*guard)
    }

    pub fn clone_value(&self) -> Scalar<CurrentNetwork> {
        self.with(|scalar| scalar.clone())
    }

    pub fn scalar_clone(&self) -> Result<Box<ScalarHandle>> {
        Ok(Box::new(ScalarHandle::new(self.clone_value())))
    }

    pub fn scalar_to_string(&self) -> String {
        self.with(|scalar| scalar.to_string())
    }
}

pub fn scalar_from_value(scalar: Scalar<CurrentNetwork>) -> Box<ScalarHandle> {
    Box::new(ScalarHandle::new(scalar))
}

pub fn scalar_from_string(scalar_str: String) -> Result<Box<ScalarHandle>> {
    Scalar::<CurrentNetwork>::from_str(&scalar_str)
        .map(ScalarHandle::new)
        .map(Box::new)
        .map_err(|err| err.to_string())
}

pub fn scalar_clone(handle: &ScalarHandle) -> Result<Box<ScalarHandle>> {
    handle.scalar_clone()
}

pub fn scalar_to_string(handle: &ScalarHandle) -> String {
    handle.scalar_to_string()
}

pub fn validate_scalar(scalar_str: String) -> bool {
    Scalar::<CurrentNetwork>::from_str(&scalar_str).is_ok()
}
