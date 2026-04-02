#pragma once

#include "HybridAddressSpec.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include "Signature.hpp"
#include <memory>

namespace margelo::nitro::shield {

class HybridAddress : public HybridAddressSpec {
 public:
  explicit HybridAddress();
  
  // Destructor - clean up Rust resources if needed
  ~HybridAddress();

  // HybridAddressSpec implementation
  std::string toString() override;
  bool verify(const std::shared_ptr<ArrayBuffer>& message, const Signature& signature) override;

  // Static factory method to create HybridAddress from string
  static std::shared_ptr<HybridAddress> fromString(const std::string& addressString);

  // Internal constructor for creating from address handle (public for make_shared)
  explicit HybridAddress(uint64_t addressHandle);

 private:
  // Internal state - handle to Rust address object
  uint64_t _addressHandle = 0;
  
  // Rust FFI wrapper functions
  std::string rustAddressToString();
  bool rustAddressVerify(const std::shared_ptr<ArrayBuffer>& message, uint64_t signatureHandle);
  uint64_t extractSignatureHandle(const Signature& signature);
  
  // Helper to validate address string and create handle
  static uint64_t createAddressHandle(const std::string& addressString);

  // Friend classes that might need access to _addressHandle
  friend class HybridAccount;
};

} // namespace margelo::nitro::shield