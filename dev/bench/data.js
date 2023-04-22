window.BENCHMARK_DATA = {
  "lastUpdate": 1682128318225,
  "repoUrl": "https://github.com/AleoHQ/aleo",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "16715212+collinc97@users.noreply.github.com",
            "name": "collin",
            "username": "collinc97"
          },
          "committer": {
            "email": "16715212+collinc97@users.noreply.github.com",
            "name": "collin",
            "username": "collinc97"
          },
          "distinct": true,
          "id": "ae83c75ca9f870408f0452810eb984412d8c75b2",
          "message": "chore(aleo): bump version for new release",
          "timestamp": "2023-04-21T18:27:16-07:00",
          "tree_id": "bda51d9914a2c1eb509429aa5b8463e0c6851cb0",
          "url": "https://github.com/AleoHQ/aleo/commit/ae83c75ca9f870408f0452810eb984412d8c75b2"
        },
        "date": 1682127946826,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 221497,
            "range": "± 845",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 83865,
            "range": "± 275",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 305049,
            "range": "± 516",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 217217,
            "range": "± 191",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 530505,
            "range": "± 2581",
            "unit": "ns/iter"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "16715212+collinc97@users.noreply.github.com",
            "name": "collin",
            "username": "collinc97"
          },
          "committer": {
            "email": "16715212+collinc97@users.noreply.github.com",
            "name": "collin",
            "username": "collinc97"
          },
          "distinct": true,
          "id": "5de9007163e7465e14ae49f971f8cefa988e17c8",
          "message": "update release-version=v0.4.0",
          "timestamp": "2023-04-21T18:36:38-07:00",
          "tree_id": "33ba411c50cc113938a86e2ba11d2d73cff6a77e",
          "url": "https://github.com/AleoHQ/aleo/commit/5de9007163e7465e14ae49f971f8cefa988e17c8"
        },
        "date": 1682128314797,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 248688,
            "range": "± 16477",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 95912,
            "range": "± 354",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 348983,
            "range": "± 1651",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 247013,
            "range": "± 654",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 600395,
            "range": "± 1638",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}