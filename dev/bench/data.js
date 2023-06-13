window.BENCHMARK_DATA = {
  "lastUpdate": 1686668491959,
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
          "id": "d36159fa65b9d3a256970f2a5a150e90c32c6ca7",
          "message": "[chore] bump serde from 1.0.163 to 1.0.164",
          "timestamp": "2023-06-13T10:38:56-04:00",
          "tree_id": "a17a44804fd1262bc25f9293a163a471c492a262",
          "url": "https://github.com/AleoHQ/sdk/commit/d36159fa65b9d3a256970f2a5a150e90c32c6ca7"
        },
        "date": 1686668485648,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 223825,
            "range": "± 334",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 87195,
            "range": "± 178",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 323735,
            "range": "± 517",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 231443,
            "range": "± 568",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 561247,
            "range": "± 2404",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}