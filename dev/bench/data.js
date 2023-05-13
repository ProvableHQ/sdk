window.BENCHMARK_DATA = {
  "lastUpdate": 1683937980019,
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
          "id": "26b3234257f4b19eb537d72367d2e1a83eee4074",
          "message": "build(deps): bump time from 0.3.20 to 0.3.21",
          "timestamp": "2023-05-12T19:13:55-05:00",
          "tree_id": "593e95b3e1134b6145f30e3cc8a9b6767942cf42",
          "url": "https://github.com/AleoHQ/aleo/commit/26b3234257f4b19eb537d72367d2e1a83eee4074"
        },
        "date": 1683937976797,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 207941,
            "range": "± 2575",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 80738,
            "range": "± 147",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 297137,
            "range": "± 695",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 210955,
            "range": "± 186",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 515034,
            "range": "± 2361",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}