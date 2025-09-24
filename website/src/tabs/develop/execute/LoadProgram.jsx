import { useState } from "react";
import { Form, Input } from "antd";
import axios from "axios";
import { useAleoWASM } from "../../../aleo-wasm-hook.js";

export const LoadProgram = ({ onResponse }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const form = Form.useFormInstance();
    const [wasm] = useAleoWASM();

    const onProgramSearch = (value) => {
        if (!value || value.trim() === "") {
            setError("Please input a program");
            return;
        }

        if (!value.endsWith(".aleo") && !value.includes(".")) {
            value += ".aleo";
            form.setFieldsValue({
                program_id: value,
            });
        }

        setIsLoading(true);
        const url = `https://api.explorer.provable.com/v1/testnet/program/${value}`;

        axios
            .get(url)
            .then((response) => {
                setIsLoading(false);
                wasm.Program.fromString(response.data);
                setError(null);
                onResponse(response.data);
            })
            .catch((error) => {
                setIsLoading(false);
                setError(`Error finding ${value} on Aleo Testnet.`);
                onResponse("");
            });
    };

    return (
        <Form.Item
            label="Load Program"
            name="program_id"
            tooltip="Optionally load program from REST API"
            help={error || ""}
            validateStatus={error ? "warning" : ""}
        >
            <Input.Search
                placeholder="Program ID"
                onSearch={onProgramSearch}
                disabled={isLoading}
                loading={isLoading}
            />
        </Form.Item>
    );
};
