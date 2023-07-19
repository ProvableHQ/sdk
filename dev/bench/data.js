window.BENCHMARK_DATA = {
  "lastUpdate": 1689808219830,
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
          "id": "7860eab3374ab871ed03e6681fff89614e6ecc37",
          "message": "[Feature] implement getMappings and getMappingValue endpoints",
          "timestamp": "2023-07-19T19:02:13-04:00",
          "tree_id": "45812d8671c5152ef6d7fe637441a68a07353a48",
          "url": "https://github.com/AleoHQ/sdk/commit/7860eab3374ab871ed03e6681fff89614e6ecc37"
        },
        "date": 1689808202757,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 226060,
            "range": "± 3023",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 100183,
            "range": "± 622",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 373024,
            "range": "± 558",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 266743,
            "range": "± 1099",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 645292,
            "range": "± 2555",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}