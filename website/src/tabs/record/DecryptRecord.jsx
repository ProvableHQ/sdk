import { useState } from "react";
import { Button, Card, Col, Divider, Form, Input, Row, Skeleton } from "antd";
import { CopyButton } from "../../components/CopyButton";
import { useAleoWASM } from "../../aleo-wasm-hook";
import "./DecryptRecord.css";

export const DecryptRecord = () => {
    const [ciphertext, setCiphertext] = useState(null);
    const [viewKey, setViewKey] = useState(null);
    const [plaintext, setPlaintext] = useState(null);
    const [_isOwner, setIsOwner] = useState(null);
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
                setIsOwner(true);
            }
        } catch (error) {
            console.warn(error);
            try {
                // If the ciphertext is valid, but the view key is not, then we can still display the info about ownership
                aleo.RecordCiphertext.fromString(ciphertext);
                setIsOwner(false);
            } catch (error) {
                // If the ciphertext is invalid, then we can't display any info about ownership or the plaintext content
                setIsOwner(null);
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
        setIsOwner(null);
    };

    const layout = { labelCol: { span: 4 }, wrapperCol: { span: 21 }};

    if (aleo !== null) {
        const recordPlaintext = () =>
            plaintext !== null ? plaintext.toString() : "";
        const viewKeyString = () =>
            viewKey !== null ? viewKey.toString() : "";
        const recordCipherTextString = () =>
            ciphertext !== null ? ciphertext.toString() : "";

        return (
            <div className="container">
                <h1>Records</h1>
                <h2>Overview</h2>
                <ul>
                    <li>
                        {" "}
                        Records are created by Aleo programs and can be used as
                        inputs for functions within the same program. Once a
                        record is used, it’s consumed and can’t be reused.
                    </li>
                    <li>
                        Functions that consume records generate new records as
                        output.
                    </li>
                    <li>
                        Records are <strong>private</strong> by default, tied to
                        a single Aleo program and a user's private key.
                    </li>
                    <li>
                        The <strong> View Key </strong> is derived from the
                        private key and allows users to decrypt their encrypted
                        data and prove ownership of that data.
                    </li>
                </ul>

                <br />
                <p>
                    Try the demo below! Enter a record and
                    decrypt it using your View Key to experience how the process
                    works. You can also click the "Show Demo" button on the
                    right to generate an example.
                </p>

                <br />

                <Card
                    title="Decrypt Record"
                    style={{ width: "100%" }}
                    extra={
                        <>
                            <Button
                                type="primary"
                                size="middle"
                                onClick={populateForm}
                            >
                                Show Demo
                            </Button>
                        </>
                    }
                >
                    <Form {...layout}>
                        <Form.Item label="Ciphertext" colon={false}>
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
                                <Button size="middle" onClick={clearForm}>
                                    Clear
                                </Button>
                            </Col>
                        </Row>
                    ) : null}
                    {
                        <Form {...layout}>
                            <Divider />
                            <Form.Item label="Decrypted Record" colon={false}>
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
                                            <CopyButton
                                                data={recordPlaintext()}
                                            />
                                        </Col>
                                    </Row>
                                ) : (
                                    <Skeleton active />
                                )}
                            </Form.Item>
                        </Form>
                    }
                </Card>
            </div>
        );
    } else {
        return (
            <h3>
                <center>Loading...</center>
            </h3>
        );
    }
};
