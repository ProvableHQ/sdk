window.BENCHMARK_DATA = {
  "lastUpdate": 1685759854774,
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
          "id": "9b3bcccdae3695b0625f1ef76dd0ee1712dcb8af",
          "message": "[Feature] Program Execution in Webassembly\n\nAdd the ability to deploy and execute programs in WebAssembly",
          "timestamp": "2023-06-02T22:12:01-04:00",
          "tree_id": "dcf021109cd37791c8c3e929f53d0142f800aff4",
          "url": "https://github.com/AleoHQ/sdk/commit/9b3bcccdae3695b0625f1ef76dd0ee1712dcb8af"
        },
        "date": 1685759850542,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 251264,
            "range": "± 4395",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 98281,
            "range": "± 458",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 354028,
            "range": "± 762",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 250666,
            "range": "± 1156",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 608739,
            "range": "± 3213",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}