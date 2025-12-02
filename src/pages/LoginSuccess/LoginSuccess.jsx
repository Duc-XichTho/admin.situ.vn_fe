import "./LoginSuccess.css";
import React, { useEffect } from "react";
import { useNavigate } from 'react-router-dom';

export default function LoginSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.close();
      navigate('/visao');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="login-success-container">
      <div className="cyber-lines"></div>
      <div className="success-card">
        <div className="success-icon">
          <div className="checkmark">
            <div className="check-line line-1"></div>
            <div className="check-line line-2"></div>
          </div>
          <div className="success-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
        </div>
        <div className="success-content">
          <h1>Đăng nhập thành công!</h1>
          <p>Đang chuyển hướng</p>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
        <div className="tech-circles">
          <div className="tech-circle"></div>
          <div className="tech-circle"></div>
          <div className="tech-circle"></div>
        </div>
      </div>
    </div>
  );
}