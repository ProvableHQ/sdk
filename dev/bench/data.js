window.BENCHMARK_DATA = {
  "lastUpdate": 1685976732739,
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
          "id": "c46046b875a494ba8a70c44453d0c659b32957a1",
          "message": "[chore] bump self_update from 0.36.0 to 0.37.0",
          "timestamp": "2023-06-05T10:27:09-04:00",
          "tree_id": "73ceb051deb1dd400f93ee71f3cf8379f1c6e145",
          "url": "https://github.com/AleoHQ/sdk/commit/c46046b875a494ba8a70c44453d0c659b32957a1"
        },
        "date": 1685976726095,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 268091,
            "range": "± 1021",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 104299,
            "range": "± 689",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 388703,
            "range": "± 1329",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 277979,
            "range": "± 748",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 674495,
            "range": "± 3175",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}