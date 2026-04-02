#pragma once

#include "HybridPlaintextSpec.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <optional>
#include <memory>
#include <vector>
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

class HybridPlaintext final : public HybridPlaintextSpec {
 public:
  HybridPlaintext();
  explicit HybridPlaintext(rust::Box<shield_mainnet::PlaintextHandle>&& handle);

  std::shared_ptr<HybridPlaintextSpec> fromString(const std::string& value) override;
  std::shared_ptr<HybridPlaintextSpec> fromBytesLe(const std::shared_ptr<ArrayBuffer>& bytes) override;
  std::shared_ptr<HybridPlaintextSpec> fromBitsLe(const std::shared_ptr<ArrayBuffer>& bits) override;
  std::shared_ptr<HybridPlaintextSpec> fromFields(const std::vector<std::string>& fields) override;
  std::shared_ptr<HybridPlaintextSpec> clone() override;
  std::shared_ptr<HybridPlaintextSpec> find(const std::string& name) override;
  std::string toString() override;
  std::shared_ptr<ArrayBuffer> toBytesLe() override;
  std::shared_ptr<ArrayBuffer> toBitsLe() override;
  std::vector<std::string> toFields() override;
  std::string encrypt(const std::string& address, const std::string& randomizer) override;
  std::string encryptSymmetric(const std::string& transitionViewKey) override;
  std::string toObjectZero() override;
  std::string plaintextType() override;

  static std::shared_ptr<HybridPlaintext> makeFromString(const std::string& value);
  static std::shared_ptr<HybridPlaintext> makeFromBytes(const std::shared_ptr<ArrayBuffer>& bytes);
  static std::shared_ptr<HybridPlaintext> makeFromBits(const std::shared_ptr<ArrayBuffer>& bits);
  static std::shared_ptr<HybridPlaintext> makeFromFields(const std::vector<std::string>& fields);

  static std::shared_ptr<HybridPlaintextSpec> create();
  static std::shared_ptr<HybridPlaintextSpec> createFromString(const std::string& value);
  static std::shared_ptr<HybridPlaintextSpec> createFromBytes(const std::shared_ptr<ArrayBuffer>& bytes);
  static std::shared_ptr<HybridPlaintextSpec> createFromBits(const std::shared_ptr<ArrayBuffer>& bits);
  static std::shared_ptr<HybridPlaintextSpec> createFromFields(const std::vector<std::string>& fields);

  rust::Box<shield_mainnet::PlaintextHandle>* getHandle() { return _handle ? &*_handle : nullptr; }

 private:
  shield_mainnet::PlaintextHandle& ensureHandle() const;

  std::shared_ptr<ArrayBuffer> arrayBufferFromBytes(const rust::Vec<uint8_t>& bytes) const;

 private:
  mutable std::optional<rust::Box<shield_mainnet::PlaintextHandle>> _handle;
};

} // namespace margelo::nitro::shield
