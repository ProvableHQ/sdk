window.BENCHMARK_DATA = {
  "lastUpdate": 1677019928336,
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
          "id": "73afaf71fa9df5922a7eb456394660cb0c22fc55",
          "message": "Add GetLatestBlock, GetLatestBlockHeight, GetProgram, and Get Transaction Endpoints (#478)\n\nCo-authored-by: collin <16715212+collinc97@users.noreply.github.com>",
          "timestamp": "2023-02-21T14:42:23-08:00",
          "tree_id": "2316e5e6233bc31e61f1a07d189e47fb11432090",
          "url": "https://github.com/AleoHQ/aleo/commit/73afaf71fa9df5922a7eb456394660cb0c22fc55"
        },
        "date": 1677019925102,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 262158,
            "range": "± 11304",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 99762,
            "range": "± 2695",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 352755,
            "range": "± 26890",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 251241,
            "range": "± 19217",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 614949,
            "range": "± 73732",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}