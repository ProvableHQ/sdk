window.BENCHMARK_DATA = {
  "lastUpdate": 1688586519434,
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
          "id": "c23c5bb3bbed64b8f71ed2bab2dc1102f11ba2f6",
          "message": "[chore] build(deps): bump colored from 2.0.0 to 2.0.3",
          "timestamp": "2023-07-05T15:30:36-04:00",
          "tree_id": "f63e1722d3b2cef4fcecd2b5d07bed1814a7aca1",
          "url": "https://github.com/AleoHQ/sdk/commit/c23c5bb3bbed64b8f71ed2bab2dc1102f11ba2f6"
        },
        "date": 1688586504107,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 260670,
            "range": "± 7176",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 107820,
            "range": "± 4520",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 414161,
            "range": "± 20541",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 299635,
            "range": "± 4644",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 720800,
            "range": "± 26490",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}