import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserLogin } from '../../apis/userService.jsx';

export default function Login() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await getCurrentUserLogin();
      setCurrentUser(data);
      if (data?.id) {
        navigate('/home');
      }
    };
    fetchUser();
  }, []);

  const handleGmailLogin = () => {
    const currentPath = '/home';
    window.open(`${import.meta.env.VITE_API_URL}/login?redirect=${encodeURIComponent(currentPath)}`, '_self');
  };

  return (
    <div className={styles.loginBg}>
      <div className={styles.loginCard}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <img src="/Favicon.png" alt="Logo" style={{ width: '64px', height: '64px' }} />
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '24px', margin: 0, color: '#222' }}>Chào mừng đến với ADMIN.SITU</h1>
            <p style={{ fontSize: '14px', margin: '4px 0 0 0', color: '#666' }}>Hệ thống quản trị nội dung & điều hành Situ</p>
          </div>
        </div>
        <div className={styles.hr} />
        
        <div className={styles.loginActions}>
          <div className={styles.actionBtnWrap} style={{ width: '100%', maxWidth: '400px' }}>
            <Button
              size='large'
              className={styles.blackBtn}
              onClick={handleGmailLogin}
              block
              style={{ height: '72px' }}
            >
              <div className={styles.btnDescInBtn}>
                <span className={styles.btnDesc}>Đăng nhập với Gmail</span>
                <span className={styles.btnDescSmall}>Sử dụng tài khoản Google để truy cập</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
