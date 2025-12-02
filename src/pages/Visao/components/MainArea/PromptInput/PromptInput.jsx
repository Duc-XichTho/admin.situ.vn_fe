import React from 'react';
import styles from './PromptInput.module.css';

const PromptInput = ({ value, onChange, onKeyPress, onSubmit, userPermissions = { canCustomQuestion: false, canUseVoice: false, canUseReflection: false } }) => {
  const handleKeyDown = (e) => {
    onKeyPress(e);
  };

  return (
    <div className={styles.promptContainer}>
      <textarea 
        className={styles.promptBox}
        placeholder={
          userPermissions.canCustomQuestion 
            ? "Hãy đặt câu hỏi 'Tại sao' hoặc 'Vì sao' của bạn..."
            : "Chọn câu hỏi từ danh sách có sẵn hoặc nâng cấp lên VIP để hỏi tự do!"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!userPermissions.canCustomQuestion}
      />

    </div>
  );
};

export default PromptInput; 