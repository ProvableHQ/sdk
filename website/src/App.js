import './App.css';
import React, { useState, useEffect } from 'react';

import { Button, Card, Col, Divider, Form, Input, Row } from 'antd';

const NewAccount = () => {
    const [aleo, setAleo] = useState(null);
    const [account, setAccount] = useState(null);

    useEffect(() => {
        if (aleo === null) {
            import('aleo-wasm').then(module => {
                setAleo(module);
            })
        }
    }, []);

    const generate = async () => setAccount(await new aleo.Account());
    const clear = () => setAccount(null);

    if (aleo !== null) {
        const privateKey = () => account !== null ? account.to_private_key() : "";
        const viewKey = () => account !== null ? account.to_view_key() : "";
        const address = () => account !== null ? account.to_address() : "";

        return <Card title="Generate a New Account" style={{ width: "90%" }}>
            <Form layout="vertical">
                <Form.Item>
                    <Row justify="center">
                        <Col><Button type="primary" shape="round" onClick={generate}>Generate</Button></Col>
                        <Col offset="1"><Button shape="round" onClick={clear}>Clear</Button></Col>
                    </Row>
                </Form.Item>
                {
                    (account !== null) ?
                        <>
                            <Divider />

                            <Form.Item>
                                <Input size="large" placeholder="Private Key" value={privateKey()} disabled />
                            </Form.Item>
                            <Form.Item>
                                <Input size="large" placeholder="View Key" value={viewKey()} disabled />
                            </Form.Item>
                            <Form.Item>
                                <Input size="large" placeholder="Address" value={address()} disabled />
                            </Form.Item>
                        </>
                        : null
                }
            </Form>
        </Card>
    } else {
        return <h2>Loading...</h2>
    }
}

const AccountFromPrivateKey = () => {
    const [aleo, setAleo] = useState(null);
    const [account, setAccount] = useState(null);

    useEffect(() => {
        if (aleo === null) {
            import('aleo-wasm').then(module => {
                setAleo(module);
            })
        }
    }, []);

    const onChange = (event) => {
        setAccount(null);
        try {
            setAccount(aleo.Account.from_private_key(event.target.value))
        } catch (error) {
            console.error(error);
        }
    }

    if (aleo !== null) {
        const viewKey = () => account !== null ? account.to_view_key() : "";
        const address = () => account !== null ? account.to_address() : "";

        return <Card title="Load Account from Private Key" style={{ width: "90%" }}>
            <div style={{ marginBottom: 16 }}>
                <Input name="privateKey" size="large" placeholder="Private Key" allowClear onChange={onChange} />
            </div>
            {
                (account !== null) ?
                    <>
                        <Divider />

                        <Form layout="vertical">
                            <Form.Item>
                                <Input size="large" placeholder="View Key" value={viewKey()} disabled />
                            </Form.Item>
                            <Form.Item>
                                <Input size="large" placeholder="Address" value={address()} disabled />
                            </Form.Item>
                        </Form>
                    </>
                    : null
            }
        </Card>
    } else {
        return <h2>Loading...</h2>
    }
}

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <NewAccount />
                <br/>
                <AccountFromPrivateKey />
            </header>
        </div>
    );
}

export default App;
