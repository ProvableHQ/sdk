#pragma once

#include "ComputeKey.hpp"
#include "HybridPrivateKeySpec.hpp"
#include "Signature.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <memory>

namespace margelo::nitro::shield {

class HybridPrivateKey : public HybridPrivateKeySpec {
 public:
  explicit HybridPrivateKey();

  // Destructor - clean up Rust resources if needed
  ~HybridPrivateKey();

  // HybridPrivateKeySpec implementation
  std::string toString() override;
  std::shared_ptr<HybridAddressSpec> toAddress() override;
  std::shared_ptr<HybridViewKeySpec> toViewKey() override;
  ComputeKey toComputeKey() override;
  Signature sign(const std::shared_ptr<ArrayBuffer>& message) override;

  // Static factory methods to create HybridPrivateKey
  static std::shared_ptr<HybridPrivateKey> fromString(const std::string& privateKeyString);
  static std::shared_ptr<HybridPrivateKey> fromSeed(const std::shared_ptr<ArrayBuffer>& seed);
  static std::shared_ptr<HybridPrivateKey> generate();

  // Static factory methods for creating HybridPrivateKey instances from TypeScript
  static std::shared_ptr<HybridPrivateKeySpec> create();
  static std::shared_ptr<HybridPrivateKeySpec> createFromString(const std::string& privateKeyString);
  static std::shared_ptr<HybridPrivateKeySpec> createFromSeed(const std::shared_ptr<ArrayBuffer>& seed);

  // Internal constructor for creating from private key handle (public for make_shared)
  explicit HybridPrivateKey(uint64_t privateKeyHandle);

  // Get the internal handle (used by other hybrid objects)
  uint64_t getHandle() const {
    return _privateKeyHandle;
  }

 private:
  // Internal state - handle to Rust private key object
  uint64_t _privateKeyHandle = 0;

  // Rust FFI wrapper functions
  std::string rustPrivateKeyToString();
  uint64_t rustPrivateKeyToAddress();
  uint64_t rustPrivateKeyToViewKey();
  ComputeKey rustPrivateKeyToComputeKey();
  Signature rustPrivateKeySign(const std::shared_ptr<ArrayBuffer>& message);

  // Helper to validate private key string and create handle
  static uint64_t createPrivateKeyHandle(const std::string& privateKeyString);
  static uint64_t createPrivateKeyFromSeed(const std::shared_ptr<ArrayBuffer>& seed);
  static uint64_t generatePrivateKey();

  // Friend classes that might need access to _privateKeyHandle
  friend class HybridAccount;
};

} // namespace margelo::nitro::shield
