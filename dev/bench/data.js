window.BENCHMARK_DATA = {
  "lastUpdate": 1690474276801,
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
          "id": "e044bf36e24f57dab739b739d3f18a527278b7c9",
          "message": "[chore] bump serde from 1.0.175 to 1.0.176",
          "timestamp": "2023-07-27T11:52:08-04:00",
          "tree_id": "53eeb689fd9d01c44019b2a12aa8bd86a4e664b6",
          "url": "https://github.com/AleoHQ/sdk/commit/e044bf36e24f57dab739b739d3f18a527278b7c9"
        },
        "date": 1690474224694,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 269014,
            "range": "± 49399",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 115767,
            "range": "± 21939",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 411742,
            "range": "± 67174",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 303477,
            "range": "± 62006",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 728317,
            "range": "± 98375",
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
          "id": "2457570d9db44042ed91f785d62dde7bb241a19c",
          "message": "[Feature] Enumerate registers for top level inputs & parameter names for nested structs",
          "timestamp": "2023-07-27T11:54:07-04:00",
          "tree_id": "2e24586b4cfef92f434301c8ecdd984ddf0b9de3",
          "url": "https://github.com/AleoHQ/sdk/commit/2457570d9db44042ed91f785d62dde7bb241a19c"
        },
        "date": 1690474260684,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 207867,
            "range": "± 474",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 90362,
            "range": "± 224",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 333583,
            "range": "± 712",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 238940,
            "range": "± 648",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 578313,
            "range": "± 9198",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}