window.BENCHMARK_DATA = {
  "lastUpdate": 1688755349097,
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
          "id": "b757a1a6a91e12d23d203bd8e68658101fc4127d",
          "message": "[Update] Aleo SDK version 0.5.0",
          "timestamp": "2023-07-07T14:26:25-04:00",
          "tree_id": "30065ad3011797c1e1623da3e0e20e424cfb0f5d",
          "url": "https://github.com/AleoHQ/sdk/commit/b757a1a6a91e12d23d203bd8e68658101fc4127d"
        },
        "date": 1688755336940,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 226148,
            "range": "± 86460",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 98458,
            "range": "± 663",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 353503,
            "range": "± 856",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 250038,
            "range": "± 848",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 608346,
            "range": "± 2646",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}