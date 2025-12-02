import React, { useState, useEffect, useContext } from 'react';
import styles from './HistoryPanel.module.css';
import { getQuestionHistoryByUser } from '../../../../../apis/questionHistoryService.jsx';
import { MyContext } from '../../../../../MyContext';

const SCORE_MAP = {
  excellent: { text: 'Tuyệt vời!', className: 'excellent' },
  good: { text: 'Tốt', className: 'good' },
  needsWork: { text: 'Cần cải thiện', className: 'needsWork' },
  submitted: { text: 'Đã nộp', className: 'submitted' },
};

const HistoryPanel = ({ onQuestionSelect, onHistoryItemClick, currentQuestion, history: externalHistory, isCollapsed, onToggleCollapse }) => {
  const { currentUser } = useContext(MyContext);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);

  
  // Sử dụng external history nếu có, không thì fetch từ API
  useEffect(() => {
    if (externalHistory !== undefined) {
      // Sử dụng history từ props (từ Visao.jsx)
      setHistory(externalHistory);
      setFilteredHistory(externalHistory);
    } else {
      // Fallback: fetch từ API như cũ (backward compatibility)
      const fetchHistory = async () => {
        if (!currentUser?.id) {
          setHistory([]);
          setFilteredHistory([]);
          return;
        }
        try {
          const data = await getQuestionHistoryByUser(currentUser.email);
          const sortedData = (data || []).sort((a, b) => b.id - a.id);
          setHistory(sortedData);
          setFilteredHistory(sortedData);
        } catch (error) {
          setHistory([]);
          setFilteredHistory([]);
        }
      };
      fetchHistory();
    }
  }, [externalHistory, currentUser]);

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchValue('');
      setFilteredHistory(history);
    }
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    if (value.trim() === '') {
      setFilteredHistory(history);
    } else {
      const filtered = history.filter(item =>
        (item.question || '').toLowerCase().includes(value.toLowerCase())
      );
      setFilteredHistory(filtered);
    }
  };

  const handleItemClick = (item) => {
    // Sử dụng onHistoryItemClick nếu có, không thì fallback về onQuestionSelect
    if (onHistoryItemClick) {
      onHistoryItemClick(item);
    } else {
      onQuestionSelect(item.question);
    }
  };

  if (!currentUser?.id) {
    return null;
  }

  return (
    <div className={`${styles.historyPanel} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.panelTitle}>
        <span>📝 Nhật ký</span>
        <div className={styles.buttonGroup}>
          <button
            className={styles.searchBtn}
            onClick={toggleSearch}
            title="Tìm kiếm"
          >
            🔍
          </button>
          <button
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <input
            type="text"
            className={`${styles.searchInput} ${searchVisible ? styles.show : ''}`}
            placeholder="Tìm kiếm trong nhật ký..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
          />

          <div className={styles.historyList}>
            {filteredHistory.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', marginTop: 30 }}>
                Không có lịch sử câu hỏi nào.
              </div>
            ) : (
              filteredHistory.map((item, index) => {
                const scoreInfo =  SCORE_MAP[item.status];
                // Tạo unique key cho pending questions
                const uniqueKey = item.id && item.id.toString().startsWith('temp_') 
                  ? `${item.id}_${index}` 
                  : item.id || index;
                
                return (
                  <div
                    key={uniqueKey}
                    className={`${styles.historyItem} ${item.status === 'processing' ? styles.processing : ''}`}
                    onClick={() => handleItemClick(item)}
                  >
                    {item.question}
                    {scoreInfo && (
                      <span className={`${styles.scoreBadge} ${styles[scoreInfo.className]}`}>
                        {scoreInfo.text}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryPanel; 