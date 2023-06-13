window.BENCHMARK_DATA = {
  "lastUpdate": 1686667014941,
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
          "id": "23d233068b57d89555d4371f1a79b29f38876946",
          "message": "[Release] Aleo SDK version v0.4.3",
          "timestamp": "2023-06-13T10:14:32-04:00",
          "tree_id": "38ff69347092cb9ce034883365116ee6b1aaf519",
          "url": "https://github.com/AleoHQ/sdk/commit/23d233068b57d89555d4371f1a79b29f38876946"
        },
        "date": 1686667007953,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 255673,
            "range": "± 1466",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 97647,
            "range": "± 32595",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 352127,
            "range": "± 901",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 249452,
            "range": "± 862",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 605197,
            "range": "± 2750",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}