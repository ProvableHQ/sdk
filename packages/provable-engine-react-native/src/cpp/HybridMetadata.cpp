#include "HybridMetadata.hpp"
#include "HybridNetwork.hpp"

namespace margelo::nitro::shield {

// Unified fromFFI function - both namespaces have the same MetadataFFI structure
static inline MetadataObject fromFFI(
#ifndef testnet
    const shield_mainnet::MetadataFFI& m
#else
    const shield_testnet::MetadataFFI& m
#endif
) {
  return MetadataObject{std::string(m.name), std::string(m.locator), std::string(m.prover), std::string(m.verifier),
                        std::string(m.verifying_key)};
}

// Helper function to get current network as string
static inline std::string getCurrentNetwork() {
  return HybridNetwork::getNetworkStatic();
}

MetadataObject HybridMetadata::bond_public() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_bond_public(rust::String(network))
#else
      shield_testnet::metadata_bond_public(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::bond_validator() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_bond_validator(rust::String(network))
#else
      shield_testnet::metadata_bond_validator(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::claim_unbond_public() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_claim_unbond_public(rust::String(network))
#else
      shield_testnet::metadata_claim_unbond_public(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::fee_private() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_fee_private(rust::String(network))
#else
      shield_testnet::metadata_fee_private(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::fee_public() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_fee_public(rust::String(network))
#else
      shield_testnet::metadata_fee_public(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::inclusion() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_inclusion(rust::String(network))
#else
      shield_testnet::metadata_inclusion(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::join() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_join(rust::String(network))
#else
      shield_testnet::metadata_join(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::set_validator_state() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_set_validator_state(rust::String(network))
#else
      shield_testnet::metadata_set_validator_state(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::split() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_split(rust::String(network))
#else
      shield_testnet::metadata_split(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::transfer_private() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_transfer_private(rust::String(network))
#else
      shield_testnet::metadata_transfer_private(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::transfer_private_to_public() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_transfer_private_to_public(rust::String(network))
#else
      shield_testnet::metadata_transfer_private_to_public(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::transfer_public() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_transfer_public(rust::String(network))
#else
      shield_testnet::metadata_transfer_public(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::transfer_public_as_signer() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_transfer_public_as_signer(rust::String(network))
#else
      shield_testnet::metadata_transfer_public_as_signer(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::transfer_public_to_private() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_transfer_public_to_private(rust::String(network))
#else
      shield_testnet::metadata_transfer_public_to_private(rust::String(network))
#endif
      ;
  return fromFFI(m);
}
MetadataObject HybridMetadata::unbond_public() {
  std::string network = getCurrentNetwork();
  auto m =
#ifndef testnet
      shield_mainnet::metadata_unbond_public(rust::String(network))
#else
      shield_testnet::metadata_unbond_public(rust::String(network))
#endif
      ;
  return fromFFI(m);
}

} // namespace margelo::nitro::shield
