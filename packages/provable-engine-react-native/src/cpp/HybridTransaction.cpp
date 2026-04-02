#include "HybridTransaction.hpp"
#include "HybridField.hpp"

#include "HybridProgram.hpp"
#include "HybridViewKey.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <NitroModules/Promise.hpp>
#include <chrono>
#include <cstring>
#include <exception>
#include <stdexcept>
#include <thread>

using namespace margelo::nitro;
using namespace margelo::nitro::shield;

namespace {
struct RecordCiphertextHandleHolder {
  explicit RecordCiphertextHandleHolder(uint64_t value) : id(value) {}
  ~RecordCiphertextHandleHolder() {
    if (id != 0) {
      shield_mainnet::RecordCiphertextHandle handle{id};
      shield_mainnet::destroy_record_ciphertext(handle);
    }
  }
  uint64_t id;
};

struct RecordPlaintextHandleHolder {
  explicit RecordPlaintextHandleHolder(uint64_t value) : id(value) {}
  ~RecordPlaintextHandleHolder() {
    if (id != 0) {
      shield_mainnet::RecordPlaintextHandle handle{id};
      shield_mainnet::destroy_record_plaintext(handle);
    }
  }
  uint64_t id;
};

const auto kPromiseWaitTimeout = std::chrono::milliseconds(1000);

std::string waitForPromiseString(const std::shared_ptr<Promise<std::string>>& promise, const std::string& context) {
  if (!promise) {
    throw std::runtime_error(context + ": promise was null");
  }

  auto start = std::chrono::steady_clock::now();
  while (promise->isPending() && std::chrono::steady_clock::now() - start < kPromiseWaitTimeout) {
    std::this_thread::sleep_for(std::chrono::milliseconds(1));
  }

  if (promise->isResolved()) {
    return promise->getResult();
  }

  if (promise->isRejected()) {
    const auto& error = promise->getError();
    if (error) {
      std::rethrow_exception(error);
    }
    throw std::runtime_error(context + ": promise rejected");
  }

  throw std::runtime_error(context + ": promise timed out");
}

} // namespace

