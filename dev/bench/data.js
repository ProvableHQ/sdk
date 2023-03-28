window.BENCHMARK_DATA = {
  "lastUpdate": 1680024130610,
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
          "id": "b21e0a21683e0985a1ee7f196c834cb529ddc395",
          "message": "build(deps): bump openssl from 0.10.45 to 0.10.48 (#513)\n\nBumps [openssl](https://github.com/sfackler/rust-openssl) from 0.10.45 to 0.10.48.\r\n- [Release notes](https://github.com/sfackler/rust-openssl/releases)\r\n- [Commits](https://github.com/sfackler/rust-openssl/compare/openssl-v0.10.45...openssl-v0.10.48)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: openssl\r\n  dependency-type: indirect\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-03-28T10:03:51-07:00",
          "tree_id": "991c0ea02bf5e473a3802cf88e7a1fb35a0db946",
          "url": "https://github.com/AleoHQ/aleo/commit/b21e0a21683e0985a1ee7f196c834cb529ddc395"
        },
        "date": 1680024127530,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 210214,
            "range": "± 3339",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 82514,
            "range": "± 115",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 306713,
            "range": "± 715",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 218010,
            "range": "± 292",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 533810,
            "range": "± 3652",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}