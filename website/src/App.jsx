import "./App.css";
import { useEffect, useState } from "react";
import { ConfigProvider, Layout, Menu, theme } from "antd";
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
        {
            label: <Link to="/program2form">Program2Form</Link>,
            key: "/program2form",
            icon: <FormatPainterOutlined />,
        },
        {
            label: <Link to="/executev2">ExecuteV2</Link>,
            key: "/executev2",
            icon: <FireOutlined />,
        },
    ];

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: "#18e48f",
                },
            }}
        >
            <Layout style={{ minHeight: "100vh" }}>
                <Sider breakpoint="lg" collapsedWidth="0" theme="light">
                    <div alt="Aleo SDK Logo" className="logo"></div>
                    <Menu
                        mode="inline"
                        selectedKeys={[menuIndex]}
                        items={menuItems}
                        onClick={onClick}
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
