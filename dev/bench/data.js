window.BENCHMARK_DATA = {
  "lastUpdate": 1682546434240,
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
          "id": "0d533528ca319cc1af076ce6da892544393f6ed4",
          "message": "chore(sdk): bump http from 0.2.8 to 0.2.9",
          "timestamp": "2023-04-26T16:41:37-05:00",
          "tree_id": "7fe0c51c4dcb3fa3de177046e85e68518936d9e5",
          "url": "https://github.com/AleoHQ/aleo/commit/0d533528ca319cc1af076ce6da892544393f6ed4"
        },
        "date": 1682546430655,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 249890,
            "range": "± 20775",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 95699,
            "range": "± 370",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 348563,
            "range": "± 1648",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 247372,
            "range": "± 1113",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 600222,
            "range": "± 1461",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}