window.BENCHMARK_DATA = {
  "lastUpdate": 1689780908646,
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
          "id": "a17ff66cec4a219bb3245ca038f7798a3dc7612d",
          "message": "[chore] bump clap from 4.3.12 to 4.3.16",
          "timestamp": "2023-07-19T11:15:29-04:00",
          "tree_id": "caf41b3b063ad43abba7bc695f0e46b4898bc507",
          "url": "https://github.com/AleoHQ/sdk/commit/a17ff66cec4a219bb3245ca038f7798a3dc7612d"
        },
        "date": 1689780890558,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 258596,
            "range": "± 29852",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 109667,
            "range": "± 27778",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 414583,
            "range": "± 30074",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 298523,
            "range": "± 33079",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 719618,
            "range": "± 121369",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}