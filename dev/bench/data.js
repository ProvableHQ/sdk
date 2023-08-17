window.BENCHMARK_DATA = {
  "lastUpdate": 1692288468696,
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
          "id": "34a9dea9c637e45720f788a0665535a3a8efd5b9",
          "message": "[chore]  bump anyhow from 1.0.74 to 1.0.75",
          "timestamp": "2023-08-17T11:59:02-04:00",
          "tree_id": "7d00c883e1fdc9202f33cf3b07113852c1ec4297",
          "url": "https://github.com/AleoHQ/sdk/commit/34a9dea9c637e45720f788a0665535a3a8efd5b9"
        },
        "date": 1692288451369,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 207674,
            "range": "± 424295",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 90302,
            "range": "± 246",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 337741,
            "range": "± 413679",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 243610,
            "range": "± 1089",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 586989,
            "range": "± 3137",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}