import { App } from "antd";
import { useAleoWASM } from "../aleo-wasm-hook.js";
import { useEffect } from "react";

export function WasmLoadingMessage() {
    const { message, notification } = App.useApp();
    const [_, aleoLoading] = useAleoWASM();

    useEffect(() => {
        if(aleoLoading){
            message.open({
                key: "wasmLoading",
                type: 'loading',
                content: 'Loading... some functionality may not be available yet...',
                duration: 0,
            });
        } else {
            message.open({
                key: "wasmLoading",
                type: 'success',
                content: 'Aleo.tools Loaded!',
                duration: 2,
            });
        }
    }, [aleoLoading]);

    return null;
}
