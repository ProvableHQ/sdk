#include "HybridGroup.hpp"

#include <stdexcept>

namespace margelo::nitro::shield {

HybridGroup::HybridGroup() : HybridObject(TAG), handle_(std::nullopt) {}

HybridGroup::HybridGroup(rust::Box<shield_mainnet::GroupHandle>&& handle)
    : HybridObject(TAG), handle_(std::move(handle)) {}

HybridGroup::~HybridGroup() {
  release();
}

std::shared_ptr<HybridGroupSpec> HybridGroup::create() {
  return std::make_shared<HybridGroup>();
}

std::shared_ptr<HybridGroupSpec> HybridGroup::fromString(const std::string& value) {
  return std::make_shared<HybridGroup>(createHandle(value));
}

std::shared_ptr<HybridGroupSpec> HybridGroup::clone() {
  auto cloned = cloneHandle(ensureHandle());
  return std::make_shared<HybridGroup>(std::move(cloned));
}

std::string HybridGroup::toString() {
  auto result = ensureHandle().group_to_string();
  return std::string(result);
}

shield_mainnet::GroupHandle& HybridGroup::ensureHandle() const {
  if (!handle_.has_value()) {
    throw std::runtime_error("Group handle is not initialized");
  }
  return **handle_;
}

rust::Box<shield_mainnet::GroupHandle> HybridGroup::createHandle(const std::string& value) {
  auto handle = shield_mainnet::group_from_string(rust::String(value));
  return handle;
}

rust::Box<shield_mainnet::GroupHandle> HybridGroup::cloneHandle(shield_mainnet::GroupHandle& handle) {
  auto result = handle.group_clone();
  return result;
}

void HybridGroup::release() {
  if (handle_.has_value()) {
    handle_.reset();
  }
}

} // namespace margelo::nitro::shield
