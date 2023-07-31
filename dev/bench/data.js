window.BENCHMARK_DATA = {
  "lastUpdate": 1690825548292,
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
          "id": "f2427a145aa5c96a00ba3cefa1acf03d2c43973f",
          "message": "[chore] bump serde from 1.0.177 to 1.0.179",
          "timestamp": "2023-07-31T13:27:55-04:00",
          "tree_id": "9d09f991ee225e10b903574dcdb26adee580b4b2",
          "url": "https://github.com/AleoHQ/sdk/commit/f2427a145aa5c96a00ba3cefa1acf03d2c43973f"
        },
        "date": 1690825530554,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 248229,
            "range": "± 2347",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 107749,
            "range": "± 1662",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 413164,
            "range": "± 3457",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 298703,
            "range": "± 932",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 719011,
            "range": "± 2841",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}