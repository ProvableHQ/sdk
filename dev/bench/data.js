window.BENCHMARK_DATA = {
  "lastUpdate": 1678153304556,
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
          "id": "3eaddc48a5e6abd2cbb208ba2659fec56316ed19",
          "message": "add public assets to dist/ folder upon build, fix header ui bug (#484)\n\n* add public assets to dist/ folder upon build, fix header ui bug\r\n\r\n* remove unused Divider",
          "timestamp": "2023-03-06T17:31:36-08:00",
          "tree_id": "14d39956c78ddf3a5d30d91a2cf522c1ec68bdde",
          "url": "https://github.com/AleoHQ/aleo/commit/3eaddc48a5e6abd2cbb208ba2659fec56316ed19"
        },
        "date": 1678153300804,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 274801,
            "range": "± 54641",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 111079,
            "range": "± 19624",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 402459,
            "range": "± 79968",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 285547,
            "range": "± 43527",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 692389,
            "range": "± 57408",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}