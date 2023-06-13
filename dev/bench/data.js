window.BENCHMARK_DATA = {
  "lastUpdate": 1686669008256,
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
          "id": "27a64cacacff91d768dc8e1ed54a428d66f690ec",
          "message": "[Fix] Patch split function on aleo.tools",
          "timestamp": "2023-06-13T10:59:22-04:00",
          "tree_id": "61c602e8d95f805ac14860fa80f248507773db34",
          "url": "https://github.com/AleoHQ/sdk/commit/27a64cacacff91d768dc8e1ed54a428d66f690ec"
        },
        "date": 1686669003205,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 227394,
            "range": "± 35229",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 86757,
            "range": "± 2174",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 324361,
            "range": "± 853",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 231701,
            "range": "± 601",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 561711,
            "range": "± 3138",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}