window.BENCHMARK_DATA = {
  "lastUpdate": 1678413451268,
  "repoUrl": "https://github.com/AleoHQ/aleo",
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
          "id": "a5bc0d8f296febace94a7177fc22c294ece0d2e9",
          "message": "[Feature] - Rust SDK - Deploy",
          "timestamp": "2023-03-09T19:47:58-06:00",
          "tree_id": "f49446c77e65d8c5d40847b38233c69d62312392",
          "url": "https://github.com/AleoHQ/aleo/commit/a5bc0d8f296febace94a7177fc22c294ece0d2e9"
        },
        "date": 1678413448506,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 249028,
            "range": "± 15923",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 96094,
            "range": "± 364",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 349301,
            "range": "± 3167",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 247319,
            "range": "± 885",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 601255,
            "range": "± 2604",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}