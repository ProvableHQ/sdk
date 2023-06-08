window.BENCHMARK_DATA = {
  "lastUpdate": 1686187217066,
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
          "id": "5b16b89b29a5542b046f1c04e710f40426197ef2",
          "message": "[chore] bump getrandom from 0.2.9 to 0.2.10",
          "timestamp": "2023-06-07T20:58:18-04:00",
          "tree_id": "9bb2bf1af446a1f76befbc88073b7d5999250e55",
          "url": "https://github.com/AleoHQ/sdk/commit/5b16b89b29a5542b046f1c04e710f40426197ef2"
        },
        "date": 1686187212092,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 230678,
            "range": "± 163945",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 90228,
            "range": "± 722",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 346090,
            "range": "± 4307",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 249339,
            "range": "± 695",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 601638,
            "range": "± 2579",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}