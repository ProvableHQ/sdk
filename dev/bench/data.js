window.BENCHMARK_DATA = {
  "lastUpdate": 1691705220179,
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
          "id": "c803106e485a6f7370b9a529bda2bfc2b6ac195c",
          "message": "[Chore] Bump SnarkVM to version 0.14.6",
          "timestamp": "2023-08-10T17:51:01-04:00",
          "tree_id": "8b8647e4f01be75ba147e8c5f82e81930df544ef",
          "url": "https://github.com/AleoHQ/sdk/commit/c803106e485a6f7370b9a529bda2bfc2b6ac195c"
        },
        "date": 1691705201440,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 225701,
            "range": "± 3904",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101222,
            "range": "± 317",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 372928,
            "range": "± 528",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 266978,
            "range": "± 400",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 644344,
            "range": "± 2888",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}