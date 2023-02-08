window.BENCHMARK_DATA = {
  "lastUpdate": 1675889911409,
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
          "id": "f7ed5bfe8ef03051ed60dc6caf3f9effccaf917f",
          "message": "build(deps): bump anyhow from 1.0.68 to 1.0.69 (#465)\n\nBumps [anyhow](https://github.com/dtolnay/anyhow) from 1.0.68 to 1.0.69.\r\n- [Release notes](https://github.com/dtolnay/anyhow/releases)\r\n- [Commits](https://github.com/dtolnay/anyhow/compare/1.0.68...1.0.69)\r\n\r\n---\r\nupdated-dependencies:\r\n- dependency-name: anyhow\r\n  dependency-type: direct:production\r\n  update-type: version-update:semver-patch\r\n...\r\n\r\nSigned-off-by: dependabot[bot] <support@github.com>\r\nCo-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>",
          "timestamp": "2023-02-08T12:46:19-08:00",
          "tree_id": "510c16abc67f0e2efb018e92e9a448a175646a03",
          "url": "https://github.com/AleoHQ/aleo/commit/f7ed5bfe8ef03051ed60dc6caf3f9effccaf917f"
        },
        "date": 1675889907918,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 243459,
            "range": "± 11958",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 97845,
            "range": "± 5336",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 367763,
            "range": "± 11276",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 261961,
            "range": "± 14828",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 641322,
            "range": "± 15045",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}