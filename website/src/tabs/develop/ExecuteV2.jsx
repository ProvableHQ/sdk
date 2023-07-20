import init from "@aleohq/wasm";
import { Button, Card, Checkbox, Form, Input } from "antd";

// await init();

export const ExecuteV2 = () => {
    const onFinish = (values) => {
        console.log("Success:", values);
    };
    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };

    return (
        <Card>
            <Form
                name="execute"
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 18 }}
                initialValues={{
                    remember: false,
                }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item label="Program ID" name="programid">
                    <Input.Search name="program_id" placeholder="Program ID" />
                </Form.Item>
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
