window.BENCHMARK_DATA = {
  "lastUpdate": 1692152614408,
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
          "id": "fc64272b253a79043fdc38894ee383e0ef7c4802",
          "message": "[Docs] Add SDK package readme + Add web focused documentation to the SDK repo",
          "timestamp": "2023-08-15T22:20:01-04:00",
          "tree_id": "4ce38c58307199d0620ab8c2736d955eed50bd47",
          "url": "https://github.com/AleoHQ/sdk/commit/fc64272b253a79043fdc38894ee383e0ef7c4802"
        },
        "date": 1692152598684,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 225140,
            "range": "± 1621",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101635,
            "range": "± 237",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 373667,
            "range": "± 1025",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 267387,
            "range": "± 564",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 645222,
            "range": "± 1697",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}