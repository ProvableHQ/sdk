window.BENCHMARK_DATA = {
  "lastUpdate": 1684889574302,
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
          "id": "5f7c51459d8248ac2617747db5cbbe3046ee2c75",
          "message": "[fix] Remove duplicate syntax support for sublime text",
          "timestamp": "2023-05-23T19:38:57-05:00",
          "tree_id": "db4b4e98e46983f0de3a6050f131dcf8934f9aab",
          "url": "https://github.com/AleoHQ/sdk/commit/5f7c51459d8248ac2617747db5cbbe3046ee2c75"
        },
        "date": 1684889569675,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 235929,
            "range": "± 28979",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 94326,
            "range": "± 12073",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 375643,
            "range": "± 52147",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 253168,
            "range": "± 28541",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 617423,
            "range": "± 85983",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}