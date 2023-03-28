window.BENCHMARK_DATA = {
  "lastUpdate": 1680023598206,
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
          "id": "833c97a117062ef1e6ee9f64c89211dd55abaf12",
          "message": "build(deps): bump anyhow from 1.0.69 to 1.0.70 (#507)\n\nBumps [anyhow](https://github.com/dtolnay/anyhow) from 1.0.69 to 1.0.70.\r\n- [Release notes](https://github.com/dtolnay/anyhow/releases)\r\n- [Commits](https://github.com/dtolnay/anyhow/compare/1.0.69...1.0.70)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: anyhow\r\n  dependency-type: direct:production\r\n  update-type: version-update:semver-patch\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>\r\nCo-authored-by: Collin Chin <collin@aleo.org>",
          "timestamp": "2023-03-28T09:55:03-07:00",
          "tree_id": "5307b4a90376c20d40960ea7a305a170bd79632f",
          "url": "https://github.com/AleoHQ/aleo/commit/833c97a117062ef1e6ee9f64c89211dd55abaf12"
        },
        "date": 1680023594913,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 234308,
            "range": "± 17123",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 94860,
            "range": "± 340",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 347000,
            "range": "± 1643",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 246627,
            "range": "± 844",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 597646,
            "range": "± 1898",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}