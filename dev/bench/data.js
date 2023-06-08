window.BENCHMARK_DATA = {
  "lastUpdate": 1686257796147,
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
          "id": "9c4983ca840b85290e084ad3d957472b86900d41",
          "message": "[chore] build(deps): bump time from 0.3.21 to 0.3.22",
          "timestamp": "2023-06-08T16:32:33-04:00",
          "tree_id": "b043b4038604ecf5fd9d837fe9a238ea590a017d",
          "url": "https://github.com/AleoHQ/sdk/commit/9c4983ca840b85290e084ad3d957472b86900d41"
        },
        "date": 1686257790483,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 223697,
            "range": "± 291",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 87196,
            "range": "± 223",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 323365,
            "range": "± 539",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 231776,
            "range": "± 750",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 560833,
            "range": "± 1888",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}