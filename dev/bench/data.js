window.BENCHMARK_DATA = {
  "lastUpdate": 1691700222070,
  "repoUrl": "https://github.com/AleoHQ/sdk",
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
          "id": "01b7105e066dc3c8eaa43d998dbee1c53549fab4",
          "message": "[Feature] Program execution in Aleo Typescript & Javascript SDKs",
          "timestamp": "2023-08-10T15:38:25-04:00",
          "tree_id": "79f0507a66be0575d3981f0172d013c2c29348de",
          "url": "https://github.com/AleoHQ/sdk/commit/01b7105e066dc3c8eaa43d998dbee1c53549fab4"
        },
        "date": 1691700204419,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 230392,
            "range": "± 41566",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 105897,
            "range": "± 22724",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 349869,
            "range": "± 64954",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 279534,
            "range": "± 58466",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 677574,
            "range": "± 100687",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}