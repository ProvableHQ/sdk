window.BENCHMARK_DATA = {
  "lastUpdate": 1684803426829,
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
          "id": "20d66b6da6955c1c5f1937ca6b6e8719a87c960d",
          "message": "[doc]Fix typos in README.md",
          "timestamp": "2023-05-22T19:35:06-05:00",
          "tree_id": "d0c549dac627f5c67c02ec13f8df4c75b9defd6b",
          "url": "https://github.com/AleoHQ/aleo/commit/20d66b6da6955c1c5f1937ca6b6e8719a87c960d"
        },
        "date": 1684803420531,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 235424,
            "range": "± 31421",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 97805,
            "range": "± 7441",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 337607,
            "range": "± 50912",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 235959,
            "range": "± 16376",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 567219,
            "range": "± 60283",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}