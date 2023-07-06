window.BENCHMARK_DATA = {
  "lastUpdate": 1688641088143,
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
          "id": "719e5e284b7e29c703c853dc4ff0a39186caa7e1",
          "message": "[chore] build(deps): bump clap from 4.3.10 to 4.3.11",
          "timestamp": "2023-07-06T06:41:28-04:00",
          "tree_id": "e54c1b91dbdce818daca080e96b3ae6b96936973",
          "url": "https://github.com/AleoHQ/sdk/commit/719e5e284b7e29c703c853dc4ff0a39186caa7e1"
        },
        "date": 1688641077378,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 225925,
            "range": "± 2243",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 98512,
            "range": "± 6789",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 354507,
            "range": "± 809",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 249784,
            "range": "± 939",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 607922,
            "range": "± 3285",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}