#pragma once

#include "HybridUtilitiesSpec.hpp"
#include "ParsedRecordCiphertext.hpp"
#include "TokenRegistryBalance.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <NitroModules/Promise.hpp>
#include <memory>
#include <string>
#include <vector>

namespace margelo::nitro::shield {

class HybridUtilities : public HybridUtilitiesSpec {
 public:
  explicit HybridUtilities() : HybridObject(TAG) {}

  // Parse record ciphertext into structured data
  ParsedRecordCiphertext parseRecordCiphertext(const std::string& recordPlaintext) override;

  // Parse native Aleo amount from plaintext
  std::string parseNativeAmount(const std::string& plaintext) override;

  // Parse token amount from plaintext for a specific token
  std::string parseTokenAmount(
    const std::string& plaintext,
    const std::string& programId,
    const std::string& tokenId
  ) override;

  // Extract token ID from record plaintext
  std::string getTokenIdFromRecordPlaintext(
    const std::string& plaintext,
    const std::string& programId
  ) override;

  // Construct transaction inputs for token transfers
  std::vector<std::string> constructTransactionInputs(
    const std::string& transferMethod,
    const std::string& programId,
    const std::string& tokenId,
    const std::string& to,
    const std::string& amount,
    const std::string& recordPlaintext
  ) override;

  // Construct inputs for split transactions
  std::vector<std::string> constructSplitTxInputs(
    const std::string& programId,
    const std::string& recordPlaintext,
    const std::string& amount
  ) override;

  // Generate hash from plaintext bits
  std::string getHashedString(const std::string& idPlaintextBits) override;

  // Get mapping name for a program
  std::string getMappingNameForProgram(const std::string& programId) override;

  // Parse U128 value from string
  std::string parseU128(const std::string& balance) override;

  // Parse U64 value from string
  std::string parseU64(const std::string& balance) override;

  // Parse token registry balance from response
  TokenRegistryBalance parseTokenRegistryBalance(const std::string& res) override;

  // Verify mnemonic phrase validity
  bool verifyMnemonic(const std::string& mnemonic) override;

  // Encrypt bytes using libsodium sealed box (RFC 4648 base64 in/out)
  std::string cryptoBoxSealBase64(
    const std::string& publicKeyB64,
    const std::shared_ptr<ArrayBuffer>& message
  ) override;

  // Decrypt libsodium sealed box bytes (RFC 4648 base64 in, bytes out)
  std::shared_ptr<ArrayBuffer> cryptoBoxSealOpenBase64(
    const std::string& publicKeyB64,
    const std::string& privateKeyB64,
    const std::string& sealedB64
  ) override;

 private:
  // Helper methods for parsing and validation
  std::string extractFieldFromPlaintext(const std::string& plaintext, const std::string& fieldName) const;
  bool isValidAleoAddress(const std::string& address) const;
  bool isValidProgramId(const std::string& programId) const;
  bool isValidTokenId(const std::string& tokenId) const;
  std::string formatAmount(const std::string& amount, int decimals = 6) const;
  std::vector<std::string> splitString(const std::string& str, char delimiter) const;
  std::string trimWhitespace(const std::string& str) const;
  
  // WASM and thread pool state
};

} // namespace margelo::nitro::shield
