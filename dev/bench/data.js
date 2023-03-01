window.BENCHMARK_DATA = {
  "lastUpdate": 1677686703361,
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
          "id": "2aec5aa5346b3b18c10928836a265843df027826",
          "message": "Improve rest api call ui (#482)\n\n* use search bar for get program id\r\n\r\n* add form status validation to all rest api endpoints\r\n\r\n* show REST api call success and fail in website UI",
          "timestamp": "2023-03-01T07:56:53-08:00",
          "tree_id": "55c4286aba613cec2ae918a317f9c8f84ef5dcd3",
          "url": "https://github.com/AleoHQ/aleo/commit/2aec5aa5346b3b18c10928836a265843df027826"
        },
        "date": 1677686699850,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 223957,
            "range": "± 4171",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 82914,
            "range": "± 250",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 307321,
            "range": "± 777",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 218052,
            "range": "± 221",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 536526,
            "range": "± 3632",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}