window.BENCHMARK_DATA = {
  "lastUpdate": 1676686246325,
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
          "id": "46269289677072aa2f7bb86a6a99b8587a889b40",
          "message": "chore(aleo): bump version for new release",
          "timestamp": "2023-02-17T20:56:00-05:00",
          "tree_id": "8dfa036b8c2e20bf0fb53f028531853c330321fa",
          "url": "https://github.com/AleoHQ/aleo/commit/46269289677072aa2f7bb86a6a99b8587a889b40"
        },
        "date": 1676686242615,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 247552,
            "range": "± 33485",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 99117,
            "range": "± 15635",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 359471,
            "range": "± 56272",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 249185,
            "range": "± 57419",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 617691,
            "range": "± 126975",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}