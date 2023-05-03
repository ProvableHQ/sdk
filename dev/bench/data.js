window.BENCHMARK_DATA = {
  "lastUpdate": 1683156192411,
  "repoUrl": "https://github.com/AleoHQ/aleo",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "49699333+dependabot[bot]@users.noreply.github.com",
            "name": "dependabot[bot]",
            "username": "dependabot[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "c4fa3baa635291126fc5221ed7d77e7df1972618",
          "message": "build(deps): bump reqwest from 0.11.16 to 0.11.17 (#556)\n\nBumps [reqwest](https://github.com/seanmonstar/reqwest) from 0.11.16 to 0.11.17.\r\n- [Release notes](https://github.com/seanmonstar/reqwest/releases)\r\n- [Changelog](https://github.com/seanmonstar/reqwest/blob/master/CHANGELOG.md)\r\n- [Commits](https://github.com/seanmonstar/reqwest/compare/v0.11.16...v0.11.17)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: reqwest\r\n  dependency-type: direct:production\r\n  update-type: version-update:semver-patch\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-05-03T16:04:36-07:00",
          "tree_id": "f0061318183472924f5260e09af432f4f6d20c3a",
          "url": "https://github.com/AleoHQ/aleo/commit/c4fa3baa635291126fc5221ed7d77e7df1972618"
        },
        "date": 1683156188185,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 240313,
            "range": "± 19679",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 96633,
            "range": "± 351",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 347332,
            "range": "± 1650",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 246273,
            "range": "± 896",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 597962,
            "range": "± 1970",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}