window.BENCHMARK_DATA = {
  "lastUpdate": 1681138006438,
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
          "id": "8325afe02291085123597ed0d2a2a5ec680b2e48",
          "message": "[Chore] build(deps): bump snarkvm-console from 0.9.14 to 0.9.15",
          "timestamp": "2023-04-10T09:27:34-05:00",
          "tree_id": "07a12183107aa139fca0ef628dc58aa856984819",
          "url": "https://github.com/AleoHQ/aleo/commit/8325afe02291085123597ed0d2a2a5ec680b2e48"
        },
        "date": 1681138003255,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 208092,
            "range": "± 3003",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 81973,
            "range": "± 83",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 306102,
            "range": "± 810",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 218179,
            "range": "± 388",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 531327,
            "range": "± 2983",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}