#include "HybridScalar.hpp"

#include <stdexcept>

namespace margelo::nitro::shield {

HybridScalar::HybridScalar() : HybridObject(TAG), handle_(std::nullopt) {}

HybridScalar::HybridScalar(rust::Box<shield_mainnet::ScalarHandle>&& handle)
    : HybridObject(TAG), handle_(std::move(handle)) {}

HybridScalar::~HybridScalar() {
  release();
}

std::shared_ptr<HybridScalarSpec> HybridScalar::create() {
  return std::make_shared<HybridScalar>();
}

std::shared_ptr<HybridScalarSpec> HybridScalar::fromString(const std::string& value) {
  return std::make_shared<HybridScalar>(createHandle(value));
}

std::shared_ptr<HybridScalarSpec> HybridScalar::clone() {
  auto cloned = cloneHandle(ensureHandle());
  return std::make_shared<HybridScalar>(std::move(cloned));
}

std::string HybridScalar::toString() {
  auto result = ensureHandle().scalar_to_string();
  return std::string(result);
}

shield_mainnet::ScalarHandle& HybridScalar::ensureHandle() const {
  if (!handle_.has_value()) {
    throw std::runtime_error("Scalar handle is not initialized");
  }
  return **handle_;
}

rust::Box<shield_mainnet::ScalarHandle> HybridScalar::createHandle(const std::string& value) {
  auto handle = shield_mainnet::scalar_from_string(rust::String(value));
  return handle;
}

rust::Box<shield_mainnet::ScalarHandle> HybridScalar::cloneHandle(shield_mainnet::ScalarHandle& handle) {
  auto result = handle.scalar_clone();
  return result;
}

void HybridScalar::release() {
  if (handle_.has_value()) {
    handle_.reset();
  }
}

} // namespace margelo::nitro::shield
