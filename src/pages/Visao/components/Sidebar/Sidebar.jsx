import React, { useState } from 'react';
import HistoryPanel from './HistoryPanel/HistoryPanel';
import PremadePanel from './PremadePanel/PremadePanel';
import styles from './Sidebar.module.css';

const Sidebar = ({ onQuestionSelect, onHistoryItemClick, currentQuestion, questions = [], history = [] , setCurrentQuestion}) => {
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isPremadeCollapsed, setIsPremadeCollapsed] = useState(false);

  const toggleHistory = () => {
    setIsHistoryCollapsed(!isHistoryCollapsed);
  };

  const togglePremade = () => {
    setIsPremadeCollapsed(!isPremadeCollapsed);
  };

  // Tính toán class cho từng panel wrapper
  const getHistoryWrapperClass = () => {
    let baseClass = styles.panelWrapperHistory;
    if (isHistoryCollapsed) {
      baseClass += ` ${styles.collapsed}`;
    }
    if (isPremadeCollapsed && !isHistoryCollapsed) {
      baseClass += ` ${styles.expanded}`;
    }
    return baseClass;
  };

  const getPremadeWrapperClass = () => {
    let baseClass = styles.panelWrapperPremade;
    if (isPremadeCollapsed) {
      baseClass += ` ${styles.collapsed}`;
    }
    if (isHistoryCollapsed && !isPremadeCollapsed) {
      baseClass += ` ${styles.expanded}`;
    }
    return baseClass;
  };

  return (
    <div className={styles.sidebar}>
      <div className={getHistoryWrapperClass()}>
        <HistoryPanel 
          onQuestionSelect={onQuestionSelect}
          onHistoryItemClick={onHistoryItemClick}
          currentQuestion={currentQuestion}
          history={history}
          isCollapsed={isHistoryCollapsed}
          onToggleCollapse={toggleHistory}
        />
      </div>
      <div className={getPremadeWrapperClass()}>
        <PremadePanel 
          onQuestionSelect={onQuestionSelect}
          currentQuestion={currentQuestion}
          questions={questions}
          isCollapsed={isPremadeCollapsed}
          onToggleCollapse={togglePremade}
          setCurrentQuestion={setCurrentQuestion}
        />
      </div>
    </div>
  );
};

export default Sidebar; 