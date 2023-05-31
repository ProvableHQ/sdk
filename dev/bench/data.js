window.BENCHMARK_DATA = {
  "lastUpdate": 1685540446068,
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
      },
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
          "id": "97378686ec29f0620e6d23871bb4e27564f2cb72",
          "message": "[chore] build(deps): bump tokio from 1.28.1 to 1.28.2",
          "timestamp": "2023-05-31T09:20:17-04:00",
          "tree_id": "ce7340c3ab1a724e9ff03b0b189298f70e7c11f5",
          "url": "https://github.com/AleoHQ/sdk/commit/97378686ec29f0620e6d23871bb4e27564f2cb72"
        },
        "date": 1685540441655,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 204376,
            "range": "± 1210",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 81098,
            "range": "± 554",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 295115,
            "range": "± 1642",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 209796,
            "range": "± 220",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 513263,
            "range": "± 2782",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}