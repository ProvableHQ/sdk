window.BENCHMARK_DATA = {
  "lastUpdate": 1689186163392,
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
          "id": "b36ee47c81a5769a53ccf3674bf8a8a3a0c799c9",
          "message": "[Feature] Fee estimation on aleo.tools",
          "timestamp": "2023-07-12T14:13:49-04:00",
          "tree_id": "4cfd45884d57ac6cb341635439d701467c9c5622",
          "url": "https://github.com/AleoHQ/sdk/commit/b36ee47c81a5769a53ccf3674bf8a8a3a0c799c9"
        },
        "date": 1689186147750,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 264101,
            "range": "± 34071",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 108653,
            "range": "± 10809",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 390709,
            "range": "± 43040",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 277919,
            "range": "± 32607",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 671901,
            "range": "± 88520",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}