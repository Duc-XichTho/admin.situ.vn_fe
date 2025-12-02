import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    FileTextOutlined,
    ShareAltOutlined,
    SettingOutlined
} from '@ant-design/icons';

const { Sider, Content } = Layout;

export default function PostManagement() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            key: 'posts',
            icon: <FileTextOutlined />,
            label: 'Danh sách bài viết',
        },
        // {
        //     key: 'shared',
        //     icon: <ShareAltOutlined />,
        //     label: 'Bài viết đã chia sẻ',
        // },
        // {
        //     key: 'settings',
        //     icon: <SettingOutlined />,
        //     label: 'Cài đặt chia sẻ',
        // },
    ];

    const handleMenuClick = ({ key }) => {
        navigate(`/admin/section-page/${key}`);
    };

    return (
        <Layout style={{ minHeight: 'calc(100vh - 100px)', background: '#fff' }}>
            <Sider width={250} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname.split('/').pop()]}
                    style={{ height: '100%', borderRight: 0 }}
                    items={menuItems}
                    onClick={handleMenuClick}
                />
            </Sider>
            <Content style={{ padding: '24px', minHeight: 280 }}>
                <Outlet />
            </Content>
        </Layout>
    );
} 