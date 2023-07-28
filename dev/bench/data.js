window.BENCHMARK_DATA = {
  "lastUpdate": 1690505048811,
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
          "id": "dc7c63800bf403ccfd0ccfbb8a093085041f199b",
          "message": "[Documentation] Update aleo-wasm documentation",
          "timestamp": "2023-07-27T20:32:34-04:00",
          "tree_id": "3fb213e0bdaa9ba28efab25d9e15a6e9c239ebc5",
          "url": "https://github.com/AleoHQ/sdk/commit/dc7c63800bf403ccfd0ccfbb8a093085041f199b"
        },
        "date": 1690505032669,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 207325,
            "range": "± 1294",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 89025,
            "range": "± 211",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 331791,
            "range": "± 808",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 237979,
            "range": "± 605",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 576446,
            "range": "± 7226",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}