namespace margelo::nitro::shield {

HybridTransaction::HybridTransaction() : HybridObject(TAG), _transaction(nullptr) {}

HybridTransaction::HybridTransaction(rust::Box<shield_mainnet::TransactionHandle>&& handle) : HybridObject(TAG) {
  _transaction = std::make_shared<rust::Box<shield_mainnet::TransactionHandle>>(std::move(handle));
}

shield_mainnet::TransactionHandle& HybridTransaction::ensureTransaction() const {
  if (!_transaction) {
    throw std::runtime_error("Transaction handle is null");
  }
  return **_transaction;
}

rust::Box<shield_mainnet::TransactionHandle>& HybridTransaction::transaction() {
  if (!_transaction) {
    throw std::runtime_error("Transaction handle is null");
  }
  return *_transaction;
}

const rust::Box<shield_mainnet::TransactionHandle>& HybridTransaction::transaction() const {
  if (!_transaction) {
    throw std::runtime_error("Transaction handle is null");
  }
  return *_transaction;
}

std::shared_ptr<HybridTransactionSpec> HybridTransaction::fromString(const std::string& transactionString) {
  auto handle = shield_mainnet::transaction_from_string(rust::String(transactionString));
  return std::make_shared<HybridTransaction>(std::move(handle));
}

void HybridTransaction::fromBytesLe(const std::shared_ptr<ArrayBuffer>& bytes) {
  if (!bytes) {
    throw std::invalid_argument("Bytes buffer cannot be null");
  }

  rust::Vec<uint8_t> rustBytes;
  rustBytes.reserve(bytes->size());
  const auto* data = static_cast<const uint8_t*>(bytes->data());
  for (size_t i = 0; i < bytes->size(); ++i) {
    rustBytes.push_back(data[i]);
  }

  auto handle = shield_mainnet::transaction_from_bytes_le(std::move(rustBytes));
}

std::shared_ptr<HybridTransactionSpec> HybridTransaction::clone() {
  auto cloned = ensureTransaction().transaction_clone();
  return std::make_shared<HybridTransaction>(std::move(cloned));
}

std::string HybridTransaction::toString() {
  return std::string(ensureTransaction().transaction_to_string());
}

std::shared_ptr<ArrayBuffer> HybridTransaction::toBytesLe() {
  auto result = ensureTransaction().transaction_to_bytes_le();
  if (!result.success) {
    throw std::runtime_error(std::string(result.error));
  }
  return arrayBufferFromBytes(result.bytes);
}

bool HybridTransaction::containsSerialNumber(const std::shared_ptr<HybridFieldSpec>& serialNumber) {
  auto fieldHybrid = std::dynamic_pointer_cast<HybridField>(serialNumber);
  if (!fieldHybrid) {
    throw std::runtime_error("Transaction.containsSerialNumber expected Field hybrid");
  }
  return ensureTransaction().transaction_contains_serial_number(fieldHybrid->ensureHandle());
}

bool HybridTransaction::containsCommitment(const std::shared_ptr<HybridFieldSpec>& commitment) {
  auto fieldHybrid = std::dynamic_pointer_cast<HybridField>(commitment);
  if (!fieldHybrid) {
    throw std::runtime_error("Transaction.containsCommitment expected Field hybrid");
  }
  return ensureTransaction().transaction_contains_commitment(fieldHybrid->ensureHandle());
}

std::optional<RecordCiphertext> HybridTransaction::findRecord(const std::shared_ptr<HybridFieldSpec>& commitment) {
  auto fieldHybrid = std::dynamic_pointer_cast<HybridField>(commitment);
  if (!fieldHybrid) {
    throw std::runtime_error("Transaction.findRecord expected Field hybrid");
  }
  auto result = ensureTransaction().transaction_find_record(fieldHybrid->ensureHandle());

  if (!result.success || result.handle == 0) {
    return std::nullopt;
  }

  return makeRecordCiphertextFromHandle(result.handle);
}

int64_t HybridTransaction::baseFeeAmount() {
  return static_cast<int64_t>(ensureTransaction().transaction_base_fee_amount());
}

int64_t HybridTransaction::feeAmount() {
  return static_cast<int64_t>(ensureTransaction().transaction_fee_amount());
}

int64_t HybridTransaction::priorityFeeAmount() {
  return static_cast<int64_t>(ensureTransaction().transaction_priority_fee_amount());
}

bool HybridTransaction::isDeploy() {
  return ensureTransaction().transaction_is_deploy();
}

bool HybridTransaction::isExecute() {
  return ensureTransaction().transaction_is_execute();
}

bool HybridTransaction::isFee() {
  return ensureTransaction().transaction_is_fee();
}

std::optional<std::shared_ptr<HybridProgramSpec>> HybridTransaction::deployedProgram() {
  try {
    auto programHandle = ensureTransaction().transaction_deployed_program();
    auto program = std::make_shared<HybridProgram>(std::move(programHandle));
    return program;
  } catch (const std::exception&) {
    return std::nullopt;
  }
}

std::vector<RecordPlaintext> HybridTransaction::ownedRecords(const std::shared_ptr<HybridViewKeySpec>& viewKey) {
  auto viewKeyImpl = std::dynamic_pointer_cast<HybridViewKey>(viewKey);
  if (!viewKeyImpl) {
    throw std::runtime_error("Invalid ViewKey instance provided to ownedRecords");
  }

  shield_mainnet::ViewKeyHandle handle{viewKeyImpl->_viewKeyHandle};
  auto records = ensureTransaction().transaction_owned_records(handle);

  std::vector<RecordPlaintext> result;
  result.reserve(records.size());
  for (auto recordHandle : records) {
    result.push_back(makeRecordPlaintextFromHandle(recordHandle));
  }
  return result;
}

std::vector<TransactionRecord> HybridTransaction::records() {
  auto entries = ensureTransaction().transaction_records();
  std::vector<TransactionRecord> result;
  result.reserve(entries.size());

  for (auto& entry : entries) {
    auto commitment = std::make_shared<HybridField>(std::move(entry.commitment));
    RecordCiphertext record = makeRecordCiphertextFromHandle(entry.record_handle);
    result.emplace_back(std::move(commitment), record);
  }

  return result;
}

std::string HybridTransaction::summary() {
  auto result = ensureTransaction().transaction_summary();
  return std::string(result);
}

std::string HybridTransaction::id() {
  return std::string(ensureTransaction().transaction_id());
}

std::string HybridTransaction::transactionType() {
  return std::string(ensureTransaction().transaction_type());
}

std::vector<std::string> HybridTransaction::transitions() {
  return convertVec(ensureTransaction().transaction_transitions());
}

std::vector<TransactionVerifyingKey> HybridTransaction::verifyingKeys() {
  auto keys = ensureTransaction().transaction_verifying_keys();
  std::vector<TransactionVerifyingKey> result;
  result.reserve(keys.size());
  for (const auto& key : keys) {
    result.emplace_back(std::string(key.program), std::string(key.function), std::string(key.verifying_key), std::string(key.certificate));
  }
  return result;
}

std::shared_ptr<ArrayBuffer> HybridTransaction::arrayBufferFromBytes(const rust::Vec<uint8_t>& bytes) const {
  auto buffer = ArrayBuffer::allocate(bytes.size());
  if (bytes.size() > 0) {
    std::memcpy(buffer->data(), bytes.data(), bytes.size());
  }
  return buffer;
}

std::vector<std::string> HybridTransaction::convertVec(const rust::Vec<rust::String>& vec) const {
  std::vector<std::string> result;
  result.reserve(vec.size());
  for (const auto& item : vec) {
    result.emplace_back(std::string(item));
  }
  return result;
}

RecordCiphertext HybridTransaction::makeRecordCiphertextFromHandle(uint64_t recordHandleId) const {
  auto holder = std::make_shared<RecordCiphertextHandleHolder>(recordHandleId);
  RecordCiphertext ciphertext;
  ciphertext.asString = [holder]() -> std::shared_ptr<Promise<std::string>> {
    shield_mainnet::RecordCiphertextHandle handle{holder->id};
    auto result = record_ciphertext_to_string(handle);
    if (!result.success) {
      return Promise<std::string>::rejected(std::make_exception_ptr(std::runtime_error(std::string(result.error))));
    }
    return Promise<std::string>::resolved(std::string(result.result));
  };

  ciphertext.isOwner = [holder](const std::shared_ptr<HybridViewKeySpec>& viewKey) -> std::shared_ptr<Promise<bool>> {
    auto viewKeyImpl = std::dynamic_pointer_cast<HybridViewKey>(viewKey);
    if (!viewKeyImpl) {
      return Promise<bool>::rejected(std::make_exception_ptr(std::runtime_error("Invalid ViewKey instance")));
    }
    shield_mainnet::RecordCiphertextHandle recordHandle{holder->id};
    shield_mainnet::ViewKeyHandle viewKeyHandle{viewKeyImpl->_viewKeyHandle};
    bool owner = record_ciphertext_is_owner(recordHandle, viewKeyHandle);
    return Promise<bool>::resolved(std::move(owner));
  };

  return ciphertext;
}

RecordPlaintext HybridTransaction::makeRecordPlaintextFromHandle(uint64_t recordHandleId) const {
  auto holder = std::make_shared<RecordPlaintextHandleHolder>(recordHandleId);
  RecordPlaintext plaintext;
  plaintext.asString = [holder]() -> std::shared_ptr<Promise<std::string>> {
    shield_mainnet::RecordPlaintextHandle handle{holder->id};
    auto result = record_plaintext_to_string(handle);
    if (!result.success) {
      return Promise<std::string>::rejected(std::make_exception_ptr(std::runtime_error(std::string(result.error))));
    }
    return Promise<std::string>::resolved(std::string(result.result));
  };
  return plaintext;
}

std::shared_ptr<HybridTransactionSpec> HybridTransaction::create() {
  throw std::runtime_error("Transaction cannot be created without initial data");
}

std::shared_ptr<HybridTransactionSpec> HybridTransaction::createFromString(const std::string& transactionString) {
  auto handle = shield_mainnet::transaction_from_string(rust::String(transactionString));
  return std::make_shared<HybridTransaction>(std::move(handle));
}

} // namespace margelo::nitro::shield
