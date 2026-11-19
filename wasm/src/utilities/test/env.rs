// Copyright (C) 2019-2026 Provable Inc.
// This file is part of the Provable SDK library.

// Licensed under the MIT License. See the LICENSE.md file in the project root
// or <https://opensource.org/licenses/MIT> for the full license text.

use wasm_bindgen::prelude::*;

#[wasm_bindgen(inline_js = r#"
    module.exports.getEnv = function(name) {
        return process.env[name] || "";
    };
"#)]
extern "C" {
    #[wasm_bindgen(js_name = getEnv)]
    pub fn get_env(name: &str) -> String;
}
