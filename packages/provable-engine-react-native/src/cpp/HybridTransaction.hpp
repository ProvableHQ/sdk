#pragma once

#include "HybridField.hpp"
#include "HybridTransactionSpec.hpp"
#include "RecordCiphertext.hpp"
#include "RecordPlaintext.hpp"
#include "TransactionRecord.hpp"
#include "TransactionVerifyingKey.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#ifndef testnet
#include "rust/shield_mainnet.h"
#else
#include "rust/shield_testnet.h"
#endif
#include <memory>
#include <optional>
#include <vector>

namespace margelo::nitro::shield {

class HybridTransaction final : public HybridTransactionSpec {
 public:
  HybridTransaction();
  explicit HybridTransaction(rust::Box<shield_mainnet::TransactionHandle>&& handle);

  // Factory helpers
  static std::shared_ptr<HybridTransactionSpec> create();
  static std::shared_ptr<HybridTransactionSpec> createFromString(const std::string& transaction);

  // HybridTransactionSpec overrides
  std::shared_ptr<HybridTransactionSpec> fromString(const std::string& transaction) override;
  void fromBytesLe(const std::shared_ptr<ArrayBuffer>& bytes) override;
  std::shared_ptr<HybridTransactionSpec> clone() override;
  std::string toString() override;
  std::shared_ptr<ArrayBuffer> toBytesLe() override;
  bool containsSerialNumber(const std::shared_ptr<HybridFieldSpec>& serialNumber) override;
  bool containsCommitment(const std::shared_ptr<HybridFieldSpec>& commitment) override;
  std::optional<RecordCiphertext> findRecord(const std::shared_ptr<HybridFieldSpec>& commitment) override;
  int64_t baseFeeAmount() override;
  int64_t feeAmount() override;
  int64_t priorityFeeAmount() override;
  bool isDeploy() override;
  bool isExecute() override;
  bool isFee() override;
  std::optional<std::shared_ptr<HybridProgramSpec>> deployedProgram() override;
  std::vector<RecordPlaintext> ownedRecords(const std::shared_ptr<HybridViewKeySpec>& viewKey) override;
  std::vector<TransactionRecord> records() override;
  std::string summary() override;
  std::string id() override;
  std::string transactionType() override;
  std::vector<std::string> transitions() override;
  std::vector<TransactionVerifyingKey> verifyingKeys() override;

 private:
  shield_mainnet::TransactionHandle& ensureTransaction() const;
  rust::Box<shield_mainnet::TransactionHandle>& transaction();
  const rust::Box<shield_mainnet::TransactionHandle>& transaction() const;

  std::shared_ptr<ArrayBuffer> arrayBufferFromBytes(const rust::Vec<uint8_t>& bytes) const;
  std::vector<std::string> convertVec(const rust::Vec<rust::String>& vec) const;
  RecordCiphertext makeRecordCiphertextFromHandle(uint64_t recordHandleId) const;
  RecordPlaintext makeRecordPlaintextFromHandle(uint64_t recordHandleId) const;

 private:
  mutable std::shared_ptr<rust::Box<shield_mainnet::TransactionHandle>> _transaction;
};

} // namespace margelo::nitro::shield
