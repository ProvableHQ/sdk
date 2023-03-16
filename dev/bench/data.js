window.BENCHMARK_DATA = {
  "lastUpdate": 1678987560497,
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
          "id": "89e1c3885fdc0a316242860db193e1e7d40882a1",
          "message": "Fix benchmark ci test\n\nSigned-off-by: Mike Turner <mturner@aleo.org>",
          "timestamp": "2023-03-16T12:08:29-05:00",
          "tree_id": "1b029ff2efcb28128d2ec04ad45b43fd473c26ba",
          "url": "https://github.com/AleoHQ/aleo/commit/89e1c3885fdc0a316242860db193e1e7d40882a1"
        },
        "date": 1678987556492,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 270498,
            "range": "± 30016",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 115777,
            "range": "± 12551",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 424370,
            "range": "± 90699",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 297397,
            "range": "± 24762",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 713470,
            "range": "± 103720",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}