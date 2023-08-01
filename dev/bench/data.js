window.BENCHMARK_DATA = {
  "lastUpdate": 1690899280562,
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
          "id": "106ebafef46273c4e9cc6dd24199bb6cc5c6c985",
          "message": "[chore] bump serde from 1.0.179 to 1.0.180",
          "timestamp": "2023-08-01T09:55:52-04:00",
          "tree_id": "da47048ad6d7d62edaf1a4c5799bace46e5dc0fa",
          "url": "https://github.com/AleoHQ/sdk/commit/106ebafef46273c4e9cc6dd24199bb6cc5c6c985"
        },
        "date": 1690899260024,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 229544,
            "range": "± 1541",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101005,
            "range": "± 3004",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 373293,
            "range": "± 2721",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 267511,
            "range": "± 652",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 644862,
            "range": "± 2234",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}