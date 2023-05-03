window.BENCHMARK_DATA = {
  "lastUpdate": 1683157675168,
  "repoUrl": "https://github.com/AleoHQ/aleo",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "16715212+collinc97@users.noreply.github.com",
            "name": "collin",
            "username": "collinc97"
          },
          "committer": {
            "email": "16715212+collinc97@users.noreply.github.com",
            "name": "collin",
            "username": "collinc97"
          },
          "distinct": true,
          "id": "5d06b7ebeb64492887b96ee3a37f82da469819ee",
          "message": "commit npm package upgrades",
          "timestamp": "2023-05-03T16:32:32-07:00",
          "tree_id": "f1bfcd33934aee6e12f4c067645c4e800a773bc1",
          "url": "https://github.com/AleoHQ/aleo/commit/5d06b7ebeb64492887b96ee3a37f82da469819ee"
        },
        "date": 1683157672069,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 212225,
            "range": "± 2909",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 85020,
            "range": "± 176",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 308120,
            "range": "± 592",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 218544,
            "range": "± 247",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 535682,
            "range": "± 3108",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}