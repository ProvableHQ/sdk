require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::UI.puts "[ProvableEngineReactNative] 🔐 First-party Nitro engine for React Native"

Pod::Spec.new do |s|
  s.user_target_xcconfig = { "SHIELD_NETWORK" => "mainnet" }
  s.pod_target_xcconfig = { "SHIELD_NETWORK" => "mainnet" }
  s.name = "ProvableEngineReactNative"
  s.version = package["version"]
  s.summary = package["description"]
  s.homepage = package["homepage"]
  s.license = package["license"]
  s.authors = package["authors"]

  s.ios.deployment_target = min_ios_version_supported
  s.visionos.deployment_target = 1.0
  s.macos.deployment_target = 10.13
  s.tvos.deployment_target = 13.4

  s.source = { :git => "https://github.com/ProvableHQ/sdk.git", :tag => "#{s.version}" }

  s.source_files = [
    "src/cpp/**/*.{cpp,mm}",
    "nitrogen/generated/shared/**/*.{cpp,mm}",
    "nitrogen/generated/ios/**/*.{cpp,mm}"
  ]

  s.public_header_files = [
    "src/cpp/*.{h,hpp}",
    "build/includes/rust/*.{h,hpp}",
    "nitrogen/generated/shared/c++/*.{h,hpp}"
  ]

  s.vendored_libraries = [
    "build/ios/mainnet/libshield_mobile_sdk_mainnet.a",
    "build/ios/mainnet/libcxxbridge1_mainnet.a",
    "build/ios/testnet/libshield_mobile_sdk_testnet.a",
    "build/ios/testnet/libcxxbridge1_testnet.a"
  ]

  s.libraries = "z", "c++"
  s.prepare_command = 'cd "$PWD" && ./scripts/fetch-third-party-headers.sh && ./scripts/build-rust.sh'
  s.script_phase = {
    :name => "Build Rust Library",
    :script => 'cd "$PODS_TARGET_SRCROOT" && ./scripts/fetch-third-party-headers.sh && ./scripts/build-rust.sh',
    :execution_position => :before_compile
  }

  s.pod_target_xcconfig = {
    "SHIELD_NETWORK" => "mainnet",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "HEADER_SEARCH_PATHS" => '"$(PODS_TARGET_SRCROOT)/src/cpp" "$(PODS_TARGET_SRCROOT)/third_party" "$(PODS_TARGET_SRCROOT)/build/includes" "$(PODS_TARGET_SRCROOT)/nitrogen/generated/shared/c++"',
    "OTHER_CPLUSPLUSFLAGS" => "$(inherited) -DSHIELD_NETWORK=$(SHIELD_NETWORK)",
    "OTHER_CFLAGS" => "$(inherited) -DSHIELD_NETWORK=$(SHIELD_NETWORK)",
    "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES" => "YES"
  }

  load "nitrogen/generated/ios/ShieldMobileSdk+autolinking.rb"
  add_nitrogen_files(s)
  install_modules_dependencies(s)
end
