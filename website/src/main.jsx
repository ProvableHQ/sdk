import "./App.css";
import { useEffect, useState } from "react";
import {App, Button, ConfigProvider, Input, Layout, Menu, Modal, Switch, theme, Typography} from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import {
    ApiOutlined,
    CodeOutlined,
    ProfileOutlined,
    SwapOutlined,
    ToolOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { WasmLoadingMessage } from "./components/WasmLoadingMessage.jsx";

const { Content, Footer, Sider } = Layout;

const menuItems = [
    {
        label: <Link to="/account">Account</Link>,
        key: "/account",
        icon: <UserOutlined />,
    },
    {
        label: <Link to="/record">Record</Link>,
        key: "/record",
        icon: <ProfileOutlined />,
    },
    {
        label: <Link to="/rest">REST API</Link>,
        key: "/rest",
        icon: <ApiOutlined />,
    },
    {
        label: <Link to="/advanced">Advanced</Link>,
        key: "/advanced",
        icon: <ToolOutlined />,
    },
    {
        label: <Link to="/develop">Develop</Link>,
        key: "/develop",
        icon: <CodeOutlined />,
    },
    {
        label: <Link to="/transfer">Transfer</Link>,
        key: "transfer",
        icon: <SwapOutlined />,
    },
];

const DEFAULT_PEER_URL = "https://api.explorer.aleo.org/v1";
function Main() {
    const [menuIndex, setMenuIndex] = useState("account");

    const navigate = useNavigate();
    const location = useLocation();
    const onClick = (e) => {
        navigate(e.key);
    };

    useEffect(() => {
        setMenuIndex(location.pathname);
        if (location.pathname === "/") {
            navigate("/account");
        }
    }, [location, navigate]);

    const [darkMode, setDarkMode] = useState(true);

    // Default host modal
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [defaultPeerURL, setdefaultPeerURL] = useState(localStorage.getItem('defaultPeerURL') || DEFAULT_PEER_URL);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleOk = () => {
        localStorage.setItem('defaultPeerURL', defaultPeerURL); // Save to localStorage
        setIsModalVisible(false);
        navigate(0);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleChange = (e) => {
        setdefaultPeerURL(e.target.value);
    };

    const handleReset = () => {
        setdefaultPeerURL(DEFAULT_PEER_URL);
        localStorage.setItem('defaultPeerURL', DEFAULT_PEER_URL); // Reset to default in localStorage
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: darkMode
                    ? theme.darkAlgorithm
                    : theme.defaultAlgorithm,
                token: {
                    colorPrimary: "#18e48f",
                },
            }}
        >
            <App>
                <WasmLoadingMessage />
                <Layout style={{ minHeight: "100vh" }}>
                    <Sider breakpoint="lg" collapsedWidth="0" theme="light">
                        <img
                            src={
                                darkMode
                                    ? "../public/aleosdklight.svg"
                                    : "../public/aleosdkdark.svg"
                            }
                            alt="Aleo SDK Logo"
                            style={{
                                height: "32px",
                                margin: "16px",
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                            }}
                        />
                        <Menu
                            theme="light"
                            mode="inline"
                            selectedKeys={[menuIndex]}
                            items={menuItems}
                            onClick={onClick}
                        />
                        <Switch
                            style={{
                                marginTop: "24px",
                                marginLeft: "24px",
                            }}
                            checked={darkMode}
                            onChange={(value) => setDarkMode(value)}
                            checkedChildren="Dark"
                            unCheckedChildren="Light"
                        />
                        <Button
                            style={{
                                marginTop: "24px",
                                marginLeft: "24px",
                            }}
                            type="primary"
                            onClick={showModal}
                        >
                            Default Peer URL
                        </Button>
                        <Modal
                            title="Set Peer URL"
                            open={isModalVisible}
                            onOk={handleOk}
                            onCancel={handleCancel}
                            footer={[
                                <Button key="reset" onClick={handleReset}>
                                    Reset
                                </Button>,
                                <Button key="back" onClick={handleCancel}>
                                    Cancel
                                </Button>,
                                <Button key="submit" type="primary" onClick={handleOk}>
                                    OK
                                </Button>,
                            ]}
                        >
                            <Typography.Text type="secondary">
                                Example: http://your.network.peer:3033
                            </Typography.Text>
                            <Input
                                value={defaultPeerURL}
                                onChange={handleChange}
                                placeholder="Enter Peer URL"
                            />
                        </Modal>
                    </Sider>
                    <Layout>
                        <Content style={{ padding: "50px 50px" }}>
                            <Outlet />
                        </Content>
                        <Footer style={{ textAlign: "center" }}>
                            Visit the{" "}
                            <a href="https://github.com/AleoHQ/sdk">
                                Aleo SDK Github repo
                            </a>
                            .
                        </Footer>
                    </Layout>
                </Layout>
            </App>
        </ConfigProvider>
    );
}

export default Main;
