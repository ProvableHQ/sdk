window.BENCHMARK_DATA = {
  "lastUpdate": 1681135825939,
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
          "id": "623e663308497527e3de51e28983219d0949f674",
          "message": "[Chore] build(deps): bump warp from 0.3.3 to 0.3.4",
          "timestamp": "2023-04-10T08:52:07-05:00",
          "tree_id": "e3d2ced4d128f2232494805affcd3aeb15b10d9f",
          "url": "https://github.com/AleoHQ/aleo/commit/623e663308497527e3de51e28983219d0949f674"
        },
        "date": 1681135822616,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 211137,
            "range": "± 5791",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 82555,
            "range": "± 146",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 311635,
            "range": "± 576",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 222675,
            "range": "± 743",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 543967,
            "range": "± 3624",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}