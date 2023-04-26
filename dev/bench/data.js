window.BENCHMARK_DATA = {
  "lastUpdate": 1682540960620,
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
          "id": "5da8a0cf861e83729e8bf9e08969c82c89c1f5d3",
          "message": "Merge pull request #547 from AleoHQ/dependabot/cargo/tokio-1.28.0\n\nbuild(deps): bump tokio from 1.27.0 to 1.28.0",
          "timestamp": "2023-04-26T15:10:34-05:00",
          "tree_id": "edde4b47ddef778eee0118d2f762c08448f8f20b",
          "url": "https://github.com/AleoHQ/aleo/commit/5da8a0cf861e83729e8bf9e08969c82c89c1f5d3"
        },
        "date": 1682540939825,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 221117,
            "range": "± 466",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 82902,
            "range": "± 56",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 307567,
            "range": "± 630",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 218567,
            "range": "± 239",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 533864,
            "range": "± 3114",
            "unit": "ns/iter"
          }
        ]
      },
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
          "id": "e01191d9cd887d864270714e2b89a1cce7beaa94",
          "message": "chore(sdk): bump tracing from 0.1.37 to 0.1.38",
          "timestamp": "2023-04-26T15:07:41-05:00",
          "tree_id": "fe26c4e39f871b727e05676ba94a046ca660c807",
          "url": "https://github.com/AleoHQ/aleo/commit/e01191d9cd887d864270714e2b89a1cce7beaa94"
        },
        "date": 1682540956417,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 257997,
            "range": "± 21484",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 98704,
            "range": "± 4469",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 360187,
            "range": "± 28032",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 262431,
            "range": "± 7351",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 635142,
            "range": "± 18713",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}