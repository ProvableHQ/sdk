window.BENCHMARK_DATA = {
  "lastUpdate": 1689648347100,
  "repoUrl": "https://github.com/AleoHQ/sdk",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "brent@aleo.org",
            "name": "Brent C",
            "username": "onetrickwolf"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "0f9d58e599f05e97234a8a3cdc583b8ad63e388b",
          "message": "[Feature] Adding routing with react-router (#666)\n\n* react router\r\n\r\n* removing console log",
          "timestamp": "2023-07-17T22:34:51-04:00",
          "tree_id": "30ded3b6457454845eada8a1b1a0aca2a3593545",
          "url": "https://github.com/AleoHQ/sdk/commit/0f9d58e599f05e97234a8a3cdc583b8ad63e388b"
        },
        "date": 1689648330893,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 246689,
            "range": "± 45249",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 104507,
            "range": "± 25216",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 380213,
            "range": "± 52944",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 304961,
            "range": "± 99010",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 654981,
            "range": "± 66095",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}