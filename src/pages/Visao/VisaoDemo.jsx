import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserLogin, logout } from '../../apis/userService';
import styles from './VisaoDemo.module.css';

const VisaoDemo = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await getCurrentUserLogin();
      setCurrentUser(data);
      setLoading(false);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!loading && currentUser?.email) {
      navigate('/visao');
    }
  }, [loading, currentUser, navigate]);


  const handleStartDemo = () => {
    const currentPath = '/visao';
    window.open(`${import.meta.env.VITE_API_URL}/login?redirect=${encodeURIComponent(currentPath)}`, '_self');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    window.location.reload();
  };

  if (loading) return null;

  return (
    <div className={styles.demoContainer}>
      <div className={styles.demoContent}>
        <h1 className={styles.title}>🎓 Nền tảng kiến thức khám phá thế hệ mới dành cho trẻ em Việt Nam</h1>
        
        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.icon}>🤔</span>
            <h3>AI cho trẻ em</h3>
            <p>Trẻ có thể đặt câu hỏi mong muốn bên cạnh hàng nghìn câu hỏi sẵn có</p>
          </div>
          
          <div className={styles.feature}>
            <span className={styles.icon}>🎯</span>
            <h3>Phù hợp độ tuổi</h3>
            <p>Nội dung và ngôn ngữ dễ hiểu, phù hợp cho lứa tuổi tiểu học</p>
          </div>
          
          <div className={styles.feature}>
            <span className={styles.icon}>💡</span>
            <h3>Gợi ý thông minh</h3>
            <p>Hệ thống gợi ý câu hỏi khi bạn đang gõ</p>
          </div>
          
          <div className={styles.feature}>
            <span className={styles.icon}>📝</span>
            <h3>Đọc, nghe, hiểu</h3>
            <p>Đọc hoặc nghe và làm bài khám phá để được Vì sao chấm điểm</p>
          </div>
        </div>

        <div className={styles.actions}>
          {!currentUser && (
            <button 
              className={styles.startBtn}
              onClick={handleStartDemo}
            >
              🚀 Bắt đầu trải nghiệm Visao
            </button>
          )}
          {currentUser && (
            <button 
              className={styles.backBtn}
              onClick={handleLogout}
            >
              Đăng xuất
            </button>
          )}
        </div>

        <div className={styles.demoInfo}>
          <h3>📋 Hướng dẫn sử dụng:</h3>
          <ul>
            <li>Nhập câu hỏi "Tại sao" hoặc "Vì sao" vào ô input</li>
            <li>Chọn độ tuổi phù hợp (Tiểu học/Trung học)</li>
            <li>Click vào câu hỏi mẫu trong sidebar để thử nghiệm</li>
            <li>Sử dụng chức năng tìm kiếm để tìm câu hỏi cũ</li>
            <li>Viết bài suy ngẫm sau khi đọc câu trả lời</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VisaoDemo; 