import "babel-polyfill";

import("@aleohq/wasm").then(aleo => {
  self.addEventListener("message", ev => {
    const {privateKey, transferProverBytes, toAddress, amount, plaintext} = ev.data;
    console.log('Web worker: Started Transfer...');
    console.log(ev.data);
    let startTime = performance.now();
    const pK = aleo.PrivateKey.from_string(privateKey);
    const provingKey = aleo.ProvingKey.from_bytes(transferProverBytes);
    console.log(`Web worker: Deserialized proving key Completed: ${performance.now() - startTime} ms`);
    startTime = performance.now();
    const address = aleo.Address.from_string(toAddress);
    const rec = aleo.RecordPlaintext.fromString(plaintext);

    startTime = performance.now();
    const result = aleo.TransactionBuilder.build_transfer_full(pK, provingKey, address, BigInt(amount), rec);
    console.log(`Web worker: Transaction Completed: ${performance.now() - startTime} ms`);
    console.log(result);
    self.postMessage({ transaction: result });
  });
});