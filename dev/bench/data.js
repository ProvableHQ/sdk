window.BENCHMARK_DATA = {
  "lastUpdate": 1682687659623,
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
          "id": "c02824f29fbacfdd403e176bfc2f888dd894dbd5",
          "message": "chore(sdk): bump snarkvm-wasm from 0.10.2 to 0.10.3",
          "timestamp": "2023-04-28T07:55:53-05:00",
          "tree_id": "5cbd88351ac71dcacb977c81825e4c9762e6ebfa",
          "url": "https://github.com/AleoHQ/aleo/commit/c02824f29fbacfdd403e176bfc2f888dd894dbd5"
        },
        "date": 1682687655891,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 224022,
            "range": "± 37972",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 82491,
            "range": "± 13021",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 306452,
            "range": "± 45936",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 230466,
            "range": "± 41145",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 540679,
            "range": "± 68300",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}