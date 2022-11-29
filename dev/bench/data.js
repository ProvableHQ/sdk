window.BENCHMARK_DATA = {
  "lastUpdate": 1669690876977,
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
          "id": "a69d2f3914c2655b888691e1a1eee5daddfc43ab",
          "message": "Run: cd website/ && yarn build (#423)\n\n* run: cd website/ && yarn build\r\n\r\n* add test-website action\r\n\r\n* check deployment-status\r\n\r\n* bump pages deploy action v4\r\n\r\n* update production deploy check\r\n\r\n* add **/dist to gitignore\r\n\r\n* skip false positives",
          "timestamp": "2022-11-28T18:54:03-08:00",
          "tree_id": "ad4ef749662bba5fb3021a2740a3d456f04287ae",
          "url": "https://github.com/AleoHQ/aleo/commit/a69d2f3914c2655b888691e1a1eee5daddfc43ab"
        },
        "date": 1669690874038,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 223624,
            "range": "± 1688",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 83651,
            "range": "± 340",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}