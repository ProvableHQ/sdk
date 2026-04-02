#pragma once

#include "HybridScalarSpec.hpp"
#include <optional>
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

class HybridScalar final : public HybridScalarSpec {
 public:
  HybridScalar();
  explicit HybridScalar(rust::Box<shield_mainnet::ScalarHandle>&& handle);
  ~HybridScalar() override;

  std::shared_ptr<HybridScalarSpec> fromString(const std::string& value) override;
  std::shared_ptr<HybridScalarSpec> clone() override;
  std::string toString() override;

  static std::shared_ptr<HybridScalarSpec> create();

 private:
  shield_mainnet::ScalarHandle& ensureHandle() const;
  static rust::Box<shield_mainnet::ScalarHandle> createHandle(const std::string& value);
  static rust::Box<shield_mainnet::ScalarHandle> cloneHandle(shield_mainnet::ScalarHandle& handle);
  void release();

 private:
  mutable std::optional<rust::Box<shield_mainnet::ScalarHandle>> handle_;
};

} // namespace margelo::nitro::shield
