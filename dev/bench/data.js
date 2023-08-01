window.BENCHMARK_DATA = {
  "lastUpdate": 1690914111638,
  "repoUrl": "https://github.com/AleoHQ/sdk",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "brent@aleo.org",
            "name": "Brent C",
            "username": "onetrickwolf"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "429bd6828d54f0543f4eb87419fcb3c1ef43e5ed",
          "message": "[Feature] generate input fields, syntax highlighting, light mode (#696)\n\n* loading stash\r\n\r\n* using link for router\r\n\r\n* program form\r\n\r\n* load program abstracted\r\n\r\n* trailing return\r\n\r\n* code editor\r\n\r\n* dark mode switch\r\n\r\n* tweaks\r\n\r\n* new light code theme, auto add .aleo, flashing height fix\r\n\r\n* resizable code editor\r\n\r\n* auto .aleo refinement\r\n\r\n* conditional on-chain forms\r\n\r\n* before collapse\r\n\r\n* collapse working\r\n\r\n* refactor\r\n\r\n* nested structs and records\r\n\r\n* tweaks\r\n\r\n* kind of working, before refactor\r\n\r\n* before wasm fix\r\n\r\n* working with wasm fix\r\n\r\n* execute offline working\r\n\r\n* modal and demo\r\n\r\n* success and error execution response working\r\n\r\n* fee estimation\r\n\r\n* on-chain execution, fixing collapse key, estimate fee tweaks, on-chain rules\r\n\r\n* setting up routing, preventing popping effect for code editor\r\n\r\n* removing debugging, catching error case\r\n\r\n* Update website/src/tabs/develop/execute/CodeEditor.jsx\r\n\r\nCo-authored-by: Collin Chin <16715212+collinc97@users.noreply.github.com>\r\nSigned-off-by: Brent C <brent.conn@gmail.com>\r\n\r\n* clarifying modal state\r\n\r\n* fixing nested serialization\r\n\r\n---------\r\n\r\nSigned-off-by: Brent C <brent.conn@gmail.com>\r\nCo-authored-by: Collin Chin <16715212+collinc97@users.noreply.github.com>",
          "timestamp": "2023-08-01T14:12:25-04:00",
          "tree_id": "2323a48b91a4cc5c6dd949c09b979056275e95c1",
          "url": "https://github.com/AleoHQ/sdk/commit/429bd6828d54f0543f4eb87419fcb3c1ef43e5ed"
        },
        "date": 1690914093264,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 206480,
            "range": "± 3639",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 89394,
            "range": "± 349",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 343601,
            "range": "± 645",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 248565,
            "range": "± 523",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 597736,
            "range": "± 2313",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}