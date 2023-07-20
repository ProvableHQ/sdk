import { Button, Card, Checkbox, Divider, Form, Input, Select } from "antd";
import { useState } from "react";
import axios from "axios";

export const ExecuteV2 = () => {
    const layout = { labelCol: { span: 4 }, wrapperCol: { span: 18 } };

    const [form] = Form.useForm();

    const onFinish = (values) => {
        console.log("Success:", values);
    };
    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };

    const demoSelect = (value) => {
        console.log(`selected ${value}`);
    };

    const handleLoadProgramResponse = (response) => {
        if (response.success) {
            form.setFieldsValue({
                program: response.data,
            });
        } else {
            form.setFieldsValue({
                program: "",
            });
        }
    };

    return (
        <Card
            title="Execute Program"
            extra={
                <Select
                    placeholder="Select a demo"
                    onChange={demoSelect}
                    options={[
                        {
                            value: "hello",
                            label: "hello_hello.aleo",
                        },
                        {
                            value: "credits",
                            label: "credits.aleo",
                        },
                    ]}
                />
            }
        >
            <LoadProgramForm
                layout={layout}
                handleResponse={handleLoadProgramResponse}
            />
            <Form
                form={form}
                name="execute"
                {...layout}
                initialValues={{
                    remember: false,
                }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item
                    label="Program"
                    name="program"
                    rules={[
                        {
                            required: true,
                            message: "Please input or load an Aleo program",
                        },
                    ]}
                >
                    <Input.TextArea
                        rows={10}
                        placeholder="Program"
                        style={{
                            whiteSpace: "pre-wrap",
                            overflowWrap: "break-word",
                        }}
                    />
                </Form.Item>
                <Divider>test</Divider>
                <Form.Item
                    label="Username"
                    name="username"
                    rules={[
                        {
                            required: true,
                            message: "Please input your username!",
                        },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                        {
                            required: true,
                            message: "Please input your password!",
                        },
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item
                    name="remember"
                    valuePropName="checked"
                    wrapperCol={{
                        xs: {
                            offset: 0,
                        },
                        sm: {
                            offset: 4,
                        },
                    }}
                >
                    <Checkbox>Remember me</Checkbox>
                </Form.Item>

                <Form.Item
                    wrapperCol={{
                        xs: {
                            offset: 0,
                        },
                        sm: {
                            offset: 4,
                        },
                    }}
                >
                    <Button type="primary" htmlType="submit">
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

/**
 * LoadProgramForm Component and Logic
 */

const LoadProgramForm = ({ layout, handleResponse }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const onProgramSearch = (value) => {
        setIsLoading(true);
        const url = `https://vm.aleo.org/api/testnet3/program/${value}`;

        axios
            .get(url)
            .then((response) => {
                setIsLoading(false);
                setError(null);
                handleResponse({ success: true, data: response.data });
            })
            .catch((error) => {
                setIsLoading(false);
                setError(error.response?.data);
                handleResponse({ success: false, data: error.response?.data });
            });
    };

    return (
        <Form {...layout}>
            <Form.Item
                label="Load Program"
                name="programid"
                tooltip="Load program from REST API"
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
        </Form>
    );
};
