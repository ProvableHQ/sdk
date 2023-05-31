window.BENCHMARK_DATA = {
  "lastUpdate": 1685500720033,
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
          "id": "56e7f110149b1e04d9b0f0cd81f12f4386aa1eeb",
          "message": "[Chore] Update SDK url + bump SnarkVM version to v0.11.5 (#582)\n\n* Update SDK url in internal SDK files and bump SnarkVM version to v0.11.4\r\n\r\n* Apply suggestions from code review\r\n\r\nCo-authored-by: Collin Chin <16715212+collinc97@users.noreply.github.com>\r\nSigned-off-by: Mike Turner <mturner@aleo.org>\r\n\r\n---------\r\n\r\nSigned-off-by: Mike Turner <mturner@aleo.org>\r\nCo-authored-by: Collin Chin <16715212+collinc97@users.noreply.github.com>",
          "timestamp": "2023-05-30T19:15:44-07:00",
          "tree_id": "ecdefc053ac8d370dd58e2e5101c23b988c5a501",
          "url": "https://github.com/AleoHQ/sdk/commit/56e7f110149b1e04d9b0f0cd81f12f4386aa1eeb"
        },
        "date": 1685500715786,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 243477,
            "range": "± 32692",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 100375,
            "range": "± 15521",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 357496,
            "range": "± 51242",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 254838,
            "range": "± 32447",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 632812,
            "range": "± 79504",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}