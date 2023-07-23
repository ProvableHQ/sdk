import { Button, Card, Checkbox, Divider, Form, Input, Select } from "antd";
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
                <Divider dashed />
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
                <Divider dashed />
                <Form.Item
                    label="Execute On-Chain"
                    name="execute_onchain"
                    valuePropName="checked"
                >
                    <Checkbox />
                </Form.Item>
                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                        prevValues.execute_onchain !==
                        currentValues.execute_onchain
                    }
                >
                    {({ getFieldValue }) =>
                        getFieldValue("execute_onchain") === true ? (
                            <>
                                <Form.Item label="Peer URL" name="peer_url">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Fee" name="fee">
                                    <Input.Search enterButton="Estimate Fee" />
                                </Form.Item>
                                <Form.Item label="Fee Record" name="fee_record">
                                    <Input.TextArea />
                                </Form.Item>
                            </>
                        ) : null
                    }
                </Form.Item>
                <Divider dashed />
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
