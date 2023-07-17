window.BENCHMARK_DATA = {
  "lastUpdate": 1689626228541,
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
          "id": "72e37d6fe495c7e7d4b9371935ab6628058746f2",
          "message": "[chore] Bump snarkvm versions to 0.14.4",
          "timestamp": "2023-07-17T16:24:08-04:00",
          "tree_id": "b3b3168d9df5ff2661a61c8aa2de4abc0bb4968d",
          "url": "https://github.com/AleoHQ/sdk/commit/72e37d6fe495c7e7d4b9371935ab6628058746f2"
        },
        "date": 1689626212137,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 227975,
            "range": "± 3550",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101284,
            "range": "± 600",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 370887,
            "range": "± 849",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 265927,
            "range": "± 467",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 640361,
            "range": "± 2988",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}