window.BENCHMARK_DATA = {
  "lastUpdate": 1676409133418,
  "repoUrl": "https://github.com/AleoHQ/aleo",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "mturner@aleo.org",
            "name": "Mike Turner",
            "username": "iamalwaysuncomfortable"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8cab536264488c91a4971d4d3e71f783e6f13446",
          "message": "[Feature] Private key encryption at rest functionality for Aleo CLI (#462)\n\n* Add Aleo API Methods and Reorganize Rust Crates (#455)\r\n\r\n* Add API methods that are useful in wallet management and re-organize rust & wasm crates\r\n\r\n* naming nit and dep fix\r\n\r\n---------\r\n\r\nCo-authored-by: collin <16715212+collinc97@users.noreply.github.com>\r\n\r\nmerge testnet3\r\n\r\n* Add ability to encrypt and decrypt private keys at rest\r\n\r\n* Reorganize dependencies for wasm compatibility\r\n\r\n* Fix erroneous renames\r\n\r\n* Fix a few comments and enable conditional compilation for wasm-feature\r\n\r\n* Add ability to specify passwords as an option and add test coverage\r\n\r\n* Complete test coverage + temp file system cleanup hygiene in tests\r\n\r\n---------\r\n\r\nSigned-off-by: Mike Turner <mturner@aleo.org>",
          "timestamp": "2023-02-14T13:01:34-08:00",
          "tree_id": "959c62692ef4af742755719bddee1ec28f8005a7",
          "url": "https://github.com/AleoHQ/aleo/commit/8cab536264488c91a4971d4d3e71f783e6f13446"
        },
        "date": 1676409129399,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 283486,
            "range": "± 62291",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 117833,
            "range": "± 14518",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 429034,
            "range": "± 73154",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 309467,
            "range": "± 42896",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 733527,
            "range": "± 208079",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}