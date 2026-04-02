#include "HybridAuthorization.hpp"
#include "HybridField.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <NitroModules/Promise.hpp>
#include <cstring>
#include <memory>
#include <optional>
#include <stdexcept>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>

// Include generated struct headers
#include "AuthorizationJSON.hpp"
#include "RequestJSON.hpp"
#include "TransitionJSON.hpp"
#include "Transition.hpp"
#include "InputID.hpp"
#include "InputJSON.hpp"
#include "OutputJSON.hpp"

// Include generated Rust cxx bridge header
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

using namespace margelo::nitro;
using namespace margelo::nitro::shield;

namespace {

using Json = nlohmann::json;

std::string serializeInputID(const InputID& inputId) {
  return Json{{"type", inputId.type}, {"id", inputId.id}}.dump();
}

std::string serializeInputJSON(const InputJSON& input) {
  Json j = {{"type", input.type}, {"id", input.id}};
  if (input.tag.has_value()) {
    j["tag"] = input.tag.value();
  }
  if (input.value.has_value()) {
    j["value"] = input.value.value();
  }
  return j.dump();
}

std::string serializeOutputJSON(const OutputJSON& output) {
  Json j = {{"type", output.type}, {"id", output.id}, {"value", output.value}};
  if (output.checksum.has_value()) {
    j["checksum"] = output.checksum.value();
  }
  return j.dump();
}

std::string serializeRequestJSON(const RequestJSON& req) {
  Json inputIds = Json::array();
  for (const auto& inputId : req.input_ids) {
    inputIds.push_back(Json{{"type", inputId.type}, {"id", inputId.id}});
  }

  Json j = {
    {"signer", req.signer},
    {"network", req.network},
    {"program", req.program},
    {"function", req.method},
    {"input_ids", inputIds},
    {"inputs", req.inputs},
    {"signature", req.signature},
    {"sk_tag", req.sk_tag},
    {"tvk", req.tvk},
    {"tcm", req.tcm},
    {"scm", req.scm},
  };
  return j.dump();
}

std::string serializeTransitionJSON(const TransitionJSON& tr) {
  Json inputs = Json::array();
  if (tr.inputs.has_value()) {
    for (const auto& input : tr.inputs.value()) {
      Json ij = {{"type", input.type}, {"id", input.id}};
      if (input.tag.has_value()) {
        ij["tag"] = input.tag.value();
      }
      if (input.value.has_value()) {
        ij["value"] = input.value.value();
      }
      inputs.push_back(ij);
    }
  }

  Json outputs = Json::array();
  if (tr.outputs.has_value()) {
    for (const auto& output : tr.outputs.value()) {
      Json oj = {{"type", output.type}, {"id", output.id}, {"value", output.value}};
      if (output.checksum.has_value()) {
        oj["checksum"] = output.checksum.value();
      }
      outputs.push_back(oj);
    }
  }

  Json j = {
    {"id", tr.id},
    {"program", tr.program},
    {"function", tr.function},
    {"inputs", inputs},
    {"outputs", outputs},
    {"proof", tr.proof},
    {"tpk", tr.tpk},
    {"tcm", tr.tcm},
    {"scm", tr.scm},
    {"fee", tr.fee},
  };
  return j.dump();
}

std::string jsonStringOrEmpty(const Json& obj, const char* key) {
  auto it = obj.find(key);
  if (it == obj.end() || it->is_null()) {
    return "";
  }
  if (!it->is_string()) {
    throw std::runtime_error(std::string("Expected string for key: ") + key);
  }
  return it->get<std::string>();
}

std::optional<std::string> jsonOptionalString(const Json& obj, const char* key) {
  auto it = obj.find(key);
  if (it == obj.end() || it->is_null()) {
    return std::nullopt;
  }
  if (!it->is_string()) {
    throw std::runtime_error(std::string("Expected string for key: ") + key);
  }
  return it->get<std::string>();
}

int64_t jsonIntOrDefault(const Json& obj, const char* key) {
  auto it = obj.find(key);
  if (it == obj.end() || it->is_null()) {
    return 0;
  }
  if (!it->is_number_integer() && !it->is_number_unsigned()) {
    throw std::runtime_error(std::string("Expected integer for key: ") + key);
  }
  return it->get<int64_t>();
}

InputID parseInputID(const Json& json) {
  if (!json.is_object()) {
    throw std::runtime_error("InputID must be a JSON object");
  }
  return InputID(
    jsonStringOrEmpty(json, "type"),
    jsonStringOrEmpty(json, "id")
  );
}

InputJSON parseInputJSON(const Json& json) {
  if (!json.is_object()) {
    throw std::runtime_error("InputJSON must be a JSON object");
  }
  return InputJSON(
    jsonStringOrEmpty(json, "type"),
    jsonStringOrEmpty(json, "id"),
    jsonOptionalString(json, "tag"),
    jsonOptionalString(json, "value")
  );
}

OutputJSON parseOutputJSON(const Json& json) {
  if (!json.is_object()) {
    throw std::runtime_error("OutputJSON must be a JSON object");
  }
  return OutputJSON(
    jsonStringOrEmpty(json, "type"),
    jsonStringOrEmpty(json, "id"),
    jsonOptionalString(json, "checksum"),
    jsonStringOrEmpty(json, "value")
  );
}

RequestJSON parseRequestJSON(const Json& json) {
  if (!json.is_object()) {
    throw std::runtime_error("RequestJSON must be a JSON object");
  }

  std::vector<InputID> input_ids;
  auto inputIdsIt = json.find("input_ids");
  if (inputIdsIt != json.end() && inputIdsIt->is_array()) {
    input_ids.reserve(inputIdsIt->size());
    for (const auto& inputId : *inputIdsIt) {
      input_ids.push_back(parseInputID(inputId));
    }
  }

  std::vector<std::string> inputs;
  auto inputsIt = json.find("inputs");
  if (inputsIt != json.end() && inputsIt->is_array()) {
    inputs.reserve(inputsIt->size());
    for (const auto& input : *inputsIt) {
      if (!input.is_string()) {
        throw std::runtime_error("RequestJSON.inputs must contain strings");
      }
      inputs.push_back(input.get<std::string>());
    }
  }

  return RequestJSON(
    jsonStringOrEmpty(json, "signer"),
    jsonStringOrEmpty(json, "network"),
    jsonStringOrEmpty(json, "program"),
    jsonStringOrEmpty(json, "function"),
    input_ids,
    inputs,
    jsonStringOrEmpty(json, "signature"),
    jsonStringOrEmpty(json, "sk_tag"),
    jsonStringOrEmpty(json, "tvk"),
    jsonStringOrEmpty(json, "tcm"),
    jsonStringOrEmpty(json, "scm")
  );
}

TransitionJSON parseTransitionJSON(const Json& json) {
  if (!json.is_object()) {
    throw std::runtime_error("TransitionJSON must be a JSON object");
  }

  std::optional<std::vector<InputJSON>> inputs;
  auto inputsIt = json.find("inputs");
  if (inputsIt != json.end() && inputsIt->is_array()) {
    std::vector<InputJSON> inputVec;
    inputVec.reserve(inputsIt->size());
    for (const auto& input : *inputsIt) {
      inputVec.push_back(parseInputJSON(input));
    }
    inputs = inputVec;
  }

  std::optional<std::vector<OutputJSON>> outputs;
  auto outputsIt = json.find("outputs");
  if (outputsIt != json.end() && outputsIt->is_array()) {
    std::vector<OutputJSON> outputVec;
    outputVec.reserve(outputsIt->size());
    for (const auto& output : *outputsIt) {
      outputVec.push_back(parseOutputJSON(output));
    }
    outputs = outputVec;
  }

  return TransitionJSON(
    jsonStringOrEmpty(json, "id"),
    jsonStringOrEmpty(json, "program"),
    jsonStringOrEmpty(json, "function"),
    inputs,
    outputs,
    jsonStringOrEmpty(json, "proof"),
    jsonStringOrEmpty(json, "tpk"),
    jsonStringOrEmpty(json, "tcm"),
    jsonStringOrEmpty(json, "scm"),
    jsonIntOrDefault(json, "fee")
  );
}

std::vector<RequestJSON> parseRequestJSONArray(const std::string& jsonArray) {
  Json parsed = Json::parse(jsonArray);
  if (!parsed.is_array()) {
    throw std::runtime_error("authorization_get_requests did not return a JSON array");
  }

  std::vector<RequestJSON> requests;
  requests.reserve(parsed.size());
  for (const auto& item : parsed) {
    requests.push_back(parseRequestJSON(item));
  }
  return requests;
}

std::vector<TransitionJSON> parseTransitionJSONArray(const std::string& jsonArray) {
  Json parsed = Json::parse(jsonArray);
  if (!parsed.is_array()) {
    throw std::runtime_error("authorization_get_transitions did not return a JSON array");
  }

  std::vector<TransitionJSON> transitions;
  transitions.reserve(parsed.size());
  for (const auto& item : parsed) {
    transitions.push_back(parseTransitionJSON(item));
  }
  return transitions;
}

} // anonymous namespace

