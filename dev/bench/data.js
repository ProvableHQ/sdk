window.BENCHMARK_DATA = {
  "lastUpdate": 1686009571216,
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
          "id": "f81ad4c80be2446ffb35156c2132523cdde765b0",
          "message": "Add wasm integration tests",
          "timestamp": "2023-06-05T19:50:02-04:00",
          "tree_id": "26e587b9e19091b2dc7505d1251ad05b4671e237",
          "url": "https://github.com/AleoHQ/sdk/commit/f81ad4c80be2446ffb35156c2132523cdde765b0"
        },
        "date": 1686009566164,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 223532,
            "range": "± 294",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 87272,
            "range": "± 173",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 326778,
            "range": "± 708",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 232268,
            "range": "± 681",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 562888,
            "range": "± 2781",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}