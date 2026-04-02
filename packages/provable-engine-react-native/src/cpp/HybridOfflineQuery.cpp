// AUTO-GENERATED STYLE WRAPPER (hand-written implementation)
#include "HybridOfflineQuery.hpp"
#include <cstring>
#include <stdexcept>

namespace margelo::nitro::shield {

HybridOfflineQuery::~HybridOfflineQuery() {
  if (_handle != 0) {
    shield_mainnet::OfflineQueryHandle handle{_handle};
    shield_mainnet::destroy_offline_query(handle);
  }
}

std::shared_ptr<ArrayBuffer> HybridOfflineQuery::toBytes() {
  if (_handle == 0) {
    return ArrayBuffer::allocate(0);
  }
  shield_mainnet::OfflineQueryHandle handle{_handle};
  auto res = shield_mainnet::offline_query_to_bytes(handle);
  if (!res.success) {
    throw std::runtime_error(std::string("offline_query_to_bytes failed: ") + std::string(res.error));
  }
  auto buf = ArrayBuffer::allocate(res.bytes.size());
  if (res.bytes.size() > 0) {
    std::memcpy(buf->data(), res.bytes.data(), res.bytes.size());
  }
  return buf;
}

void HybridOfflineQuery::initWithBytes(const std::shared_ptr<ArrayBuffer>& bytes) {
  if (!bytes) {
    throw std::invalid_argument("bytes is null");
  }
  rust::Vec<uint8_t> rustBytes;
  rustBytes.reserve(bytes->size());
  auto ptr = static_cast<const uint8_t*>(bytes->data());
  for (size_t i = 0; i < bytes->size(); i++) {
    rustBytes.push_back(ptr[i]);
  }
  auto res = shield_mainnet::offline_query_from_bytes(rustBytes);
  if (!res.success) {
    throw std::runtime_error(std::string("offline_query_from_bytes failed: ") + std::string(res.error));
  }
  _handle = res.handle;
}

void HybridOfflineQuery::initWithString(const std::string& json) {
  auto res = shield_mainnet::offline_query_from_string(rust::String(json));
  if (!res.success) {
    throw std::runtime_error(std::string("offline_query_from_string failed: ") + std::string(res.error));
  }
  _handle = res.handle;
}

void HybridOfflineQuery::addBlockHeight(double height) {
  if (_handle == 0) {
    throw std::runtime_error("OfflineQuery not initialized");
  }
  shield_mainnet::OfflineQueryHandle handle{_handle};
  auto res = shield_mainnet::offline_query_add_block_height(handle, height);
  if (!res.success) {
    throw std::runtime_error("offline_query_add_block_height failed");
  }
}

void HybridOfflineQuery::addStatePath(const std::string& commitment, const std::string& statePath) {
  if (_handle == 0) {
    throw std::runtime_error("OfflineQuery not initialized");
  }
  shield_mainnet::OfflineQueryHandle handle{_handle};
  auto res = shield_mainnet::offline_query_add_state_path(handle, rust::String(commitment), rust::String(statePath));
  if (!res.success) {
    throw std::runtime_error("offline_query_add_state_path failed");
  }
}

} // namespace margelo::nitro::shield
