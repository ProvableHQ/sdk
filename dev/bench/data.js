window.BENCHMARK_DATA = {
  "lastUpdate": 1689608535543,
  "repoUrl": "https://github.com/AleoHQ/sdk",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "16715212+collinc97@users.noreply.github.com",
            "name": "Collin Chin",
            "username": "collinc97"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d36a92fdcb7dde2f3aa1842b984c5a1c2fa51ea7",
          "message": "implement view key to address on aleo.tools (#658)",
          "timestamp": "2023-07-17T08:26:31-07:00",
          "tree_id": "be1382e18530296bb37bf0a911d9f3a13ec8083d",
          "url": "https://github.com/AleoHQ/sdk/commit/d36a92fdcb7dde2f3aa1842b984c5a1c2fa51ea7"
        },
        "date": 1689608520887,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 258832,
            "range": "± 42526",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 112052,
            "range": "± 13881",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 412510,
            "range": "± 56567",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 296697,
            "range": "± 37687",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 728574,
            "range": "± 80908",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}