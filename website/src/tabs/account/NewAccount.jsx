import { useState } from "react";
import { Button, Card, Col, Divider, Form, Input, Row } from "antd";
import { CopyButton } from "../../components/CopyButton";
import { useAleoWASM } from "../../aleo-wasm-hook";

export const NewAccount = () => {
    const [account, setAccount] = useState(null);
    const [aleo, loading] = useAleoWASM();
    const isExistAccount = account !== null;
    const privateKey = isExistAccount ? account.to_string() : "";
    const viewKey = isExistAccount ? account.to_view_key().to_string() : "";
    const address = isExistAccount ? account.to_address().to_string() : "";

    const layout = { labelCol: { span: 3 }, wrapperCol: { span: 21 } };

    const generateAccount = () => {
        // when user are able to see button, it means aleo is already loaded
        setAccount(new aleo.PrivateKey());
    };

    const clear = () => {
        setAccount(null);
    };

    if (loading) {
        return (
            <h3>
                <center>Loading...</center>
            </h3>
        );
    }

    return (
        <Card
            title="Create a New Account"
            style={{ width: "100%" }}
        >
            <Row justify="center">
                <Col>
                    <Button
                        type="primary"
                        size="large"
                        onClick={generateAccount}
                        loading={!!loading}
                    >
                        Generate
                    </Button>
                </Col>
                <Col offset="1">
                    <Button  size="large" onClick={clear}>
                        Clear
                    </Button>
                </Col>
            </Row>
            {account && (
                <Form {...layout}>
                    <Divider />
                    <Form.Item label="Private Key" colon={false}>
                        <Input
                            size="large"
                            placeholder="Private Key"
                            value={privateKey}
                            addonAfter={<CopyButton data={privateKey} />}
                            disabled
                        />
                    </Form.Item>
                    <Form.Item label="View Key" colon={false}>
                        <Input
                            size="large"
                            placeholder="View Key"
                            value={viewKey}
                            addonAfter={<CopyButton data={viewKey} />}
                            disabled
                        />
                    </Form.Item>
                    <Form.Item label="Address" colon={false}>
                        <Input
                            size="large"
                            placeholder="Address"
                            value={address}
                            addonAfter={<CopyButton data={address} />}
                            disabled
                        />
                    </Form.Item>
                </Form>
            )}
        </Card>
    );
};
