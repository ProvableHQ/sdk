window.BENCHMARK_DATA = {
  "lastUpdate": 1691505149674,
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
          "id": "692fe7ddbee5b95eb61f8a57667f41155e1f2547",
          "message": "Small script to ensure snippets folder gets added (#708)",
          "timestamp": "2023-08-08T10:20:50-04:00",
          "tree_id": "b25b00fd34b9a3bcd251f38285c086d12e349efb",
          "url": "https://github.com/AleoHQ/sdk/commit/692fe7ddbee5b95eb61f8a57667f41155e1f2547"
        },
        "date": 1691505130018,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 249556,
            "range": "± 2223",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 106852,
            "range": "± 1421",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 396975,
            "range": "± 1055",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 285616,
            "range": "± 905",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 690348,
            "range": "± 3180",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}