window.BENCHMARK_DATA = {
  "lastUpdate": 1677290547082,
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
          "id": "b66d73cb2ce151195f4e98ee7e1f8bed26b498a9",
          "message": "Improve aleo.tools website UI (#480)\n\n* improve accounts and record decryption ui\r\n\r\n* add demo buttons to populate test data\r\n\r\n* push wip state\r\n\r\n* fix verification ui\r\n\r\n* improve accoun decryption\r\n\r\n* update record decrypt ui\r\n\r\n* fix rest api formatting and copy buttons",
          "timestamp": "2023-02-24T17:54:42-08:00",
          "tree_id": "8f4649ed3a2bdff7f43e2ce5e7623ac35a4bcb46",
          "url": "https://github.com/AleoHQ/aleo/commit/b66d73cb2ce151195f4e98ee7e1f8bed26b498a9"
        },
        "date": 1677290544176,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 223758,
            "range": "± 3328",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 85007,
            "range": "± 107",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 306085,
            "range": "± 559",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 217429,
            "range": "± 329",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 532738,
            "range": "± 2985",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}