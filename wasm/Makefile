wasm_test:
	cargo test --target wasm32-unknown-unknown

test:
	cargo test

build:
	wasm-pack build --target web

run: build
	python3 -m http.server
