window.BENCHMARK_DATA = {
  "lastUpdate": 1677007593526,
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
          "id": "a6912699fd80b6f5d53caf315a953923239ef9b2",
          "message": "Add Message Signing/Verification & Record Verification Sample to Aleo.tools (#477)\n\n* Add message signing and record encryption/decryption to Aleo.tools\r\n\r\n* Add message signing and record encryption/decryption using a sample record to Aleo.tools\r\n\r\n* Add Alert UI elements for verification + clear state when signing message\r\n\r\n* Ensure sign & verify state clear on key change\r\n\r\n* Small formatting nit\r\n\r\n* Second small formatting nit",
          "timestamp": "2023-02-21T11:17:01-08:00",
          "tree_id": "0f09d0b6469118588629af86d45454586854f749",
          "url": "https://github.com/AleoHQ/aleo/commit/a6912699fd80b6f5d53caf315a953923239ef9b2"
        },
        "date": 1677007590209,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 248401,
            "range": "± 20120",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 96154,
            "range": "± 438",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 348322,
            "range": "± 1870",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 247169,
            "range": "± 777",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 599965,
            "range": "± 2408",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}