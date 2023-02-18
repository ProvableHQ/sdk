window.BENCHMARK_DATA = {
  "lastUpdate": 1676686840546,
  "repoUrl": "https://github.com/AleoHQ/aleo",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "collin.chin@berkeley.edu",
            "name": "Collin Chin",
            "username": "collinc97"
          },
          "committer": {
            "email": "collin.chin@berkeley.edu",
            "name": "Collin Chin",
            "username": "collinc97"
          },
          "distinct": true,
          "id": "3f5a879511ee70a5fdffd65ee8d4f89443f052bd",
          "message": "commit readme updates",
          "timestamp": "2023-02-17T21:14:09-05:00",
          "tree_id": "7fad203ad2910121d44255cc9e327987e3a097b6",
          "url": "https://github.com/AleoHQ/aleo/commit/3f5a879511ee70a5fdffd65ee8d4f89443f052bd"
        },
        "date": 1676686837032,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 264110,
            "range": "± 5196",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101681,
            "range": "± 1997",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 369068,
            "range": "± 6370",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 261257,
            "range": "± 6444",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 639779,
            "range": "± 13672",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}