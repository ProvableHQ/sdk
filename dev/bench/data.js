window.BENCHMARK_DATA = {
  "lastUpdate": 1676328754478,
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
          "id": "69ca7c11dc57628242755c2fb510a4a6659958e0",
          "message": "bump rust editions to 2021 (#469)",
          "timestamp": "2023-02-13T14:45:27-08:00",
          "tree_id": "d0d307b270ed2497a2184d860f900498021ba891",
          "url": "https://github.com/AleoHQ/aleo/commit/69ca7c11dc57628242755c2fb510a4a6659958e0"
        },
        "date": 1676328750565,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 238062,
            "range": "± 42760",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 99948,
            "range": "± 11577",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 350977,
            "range": "± 73188",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 254476,
            "range": "± 46820",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 623181,
            "range": "± 110361",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}