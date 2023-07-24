window.BENCHMARK_DATA = {
  "lastUpdate": 1690221813289,
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
          "id": "6135e0cc5cb584ebe08511f457c777a01dd186fd",
          "message": "[chore] bump serde from 1.0.174 to 1.0.175",
          "timestamp": "2023-07-24T13:44:59-04:00",
          "tree_id": "8b438e0301f10ab8290ae38fcb1e44e8808399ad",
          "url": "https://github.com/AleoHQ/sdk/commit/6135e0cc5cb584ebe08511f457c777a01dd186fd"
        },
        "date": 1690221648947,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 226098,
            "range": "± 935",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101257,
            "range": "± 1415",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 373432,
            "range": "± 524",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 267361,
            "range": "± 491",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 645406,
            "range": "± 1844",
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
          "id": "e9a526e8921efbcd5a9e92975b41f350df1c0e45",
          "message": "[chore] bump clap from 4.3.17 to 4.3.19",
          "timestamp": "2023-07-24T13:44:17-04:00",
          "tree_id": "5b0327925385bdf45899b1ac93200d3222f5fc99",
          "url": "https://github.com/AleoHQ/sdk/commit/e9a526e8921efbcd5a9e92975b41f350df1c0e45"
        },
        "date": 1690221798752,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 248959,
            "range": "± 634",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 107927,
            "range": "± 240",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 399902,
            "range": "± 2818",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 287244,
            "range": "± 899",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 693892,
            "range": "± 2528",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}