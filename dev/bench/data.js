window.BENCHMARK_DATA = {
  "lastUpdate": 1689820719511,
  "repoUrl": "https://github.com/AleoHQ/sdk",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "mturner@aleo.org",
            "name": "Mike Turner",
            "username": "iamalwaysuncomfortable"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "787415918526082cf647b50ee8032cc5a59ba463",
          "message": "[Feature] Add multiple transfer type options to Aleo.tools",
          "timestamp": "2023-07-19T22:25:47-04:00",
          "tree_id": "5ba9e204427c0f30f44608f5ce2ffd9228b09d16",
          "url": "https://github.com/AleoHQ/sdk/commit/787415918526082cf647b50ee8032cc5a59ba463"
        },
        "date": 1689820702536,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 207606,
            "range": "± 1561",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 88945,
            "range": "± 416",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 330960,
            "range": "± 670",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 238085,
            "range": "± 671",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 574992,
            "range": "± 3030",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}