#pragma once

#include "HybridAuthorizationSpec.hpp"
#include "HybridField.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

namespace margelo::nitro::shield {

class HybridAuthorization : public HybridAuthorizationSpec {
 public:
  explicit HybridAuthorization() : HybridObject(TAG) {}
  ~HybridAuthorization();

  // Factory methods
  std::shared_ptr<HybridAuthorizationSpec> fromString(const std::string& authorizationString) override;
  std::shared_ptr<HybridAuthorizationSpec> fromBytesLe(const std::shared_ptr<ArrayBuffer>& bytes) override;
  std::shared_ptr<HybridAuthorizationSpec> fromRequestsAndTransitions(const std::vector<RequestJSON>& requests,
                                                                      const std::vector<TransitionJSON>& transitions) override;

  // Serialization methods
  std::string toString();
  std::shared_ptr<ArrayBuffer> toBytesLe() override;
  AuthorizationJSON toJSON() override;

  // Accessors
  std::vector<RequestJSON> getRequests() override;
  std::vector<TransitionJSON> getTransitions() override;
  std::vector<Transition> transitions() override;

  // Utility methods
  std::shared_ptr<HybridAuthorizationSpec> replicate() override;
  bool verify() override;

  // New methods for comprehensive API coverage
  bool isEqual(const std::shared_ptr<HybridAuthorizationSpec>& other) override;
  double len() override;
  bool isEmpty() override;
  bool isFeePrivate() override;
  bool isFeePublic() override;
  bool isSplit() override;
  void insertTransition(const Transition& transition) override;
  std::shared_ptr<HybridFieldSpec> toExecutionId() override;

  // Internal constructor for creating from authorization handle
  explicit HybridAuthorization(uint64_t authorizationHandle);

 private:
  // Internal state
  uint64_t _authorizationHandle = 0;

  // Friend classes that need access to _authorizationHandle
  friend class HybridProvingRequest;
};

} // namespace margelo::nitro::shield
