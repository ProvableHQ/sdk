window.BENCHMARK_DATA = {
  "lastUpdate": 1690221663709,
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
          "id": "6135e0cc5cb584ebe08511f457c777a01dd186fd",
          "message": "[chore] bump serde from 1.0.174 to 1.0.175",
          "timestamp": "2023-07-24T13:44:59-04:00",
          "tree_id": "8b438e0301f10ab8290ae38fcb1e44e8808399ad",
          "url": "https://github.com/AleoHQ/sdk/commit/6135e0cc5cb584ebe08511f457c777a01dd186fd"
        },
        "date": 1690221648947,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 226098,
            "range": "± 935",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101257,
            "range": "± 1415",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 373432,
            "range": "± 524",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 267361,
            "range": "± 491",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 645406,
            "range": "± 1844",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}