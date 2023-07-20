import { useState } from "react";
import { Form, Input } from "antd";
import axios from "axios";

export const LoadProgram = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const form = Form.useFormInstance();

    const onProgramSearch = (value) => {
        if (!value || value.trim() === "") {
            setError("Please input a program");
            return;
        }

        setIsLoading(true);
        const url = `https://vm.aleo.org/api/testnet3/program/${value}`;

        axios
            .get(url)
            .then((response) => {
                setIsLoading(false);
                setError(null);
                form.setFieldsValue({
                    program: response.data,
                });
            })
            .catch((error) => {
                setIsLoading(false);
                setError(error.response?.data || error.message);
                form.setFieldsValue({
                    program: "",
                });
            });
    };

    return (
        <Form.Item
            label="Load Program"
            name="programid"
            tooltip="Optionally load program from REST API"
            help={error || ""}
            validateStatus={error ? "warning" : ""}
        >
            <Input.Search
                name="program_id"
                placeholder="Program ID"
                onSearch={onProgramSearch}
                disabled={isLoading}
                loading={isLoading}
            />
        </Form.Item>
    );
};
