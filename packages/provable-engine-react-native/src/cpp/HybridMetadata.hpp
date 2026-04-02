#pragma once

#include "HybridMetadataSpec.hpp"
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

class HybridMetadata : public HybridMetadataSpec {
 public:
  explicit HybridMetadata() : HybridObject(TAG) {}
  ~HybridMetadata() override = default;

  // Returns MetadataObject with fields aligned to Rust's verifying_key/metadata.rs
  MetadataObject bond_public() override;
  MetadataObject bond_validator() override;
  MetadataObject claim_unbond_public() override;
  MetadataObject fee_private() override;
  MetadataObject fee_public() override;
  MetadataObject inclusion() override;
  MetadataObject join() override;
  MetadataObject set_validator_state() override;
  MetadataObject split() override;
  MetadataObject transfer_private() override;
  MetadataObject transfer_private_to_public() override;
  MetadataObject transfer_public() override;
  MetadataObject transfer_public_as_signer() override;
  MetadataObject transfer_public_to_private() override;
  MetadataObject unbond_public() override;
};

} // namespace margelo::nitro::shield


