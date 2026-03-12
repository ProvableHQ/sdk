# Wrap SnarkVM Type

Automates wrapping a SnarkVM type in wasm-bindgen bindings for the Provable SDK.

## Required inputs

Ask the user for the following before proceeding. Do not guess.

1. **SnarkVM type path** — fully-qualified Rust path, e.g. `snarkvm_ledger_block::Transaction`
2. **SnarkVM source** — one of:
    - A GitHub branch name, e.g. `staging` (will fetch via `gh api`)
    - A local path to a SnarkVM checkout, e.g. `~/dev/snarkvm`
3. **Wrapper destination** — where the new `.rs` wrapper file should live, e.g. `wasm/src/ledger/transaction.rs`
4. **Methods to expose** — either "all public methods" or a specific list

---

## Step 1: Fetch the SnarkVM type definition

**If GitHub branch:**
- Derive the file path from the crate name. For example:
    - `snarkvm_ledger_block::Transaction` → crate `snarkvm-ledger-block` → look in `ledger/block/src/`
    - `snarkvm_console::program::Plaintext` → crate `snarkvm-console` → look in `console/src/program/`
- Use `gh api "repos/ProvableHQ/snarkVM/contents/PATH?ref=BRANCH"` and decode the base64 content
- If the exact file path is unclear, use `gh api "repos/ProvableHQ/snarkVM/git/trees/BRANCH?recursive=1"` to list the tree and locate the right file

**If local path:**
- Read the file directly using the path derived from the crate/module structure

Read the type definition thoroughly — note all public methods, their signatures, and any trait bounds.

---

## Step 2: Add the native type alias to `wasm/src/types/native/mod.rs`

This step is always the same regardless of wrapper destination.

1. Add the `use` import from the appropriate SnarkVM crate to the existing import block. Match the grouping style — account types together, ledger types together, etc.
2. Add a `pub type TypeNameNative = TypeName<CurrentNetwork>;` alias in the appropriate section.

Example — adding `Transaction` from `snarkvm_ledger_block`:
```rust
// In the use block (already present or add to existing ledger group):
use snarkvm_ledger_block::{..., Transaction};

// In the type aliases section:
pub type TransactionNative = Transaction<CurrentNetwork>;
```

Do not add a new `use` statement if the crate is already imported — extend the existing one.

Ensure all imports are in alphabetical order.

---

## Step 3: Create the wrapper file at the specified destination

Follow the pattern established in `wasm/src/types/field.rs` exactly:

```rust
// Copyright header (copy from any existing file in wasm/src/)

use crate::types::native::{TypeNameNative, /* other needed natives */};
use /* any other needed imports */;

use wasm_bindgen::prelude::*;

/// [Doc comment describing the type]
#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq)]  // adjust derives based on the native type
pub struct TypeName(TypeNameNative);

#[wasm_bindgen]
impl TypeName {
    // Re-export each method. Rules:
    // - snake_case Rust names get a camelCase js_name attribute
    // - Methods returning Self wrap the result: Ok(Self(inner_result))
    // - Methods taking &self access inner via self.0
    // - to_string gets #[wasm_bindgen(js_name = "toString")] and #[allow(clippy::inherent_to_string)]
    // - from_str / constructors get #[wasm_bindgen(js_name = "fromString")] etc.
    // - Fallible methods return Result<T, String> — map errors with .map_err(|e| e.to_string())
    // - Methods should have to_string(), from_string(), to_bytes_le(), from_bytes_le(), to_field(), and to_fields(), from_fields(), to_bits_le(), and from_bits_le() if the SnarkVM object implements any of those. 
}

// Always generate all four two-way conversions between TypeName and TypeNameNative.
// For Copy types, use *native / val.0 instead of .clone().

impl std::ops::Deref for TypeName {
    type Target = TypeNameNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<TypeNameNative> for TypeName {
    fn from(native: TypeNameNative) -> Self {
        Self(native)
    }
}

impl From<TypeName> for TypeNameNative {
    fn from(val: TypeName) -> Self {
        val.0
    }
}

impl From<&TypeNameNative> for TypeName {
    fn from(native: &TypeNameNative) -> Self {
        Self(native.clone())
    }
}

impl From<&TypeName> for TypeNameNative {
    fn from(val: &TypeName) -> Self {
        val.0.clone()
    }
}
```

---

## Step 4: Write wasm bindgen tests to test out any methods that were written.

