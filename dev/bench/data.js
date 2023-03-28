window.BENCHMARK_DATA = {
  "lastUpdate": 1679982072349,
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
          "id": "a2e0529b2ec085cd45f546ad062b3a315ae60416",
          "message": "build(deps): bump self_update from 0.35.0 to 0.36.0 (#506)\n\nBumps [self_update](https://github.com/jaemk/self_update) from 0.35.0 to 0.36.0.\r\n- [Release notes](https://github.com/jaemk/self_update/releases)\r\n- [Changelog](https://github.com/jaemk/self_update/blob/master/CHANGELOG.md)\r\n- [Commits](https://github.com/jaemk/self_update/commits)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: self_update\r\n  dependency-type: direct:production\r\n  update-type: version-update:semver-minor\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-03-27T22:21:12-07:00",
          "tree_id": "f54aff26d0cd2f87f23703c773d38422eed69687",
          "url": "https://github.com/AleoHQ/aleo/commit/a2e0529b2ec085cd45f546ad062b3a315ae60416"
        },
        "date": 1679981964291,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 239527,
            "range": "± 17974",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 95178,
            "range": "± 418",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 348619,
            "range": "± 2028",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 249079,
            "range": "± 1178",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 600973,
            "range": "± 1780",
            "unit": "ns/iter"
          }
        ]
      },
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
          "id": "e09b9398146cc1b2c9af8fd476ed660af49dc174",
          "message": "build(deps): bump walkdir from 2.3.2 to 2.3.3 (#505)\n\nBumps [walkdir](https://github.com/BurntSushi/walkdir) from 2.3.2 to 2.3.3.\r\n- [Release notes](https://github.com/BurntSushi/walkdir/releases)\r\n- [Commits](https://github.com/BurntSushi/walkdir/compare/2.3.2...2.3.3)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: walkdir\r\n  dependency-type: direct:production\r\n  update-type: version-update:semver-patch\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-03-27T22:20:57-07:00",
          "tree_id": "d51f29a481e9fc33480b0760cb6efcf5829474bb",
          "url": "https://github.com/AleoHQ/aleo/commit/e09b9398146cc1b2c9af8fd476ed660af49dc174"
        },
        "date": 1679982069256,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 252641,
            "range": "± 1782",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 101541,
            "range": "± 776",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 368950,
            "range": "± 3218",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 262138,
            "range": "± 3122",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 639280,
            "range": "± 3329",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}