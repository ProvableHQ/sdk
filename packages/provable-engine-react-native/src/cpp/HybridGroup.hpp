#pragma once

#include "HybridGroupSpec.hpp"
#include <optional>
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {
class HybridGroup final : public HybridGroupSpec {
 public:
  HybridGroup();
  explicit HybridGroup(rust::Box<shield_mainnet::GroupHandle>&& handle);
  ~HybridGroup() override;

  std::shared_ptr<HybridGroupSpec> fromString(const std::string& value) override;
  std::shared_ptr<HybridGroupSpec> clone() override;
  std::string toString() override;

  static std::shared_ptr<HybridGroupSpec> create();

 private:
  shield_mainnet::GroupHandle& ensureHandle() const;
  static rust::Box<shield_mainnet::GroupHandle> createHandle(const std::string& value);
  static rust::Box<shield_mainnet::GroupHandle> cloneHandle(shield_mainnet::GroupHandle& handle);
  void release();

 private:
  mutable std::optional<rust::Box<shield_mainnet::GroupHandle>> handle_;
};

} // namespace margelo::nitro::shield
