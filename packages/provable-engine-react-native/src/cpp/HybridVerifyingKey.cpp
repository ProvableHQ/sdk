#include "HybridVerifyingKey.hpp"
#include <cstring>

namespace margelo::nitro::shield {

HybridVerifyingKey::~HybridVerifyingKey() {
  if (_handle != 0) {
    shield_mainnet::VerifyingKeyHandle handle = {_handle};
    shield_mainnet::destroy_verifying_key(handle);
  }
}

std::shared_ptr<ArrayBuffer> HybridVerifyingKey::toBytes() {
  if (_handle == 0)
    return ArrayBuffer::allocate(0);
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  auto res = shield_mainnet::verifying_key_to_bytes(handle);
  if (!res.success) {
    throw std::runtime_error(std::string("verifying_key_to_bytes failed: ") + std::string(res.error));
  }
  auto buf = ArrayBuffer::allocate(res.bytes.size());
  std::memcpy(buf->data(), res.bytes.data(), res.bytes.size());
  return buf;
}

void HybridVerifyingKey::initWithBytes(const std::shared_ptr<ArrayBuffer>& bytes) {
  if (!bytes)
    throw std::invalid_argument("bytes is null");
  rust::Vec<uint8_t> rustBytes;
  rustBytes.reserve(bytes->size());
  auto ptr = static_cast<const uint8_t*>(bytes->data());
  for (size_t i = 0; i < bytes->size(); i++)
    rustBytes.push_back(ptr[i]);
  auto res = shield_mainnet::verifying_key_from_bytes(rustBytes);
  if (!res.success) {
    throw std::runtime_error(std::string("verifying_key_from_bytes failed: ") + std::string(res.error));
  }
  _handle = res.handle;
}

void HybridVerifyingKey::initWithString(const std::string& key) {
  auto res = shield_mainnet::verifying_key_from_string(rust::String(key));
  if (!res.success) {
    throw std::runtime_error(std::string("verifying_key_from_string failed: ") + std::string(res.error));
  }
  _handle = res.handle;
}

std::string HybridVerifyingKey::checksum() {
  if (_handle == 0)
    return "";
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  auto res = shield_mainnet::verifying_key_checksum(handle);
  if (!res.success) {
    throw std::runtime_error(std::string("verifying_key_checksum failed: ") + std::string(res.error));
  }
  return std::string(res.result);
}

double HybridVerifyingKey::numConstraints() {
  if (_handle == 0)
    return 0.0;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_num_constraints(handle);
}

std::shared_ptr<HybridVerifyingKeySpec> HybridVerifyingKey::copy() {
  if (_handle == 0)
    return std::make_shared<HybridVerifyingKey>();
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  auto res = shield_mainnet::verifying_key_copy(handle);
  if (!res.success) {
    throw std::runtime_error(std::string("verifying_key_copy failed: ") + std::string(res.error));
  }
  auto instance = std::make_shared<HybridVerifyingKey>();
  instance->_handle = res.handle;
  return instance;
}

void HybridVerifyingKey::initBondPublicVerifier() {
  auto res = shield_mainnet::verifying_key_bond_public_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_bond_public_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initBondValidatorVerifier() {
  auto res = shield_mainnet::verifying_key_bond_validator_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_bond_validator_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initClaimUnbondPublicVerifier() {
  auto res = shield_mainnet::verifying_key_claim_unbond_public_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_claim_unbond_public_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initFeePrivateVerifier() {
  auto res = shield_mainnet::verifying_key_fee_private_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_fee_private_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initFeePublicVerifier() {
  auto res = shield_mainnet::verifying_key_fee_public_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_fee_public_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initInclusionVerifier() {
  auto res = shield_mainnet::verifying_key_inclusion_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_inclusion_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initJoinVerifier() {
  auto res = shield_mainnet::verifying_key_join_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_join_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initSetValidatorStateVerifier() {
  auto res = shield_mainnet::verifying_key_set_validator_state_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_set_validator_state_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initSplitVerifier() {
  auto res = shield_mainnet::verifying_key_split_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_split_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initTransferPrivateVerifier() {
  auto res = shield_mainnet::verifying_key_transfer_private_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_transfer_private_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initTransferPrivateToPublicVerifier() {
  auto res = shield_mainnet::verifying_key_transfer_private_to_public_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_transfer_private_to_public_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initTransferPublicVerifier() {
  auto res = shield_mainnet::verifying_key_transfer_public_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_transfer_public_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initTransferPublicAsSignerVerifier() {
  auto res = shield_mainnet::verifying_key_transfer_public_as_signer_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_transfer_public_as_signer_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initTransferPublicToPrivateVerifier() {
  auto res = shield_mainnet::verifying_key_transfer_public_to_private_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_transfer_public_to_private_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}
void HybridVerifyingKey::initUnbondPublicVerifier() {
  auto res = shield_mainnet::verifying_key_unbond_public_verifier();
  if (!res.success)
    throw std::runtime_error(std::string("verifying_key_unbond_public_verifier failed: ") + std::string(res.error));
  _handle = res.handle;
}

bool HybridVerifyingKey::isBondPublicVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_bond_public_verifier(handle);
}
bool HybridVerifyingKey::isBondValidatorVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_bond_validator_verifier(handle);
}
bool HybridVerifyingKey::isClaimUnbondPublicVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_claim_unbond_public_verifier(handle);
}
bool HybridVerifyingKey::isFeePrivateVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_fee_private_verifier(handle);
}
bool HybridVerifyingKey::isFeePublicVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_fee_public_verifier(handle);
}
bool HybridVerifyingKey::isInclusionVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_inclusion_verifier(handle);
}
bool HybridVerifyingKey::isJoinVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_join_verifier(handle);
}
bool HybridVerifyingKey::isSetValidatorStateVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_set_validator_state_verifier(handle);
}
bool HybridVerifyingKey::isSplitVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_split_verifier(handle);
}
bool HybridVerifyingKey::isTransferPrivateVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_transfer_private_verifier(handle);
}
bool HybridVerifyingKey::isTransferPrivateToPublicVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_transfer_private_to_public_verifier(handle);
}
bool HybridVerifyingKey::isTransferPublicVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_transfer_public_verifier(handle);
}
bool HybridVerifyingKey::isTransferPublicAsSignerVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_transfer_public_as_signer_verifier(handle);
}
bool HybridVerifyingKey::isTransferPublicToPrivateVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_transfer_public_to_private_verifier(handle);
}
bool HybridVerifyingKey::isUnbondPublicVerifier() {
  if (_handle == 0)
    return false;
  shield_mainnet::VerifyingKeyHandle handle = {_handle};
  return shield_mainnet::verifying_key_is_unbond_public_verifier(handle);
}

} // namespace margelo::nitro::shield
