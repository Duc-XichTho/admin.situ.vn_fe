import React from 'react';
import styles from './ProcessingSection.module.css';

const ProcessingSection = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className={`${styles.processingSection} ${styles.show}`}>
      <div className={styles.title}>
        🔄 Đang xử lý câu trả lời...
      </div>
      <div className={styles.processingItem}>
        <div className={styles.spinner}></div>
        <div>Visao đang chuẩn bị câu trả lời chi tiết cho bạn!</div>
      </div>
    </div>
  );
};

export default ProcessingSection; 