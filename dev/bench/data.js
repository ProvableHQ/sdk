window.BENCHMARK_DATA = {
  "lastUpdate": 1689964164678,
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
          "id": "397168dd5763f5c980a51be798d7b52e149f24f2",
          "message": "[chore] bump serde from 1.0.173 to 1.0.174",
          "timestamp": "2023-07-21T14:13:18-04:00",
          "tree_id": "a12fcda32803c9ce4a452ad1f2ffa3e7b190f501",
          "url": "https://github.com/AleoHQ/sdk/commit/397168dd5763f5c980a51be798d7b52e149f24f2"
        },
        "date": 1689964145947,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 224795,
            "range": "± 3092",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101713,
            "range": "± 8559",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 374449,
            "range": "± 818",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 267643,
            "range": "± 831",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 645991,
            "range": "± 3154",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}