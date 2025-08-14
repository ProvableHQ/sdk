This example will demonstrate how to save proving and verifying keys locally for the "transfer_public" in credits.aleo and for any arbitrary Aleo program.

```typescript
import {
    AleoKeyProvider,
    CREDITS_PROGRAM_KEYS,
    ProvingKey,       // these are WASM-backed types
    VerifyingKey,
} from "@provablehq/sdk";
import fs from "node:fs/promises";
import path from "node:path";

const keyProvider = new AleoKeyProvider();

// Fetch the on-chain "fee" and "transfer_public" proving and verifying keys
const [feePk, feeVk] = await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
const [txPk,  txVk]  = await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public);

// For methods that consume or mint a record, the inclusion circuit will be required.
const [incPk, incVk] = await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.inclusion);

// For a transition method in any deployed Aleo program, use the following pattern to fetch the proving and verifying 
// keys associated with that transition.
const keySearchParams = { "cacheKey": "myProgram:myFunction" };
const [transition_Pk, transition_Vk] = await keyProvider.functionKeys(keySearchParams);

// You can use this method for saving the keys to disc.
async function writeKeyToFile(key, filePath) {
  // Serialize the key into a Uint8Array
  const raw = key.toBytes();      // or key.to_bytes() depending on your SDK version
  // Then write it as binary
  await fs.writeFile(filePath, Buffer.from(raw));
  console.log(`Wrote ${filePath}`);
}

const keyDir = "./keys";
await fs.mkdir(keyDir, { recursive: true });

await writeKeyToFile(feePk, path.join(keyDir, "fee_public.prover"));
await writeKeyToFile(feeVk, path.join(keyDir, "fee_public.verifier"));
await writeKeyToFile(txPk,  path.join(keyDir, "transfer_public.prover"));
await writeKeyToFile(txVk,  path.join(keyDir, "transfer_public.verifier"));
await writeKeyToFile(incPk, path.join(keyDir, "inclusion.prover"));
await writeKeyToFile(incVk, path.join(keyDir, "inclusion.verifier"));

await writeKeyToFile(transition_Pk, path.join(keyDir, "transition.prover"));
await writeKeyToFile(transition_Vk, path.join(keyDir, "transition.verifier"));


