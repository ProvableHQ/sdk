#include "HybridProgram.hpp"

#include <stdexcept>
#include <utility>

#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

HybridProgram::HybridProgram() : HybridObject(TAG) {
  auto result = shield_mainnet::program_get_credits_program();
  _program = std::make_shared<rust::Box<shield_mainnet::ProgramHandle>>(std::move(result));
}

HybridProgram::HybridProgram(rust::Box<shield_mainnet::ProgramHandle>&& program)
    : HybridObject(TAG) {
  _program = std::make_shared<rust::Box<shield_mainnet::ProgramHandle>>(std::move(program));
}

shield_mainnet::ProgramHandle& HybridProgram::ensureProgram() const {
  if (!_program) {
    throw std::runtime_error("Program handle is null");
  }
  return **_program;
}

rust::Box<shield_mainnet::ProgramHandle>& HybridProgram::program() {
  if (!_program) {
    throw std::runtime_error("Program handle is null");
  }
  return *_program;
}

const rust::Box<shield_mainnet::ProgramHandle>& HybridProgram::program() const {
  if (!_program) {
    throw std::runtime_error("Program handle is null");
  }
  return *_program;
}

std::shared_ptr<HybridProgramSpec> HybridProgram::fromString(const std::string& program) {
  auto result = shield_mainnet::program_from_string(program.c_str());
  return std::make_shared<HybridProgram>(std::move(result));
}

std::shared_ptr<HybridProgramSpec> HybridProgram::clone() {
  auto cloned = ensureProgram().program_clone();
  return std::make_shared<HybridProgram>(std::move(cloned));
}

std::string HybridProgram::toString() {
  return ensureProgram().program_to_string().c_str();
}

bool HybridProgram::hasFunction(const std::string& functionName) {
  return ensureProgram().program_has_function(functionName.c_str());
}

std::vector<std::string> HybridProgram::convertVec(const rust::Vec<rust::String>& vec) const {
  std::vector<std::string> result;
  result.reserve(vec.size());
  for (const auto& item : vec) {
    result.emplace_back(std::string(item));
  }
  return result;
}

std::vector<std::string> HybridProgram::getFunctions() {
  return convertVec(ensureProgram().program_get_functions());
}

std::string HybridProgram::getFunctionInputs(const std::string& functionName) {
  auto result = ensureProgram().program_get_function_inputs(functionName.c_str());
  return std::string(result);
}

std::string HybridProgram::getMappings() {
  auto result = ensureProgram().program_get_mappings();
  return std::string(result);
}

std::string HybridProgram::getRecordMembers(const std::string& recordName) {
  auto result = ensureProgram().program_get_record_members(recordName.c_str());

  return std::string(result);
}

std::string HybridProgram::getStructMembers(const std::string& structName) {
  auto result = ensureProgram().program_get_struct_members(structName.c_str());

  return std::string(result);
}

std::vector<std::string> HybridProgram::getImports() {
  return convertVec(ensureProgram().program_get_imports());
}

std::string HybridProgram::id() {
  return ensureProgram().program_id().c_str();
}

std::string HybridProgram::address() {
  auto result = ensureProgram().program_address();

  return std::string(result);
}

bool HybridProgram::isEqual(const std::shared_ptr<HybridProgramSpec>& other) {
  auto otherImpl = std::dynamic_pointer_cast<HybridProgram>(other);
  if (!otherImpl) {
    throw std::runtime_error("Invalid Program instance");
  }
  return ensureProgram().program_is_equal(otherImpl->ensureProgram());
}

std::shared_ptr<HybridProgramSpec> HybridProgram::create() {
    return std::make_shared<HybridProgram>();
}

std::shared_ptr<HybridProgramSpec> HybridProgram::createFromString(const std::string& program) {
  auto result = shield_mainnet::program_from_string(program);
  return std::make_shared<HybridProgram>(std::move(result));
}

void HybridProgram::getCreditsProgram() {
  auto result = shield_mainnet::program_get_credits_program();
  _program = std::make_shared<rust::Box<shield_mainnet::ProgramHandle>>(std::move(result));
}

} // namespace margelo::nitro::shield
