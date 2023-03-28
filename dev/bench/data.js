window.BENCHMARK_DATA = {
  "lastUpdate": 1679968672362,
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
          "id": "7583b8b272a167fb3851f035958a143c37fcddfa",
          "message": "Merge pull request #515 from AleoHQ/fixing_broken_repo_links\n\nUpdate README.md",
          "timestamp": "2023-03-27T18:39:56-07:00",
          "tree_id": "1f4eea5444c664c3d90b907434903d3f5b799185",
          "url": "https://github.com/AleoHQ/aleo/commit/7583b8b272a167fb3851f035958a143c37fcddfa"
        },
        "date": 1679968669184,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 212984,
            "range": "± 3991",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 84502,
            "range": "± 372",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 307033,
            "range": "± 3375",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 217990,
            "range": "± 231",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 534040,
            "range": "± 3106",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}