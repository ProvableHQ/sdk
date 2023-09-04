import { useEffect, useState } from "react";

export const useAleoWASM = () => {
    const [aleoInstance, setAleoInstance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        import("@aleohq/sdk").then(async (sdk) => {
            await sdk.initializeWasm();
            setAleoInstance(sdk);
            setLoading(false);
        }).catch((error) => {
            console.error("Failed to load the SDK:", error);
            setLoading(false);
        });
    }, []);

    return [aleoInstance, loading];
};