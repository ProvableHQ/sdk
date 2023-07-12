window.BENCHMARK_DATA = {
  "lastUpdate": 1689124650707,
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
          "id": "6e1ce7588e7fe04c4b9e24fa66b1b9843c7fe903",
          "message": "[Feature] Add offline program execution",
          "timestamp": "2023-07-11T21:06:02-04:00",
          "tree_id": "de7ff68fd62f63833f24468590b83cfa7c112d06",
          "url": "https://github.com/AleoHQ/sdk/commit/6e1ce7588e7fe04c4b9e24fa66b1b9843c7fe903"
        },
        "date": 1689124636350,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 262508,
            "range": "± 22715",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 110131,
            "range": "± 16784",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 423895,
            "range": "± 60703",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 302746,
            "range": "± 30235",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 732800,
            "range": "± 164826",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}