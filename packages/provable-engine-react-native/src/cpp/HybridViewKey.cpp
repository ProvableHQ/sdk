#include "HybridViewKey.hpp"
#include "HybridAddress.hpp"
#include "HybridField.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <NitroModules/Promise.hpp>
#include <cstring>
#include <stdexcept>
#ifndef testnet
#include "rust/shield_mainnet.h"
#else
#include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

// Default constructor
HybridViewKey::HybridViewKey() : HybridObject(TAG) {}

// Internal constructor for creating from view key handle
HybridViewKey::HybridViewKey(uint64_t viewKeyHandle) : HybridObject(TAG), _viewKeyHandle(viewKeyHandle) {}

// Destructor - clean up Rust resources if needed
HybridViewKey::~HybridViewKey() {
  if (_viewKeyHandle != 0) {
    shield_mainnet::ViewKeyHandle handle = {_viewKeyHandle};
    shield_mainnet::destroy_view_key(handle);
  }
}

std::shared_ptr<HybridViewKey> HybridViewKey::fromString(const std::string& viewKeyString) {
  uint64_t handle = createViewKeyHandle(viewKeyString);
  if (handle == 0) {
    throw std::invalid_argument("Invalid view key format");
  }
  return std::make_shared<HybridViewKey>(handle);
}

uint64_t HybridViewKey::createViewKeyHandle(const std::string& viewKeyString) {
  // Validate the view key first
  if (!shield_mainnet::validate_view_key(rust::String(viewKeyString))) {
    return 0; // Invalid handle
  }

  // Create the view key handle using Rust FFI
  auto handle = shield_mainnet::view_key_from_string(rust::String(viewKeyString));
  return handle.id;
}

std::string HybridViewKey::toString() {
  if (_viewKeyHandle == 0) {
    throw std::runtime_error("View key not initialized - cannot convert to string");
  }
  return rustViewKeyToString();
}

std::shared_ptr<HybridAddressSpec> HybridViewKey::toAddress() {
  if (_viewKeyHandle == 0) {
    throw std::runtime_error("View key not initialized - cannot derive address");
  }
  uint64_t addressHandle = rustViewKeyToAddress();
  return std::make_shared<HybridAddress>(addressHandle);
}

RecordPlaintext HybridViewKey::decrypt(const std::string& ciphertext) {
  if (_viewKeyHandle == 0) {
    throw std::runtime_error("View key not initialized - cannot decrypt record");
  }
  return rustViewKeyDecrypt(ciphertext);
}

std::shared_ptr<HybridFieldSpec> HybridViewKey::toField() {
  if (_viewKeyHandle == 0) {
    throw std::runtime_error("View key not initialized - cannot convert to field");
  }
  auto fieldHandle = rustViewKeyToField();
  return std::make_shared<HybridField>(std::move(fieldHandle));
}

std::shared_ptr<ArrayBuffer> HybridViewKey::toBytesLe() {
  if (_viewKeyHandle == 0) {
    throw std::runtime_error("View key not initialized - cannot convert to bytes");
  }

  auto bytes = rustViewKeyToBytesLe();
  auto buffer = ArrayBuffer::allocate(bytes.size());
  if (bytes.size() > 0) {
    std::memcpy(buffer->data(), bytes.data(), bytes.size());
  }
  return buffer;
}

std::shared_ptr<HybridViewKeySpec> HybridViewKey::fromBytesLe(const std::shared_ptr<ArrayBuffer>& bytes) {
  rust::Vec<uint8_t> bytesVec;
  bytesVec.reserve(bytes->size());
  for (size_t i = 0; i < bytes->size(); ++i) {
    bytesVec.push_back(bytes->data()[i]);
  }

  auto handle = shield_mainnet::view_key_from_bytes_le(std::move(bytesVec));
  if (handle.id == 0) {
    throw std::runtime_error("Invalid view key bytes");
  }

  return std::make_shared<HybridViewKey>(handle.id);
}

std::string HybridViewKey::rustViewKeyToString() {
  shield_mainnet::ViewKeyHandle handle = {_viewKeyHandle};
  auto result = shield_mainnet::view_key_to_string(handle);

  if (!result.success) {
    throw std::runtime_error("Failed to convert view key to string: " + std::string(result.error));
  }

  return std::string(result.result);
}

uint64_t HybridViewKey::rustViewKeyToAddress() {
  shield_mainnet::ViewKeyHandle handle = {_viewKeyHandle};
  auto addressHandle = shield_mainnet::view_key_to_address(handle);
  return addressHandle.id;
}

RecordPlaintext HybridViewKey::rustViewKeyDecrypt(const std::string& ciphertext) {
  shield_mainnet::ViewKeyHandle handle = {_viewKeyHandle};
  auto result = shield_mainnet::view_key_decrypt(handle, rust::String(ciphertext));

  if (!result.success) {
    throw std::runtime_error("Failed to decrypt record: " + std::string(result.error));
  }

  // Convert to string immediately and destroy handle to prevent memory leak
  shield_mainnet::RecordPlaintextHandle plaintextHandle = {result.handle};
  auto plaintextResult = shield_mainnet::record_plaintext_to_string(plaintextHandle);

  // Destroy the temporary handle to prevent memory leak
  shield_mainnet::destroy_record_plaintext(plaintextHandle);

  if (!plaintextResult.success) {
    throw std::runtime_error("Failed to convert plaintext to string: " + std::string(plaintextResult.error));
  }

  std::string plaintextString = std::string(plaintextResult.result);

  // Create RecordPlaintext struct with the pre-converted string
  RecordPlaintext plaintext;
  plaintext.asString = [plaintextString]() mutable -> std::shared_ptr<Promise<std::string>> {
    return Promise<std::string>::resolved(std::move(plaintextString));
  };

  return plaintext;
}

rust::Box<shield_mainnet::FieldHandle> HybridViewKey::rustViewKeyToField() {
  shield_mainnet::ViewKeyHandle handle = {_viewKeyHandle};
  return shield_mainnet::view_key_to_field(handle);
}

rust::Vec<uint8_t> HybridViewKey::rustViewKeyToBytesLe() {
  shield_mainnet::ViewKeyHandle handle = {_viewKeyHandle};
  return shield_mainnet::view_key_to_bytes_le(handle);
}

// Static factory methods for creating HybridViewKey instances from TypeScript
std::shared_ptr<HybridViewKeySpec> HybridViewKey::create() {
  // ViewKey cannot be generated directly - it must be derived from a private key
  // For now, throw an error - this should not be called directly
  throw std::runtime_error("ViewKey cannot be created directly - derive from PrivateKey instead");
}

std::shared_ptr<HybridViewKeySpec> HybridViewKey::createFromString(const std::string& viewKeyString) {
  return fromString(viewKeyString);
}

} // namespace margelo::nitro::shield
