use std::ffi::{c_int, c_uchar, c_ulonglong};

pub const PUBLIC_KEY_BYTES: usize = 32;
pub const SECRET_KEY_BYTES: usize = 32;
pub const SEAL_BYTES: usize = 48;

pub type PublicKey = [u8; PUBLIC_KEY_BYTES];
pub type SecretKey = [u8; SECRET_KEY_BYTES];

#[derive(Debug)]
pub enum SodiumError {
    InitFailed,
    #[cfg(test)]
    KeypairFailed,
    EncryptFailed,
    CiphertextTooShort,
    DecryptFailed,
}

#[link(name = "sodium", kind = "static")]
unsafe extern "C" {
    fn sodium_init() -> c_int;

    #[cfg(test)]
    fn crypto_box_keypair(pk: *mut c_uchar, sk: *mut c_uchar) -> c_int;

    fn crypto_box_seal(
        ciphertext: *mut c_uchar,
        plaintext: *const c_uchar,
        plaintext_len: c_ulonglong,
        recipient_pk: *const c_uchar,
    ) -> c_int;

    fn crypto_box_seal_open(
        plaintext: *mut c_uchar,
        ciphertext: *const c_uchar,
        ciphertext_len: c_ulonglong,
        pk: *const c_uchar,
        sk: *const c_uchar,
    ) -> c_int;
}

pub fn init() -> Result<(), SodiumError> {
    if unsafe { sodium_init() } < 0 {
        return Err(SodiumError::InitFailed);
    }
    Ok(())
}

#[cfg(test)]
pub fn keypair() -> Result<(PublicKey, SecretKey), SodiumError> {
    init()?;

    let mut pk = [0u8; PUBLIC_KEY_BYTES];
    let mut sk = [0u8; SECRET_KEY_BYTES];

    let result = unsafe { crypto_box_keypair(pk.as_mut_ptr(), sk.as_mut_ptr()) };
    if result != 0 {
        return Err(SodiumError::KeypairFailed);
    }

    Ok((pk, sk))
}

pub fn encrypt(plaintext: &[u8], recipient_pk: PublicKey) -> Result<Vec<u8>, SodiumError> {
    init()?;

    let mut ciphertext = vec![0u8; plaintext.len() + SEAL_BYTES];

    let result = unsafe {
        crypto_box_seal(
            ciphertext.as_mut_ptr(),
            plaintext.as_ptr(),
            plaintext.len() as c_ulonglong,
            recipient_pk.as_ptr(),
        )
    };
    if result != 0 {
        return Err(SodiumError::EncryptFailed);
    }

    Ok(ciphertext)
}

pub fn decrypt(ciphertext: &[u8], pk: PublicKey, sk: SecretKey) -> Result<Vec<u8>, SodiumError> {
    if ciphertext.len() < SEAL_BYTES {
        return Err(SodiumError::CiphertextTooShort);
    }

    init()?;

    let mut plaintext = vec![0u8; ciphertext.len() - SEAL_BYTES];

    let result = unsafe {
        crypto_box_seal_open(
            plaintext.as_mut_ptr(),
            ciphertext.as_ptr(),
            ciphertext.len() as c_ulonglong,
            pk.as_ptr(),
            sk.as_ptr(),
        )
    };
    if result != 0 {
        return Err(SodiumError::DecryptFailed);
    }

    Ok(plaintext)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[link(name = "sodium", kind = "static")]
    unsafe extern "C" {
        fn crypto_box_publickeybytes() -> usize;
        fn crypto_box_secretkeybytes() -> usize;
        fn crypto_box_sealbytes() -> usize;
    }

    #[test]
    fn constants_match_libsodium() {
        init().expect("sodium init should succeed");
        assert_eq!(PUBLIC_KEY_BYTES, unsafe { crypto_box_publickeybytes() });
        assert_eq!(SECRET_KEY_BYTES, unsafe { crypto_box_secretkeybytes() });
        assert_eq!(SEAL_BYTES, unsafe { crypto_box_sealbytes() });
    }
}
