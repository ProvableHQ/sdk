// AUTO-GENERATED STYLE WRAPPER (hand-written implementation)
#pragma once

#include "HybridOfflineQuerySpec.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <memory>
#include <string>
#ifndef testnet
#include "rust/shield_mainnet.h"
#else
#include "rust/shield_mainnet.h"
#endif

namespace margelo::nitro::shield {

class HybridOfflineQuery : public HybridOfflineQuerySpec {
 public:
  explicit HybridOfflineQuery() : HybridObject(TAG) {}
  ~HybridOfflineQuery() override;

  std::shared_ptr<ArrayBuffer> toBytes() override;
  void initWithBytes(const std::shared_ptr<ArrayBuffer>& bytes) override;
  void initWithString(const std::string& json) override;
  void addBlockHeight(double height) override;
  void addStatePath(const std::string& commitment, const std::string& statePath) override;

  uint64_t getHandle() const {
    return _handle;
  }

 private:
  uint64_t _handle{0};
};

} // namespace margelo::nitro::shield
