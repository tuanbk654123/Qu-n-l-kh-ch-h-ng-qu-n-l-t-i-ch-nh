import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import './index.css';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, canAccessUsersModule, canAccessPermissions } = useAuth();

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      {
        key: '/customers',
        icon: <UserOutlined />,
        label: 'Quản lý khách hàng',
      },
      {
        key: '/costs',
        icon: <DollarOutlined />,
        label: 'Quản lý chi phí',
      },
    ];

    if (canAccessUsersModule()) {
      items.push({
        key: '/users',
        icon: <TeamOutlined />,
        label: 'Quản lý nhân viên',
      });
    }

    // Chỉ admin và CEO mới thấy menu Phân quyền
    if (canAccessPermissions()) {
      items.push({
        key: '/permissions',
        icon: <SafetyCertificateOutlined />,
        label: 'Phân quyền',
      });
    }

    return items;
  };

  const userMenuItems = [
    {
      key: 'account',
      icon: <SettingOutlined />,
      label: 'Tài khoản của tôi',
      onClick: () => navigate('/my-account'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={250}
      >
        <div className="logo">
          <h2 style={{ color: '#1890ff', padding: '16px', margin: 0 }}>
            {collapsed ? 'QLNS' : 'Quản lý Công ty'}
          </h2>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            Hệ thống Quản lý Công ty
          </h1>
          <Space>
            <span style={{ color: '#666' }}>
              {user?.fullName || user?.username}
            </span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px', background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;

