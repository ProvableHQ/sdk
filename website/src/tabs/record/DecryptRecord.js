import React, {useState} from "react";
import {Button, Card, Col, Divider, Form, Input, Row, Skeleton} from "antd";
import {CopyButton} from "../../components/CopyButton";
import {useAleoWASM} from "../../aleo-wasm-hook";

export const DecryptRecord = () => {
    const [ciphertext, setCiphertext] = useState(null);
    const [viewKey, setViewKey] = useState(null);
    const [plaintext, setPlaintext] = useState(null);
    const [_isOwner, setIsOwner] = useState(null);
    const aleo = useAleoWASM();

    const onCiphertextChange = (event) => {
        setCiphertext(null);
        try {
            setCiphertext(event.target.value);
            tryDecrypt(event.target.value, viewKey);
        } catch (error) {
            console.error(error);
        }
    }
    const onViewKeyChange = (event) => {
        setViewKey(null);
        try {
            setViewKey(event.target.value);
            tryDecrypt(ciphertext, event.target.value);
        } catch (error) {
            console.error(error);
        }
    }
    const tryDecrypt = (ciphertext, viewKey) => {
        setPlaintext(null);
        try {
            // Check if we have a ciphertext and a view key, and if so, decrypt the ciphertext.
            if (ciphertext && viewKey) {
                setPlaintext(aleo.ViewKey.from_string(viewKey).decrypt(ciphertext));
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
    }
    const populateForm = async (event) => {
        const recordCipherTextString = "record1qyqspnp6w0fmrr66xsx5rwh4cp2qy7c3rp0ra0rf8rqd0t8u30d28nqxqyqsqqmnjvj7a8cs2es783xmd8sc2u46essh2f7w6vm26s4cks865lq0qzszm3clnh2vlpazmcjhan74nq0rr6hrtagwnw0grkrzuevg2x8sjjy02jy";
        const viewKeyString = "AViewKey1mSnpFFC8Mj4fXbK5YiWgZ3mjiV8CxA79bYNa8ymUpTrw";
        setCiphertext(recordCipherTextString);
        setViewKey(viewKeyString);
        tryDecrypt(recordCipherTextString, viewKeyString);
    }
    const clearForm = async (event) => {
        setCiphertext(null);
        setViewKey(null);
        setPlaintext(null);
        setIsOwner(null);
    }

    const layout = {labelCol: {span: 4}, wrapperCol: {span: 21}};

    if (aleo !== null) {
        const recordPlaintext = () => plaintext !== null ? plaintext.toString() : "";
        const viewKeyString = () => viewKey !== null ? viewKey.toString() : "";
        const recordCipherTextString = () => ciphertext !== null ? ciphertext.toString() : "";

        return <Card title="Decrypt Record"
                     style={{width: "100%", borderRadius: "20px"}}
                     bordered={false}
                     extra={<Button type="primary" shape="round" size="middle"
                                    onClick={populateForm}>Demo</Button>}>
            <Form {...layout}>
                <Form.Item label="Record (Ciphertext)" colon={false}>
                    <Input name="recordCiphertext" size="large" placeholder="Record (Ciphertext)" allowClear onChange={onCiphertextChange}
                           value={recordCipherTextString()} style={{borderRadius: '20px'}}/>
                </Form.Item>
                <Form.Item label="View Key" colon={false}>
                    <Input name="viewKey" size="large" placeholder="View Key" allowClear onChange={onViewKeyChange}
                           value={viewKeyString()} style={{borderRadius: '20px'}}/>
                </Form.Item>
            </Form>
            {
                (ciphertext || viewKey) ?
                <Row justify="center">
                    <Col><Button shape="round" size="middle" onClick={clearForm}
                    >Clear</Button></Col>
                </Row> : null

            }
            {
                <Form {...layout}>
                    <Divider/>
                    <Form.Item label="Record (Plaintext)" colon={false}>
                        {
                            (plaintext) ?
                                    <Row align="middle">
                                        <Col span={23}>
                                            <Input.TextArea size="large"  rows={10} placeholder="Record (Plaintext)"
                                                            value={recordPlaintext()} disabled/>
                                        </Col>
                                        <Col span={1} align="middle">
                                            <CopyButton data={recordPlaintext()}/>
                                        </Col>
                                    </Row>
                                : <Skeleton active/>
                        }
                    </Form.Item>
                </Form>
        }
        </Card>
    } else {
        return <h3>
            <center>Loading...</center>
        </h3>
    }
}