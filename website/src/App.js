import './App.css';
import React, { useState, useEffect } from 'react';
import copyToClipboard from 'copy-to-clipboard';

import { Button, Card, Col, Divider, Form, Input, Layout, Menu, Row } from 'antd';
import { CopyOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

const Spinner = () => <LoadingOutlined style={{ fontSize: 24 }} spin />;

const CopyButton = (props) => {
    const [copySuccess, setCopySuccess] = useState(false);

    const copy = () => {
        copyToClipboard(props.data);
        setCopySuccess(true);
    }

    if (copySuccess) {
        return <Button icon={<CheckCircleOutlined />} onClick={copy} />
    } else {
        return <Button icon={<CopyOutlined />} onClick={copy} />
    }
}

const NewAccount = () => {
    const [aleo, setAleo] = useState(null);
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (aleo === null) {
            import('aleo-wasm').then(module => setAleo(module));
        }
    }, []);

    const generateAccount = async () => {
        setLoading(true);
        setTimeout(() => {
            setAccount(new aleo.Account());
            setLoading(false);
        }, 50);
    }
    const clear = () => setAccount(null);

    const privateKey = () => account !== null ? account.to_private_key() : "";
    const viewKey = () => account !== null ? account.to_view_key() : "";
    const address = () => account !== null ? account.to_address() : "";

    const layout = {
        labelCol: { span: 3 },
        wrapperCol: { span: 21 },
    };

    if (aleo !== null) {
        return <Card title="Create a New Account" style={{ width: "100%" }}>
            <Row justify="center">
                <Col><Button type="primary" shape="round" size="large" onClick={generateAccount}>{ loading ? <Spinner/> : "Generate" }</Button></Col>
                <Col offset="1"><Button shape="round" size="large" onClick={clear}>Clear</Button></Col>
            </Row>
            {
                (account !== null) ?
                    <Form {...layout}>
                        <Divider />
                        <Form.Item label="Private Key">
                            <Input size="large" placeholder="Private Key" value={privateKey()} addonAfter={<CopyButton data={privateKey()} />} disabled />
                        </Form.Item>
                        <Form.Item label="View Key">
                            <Input size="large" placeholder="View Key" value={viewKey()} addonAfter={<CopyButton data={viewKey()} />} disabled />
                        </Form.Item>
                        <Form.Item label="Address">
                            <Input size="large" placeholder="Address" value={address()} addonAfter={<CopyButton data={address()} />} disabled />
                        </Form.Item>
                    </Form>
                    : null
            }
        </Card>
    } else {
        return <h3>Loading...</h3>
    }
}

const AccountFromPrivateKey = () => {
    const [aleo, setAleo] = useState(null);
    const [account, setAccount] = useState(null);

    useEffect(() => {
        if (aleo === null) {
            import('aleo-wasm').then(module => setAleo(module));
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

        return <Card title="Load Account from Private Key" style={{ width: "100%" }}>
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
        return <h3>Loading...</h3>
    }
}

function App() {
    return (
        <Layout className="layout">
            <Header>
                <div className="logo" />
                <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
                    <Menu.Item key="1">Account</Menu.Item>
                    <Menu.Item key="2">TBD</Menu.Item>
                    {/*<Menu.Item key="3">nav 3</Menu.Item>*/}
                </Menu>
            </Header>
            <Content style={{ padding: '50px 50px' }}>
                <NewAccount />
                <br/>
                <AccountFromPrivateKey />
            </Content>
            <Footer style={{ textAlign: 'center' }}>Visit the <a href="https://github.com/AleoHQ/aleo">Aleo Github repo</a>.</Footer>
        </Layout>
    );
}

export default App;
