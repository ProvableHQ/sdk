import {Account, initThreadPool, ProgramManager, AleoKeyProvider, OfflineKeyProvider, CREDITS_PROGRAM_KEYS} from "@provablehq/sdk";

await initThreadPool();



async function localProgramExecution() {
    const programManager = new ProgramManager();

    // Create a temporary account for the execution of the program
    const account = new Account();
    programManager.setAccount(account);

    // Create a key provider in order to re-use the same key for each execution
    const keyProvider = new AleoKeyProvider();
    const offlineKeyProvider = new OfflineKeyProvider();
    keyProvider.useCache(true);
    programManager.setKeyProvider(keyProvider);

     const [transferPublicProver, transferPublicVerifier] =await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public);
    console.log(transferPublicVerifier.toString());

    // Specify parameters for the key provider to use search for program keys. In particular specify the cache key
    // that was used to cache the keys in the previous step.
   
}

const start = Date.now();
console.log("Starting execute!");
await localProgramExecution();
console.log("Execute finished!", Date.now() - start);