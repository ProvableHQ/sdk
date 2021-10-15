import {useEffect, useState} from "react";

export const useAleoWASM = () => {
    const [aleo, setAleo] = useState(null);

    useEffect(() => {
        if (aleo === null) {
            import('aleo-wasm').then(module => setAleo(module));
        }
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps
    return aleo;
};