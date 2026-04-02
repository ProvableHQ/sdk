#pragma once

#include "HybridCryptoSpec.hpp"
#include "HybridFieldSpec.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <memory>
#include <string>
#include <vector>

namespace margelo::nitro::shield {

class HybridCrypto : public HybridCryptoSpec {
 public:
  explicit HybridCrypto() : HybridObject(TAG) {}

  // BHP hash functions
  std::string bhp256Hash(const std::shared_ptr<ArrayBuffer>& data) override;
  std::string bhp256HashToGroup(const std::shared_ptr<ArrayBuffer>& data) override;
  std::string bhp256Commit(const std::shared_ptr<ArrayBuffer>& data, const std::string& scalar) override;
  std::string bhp256CommitToGroup(const std::shared_ptr<ArrayBuffer>& data, const std::string& scalar) override;
  std::string bhp512Hash(const std::shared_ptr<ArrayBuffer>& data) override;
  std::string bhp512HashToGroup(const std::shared_ptr<ArrayBuffer>& data) override;
  std::string bhp512Commit(const std::shared_ptr<ArrayBuffer>& data, const std::string& scalar) override;
  std::string bhp512CommitToGroup(const std::shared_ptr<ArrayBuffer>& data, const std::string& scalar) override;
  std::string bhp768Hash(const std::shared_ptr<ArrayBuffer>& data) override;
  std::string bhp768HashToGroup(const std::shared_ptr<ArrayBuffer>& data) override;
  std::string bhp768Commit(const std::shared_ptr<ArrayBuffer>& data, const std::string& scalar) override;
  std::string bhp768CommitToGroup(const std::shared_ptr<ArrayBuffer>& data, const std::string& scalar) override;
  std::string bhp1024Hash(const std::shared_ptr<ArrayBuffer>& data) override;
  std::string bhp1024HashToGroup(const std::shared_ptr<ArrayBuffer>& data) override;
  std::string bhp1024Commit(const std::shared_ptr<ArrayBuffer>& data, const std::string& scalar) override;
  std::string bhp1024CommitToGroup(const std::shared_ptr<ArrayBuffer>& data, const std::string& scalar) override;

  // Pedersen hash functions
  std::string pedersen64Hash(const std::shared_ptr<ArrayBuffer>& data) override;
  std::string pedersen64Commit(const std::shared_ptr<ArrayBuffer>& bits, const std::string& scalar) override;
  std::string pedersen64CommitToGroup(const std::shared_ptr<ArrayBuffer>& bits, const std::string& scalar) override;
  std::string pedersen128Hash(const std::shared_ptr<ArrayBuffer>& data) override;
  std::string pedersen128Commit(const std::shared_ptr<ArrayBuffer>& bits, const std::string& scalar) override;
  std::string pedersen128CommitToGroup(const std::shared_ptr<ArrayBuffer>& bits, const std::string& scalar) override;

  // Poseidon hash functions
  std::string poseidon2Hash(const std::vector<std::string>& fields) override;
  std::string poseidon2HashToScalar(const std::vector<std::string>& fields) override;
  std::string poseidon2HashToGroup(const std::vector<std::string>& fields) override;
  std::vector<std::string> poseidon2HashMany(const std::vector<std::string>& fields, double rate) override;
  std::shared_ptr<HybridFieldSpec> poseidon4Hash(const std::vector<std::string>& fields) override;
  std::string poseidon4HashToScalar(const std::vector<std::string>& fields) override;
  std::string poseidon4HashToGroup(const std::vector<std::string>& fields) override;
  std::vector<std::string> poseidon4HashMany(const std::vector<std::string>& fields, double rate) override;

  std::string poseidon8Hash(const std::vector<std::string>& fields) override;
  std::string poseidon8HashToScalar(const std::vector<std::string>& fields) override;
  std::string poseidon8HashToGroup(const std::vector<std::string>& fields) override;
  std::vector<std::string> poseidon8HashMany(const std::vector<std::string>& fields, double rate) override;

  // Key generation functions
  KeyPairResult generateKeyPair() override;
  std::string computeKeyFromPrivateKey(const std::string& privateKey) override;
  std::string graphKeyFromPrivateKey(const std::string& privateKey) override;

  // Mnemonic functions
  bool verifyMnemonic(const std::string& mnemonic) override;
  std::string generateMnemonic() override;

 private:
  // Helper methods for Rust FFI calls
  KeyPairResult createKeyPairResult(const std::string& privateKey, const std::string& publicKey, const std::string& address);
};

} // namespace margelo::nitro::shield
