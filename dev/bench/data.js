window.BENCHMARK_DATA = {
  "lastUpdate": 1689813299493,
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
          "id": "a4af3fffcd37677e25f07a3bedc8abf92bec241b",
          "message": "[Feature] Add support for import resolution in program execution and deployment",
          "timestamp": "2023-07-19T20:22:23-04:00",
          "tree_id": "83f566088db153bdec1bb7f8d149f5fcf06817c3",
          "url": "https://github.com/AleoHQ/sdk/commit/a4af3fffcd37677e25f07a3bedc8abf92bec241b"
        },
        "date": 1689813282072,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 226122,
            "range": "± 5297",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 100282,
            "range": "± 286",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 372694,
            "range": "± 1686",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 266803,
            "range": "± 689",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 643302,
            "range": "± 2602",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}