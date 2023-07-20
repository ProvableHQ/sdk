window.BENCHMARK_DATA = {
  "lastUpdate": 1689870099009,
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
          "id": "5e7e2cd8ea0d0ba1d2dc200d0732dc2b523d81f9",
          "message": "[chore] bump clap from 4.3.16 to 4.3.17",
          "timestamp": "2023-07-20T12:02:34-04:00",
          "tree_id": "24219f724751e31073a0568e9cb72c99e39f8e2e",
          "url": "https://github.com/AleoHQ/sdk/commit/5e7e2cd8ea0d0ba1d2dc200d0732dc2b523d81f9"
        },
        "date": 1689869991819,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 205224,
            "range": "± 453",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 88409,
            "range": "± 196",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 332367,
            "range": "± 747",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 238294,
            "range": "± 518",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 576888,
            "range": "± 2610",
            "unit": "ns/iter"
          }
        ]
      },
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
          "id": "5b68908ce06fd63e5e17cab1bdb72b83ac6cea00",
          "message": "[chore] bump serde from 1.0.171 to 1.0.173",
          "timestamp": "2023-07-20T12:03:20-04:00",
          "tree_id": "34c51f1b9e20f22100e3c6a01b36b32f5409ce24",
          "url": "https://github.com/AleoHQ/sdk/commit/5b68908ce06fd63e5e17cab1bdb72b83ac6cea00"
        },
        "date": 1689870081957,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 245134,
            "range": "± 34730",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101264,
            "range": "± 13379",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 398147,
            "range": "± 83616",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 277323,
            "range": "± 44642",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 670707,
            "range": "± 144503",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}