window.BENCHMARK_DATA = {
  "lastUpdate": 1676421296387,
  "repoUrl": "https://github.com/AleoHQ/aleo",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "collin@aleo.org",
            "name": "Collin Chin",
            "username": "collinc97"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "affa9fa54b7d55812040d81d189e8330f0b5177f",
          "message": "Bump crate versions for sdk release 0.3.4 (#471)\n\n* chore(aleo): bump version for new release\r\n\r\n* set snarkvm-wasm feature flags in workspace dependencies",
          "timestamp": "2023-02-14T16:23:55-08:00",
          "tree_id": "7c423555272052a37e1b60d778fe07b66cb4ec2a",
          "url": "https://github.com/AleoHQ/aleo/commit/affa9fa54b7d55812040d81d189e8330f0b5177f"
        },
        "date": 1676421292463,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 227985,
            "range": "± 35211",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 85960,
            "range": "± 17031",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 303007,
            "range": "± 48172",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 219582,
            "range": "± 39404",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 575953,
            "range": "± 58236",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}