import './App.css';
import React, {useState} from 'react';
import {Layout, Menu} from 'antd';
import {AccountFromPrivateKey} from "./tabs/account/AccountFromPrivateKey";
import {DecryptAccount} from "./tabs/advanced/DecryptAccount";
import {DecryptRecord} from "./tabs/record/DecryptRecord";
import {Deploy} from "./tabs/develop/Deploy";
import {EncryptAccount} from "./tabs/advanced/EncryptAccount";
import {Execute} from "./tabs/develop/Execute";
import {GetBlockByHash} from "./tabs/rest/GetBlockByHash";
import {GetBlockByHeight} from "./tabs/rest/GetBlockByHeight";
import {GetLatestBlock} from "./tabs/rest/GetLatestBlock";
import {GetLatestBlockHeight} from "./tabs/rest/GetLatestBlockHeight";
import {GetProgram} from "./tabs/rest/GetProgram";
import {GetTransaction} from "./tabs/rest/GetTransaction";
import {NewAccount} from "./tabs/account/NewAccount";
import {SignMessage} from "./tabs/account/SignMessage";
import {Transfer} from "./tabs/develop/Transfer";
import {VerifyMessage} from "./tabs/account/VerifyMessage";
import {Join} from "./tabs/develop/Join";
import {Split} from "./tabs/develop/Split";

const {Header, Content, Footer} = Layout;

function App() {
    const [menuIndex, setMenuIndex] = useState(0);

    return (
        <Layout className="layout" style={{minHeight: '100vh'}}>
            <Header className="header" style={{height: 67}}>
                <div className="logo"/>
                <Menu mode="horizontal" defaultSelectedKeys={['1']}>
                    <Menu.Item key="1" onClick={() => setMenuIndex(0)}>Account</Menu.Item>
                    <Menu.Item key="2" onClick={() => setMenuIndex(1)}>Record</Menu.Item>
                    <Menu.Item key="3" onClick={() => setMenuIndex(2)}>REST API</Menu.Item>
                    <Menu.Item key="4" onClick={() => setMenuIndex(3)}>Advanced</Menu.Item>
                    <Menu.Item key="5" onClick={() => setMenuIndex(4)}>Develop</Menu.Item>
                    <Menu.Item key="6" onClick={() => setMenuIndex(5)}>Transfer</Menu.Item>
                </Menu>
            </Header>
            <Content style={{padding: '50px 50px'}}>
                {
                    menuIndex === 0 &&
                    <>
                        <NewAccount/>
                        <br/>
                        <AccountFromPrivateKey/>
                        <br/>
                        <SignMessage/>
                        <br/>
                        <VerifyMessage/>
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
                {
                    menuIndex === 3 &&
                    <>
                        <EncryptAccount/>
                        <br/>
                        <DecryptAccount/>
                    </>
                }
                {
                    menuIndex === 4 &&
                    <>
                        <Execute/>
                        <br/>
                        <Deploy/>
                    </>
                }
                {
                    menuIndex === 5 &&
                    <>
                        <Transfer/>
                        <br/>
                        <Split/>
                        <br/>
                        <Join/>
                    </>
                }
            </Content>
            <Footer style={{textAlign: 'center'}}>Visit the <a href="https://github.com/AleoHQ/sdk">Aleo Github
                repo</a>.</Footer>
        </Layout>
    );
}

export default App;
