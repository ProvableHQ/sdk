window.BENCHMARK_DATA = {
  "lastUpdate": 1676657352357,
  "repoUrl": "https://github.com/AleoHQ/aleo",
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
          "id": "4e1a22fca729c22be174756718758a09c38695b6",
          "message": "Use non-wasm snarkvm console structs in aleo rust sdk",
          "timestamp": "2023-02-17T11:57:48-06:00",
          "tree_id": "4e9f565689267601052b43ff86a9efc127b4e112",
          "url": "https://github.com/AleoHQ/aleo/commit/4e1a22fca729c22be174756718758a09c38695b6"
        },
        "date": 1676657348419,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 248966,
            "range": "± 17329",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 95838,
            "range": "± 8594",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 348453,
            "range": "± 1658",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 247480,
            "range": "± 847",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 600286,
            "range": "± 1654",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}