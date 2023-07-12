window.BENCHMARK_DATA = {
  "lastUpdate": 1689126845436,
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
          "id": "7872a82e466fe22d5a2492e1e6a3f69ca0dd54ab",
          "message": "[chore] bump serde from 1.0.166 to 1.0.171",
          "timestamp": "2023-07-11T21:36:54-04:00",
          "tree_id": "e0f1d8f24cfff7c7497f419c1aa4fe696987457b",
          "url": "https://github.com/AleoHQ/sdk/commit/7872a82e466fe22d5a2492e1e6a3f69ca0dd54ab"
        },
        "date": 1689126831046,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 258279,
            "range": "± 539",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 107816,
            "range": "± 646",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 411528,
            "range": "± 1778",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 297243,
            "range": "± 738",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 715568,
            "range": "± 2897",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}