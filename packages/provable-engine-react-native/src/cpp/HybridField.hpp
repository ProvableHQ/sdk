#pragma once

#include "HybridFieldSpec.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <optional>
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

class HybridField final : public HybridFieldSpec {
 public:
  HybridField();
  explicit HybridField(rust::Box<shield_mainnet::FieldHandle>&& handle);
  ~HybridField() override;

  std::shared_ptr<HybridFieldSpec> fromString(const std::string& value) override;
  std::shared_ptr<HybridFieldSpec> clone() override;
  std::string asString() override;
  std::shared_ptr<ArrayBuffer> toBitsLe() override;
  std::shared_ptr<HybridFieldSpec> multiply(const std::shared_ptr<HybridFieldSpec>& rhs) override;
  std::shared_ptr<HybridFieldSpec> one() override;
  std::shared_ptr<HybridFieldSpec> newDomainSeparator(const std::string& domain) override;

  static std::shared_ptr<HybridFieldSpec> create();

  shield_mainnet::FieldHandle& ensureHandle() const;

 private:
  static rust::Box<shield_mainnet::FieldHandle> createHandle(const std::string& value);
  static rust::Box<shield_mainnet::FieldHandle> cloneHandle(shield_mainnet::FieldHandle& handle);
  static rust::Box<shield_mainnet::FieldHandle> multiplyHandles(shield_mainnet::FieldHandle& lhs, shield_mainnet::FieldHandle& rhs);
  static std::shared_ptr<ArrayBuffer> arrayBufferFromBytes(const rust::Vec<uint8_t>& bytes);
  void release();

 private:
  mutable std::optional<rust::Box<shield_mainnet::FieldHandle>> handle_;
};

} // namespace margelo::nitro::shield
