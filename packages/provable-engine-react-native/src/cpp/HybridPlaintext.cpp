#include "HybridPlaintext.hpp"

#include <cstring>
#include <stdexcept>
#include <string>

#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

HybridPlaintext::HybridPlaintext() : HybridObject(TAG), _handle(std::nullopt) {}

HybridPlaintext::HybridPlaintext(rust::Box<shield_mainnet::PlaintextHandle>&& handle) : HybridObject(TAG), _handle(std::move(handle)) {}

shield_mainnet::PlaintextHandle& HybridPlaintext::ensureHandle() const {
  if (!_handle.has_value()) {
    throw std::runtime_error("Plaintext handle is null");
  }
  return **_handle;
}

std::shared_ptr<ArrayBuffer> HybridPlaintext::arrayBufferFromBytes(const rust::Vec<uint8_t>& bytes) const {
  auto buffer = ArrayBuffer::allocate(bytes.size());
  if (bytes.size() > 0) {
    std::memcpy(buffer->data(), bytes.data(), bytes.size());
  }
  return buffer;
}

std::shared_ptr<HybridPlaintextSpec> HybridPlaintext::clone() {
  auto cloned = ensureHandle().plaintext_clone();
  return std::make_shared<HybridPlaintext>(std::move(cloned));
}

std::shared_ptr<HybridPlaintextSpec> HybridPlaintext::fromString(const std::string& value) {
  return HybridPlaintext::makeFromString(value);
}

std::shared_ptr<HybridPlaintextSpec> HybridPlaintext::fromBytesLe(const std::shared_ptr<ArrayBuffer>& bytes) {
  return HybridPlaintext::makeFromBytes(bytes);
}

std::shared_ptr<HybridPlaintextSpec> HybridPlaintext::fromBitsLe(const std::shared_ptr<ArrayBuffer>& bits) {
  return HybridPlaintext::makeFromBits(bits);
}

std::shared_ptr<HybridPlaintextSpec> HybridPlaintext::fromFields(const std::vector<std::string>& fields) {
  return HybridPlaintext::makeFromFields(fields);
}

std::shared_ptr<HybridPlaintextSpec> HybridPlaintext::find(const std::string& name) {
  auto result = ensureHandle().plaintext_find(name.c_str());
  return std::make_shared<HybridPlaintext>(std::move(result));
}

std::string HybridPlaintext::toString() {
  return std::string(ensureHandle().plaintext_to_string());
}

std::shared_ptr<ArrayBuffer> HybridPlaintext::toBytesLe() {
  auto result = ensureHandle().plaintext_to_bytes();
  if (!result.success) {
    throw std::runtime_error(std::string(result.error));
  }
  return arrayBufferFromBytes(result.bytes);
}

std::shared_ptr<ArrayBuffer> HybridPlaintext::toBitsLe() {
  auto result = ensureHandle().plaintext_to_bits();
  if (!result.success) {
    throw std::runtime_error(std::string(result.error));
  }
  return arrayBufferFromBytes(result.bytes);
}

std::vector<std::string> HybridPlaintext::toFields() {
  auto result = ensureHandle().plaintext_to_fields();
  rust::Vec<rust::String> fields = result;
  std::vector<std::string> output;
  output.reserve(fields.size());
  for (const auto& field : fields) {
    output.emplace_back(std::string(field));
  }
  return output;
}

std::string HybridPlaintext::encrypt(const std::string& address, const std::string& randomizer) {
  auto result = ensureHandle().plaintext_encrypt(address.c_str(), randomizer.c_str());
  if (!result.success) {
    throw std::runtime_error(std::string(result.error));
  }
  return std::string(result.result);
}

std::string HybridPlaintext::encryptSymmetric(const std::string& transitionViewKey) {
  auto result = ensureHandle().plaintext_encrypt_symmetric(transitionViewKey.c_str());
  if (!result.success) {
    throw std::runtime_error(std::string(result.error));
  }
  return std::string(result.result);
}

std::string HybridPlaintext::toObjectZero() {
  auto result = ensureHandle().plaintext_to_object();
  if (!result.success) {
    throw std::runtime_error(std::string(result.error));
  }
  return std::string(result.result);
}

std::string HybridPlaintext::plaintextType() {
  return std::string(ensureHandle().plaintext_type());
}

std::shared_ptr<HybridPlaintext> HybridPlaintext::makeFromString(const std::string& value) {
    auto result = shield_mainnet::plaintext_from_string(rust::String(value));
  return std::make_shared<HybridPlaintext>(std::move(result));
}

std::shared_ptr<HybridPlaintext> HybridPlaintext::makeFromBytes(const std::shared_ptr<ArrayBuffer>& bytes) {
  if (!bytes) {
    throw std::invalid_argument("Bytes buffer cannot be null");
  }
  rust::Vec<uint8_t> rustBytes;
  rustBytes.reserve(bytes->size());
  const auto* data = static_cast<const uint8_t*>(bytes->data());
  for (size_t i = 0; i < bytes->size(); ++i) {
    rustBytes.push_back(data[i]);
  }
    auto result = shield_mainnet::plaintext_from_bytes(std::move(rustBytes));

  return std::make_shared<HybridPlaintext>(std::move(result));
}

std::shared_ptr<HybridPlaintext> HybridPlaintext::makeFromBits(const std::shared_ptr<ArrayBuffer>& bits) {
  if (!bits) {
    throw std::invalid_argument("Bits buffer cannot be null");
  }
  rust::Vec<uint8_t> rustBits;
  rustBits.reserve(bits->size());
  const auto* data = static_cast<const uint8_t*>(bits->data());
  for (size_t i = 0; i < bits->size(); ++i) {
    rustBits.push_back(data[i]);
  }
    auto result = shield_mainnet::plaintext_from_bits(std::move(rustBits));

  return std::make_shared<HybridPlaintext>(std::move(result));
}

std::shared_ptr<HybridPlaintext> HybridPlaintext::makeFromFields(const std::vector<std::string>& fields) {
  rust::Vec<rust::String> rustFields;
  rustFields.reserve(fields.size());
  for (const auto& field : fields) {
    rustFields.push_back(rust::String(field));
  }
    auto result = shield_mainnet::plaintext_from_fields(std::move(rustFields));

  return std::make_shared<HybridPlaintext>(std::move(result));
}

std::shared_ptr<HybridPlaintextSpec> HybridPlaintext::create() {
  throw std::runtime_error("Plaintext cannot be constructed without initial data");
}

std::shared_ptr<HybridPlaintextSpec> HybridPlaintext::createFromString(const std::string& value) {
  return makeFromString(value);
}

std::shared_ptr<HybridPlaintextSpec> HybridPlaintext::createFromBytes(const std::shared_ptr<ArrayBuffer>& bytes) {
  return makeFromBytes(bytes);
}

std::shared_ptr<HybridPlaintextSpec> HybridPlaintext::createFromBits(const std::shared_ptr<ArrayBuffer>& bits) {
  return makeFromBits(bits);
}

std::shared_ptr<HybridPlaintextSpec> HybridPlaintext::createFromFields(const std::vector<std::string>& fields) {
  return makeFromFields(fields);
}

} // namespace margelo::nitro::shield
