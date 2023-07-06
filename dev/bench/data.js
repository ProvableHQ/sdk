window.BENCHMARK_DATA = {
  "lastUpdate": 1688641277767,
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
      },
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
          "id": "b9f90a6cd63022150f21b32a4e52ad6d247900fa",
          "message": "[chore] build(deps): bump colored from 2.0.3 to 2.0.4",
          "timestamp": "2023-07-06T06:40:40-04:00",
          "tree_id": "f97fb2d536160d414fe72f24e8a4c8fc3e48ecb8",
          "url": "https://github.com/AleoHQ/sdk/commit/b9f90a6cd63022150f21b32a4e52ad6d247900fa"
        },
        "date": 1688641265626,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 266876,
            "range": "± 48984",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 109359,
            "range": "± 11311",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 420204,
            "range": "± 49280",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 297981,
            "range": "± 48163",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 716382,
            "range": "± 66963",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}