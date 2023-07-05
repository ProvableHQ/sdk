window.BENCHMARK_DATA = {
  "lastUpdate": 1688594973471,
  "repoUrl": "https://github.com/AleoHQ/sdk",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "brent@aleo.org",
            "name": "Brent C",
            "username": "onetrickwolf"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "85eb6ed9452aff12183bfe55576c4380da7d6f8c",
          "message": "[Fix] Replacing yarn with npm (#643)\n\n* removing yarn, adding aleohq to wasm packscope\r\n\r\n* adding website package-lock.json\r\n\r\n* regenerating lock, adding readme yarn note\r\n\r\n* Update README.md\r\n\r\nSigned-off-by: Brent C <brent@aleo.org>\r\n\r\n---------\r\n\r\nSigned-off-by: Brent C <brent@aleo.org>",
          "timestamp": "2023-07-05T17:57:07-04:00",
          "tree_id": "8d402a874c15d376606f2353183f8e87d136f956",
          "url": "https://github.com/AleoHQ/sdk/commit/85eb6ed9452aff12183bfe55576c4380da7d6f8c"
        },
        "date": 1688594963961,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 260273,
            "range": "± 4286",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 108517,
            "range": "± 3541",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 415601,
            "range": "± 3940",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 299943,
            "range": "± 999",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 721258,
            "range": "± 3424",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}