window.BENCHMARK_DATA = {
  "lastUpdate": 1691007128234,
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
          "id": "955697d230d10fc7565bde6ec33841b9bf30277a",
          "message": "[Fix] Improved loading (#700)\n\n* initial loading test\r\n\r\n* loading animations, not working aleo wasm\r\n\r\n* working webassembly init\r\n\r\n* removing comments\r\n\r\n* removing console log\r\n\r\n* Update website/src/workers/worker.js\r\n\r\nCo-authored-by: Mike Turner <mturner@aleo.org>\r\nSigned-off-by: Brent C <brent.conn@gmail.com>\r\n\r\n---------\r\n\r\nSigned-off-by: Brent C <brent.conn@gmail.com>\r\nCo-authored-by: Mike Turner <mturner@aleo.org>",
          "timestamp": "2023-08-02T16:03:11-04:00",
          "tree_id": "f2610397ce5f5a5647ff76d11faaa4ecd8c1cd6b",
          "url": "https://github.com/AleoHQ/sdk/commit/955697d230d10fc7565bde6ec33841b9bf30277a"
        },
        "date": 1691007108392,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 209701,
            "range": "± 907",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 89078,
            "range": "± 237",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 343378,
            "range": "± 650",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 248223,
            "range": "± 933",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 597276,
            "range": "± 2717",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}