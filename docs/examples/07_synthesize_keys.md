// This example demonstrates how to synthesize proving and verifying keys offline.  A copy of the program and its imports must be available locally in order to proceed with offline key synthesis.

// Aleo Program
```Leo
program demo_program.aleo {
    @noupgrade
    async constructor() {}

    record BasicRecord {
        owner: address,
        sum: u32,
    }

    transition basic_mint(public a: u32, b: u32) -> BasicRecord {
        let c: u32 = a + b;
        return BasicRecord { owner: self.caller, sum: c};
    }
}
```

```typescript
import {Account, ProgramManager, initThreadPool} from `provable.sdk`;

await initThreadPool();

const programManager = new ProgramManager();

keyPair = programManager
    .synthesizeKeys(
        "demo_program",
        "basic_mint",
        ["5u32", "3u32"],
    );

//Save the keys to local storage
```