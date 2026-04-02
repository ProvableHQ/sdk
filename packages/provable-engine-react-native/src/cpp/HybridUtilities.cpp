#include "HybridUtilities.hpp"
#include <NitroModules/Promise.hpp>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <regex>
#include <utility>
#include <cstring>
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif
using namespace margelo::nitro;
using namespace margelo::nitro::shield;

namespace {

std::string unwrapStringResult(shield_mainnet::StringResult result) {
    if (!result.success) {
        throw std::runtime_error(std::string(result.error));
    }
    return std::string(result.result);
}

void unwrapBoolResult(shield_mainnet::BoolResult result) {
    if (!result.success) {
        throw std::runtime_error(std::string(result.error));
    }
}

} // namespace

namespace margelo::nitro::shield {

// Parse record plaintext string into structured data
ParsedRecordCiphertext HybridUtilities::parseRecordCiphertext(const std::string& recordPlaintext) {
    try {
        ParsedRecordCiphertext parsed;
        
        parsed.owner = extractFieldFromPlaintext(recordPlaintext, "owner");
        parsed.data = extractFieldFromPlaintext(recordPlaintext, "data");
        parsed.nonce = extractFieldFromPlaintext(recordPlaintext, "nonce");
        
        return parsed;
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to parse record ciphertext: " + std::string(e.what()));
    }
}

// Parse native Aleo amount from plaintext
std::string HybridUtilities::parseNativeAmount(const std::string& plaintext) {
    try {
        std::string microcreditsField = extractFieldFromPlaintext(plaintext, "microcredits");
        
        if (!microcreditsField.empty()) {
            // Extract numeric value (remove 'u64.private' suffix)
            std::regex amountRegex(R"((\d+)u64)");
            std::smatch match;
            if (std::regex_search(microcreditsField, match, amountRegex)) {
                return match[1].str();
            }
        }
        
        return "0";
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to parse native amount: " + std::string(e.what()));
    }
}

// Parse token amount from plaintext for a specific token
std::string HybridUtilities::parseTokenAmount(
    const std::string& plaintext,
    const std::string& programId,
    const std::string& tokenId
) {
    try {
        if (!isValidProgramId(programId)) {
            throw std::invalid_argument("Invalid program ID");
        }
        
        std::string amountField = extractFieldFromPlaintext(plaintext, "amount");
        if (amountField.empty()) {
            return "0";
        }
        
        // For programs with token IDs, verify this record matches the requested token
        if (!tokenId.empty()) {
            std::string recordTokenId = getTokenIdFromRecordPlaintext(plaintext, programId);
            if (recordTokenId != tokenId) {
                return "0";
            }
        }

        // Extract the numeric portion (strip u64/u128 and .private suffixes)
            std::regex amountRegex(R"((\d+)u\d+)");
            std::smatch match;
        if (std::regex_search(amountField, match, amountRegex)) {
                return match[1].str();
        }
        
        return "0";
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to parse token amount: " + std::string(e.what()));
    }
}

// Extract token ID from record plaintext
std::string HybridUtilities::getTokenIdFromRecordPlaintext(
    const std::string& plaintext,
    const std::string& programId
) {
    try {
        if (!isValidProgramId(programId)) {
            throw std::invalid_argument("Invalid program ID");
        }
        
        if (programId == "token_registry.aleo") {
            // Token registry uses "token_id" field; strip ".private" suffix
            std::string raw = extractFieldFromPlaintext(plaintext, "token_id");
            if (!raw.empty()) {
                // Remove ".private" suffix if present
                auto pos = raw.find(".private");
                if (pos != std::string::npos) {
                    return raw.substr(0, pos);
                }
                return raw;
            }
        } else {
            // Alpha token programs use "token" field; strip ".private" suffix
            std::string raw = extractFieldFromPlaintext(plaintext, "token");
            if (!raw.empty()) {
                auto pos = raw.find(".private");
                if (pos != std::string::npos) {
                    return raw.substr(0, pos);
            }
                return raw;
            }
        }
        
        return "";
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to get token ID: " + std::string(e.what()));
    }
}

// Construct transaction inputs for token transfers.
// Transfer methods: "private", "public", "public_to_private", "private_to_public"
std::vector<std::string> HybridUtilities::constructTransactionInputs(
    const std::string& transferMethod,
    const std::string& programId,
    const std::string& tokenId,
    const std::string& to,
    const std::string& amount,
    const std::string& recordPlaintext
) {
    try {
        if (!isValidAleoAddress(to)) {
            throw std::invalid_argument("Invalid recipient address");
        }
        
        if (!isValidProgramId(programId)) {
            throw std::invalid_argument("Invalid program ID");
        }
        
        std::vector<std::string> inputs;
        
        if (transferMethod == "private" || transferMethod == "private_to_public") {
            if (recordPlaintext.empty()) {
                throw std::invalid_argument("Record plaintext is required for private transfers");
            }

            if (programId == "credits.aleo") {
            inputs.push_back(recordPlaintext);
            inputs.push_back(to);
                inputs.push_back(amount + "u64");
            } else if (programId == "token_registry.aleo") {
            inputs.push_back(to);
                inputs.push_back(amount + "u128");
                inputs.push_back(recordPlaintext);
            } else {
                // Default: alpha tokens and similar
            inputs.push_back(recordPlaintext);
            inputs.push_back(to);
                inputs.push_back(amount + "u128");
            }
        } else if (transferMethod == "public") {
            if (programId == "credits.aleo") {
                inputs.push_back(to);
                inputs.push_back(amount + "u64");
            } else {
                // token_registry, alpha tokens
                inputs.push_back(tokenId);
                inputs.push_back(to);
                inputs.push_back(amount + "u128");
            }
        } else if (transferMethod == "public_to_private") {
            if (programId == "credits.aleo") {
                inputs.push_back(to);
                inputs.push_back(amount + "u64");
            } else if (programId == "token_registry.aleo") {
                inputs.push_back(tokenId);
                inputs.push_back(to);
                inputs.push_back(amount + "u128");
                inputs.push_back("false");
            } else {
                // alpha tokens and similar
                inputs.push_back(tokenId);
                inputs.push_back(to);
                inputs.push_back(amount + "u128");
            }
        } else {
            throw std::invalid_argument("Unsupported transfer method: " + transferMethod);
        }
        
        return inputs;
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to construct transaction inputs: " + std::string(e.what()));
    }
}

// Construct inputs for split transactions
std::vector<std::string> HybridUtilities::constructSplitTxInputs(
    const std::string& programId,
    const std::string& recordPlaintext,
    const std::string& amount
) {
    try {
        if (!isValidProgramId(programId)) {
            throw std::invalid_argument("Invalid program ID");
        }

        if (recordPlaintext.empty()) {
            throw std::invalid_argument("Record plaintext is required for split transfers");
        }
        
        std::vector<std::string> inputs;
        
        if (programId == "credits.aleo") {
            inputs.push_back(recordPlaintext);
            inputs.push_back(amount + "u64");
        } else {
            // token_registry, alpha tokens
        inputs.push_back(recordPlaintext);
            inputs.push_back(amount + "u128");
        }
        
        return inputs;
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to construct split transaction inputs: " + std::string(e.what()));
    }
}

// Generate hash from plaintext bits
std::string HybridUtilities::getHashedString(const std::string& idPlaintextBits) {
    try {
        if (idPlaintextBits.empty()) {
            throw std::invalid_argument("Input plaintext bits cannot be empty");
        }
        
        // Parse the plaintext string into a Plaintext handle
        auto plaintextHandle = shield_mainnet::plaintext_from_string(idPlaintextBits);

        // Convert plaintext to bits
        auto bitsResult = plaintextHandle->plaintext_to_bits();
        if (!bitsResult.success) {
            throw std::runtime_error(std::string(bitsResult.error));
        }

        // Hash the bits using BHP256
        auto hashResult = shield_mainnet::bhp256_hash(std::move(bitsResult.bytes));
        if (!hashResult.success) {
            throw std::runtime_error(std::string(hashResult.error));
        }

        return std::string(hashResult.result);
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to generate hash: " + std::string(e.what()));
    }
}

// Get mapping name for a program
std::string HybridUtilities::getMappingNameForProgram(const std::string& programId) {
    try {
        if (!isValidProgramId(programId)) {
            throw std::invalid_argument("Invalid program ID");
        }
        
        if (programId == "credits.aleo") {
            return "account";
        } else if (programId == "token_registry.aleo") {
            return "authorized_balances";
        } else {
            return "balances";
        }
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to get mapping name: " + std::string(e.what()));
    }
}

// Parse U128 value from string
std::string HybridUtilities::parseU128(const std::string& balance) {
    try {
        if (balance.empty()) {
            return "0";
        }
        
        // Remove 'u128' suffix and other formatting
        std::string cleaned = balance;
        std::regex u128Regex(R"((\d+)u128)");
        std::smatch match;
        
        if (std::regex_search(cleaned, match, u128Regex)) {
            return match[1].str();
        }
        
        // Extract just digits
        std::regex digitRegex(R"(\d+)");
        if (std::regex_search(cleaned, match, digitRegex)) {
            return match[0].str();
        }
        
        return "0";
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to parse U128: " + std::string(e.what()));
    }
}

// Parse U64 value from string
std::string HybridUtilities::parseU64(const std::string& balance) {
    try {
        if (balance.empty()) {
            return "0";
        }
        
        // Remove 'u64' suffix and other formatting
        std::string cleaned = balance;
        std::regex u64Regex(R"((\d+)u64)");
        std::smatch match;
        
        if (std::regex_search(cleaned, match, u64Regex)) {
            return match[1].str();
        }
        
        // Extract just digits
        std::regex digitRegex(R"(\d+)");
        if (std::regex_search(cleaned, match, digitRegex)) {
            return match[0].str();
        }
        
        return "0";
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to parse U64: " + std::string(e.what()));
    }
}

// Parse token registry balance from response
TokenRegistryBalance HybridUtilities::parseTokenRegistryBalance(const std::string& res) {
    try {
        TokenRegistryBalance balance;
        
        // Extract balance using the same regex pattern as the extension
        std::regex balanceRegex(R"(balance:\s*(\d+)u128?)");
        std::smatch match;
        if (std::regex_search(res, match, balanceRegex)) {
            balance.balance = match[1].str();
        } else {
            balance.balance = "0";
        }

        // Extract token_id and program_id from the response if present
        balance.tokenId = extractFieldFromPlaintext(res, "token_id");
        balance.programId = extractFieldFromPlaintext(res, "program_id");
        
        if (balance.tokenId.empty()) {
            balance.tokenId = "";
        }
        if (balance.programId.empty()) {
            balance.programId = "";
        }
        
        return balance;
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to parse token registry balance: " + std::string(e.what()));
    }
}


// Verify mnemonic phrase validity using BIP39 validation via Rust FFI
bool HybridUtilities::verifyMnemonic(const std::string& mnemonic) {
    try {
        if (mnemonic.empty()) {
            return false;
        }
        
        auto result = shield_mainnet::verify_mnemonic(rust::String(mnemonic));
        if (!result.success) {
            return false;
        }
        return result.result;
    } catch (const std::exception&) {
        return false;
    }
}

std::string HybridUtilities::cryptoBoxSealBase64(
    const std::string& publicKeyB64,
    const std::shared_ptr<ArrayBuffer>& message
) {
    try {
        if (!message) {
            throw std::invalid_argument("Message buffer is required");
        }

        rust::Vec<uint8_t> rustMessage;
        rustMessage.reserve(message->size());
        const auto* data = reinterpret_cast<const uint8_t*>(message->data());
        for (size_t i = 0; i < message->size(); i++) {
            rustMessage.push_back(data[i]);
        }

        auto result = shield_mainnet::crypto_box_seal_base64(
            rust::String(publicKeyB64),
            std::move(rustMessage)
        );
        return unwrapStringResult(std::move(result));
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to seal registration request: " + std::string(e.what()));
    }
}

std::shared_ptr<ArrayBuffer> HybridUtilities::cryptoBoxSealOpenBase64(
    const std::string& publicKeyB64,
    const std::string& privateKeyB64,
    const std::string& sealedB64
) {
    try {
        auto result = shield_mainnet::crypto_box_seal_open_base64(
            rust::String(publicKeyB64),
            rust::String(privateKeyB64),
            rust::String(sealedB64)
        );

        if (!result.success) {
            throw std::runtime_error(std::string(result.error));
        }

        auto buffer = ArrayBuffer::allocate(result.bytes.size());
        if (result.bytes.size() > 0) {
            std::memcpy(buffer->data(), result.bytes.data(), result.bytes.size());
        }
        return buffer;
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to open sealed message: " + std::string(e.what()));
    }
}

// Helper methods

std::string HybridUtilities::extractFieldFromPlaintext(const std::string& plaintext, const std::string& fieldName) const {
    try {
        // Look for pattern: fieldName: value
        std::string pattern = fieldName + R"(\s*:\s*([^,\n}]+))";
        std::regex fieldRegex(pattern);
        std::smatch match;
        
        if (std::regex_search(plaintext, match, fieldRegex)) {
            return trimWhitespace(match[1].str());
        }
        
        return "";
    } catch (const std::exception&) {
        return "";
    }
}

bool HybridUtilities::isValidAleoAddress(const std::string& address) const {
    try {
        // Aleo addresses start with "aleo1" and are 63 characters long
        return address.length() == 63 && address.substr(0, 5) == "aleo1";
    } catch (const std::exception&) {
        return false;
    }
}

bool HybridUtilities::isValidProgramId(const std::string& programId) const {
    try {
        // Program IDs should end with .aleo
        return !programId.empty() && programId.find(".aleo") != std::string::npos;
    } catch (const std::exception&) {
        return false;
    }
}

bool HybridUtilities::isValidTokenId(const std::string& tokenId) const {
    try {
        // Token IDs should be non-empty and contain valid characters
        if (tokenId.empty()) return false;
        
        return std::all_of(tokenId.begin(), tokenId.end(), [](char c) {
            return std::isalnum(c) || c == '_' || c == '-';
        });
    } catch (const std::exception&) {
        return false;
    }
}

std::string HybridUtilities::formatAmount(const std::string& amount, int decimals) const {
    try {
        // Convert string to number and apply decimal formatting
        // For now, just return the amount as-is
        return amount;
    } catch (const std::exception&) {
        return "0";
    }
}

std::vector<std::string> HybridUtilities::splitString(const std::string& str, char delimiter) const {
    std::vector<std::string> result;
    std::stringstream ss(str);
    std::string item;
    
    while (std::getline(ss, item, delimiter)) {
        std::string trimmed = trimWhitespace(item);
        if (!trimmed.empty()) {
            result.push_back(trimmed);
        }
    }
    
    return result;
}

std::string HybridUtilities::trimWhitespace(const std::string& str) const {
    size_t start = str.find_first_not_of(" \t\n\r\f\v");
    if (start == std::string::npos) {
        return "";
    }
    
    size_t end = str.find_last_not_of(" \t\n\r\f\v");
    return str.substr(start, end - start + 1);
}

} // namespace margelo::nitro::shield