Write tests similar to this for records (feel free to read wasm/src/record/record_ciphertext.rs for the object implementation)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    use crate::{
        types::native::{PrivateKeyNative, ViewKeyNative},
        utilities::test::get_env,
    };

    use crate::utilities::test::records::{CREDITS_RECORD_V1, CREDITS_SENDER_CIPHERTEXT, CREDITS_SENDER_PLAINTEXT};
    use wasm_bindgen_test::*;

    const CREDITS_RECORD: &str = r"{
  owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private,
  microcredits: 1500000000000000u64.private,
  _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public,
  _version: 0u8.public
}";

    const BATTLESHIP_RECORD: &str = r"{
  owner: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
  metadata: {
    player1: aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48.private,
    player2: aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6.private,
    nonce: 660310649780728486489183263981322848354071976582883879926426319832534836534field.private
  },
  id: 1953278585719525811355617404139099418855053112960441725284031425961000152405field.private,
  positions: 50794271u64.private,
  attempts: 0u64.private,
  hits: 0u64.private,
  _nonce: 5668100912391182624073500093436664635767788874314097667746354181784048204413group.public,
  _version: 0u8.public
}";

    #[wasm_bindgen_test]
    fn test_to_and_from_string() {
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        assert_eq!(record.to_string(), CREDITS_RECORD);
    }

    #[wasm_bindgen_test]
    fn test_clone() {
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let cloned_record = record.clone();
        assert_eq!(record.to_string(), cloned_record.to_string());
    }

    #[wasm_bindgen_test]
    fn test_get_record_member() {
        // Get the record members.
        let record = RecordPlaintext::from_string(BATTLESHIP_RECORD).unwrap();
        let positions = record.get_member("positions".to_string()).unwrap();
        let hits = record.get_member("hits".to_string()).unwrap();
        let metadata = record.get_member("metadata".to_string()).unwrap();

        // Get the struct members.
        let player_1 = metadata.find("player1".to_string()).unwrap();
        let player_2 = metadata.find("player2".to_string()).unwrap();
        let nonce = metadata.find("nonce".to_string()).unwrap();

        // Assert the correct information was extracted.
        assert_eq!(positions.to_string(), "50794271u64");
        assert_eq!(hits.to_string(), "0u64");
        assert_eq!(player_1.to_string(), "aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48");
        assert_eq!(player_2.to_string(), "aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6");
        assert_eq!(
            nonce.to_string(),
            "660310649780728486489183263981322848354071976582883879926426319832534836534field"
        );
    }

    #[wasm_bindgen_test]
    fn test_microcredits_from_string() {
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        assert_eq!(record.microcredits(), 1500000000000000);
    }

    #[wasm_bindgen_test]
    fn test_serial_number() {
        let pk = PrivateKey::from_string("APrivateKey1zkpDeRpuKmEtLNPdv57aFruPepeH1aGvTkEjBo8bqTzNUhE").unwrap();
        let vk = ViewKey::from_private_key(&pk);
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let program_id = "credits.aleo";
        let record_name = "credits";
        let expected_sn = "8170619507075647151199239049653235187042661744691458644751012032123701508940field";
        let record_view_key = record.record_view_key(&vk);
        let result = record.serial_number_string(&pk, program_id, record_name, &record_view_key.to_string());
        assert_eq!(expected_sn, result.unwrap());
    }

    #[wasm_bindgen_test]
    fn test_serial_number_can_run_twice_with_same_private_key() {
        let pk = PrivateKey::from_string("APrivateKey1zkpDeRpuKmEtLNPdv57aFruPepeH1aGvTkEjBo8bqTzNUhE").unwrap();
        let vk = ViewKey::from_private_key(&pk);
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let program_id = "credits.aleo";
        let record_name = "credits";
        let expected_sn = "8170619507075647151199239049653235187042661744691458644751012032123701508940field";
        let record_view_key = record.record_view_key(&vk);
        assert_eq!(
            expected_sn,
            record.serial_number_string(&pk, program_id, record_name, &record_view_key.to_string()).unwrap()
        );
        assert_eq!(
            expected_sn,
            record.serial_number_string(&pk, program_id, record_name, &record_view_key.to_string()).unwrap()
        );
    }

    #[wasm_bindgen_test]
    fn test_serial_number_invalid_program_id_returns_err_string() {
        let pk = PrivateKey::from_string("APrivateKey1zkpDeRpuKmEtLNPdv57aFruPepeH1aGvTkEjBo8bqTzNUhE").unwrap();
        let vk = ViewKey::from_private_key(&pk);
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let program_id = "not a real program id";
        let record_name = "token";
        let record_view_key = record.record_view_key(&vk);
        assert!(record.serial_number_string(&pk, program_id, record_name, &record_view_key.to_string()).is_err());
    }

    #[wasm_bindgen_test]
    fn test_serial_number_invalid_record_name_returns_err_string() {
        let pk = PrivateKey::from_string("APrivateKey1zkpDeRpuKmEtLNPdv57aFruPepeH1aGvTkEjBo8bqTzNUhE").unwrap();
        let vk = ViewKey::from_private_key(&pk);
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let program_id = "token.aleo";
        let record_name = "not a real record name";
        let record_view_key = record.record_view_key(&vk);
        assert!(record.serial_number_string(&pk, program_id, record_name, &record_view_key.to_string()).is_err());
    }

    #[wasm_bindgen_test]
    fn test_bad_inputs_to_from_string() {
        let invalid_bech32 = "{ owner: aleo2d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah.private, microcredits: 99u64.public, _nonce: 0group.public }";
        assert_eq!(
            RecordPlaintext::from_string("string").err(),
            Some("The record plaintext string provided was invalid".into())
        );
        assert!(RecordPlaintext::from_string(invalid_bech32).is_err());
    }

    #[wasm_bindgen_test]
    fn test_owner_with_private_visibility() {
        let record = RecordPlaintext::from_string(CREDITS_RECORD).unwrap();
        let owner = record.owner().unwrap();
        assert_eq!(owner.to_string(), "aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3");
    }

    #[wasm_bindgen_test]
    fn test_owner_with_private_visibility_battleship() {
        let record = RecordPlaintext::from_string(BATTLESHIP_RECORD).unwrap();
        let owner = record.owner().unwrap();
        assert_eq!(owner.to_string(), "aleo1kh5t7m30djl0ecdn4f5vuzp7dx0tcwh7ncquqjkm4matj2p2zqpqm6at48");
    }

    #[wasm_bindgen_test]
    fn test_record_decrypt_record_sender_ciphertext() {
        // Get the private key corresponding to the record.
        let private_key = PrivateKeyNative::from_str(&get_env("PUZZLE_PK")).unwrap();
        let view_key = ViewKey::from(ViewKeyNative::try_from(private_key).unwrap());

        // Construct the record and the sender ciphertext.
        let record = RecordPlaintext::from_string(CREDITS_RECORD_V1).unwrap();
        let sender_ciphertext = Field::from_string(CREDITS_SENDER_CIPHERTEXT).unwrap();

        // Decrypt the sender ciphertext and ensure it's from the expected address.
        let sender = record.decrypt_sender(&view_key, &sender_ciphertext).unwrap();
        assert_eq!(sender.to_string(), CREDITS_SENDER_PLAINTEXT.to_string());
    }
}
```

---

## Step 5: Wire up the module

Find the `mod.rs` (or equivalent) in the parent directory of the wrapper destination and add:

```rust
pub mod type_name;
pub use type_name::TypeName;
```

Match the style of existing entries in that file.

---

## Step 6: Verify the wasm tests

Run this from the sdk base directory.
```bash
yarn test:wasm
```

Fix any errors before declaring done. Common issues:
- Missing imports in the wrapper file
- Trait bounds not satisfied (check what traits the native type requires)
- Method signatures that need adjustment for wasm-bindgen compatibility (e.g. no generic parameters, no lifetimes on return types)

## Step 7: Write JS tests of the wasm object and export it in `browser.ts`.


Write JS tests of the wasm object and its methods in the JS sdk in the appropriate test file in `sdk/tests/wasm.test.ts`.

An example of how to write such tests are below.

```typescript
    describe('Transition', () => {
    const transitionStringTestnet = `{"id":"au1u62jasyx78x9hktak24awyj38fz73aseq8g9cx98u8egd9pj9uxq3u6s2z","program":"hello_hello.aleo","function":"hello","inputs":[{"type":"public","id":"3748790614260807060977840590007893602934308327222309419419577452790958781330field","value":"1u32"},{"type":"private","id":"5954208307642819953251922459490586292095132973876550778604572231610245257004field","value":"ciphertext1qyq0m5mp0d2gzh2pv9p25z70gz2avhqdt3dp8y8thzwf3aq6g35zcqcuyptz3"}],"outputs":[{"type":"private","id":"1557506318887190915592751299113729867877933642317637206076176689093854281418field","value":"ciphertext1qyqzmhw8ln9r6uuyh0n5jrsqlt25wdggqp3d9yqyttpr3g7g00k2sysdf9rmv"}],"tpk":"7532444547840484531569841377269810017844130178606467837628364672670182422388group","tcm":"7292056195970541935877520517416922164990366931599720071937561392936678536563field","scm":"8283770351301010771186520129040704279224805960417079922462917369178354050332field"}`;
    const transitionTestnet = Transition.fromString(transitionStringTestnet);
    const transitionDecryptedStringTestnet = `{"id":"au1mhdz6jqm973v5vfkz2pwgv63p340c9tpvydxha2zs8w03746qcpqvx3yye","program":"hello_hello.aleo","function":"hello","inputs":[{"type":"public","id":"3748790614260807060977840590007893602934308327222309419419577452790958781330field","value":"1u32"},{"type":"public","id":"5954208307642819953251922459490586292095132973876550778604572231610245257004field","value":"2u32"}],"outputs":[{"type":"public","id":"1557506318887190915592751299113729867877933642317637206076176689093854281418field","value":"3u32"}],"tpk":"7532444547840484531569841377269810017844130178606467837628364672670182422388group","tcm":"7292056195970541935877520517416922164990366931599720071937561392936678536563field","scm":"8283770351301010771186520129040704279224805960417079922462917369178354050332field"}`
    const transitionDecryptedTestnet = Transition.fromString(transitionDecryptedStringTestnet);
    const transitionViewKeyStringTestnet = "3975242887442171718863200089461896014344887434842278474302914755871123010247field";

    const transitionStringMainnet = `{"id":"au1mguuz0dh20f78802m4z0py7n08xhl0pz60llzck63mhl8pc8l5xqxpwgtn","program":"hello_hello.aleo","function":"main","inputs":[{"type":"public","id":"6393584049543470937057043098611271993206122889317039351966319038535020834557field","value": "1u32"},{"type":"private","id":"8207446256045172951742235001162005156507562935942883128759030124682934277495field","value":"ciphertext1qyqqgz9qnupeld9vr4vuwp6yrpmhgtkvmgag5m7mmrruw0r6je666qgqdswk3"}],"outputs":[{"type":"private","id":"127469473292952941321346770257126666363371158501875622169294663492714835110field","value":"ciphertext1qyqyapkjuxm9dcslgyjf7hkr2k3dek500z40gjspnwvll0uawj23vzgggc405"}],"tpk":"7647553513996966044119163122930125808381703910407273818947266861843062002251group","tcm":"4479413938380109857414238205380483440836495997450846894155088299187217672609field","scm":"6461007226176477784737642021400489186736987671609840640950580467598882134642field"}`;
    const transitionMainnet = Transition.fromString(transitionStringMainnet);
    const transitionDecryptedStringMainnet = `{"id":"au1jl2ur42sj7hwe4r0alv6gnklqxj0fszrvu3q82gjcls5x6q9pyzqdgmu2k","program":"hello_hello.aleo","function":"main","inputs":[{"type":"public","id":"6393584049543470937057043098611271993206122889317039351966319038535020834557field","value":"1u32"},{"type":"public","id":"8207446256045172951742235001162005156507562935942883128759030124682934277495field","value":"2u32"}],"outputs":[{"type":"public","id":"127469473292952941321346770257126666363371158501875622169294663492714835110field","value":"3u32"}],"tpk":"7647553513996966044119163122930125808381703910407273818947266861843062002251group","tcm":"4479413938380109857414238205380483440836495997450846894155088299187217672609field","scm":"6461007226176477784737642021400489186736987671609840640950580467598882134642field"}`;
    const transitionDecryptedMainnet = Transition.fromString(transitionDecryptedStringMainnet);
    const transitionViewKeyStringMainnet = "8161419549946991944867064830365679191883723972221767444308198038592561311302field";

    const invalidTransitionViewKeyString = "5089075468761042335883809641276568724119791331127957254389204093712358605127field"
    const invalidTransitionViewKey = Field.fromString(invalidTransitionViewKeyString);
    const privateKey = PrivateKey.from_string("APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH");
    const viewKey = privateKey.to_view_key();

    let connection = new AleoNetworkClient("https://api.provable.com/v2");

    if (connection.network === "testnet") {
        it('can be decrypted with a valid transition view key', () => {
            const tvk = transitionTestnet.tvk(viewKey);
            const transitionDecryptedWithTVK = transitionTestnet.decryptTransition(tvk);
            // Ensure the transition is valid
            expect(transitionDecryptedWithTVK.toString()).equal(transitionDecryptedTestnet.toString());
        });

        it('cannot be decrypted with an invalid transition view key', () => {
            expect(() => transitionTestnet.decryptTransition(invalidTransitionViewKey).toThrow());
        });

        it('can generate a transition view key from a valid view key', () => {
            const generatedTransitionViewKey = transitionTestnet.tvk(viewKey);

            // Ensure the generated transition view key is the same as the one used to decrypt
            expect(generatedTransitionViewKey.toString()).equal(transitionViewKeyStringTestnet);
        });
    };
```

Verify these tests work by running `yarn build:wasm && yarn build:sdk && yarn test:sdk` from the root of the sdk directory.

## Step 8: Cleanup Run cargo fmt --all

run the following in the `wasm` directory
```bash
cargo fmt --all
```
