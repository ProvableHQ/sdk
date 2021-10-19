import './App.css';
import React from 'react';

import {Layout, Menu} from 'antd';
import {NewAccount} from "./NewAccount";
import {AccountFromPrivateKey} from "./AccountFromPrivateKey";

const { Header, Content, Footer } = Layout;

function App() {
    return (
        <Layout className="layout" style={{ minHeight: '100vh' }}>
            <Header className="header">
                <div className="logo" />
                <Menu mode="horizontal" defaultSelectedKeys={['1']}>
                    <Menu.Item key="1">Account</Menu.Item>
                    <Menu.Item key="2">
                        <a href="./dev/bench" target="_blank" rel="noopener noreferrer">
                            Benchmarks
                        </a>
                    </Menu.Item>
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
