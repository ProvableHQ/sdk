import "./App.css";
import { useEffect, useState } from "react";
import { ConfigProvider, Layout, Menu, Switch, theme, Typography } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import {
    ApiOutlined,
    CodeOutlined,
    ProfileOutlined,
    SwapOutlined,
    ToolOutlined,
    UserOutlined,
    FormatPainterOutlined,
    FireOutlined,
} from "@ant-design/icons";

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
function App() {
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
            <Layout style={{ minHeight: "100vh" }}>
                <Sider breakpoint="lg" collapsedWidth="0" theme="light">
                    <Typography.Title
                        level={4}
                        alt="Aleo SDK Logo"
                        style={{
                            margin: "16px",
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Aleo SDK
                    </Typography.Title>
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
        </ConfigProvider>
    );
}

export default App;
