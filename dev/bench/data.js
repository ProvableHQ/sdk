window.BENCHMARK_DATA = {
  "lastUpdate": 1679448209712,
  "repoUrl": "https://github.com/AleoHQ/aleo",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "austin@aleo.org",
            "name": "a h",
            "username": "aharshbe"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b371a041b07fe23543ade4fe460d8a0d30775cfc",
          "message": "Merge pull request #511 from AleoHQ/feat/rust-sdk-documentation\n\nAdd Rust SDK Documentation",
          "timestamp": "2023-03-21T18:01:53-07:00",
          "tree_id": "f06375809bbd3bf31997e89da15575e3f6ed636c",
          "url": "https://github.com/AleoHQ/aleo/commit/b371a041b07fe23543ade4fe460d8a0d30775cfc"
        },
        "date": 1679448205884,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 253865,
            "range": "± 7773",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 102177,
            "range": "± 76558",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 365551,
            "range": "± 9579",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 259852,
            "range": "± 5384",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 636554,
            "range": "± 15820",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}