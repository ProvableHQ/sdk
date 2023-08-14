window.BENCHMARK_DATA = {
  "lastUpdate": 1692027204880,
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
          "id": "ec98d0448f0d77f63f51ddd656c6043cfcdeaf26",
          "message": "[chore] bump tokio from 1.30.0 to 1.31.0",
          "timestamp": "2023-08-14T11:24:40-04:00",
          "tree_id": "f6f643e1f21a870d0142a12c6476dc83fa08d2cf",
          "url": "https://github.com/AleoHQ/sdk/commit/ec98d0448f0d77f63f51ddd656c6043cfcdeaf26"
        },
        "date": 1692027188848,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 206636,
            "range": "± 1037",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 89619,
            "range": "± 202",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 344113,
            "range": "± 818",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 248848,
            "range": "± 637",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 598565,
            "range": "± 2484",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}