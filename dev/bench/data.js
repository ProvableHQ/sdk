window.BENCHMARK_DATA = {
  "lastUpdate": 1686679650941,
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
          "id": "0650454f7e9ff03a2fcaba0fe1a56204abddd879",
          "message": "[Fix] Fix string encoding for messaging signing & verification on aleo.tools",
          "timestamp": "2023-06-13T13:56:28-04:00",
          "tree_id": "9b17fc3aff85d9454f80655ff9c13c81895a048f",
          "url": "https://github.com/AleoHQ/sdk/commit/0650454f7e9ff03a2fcaba0fe1a56204abddd879"
        },
        "date": 1686679644873,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 279946,
            "range": "± 27661",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 105940,
            "range": "± 3873",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 397747,
            "range": "± 35617",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 282144,
            "range": "± 20384",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 684704,
            "range": "± 127078",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}