window.BENCHMARK_DATA = {
  "lastUpdate": 1670889129408,
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
          "id": "13c3e2dfb27040a6ce4b366d00d82788ec6a99b5",
          "message": "Feature - log program metrics (#433)\n\n* wip output metrics from package run\r\n\r\n* improve constraint formatting and function counter\r\n\r\n* clippy\r\n\r\n* update snarkvm tag v0.9.11",
          "timestamp": "2022-12-12T18:38:57-05:00",
          "tree_id": "c1c11e4a328a183b096937f54e281708a287b03c",
          "url": "https://github.com/AleoHQ/aleo/commit/13c3e2dfb27040a6ce4b366d00d82788ec6a99b5"
        },
        "date": 1670889125449,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 258985,
            "range": "± 792",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101864,
            "range": "± 753",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}