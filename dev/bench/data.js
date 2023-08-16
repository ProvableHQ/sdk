window.BENCHMARK_DATA = {
  "lastUpdate": 1692226747692,
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
          "id": "22bffadbc40e34708c603b2b3e33892e74a06914",
          "message": "[chore] bump anyhow from 1.0.73 to 1.0.74",
          "timestamp": "2023-08-16T18:48:09-04:00",
          "tree_id": "4d985fffb4e0fbe2fe9fc353988db2ccb7544d25",
          "url": "https://github.com/AleoHQ/sdk/commit/22bffadbc40e34708c603b2b3e33892e74a06914"
        },
        "date": 1692226730300,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 258915,
            "range": "± 32690",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 102359,
            "range": "± 14403",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 379807,
            "range": "± 83833",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 267977,
            "range": "± 41876",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 662466,
            "range": "± 63574",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}