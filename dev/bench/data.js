window.BENCHMARK_DATA = {
  "lastUpdate": 1674541026153,
  "repoUrl": "https://github.com/AleoHQ/aleo",
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
          "id": "bff9407800c15068ce379d448346edb1f3b06d04",
          "message": "[Feature] Add CipherTextRecord and PlainTextRecord types to WASM API (#452)\n\n* Add CipherTextRecord and PlainTextRecord type to WASM types\r\n\r\n* Apply linting fixes\r\n\r\n* Replace unwraps with explanatory errors, fix string parsing\r\n\r\n* Apply renaming and misc suggestions\r\n\r\nCo-authored-by: Collin Chin <collin@aleo.org>\r\nSigned-off-by: Mike Turner <mturner@aleo.org>\r\n\r\n* Apply renamings to rust types and wasm exported types\r\n\r\n* Export method to over javascript toString() method\r\n\r\nSigned-off-by: Mike Turner <mturner@aleo.org>\r\nCo-authored-by: Collin Chin <collin@aleo.org>",
          "timestamp": "2023-01-23T22:06:09-08:00",
          "tree_id": "484f21de3fecb62d17012c3bd0b0cd652a0c1011",
          "url": "https://github.com/AleoHQ/aleo/commit/bff9407800c15068ce379d448346edb1f3b06d04"
        },
        "date": 1674541022662,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 267473,
            "range": "± 262093",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 103747,
            "range": "± 671",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}