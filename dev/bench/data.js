window.BENCHMARK_DATA = {
  "lastUpdate": 1684877534793,
  "repoUrl": "https://github.com/AleoHQ/aleo",
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
          "id": "33c1f1178aff5a16e56cec6637390e3c4d4de8c5",
          "message": "[chore] bump js-sys from 0.3.62 to 0.3.63",
          "timestamp": "2023-05-23T16:07:16-05:00",
          "tree_id": "613dda7841627494b348ec9754bd94acd07e6004",
          "url": "https://github.com/AleoHQ/aleo/commit/33c1f1178aff5a16e56cec6637390e3c4d4de8c5"
        },
        "date": 1684877529632,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 262976,
            "range": "± 610335",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 109459,
            "range": "± 13388",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 399080,
            "range": "± 32107",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 276740,
            "range": "± 35293",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 683558,
            "range": "± 43010",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}