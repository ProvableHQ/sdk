window.BENCHMARK_DATA = {
  "lastUpdate": 1691070742652,
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
          "id": "bdc9f597f05877fdef8861fdfb66dcd7e8330068",
          "message": "[chore] bump time from 0.3.24 to 0.3.25",
          "timestamp": "2023-08-03T09:31:40-04:00",
          "tree_id": "ce5140b3773f6523a3865d61f0834edafd0e837f",
          "url": "https://github.com/AleoHQ/sdk/commit/bdc9f597f05877fdef8861fdfb66dcd7e8330068"
        },
        "date": 1691070726864,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 235072,
            "range": "± 48276",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 98722,
            "range": "± 20203",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 334149,
            "range": "± 74152",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 250321,
            "range": "± 55405",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 610378,
            "range": "± 147963",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}