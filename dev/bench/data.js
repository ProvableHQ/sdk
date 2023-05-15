window.BENCHMARK_DATA = {
  "lastUpdate": 1684167830892,
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
          "id": "a59e01828e35c75381de27ea407d2852dd1844b1",
          "message": "[Chore] Bump SnarkVM dependencies to 0.11.2",
          "timestamp": "2023-05-15T10:59:32-05:00",
          "tree_id": "52eccce785e3096e9f695137db9a711242a5792d",
          "url": "https://github.com/AleoHQ/aleo/commit/a59e01828e35c75381de27ea407d2852dd1844b1"
        },
        "date": 1684167826743,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 258642,
            "range": "± 49993",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 106064,
            "range": "± 23351",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 361842,
            "range": "± 70412",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 253113,
            "range": "± 27415",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 648828,
            "range": "± 148105",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}