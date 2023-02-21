import './App.css';
import React, {useState} from 'react';

import {Layout, Menu} from 'antd';
import {AccountFromPrivateKey} from "./tabs/account/AccountFromPrivateKey";
import {DecryptRecord} from "./tabs/record/DecryptRecord";
import {GetBlockByHash} from "./tabs/rest/GetBlockByHash";
import {GetBlockByHeight} from "./tabs/rest/GetBlockByHeight";
import {NewAccount} from "./tabs/account/NewAccount";
import {GetLatestBlock} from "./tabs/rest/GetLatestBlock";
import {GetLatestBlockHeight} from "./tabs/rest/GetLatestBlockHeight";
import {GetProgram} from "./tabs/rest/GetProgram";
import {GetTransaction} from "./tabs/rest/GetTransaction";

const {Header, Content, Footer} = Layout;

function App() {
    const [menuIndex, setMenuIndex] = useState(0);

    return (
        <Layout className="layout" style={{minHeight: '100vh'}}>
            <Header className="header">
                <div className="logo"/>
                <Menu mode="horizontal" defaultSelectedKeys={['1']}>
                    <Menu.Item key="1" onClick={() => setMenuIndex(0)}>Account</Menu.Item>
                    <Menu.Item key="2" onClick={() => setMenuIndex(1)}>Record</Menu.Item>
                    <Menu.Item key="3" onClick={() => setMenuIndex(2)}>REST API</Menu.Item>
                </Menu>
            </Header>
            <Content style={{padding: '50px 50px'}}>
                {
                    menuIndex === 0 &&
                    <>
                        <NewAccount/>
                        <br/>
                        <AccountFromPrivateKey/>
                    </>
                }
                {
                    menuIndex === 1 &&
                    <>
                        <DecryptRecord/>
                    </>
                }
                {
                    menuIndex === 2 &&
                    <>
                        <GetLatestBlockHeight/>
                        <br/>
                        <GetLatestBlock/>
                        <br/>
                        <GetBlockByHeight/>
                        <br/>
                        <GetBlockByHash/>
                        <br/>
                        <GetProgram/>
                        <br/>
                        <GetTransaction/>
                    </>
                }
            </Content>
            <Footer style={{textAlign: 'center'}}>Visit the <a href="https://github.com/AleoHQ/aleo">Aleo Github
                repo</a>.</Footer>
        </Layout>
    );
}

export default App;
