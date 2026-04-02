#pragma once

#include "HybridProgramSpec.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <memory>
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

class HybridProgram final : public HybridProgramSpec {
 public:
  HybridProgram();
  explicit HybridProgram(rust::Box<shield_mainnet::ProgramHandle>&& program);

  std::shared_ptr<HybridProgramSpec> fromString(const std::string& program) override;
  std::shared_ptr<HybridProgramSpec> clone() override;
  std::string toString() override;
  bool hasFunction(const std::string& functionName) override;
  std::vector<std::string> getFunctions() override;
  std::string getFunctionInputs(const std::string& functionName) override;
  std::string getMappings() override;
  std::string getRecordMembers(const std::string& recordName) override;
  std::string getStructMembers(const std::string& structName) override;
  std::vector<std::string> getImports() override;
  std::string id() override;
  std::string address() override;
  bool isEqual(const std::shared_ptr<HybridProgramSpec>& other) override;

  static std::shared_ptr<HybridProgramSpec> create();
  static std::shared_ptr<HybridProgramSpec> createFromString(const std::string& program);
  void getCreditsProgram() override;

  rust::Box<shield_mainnet::ProgramHandle>& program();
  const rust::Box<shield_mainnet::ProgramHandle>& program() const;

 private:
  shield_mainnet::ProgramHandle& ensureProgram() const;
  std::vector<std::string> convertVec(const rust::Vec<rust::String>& vec) const;

 private:
  mutable std::shared_ptr<rust::Box<shield_mainnet::ProgramHandle>> _program;
};

} // namespace margelo::nitro::shield
