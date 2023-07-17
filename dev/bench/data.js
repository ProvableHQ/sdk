window.BENCHMARK_DATA = {
  "lastUpdate": 1689612520711,
  "repoUrl": "https://github.com/AleoHQ/sdk",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "brent@aleo.org",
            "name": "Brent C",
            "username": "onetrickwolf"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "727ab2732b9ee205dd594a9077d64d95a087af4a",
          "message": "[Chore] aleo.tools prettier and eslint fixes (#664)\n\n* prettier installation and run\r\n\r\n* eslint fixes\r\n\r\n* adding lint to ci checks\r\n\r\n* fixing new prettier issues, removing cicd check until we can address errors\r\n\r\n* pretty new files",
          "timestamp": "2023-07-17T12:40:28-04:00",
          "tree_id": "41f44cbe2558695df4333721e7a5521cb5f41efa",
          "url": "https://github.com/AleoHQ/sdk/commit/727ab2732b9ee205dd594a9077d64d95a087af4a"
        },
        "date": 1689612505909,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 252801,
            "range": "± 12944",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 106884,
            "range": "± 6326",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 398274,
            "range": "± 21366",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 284551,
            "range": "± 6513",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 688051,
            "range": "± 35244",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}