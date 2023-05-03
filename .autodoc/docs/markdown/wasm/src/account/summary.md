[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/wasm/src/account)

The code in the `account` folder of the Aleo project provides essential cryptographic components for managing accounts, such as addresses, private keys, view keys, and signatures. These components are crucial for sending and receiving transactions, proving ownership of an address, and providing read-only access to an address's transaction history.

For example, the `Address` struct allows creating and manipulating Aleo addresses, as well as verifying signatures for messages associated with these addresses. To create an address from a private key, you can use the following code:

```rust
let private_key = PrivateKey::new();
let address = Address::from_private_key(&private_key);
```

The `PrivateKey` struct provides functionality for generating, converting, and using private keys. You can generate a new private key and sign a message with it:

```rust
let private_key = PrivateKey::new();
let message = b"Hello, Aleo!";
let signature = private_key.sign(message);
```

The `ViewKey` struct allows users to decrypt and view specific records without revealing their private keys. To create a view key from a private key and decrypt a ciphertext, you can use the following code:

```rust
let private_key = PrivateKey::from_string("APrivateKey1zkp4RyQ8Utj7aRcJgPQGEok8RMzWwUZzBhhgX6rhmBT8dcP");
let view_key = ViewKey::from_private_key(&private_key);
let ciphertext = "record1qyqsqpe2szk2wwwq56akkwx586hkndl3r8vzdwve32lm7elvphh37rsyqyxx66trwfhkxun9v35hguerqqpqzqrtjzeu6vah9x2me2exkgege824sd8x2379scspmrmtvczs0d93qttl7y92ga0k0rsexu409hu3vlehe3yxjhmey3frh2z5pxm5cmxsv4un97q";
let plaintext = view_key.decrypt(ciphertext);
```

The `Signature` struct provides methods for signing and verifying messages. To verify a signature for a given address and message, you can use the following code:

```rust
let address = private_key.to_address();
let is_valid = signature.verify(&address, &message);
```

The `PrivateKeyCiphertext` struct allows encrypting and decrypting private keys using a secret string, providing a secure way to store and manage private keys:

```rust
let private_key = PrivateKey::new();
let private_key_ciphertext = PrivateKeyCiphertext::encrypt_private_key(&private_key, "mypassword").unwrap();
let recovered_private_key = private_key_ciphertext.decrypt_to_private_key("mypassword").unwrap();
```

These cryptographic components are re-exported in the `mod.rs` file, making it easy for other parts of the Aleo project to import and use them. This modular approach promotes code reusability and maintainability.
