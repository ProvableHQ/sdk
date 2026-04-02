#pragma once

#include "HybridViewKeySpec.hpp"
#include "HybridFieldSpec.hpp"
#include "RecordPlaintext.hpp"
#include <memory>
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

class HybridViewKey : public HybridViewKeySpec {
 public:
  explicit HybridViewKey();

  // Destructor - clean up Rust resources if needed
  ~HybridViewKey();

  // HybridViewKeySpec implementation
  std::string toString() override;
  std::shared_ptr<HybridAddressSpec> toAddress() override;
  RecordPlaintext decrypt(const std::string& ciphertext) override;
  std::shared_ptr<HybridFieldSpec> toField() override;
  std::shared_ptr<ArrayBuffer> toBytesLe() override;
  std::shared_ptr<HybridViewKeySpec> fromBytesLe(const std::shared_ptr<ArrayBuffer>& bytes) override;

  // Static factory method to create HybridViewKey from string
  static std::shared_ptr<HybridViewKey> fromString(const std::string& viewKeyString);

  // Static factory methods for creating HybridViewKey instances from TypeScript
  static std::shared_ptr<HybridViewKeySpec> create();
  static std::shared_ptr<HybridViewKeySpec> createFromString(const std::string& viewKeyString);

  // Internal constructor for creating from view key handle (public for make_shared)
  explicit HybridViewKey(uint64_t viewKeyHandle);

 private:
  // Internal state - handle to Rust view key object
  uint64_t _viewKeyHandle = 0;

  // Rust FFI wrapper functions
  std::string rustViewKeyToString();
  uint64_t rustViewKeyToAddress();
  RecordPlaintext rustViewKeyDecrypt(const std::string& ciphertext);
  rust::Box<shield_mainnet::FieldHandle> rustViewKeyToField();
  rust::Vec<uint8_t> rustViewKeyToBytesLe();

  // Helper to validate view key string and create handle
  static uint64_t createViewKeyHandle(const std::string& viewKeyString);

  // Friend classes that might need access to _viewKeyHandle
  friend class HybridAccount;
  friend class HybridPrivateKey;
  friend class HybridTransaction;
  friend class HybridProgramManager;
};

} // namespace margelo::nitro::shield
