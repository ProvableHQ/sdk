#include "HybridProvingKey.hpp"
#include <cstring>

namespace margelo::nitro::shield {

HybridProvingKey::~HybridProvingKey() {
  if (_handle != 0) {
    shield_mainnet::ProvingKeyHandle handle = {_handle};
    shield_mainnet::destroy_proving_key(handle);
  }
}

std::shared_ptr<ArrayBuffer> HybridProvingKey::toBytes() {
  if (_handle == 0)
    return ArrayBuffer::allocate(0);
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  auto res = shield_mainnet::proving_key_to_bytes(handle);
  if (!res.success) {
    throw std::runtime_error(std::string("proving_key_to_bytes failed: ") + std::string(res.error));
  }
  auto buf = ArrayBuffer::allocate(res.bytes.size());
  std::memcpy(buf->data(), res.bytes.data(), res.bytes.size());
  return buf;
}

void HybridProvingKey::initWithBytes(const std::shared_ptr<ArrayBuffer>& bytes) {
  if (!bytes)
    throw std::invalid_argument("bytes is null");
  rust::Vec<uint8_t> rustBytes;
  rustBytes.reserve(bytes->size());
  auto ptr = static_cast<const uint8_t*>(bytes->data());
  for (size_t i = 0; i < bytes->size(); i++)
    rustBytes.push_back(ptr[i]);
  auto res = shield_mainnet::proving_key_from_bytes(rustBytes);
  if (!res.success) {
    throw std::runtime_error(std::string("proving_key_from_bytes failed: ") + std::string(res.error));
  }
  _handle = res.handle;
}

void HybridProvingKey::initWithString(const std::string& key) {
  auto res = shield_mainnet::proving_key_from_string(rust::String(key));
  if (!res.success) {
    throw std::runtime_error(std::string("proving_key_from_string failed: ") + std::string(res.error));
  }
  _handle = res.handle;
}

std::string HybridProvingKey::checksum() {
  if (_handle == 0)
    return "";
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  auto res = shield_mainnet::proving_key_checksum(handle);
  if (!res.success) {
    throw std::runtime_error(std::string("proving_key_checksum failed: ") + std::string(res.error));
  }
  return std::string(res.result);
}

std::shared_ptr<HybridProvingKeySpec> HybridProvingKey::copy() {
  if (_handle == 0)
    return std::make_shared<HybridProvingKey>();
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  auto res = shield_mainnet::proving_key_copy(handle);
  if (!res.success) {
    throw std::runtime_error(std::string("proving_key_copy failed: ") + std::string(res.error));
  }
  auto instance = std::make_shared<HybridProvingKey>();
  instance->_handle = res.handle;
  return instance;
}

bool HybridProvingKey::isBondPublicProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_bond_public_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isBondValidatorProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_bond_validator_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isClaimUnbondPublicProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_claim_unbond_public_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isFeePrivateProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_fee_private_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isFeePublicProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_fee_public_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isInclusionProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_inclusion_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isJoinProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_join_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isSetValidatorStateProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_set_validator_state_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isSplitProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_split_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isTransferPrivateProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_transfer_private_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isTransferPrivateToPublicProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_transfer_private_to_public_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isTransferPublicProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_transfer_public_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isTransferPublicAsSignerProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_transfer_public_as_signer_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isTransferPublicToPrivateProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_transfer_public_to_private_prover_with_metadata(handle, rust::String(metadataJson));
}
bool HybridProvingKey::isUnbondPublicProver(const std::string& metadataJson) {
  if (_handle == 0)
    return false;
  shield_mainnet::ProvingKeyHandle handle = {_handle};
  return shield_mainnet::proving_key_is_unbond_public_prover_with_metadata(handle, rust::String(metadataJson));
}

} // namespace margelo::nitro::shield
