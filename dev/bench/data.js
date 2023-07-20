window.BENCHMARK_DATA = {
  "lastUpdate": 1689870008793,
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
      }
    ]
  }
}