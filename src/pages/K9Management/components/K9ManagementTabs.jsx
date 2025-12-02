import React from 'react';
import { Badge } from 'antd';
import styles from '../K9Management.module.css';

const K9ManagementTabs = ({ currentTab, setCurrentTab, tabOptions }) => {
  return (
    <div className={styles.tabsContainer}>
      {tabOptions.map(tab => (
        <button
          key={tab.key}
          className={`${styles.tabButton} ${currentTab === tab.key ? styles.active : ''}`}
          onClick={() => setCurrentTab(tab.key)}
        >
          {tab.label}
          <Badge count={tab.count} size="small" className={styles.tabBadge} />
        </button>
      ))}
    </div>
  );
};

export default K9ManagementTabs; 