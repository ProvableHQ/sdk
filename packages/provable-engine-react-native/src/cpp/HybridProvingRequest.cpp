#include "HybridProvingRequest.hpp"
#include "HybridAuthorization.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <NitroModules/Promise.hpp>
#include <cstring>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

// Include generated struct headers
#include "AuthorizationJSON.hpp"
#include "ProvingRequestJSON.hpp"

// Include generated Rust cxx bridge header
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

using namespace margelo::nitro;
using namespace margelo::nitro::shield;

namespace margelo::nitro::shield {

// Internal constructor for creating from proving request handle
HybridProvingRequest::HybridProvingRequest(uint64_t provingRequestHandle)
    : HybridObject(TAG), _provingRequestHandle(provingRequestHandle) {}

// Destructor - clean up Rust resources
HybridProvingRequest::~HybridProvingRequest() {
  if (_provingRequestHandle != 0) {
    shield_mainnet::destroy_proving_request(_provingRequestHandle);
  }
}

// Factory methods
std::shared_ptr<HybridProvingRequestSpec> HybridProvingRequest::create(
  const std::shared_ptr<HybridAuthorizationSpec>& authorization,
  const std::optional<std::shared_ptr<HybridAuthorizationSpec>>& feeAuthorization,
  bool broadcast
) {
  return fromAuthorizations(authorization, feeAuthorization, broadcast);
}

std::shared_ptr<HybridProvingRequestSpec> HybridProvingRequest::createWithFee(const std::shared_ptr<HybridAuthorizationSpec>& authorization, const std::optional<std::shared_ptr<HybridAuthorizationSpec>>& feeAuthorization, bool broadcast) {
  return fromAuthorizations(authorization, feeAuthorization, broadcast);
}

std::shared_ptr<HybridProvingRequestSpec> HybridProvingRequest::fromString(const std::string& request) {
  auto result = shield_mainnet::proving_request_from_string(rust::String(request));
  if (result.success) {
    return std::make_shared<HybridProvingRequest>(result.handle);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

std::shared_ptr<HybridProvingRequestSpec> HybridProvingRequest::fromBytesLe(const std::shared_ptr<ArrayBuffer>& bytes) {
  rust::Vec<uint8_t> bytesVec;
  for (size_t i = 0; i < bytes->size(); ++i) {
    bytesVec.push_back(bytes->data()[i]);
  }

  auto result = shield_mainnet::proving_request_from_bytes_le(bytesVec);
  if (result.success) {
    return std::make_shared<HybridProvingRequest>(result.handle);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

std::shared_ptr<HybridProvingRequestSpec>
HybridProvingRequest::fromAuthorizations(const std::shared_ptr<HybridAuthorizationSpec>& authorization,
                                         const std::optional<std::shared_ptr<HybridAuthorizationSpec>>& feeAuthorization, bool broadcast) {

  // Extract authorization handle
  auto authImpl = std::static_pointer_cast<HybridAuthorization>(authorization);
  uint64_t authHandle = authImpl->_authorizationHandle;

  // Extract fee authorization handle if present
  uint64_t feeAuthHandle = 0;
  if (feeAuthorization.has_value()) {
    auto feeAuthImpl = std::static_pointer_cast<HybridAuthorization>(feeAuthorization.value());
    feeAuthHandle = feeAuthImpl->_authorizationHandle;
  }

  auto result = shield_mainnet::proving_request_from_authorizations(authHandle, feeAuthHandle, broadcast);
  if (result.success) {
    return std::make_shared<HybridProvingRequest>(result.handle);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

// Serialization methods
std::string HybridProvingRequest::toString() {
  if (_provingRequestHandle == 0) {
    throw std::runtime_error("ProvingRequest handle is null");
  }

    auto result = shield_mainnet::proving_request_to_json(_provingRequestHandle);
  if (result.success) {
    return std::string(result.result);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

std::shared_ptr<ArrayBuffer> HybridProvingRequest::toBytesLe() {
  if (_provingRequestHandle == 0) {
    throw std::runtime_error("ProvingRequest handle is null");
  }

    auto result = shield_mainnet::proving_request_to_bytes_le(_provingRequestHandle);
  if (result.success) {
    auto buffer = ArrayBuffer::allocate(result.bytes.size());
    std::memcpy(buffer->data(), result.bytes.data(), result.bytes.size());
    return buffer;
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

ProvingRequestJSON HybridProvingRequest::toJSON() {
  if (_provingRequestHandle == 0) {
    throw std::runtime_error("ProvingRequest handle is null");
  }

  // Get the authorization and convert to JSON
  auto auth = authorization();
  auto authImpl = std::static_pointer_cast<HybridAuthorization>(auth);
  AuthorizationJSON authJSON = authImpl->toJSON();

  // Get the fee authorization (optional) and convert to JSON
  std::optional<AuthorizationJSON> feeAuthJSON;
  auto feeAuth = feeAuthorization();
  if (feeAuth.has_value()) {
    auto feeAuthImpl = std::static_pointer_cast<HybridAuthorization>(feeAuth.value());
    feeAuthJSON = feeAuthImpl->toJSON();
  }

  return ProvingRequestJSON(authJSON, feeAuthJSON, broadcast());
}

// Accessors
std::shared_ptr<HybridAuthorizationSpec> HybridProvingRequest::authorization() {
  if (_provingRequestHandle == 0) {
    throw std::runtime_error("ProvingRequest handle is null");
  }

  auto result = shield_mainnet::proving_request_get_authorization(_provingRequestHandle);
  if (result.success) {
    return std::make_shared<HybridAuthorization>(result.handle);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

std::optional<std::shared_ptr<HybridAuthorizationSpec>> HybridProvingRequest::feeAuthorization() {
  if (_provingRequestHandle == 0) {
    throw std::runtime_error("ProvingRequest handle is null");
  }

  auto result = shield_mainnet::proving_request_get_fee_authorization(_provingRequestHandle);
  if (result.success) {
    return std::make_shared<HybridAuthorization>(result.handle);
  } else {
    return std::nullopt;
  }
}

bool HybridProvingRequest::broadcast() {
  if (_provingRequestHandle == 0) {
    throw std::runtime_error("ProvingRequest handle is null");
  }

  return shield_mainnet::proving_request_get_broadcast(_provingRequestHandle);
}

// Utility methods
std::shared_ptr<HybridProvingRequestSpec> HybridProvingRequest::replicate() {
  if (_provingRequestHandle == 0) {
    throw std::runtime_error("ProvingRequest handle is null");
  }

    auto result = shield_mainnet::proving_request_replicate(_provingRequestHandle);
  if (result.success) {
    return std::make_shared<HybridProvingRequest>(result.handle);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

bool HybridProvingRequest::verify() {
  if (_provingRequestHandle == 0) {
    return false;
  }

  return shield_mainnet::proving_request_verify(_provingRequestHandle);
}

bool HybridProvingRequest::isEqual(const std::shared_ptr<HybridProvingRequestSpec>& other) {
  if (_provingRequestHandle == 0) {
    return false;
  }

  auto otherProvingRequest = std::static_pointer_cast<HybridProvingRequest>(other);
  if (otherProvingRequest->_provingRequestHandle == 0) {
    return false;
  }

  return shield_mainnet::proving_request_equals(_provingRequestHandle, otherProvingRequest->_provingRequestHandle);
}

} // namespace margelo::nitro::shield
