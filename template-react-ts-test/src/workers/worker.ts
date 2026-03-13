//@ts-nocheck
import {
  Address,
} from "@provablehq/account-tools";
import { expose, proxy } from "comlink";

// await initThreadPool();

async function checkAddress() {
  const beaconAddressString = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
  const address = Address.from_string(beaconAddressString);
  const bytes = address.toBytesLe();

  if (!Address.isValid(bytes)) {
  throw new Error("Address validation failed");
}
  console.log("Address is:", address.to_string());
  console.log("Address bytes:", (bytes));
}


const workerMethods = { checkAddress };
expose(workerMethods);
