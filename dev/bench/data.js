window.BENCHMARK_DATA = {
  "lastUpdate": 1692114264207,
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
          "id": "87c8583d78672e1eefb9ecaa44d906a5e4d22233",
          "message": "[chore] bump anyhow from 1.0.72 to 1.0.73",
          "timestamp": "2023-08-15T11:35:01-04:00",
          "tree_id": "7346498c31dcd0bae202f1bf34485e77780b0898",
          "url": "https://github.com/AleoHQ/sdk/commit/87c8583d78672e1eefb9ecaa44d906a5e4d22233"
        },
        "date": 1692114248936,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 225941,
            "range": "± 1177",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101674,
            "range": "± 1220",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 373313,
            "range": "± 677",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 267441,
            "range": "± 574",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 645014,
            "range": "± 2018",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}