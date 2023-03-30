window.BENCHMARK_DATA = {
  "lastUpdate": 1680191951818,
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
          "id": "d2d81d2c9f655477c675b5ffa1ab9c2fd7a160b1",
          "message": "[Fix] Release Cleanup",
          "timestamp": "2023-03-30T10:40:47-05:00",
          "tree_id": "7c5038f6ff9f558d0ac8ea5b2e5ee59a4c42b2d8",
          "url": "https://github.com/AleoHQ/aleo/commit/d2d81d2c9f655477c675b5ffa1ab9c2fd7a160b1"
        },
        "date": 1680191948453,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 239508,
            "range": "± 17336",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 94892,
            "range": "± 351",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 346371,
            "range": "± 2008",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 245983,
            "range": "± 831",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 596120,
            "range": "± 1396",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}