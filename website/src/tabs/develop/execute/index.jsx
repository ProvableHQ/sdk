import { Button, Card, Divider, Form, Input, Select } from "antd";
import { LoadProgram } from "./LoadProgram.jsx";
import { CodeEditor } from "./CodeEditor.jsx";

export const Execute = () => {
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
                <LoadProgram />
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
                    <CodeEditor />
                </Form.Item>
                <Divider />
                <Form.Item
                    label="Private Key"
                    name="private_key"
                    rules={[
                        {
                            required: true,
                            message: "Private key required to execute program",
                        },
                    ]}
                >
                    <Input.Password />
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
