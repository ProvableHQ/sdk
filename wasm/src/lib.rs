// Copyright (C) 2019-2021 Aleo Systems Inc.
// This file is part of the Aleo library.

// The Aleo library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo library. If not, see <https://www.gnu.org/licenses/>.

use account::PrivateKey;
use wasm_bindgen::{JsValue, prelude::{wasm_bindgen, Closure}, JsCast};

pub mod account;

// Called when the wasm module is instantiated
#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    // Use `web_sys`'s global `window` function to get a handle on the global
    // window object.
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");
    let body = document.body().expect("document should have a body");

    let private_key = PrivateKey::new();
    web_sys::console::log_1(&format!("Private Key Generated: {}", private_key.to_string()).into());

    let view_key = private_key.to_view_key();
    web_sys::console::log_1(&format!("View Key Generated: {view_key}").into());

    let address = private_key.to_address();
    web_sys::console::log_1(&format!("Address Generated: {address}").into());

    let div_of_divs = node(&document, private_key)?;

    // Manufacture the element we're gonna append
    let val = document.create_element("h1")?;
    val.set_class_name("title");
    val.set_inner_html("Aleo SDK");

    let button = document.create_element("button")
        .unwrap()
        .dyn_into::<web_sys::HtmlButtonElement>()
        .unwrap();
    button.set_text_content(Some("Generate"));

    // Append to DOM
    body.append_child(&val)?;
    body.append_child(&div_of_divs)?;

    Ok(())
}

fn node(
    document: &web_sys::Document,
    private_key: PrivateKey,
) -> Result<web_sys::Element, JsValue> {
    let div_of_divs = document.create_element("div")?;
    
    let div_private_key_inputs = document.create_element("div")?;
    let div_view_key_inputs = document.create_element("div")?;
    let div_address_inputs = document.create_element("div")?;

    div_of_divs.set_class_name("container");
    div_of_divs.append_child(div_private_key_inputs.as_ref())?;
    div_of_divs.append_child(div_view_key_inputs.as_ref())?;
    div_of_divs.append_child(div_address_inputs.as_ref())?;

    // Label showing the private key.
    let private_key_label = document.create_element("h2")?;
    private_key_label.set_inner_html("Private Key");
    private_key_label.set_class_name("private_key");
    div_private_key_inputs.append_child(&private_key_label)?;

    let private_key_textbox = document.create_element("textarea")?;
    private_key_textbox.set_class_name("result");
    private_key_textbox.set_attribute("placeholder", &private_key.to_string())?;
    private_key_textbox.set_attribute("disabled", "")?;
    private_key_textbox.set_attribute("readonly", "")?;
    div_private_key_inputs.append_child(&private_key_textbox)?;

    // Label showing the view key derived from the private key.
    let view_key_label = document.create_element("h2")?;
    view_key_label.set_inner_html("View Key");
    view_key_label.set_class_name("view_key");
    div_view_key_inputs.append_child(&view_key_label)?;

    let view_key_textbox = document.create_element("textarea")?;
    view_key_textbox.set_class_name("result");
    view_key_textbox.set_attribute("placeholder", &private_key.to_view_key())?;
    view_key_textbox.set_attribute("disabled", "")?;
    view_key_textbox.set_attribute("readonly", "")?;
    div_view_key_inputs.append_child(&view_key_textbox)?;


    // Label showing the address derived from the private key.
    let address_label = document.create_element("h2")?;
    address_label.set_inner_html("Address");
    address_label.set_class_name("address");
    div_address_inputs.append_child(&address_label)?;

    let address_textbox = document.create_element("textarea")?;
    address_textbox.set_class_name("result");
    address_textbox.set_attribute("placeholder", &private_key.to_address())?;
    address_textbox.set_attribute("disabled", "")?;
    address_textbox.set_attribute("readonly", "")?;
    div_address_inputs.append_child(&address_textbox)?;

    // Casts needed for interacting with the elements
    let private_key_box = private_key_textbox
        .dyn_into::<web_sys::HtmlTextAreaElement>()?;
    let view_key_box = view_key_textbox
        .dyn_into::<web_sys::HtmlTextAreaElement>()?;
    let address_box = address_textbox
        .dyn_into::<web_sys::HtmlTextAreaElement>()?;

    // Add event listener
    let handler = Closure::wrap(Box::new(move |_: web_sys::InputEvent| {
        private_key_box.set_value(&private_key.to_string());
        view_key_box.set_value(&private_key.to_view_key());
        address_box.set_value(&private_key.to_address());
    }) as Box<dyn FnMut(_)>);

    handler.forget();

    Ok(div_of_divs)
}
