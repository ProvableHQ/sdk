window.BENCHMARK_DATA = {
  "lastUpdate": 1675754399898,
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
          "id": "fbd1b92a442b9334ea8d2b3b62390411ecc817c4",
          "message": "Fix benchmark CI tests (#466)\n\n* Add benchmarks for private key generation and encryption/decryption\r\n\r\n* Add benchmark files\r\n\r\n---------\r\n\r\nCo-authored-by: Michael Turner <privacydaddy@Michaels-MacBook-Pro.local>",
          "timestamp": "2023-02-06T23:08:59-08:00",
          "tree_id": "6fd2b837d3d275d5591242d494e25a0d6e8845d4",
          "url": "https://github.com/AleoHQ/aleo/commit/fbd1b92a442b9334ea8d2b3b62390411ecc817c4"
        },
        "date": 1675754396908,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 240624,
            "range": "± 20484",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 95026,
            "range": "± 373",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 346991,
            "range": "± 3066",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 246501,
            "range": "± 1322",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 598533,
            "range": "± 2271",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}