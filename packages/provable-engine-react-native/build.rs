fn main() {
    println!("cargo:rerun-if-changed=src/rust/lib.rs");
    println!("cargo:rerun-if-changed=src/rust/libsodium.rs");

    // libsodium is provided via the libsodium-sys crate (use-vendored-libsodium feature),
    // which compiles it from source for each target and bundles it into the static library.

    // Force cxx-build to use a temp target directory to avoid creating local target folder
    let target_env_var = std::env::var("TARGET").unwrap();
    let temp_target_dir = format!("/tmp/cxxbridge-target-{}", target_env_var);
    std::env::set_var("CARGO_TARGET_DIR", &temp_target_dir);

    let is_ios = target_env_var.contains("apple-ios");

    // iOS deployment target is handled by environment variables and cargo config
    // This prevents "was built for newer iOS-simulator version" warnings
    if is_ios {
        // Use IOS_DEPLOYMENT_TARGET or default to 15.1
        let ios_target =
            std::env::var("IOS_DEPLOYMENT_TARGET").unwrap_or_else(|_| "15.1".to_string());
        println!("cargo:rustc-env=IPHONEOS_DEPLOYMENT_TARGET={}", ios_target);
        std::env::set_var("IPHONEOS_DEPLOYMENT_TARGET", &ios_target);
    }

    // Let cxx-build handle header generation automatically
    // Manual cxxbridge header generation causes recursive path issues

    let mut build = cxx_build::bridge("src/rust/lib.rs");
    build.include("build/includes/rust");

    build.std("c++20");
    build.flag_if_supported("-fPIC");

    build.compile("shield_mobile_sdk");
}
