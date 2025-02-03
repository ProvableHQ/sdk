import "./App.css";
import { useEffect, useState } from "react";
import { App, ConfigProvider, Layout, Menu, Switch, theme } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import {
    ApiOutlined,
    CodeOutlined,
    PlusOutlined,
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
        label: <Link to="/protocol">Protocol</Link>,
        key: "/protocol",
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
    {
        label: <Link to="/algebra">Algebra</Link>,
        key: "algebra",
        icon: <PlusOutlined />,
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
        // if (location.pathname === "/") {
        //     navigate("/account");
        // }
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
                        <h1 className={darkMode ? "headerDark": "headerLight"}>
                            <Link to="/">
                            Aleo SDK
                            </Link>
                        </h1>
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
                        <Content style={{ padding: "50px 50px", margin: "0 auto", minWidth: "850px" }}>
                            <Outlet />
                        </Content>
                        <Footer style={{ textAlign: "center", display:"flex", flexDirection: "column" }}>
                        
                            <a href="https://github.com/ProvableHQ/sdk">
                            <img src="../public/github-mark-white.png" style={{height:"24px"}}></img>
                            </a>
                            <Link to="https://sdk.betteruptime.com/" style={{color: "white"}}> <span>Status</span> </Link>
                            <Link to="/terms_of_use" style={{color: "white"}}> <span>Terms of Use</span> </Link>
                            <Link to="/privacy_policy" style={{color:"white"}}><span>Privacy Policy</span></Link>
                         
                            © 2025 Provable Inc.
                        </Footer>
                    </Layout>
                </Layout>
            </App>
        </ConfigProvider>
    );
}

export default Main;
