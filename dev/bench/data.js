window.BENCHMARK_DATA = {
  "lastUpdate": 1685021694526,
  "repoUrl": "https://github.com/AleoHQ/sdk",
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
          "id": "781084afa62f7040f29b600603891408c5a77afd",
          "message": "[chore]\n\nbump wasm-bindgen-test from 0.3.35 to 0.3.36",
          "timestamp": "2023-05-25T08:10:12-05:00",
          "tree_id": "f3c225869a0f6c5cf0ad4b207876104274fe6afd",
          "url": "https://github.com/AleoHQ/sdk/commit/781084afa62f7040f29b600603891408c5a77afd"
        },
        "date": 1685021689661,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 246139,
            "range": "± 562",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 97194,
            "range": "± 158",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 353289,
            "range": "± 837",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 251182,
            "range": "± 377",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 612094,
            "range": "± 9735",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}