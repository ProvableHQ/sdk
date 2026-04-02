import { getNetwork } from "./current-network";
import { VerifyingKey } from "./verifying-key";

export interface Key {
  name: string;
  locator: string;
  prover: string;
  verifier: string;
  verifyingKey: () => VerifyingKey;
}

import { Metadata } from "./metadata";
import type { MetadataObject } from "./specs/metadata.nitro";

function convert(metadata: MetadataObject): Key {
  // This looks up the method name in VerifyingKey
  const table = VerifyingKey as unknown as Record<string, () => VerifyingKey>;
  const verifyingKey = table[metadata.verifyingKey];

  if (!verifyingKey) {
    throw new Error(`Invalid method name: ${metadata.verifyingKey}`);
  }

  return {
    name: metadata.name,
    locator: metadata.locator,
    prover: metadata.prover,
    verifier: metadata.verifier,
    verifyingKey,
  };
}

// Helper function to get metadata based on current network
function getMetadataForCurrentNetwork() {
  const _network = getNetwork();
  return {
    bond_public: convert(Metadata.bond_public()),
    bond_validator: convert(Metadata.bond_validator()),
    claim_unbond_public: convert(Metadata.claim_unbond_public()),
    fee_private: convert(Metadata.fee_private()),
    fee_public: convert(Metadata.fee_public()),
    inclusion: convert(Metadata.inclusion()),
    join: convert(Metadata.join()),
    set_validator_state: convert(Metadata.set_validator_state()),
    split: convert(Metadata.split()),
    transfer_private: convert(Metadata.transfer_private()),
    transfer_private_to_public: convert(Metadata.transfer_private_to_public()),
    transfer_public: convert(Metadata.transfer_public()),
    transfer_public_as_signer: convert(Metadata.transfer_public_as_signer()),
    transfer_public_to_private: convert(Metadata.transfer_public_to_private()),
    unbond_public: convert(Metadata.unbond_public()),
  };
}

// Make CREDITS_PROGRAM_KEYS dynamic - it now retrieves metadata based on current network
export const CREDITS_PROGRAM_KEYS = new Proxy(
  {} as ReturnType<typeof getMetadataForCurrentNetwork> & { getKey: (key: string) => Key },
  {
    get(_target, prop) {
      if (prop === "getKey") {
        return (key: string): Key => {
          const keys = getMetadataForCurrentNetwork();
          const self = keys as unknown as Record<string, Key>;
          if (Object.hasOwn(keys, key)) {
            return self[key] as Key;
          } else {
            throw new Error(`Key "${key}" not found.`);
          }
        };
      }
      const keys = getMetadataForCurrentNetwork();
      return (keys as any)[prop];
    },
  }
);

export const PRIVATE_TRANSFER_TYPES = new Set([
  "transfer_private",
  "private",
  "transferPrivate",
  "transfer_private_to_public",
  "privateToPublic",
  "transferPrivateToPublic",
]);

export const VALID_TRANSFER_TYPES = new Set([
  "transfer_private",
  "private",
  "transferPrivate",
  "transfer_private_to_public",
  "privateToPublic",
  "transferPrivateToPublic",
  "transfer_public",
  "transfer_public_as_signer",
  "public",
  "public_as_signer",
  "transferPublic",
  "transferPublicAsSigner",
  "transfer_public_to_private",
  "publicToPrivate",
  "publicAsSigner",
  "transferPublicToPrivate",
]);

export const PRIVATE_TRANSFER = new Set(["private", "transfer_private", "transferPrivate"]);

export const PRIVATE_TO_PUBLIC_TRANSFER = new Set([
  "private_to_public",
  "privateToPublic",
  "transfer_private_to_public",
  "transferPrivateToPublic",
]);

export const PUBLIC_TRANSFER = new Set(["public", "transfer_public", "transferPublic"]);

export const PUBLIC_TRANSFER_AS_SIGNER = new Set([
  "public_as_signer",
  "transfer_public_as_signer",
  "transferPublicAsSigner",
]);

export const PUBLIC_TO_PRIVATE_TRANSFER = new Set([
  "public_to_private",
  "publicToPrivate",
  "transfer_public_to_private",
  "transferPublicToPrivate",
]);

export const RECORD_DOMAIN = "RecordScannerV0";

/**
 * Zero address on Aleo blockchain that corresponds to field element 0. Used as padding in Merkle trees and as a sentinel value.
 */
export const ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc";
export const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds
