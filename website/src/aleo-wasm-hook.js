import { useEffect, useState } from "react";

let loadingPromise = null;
let loadedSDK = null;

export const useAleoWASM = () => {
    const [aleoInstance, setAleoInstance] = useState(loadedSDK);
    const [loading, setLoading] = useState(!loadedSDK);

    useEffect(() => {
        if (loadedSDK) {
            setAleoInstance(loadedSDK);
            setLoading(false);
            return;
        }

        if (!loadingPromise) {
            loadingPromise = import("@aleohq/sdk")
                .then((sdk) => {
                    loadedSDK = sdk; // Save the loaded SDK
                    setAleoInstance(sdk);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Failed to load the SDK:", error);
                    setLoading(false);
                });
        } else {
            loadingPromise.then(() => {
                setAleoInstance(loadedSDK);
                setLoading(false);
            });
        }
    }, []);

    return [aleoInstance, loading];
};
