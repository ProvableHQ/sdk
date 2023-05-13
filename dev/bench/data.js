window.BENCHMARK_DATA = {
  "lastUpdate": 1683940838022,
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
          "id": "5c253390c7f77640f8d757be6d1924f52940e375",
          "message": "build(deps): bump warp from 0.3.4 to 0.3.5",
          "timestamp": "2023-05-12T19:57:25-05:00",
          "tree_id": "f4909d6914672d1cdd0f52d0781fe6ef3e77a317",
          "url": "https://github.com/AleoHQ/aleo/commit/5c253390c7f77640f8d757be6d1924f52940e375"
        },
        "date": 1683940833027,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 252185,
            "range": "± 34848",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 96597,
            "range": "± 255",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 353408,
            "range": "± 692",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 250678,
            "range": "± 1291",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 610358,
            "range": "± 1631",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}