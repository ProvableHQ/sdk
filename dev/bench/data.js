window.BENCHMARK_DATA = {
  "lastUpdate": 1684893370688,
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
          "id": "44e985284dce8e1ff8f14a6fc2b76f594d3ec175",
          "message": "[chore] bump reqwest from 0.11.17 to 0.11.18",
          "timestamp": "2023-05-23T20:33:59-05:00",
          "tree_id": "66f96915900f6f8adc5c37252fb168d5c5486c80",
          "url": "https://github.com/AleoHQ/sdk/commit/44e985284dce8e1ff8f14a6fc2b76f594d3ec175"
        },
        "date": 1684893366418,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 238190,
            "range": "± 11997",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 93791,
            "range": "± 4408",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 337142,
            "range": "± 27841",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 237129,
            "range": "± 20304",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 580614,
            "range": "± 45595",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}