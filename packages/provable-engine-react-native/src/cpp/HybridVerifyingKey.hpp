#pragma once

#include "HybridVerifyingKeySpec.hpp"
#ifndef testnet
#include "rust/shield_mainnet.h"
#else
#include "rust/shield_testnet.h"
#endif
#include <NitroModules/ArrayBuffer.hpp>
#include <memory>

namespace margelo::nitro::shield {

class HybridVerifyingKey : public HybridVerifyingKeySpec {
 public:
  explicit HybridVerifyingKey() : HybridObject(TAG) {}
  ~HybridVerifyingKey() override;

  std::shared_ptr<ArrayBuffer> toBytes() override;
  void initWithBytes(const std::shared_ptr<ArrayBuffer>& bytes) override;
  void initWithString(const std::string& key) override;
  std::string checksum() override;
  double numConstraints() override;
  std::shared_ptr<HybridVerifyingKeySpec> copy() override;

  uint64_t getHandle() const {
    return _handle;
  }

  // Init known credits.aleo verifying keys
  void initBondPublicVerifier() override;
  void initBondValidatorVerifier() override;
  void initClaimUnbondPublicVerifier() override;
  void initFeePrivateVerifier() override;
  void initFeePublicVerifier() override;
  void initInclusionVerifier() override;
  void initJoinVerifier() override;
  void initSetValidatorStateVerifier() override;
  void initSplitVerifier() override;
  void initTransferPrivateVerifier() override;
  void initTransferPrivateToPublicVerifier() override;
  void initTransferPublicVerifier() override;
  void initTransferPublicAsSignerVerifier() override;
  void initTransferPublicToPrivateVerifier() override;
  void initUnbondPublicVerifier() override;

  // Type checks
  bool isBondPublicVerifier() override;
  bool isBondValidatorVerifier() override;
  bool isClaimUnbondPublicVerifier() override;
  bool isFeePrivateVerifier() override;
  bool isFeePublicVerifier() override;
  bool isInclusionVerifier() override;
  bool isJoinVerifier() override;
  bool isSetValidatorStateVerifier() override;
  bool isSplitVerifier() override;
  bool isTransferPrivateVerifier() override;
  bool isTransferPrivateToPublicVerifier() override;
  bool isTransferPublicVerifier() override;
  bool isTransferPublicAsSignerVerifier() override;
  bool isTransferPublicToPrivateVerifier() override;
  bool isUnbondPublicVerifier() override;

 private:
  uint64_t _handle = 0;
};

} // namespace margelo::nitro::shield
