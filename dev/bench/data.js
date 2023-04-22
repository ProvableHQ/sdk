window.BENCHMARK_DATA = {
  "lastUpdate": 1682144996063,
  "repoUrl": "https://github.com/AleoHQ/aleo",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "16715212+collinc97@users.noreply.github.com",
            "name": "collin",
            "username": "collinc97"
          },
          "committer": {
            "email": "16715212+collinc97@users.noreply.github.com",
            "name": "collin",
            "username": "collinc97"
          },
          "distinct": true,
          "id": "d56d1e3930db809524c4d28dc6655e01895ae003",
          "message": "update @aleohq/sdk",
          "timestamp": "2023-04-21T23:23:44-07:00",
          "tree_id": "85969b795b503b02d907b644694a34d3fd4ff4c6",
          "url": "https://github.com/AleoHQ/aleo/commit/d56d1e3930db809524c4d28dc6655e01895ae003"
        },
        "date": 1682144992940,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 221469,
            "range": "± 348",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 83881,
            "range": "± 253",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 306255,
            "range": "± 740",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 218131,
            "range": "± 710",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 532869,
            "range": "± 3247",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}