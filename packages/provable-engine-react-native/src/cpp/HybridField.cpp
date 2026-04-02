#include "HybridField.hpp"

#include <cstring>
#include <stdexcept>

namespace margelo::nitro::shield {

HybridField::HybridField() : HybridObject(TAG), handle_(std::nullopt) {}

HybridField::HybridField(rust::Box<shield_mainnet::FieldHandle>&& handle)
    : HybridObject(TAG), handle_(std::move(handle)) {}

HybridField::~HybridField() {
  release();
}

std::shared_ptr<HybridFieldSpec> HybridField::create() {
  return std::make_shared<HybridField>();
}

std::shared_ptr<HybridFieldSpec> HybridField::fromString(const std::string& value) {
  return std::make_shared<HybridField>(createHandle(value));
}

std::shared_ptr<HybridFieldSpec> HybridField::clone() {
  auto cloned = cloneHandle(ensureHandle());
  return std::make_shared<HybridField>(std::move(cloned));
}

std::string HybridField::asString() {
  auto result = ensureHandle().field_to_string();
  return std::string(result);
}

std::shared_ptr<ArrayBuffer> HybridField::toBitsLe() {
  auto result = ensureHandle().field_to_bits_le_handle();
  if (!result.success) {
    throw std::runtime_error(std::string(result.error));
  }
  return arrayBufferFromBytes(result.bytes);
}

std::shared_ptr<HybridFieldSpec> HybridField::multiply(const std::shared_ptr<HybridFieldSpec>& rhs) {
  auto rhsField = std::dynamic_pointer_cast<HybridField>(rhs);
  if (!rhsField) {
    throw std::runtime_error("Expected HybridField instance for multiply()");
  }
  auto resultHandle = multiplyHandles(ensureHandle(), rhsField->ensureHandle());
  return std::make_shared<HybridField>(std::move(resultHandle));
}

std::shared_ptr<HybridFieldSpec> HybridField::one() {
  auto handle = shield_mainnet::field_one();
  return std::make_shared<HybridField>(std::move(handle));
}

std::shared_ptr<HybridFieldSpec> HybridField::newDomainSeparator(const std::string& domain) {
  auto handle = shield_mainnet::field_new_domain_separator(rust::String(domain));
  return std::make_shared<HybridField>(std::move(handle));
}

shield_mainnet::FieldHandle& HybridField::ensureHandle() const {
  if (!handle_.has_value()) {
    throw std::runtime_error("Field handle is not initialized");
  }
  return **handle_;
}

rust::Box<shield_mainnet::FieldHandle> HybridField::createHandle(const std::string& value) {
    auto handle = shield_mainnet::field_from_string(rust::String(value));
  return handle;
}

rust::Box<shield_mainnet::FieldHandle> HybridField::cloneHandle(shield_mainnet::FieldHandle& handle) {
  auto result = handle.field_clone();
  return result;
}

rust::Box<shield_mainnet::FieldHandle> HybridField::multiplyHandles(shield_mainnet::FieldHandle& lhs, shield_mainnet::FieldHandle& rhs) {
  auto result = lhs.field_multiply_handles(rhs);
  return result;
}

std::shared_ptr<ArrayBuffer> HybridField::arrayBufferFromBytes(const rust::Vec<uint8_t>& bytes) {
  auto buffer = ArrayBuffer::allocate(bytes.size());
  if (bytes.size() > 0) {
    std::memcpy(buffer->data(), bytes.data(), bytes.size());
  }
  return buffer;
}

void HybridField::release() {
  if (handle_.has_value()) {
    handle_.reset();
  }
}

} // namespace margelo::nitro::shield
