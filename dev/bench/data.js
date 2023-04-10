window.BENCHMARK_DATA = {
  "lastUpdate": 1681140982844,
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
          "id": "bcec5acf0f48e341a8e5f97268228e3a49d89c76",
          "message": "[Chore] bump snarkvm from 0.9.14 to 0.9.15",
          "timestamp": "2023-04-10T10:16:55-05:00",
          "tree_id": "27682ecd8eb5c17a42a8ba69b9897e52a58b8095",
          "url": "https://github.com/AleoHQ/aleo/commit/bcec5acf0f48e341a8e5f97268228e3a49d89c76"
        },
        "date": 1681140979743,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 255610,
            "range": "± 5828",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 99613,
            "range": "± 2946",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 369259,
            "range": "± 12326",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 267287,
            "range": "± 7879",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 645942,
            "range": "± 23053",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}