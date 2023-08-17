window.BENCHMARK_DATA = {
  "lastUpdate": 1692288662765,
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
      },
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
          "id": "a00d448d2b5103585f434e2cdc6533e161edf20b",
          "message": "[chore] bump tokio from 1.31.0 to 1.32.0",
          "timestamp": "2023-08-17T11:59:30-04:00",
          "tree_id": "c4658930f9fcbcd4282b5d67b10f9bc780f0e5b3",
          "url": "https://github.com/AleoHQ/sdk/commit/a00d448d2b5103585f434e2cdc6533e161edf20b"
        },
        "date": 1692288641642,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 270203,
            "range": "± 47468",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 114566,
            "range": "± 23468",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 417601,
            "range": "± 69494",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 302849,
            "range": "± 60187",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 708459,
            "range": "± 97058",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}