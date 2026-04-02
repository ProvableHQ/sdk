#pragma once

#include "HybridNetworkSpec.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <memory>
#include <string>
#include <vector>

namespace margelo::nitro::shield {

class HybridNetwork : public HybridNetworkSpec {
 public:
  explicit HybridNetwork() : HybridObject(TAG) {}

  NetworkName getNetwork() override;
  void setNetwork(NetworkName network) override;

  static std::string getNetworkStatic();
};

} // namespace margelo::nitro::shield
