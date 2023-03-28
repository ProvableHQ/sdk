window.BENCHMARK_DATA = {
  "lastUpdate": 1680034598467,
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
          "id": "d5949bdcf706c41fcf0588005bd340b3cea34291",
          "message": "build(deps): bump indexmap from 1.9.2 to 1.9.3 (#514)\n\nBumps [indexmap](https://github.com/bluss/indexmap) from 1.9.2 to 1.9.3.\r\n- [Release notes](https://github.com/bluss/indexmap/releases)\r\n- [Changelog](https://github.com/bluss/indexmap/blob/master/RELEASES.md)\r\n- [Commits](https://github.com/bluss/indexmap/compare/1.9.2...1.9.3)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: indexmap\r\n  dependency-type: direct:production\r\n  update-type: version-update:semver-patch\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-03-28T12:58:30-07:00",
          "tree_id": "e60c8f183a532d7588ddb5c98bff6b383292fe61",
          "url": "https://github.com/AleoHQ/aleo/commit/d5949bdcf706c41fcf0588005bd340b3cea34291"
        },
        "date": 1680034594781,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 239774,
            "range": "± 20617",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 95010,
            "range": "± 382",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 346497,
            "range": "± 2011",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 246736,
            "range": "± 812",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 597774,
            "range": "± 1646",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}