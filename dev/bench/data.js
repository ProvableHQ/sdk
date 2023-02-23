window.BENCHMARK_DATA = {
  "lastUpdate": 1677117722126,
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
          "id": "f70e92ccde2a1e282911c2bd56ca4bbd580f8fca",
          "message": "[Feature] Re-add Aleo private key encryption to SDK + add private key encryption demo to aleo.tools (#479)\n\n* Add message signing and record encryption/decryption to Aleo.tools\r\n\r\n* Add message signing and record encryption/decryption using a sample record to Aleo.tools\r\n\r\n* Add Alert UI elements for verification + clear state when signing message\r\n\r\n* Ensure sign & verify state clear on key change\r\n\r\n* Small formatting nit\r\n\r\n* Second small formatting nit\r\n\r\n* Add back private key encryption and re-organize rust SDK dependencies\r\n\r\n* Add private key encrpytion to aleo.tools\r\n\r\n* Remove the wasm compilation target of death from SnarkVM_console\r\n\r\n* Add minor state management updates\r\n\r\n* update UI with advanced tab for account encrypt + decrypt\r\n\r\n* improve formatting and fix broken copy buttons\r\n\r\n---------\r\n\r\nSigned-off-by: Mike Turner <mturner@aleo.org>\r\nCo-authored-by: collin <16715212+collinc97@users.noreply.github.com>",
          "timestamp": "2023-02-22T17:50:52-08:00",
          "tree_id": "33a60454a9036355265e9961fbe24cbfd7103e94",
          "url": "https://github.com/AleoHQ/aleo/commit/f70e92ccde2a1e282911c2bd56ca4bbd580f8fca"
        },
        "date": 1677117719273,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 254474,
            "range": "± 453774",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 95659,
            "range": "± 368",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 348635,
            "range": "± 1836",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 247626,
            "range": "± 807",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 600350,
            "range": "± 1559",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}