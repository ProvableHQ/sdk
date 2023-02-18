window.BENCHMARK_DATA = {
  "lastUpdate": 1676685347936,
  "repoUrl": "https://github.com/AleoHQ/aleo",
  "entries": {
    "Aleo SDK Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "collin@aleo.org",
            "name": "Collin Chin",
            "username": "collinc97"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d154162f11478b4ae301e84c8b3e3d265654f47a",
          "message": "Create integation test script for Aleo CLI (#476)\n\n* commit integation test script\r\n\r\n* add aleo integration test to circlci\r\n\r\n* ALEO circleci command\r\n\r\n* run script with bash\r\n\r\n* rename circleci caches\r\n\r\n* give circle ci permission to execute aleo-new test\r\n\r\n* give permission locally\r\n\r\n* Remove dangling import\r\n\r\n* Remove js dangling imports\r\n\r\n* Test if reverting circleci image fixes illegal instruction issue\r\n\r\n* Revert to 1.67\r\n\r\n* Remove commited program files\r\n\r\n* Test if not transferring cache removes the illegal instruction\r\n\r\n* Test if not transferring cache removes the illegal instruction\r\n\r\n* Script location fix\r\n\r\n* 2nd Script location fix\r\n\r\n* Ci script fix\r\n\r\n---------\r\n\r\nCo-authored-by: Michael Turner <mturner@aleo.org>",
          "timestamp": "2023-02-17T17:42:47-08:00",
          "tree_id": "b4e1b576d6144afbafed705782353c83c813b6fb",
          "url": "https://github.com/AleoHQ/aleo/commit/d154162f11478b4ae301e84c8b3e3d265654f47a"
        },
        "date": 1676685345141,
        "tool": "cargo",
        "benches": [
          {
            "name": "testnet3_address_from_private_key",
            "value": 272221,
            "range": "± 35829",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_new",
            "value": 98726,
            "range": "± 6794",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_decryption",
            "value": 363004,
            "range": "± 17894",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption",
            "value": 261957,
            "range": "± 3338",
            "unit": "ns/iter"
          },
          {
            "name": "testnet3_private_key_encryption_decryption_roundtrip",
            "value": 638333,
            "range": "± 25920",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}