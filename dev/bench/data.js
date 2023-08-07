window.BENCHMARK_DATA = {
  "lastUpdate": 1691431053543,
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
          "id": "aa692609c116fdd359179a82e0fbd7203e2bb267",
          "message": "[chore] bump serde from 1.0.181 to 1.0.183",
          "timestamp": "2023-08-07T13:37:01-04:00",
          "tree_id": "b61742568fa821cd7403e54647580bee67502f88",
          "url": "https://github.com/AleoHQ/sdk/commit/aa692609c116fdd359179a82e0fbd7203e2bb267"
        },
        "date": 1691431030073,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 245950,
            "range": "± 32469",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 105828,
            "range": "± 10278",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 380972,
            "range": "± 45295",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 271071,
            "range": "± 25484",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 662782,
            "range": "± 77120",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}