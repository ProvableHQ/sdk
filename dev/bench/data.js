window.BENCHMARK_DATA = {
  "lastUpdate": 1683935453531,
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
          "id": "0fce10f2afc6470a8373a1a9bc351f04d6cd2fc5",
          "message": "Bump Aleo SDK version to 0.4.2",
          "timestamp": "2023-05-12T18:25:20-05:00",
          "tree_id": "a46972c42441c94274bc8aade6d1ef226fedcded",
          "url": "https://github.com/AleoHQ/aleo/commit/0fce10f2afc6470a8373a1a9bc351f04d6cd2fc5"
        },
        "date": 1683935449612,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 271955,
            "range": "± 51057",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 104513,
            "range": "± 41419",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 384324,
            "range": "± 58549",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 278923,
            "range": "± 43735",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 658797,
            "range": "± 68922",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}