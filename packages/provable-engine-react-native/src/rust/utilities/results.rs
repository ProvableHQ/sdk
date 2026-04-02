use crate::ffi;

// Helper functions to create results
pub fn error_result(error: String) -> ffi::AccountResult {
    ffi::AccountResult {
        success: false,
        result: String::new(),
        error,
    }
}

pub fn success_result(result: String) -> ffi::AccountResult {
    ffi::AccountResult {
        success: true,
        result,
        error: String::new(),
    }
}

pub fn signature_error_result(error: String) -> ffi::SignatureResult {
    ffi::SignatureResult {
        success: false,
        signature_handle: 0,
        error,
    }
}

pub fn signature_success_result(signature_handle: u64) -> ffi::SignatureResult {
    ffi::SignatureResult {
        success: true,
        signature_handle,
        error: String::new(),
    }
}

pub fn authorization_success_result(handle: u64) -> ffi::AuthorizationResult {
    ffi::AuthorizationResult {
        success: true,
        handle,
        error: String::new(),
    }
}

pub fn authorization_error_result(error: String) -> ffi::AuthorizationResult {
    ffi::AuthorizationResult {
        success: false,
        handle: 0,
        error,
    }
}

pub fn proving_request_success_result(handle: u64) -> ffi::ProvingRequestResult {
    ffi::ProvingRequestResult {
        success: true,
        handle,
        error: String::new(),
    }
}

pub fn proving_request_error_result(error: String) -> ffi::ProvingRequestResult {
    ffi::ProvingRequestResult {
        success: false,
        handle: 0,
        error,
    }
}

pub fn bytes_success_result(bytes: Vec<u8>) -> ffi::BytesResult {
    ffi::BytesResult {
        success: true,
        bytes,
        error: String::new(),
    }
}

pub fn bytes_error_result(error: String) -> ffi::BytesResult {
    ffi::BytesResult {
        success: false,
        bytes: Vec::new(),
        error,
    }
}

pub fn string_success_result(result: String) -> ffi::StringResult {
    ffi::StringResult {
        success: true,
        result,
        error: String::new(),
    }
}

pub fn string_error_result(error: String) -> ffi::StringResult {
    ffi::StringResult {
        success: false,
        result: String::new(),
        error,
    }
}

pub fn string_vec_success_result(results: Vec<String>) -> ffi::StringVecResult {
    ffi::StringVecResult {
        success: true,
        results,
        error: String::new(),
    }
}

pub fn string_vec_error_result(error: String) -> ffi::StringVecResult {
    ffi::StringVecResult {
        success: false,
        results: Vec::new(),
        error,
    }
}

pub fn bool_success_result(result: bool) -> ffi::BoolResult {
    ffi::BoolResult {
        success: true,
        result,
        error: String::new(),
    }
}

pub fn bool_error_result(error: String) -> ffi::BoolResult {
    ffi::BoolResult {
        success: false,
        result: false,
        error,
    }
}
