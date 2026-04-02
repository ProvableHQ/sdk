#include "HybridPrivateKey.hpp"
#include "HybridAddress.hpp"
#include "HybridViewKey.hpp"
#include <cstring>
#include <stdexcept>
#ifndef testnet
#include "rust/shield_mainnet.h"
#else
#include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

// Default constructor
HybridPrivateKey::HybridPrivateKey() : HybridObject(TAG) {}

// Internal constructor for creating from private key handle
HybridPrivateKey::HybridPrivateKey(uint64_t privateKeyHandle) : HybridObject(TAG), _privateKeyHandle(privateKeyHandle) {}

// Destructor - clean up Rust resources if needed
HybridPrivateKey::~HybridPrivateKey() {
  if (_privateKeyHandle != 0) {
    shield_mainnet::PrivateKeyHandle handle = {_privateKeyHandle};
    shield_mainnet::destroy_private_key(handle);
  }
}

std::shared_ptr<HybridPrivateKey> HybridPrivateKey::fromString(const std::string& privateKeyString) {
  uint64_t handle = createPrivateKeyHandle(privateKeyString);
  if (handle == 0) {
    throw std::invalid_argument("Invalid private key format");
  }
  return std::make_shared<HybridPrivateKey>(handle);
}

std::shared_ptr<HybridPrivateKey> HybridPrivateKey::fromSeed(const std::shared_ptr<ArrayBuffer>& seed) {
  uint64_t handle = createPrivateKeyFromSeed(seed);
  if (handle == 0) {
    throw std::invalid_argument("Invalid seed for private key generation");
  }
  return std::make_shared<HybridPrivateKey>(handle);
}

std::shared_ptr<HybridPrivateKey> HybridPrivateKey::generate() {
  uint64_t handle = generatePrivateKey();
  if (handle == 0) {
    throw std::runtime_error("Failed to generate private key");
  }
  return std::make_shared<HybridPrivateKey>(handle);
}

uint64_t HybridPrivateKey::createPrivateKeyHandle(const std::string& privateKeyString) {
  // Validate the private key first
  if (!shield_mainnet::validate_private_key(rust::String(privateKeyString))) {
    return 0; // Invalid handle
  }

  // Create the private key handle using Rust FFI
  auto handle = shield_mainnet::private_key_from_string(rust::String(privateKeyString));
  return handle.id;
}

uint64_t HybridPrivateKey::createPrivateKeyFromSeed(const std::shared_ptr<ArrayBuffer>& seed) {
  if (!seed || seed->size() != 32) {
    return 0; // Invalid seed
  }

  // Convert ArrayBuffer to rust::Vec
  std::vector<uint8_t> seedVec(seed->size());
  std::memcpy(seedVec.data(), seed->data(), seed->size());
  rust::Vec<uint8_t> rustSeed;
  for (const auto& byte : seedVec) {
    rustSeed.push_back(byte);
  }

  // Create the private key handle using Rust FFI
  auto handle = shield_mainnet::private_key_from_seed_unchecked(rustSeed);
  return handle.id;
}

uint64_t HybridPrivateKey::generatePrivateKey() {
  // Generate a new private key using Rust FFI
  auto handle = shield_mainnet::create_private_key();
  return handle.id;
}

std::string HybridPrivateKey::toString() {
  if (_privateKeyHandle == 0) {
    throw std::runtime_error("Private key not initialized - cannot convert to string");
  }
  return rustPrivateKeyToString();
}

std::shared_ptr<HybridAddressSpec> HybridPrivateKey::toAddress() {
  if (_privateKeyHandle == 0) {
    throw std::runtime_error("Private key not initialized - cannot derive address");
  }
  uint64_t addressHandle = rustPrivateKeyToAddress();
  return std::make_shared<HybridAddress>(addressHandle);
}

std::shared_ptr<HybridViewKeySpec> HybridPrivateKey::toViewKey() {
  if (_privateKeyHandle == 0) {
    throw std::runtime_error("Private key not initialized - cannot derive view key");
  }
  uint64_t viewKeyHandle = rustPrivateKeyToViewKey();
  return std::make_shared<HybridViewKey>(viewKeyHandle);
}

ComputeKey HybridPrivateKey::toComputeKey() {
  if (_privateKeyHandle == 0) {
    throw std::runtime_error("Private key not initialized - cannot derive compute key");
  }
  return rustPrivateKeyToComputeKey();
}

