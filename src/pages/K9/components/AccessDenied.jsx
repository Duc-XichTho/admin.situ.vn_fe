import React from 'react';
import { LockOutlined } from '@ant-design/icons';

const AccessDenied = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '40px',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '80px',
        marginBottom: '20px',
        color: '#ff4d4f'
      }}>
        <LockOutlined />
      </div>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '600',
        color: '#262626',
        marginBottom: '12px'
      }}>
        Bạn chưa được cấp quyền truy cập
      </h2>
      <p style={{
        fontSize: '16px',
        color: '#8c8c8c',
        maxWidth: '500px',
        lineHeight: '1.6'
      }}>
        Tài liệu này không được chia sẻ công khai và chỉ dành cho các nhóm người dùng được cấp quyền.
      </p>
      <div style={{
        marginTop: '30px',
        fontSize: '14px',
        color: '#595959',
        fontStyle: 'italic'
      }}>
        Liên hệ quản trị viên để được cấp quyền truy cập
      </div>
    </div>
  );
};

export default AccessDenied;

