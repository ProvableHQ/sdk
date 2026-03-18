# Key Storage & Cryptography

## Proving Key Caching

Proving keys are large (tens of MB). Cache them to avoid re-downloading:

```ts
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);  // Enable in-memory cache
pm.setKeyProvider(keyProvider);

// For credits.aleo, use built-in locators:
import { CREDITS_PROGRAM_KEYS } from "@provablehq/sdk/testnet.js";
const keyParams = new AleoKeyProviderParams({
    cacheKey: CREDITS_PROGRAM_KEYS.getKey("transfer_public").locator,
});

// For custom programs, synthesize keys once and cache:
const [provingKey, verifyingKey] = await pm.synthesizeKeys(
    programSource,
    "my_function",
    ["1u32", "2u32"],  // sample inputs (types must match)
);
keyProvider.cacheKeys("my_program.aleo/my_function", [provingKey, verifyingKey]);
```

## Persistent Key Storage (Node.js Only)

```ts
// Only available in the Node.js entry point (not browser)
import { LocalFileKeyStore } from "@provablehq/sdk/node.js";

const keyStore = new LocalFileKeyStore("./key-cache");
pm.setKeyStore(keyStore);
// Keys are now persisted to disk and survive restarts
```

> **Note:** `LocalFileKeyStore` is exported from `sdk/src/node.ts`, not from the
> network-specific browser entry points. Use the `/node.js` import path.

## Secure Private Key Storage

Never store plaintext private keys. Use `PrivateKeyCiphertext`:

```ts
import { PrivateKey, PrivateKeyCiphertext } from "@provablehq/sdk/testnet.js";

// Encrypt for storage
const encrypted = privateKey.toCiphertext(password);
const encryptedString = encrypted.toString();
// Store encryptedString safely (file, database, env var)

// Decrypt when needed
const restored = PrivateKey.fromPrivateKeyCiphertext(
    PrivateKeyCiphertext.fromString(encryptedString),
    password,
);
```

## Custom Cryptography (libsodium)

The SDK exposes libsodium-based encryption for secure communication:

```ts
import { encryptProvingRequest, encryptAuthorization } from "@provablehq/sdk/testnet.js";

// Encrypt a proving request for DPS (X25519 + ChaCha20-Poly1305)
const encrypted = encryptProvingRequest(
    serverPublicKeyBase64,  // DPS server's X25519 public key
    provingRequest,
);
// Returns base64-encoded ciphertext (RFC 4648)
```
