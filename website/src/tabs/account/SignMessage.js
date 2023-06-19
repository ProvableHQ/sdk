import React, {useState} from "react";
import {Card, Divider, Form, Input} from "antd";
import {CopyButton} from "../../components/CopyButton";
import {useAleoWASM} from "../../aleo-wasm-hook";

export const SignMessage = () => {
    const [signingAccount, setSigningAccount] = useState(null);
    const [signingKey, setSigningKey] = useState(null);
    const [message, setMessage] = useState(null);
    const aleo = useAleoWASM();
    const textEncoder = new TextEncoder();

    const onKeyChange = (event) => {
        setSigningAccount(null);
        try {
            setSigningAccount(aleo.PrivateKey.from_string(event.target.value))
            onMessageChange()
        } catch (error) {
            console.error(error);
        }
        finally {
            setSigningKey(null);
            setMessage(null);
        }
    }
    const signString = (str) => {
        if (str === "" | signingAccount === null) return;
        return signingAccount.sign(textEncoder.encode(str)).to_string();
    }
    const onMessageChange = (event) => {
        setMessage(event.target.value);
        try {
            setSigningKey(signString(event.target.value))
        } catch (error) {
            console.error(error);
        }
    }

    const layout = {labelCol: {span: 3}, wrapperCol: {span: 21}};

    if (aleo !== null) {
        const signatureString = () => signingKey !== null ? signingKey : "";
        const messageString = () => message !== null ? message : "";

        return <Card title="Sign a Message" style={{width: "100%", borderRadius: "20px"}}
                     bordered={false}>
            <Form {...layout}>
                <Form.Item label="Private Key" colon={false}>
                    <Input name="privateKey" size="large" placeholder="Private Key" allowClear onChange={onKeyChange}
                           style={{borderRadius: '20px'}}/>
                </Form.Item>
                <Form.Item label="Message" colon={false}>
                    <Input name="Message" size="large" placeholder="Message" value = {messageString()}
                           allowClear = {true} style={{borderRadius: '20px'}} onChange={onMessageChange}/>
                </Form.Item>
            </Form>
            {
                (signingAccount) ?
                    <Form {...layout}>
                        <Divider/>
                        <Form.Item label="Signature" colon={false}>
                            <Input size="large" placeholder="Signature" value={signatureString()}
                                   addonAfter={<CopyButton data={signatureString()}/>} disabled/>
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