namespace margelo::nitro::shield {

// Internal constructor for creating from authorization handle
HybridAuthorization::HybridAuthorization(uint64_t authorizationHandle) : HybridObject(TAG), _authorizationHandle(authorizationHandle) {}

// Destructor - clean up Rust resources
HybridAuthorization::~HybridAuthorization() {
  if (_authorizationHandle != 0) {
    shield_mainnet::destroy_authorization(_authorizationHandle);
  }
}

// Factory methods
std::shared_ptr<HybridAuthorizationSpec> HybridAuthorization::fromString(const std::string& authorizationString) {
  auto result = shield_mainnet::authorization_from_string(rust::String(authorizationString));
  if (result.success) {
    return std::make_shared<HybridAuthorization>(result.handle);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

std::shared_ptr<HybridAuthorizationSpec> HybridAuthorization::fromBytesLe(const std::shared_ptr<ArrayBuffer>& bytes) {
  rust::Vec<uint8_t> bytesVec;
  for (size_t i = 0; i < bytes->size(); ++i) {
    bytesVec.push_back(bytes->data()[i]);
  }

  auto result = shield_mainnet::authorization_from_bytes_le(bytesVec);
  if (result.success) {
    return std::make_shared<HybridAuthorization>(result.handle);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

std::shared_ptr<HybridAuthorizationSpec> HybridAuthorization::fromRequestsAndTransitions(const std::vector<RequestJSON>& requests,
                                                                                         const std::vector<TransitionJSON>& transitions) {
  rust::Vec<rust::String> requestsVec;
  for (const auto& req : requests) {
    requestsVec.push_back(rust::String(serializeRequestJSON(req)));
  }

  rust::Vec<rust::String> transitionsVec;
  for (const auto& tr : transitions) {
    transitionsVec.push_back(rust::String(serializeTransitionJSON(tr)));
  }

  auto result = shield_mainnet::authorization_from_requests_and_transitions(std::move(requestsVec), std::move(transitionsVec));
  if (result.success) {
    return std::make_shared<HybridAuthorization>(result.handle);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

// Serialization methods
std::string HybridAuthorization::toString() {
  if (_authorizationHandle == 0) {
    throw std::runtime_error("Authorization handle is null");
  }

    auto result = shield_mainnet::authorization_to_string(_authorizationHandle);
  if (result.success) {
    return std::string(result.result);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

std::shared_ptr<ArrayBuffer> HybridAuthorization::toBytesLe() {
  if (_authorizationHandle == 0) {
    throw std::runtime_error("Authorization handle is null");
  }

    auto result = shield_mainnet::authorization_to_bytes_le(_authorizationHandle);
  if (result.success) {
    auto buffer = ArrayBuffer::allocate(result.bytes.size());
    std::memcpy(buffer->data(), result.bytes.data(), result.bytes.size());
    return buffer;
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

AuthorizationJSON HybridAuthorization::toJSON() {
  if (_authorizationHandle == 0) {
    throw std::runtime_error("Authorization handle is null");
  }

  return AuthorizationJSON(getRequests(), getTransitions());
}

// Accessors
std::vector<RequestJSON> HybridAuthorization::getRequests() {
  if (_authorizationHandle == 0) {
    throw std::runtime_error("Authorization handle is null");
  }

  auto result = shield_mainnet::authorization_get_requests(_authorizationHandle);
  if (!result.success) {
    throw std::runtime_error(std::string(result.error));
  }

  std::string jsonArray = std::string(result.result);
  return parseRequestJSONArray(jsonArray);
}

std::vector<TransitionJSON> HybridAuthorization::getTransitions() {
  if (_authorizationHandle == 0) {
    throw std::runtime_error("Authorization handle is null");
  }

  auto result = shield_mainnet::authorization_get_transitions(_authorizationHandle);
  if (!result.success) {
    throw std::runtime_error(std::string(result.error));
  }

  std::string jsonArray = std::string(result.result);
  return parseTransitionJSONArray(jsonArray);
}

// Utility methods
std::shared_ptr<HybridAuthorizationSpec> HybridAuthorization::replicate() {
  if (_authorizationHandle == 0) {
    throw std::runtime_error("Authorization handle is null");
  }

  auto result = shield_mainnet::authorization_replicate(_authorizationHandle);
  if (result.success) {
    return std::make_shared<HybridAuthorization>(result.handle);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

bool HybridAuthorization::verify() {
  if (_authorizationHandle == 0) {
    return false;
  }

  return shield_mainnet::authorization_verify(_authorizationHandle);
}

// New methods for comprehensive API coverage
bool HybridAuthorization::isEqual(const std::shared_ptr<HybridAuthorizationSpec>& other) {
  if (_authorizationHandle == 0) {
    return false;
  }

  auto otherAuthorization = std::static_pointer_cast<HybridAuthorization>(other);
  if (otherAuthorization->_authorizationHandle == 0) {
    return false;
  }

  return shield_mainnet::authorization_equals(_authorizationHandle, otherAuthorization->_authorizationHandle);
}

double HybridAuthorization::len() {
  if (_authorizationHandle == 0) {
    return 0;
  }

  return shield_mainnet::authorization_len(_authorizationHandle);
}

bool HybridAuthorization::isEmpty() {
  if (_authorizationHandle == 0) {
    return true;
  }

  return shield_mainnet::authorization_is_empty(_authorizationHandle);
}

bool HybridAuthorization::isFeePrivate() {
  if (_authorizationHandle == 0) {
    return false;
  }

  return shield_mainnet::authorization_is_fee_private(_authorizationHandle);
}

bool HybridAuthorization::isFeePublic() {
  if (_authorizationHandle == 0) {
    return false;
  }

  return shield_mainnet::authorization_is_fee_public(_authorizationHandle);
}

bool HybridAuthorization::isSplit() {
  if (_authorizationHandle == 0) {
    return false;
  }

  return shield_mainnet::authorization_is_split(_authorizationHandle);
}

void HybridAuthorization::insertTransition(const Transition& transition) {
  if (_authorizationHandle == 0) {
    throw std::runtime_error("Authorization handle is null");
  }

  // Extract TransitionJSON from the Transition's async callback.
  // The promise must already be resolved (e.g. via Promise::resolved()) — we
  // do NOT spin-wait because that blocks the JS thread and risks deadlock if
  // the promise settlement itself depends on JS execution.
  auto jsonPromise = transition.toJSON();
  if (!jsonPromise) {
    throw std::runtime_error("transition.toJSON() returned null");
  }

  if (jsonPromise->isRejected()) {
    throw std::runtime_error("Failed to get transition JSON: promise rejected");
  }
  if (!jsonPromise->isResolved()) {
    throw std::runtime_error(
      "transition.toJSON() promise is not yet resolved — "
      "insertTransition requires synchronously available data");
  }

  auto transitionJSON = jsonPromise->getResult();
  std::string jsonStr = serializeTransitionJSON(transitionJSON);

  auto result = shield_mainnet::authorization_insert_transition(
    _authorizationHandle,
    rust::String(jsonStr)
  );

  if (!result.success) {
    throw std::runtime_error(std::string(result.error));
  }
}

std::shared_ptr<HybridFieldSpec> HybridAuthorization::toExecutionId() {
  if (_authorizationHandle == 0) {
    throw std::runtime_error("Authorization handle is null");
  }

  auto result = shield_mainnet::authorization_to_execution_id(_authorizationHandle);
  if (result.success) {
    return HybridField::create()->fromString(std::string(result.result));
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

std::vector<Transition> HybridAuthorization::transitions() {
  if (_authorizationHandle == 0) {
    throw std::runtime_error("Authorization handle is null");
  }

  // Get transitions as TransitionJSON objects, then wrap each in a Transition struct
  auto transitionJSONs = getTransitions();
  std::vector<Transition> result;

  for (const auto& tj : transitionJSONs) {
    auto captured = tj;
    result.push_back(Transition(
      [captured]() mutable -> std::shared_ptr<Promise<TransitionJSON>> {
        return Promise<TransitionJSON>::resolved(std::move(captured));
      },
      [captured]() mutable -> std::shared_ptr<Promise<std::string>> {
        return Promise<std::string>::resolved(std::move(captured.id));
      },
      [captured]() mutable -> std::shared_ptr<Promise<std::string>> {
        return Promise<std::string>::resolved(std::move(captured.program));
      },
      [captured]() mutable -> std::shared_ptr<Promise<std::string>> {
        return Promise<std::string>::resolved(std::move(captured.function));
      },
      [captured]() mutable -> std::shared_ptr<Promise<std::string>> {
        return Promise<std::string>::resolved(std::move(captured.proof));
      },
      [captured]() -> std::shared_ptr<Promise<std::string>> {
        return Promise<std::string>::resolved(std::to_string(captured.fee));
      }
    ));
  }

  return result;
}

} // namespace margelo::nitro::shield
