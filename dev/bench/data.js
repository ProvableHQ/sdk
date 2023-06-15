window.BENCHMARK_DATA = {
  "lastUpdate": 1686842379067,
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
          "id": "bfd4b9768ac83872cd0f1c6a81cdac66a3525803",
          "message": "[chore] build(deps): bump ureq from 2.6.2 to 2.7.0",
          "timestamp": "2023-06-15T10:54:46-04:00",
          "tree_id": "406a96dbdf1dd8ac236a020bc2a05036f0dca876",
          "url": "https://github.com/AleoHQ/sdk/commit/bfd4b9768ac83872cd0f1c6a81cdac66a3525803"
        },
        "date": 1686842373756,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 232628,
            "range": "± 607",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 89511,
            "range": "± 336",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 346727,
            "range": "± 482",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 250568,
            "range": "± 1024",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 603193,
            "range": "± 2166",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}