import React from 'react';
import styles from './LevelSelector.module.css';

const LevelSelector = ({ currentLevel, onLevelChange }) => {
  const levels = [
    { id: 'elementary', label: 'Tiểu học' },
    { id: 'highschool', label: 'Trung học' }
  ];

  return (
    <div className={styles.levelSelector}>
      <span className={styles.label}>Độ tuổi:</span>
      {levels.map(level => (
        <button
          key={level.id}
          className={`${styles.levelBtn} ${currentLevel === level.id ? styles.active : ''}`}
          onClick={() => onLevelChange(level.id)}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
};

export default LevelSelector; 