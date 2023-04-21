window.BENCHMARK_DATA = {
  "lastUpdate": 1682115974672,
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
          "id": "cbdd711f30e62e99a13923263601cbc7d55c5c5b",
          "message": "[Fix] Bump SnarkVM dependencies to 0.10.2 and update SDK",
          "timestamp": "2023-04-21T17:08:11-05:00",
          "tree_id": "8dd2673077daa7139150fc4cd76d8df932c945c3",
          "url": "https://github.com/AleoHQ/aleo/commit/cbdd711f30e62e99a13923263601cbc7d55c5c5b"
        },
        "date": 1682115971572,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 223593,
            "range": "± 3167",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 82913,
            "range": "± 200",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 312322,
            "range": "± 904",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 222498,
            "range": "± 334",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 543428,
            "range": "± 5461",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}