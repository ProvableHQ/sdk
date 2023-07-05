window.BENCHMARK_DATA = {
  "lastUpdate": 1688587163851,
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
          "id": "434c9db57e2c5955bd5c6d570a54e82f9781b314",
          "message": "[chore] bump serde from 1.0.164 to 1.0.166",
          "timestamp": "2023-07-05T15:37:28-04:00",
          "tree_id": "fea82e31bd7fa23cc84231852a8af25226617ae1",
          "url": "https://github.com/AleoHQ/sdk/commit/434c9db57e2c5955bd5c6d570a54e82f9781b314"
        },
        "date": 1688587146176,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 265853,
            "range": "± 57405",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 108835,
            "range": "± 17831",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 412728,
            "range": "± 92172",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 291221,
            "range": "± 62531",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 693513,
            "range": "± 85374",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}