window.BENCHMARK_DATA = {
  "lastUpdate": 1692027356955,
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
          "id": "ec98d0448f0d77f63f51ddd656c6043cfcdeaf26",
          "message": "[chore] bump tokio from 1.30.0 to 1.31.0",
          "timestamp": "2023-08-14T11:24:40-04:00",
          "tree_id": "f6f643e1f21a870d0142a12c6476dc83fa08d2cf",
          "url": "https://github.com/AleoHQ/sdk/commit/ec98d0448f0d77f63f51ddd656c6043cfcdeaf26"
        },
        "date": 1692027188848,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 206636,
            "range": "± 1037",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 89619,
            "range": "± 202",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 344113,
            "range": "± 818",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 248848,
            "range": "± 637",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 598565,
            "range": "± 2484",
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
          "id": "f5455073a365235d1cb4d209bc599074199df5c3",
          "message": "[Feature] Integrate Aleo Javascript SDK into aleo.tools",
          "timestamp": "2023-08-14T11:24:12-04:00",
          "tree_id": "eedd643a6fe902d409520ef71bcfb434df5f280b",
          "url": "https://github.com/AleoHQ/sdk/commit/f5455073a365235d1cb4d209bc599074199df5c3"
        },
        "date": 1692027339689,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 265884,
            "range": "± 25614",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 115857,
            "range": "± 9017",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 425493,
            "range": "± 58166",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 299988,
            "range": "± 26659",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 728883,
            "range": "± 145697",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}