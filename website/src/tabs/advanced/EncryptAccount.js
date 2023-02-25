import React, {useState} from "react";
import {Button, Card, Col, Divider, Form, Input, Row} from "antd";
import {CopyButton} from "../../components/CopyButton";
import {useAleoWASM} from "../../aleo-wasm-hook";

export const EncryptAccount = () => {
    const [account, setAccount] = useState(null);
    const [encryptedAccount, setEncryptedAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState(null);
    const aleo = useAleoWASM();

    const generateAccount = async () => {
        setLoading(true);
        setEncryptedAccount(null);
        setTimeout(() => {
            setAccount(new aleo.PrivateKey());
            setLoading(false);
        }, 25);
    }
    const encryptAccount = async () => {
        console.log('password is: ' + password);
        if (password && account) {
            try {
                setEncryptedAccount(account.toCiphertext(passwordString()));
                setPassword(null);
            } catch (error) {
                console.error(error);
            }
        }
    }
    const clear = () => {
        setAccount(null);
        setPassword(null);
        setEncryptedAccount(null);
    }
    const onPasswordChange = (event) => {
        setPassword(event.target.value);
        console.log("password input: " + event.target.value);
        if (encryptedAccount !== null) {
            console.log("encrypted account: " + encryptedPrivateKey());
        }
    }

    const privateKey = () => account !== null ? account.to_string() : "";
    const viewKey = () => account !== null ? account.to_view_key().to_string() : "";
    const address = () => account !== null ? account.to_address().to_string() : "";
    const encryptedPrivateKey = () => encryptedAccount !== null ? encryptedAccount.toString() : "";
    const passwordString = () => password !== null ? password : "";

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
                        <h3>Encrypt Account</h3>
                        <Divider/>
                        <Row justify="center">
                            <Col offset="1"><Form.Item colon={false}>
                                <Input size="large" placeholder="Password" value={passwordString()}
                                       onChange={onPasswordChange} />
                            </Form.Item></Col>
                            <Col><Button type="primary" shape="round" size="large" onClick={encryptAccount}
                                         >Encrypt Account</Button></Col>
                        </Row>
                        {
                            encryptedAccount &&
                            <Form.Item label="Ciphertext" colon={false}>
                                <Input size="large" placeholder="Password" value={encryptedPrivateKey()}
                                       addonAfter={<CopyButton data={encryptedPrivateKey()}/>} disabled/>
                            </Form.Item>
                        }
                    </Form>

            }
        </Card>
    } else {
        return <h3>
            <center>Loading...</center>
        </h3>
    }
}