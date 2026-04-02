// Nitro bridge interface for Rust Metadata (verifying_key::metadata.rs)
// Exposes static constructors that return plain JS objects
// Shape mirrors Rust: { name, locator, prover, verifier, verifyingKey }

export type MetadataObject = {
  name: string;
  locator: string;
  prover: string;
  verifier: string;
  verifyingKey: string;
};

export interface Metadata extends HybridObject<{ ios: "c++"; android: "c++" }> {
  // Static constructors
  bond_public(): MetadataObject;
  bond_validator(): MetadataObject;
  claim_unbond_public(): MetadataObject;
  fee_private(): MetadataObject;
  fee_public(): MetadataObject;
  inclusion(): MetadataObject;
  join(): MetadataObject;
  set_validator_state(): MetadataObject;
  split(): MetadataObject;
  transfer_private(): MetadataObject;
  transfer_private_to_public(): MetadataObject;
  transfer_public(): MetadataObject;
  transfer_public_as_signer(): MetadataObject;
  transfer_public_to_private(): MetadataObject;
  unbond_public(): MetadataObject;
}

// HybridObject import is intentionally written after the interface to avoid circular type issues
import type { HybridObject } from "react-native-nitro-modules";
