#include "HybridAccount.hpp"
#include "HybridPrivateKey.hpp"
#include "HybridViewKey.hpp"
#include "HybridAddress.hpp"
#include "HybridPlaintext.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <NitroModules/Promise.hpp>
#include <cstring>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>
#include <unordered_map>
#include <mutex>
#include <atomic>
#include <thread>
#include <chrono>

// Include generated Rust cxx bridge header
#ifndef testnet
  #include "rust/shield_mainnet.h"
#else
  #include "rust/shield_testnet.h"
#endif

using namespace margelo::nitro;
using namespace margelo::nitro::shield;

namespace margelo::nitro::shield {

// Global signature handle registry for tracking signature handles by unique ID
static std::unordered_map<uint64_t, shield_mainnet::SignatureHandle> signatureHandleRegistry;
static std::mutex signatureRegistryMutex;
static std::atomic<uint64_t> signatureIdCounter{1};

namespace {

std::string unwrapStringResult(shield_mainnet::StringResult result) {
  if (!result.success) {
    throw std::runtime_error(std::string(result.error));
  }
  return std::string(result.result);
}

std::shared_ptr<ArrayBuffer> arrayBufferFromBytes(const rust::Vec<uint8_t>& bytes) {
  auto buffer = ArrayBuffer::allocate(bytes.size());
  if (bytes.size() > 0) {
    std::memcpy(buffer->data(), bytes.data(), bytes.size());
  }
  return buffer;
}

} // namespace

// Rust FFI wrapper implementations using cxx bridge
std::string HybridAccount::rustCreatePrivateKey() {
    auto handle = shield_mainnet::create_private_key();
  auto result = private_key_to_string(handle);
  shield_mainnet::destroy_private_key(handle);

  if (result.success) {
    return std::string(result.result);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

bool HybridAccount::rustValidatePrivateKey(const std::string& privateKey) {
    return shield_mainnet::validate_private_key(rust::String(privateKey));
}

std::string HybridAccount::rustPrivateKeyToAddress(const std::string& privateKey) {
  auto pkHandle = shield_mainnet::private_key_from_string(rust::String(privateKey));
  if (pkHandle.id == 0) {
    throw std::invalid_argument("Invalid private key");
  }

  auto addrHandle = shield_mainnet::private_key_to_address(pkHandle);
  auto result = shield_mainnet::address_to_string(addrHandle);

  shield_mainnet::destroy_private_key(pkHandle);
  shield_mainnet::destroy_address(addrHandle);

  if (result.success) {
    return std::string(result.result);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

std::string HybridAccount::rustPrivateKeyToViewKey(const std::string& privateKey) {
  auto pkHandle = shield_mainnet::private_key_from_string(rust::String(privateKey));
  if (pkHandle.id == 0) {
    throw std::invalid_argument("Invalid private key");
  }

  auto vkHandle = shield_mainnet::private_key_to_view_key(pkHandle);
  auto result = shield_mainnet::view_key_to_string(vkHandle);

  shield_mainnet::destroy_private_key(pkHandle);
  shield_mainnet::destroy_view_key(vkHandle);

  if (result.success) {
    return std::string(result.result);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

shield_mainnet::SignatureHandle HybridAccount::rustPrivateKeySign(const std::string& privateKey, const uint8_t* message, size_t messageLen) {
  // Create private key handle from string
  auto pkHandle = shield_mainnet::private_key_from_string(rust::String(privateKey));
  if (pkHandle.id == 0) {
    throw std::invalid_argument("Invalid private key");
  }

  // Convert message to rust::Vec
  std::vector<uint8_t> messageVec(message, message + messageLen);
  rust::Vec<uint8_t> rustMessage;
  for (const auto& byte : messageVec) {
    rustMessage.push_back(byte);
  }

  // Call the actual FFI function
  auto signatureResult = shield_mainnet::private_key_sign(pkHandle, rustMessage);
  
  shield_mainnet::destroy_private_key(pkHandle);

  if (signatureResult.success) {
    return shield_mainnet::SignatureHandle{signatureResult.signature_handle};
  } else {
    throw std::runtime_error(std::string(signatureResult.error));
  }
}

bool HybridAccount::rustValidateAddress(const std::string& address) {
  return shield_mainnet::validate_address(rust::String(address));
}

bool HybridAccount::rustAddressVerify(const std::string& address, const shield_mainnet::SignatureHandle& signatureHandle, const uint8_t* message,
                                      size_t messageLen) {
  auto addrHandle = shield_mainnet::address_from_string(rust::String(address));
  if (addrHandle.id == 0) {
    throw std::invalid_argument("Invalid address");
  }

  // Convert message to rust::Vec
  std::vector<uint8_t> messageVec(message, message + messageLen);
  rust::Vec<uint8_t> rustMessage;
  for (const auto& byte : messageVec) {
    rustMessage.push_back(byte);
  }

  // Call the actual FFI function
  bool isValid = shield_mainnet::address_verify(addrHandle, rustMessage, signatureHandle);
  
  shield_mainnet::destroy_address(addrHandle);
  
  return isValid;
}

bool HybridAccount::rustValidateViewKey(const std::string& viewKey) {
  return shield_mainnet::validate_view_key(rust::String(viewKey));
}

std::string HybridAccount::rustViewKeyToAddress(const std::string& viewKey) {
  auto vkHandle = shield_mainnet::view_key_from_string(rust::String(viewKey));
  if (vkHandle.id == 0) {
    throw std::invalid_argument("Invalid view key");
  }

  auto addrHandle = shield_mainnet::view_key_to_address(vkHandle);
  auto result = shield_mainnet::address_to_string(addrHandle);

  shield_mainnet::destroy_view_key(vkHandle);
  shield_mainnet::destroy_address(addrHandle);

  if (result.success) {
    return std::string(result.result);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}



// Account creation methods
std::shared_ptr<HybridPrivateKeySpec> HybridAccount::createPrivateKey() {
  return HybridPrivateKey::generate();
}

std::shared_ptr<HybridPrivateKeySpec> HybridAccount::privateKeyFromString(const std::string& privateKey) {
  return HybridPrivateKey::fromString(privateKey);
}

std::shared_ptr<HybridAddressSpec> HybridAccount::addressFromString(const std::string& address) {
  return HybridAddress::fromString(address);
}

std::shared_ptr<HybridViewKeySpec> HybridAccount::viewKeyFromString(const std::string& viewKey) {
  return HybridViewKey::fromString(viewKey);
}

// Deprecated conversion methods - functionality moved to HybridObjects

// Missing required methods from spec
std::shared_ptr<HybridPrivateKeySpec> HybridAccount::privateKeyFromSeed(const std::shared_ptr<ArrayBuffer>& seed) {
  return HybridPrivateKey::fromSeed(seed);
}

ComputeKey HybridAccount::computeKeyFromString(const std::string& computeKey) {
  return createComputeKeyStruct(computeKey);
}

Signature HybridAccount::signatureFromString(const std::string& signature) {
  return createSignatureStruct(signature);
}

RecordCiphertext HybridAccount::recordCiphertextFromString(const std::string& ciphertext) {
  // Validate the ciphertext by creating a Rust handle
  auto ctHandle = shield_mainnet::record_ciphertext_from_string(rust::String(ciphertext));
  if (ctHandle.id == 0) {
    throw std::invalid_argument("Invalid record ciphertext string");
  }
  shield_mainnet::destroy_record_ciphertext(ctHandle);

  // Capture the ciphertext string for use in closures
  auto sharedCiphertext = std::make_shared<std::string>(ciphertext);

  return RecordCiphertext(
    /*isOwner*/[sharedCiphertext](const std::shared_ptr<HybridViewKeySpec>& viewKey) -> std::shared_ptr<Promise<bool>> {
      try {
        auto hybridViewKey = std::dynamic_pointer_cast<HybridViewKey>(viewKey);
        if (!hybridViewKey || hybridViewKey->_viewKeyHandle == 0) {
          return Promise<bool>::rejected(std::make_exception_ptr(std::runtime_error("Invalid view key")));
        }

        auto ctH = shield_mainnet::record_ciphertext_from_string(rust::String(*sharedCiphertext));
        if (ctH.id == 0) {
          return Promise<bool>::rejected(std::make_exception_ptr(std::runtime_error("Failed to parse record ciphertext")));
        }

        shield_mainnet::ViewKeyHandle vkH = {hybridViewKey->_viewKeyHandle};
        bool isOwner = shield_mainnet::record_ciphertext_is_owner(ctH, vkH);
        shield_mainnet::destroy_record_ciphertext(ctH);

        return Promise<bool>::resolved(std::move(isOwner));
      } catch (const std::exception& e) {
        return Promise<bool>::rejected(std::make_exception_ptr(std::runtime_error(e.what())));
      }
    },
    /*asString*/[sharedCiphertext]() -> std::shared_ptr<Promise<std::string>> {
      return Promise<std::string>::resolved(std::string(*sharedCiphertext));
    }
  );
}

RecordPlaintext HybridAccount::recordPlaintextFromString(const std::string& plaintext) {
  auto handle = shield_mainnet::record_plaintext_from_string(rust::String(plaintext));
  if (handle.id == 0) {
    throw std::invalid_argument("Invalid record plaintext string");
  }
  shield_mainnet::destroy_record_plaintext(handle);
  return createRecordPlaintextStruct(plaintext);
}

std::shared_ptr<HybridFieldSpec> HybridAccount::generateRecordViewKey(const std::shared_ptr<HybridViewKeySpec>& viewKey, const RecordCiphertext& recordCiphertext) {
  auto hybridViewKey = std::dynamic_pointer_cast<HybridViewKey>(viewKey);
  if (!hybridViewKey || hybridViewKey->_viewKeyHandle == 0) {
    throw std::runtime_error("Invalid view key");
  }

  // Get the ciphertext string from the RecordCiphertext struct
  auto promise = recordCiphertext.asString();
  if (!promise) {
    throw std::runtime_error("recordCiphertext.asString() returned null promise");
  }
  auto maxWait = std::chrono::milliseconds(1000);
  auto start = std::chrono::steady_clock::now();
  while (!promise->isResolved() && !promise->isRejected() &&
         std::chrono::steady_clock::now() - start < maxWait) {
    std::this_thread::sleep_for(std::chrono::milliseconds(1));
  }
  if (!promise->isResolved()) {
    throw std::runtime_error("Failed to get ciphertext string from RecordCiphertext");
  }
  std::string ciphertextStr = promise->getResult();

  // Create Rust handles
  shield_mainnet::ViewKeyHandle vkH = {hybridViewKey->_viewKeyHandle};
  auto ctH = shield_mainnet::record_ciphertext_from_string(rust::String(ciphertextStr));
  if (ctH.id == 0) {
    throw std::runtime_error("Failed to parse record ciphertext");
  }

  try {
    auto fieldHandle = shield_mainnet::generate_record_view_key(vkH, ctH);
    shield_mainnet::destroy_record_ciphertext(ctH);
    return std::make_shared<HybridField>(std::move(fieldHandle));
  } catch (const std::exception& e) {
    shield_mainnet::destroy_record_ciphertext(ctH);
    throw std::runtime_error("Failed to generate record view key: " + std::string(e.what()));
  }
}

std::shared_ptr<HybridFieldSpec> HybridAccount::generateTransitionViewKey(const std::shared_ptr<HybridViewKeySpec>& viewKey, const std::shared_ptr<HybridGroupSpec>& transitionPublicKey) {
  auto hybridViewKey = std::dynamic_pointer_cast<HybridViewKey>(viewKey);
  if (!hybridViewKey || hybridViewKey->_viewKeyHandle == 0) {
    throw std::runtime_error("Invalid view key");
  }

  // Get the group string and create a temporary Rust handle
  std::string groupStr = transitionPublicKey->toString();
  auto groupHandle = shield_mainnet::group_from_string(rust::String(groupStr));
  shield_mainnet::ViewKeyHandle vkH = {hybridViewKey->_viewKeyHandle};

  try {
    auto fieldHandle = shield_mainnet::generate_transition_view_key(vkH, *groupHandle);
    return std::make_shared<HybridField>(std::move(fieldHandle));
  } catch (const std::exception& e) {
    throw std::runtime_error("Failed to generate transition view key: " + std::string(e.what()));
  }
}

// Create ComputeKey struct with bound functions
ComputeKey HybridAccount::createComputeKeyStruct(const std::string& computeKeyString) {
  return ComputeKey(
      /*name*/"",
      /*asString*/[computeKeyString]() -> std::shared_ptr<Promise<std::string>> { 
        return Promise<std::string>::resolved(std::string(computeKeyString)); 
      });
}

// Create Signature struct with bound functions from string
Signature HybridAccount::createSignatureStruct(const std::string& signatureString) {
  // Create signature handle from string
  auto sigHandle = shield_mainnet::signature_from_string(rust::String(signatureString));
  return createSignatureStruct(sigHandle);
}

// Create Signature struct with bound functions from handle
Signature HybridAccount::createSignatureStruct(const shield_mainnet::SignatureHandle& signatureHandle) {
  // Generate unique ID for this signature and register it
  uint64_t signatureId = signatureIdCounter.fetch_add(1);
  
  {
    std::lock_guard<std::mutex> lock(signatureRegistryMutex);
    signatureHandleRegistry[signatureId] = signatureHandle;
  }
  
  // Store the signature ID and handle in shared pointers for thread safety
  auto sharedId = std::make_shared<uint64_t>(signatureId);
  auto sharedHandle = std::make_shared<shield_mainnet::SignatureHandle>(signatureHandle);
  
  return Signature(
      /*name*/"",
      /*asString*/[this, sharedId, sharedHandle]() -> std::shared_ptr<Promise<std::string>> {
        // Make this synchronous to avoid issues with signature handle extraction
        try {
          auto result = shield_mainnet::signature_to_string(*sharedHandle);
          if (result.success) {
            // Embed the signature ID in the string for later extraction
            std::string sigString = "SIGID:" + std::to_string(*sharedId) + ":" + std::string(result.result);
            return Promise<std::string>::resolved(std::move(sigString));
          } else {
            return Promise<std::string>::rejected(std::make_exception_ptr(std::runtime_error(std::string(result.error))));
          }
        } catch (const std::exception& e) {
          return Promise<std::string>::rejected(std::make_exception_ptr(std::runtime_error("Failed to convert signature to string: " + std::string(e.what()))));
        }
      });
}

std::string HybridAccount::rustPrivateKeyToComputeKey(const std::string& privateKey) {
  auto pkHandle = shield_mainnet::private_key_from_string(rust::String(privateKey));
  if (pkHandle.id == 0) {
    throw std::invalid_argument("Invalid private key");
  }

  auto ckHandle = shield_mainnet::private_key_to_compute_key(pkHandle);
  auto result = shield_mainnet::compute_key_to_string(ckHandle);

  shield_mainnet::destroy_private_key(pkHandle);
  shield_mainnet::destroy_compute_key(ckHandle);

  if (result.success) {
    return std::string(result.result);
  } else {
    throw std::runtime_error(std::string(result.error));
  }
}

shield_mainnet::SignatureHandle HybridAccount::extractSignatureHandle(const Signature& signature) {
  // Get the signature string to extract the embedded signature ID
  try {
    auto promise = signature.asString();
    
    if (!promise) {
      throw std::runtime_error("signature.toString() returned null promise");
    }
    
    // Wait for the promise to resolve with a timeout
    auto maxWait = std::chrono::milliseconds(1000);
    auto start = std::chrono::steady_clock::now();
    
    while (!promise->isResolved() && !promise->isRejected() && 
           std::chrono::steady_clock::now() - start < maxWait) {
      std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }
    
    if (promise->isResolved()) {
      std::string sigString = promise->getResult();
      
      if (sigString.empty()) {
        throw std::runtime_error("Signature string is empty");
      }
      
      // Extract signature ID from the embedded format "SIGID:<id>:<signature>"
      if (sigString.substr(0, 6) == "SIGID:") {
        size_t firstColon = sigString.find(':', 6);
        if (firstColon != std::string::npos) {
          std::string idStr = sigString.substr(6, firstColon - 6);
          uint64_t signatureId = std::stoull(idStr);
          
          std::lock_guard<std::mutex> lock(signatureRegistryMutex);
          auto it = signatureHandleRegistry.find(signatureId);
          if (it != signatureHandleRegistry.end()) {
            return it->second;
          } else {
            throw std::runtime_error("Signature ID " + std::to_string(signatureId) + " not found in registry");
          }
        } else {
          throw std::runtime_error("Invalid SIGID format: " + sigString);
        }
      } else {
        throw std::runtime_error("Signature string does not start with SIGID: " + sigString);
      }
    } else if (promise->isRejected()) {
      throw std::runtime_error("Promise was rejected during signature extraction");
    } else {
      throw std::runtime_error("Promise timed out during signature extraction");
    }
  } catch (const std::exception& e) {
    throw std::runtime_error("Exception in extractSignatureHandle: " + std::string(e.what()));
  }
  
  throw std::runtime_error("Cannot extract signature handle - unknown error");
}

std::string HybridAccount::rustViewKeyDecrypt(const std::string& viewKey, const std::string& ciphertext) {
  auto vkHandle = shield_mainnet::view_key_from_string(rust::String(viewKey));
  if (vkHandle.id == 0) {
    throw std::invalid_argument("Invalid view key");
  }

  auto result = shield_mainnet::view_key_decrypt(vkHandle, rust::String(ciphertext));
  if (!result.success) {
    shield_mainnet::destroy_view_key(vkHandle);
    throw std::runtime_error("Failed to decrypt record: " + std::string(result.error));
  }

  // Convert plaintext handle to string
  shield_mainnet::RecordPlaintextHandle ptHandle = {result.handle};
  auto ptResult = shield_mainnet::record_plaintext_to_string(ptHandle);

  // Clean up
  shield_mainnet::destroy_record_plaintext(ptHandle);
  shield_mainnet::destroy_view_key(vkHandle);

  if (ptResult.success) {
    return std::string(ptResult.result);
  } else {
    throw std::runtime_error("Failed to convert plaintext to string: " + std::string(ptResult.error));
  }
}

RecordPlaintext HybridAccount::createRecordPlaintextStruct(const std::string& plaintextString) {
  return RecordPlaintext(
      /*name*/"",
      /*asString*/[plaintextString]() -> std::shared_ptr<Promise<std::string>> {
        return Promise<std::string>::resolved(std::string(plaintextString));
      },
      /*getMember*/[plaintextString](const std::string& input) -> std::shared_ptr<Promise<std::shared_ptr<HybridPlaintextSpec>>> {
        auto plaintext = HybridPlaintext::makeFromString(plaintextString);
        auto member = plaintext->find(input);
        return Promise<std::shared_ptr<HybridPlaintextSpec>>::resolved(std::move(member));
      });
}

} // namespace margelo::nitro::shield
