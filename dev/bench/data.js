window.BENCHMARK_DATA = {
  "lastUpdate": 1689623272936,
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
          "id": "cfdecd7df6ecd8ae1691d91d6ac5ab0971ab9f35",
          "message": "[chore] bump anyhow from 1.0.71 to 1.0.72",
          "timestamp": "2023-07-17T15:29:14-04:00",
          "tree_id": "2e84e4f0cf11853f4c23846ea15c116135c87b12",
          "url": "https://github.com/AleoHQ/sdk/commit/cfdecd7df6ecd8ae1691d91d6ac5ab0971ab9f35"
        },
        "date": 1689623256330,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 263204,
            "range": "± 12459",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 113493,
            "range": "± 10337",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 419974,
            "range": "± 27222",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 297997,
            "range": "± 24599",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 715716,
            "range": "± 35745",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}