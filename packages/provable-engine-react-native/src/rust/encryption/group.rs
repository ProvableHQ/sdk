use crate::types::*;
use std::str::FromStr;
use std::sync::{Mutex, MutexGuard};

type Result<T> = std::result::Result<T, String>;

pub struct GroupHandle {
    inner: Mutex<Group<CurrentNetwork>>,
}

impl GroupHandle {
    pub fn new(group: Group<CurrentNetwork>) -> Self {
        Self {
            inner: Mutex::new(group),
        }
    }

    fn lock(&self) -> MutexGuard<'_, Group<CurrentNetwork>> {
        self.inner.lock().expect("Group mutex poisoned")
    }

    fn with<R>(&self, f: impl FnOnce(&Group<CurrentNetwork>) -> R) -> R {
        let guard = self.lock();
        f(&*guard)
    }

    pub fn clone_value(&self) -> Group<CurrentNetwork> {
        self.with(|group| group.clone())
    }

    pub fn group_clone(&self) -> Result<Box<GroupHandle>> {
        Ok(Box::new(GroupHandle::new(self.clone_value())))
    }

    pub fn group_to_string(&self) -> String {
        self.with(|group| group.to_string())
    }
}

pub fn group_from_value(group: Group<CurrentNetwork>) -> Box<GroupHandle> {
    Box::new(GroupHandle::new(group))
}

pub fn group_from_string(group_str: String) -> Result<Box<GroupHandle>> {
    Group::<CurrentNetwork>::from_str(&group_str)
        .map(GroupHandle::new)
        .map(Box::new)
        .map_err(|err| err.to_string())
}

pub fn group_clone(handle: &GroupHandle) -> Result<Box<GroupHandle>> {
    handle.group_clone()
}

pub fn group_to_string(handle: &GroupHandle) -> String {
    handle.group_to_string()
}

pub fn validate_group(group_str: String) -> bool {
    Group::<CurrentNetwork>::from_str(&group_str).is_ok()
}
