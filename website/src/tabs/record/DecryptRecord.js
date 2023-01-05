import React, {useState} from "react";
import {Card, Divider, Form, Input} from "antd";
import {CopyButton} from "../../components/CopyButton";
import {useAleoWASM} from "../../aleo-wasm-hook";

export const DecryptRecord = () => {
    const [ciphertext, setCiphertext] = useState(null);
    const [viewKey, setViewKey] = useState(null);
    const [plaintext, setPlaintext] = useState(null);
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
            }
        } catch (error) {
            console.error(error);
        }
    }

    const layout = {labelCol: {span: 4}, wrapperCol: {span: 21}};

    if (aleo !== null) {
        const recordPlaintext = () => plaintext !== null ? plaintext.toString() : "";

        return <Card title="Decrypt Record" style={{width: "100%", borderRadius: "20px"}} bordered={false}>
            <Form {...layout}>
                <Form.Item label="Record (Ciphertext)" colon={false}>
                    <Input name="recordCiphertext" size="large" placeholder="Record (Ciphertext)" allowClear onChange={onCiphertextChange}
                           style={{borderRadius: '20px'}}/>
                </Form.Item>
                <Form.Item label="View Key" colon={false}>
                    <Input name="viewKey" size="large" placeholder="View Key" allowClear onChange={onViewKeyChange}
                           style={{borderRadius: '20px'}}/>
                </Form.Item>
            </Form>
            {
                (plaintext !== null) ?
                    <Form {...layout}>
                        <Divider/>
                        <Form.Item label="Record (Plaintext)" colon={false}>
                            <Input size="large" placeholder="Record (Plaintext)" value={recordPlaintext()}
                                   addonAfter={<CopyButton data={recordPlaintext()} style={{borderRadius: '20px'}}/>} disabled/>
                        </Form.Item>
                    </Form>
                    : null
            }
        </Card>
    } else {
        return <h3>
            <center>Loading...</center>
        </h3>
    }
}