window.BENCHMARK_DATA = {
  "lastUpdate": 1679014165525,
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
          "id": "360da1ebf66baf98ba2d0702fdb58447a0050bb6",
          "message": "[Fix] Fix benchmark CI test",
          "timestamp": "2023-03-16T19:35:08-05:00",
          "tree_id": "7d7a07d8d0d334f6c25a42a2d3841453fecf873f",
          "url": "https://github.com/AleoHQ/aleo/commit/360da1ebf66baf98ba2d0702fdb58447a0050bb6"
        },
        "date": 1679014162718,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 210627,
            "range": "± 5456",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 82516,
            "range": "± 329",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 311760,
            "range": "± 862",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 223004,
            "range": "± 276",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 544045,
            "range": "± 3656",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}