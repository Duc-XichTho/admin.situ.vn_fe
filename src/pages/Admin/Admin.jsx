import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    RobotOutlined,
    EditOutlined,
    FileTextOutlined,
    UserOutlined,
    BarChartOutlined,
    SettingOutlined
} from '@ant-design/icons';
import './Admin.module.css';
import css from './Admin.module.css';
import { ROUTES } from '../../CONST';

const { Sider, Content } = Layout;

const Admin = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            key: 'ai-gen',
            icon: <RobotOutlined />,
            label: 'AI Generation',
            onClick: () => navigate(ROUTES.ADMIN)
        },
        {
            key: 'homepage-content',
            icon: <EditOutlined />,
            label: 'Homepage Content',
            onClick: () => navigate('/admin/homepage-content')
        },
        {
            key: 'page-management',
            icon: <FileTextOutlined />,
            label: 'Page Management',
            onClick: () => navigate(ROUTES.MANAGEMENT)
        },
        {
            key: 'user-management',
            icon: <UserOutlined />,
            label: 'User Management',
            onClick: () => navigate(ROUTES.USER_MANAGEMENT)
        },
        {
            key: 'k9-management',
            icon: <BarChartOutlined />,
            label: 'K9 Management',
            onClick: () => navigate(ROUTES.K9_MANAGEMENT)
        },
        {
            key: 'company-report',
            icon: <SettingOutlined />,
            label: 'Company Report',
            onClick: () => navigate(ROUTES.COMPANY_REPORT)
        }
    ];

    // Determine the selected key based on current location
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path === ROUTES.ADMIN) return 'ai-gen';
        if (path === '/admin/homepage-content') return 'homepage-content';
        if (path === ROUTES.MANAGEMENT) return 'page-management';
        if (path === ROUTES.USER_MANAGEMENT) return 'user-management';
        if (path === ROUTES.K9_MANAGEMENT) return 'k9-management';
        if (path === ROUTES.COMPANY_REPORT) return 'company-report';
        return 'ai-gen';
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#fff' }}>
            <Sider width={250} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                    <h2 style={{ margin: 0, color: '#1890ff' }}>Admin Panel</h2>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    style={{ height: '100%', borderRight: 0 }}
                    items={menuItems}
                />
            </Sider>
            <Content style={{ padding: '24px', minHeight: 280, background: '#f5f5f5' }}>
                <Outlet />
            </Content>
        </Layout>
    );
};

export default Admin;
