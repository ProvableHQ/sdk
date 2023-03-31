import {useEffect, useState} from "react";

export const useAleoWASM = () => {
    const [aleo, setAleo] = useState(null);

    useEffect(() => {
        if (aleo === null) {
            import('@aleohq/wasm').then(module => setAleo(module));
        }
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps
    return aleo;
};

export const useAleoSDK = () => {
    const [aleoSdk, setAleoSdk] = useState(null);

    useEffect(() => {
        if (aleoSdk === null) {
            import('@aleohq/sdk').then(module => setAleoSdk(module));
        }
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps
    return aleoSdk;
};