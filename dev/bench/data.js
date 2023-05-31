window.BENCHMARK_DATA = {
  "lastUpdate": 1685540444902,
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
          "id": "41642d3e8f8f0c353e25f038ff9b0fcf68694035",
          "message": "[chore] build(deps): bump once_cell from 1.17.1 to 1.17.2",
          "timestamp": "2023-05-31T09:20:45-04:00",
          "tree_id": "a8f1c79cfb47cbee299d79c02d1627c07cd1f4a3",
          "url": "https://github.com/AleoHQ/sdk/commit/41642d3e8f8f0c353e25f038ff9b0fcf68694035"
        },
        "date": 1685540440932,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 207664,
            "range": "± 2380",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 80953,
            "range": "± 350",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 296483,
            "range": "± 694",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 210409,
            "range": "± 740",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 515780,
            "range": "± 10633",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}