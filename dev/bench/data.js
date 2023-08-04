window.BENCHMARK_DATA = {
  "lastUpdate": 1691186274843,
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
          "id": "1b41ca39319cce51672e8b3865f40a553d8b63fa",
          "message": "[chore] bump serde from 1.0.180 to 1.0.181",
          "timestamp": "2023-08-04T17:41:23-04:00",
          "tree_id": "275ba804296637c4f5430e8e51efe4c15cfad2c5",
          "url": "https://github.com/AleoHQ/sdk/commit/1b41ca39319cce51672e8b3865f40a553d8b63fa"
        },
        "date": 1691186256758,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 225409,
            "range": "± 38729",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101695,
            "range": "± 110471",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 373188,
            "range": "± 665",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 267229,
            "range": "± 607",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 644639,
            "range": "± 3818",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}