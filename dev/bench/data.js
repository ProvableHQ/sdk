window.BENCHMARK_DATA = {
  "lastUpdate": 1682543701790,
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
          "id": "fc3a0071ef1e12cd2e31d912a3f47570211676f7",
          "message": "chrore(sdk): bump clap from 3.2.23 to 3.2.24\n\nchrore(sdk): bump clap from 3.2.23 to 3.2.24",
          "timestamp": "2023-04-26T15:56:15-05:00",
          "tree_id": "2195128af8deb6b3d90eb7c315a5ea62c0ee69fd",
          "url": "https://github.com/AleoHQ/aleo/commit/fc3a0071ef1e12cd2e31d912a3f47570211676f7"
        },
        "date": 1682543698581,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 222213,
            "range": "± 390",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 84246,
            "range": "± 666",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 304618,
            "range": "± 438",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 217138,
            "range": "± 302",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 529282,
            "range": "± 3545",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}