Signature HybridPrivateKey::sign(const std::shared_ptr<ArrayBuffer>& message) {
  if (_privateKeyHandle == 0) {
    throw std::runtime_error("Private key not initialized - cannot sign message");
  }
  return rustPrivateKeySign(message);
}

std::string HybridPrivateKey::rustPrivateKeyToString() {
  shield_mainnet::PrivateKeyHandle handle = {_privateKeyHandle};
  auto result = shield_mainnet::private_key_to_string(handle);

  if (!result.success) {
    throw std::runtime_error("Failed to convert private key to string: " + std::string(result.error));
  }

  return std::string(result.result);
}

uint64_t HybridPrivateKey::rustPrivateKeyToAddress() {
  shield_mainnet::PrivateKeyHandle handle = {_privateKeyHandle};
  auto addressHandle = shield_mainnet::private_key_to_address(handle);
  return addressHandle.id;
}

uint64_t HybridPrivateKey::rustPrivateKeyToViewKey() {
  shield_mainnet::PrivateKeyHandle handle = {_privateKeyHandle};
  auto viewKeyHandle = shield_mainnet::private_key_to_view_key(handle);
  return viewKeyHandle.id;
}

ComputeKey HybridPrivateKey::rustPrivateKeyToComputeKey() {
  shield_mainnet::PrivateKeyHandle handle = {_privateKeyHandle};
  auto computeKeyHandle = shield_mainnet::private_key_to_compute_key(handle);

  // Create ComputeKey struct with handle - make synchronous
  ComputeKey computeKey;
  auto result = shield_mainnet::compute_key_to_string(computeKeyHandle);

  // Destroy the temporary handle to prevent memory leak
  shield_mainnet::destroy_compute_key(computeKeyHandle);

  if (!result.success) {
    throw std::runtime_error("Failed to convert compute key to string: " + std::string(result.error));
  }

  std::string computeKeyString = std::string(result.result);
  computeKey.asString = [computeKeyString]() mutable -> std::shared_ptr<Promise<std::string>> {
    return Promise<std::string>::resolved(std::move(computeKeyString));
  };

  return computeKey;
}

Signature HybridPrivateKey::rustPrivateKeySign(const std::shared_ptr<ArrayBuffer>& message) {
  if (!message || message->size() == 0) {
    throw std::invalid_argument("Message cannot be empty");
  }

  shield_mainnet::PrivateKeyHandle handle = {_privateKeyHandle};

  // Convert ArrayBuffer to rust::Vec
  std::vector<uint8_t> messageVec(message->size());
  std::memcpy(messageVec.data(), message->data(), message->size());
  rust::Vec<uint8_t> rustMessage;
  for (const auto& byte : messageVec) {
    rustMessage.push_back(byte);
  }

  auto result = shield_mainnet::private_key_sign(handle, rustMessage);

  if (!result.success) {

    throw std::runtime_error("Failed to sign message: " + std::string(result.error));
  }

  // Create Signature struct from result
  Signature signature;
  // Get the actual signature string from Rust immediately (synchronous)
  shield_mainnet::SignatureHandle signatureHandle = {result.signature_handle};
  auto signatureResult = shield_mainnet::signature_to_string(signatureHandle);

  // Destroy the temporary handle to prevent memory leak
  shield_mainnet::destroy_signature(signatureHandle);

  if (!signatureResult.success) {
    throw std::runtime_error("Failed to convert signature to string: " + std::string(signatureResult.error));
  }

  std::string signatureString = std::string(signatureResult.result);

  // Store the signature string in the name field for synchronous access during verification
  signature.name = signatureString;

  // Store the original signature string and return it synchronously via lambda
  signature.asString = [signatureString]() mutable -> std::shared_ptr<Promise<std::string>> {
    return Promise<std::string>::resolved(std::move(signatureString));
  };

  return signature;
}

// Static factory methods for creating HybridPrivateKey instances from TypeScript
std::shared_ptr<HybridPrivateKeySpec> HybridPrivateKey::create() {
  return generate();
}

std::shared_ptr<HybridPrivateKeySpec> HybridPrivateKey::createFromString(const std::string& privateKeyString) {
  return fromString(privateKeyString);
}

std::shared_ptr<HybridPrivateKeySpec> HybridPrivateKey::createFromSeed(const std::shared_ptr<ArrayBuffer>& seed) {
  return fromSeed(seed);
}

} // namespace margelo::nitro::shield
