#include "HybridAddress.hpp"
#include <cstring>
#include <stdexcept>
#ifndef testnet
#include "rust/shield_mainnet.h"
#else
#include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

// Default constructor
HybridAddress::HybridAddress() : HybridObject(TAG) {}

// Internal constructor for creating from address handle
HybridAddress::HybridAddress(uint64_t addressHandle) : HybridObject(TAG), _addressHandle(addressHandle) {}

// Destructor - clean up Rust resources if needed
HybridAddress::~HybridAddress() {
  if (_addressHandle != 0) {
    shield_mainnet::AddressHandle handle = {_addressHandle};
    shield_mainnet::destroy_address(handle);
  }
}

std::shared_ptr<HybridAddress> HybridAddress::fromString(const std::string& addressString) {
  uint64_t handle = createAddressHandle(addressString);
  if (handle == 0) {
    throw std::invalid_argument("Invalid address format");
  }
  return std::make_shared<HybridAddress>(handle);
}

uint64_t HybridAddress::createAddressHandle(const std::string& addressString) {
  // Validate the address first
  if (!shield_mainnet::validate_address(rust::String(addressString))) {
    return 0; // Invalid handle
  }

  // Create the address handle using Rust FFI
  auto handle = shield_mainnet::address_from_string(rust::String(addressString));
  return handle.id;
}

std::string HybridAddress::toString() {
  if (_addressHandle == 0) {
    throw std::runtime_error("Address not initialized - cannot convert to string");
  }
  return rustAddressToString();
}

bool HybridAddress::verify(const std::shared_ptr<ArrayBuffer>& message, const Signature& signature) {
  if (_addressHandle == 0) {
    throw std::runtime_error("Address not initialized - cannot verify signature");
  }

  uint64_t signatureHandle = extractSignatureHandle(signature);
  return rustAddressVerify(message, signatureHandle);
}

std::string HybridAddress::rustAddressToString() {
  shield_mainnet::AddressHandle handle = {_addressHandle};
  auto result = address_to_string(handle);

  if (!result.success) {
    throw std::runtime_error("Failed to convert address to string: " + std::string(result.error));
  }

  return std::string(result.result);
}

bool HybridAddress::rustAddressVerify(const std::shared_ptr<ArrayBuffer>& message, uint64_t signatureHandle) {
  if (!message || message->size() == 0) {
    return false;
  }

  shield_mainnet::AddressHandle addrHandle = {_addressHandle};
  shield_mainnet::SignatureHandle sigHandle = {signatureHandle};

  // Convert ArrayBuffer to rust::Vec
  std::vector<uint8_t> messageVec(message->size());
  std::memcpy(messageVec.data(), message->data(), message->size());
  rust::Vec<uint8_t> rustMessage;
  for (const auto& byte : messageVec) {
    rustMessage.push_back(byte);
  }

  return shield_mainnet::address_verify(addrHandle, rustMessage, sigHandle);
}

uint64_t HybridAddress::extractSignatureHandle(const Signature& signature) {
  // Use the synchronous 'name' field which contains the signature string
  if (signature.name.empty()) {
    throw std::runtime_error("Invalid signature: name is empty");
  }

  auto signatureHandle = shield_mainnet::signature_from_string(rust::String(signature.name));

  if (signatureHandle.id == 0) {
    throw std::runtime_error("Invalid signature: failed to parse signature string");
  }

  return signatureHandle.id;
}

} // namespace margelo::nitro::shield
