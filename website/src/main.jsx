import "./App.css";
import { useEffect, useState } from "react";
import { App, ConfigProvider, Layout, Menu, Switch, theme } from "antd";
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

    // follow the theme of the system
    const [darkMode, setDarkMode] = useState(
        window.matchMedia("(prefers-color-scheme: dark)").matches,
    );

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
