#pragma once

#include "HybridProvingKeySpec.hpp"
#ifndef testnet
#include "rust/shield_mainnet.h"
#else
#include "rust/shield_testnet.h"
#endif
#include <NitroModules/ArrayBuffer.hpp>
#include <memory>

namespace margelo::nitro::shield {

class HybridProvingKey : public HybridProvingKeySpec {
 public:
  explicit HybridProvingKey() : HybridObject(TAG) {}
  ~HybridProvingKey() override;

  std::shared_ptr<ArrayBuffer> toBytes() override;
  void initWithBytes(const std::shared_ptr<ArrayBuffer>& bytes) override;
  void initWithString(const std::string& key) override;
  std::string checksum() override;
  std::shared_ptr<HybridProvingKeySpec> copy() override;

  uint64_t getHandle() const {
    return _handle;
  }

  // Type checks with metadata JSON
  bool isBondPublicProver(const std::string& metadataJson) override;
  bool isBondValidatorProver(const std::string& metadataJson) override;
  bool isClaimUnbondPublicProver(const std::string& metadataJson) override;
  bool isFeePrivateProver(const std::string& metadataJson) override;
  bool isFeePublicProver(const std::string& metadataJson) override;
  bool isInclusionProver(const std::string& metadataJson) override;
  bool isJoinProver(const std::string& metadataJson) override;
  bool isSetValidatorStateProver(const std::string& metadataJson) override;
  bool isSplitProver(const std::string& metadataJson) override;
  bool isTransferPrivateProver(const std::string& metadataJson) override;
  bool isTransferPrivateToPublicProver(const std::string& metadataJson) override;
  bool isTransferPublicProver(const std::string& metadataJson) override;
  bool isTransferPublicAsSignerProver(const std::string& metadataJson) override;
  bool isTransferPublicToPrivateProver(const std::string& metadataJson) override;
  bool isUnbondPublicProver(const std::string& metadataJson) override;

 private:
  uint64_t _handle = 0;
};

} // namespace margelo::nitro::shield
