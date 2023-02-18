import React, {useState} from "react";
import {Button, Card, Col, Divider, Form, Input, Row} from "antd";
import {CopyButton} from "../../components/CopyButton";
import {useAleoWASM} from "../../aleo-wasm-hook";

export const NewAccount = () => {
    const [account, setAccount] = useState(null);
    const [signature, setSignature] = useState(null);
    const [loading, setLoading] = useState(false);
    const aleo = useAleoWASM();

    const generateAccount = async () => {
        setLoading(true);
        setTimeout(() => {
            setAccount(new aleo.PrivateKey());
            setLoading(false);
        }, 25);
    }
    const signString = (str) => {
        if (str === "" | account === null) return;
        var arr = [];
        for (var i = 0, l = str.length; i < l; i ++) {
            var hex = Number(str.charCodeAt(i)).toString(16);
            arr.push(hex);
        }
        return account.sign(Uint8Array.from(arr)).to_string();
    }
    const onMessageChange = (event) => {
        try {
            setSignature(signString(event.target.value))
        } catch (error) {
            console.error(error);
        }
    }
    const clear = () => {
        setAccount(null);
        setSignature(null);
    }

    const privateKey = () => account !== null ? account.to_string() : "";
    const viewKey = () => account !== null ? account.to_view_key().to_string() : "";
    const address = () => account !== null ? account.to_address().to_string() : "";
    const signatureString = () => signature !== null ? signature : "";

    const layout = {labelCol: {span: 3}, wrapperCol: {span: 21}};

    if (aleo !== null) {
        return <Card title="Create a New Account" style={{width: "100%", borderRadius: "20px"}} bordered={false}>
            <Row justify="center">
                <Col><Button type="primary" shape="round" size="large" onClick={generateAccount}
                             loading={!!loading}>Generate</Button></Col>
                <Col offset="1"><Button shape="round" size="large" onClick={clear}>Clear</Button></Col>
            </Row>
            {
                account &&
                    <Form {...layout}>
                        <Divider/>
                        <Form.Item label="Private Key" colon={false}>
                            <Input size="large" placeholder="Private Key" value={privateKey()}
                                   addonAfter={<CopyButton data={privateKey()}/>} disabled/>
                        </Form.Item>
                        <Form.Item label="View Key" colon={false}>
                            <Input size="large" placeholder="View Key" value={viewKey()}
                                   addonAfter={<CopyButton data={viewKey()}/>} disabled/>
                        </Form.Item>
                        <Form.Item label="Address" colon={false}>
                            <Input size="large" placeholder="Address" value={address()}
                                   addonAfter={<CopyButton data={address()}/>} disabled/>
                        </Form.Item>
                        <Divider/>
                        <h3>Sign a Message With Your Private Key</h3>
                        <Divider/>
                        <Form.Item label="Message" colon={false}>
                            <Input name="Message" size="large" placeholder="Message"
                                   style={{borderRadius: '20px'}} onChange={onMessageChange}/>
                        </Form.Item>
                        <Form.Item label="Signature" colon={false}>
                            <Input size="large" placeholder="Signature" value={signatureString()}
                                   addonAfter={<CopyButton data={address()}/>} disabled/>
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