cmake_minimum_required(VERSION 3.10)
project(ShieldMobileSdk)

set(PACKAGE_NAME ShieldMobileSdk)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# Architecture mapping for Rust targets
if(ANDROID_ABI STREQUAL "arm64-v8a")
    set(RUST_TARGET_ARCH "arm64-v8a")
elseif(ANDROID_ABI STREQUAL "armeabi-v7a")
    set(RUST_TARGET_ARCH "armeabi-v7a")
elseif(ANDROID_ABI STREQUAL "x86")
    set(RUST_TARGET_ARCH "x86")
elseif(ANDROID_ABI STREQUAL "x86_64")
    set(RUST_TARGET_ARCH "x86_64")
else()
    message(FATAL_ERROR "Unsupported Android ABI: ${ANDROID_ABI}")
endif()

# Collect all .cpp source files automatically
file(GLOB_RECURSE CPP_SOURCES
  "src/main/cpp/*.cpp"
  "../src/cpp/*.cpp"
)

# Add a library from the source files
add_library(${PACKAGE_NAME} SHARED ${CPP_SOURCES})

# Use Nitro autolinking
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/ShieldMobileSdk+autolinking.cmake)

# Fetch third-party headers if not already present
execute_process(
  COMMAND bash "${CMAKE_SOURCE_DIR}/../scripts/fetch-third-party-headers.sh"
  RESULT_VARIABLE FETCH_HEADERS_RESULT
)
if(NOT FETCH_HEADERS_RESULT EQUAL 0)
  message(FATAL_ERROR "Failed to fetch third-party headers")
endif()

# Specify include directories
include_directories(
  "src/main/cpp"
  "../src/cpp"
  "../third_party"
  "../build/includes"
  "../build/includes/rust"
  "../nitrogen/generated/shared/c++"
)

# Third party libraries (Prefabs)
find_library(LOG_LIB log)

# OpenSSL is statically linked into the Rust library on Android via openssl-sys (vendored).
# Skip CMake OpenSSL resolution on Android to avoid requiring an OpenSSL prefab.
if(NOT ANDROID)
    # Find OpenSSL from the pre-built AAR (non-Android or if using prefab)
    find_package(openssl REQUIRED CONFIG)
    message(STATUS "Found OpenSSL: ${openssl_VERSION}")
else()
    message(STATUS "Skipping CMake OpenSSL package on Android; linked statically in Rust")
endif()

# Map Android ABI to Rust target for both cxxbridge and static library paths
if(ANDROID_ABI STREQUAL "arm64-v8a")
    set(RUST_TARGET "aarch64-linux-android")
elseif(ANDROID_ABI STREQUAL "armeabi-v7a")
    set(RUST_TARGET "armv7-linux-androideabi")
elseif(ANDROID_ABI STREQUAL "x86")
    set(RUST_TARGET "i686-linux-android")
elseif(ANDROID_ABI STREQUAL "x86_64")
    set(RUST_TARGET "x86_64-linux-android")
endif()

# Set CRATES_DIR relative to CMake project
set(CRATES_DIR "${CMAKE_SOURCE_DIR}/..")

# Helper to import one flavor
function(import_Shield lib_target flavor)
  set(_dir  "${CRATES_DIR}/build/android/${flavor}/${ANDROID_ABI}")
  set(_path "${_dir}/libshield_mobile_sdk_${flavor}.a")

  add_library(${lib_target} STATIC IMPORTED GLOBAL)
  set_target_properties(${lib_target} PROPERTIES
    IMPORTED_LOCATION "${_path}"
  )

  if(NOT EXISTS "${_path}")
    message(FATAL_ERROR
      "Missing ${flavor} static lib for ${ANDROID_ABI}: ${_path}\n"
      "Expected at: build/android/${flavor}/${ANDROID_ABI}/libshield_mobile_sdk_${flavor}.a")
  endif()
endfunction()

# Import both flavors
import_Shield(Shield_mobile_sdk_mainnet mainnet)
import_Shield(Shield_mobile_sdk_testnet testnet)


# Find and link cxxbridge runtime library
file(GLOB_RECURSE CXXBRIDGE_LIB "${CRATES_DIR}/target/${RUST_TARGET}/release/build/**/libcxxbridge1.a")
message(STATUS "CXXBRIDGE_LIB: ${CXXBRIDGE_LIB}")
if(CXXBRIDGE_LIB)
    add_library(cxxbridge1 STATIC IMPORTED)
    set_target_properties(cxxbridge1 PROPERTIES IMPORTED_LOCATION ${CXXBRIDGE_LIB})
    message(STATUS "Found cxxbridge library: ${CXXBRIDGE_LIB}")
else()
    message(STATUS "cxxbridge library not found, will be available after Gradle buildRustStaticLibs")
    add_library(cxxbridge1 STATIC IMPORTED)
    set_target_properties(cxxbridge1 PROPERTIES IMPORTED_LOCATION "${CRATES_DIR}/target/${RUST_TARGET}/release/build/dummy/libcxxbridge1.a")
endif()

# NitroModules library is handled by autolinking.cmake

# Link our custom libraries (Rust and cxxbridge)
target_link_libraries(
  ${PACKAGE_NAME}
  ${LOG_LIB}                               # <-- Logcat logger
  android                                  # <-- Android core
  z                                        # <-- zlib (required by Rust dependencies)
  Shield_mobile_sdk_mainnet
    Shield_mobile_sdk_testnet
)

# Link cxxbridge if it exists
if(CXXBRIDGE_LIB)
  target_link_libraries(${PACKAGE_NAME} cxxbridge1)
endif()

# Uncomment if you want to try with earlier RN versions... gl;hf!
# # Link all required libraries with proper React Native version handling
# if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 76)
#     target_link_libraries(
#         ${PACKAGE_NAME}
#         ReactAndroid::reactnative              # <-- RN: Native Modules umbrella prefab
#     )
# else()
#     target_link_libraries(
#         ${PACKAGE_NAME}
#         ReactAndroid::react_nativemodule_core  # <-- RN: TurboModules Core
#         ReactAndroid::turbomodulejsijni        # <-- RN: TurboModules utils (e.g. CallInvokerHolder)
#     )
# endif()
