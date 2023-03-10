window.BENCHMARK_DATA = {
  "lastUpdate": 1678489504621,
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
          "id": "b1f0d12a2b807816491c2826d1defc0bab5325d4",
          "message": "[Feature] Rust SDK - Execute",
          "timestamp": "2023-03-10T16:55:11-06:00",
          "tree_id": "aa5894d5e29c0a7db3ee54c0410de12a8921ad17",
          "url": "https://github.com/AleoHQ/aleo/commit/b1f0d12a2b807816491c2826d1defc0bab5325d4"
        },
        "date": 1678489500895,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 250580,
            "range": "± 35014",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 96145,
            "range": "± 10840",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 350751,
            "range": "± 1878",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 247767,
            "range": "± 974",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 602173,
            "range": "± 1637",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}