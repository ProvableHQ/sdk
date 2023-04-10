window.BENCHMARK_DATA = {
  "lastUpdate": 1681134801685,
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
          "id": "32511e489a9258f99758b2a740ed1a90d4b6ef01",
          "message": "[Chore] bump getrandom from 0.2.8 to 0.2.9",
          "timestamp": "2023-04-10T08:34:41-05:00",
          "tree_id": "01e37d364fff74e3910a71bed56d7d21d59422e9",
          "url": "https://github.com/AleoHQ/aleo/commit/32511e489a9258f99758b2a740ed1a90d4b6ef01"
        },
        "date": 1681134797635,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 215241,
            "range": "± 25661",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 87249,
            "range": "± 9584",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 320925,
            "range": "± 44600",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 231449,
            "range": "± 39053",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 553201,
            "range": "± 61000",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}