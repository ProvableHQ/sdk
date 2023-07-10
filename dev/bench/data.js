window.BENCHMARK_DATA = {
  "lastUpdate": 1689027193004,
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
          "id": "9c2448d8bdc6aeb1373753be2435b282e666e343",
          "message": "[Feature] Get program mappings in WebAssembly",
          "timestamp": "2023-07-10T18:04:46-04:00",
          "tree_id": "2466d7b79c852b96402162cef72ee5d0797cf7f3",
          "url": "https://github.com/AleoHQ/sdk/commit/9c2448d8bdc6aeb1373753be2435b282e666e343"
        },
        "date": 1689027178852,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 216159,
            "range": "± 346",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 90020,
            "range": "± 132",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 345088,
            "range": "± 569",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 248905,
            "range": "± 400",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 599435,
            "range": "± 2414",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}