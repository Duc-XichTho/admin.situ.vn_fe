import React from 'react';
import styles from './ConversationLog.module.css';

const ConversationLog = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className={`${styles.conversationLog} ${styles.show}`}>
      <strong>🎉 Hoàn thành!</strong> Visao đã trả lời xong câu hỏi của bạn! Hãy xem phần bên phải nhé! 
    </div>
  );
};

export default ConversationLog; 