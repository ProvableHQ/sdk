import React, {useEffect, useState} from "react";
import {Alert, Card, Divider, Form, Input, Row} from "antd";
import {CopyButton} from "../../components/CopyButton";
import {useAleoWASM} from "../../aleo-wasm-hook";

export const DecryptAccount = () => {
    const [accountFromCiphertext, setAccountFromCiphertext] = useState(null);
    const [inputCiphertext, setInputCiphertext] = useState(null);
    const [inputPassword, setInputPassword] = useState(null);
    const aleo = useAleoWASM();

    const onCiphertextChange = (event) => {
        try {
            let ciphertext = aleo.PrivateKeyCiphertext.fromString(event.target.value);
            setInputCiphertext(ciphertext);
            setAccountFromCiphertext(ciphertext.decryptToPrivateKey(inputPassword));
        } catch (error) {
            setAccountFromCiphertext(null);
            console.error(error);
        }
    }
    const onPasswordChange = (event) => {
        try {
            setInputPassword(event.target.value);
            setAccountFromCiphertext(inputCiphertext.decryptToPrivateKey(event.target.value));
        } catch (error) {
            console.error(error);
            setAccountFromCiphertext(null);
        }
    }

    const validateStatusAccount = () => {
        return inputPassword !== null ?
            accountFromCiphertext !== null ?
                "success"
                : "error"
            : "";
    }

    const layout = {labelCol: {span: 3}, wrapperCol: {span: 21}};
    useEffect(() => {}, [inputCiphertext, inputPassword]);
    if (aleo !== null) {
        const privateKey = () => accountFromCiphertext !== null ? accountFromCiphertext.to_string() : "";
        const viewKey = () => accountFromCiphertext !== null ? accountFromCiphertext.to_view_key().to_string() : "";
        const address = () => accountFromCiphertext !== null ? accountFromCiphertext.to_address().to_string() : "";

        return <Card title="Decrypt Account Ciphertext with Password" style={{width: "100%", borderRadius: "20px"}}
                     bordered={false}>
            <Form {...layout}>
                <Form.Item label="Private Key Ciphertext" colon={false}>
                    <Input name="privateKeyCiphertext" size="large" placeholder="Private Key Ciphertext" allowClear
                           onChange={onCiphertextChange} style={{borderRadius: '20px'}}/>
                </Form.Item>
                <Form.Item label="Password"
                           colon={false}
                           hasFeedback
                           validateStatus={validateStatusAccount()}>
                    <Input name="password" size="large" placeholder="Password" onChange={onPasswordChange}
                           style={{borderRadius: '20px'}}/>
                </Form.Item>
            </Form>
            {
                (accountFromCiphertext !== null) ?
                    <Form {...layout}>
                        <Divider/>
                        <Form.Item label="Private Key" colon={false}>
                            <Input size="large" placeholder="Private Key" value={privateKey()}
                                   addonAfter={<CopyButton data={privateKey()} style={{borderRadius: '20px'}}/>} disabled/>
                        </Form.Item>
                        <Form.Item label="View Key" colon={false}>
                            <Input size="large" placeholder="View Key" value={viewKey()}
                                   addonAfter={<CopyButton data={viewKey()} style={{borderRadius: '20px'}}/>} disabled/>
                        </Form.Item>
                        <Form.Item label="Address" colon={false}>
                            <Input size="large" placeholder="Address" value={address()}
                                   addonAfter={<CopyButton data={address()} style={{borderRadius: '20px'}}/>} disabled/>
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