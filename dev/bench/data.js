window.BENCHMARK_DATA = {
  "lastUpdate": 1689097486857,
  "repoUrl": "https://github.com/AleoHQ/sdk",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "16715212+collinc97@users.noreply.github.com",
            "name": "Collin Chin",
            "username": "collinc97"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8cec3d2223c9cc19a625e6ac13cdb8e9b0154bb3",
          "message": "Update contributors README (#654)\n\n* remove .all-contributorsrc file, add contributor details to README\r\n\r\n* Update README.md\r\n\r\nCo-authored-by: Brent C <brent@aleo.org>\r\nSigned-off-by: Collin Chin <16715212+collinc97@users.noreply.github.com>\r\n\r\n---------\r\n\r\nSigned-off-by: Collin Chin <16715212+collinc97@users.noreply.github.com>\r\nCo-authored-by: Brent C <brent@aleo.org>",
          "timestamp": "2023-07-11T10:33:52-07:00",
          "tree_id": "1c82bc02841c958c5090ea221984650560b2f92a",
          "url": "https://github.com/AleoHQ/sdk/commit/8cec3d2223c9cc19a625e6ac13cdb8e9b0154bb3"
        },
        "date": 1689097471473,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 225513,
            "range": "± 1919",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 98798,
            "range": "± 489",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 352734,
            "range": "± 991",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 249624,
            "range": "± 1098",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 606696,
            "range": "± 2866",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}