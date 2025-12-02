import React, { useState, useEffect } from 'react';
import LevelSelector from './LevelSelector/LevelSelector';
import PromptInput from './PromptInput/PromptInput';
import ProcessingSection from './ProcessingSection/ProcessingSection';
import ConversationLog from './ConversationLog/ConversationLog';
import styles from './MainArea.module.css';

const MainArea = ({ 
  onSubmitQuestion, 
  currentQuestion, 
  isProcessing, 
  currentLevel, 
  onLevelChange,
  inputValue,
  onInputChange,
  currentAnswer,
  questions = [],
  userPermissions = { canCustomQuestion: false, canUseVoice: false, canUseReflection: false }
}) => {
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const [selectedQuestionInfo, setSelectedQuestionInfo] = useState(null);

  // Mapping level values to Vietnamese labels
  const getLevelLabel = (level) => {
    const levelMap = {
      'elementary': 'Cơ bản',
      'intermediate': 'Trung bình', 
      'advanced': 'Nâng cao'
    };
    return levelMap[level] || level;
  };

  // Get level color
  const getLevelColor = (level) => {
    const colorMap = {
      'elementary': '#52c41a',
      'intermediate': '#fa8c16', 
      'advanced': '#f5222d'
    };
    return colorMap[level] || '#1890ff';
  };

  useEffect(() => {
    if (inputValue.length > 3) {
      const match = questions.find(q => 
        q.question.toLowerCase().includes(inputValue.toLowerCase()) &&
        q.show === true
      );
      setSelectedQuestionInfo(match || null);

      if (match && inputValue.toLowerCase() !== match.question.toLowerCase()) {
        setSuggestionText(match.question);
        setSuggestionVisible(true);
        return;
      }
    }
    setSuggestionVisible(false);
  }, [inputValue, questions]);

  const handleSuggestionClick = () => {
    onInputChange(suggestionText);
    setSuggestionVisible(false);
    // Giữ lại thông tin câu hỏi đã chọn
    const selectedQuestion = questions.find(q => q.question == suggestionText);
    setSelectedQuestionInfo(selectedQuestion || null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Tab' && suggestionVisible) {
      e.preventDefault();
      onInputChange(suggestionText);
      setSuggestionVisible(false);
      // Giữ lại thông tin câu hỏi đã chọn
      const selectedQuestion = questions.find(q => q.question === suggestionText);
      setSelectedQuestionInfo(selectedQuestion || null);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    onSubmitQuestion(inputValue);
    onInputChange('');
    setSelectedQuestionInfo(null); // Reset thông tin câu hỏi khi submit
  };


  return (
    <div className={styles.mainArea}>
      <div className={styles.promptSection}>
        <div className={styles.title}>
          Đặt câu hỏi cho Visao! 🤖
        </div>
        
        {/* <LevelSelector 
          currentLevel={currentLevel}
          onLevelChange={onLevelChange}
        /> */}

        {/* Hiển thị tags thông tin trên input */}
        {selectedQuestionInfo && (selectedQuestionInfo.category || selectedQuestionInfo.level) && (
          <div className={styles.questionInfoTags}>
            {selectedQuestionInfo.category && (
              <span className={styles.infoTag}>
                <span className={styles.tagIcon}>🏷️</span>
                {selectedQuestionInfo.category}
              </span>
            )}
            {selectedQuestionInfo.level && (
              <span 
                className={styles.infoTag}
                style={{ 
                  backgroundColor: getLevelColor(selectedQuestionInfo.level), 
                  color: 'white' 
                }}
              >
                <span className={styles.tagIcon}>⭐</span>
                {getLevelLabel(selectedQuestionInfo.level)}
              </span>
            )}
          </div>
        )}

        <PromptInput 
          value={inputValue}
          onChange={onInputChange}
          onKeyPress={handleKeyPress}
          onSubmit={handleSubmit}
          userPermissions={userPermissions}
        />
        
        {!userPermissions.canCustomQuestion && (
          <div className={styles.permissionNotice}>
            <div className={styles.permissionContent}>
              <div className={styles.permissionTitle}>
                🔒 Quyền hạn bị giới hạn
              </div>
              <div className={styles.permissionText}>
                Bạn chỉ có thể chọn câu hỏi từ danh sách có sẵn. 
                <br />
                Nâng cấp lên VIP để sử dụng tất cả tính năng!
              </div>
            </div>
          </div>
        )}
        
        {!suggestionVisible && (
          <>
            {!currentQuestion ? (
              <button 
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={!userPermissions.canCustomQuestion && !inputValue.trim()}
              >
                Khám phá! 🚀
              </button>
            ) : (
              <button 
                className={styles.newQuestionBtn}
                onClick={handleSubmit}
              >
                + Câu hỏi mới
              </button>
            )}
          </>
        )}
        {suggestionVisible && (
          <div className={styles.suggestionPopup + ' ' + styles.show}>
            <div className={styles.suggestionContent}>
              <div className={styles.suggestionTitle}>
                💡 Gợi ý từ Visao:
              </div>
              <div 
                className={styles.suggestionText}
                onClick={handleSuggestionClick}
                style={{ cursor: 'pointer' }}
              >
                {suggestionText}
              </div>
              <div className={styles.suggestionHint}>
                Nhấn Tab để chọn hoặc tiếp tục gõ nhé!
              </div>
            </div>
          </div>
        )}
        {isProcessing ? (
          <ProcessingSection isVisible={true} />
        ) : (
          <ConversationLog isVisible={!!currentAnswer} />
        )}
      </div>
    </div>
  );
};

export default MainArea; 