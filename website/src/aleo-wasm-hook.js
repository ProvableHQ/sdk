import { useEffect, useState } from "react";
import * as sdk from "@aleohq/sdk";

await sdk.initializeWasm();
export const useAleoWASM = () => {
    const [aleoInstance, setAleoInstance] = useState(null);

    useEffect(() => {
        if (aleoInstance === null) {
            setAleoInstance(sdk);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return aleoInstance;
};
