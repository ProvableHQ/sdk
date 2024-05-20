import { useState } from "react";
import { Button, Card, Col, Divider, Form, Input, Row, Skeleton } from "antd";
import { CopyButton } from "../../components/CopyButton";
import { useAleoWASM } from "../../aleo-wasm-hook";

export const DecryptRecord = () => {
    const [ciphertext, setCiphertext] = useState(null);
    const [viewKey, setViewKey] = useState(null);
    const [plaintext, setPlaintext] = useState(null);
    const [aleo] = useAleoWASM();

    const onCiphertextChange = (event) => {
        setCiphertext(null);
        try {
            setCiphertext(event.target.value);
            tryDecrypt(event.target.value, viewKey);
        } catch (error) {
            console.error(error);
        }
    };
    const onViewKeyChange = (event) => {
        setViewKey(null);
        try {
            setViewKey(event.target.value);
            tryDecrypt(ciphertext, event.target.value);
        } catch (error) {
            console.error(error);
        }
    };
    const tryDecrypt = (ciphertext, viewKey) => {
        setPlaintext(null);
        try {
            // Check if we have a ciphertext and a view key, and if so, decrypt the ciphertext.
            if (ciphertext && viewKey) {
                setPlaintext(
                    aleo.ViewKey.from_string(viewKey).decrypt(ciphertext),
                );
            }
        } catch (error) {
            console.warn(error);
            try {
                // If the ciphertext is valid, but the view key is not, then we can still display the info about ownership
                aleo.RecordCiphertext.fromString(ciphertext);
            } catch (error) {
                // If the ciphertext is invalid, then we can't display any info about ownership or the plaintext content
                console.warn(error);
            }
            if (plaintext !== null) {
                setPlaintext(null);
            }
        }
    };
    const populateForm = async () => {
        const recordCipherTextString =
            "record1qyqsqpe2szk2wwwq56akkwx586hkndl3r8vzdwve32lm7elvphh37rsyqyxx66trwfhkxun9v35hguerqqpqzqrtjzeu6vah9x2me2exkgege824sd8x2379scspmrmtvczs0d93qttl7y92ga0k0rsexu409hu3vlehe3yxjhmey3frh2z5pxm5cmxsv4un97q";
        const viewKeyString =
            "AViewKey1ccEt8A2Ryva5rxnKcAbn7wgTaTsb79tzkKHFpeKsm9NX";
        setCiphertext(recordCipherTextString);
        setViewKey(viewKeyString);
        tryDecrypt(recordCipherTextString, viewKeyString);
    };
    const clearForm = async () => {
        setCiphertext(null);
        setViewKey(null);
        setPlaintext(null);
    };

    const layout = { labelCol: { span: 4 }, wrapperCol: { span: 21 } };

    if (aleo !== null) {
        const recordPlaintext = () =>
            plaintext !== null ? plaintext.toString() : "";
        const viewKeyString = () =>
            viewKey !== null ? viewKey.toString() : "";
        const recordCipherTextString = () =>
            ciphertext !== null ? ciphertext.toString() : "";

        return (
            <Card
                title="Decrypt Record"
                style={{ width: "100%" }}
                extra={
                    <Button
                        type="primary"

                        size="middle"
                        onClick={populateForm}
                    >
                        Demo
                    </Button>
                }
            >
                <Form {...layout}>
                    <Form.Item label="Record (Ciphertext)" colon={false}>
                        <Input
                            name="recordCiphertext"
                            size="large"
                            placeholder="Record (Ciphertext)"
                            allowClear
                            onChange={onCiphertextChange}
                            value={recordCipherTextString()}
                        />
                    </Form.Item>
                    <Form.Item label="View Key" colon={false}>
                        <Input
                            name="viewKey"
                            size="large"
                            placeholder="View Key"
                            allowClear
                            onChange={onViewKeyChange}
                            value={viewKeyString()}
                        />
                    </Form.Item>
                </Form>
                {ciphertext || viewKey ? (
                    <Row justify="center">
                        <Col>
                            <Button

                                size="middle"
                                onClick={clearForm}
                            >
                                Clear
                            </Button>
                        </Col>
                    </Row>
                ) : null}
                {
                    <Form {...layout}>
                        <Divider />
                        <Form.Item label="Record (Plaintext)" colon={false}>
                            {plaintext ? (
                                <Row align="middle">
                                    <Col span={23}>
                                        <Input.TextArea
                                            size="large"
                                            rows={10}
                                            placeholder="Record (Plaintext)"
                                            value={recordPlaintext()}
                                            disabled
                                        />
                                    </Col>
                                    <Col span={1} align="middle">
                                        <CopyButton data={recordPlaintext()} />
                                    </Col>
                                </Row>
                            ) : (
                                <Skeleton active />
                            )}
                        </Form.Item>
                    </Form>
                }
            </Card>
        );
    } else {
        return (
            <h3>
                <center>Loading...</center>
            </h3>
        );
    }
};
