window.BENCHMARK_DATA = {
  "lastUpdate": 1684948874326,
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
          "id": "45a4ebf18154656198d71fc30c7ae9d228b63633",
          "message": "[chore] bump wasm-bindgen-futures from 0.4.35 to 0.4.36",
          "timestamp": "2023-05-24T12:00:09-05:00",
          "tree_id": "33e3242881056c9fbf742202881f39e9a2c72acd",
          "url": "https://github.com/AleoHQ/sdk/commit/45a4ebf18154656198d71fc30c7ae9d228b63633"
        },
        "date": 1684948870587,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 208282,
            "range": "± 4997",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 80537,
            "range": "± 126",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 295347,
            "range": "± 686",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 209018,
            "range": "± 196",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 514361,
            "range": "± 3047",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}