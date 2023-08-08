window.BENCHMARK_DATA = {
  "lastUpdate": 1691505938314,
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
          "id": "4fc7d8694b1c41c408febbc7d918d497e02f4d45",
          "message": "[chore] bump clap from 4.3.19 to 4.3.21",
          "timestamp": "2023-08-08T10:25:53-04:00",
          "tree_id": "f4f20e52269b7e6dc27fbbd0d50753ad6ffa06c2",
          "url": "https://github.com/AleoHQ/sdk/commit/4fc7d8694b1c41c408febbc7d918d497e02f4d45"
        },
        "date": 1691505917956,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 228656,
            "range": "± 22189",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 100871,
            "range": "± 10803",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 372993,
            "range": "± 35655",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 260258,
            "range": "± 22255",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 641739,
            "range": "± 39678",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}