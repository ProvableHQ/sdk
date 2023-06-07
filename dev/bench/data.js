window.BENCHMARK_DATA = {
  "lastUpdate": 1686104432835,
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
          "id": "0c14e803fe7bce814394e4747fde226ec7cd369a",
          "message": "[Feature] Web execution on aleo.tools",
          "timestamp": "2023-06-06T22:07:40-04:00",
          "tree_id": "22f60f06da755e96203043b652534b9ebb5e4d6b",
          "url": "https://github.com/AleoHQ/sdk/commit/0c14e803fe7bce814394e4747fde226ec7cd369a"
        },
        "date": 1686104426033,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 250197,
            "range": "± 1471",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 98996,
            "range": "± 332",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 352668,
            "range": "± 921",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 249827,
            "range": "± 942",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 607364,
            "range": "± 3117",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}