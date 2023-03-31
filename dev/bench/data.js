window.BENCHMARK_DATA = {
  "lastUpdate": 1680300010879,
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
          "id": "b9fc3dedea17947ed407a59a99b0710c074f81dc",
          "message": "[Feature] Record Finding in Typescript/Javascript SDK",
          "timestamp": "2023-03-31T16:54:23-05:00",
          "tree_id": "eb1c5a80ec985c02455ffb9fa83289c958903357",
          "url": "https://github.com/AleoHQ/aleo/commit/b9fc3dedea17947ed407a59a99b0710c074f81dc"
        },
        "date": 1680300007539,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 211273,
            "range": "± 2713",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 82778,
            "range": "± 111",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 308124,
            "range": "± 732",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 218846,
            "range": "± 283",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 535888,
            "range": "± 2834",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}