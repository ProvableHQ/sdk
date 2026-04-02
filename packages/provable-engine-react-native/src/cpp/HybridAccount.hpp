#pragma once

#include "HybridAccountSpec.hpp"
#include "HybridAddressSpec.hpp"
#include "HybridPrivateKeySpec.hpp"
#include "HybridViewKeySpec.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <cstdint>
#include "ComputeKey.hpp"
#include "Signature.hpp"
#include "RecordCiphertext.hpp"
#include "RecordPlaintext.hpp"
#include "HybridPlaintext.hpp"
#include "HybridField.hpp"
#include "HybridGroup.hpp"
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

namespace margelo::nitro::shield {

#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif
class HybridAccount : public HybridAccountSpec {
 public:
  explicit HybridAccount() : HybridObject(TAG) {}

  // Account creation methods
  std::shared_ptr<HybridPrivateKeySpec> createPrivateKey() override;
  std::shared_ptr<HybridPrivateKeySpec> privateKeyFromSeed(const std::shared_ptr<ArrayBuffer>& seed) override;
  std::shared_ptr<HybridPrivateKeySpec> privateKeyFromString(const std::string& privateKey) override;
  std::shared_ptr<HybridAddressSpec> addressFromString(const std::string& address) override;
  std::shared_ptr<HybridViewKeySpec> viewKeyFromString(const std::string& viewKey) override;
  ComputeKey computeKeyFromString(const std::string& computeKey) override;
  Signature signatureFromString(const std::string& signature) override;
  RecordCiphertext recordCiphertextFromString(const std::string& ciphertext) override;
  RecordPlaintext recordPlaintextFromString(const std::string& plaintext) override;
  std::shared_ptr<HybridFieldSpec> generateRecordViewKey(const std::shared_ptr<HybridViewKeySpec>& viewKey, const RecordCiphertext& recordCiphertext) override;
  std::shared_ptr<HybridFieldSpec> generateTransitionViewKey(const std::shared_ptr<HybridViewKeySpec>& viewKey, const std::shared_ptr<HybridGroupSpec>& transitionPublicKey) override;

 private:
  ComputeKey createComputeKeyStruct(const std::string& computeKeyString);
  Signature createSignatureStruct(const std::string& signatureString);
  Signature createSignatureStruct(const shield_mainnet::SignatureHandle& signatureHandle);
  RecordPlaintext createRecordPlaintextStruct(const std::string& plaintextString);

  // Rust FFI wrapper functions
  std::string rustCreatePrivateKey();
  bool rustValidatePrivateKey(const std::string& privateKey);
  std::string rustPrivateKeyToAddress(const std::string& privateKey);
  std::string rustPrivateKeyToViewKey(const std::string& privateKey);
  std::string rustPrivateKeyToComputeKey(const std::string& privateKey);
  shield_mainnet::SignatureHandle rustPrivateKeySign(const std::string& privateKey, const uint8_t* message, size_t messageLen);
  bool rustValidateAddress(const std::string& address);
  bool rustAddressVerify(const std::string& address, const shield_mainnet::SignatureHandle& signatureHandle, const uint8_t* message,
                         size_t messageLen);
  shield_mainnet::SignatureHandle extractSignatureHandle(const Signature& signature);

  bool rustValidateViewKey(const std::string& viewKey);
  std::string rustViewKeyToAddress(const std::string& viewKey);
  std::string rustViewKeyDecrypt(const std::string& viewKey, const std::string& ciphertext);
};

} // namespace margelo::nitro::shield
