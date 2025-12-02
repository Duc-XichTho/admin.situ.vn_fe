import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, Avatar, Space } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, DownOutlined, TeamOutlined } from '@ant-design/icons';
import { ROUTES } from '../../../../CONST';
import { MyContext } from '../../../../MyContext';
import styles from './Header.module.css';
import { logout } from '../../../../apis/userService';
import TimeRangeSelector from './TimeRangeSelector';

const Header = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(MyContext);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleMenuClick = ({ key }) => {
    switch (key) {
      case 'admin':
        navigate(ROUTES.ADMIN);
        break;
      case 'management':
        navigate(ROUTES.MANAGEMENT);
        break;
      case 'user-management':
        navigate(ROUTES.USER_MANAGEMENT);
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
    setDropdownVisible(false);
  };

  // Xử lý khi chọn khoảng thời gian
  const handleTimeRangeSelect = (timeRange, existingAnalysis) => {
  };

  const getUserRoleDisplay = () => {
    if (currentUser?.isAdmin) {
      return 'Admin';
    }
    
    try {
      if (currentUser?.info) {
        const userInfo = typeof currentUser.info === 'string' ? JSON.parse(currentUser.info) : currentUser.info;
        if (userInfo.userGroup === 'vip') {
          return 'VIP';
        }
        if (userInfo.userGroup === 'premium') {
          return 'PREMIUM';
        } if (userInfo.userGroup === 'normal') {
          return 'USER';
        }
      }
    } catch (error) {
      console.warn('Error parsing user info:', error);
    }
    
    return 'User';
  };

  const getUserRoleColor = () => {
    if (currentUser?.isAdmin) {
      return '#ff4757'; // Red for Admin
    }
    
    try {
      if (currentUser?.info) {
        const userInfo = typeof currentUser.info === 'string' ? JSON.parse(currentUser.info) : currentUser.info;
        if (userInfo.userGroup === 'vip') {
          return '#ffa502'; // Orange for VIP
        }
      }
    } catch (error) {
      console.warn('Error parsing user info:', error);
    }
    
    return '#2ed573'; // Green for Normal User
  };

  const userMenuItems = currentUser?.isAdmin ? [
    {
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Admin Panel',
    },
    {
      key: 'management',
      icon: <SettingOutlined />,
      label: 'Quản lý Visao',
    },
    {
      key: 'user-management',
      icon: <TeamOutlined />,
      label: 'Quản lý người dùng',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
    },
  ] : [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
    },
  ];

  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
          <div className={styles.logo}>
            <img src="App.png" alt="Logo Visao" />
          </div>

        
        <TimeRangeSelector
          onTimeRangeSelect={handleTimeRangeSelect}
          currentUser={currentUser}
          className={styles.timeRangeSelector}
        />
      </div>
      
      <div className={styles.userSection}>
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: handleMenuClick,
          }}
          open={dropdownVisible}
          onOpenChange={setDropdownVisible}
          placement="bottomRight"
          trigger={['click']}
        >
          <div className={styles.userInfo}>
            <Avatar 
              size={40} 
              icon={<UserOutlined />}
              className={styles.userAvatar}
            />
            <div className={styles.userDetails}>
              <div className={styles.userName}>
                {currentUser?.name || currentUser?.email || 'User'}
              </div>
              <div 
                className={styles.userRole}
                style={{ '--user-role-color': getUserRoleColor() }}
              >
                {getUserRoleDisplay()}
              </div>
            </div>
            <DownOutlined className={styles.dropdownIcon} />
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default Header; 