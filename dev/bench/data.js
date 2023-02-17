window.BENCHMARK_DATA = {
  "lastUpdate": 1676595170208,
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
          "id": "f6d5d1b7097c2caca1c9f1767ffaf9fdd6d29db0",
          "message": "[Feature] Add serial number function to aleo wasm\n\nAdd the ability to get the serial number from a record to determine whether or not it has been spent",
          "timestamp": "2023-02-16T18:44:46-06:00",
          "tree_id": "37601708490533738205a11080f39154d68dee04",
          "url": "https://github.com/AleoHQ/aleo/commit/f6d5d1b7097c2caca1c9f1767ffaf9fdd6d29db0"
        },
        "date": 1676595167485,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 238774,
            "range": "± 16866",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 95179,
            "range": "± 295",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 346534,
            "range": "± 1738",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 246091,
            "range": "± 840",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 597006,
            "range": "± 2020",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}