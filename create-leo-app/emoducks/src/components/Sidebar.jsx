import { Layout, Menu } from 'antd';
import { UserOutlined, CrownOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';

const { Sider } = Layout;

export const Sidebar = () => {
    const location = useLocation();

    const items = [
        {
            key: '/bidder',
            icon: <UserOutlined />,
            label: <Link to="/bidder">Bidder</Link>,
        },
        {
            key: '/auctioneer',
            icon: <CrownOutlined />,
            label: <Link to="/auctioneer">Auctioneer</Link>,
        }
    ];

    return (
        <Sider 
            width={200} 
            theme="light"
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                background: '#ffffff'
            }}
        >
            <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                style={{ 
                    height: '100%', 
                    borderRight: '1px solid #f0f0f0',
                    background: '#ffffff'
                }}
                items={items}
            />
        </Sider>
    );
}; 