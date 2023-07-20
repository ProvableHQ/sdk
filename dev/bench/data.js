window.BENCHMARK_DATA = {
  "lastUpdate": 1689821362861,
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
          "id": "65f7d51c0e1518a397840697575af7c962998ac0",
          "message": "[Update] Aleo SDK Version 0.5.1",
          "timestamp": "2023-07-19T22:32:11-04:00",
          "tree_id": "cb2ee893efa7198aaa4619838613d86670c1c391",
          "url": "https://github.com/AleoHQ/sdk/commit/65f7d51c0e1518a397840697575af7c962998ac0"
        },
        "date": 1689821342323,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 225441,
            "range": "± 3723",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101683,
            "range": "± 95806",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 372467,
            "range": "± 581",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 266164,
            "range": "± 525",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 641944,
            "range": "± 1942",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}