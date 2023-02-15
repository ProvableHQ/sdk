window.BENCHMARK_DATA = {
  "lastUpdate": 1676490825819,
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
          "id": "3c94e6816ee4f501725488e957c62bc5b15c4c7f",
          "message": "Unit testing for typescript SDK in CI (#470)\n\n* Add introductory jest unit tests\r\n\r\n* Add real test vectors and increase code coverage\r\n\r\n* Get %100 codecoverage on account.ts - fix some documentation\r\n\r\n* Add test for incorrect record decryption, exlcude tests from release build, add tests to ci\r\n\r\n* Update to wasm test\r\n\r\n* Add lint",
          "timestamp": "2023-02-15T11:44:41-08:00",
          "tree_id": "4218cb08e3057880691a4e9cba178ca9277a1a73",
          "url": "https://github.com/AleoHQ/aleo/commit/3c94e6816ee4f501725488e957c62bc5b15c4c7f"
        },
        "date": 1676490822419,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 250689,
            "range": "± 6584",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 98808,
            "range": "± 4750",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 375024,
            "range": "± 8354",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 267672,
            "range": "± 8403",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 643097,
            "range": "± 27244",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}