window.BENCHMARK_DATA = {
  "lastUpdate": 1676319388428,
  "repoUrl": "https://github.com/AleoHQ/aleo",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "collin@aleo.org",
            "name": "Collin Chin",
            "username": "collinc97"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "dfe52e3f62b6f750e59f65fcf2c3f425314a5355",
          "message": "bump snarkvm versions (#468)\n\n* bump snarkvm versions\r\n\r\n* snarkvm 0.9.12",
          "timestamp": "2023-02-13T12:03:13-08:00",
          "tree_id": "34ddcc9b2b6faa844eb9fb875221be3a5dbb9842",
          "url": "https://github.com/AleoHQ/aleo/commit/dfe52e3f62b6f750e59f65fcf2c3f425314a5355"
        },
        "date": 1676319384221,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 260213,
            "range": "± 31947",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 104476,
            "range": "± 18382",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 382468,
            "range": "± 64337",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 270911,
            "range": "± 34438",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 660183,
            "range": "± 154190",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}