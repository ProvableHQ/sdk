#include "HybridNetwork.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <cstring>
#include <memory>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

using namespace margelo::nitro;
using namespace margelo::nitro::shield;

namespace margelo::nitro::shield {

namespace {

  std::string network = "mainnet"; // Default network

} // namespace

NetworkName HybridNetwork::getNetwork() {
  if (network == "mainnet") {
    return NetworkName::MAINNET;
  }
  return NetworkName::TESTNET;
}

void HybridNetwork::setNetwork(NetworkName networkParam) {
  if (networkParam != NetworkName::MAINNET && networkParam != NetworkName::TESTNET) {
    throw std::invalid_argument("Invalid network: " + std::to_string(static_cast<int>(networkParam)) + ". Must be 'mainnet' or 'testnet'.");
  }
  // Set the global network variable (not the parameter)
  ::margelo::nitro::shield::network = (networkParam == NetworkName::MAINNET) ? "mainnet" : "testnet";
}

std::string HybridNetwork::getNetworkStatic() {
  return network;
}

} // namespace margelo::nitro::shield
