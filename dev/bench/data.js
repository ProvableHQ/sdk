window.BENCHMARK_DATA = {
  "lastUpdate": 1678325073533,
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
          "id": "e3ca5814decb46e926dc33ccffe4e162bd1e6182",
          "message": "[Feature] Rust SDK - Transfer",
          "timestamp": "2023-03-08T19:14:03-06:00",
          "tree_id": "2bcb8ef2e31a378d45918523c3868d15afe007f7",
          "url": "https://github.com/AleoHQ/aleo/commit/e3ca5814decb46e926dc33ccffe4e162bd1e6182"
        },
        "date": 1678325070338,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 248569,
            "range": "± 21040",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 95860,
            "range": "± 450",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 348427,
            "range": "± 2605",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 255629,
            "range": "± 11564",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 600339,
            "range": "± 1633",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}