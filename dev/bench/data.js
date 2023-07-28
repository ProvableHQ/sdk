window.BENCHMARK_DATA = {
  "lastUpdate": 1690577440539,
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
          "id": "926914532332719131872e04322a450e663cdcdd",
          "message": "[chore] bump serde from 1.0.176 to 1.0.177",
          "timestamp": "2023-07-28T16:34:04-04:00",
          "tree_id": "a7f4ae5df87836d9f5bed7fd6e8352ce81a4197c",
          "url": "https://github.com/AleoHQ/sdk/commit/926914532332719131872e04322a450e663cdcdd"
        },
        "date": 1690577425422,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 207398,
            "range": "± 457",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 89699,
            "range": "± 186",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 330690,
            "range": "± 917",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 237467,
            "range": "± 717",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 574692,
            "range": "± 2513",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}