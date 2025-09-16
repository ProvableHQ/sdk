import "./node-polyfill.js";
import { setConsensusVersionTestHeights } from "./browser.js";
export * from "./browser.js";

// Attempt to set the default test heights for the consensus versions from the CONSENSUS_VERSION_HEIGHTS envar when nodeJS loads its wasm module.
function setDefaultTestHeights() {
    const consensusVersionHeights = process.env["CONSENSUS_VERSION_HEIGHTS"];
    if (consensusVersionHeights) {
        setConsensusVersionTestHeights(consensusVersionHeights)
    }
}

setDefaultTestHeights()
