window.BENCHMARK_DATA = {
  "lastUpdate": 1684964675039,
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
          "id": "df98f25db46fb150a0ace39957084ee89f2fe8ce",
          "message": "Release 0.4.2 (#574)\n\n* Bump SDK versions\r\n\r\n* Cargo.lock",
          "timestamp": "2023-05-24T14:23:33-07:00",
          "tree_id": "6704c98f71f6b7d3c83f6b6b28c5e453f71d2f49",
          "url": "https://github.com/AleoHQ/sdk/commit/df98f25db46fb150a0ace39957084ee89f2fe8ce"
        },
        "date": 1684964670908,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 210877,
            "range": "± 2778",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 81207,
            "range": "± 151",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 294791,
            "range": "± 1233",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 209355,
            "range": "± 208",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 511554,
            "range": "± 2704",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}