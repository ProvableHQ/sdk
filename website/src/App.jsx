import './App.css';
import React, {useState} from 'react';
import {ConfigProvider, Layout, Menu, theme} from 'antd';
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

import {
    ApiOutlined, CodeOutlined,
    ProfileOutlined, SwapOutlined,
    ToolOutlined,
    UserOutlined,
} from '@ant-design/icons';

const { Content, Footer, Sider } = Layout;

function App() {
    const [menuIndex, setMenuIndex] = useState('account');
    const onClick = (e) => {
        setMenuIndex(e.key);
    };

    const menuItems = [
        {
            label: 'Account',
            key: 'account',
            icon: <UserOutlined />,
        },
        {
            label: 'Record',
            key: 'record',
            icon: <ProfileOutlined />,
        },
        {
            label: 'REST API',
            key: 'rest',
            icon: <ApiOutlined />,
        },
        {
            label: 'Advanced',
            key: 'advanced',
            icon: <ToolOutlined />,
        },
        {
            label: 'Develop',
            key: 'develop',
            icon: <CodeOutlined />,
        },
        {
            label: 'Transfer',
            key: 'transfer',
            icon: <SwapOutlined />,
        }
    ];

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: "#ffa978"
                }
            }}
        >
            <Layout style={{minHeight: '100vh'}}>
                <Sider
                    breakpoint="lg"
                    collapsedWidth="0"
                    theme="light"
                >
                    <img src="../public/aleosdk.svg" alt="Aleo SDK Logo" className="logo"/>
                    <Menu
                        mode="inline"
                        selectedKeys={[menuIndex]}
                        items={menuItems}
                        onClick={onClick}
                    />
                </Sider>
                <Layout>
                    <Content style={{padding: '50px 50px'}}>
                        {
                            menuIndex === 'account' &&
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
                            menuIndex === 'record' &&
                            <>
                                <DecryptRecord/>
                            </>
                        }
                        {
                            menuIndex === 'rest' &&
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
                            menuIndex === 'advanced' &&
                            <>
                                <EncryptAccount/>
                                <br/>
                                <DecryptAccount/>
                            </>
                        }
                        {
                            menuIndex === 'develop' &&
                            <>
                                <Execute/>
                                <br/>
                                <Deploy/>
                            </>
                        }
                        {
                            menuIndex === 'transfer' &&
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
            </Layout>
        </ConfigProvider>
    );
}

export default App;
