import { useEffect, useState } from "react";
import init, * as aleo from "@aleohq/wasm";

await init();
export const useAleoWASM = () => {
    const [aleoInstance, setAleoInstance] = useState(null);

    useEffect(() => {
        if (aleoInstance === null) {
            setAleoInstance(aleo);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return aleoInstance;
};
