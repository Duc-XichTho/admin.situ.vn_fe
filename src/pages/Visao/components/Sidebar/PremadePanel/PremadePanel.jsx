import React, { useState, useEffect } from 'react';
import { Modal, Input, List, Button, Tag, Space } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './PremadePanel.module.css';

const PremadePanel = ({ onQuestionSelect, currentQuestion, questions = [], isCollapsed, onToggleCollapse , setCurrentQuestion }) => {
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filteredPremade, setFilteredPremade] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);

  // Lấy danh sách unique categories từ questions
  const getUniqueCategories = () => {
    const categories = questions
      .map(item => item.category)
      .filter(category => category && category.trim() !== '')
      .filter((category, index, self) => self.indexOf(category) === index);
    return categories.sort();
  };

  // Lấy danh sách unique levels từ questions
  const getUniqueLevels = () => {
    const levels = questions
      .map(item => item.level)
      .filter(level => level && level.trim() !== '')
      .filter((level, index, self) => self.indexOf(level) === index);
    return levels.sort();
  };

  // Mapping level values to Vietnamese labels
  const getLevelLabel = (level) => {
    const levelMap = {
      'elementary': 'Cơ bản',
      'intermediate': 'Trung bình', 
      'advanced': 'Nâng cao'
    };
    return levelMap[level] || level;
  };

  useEffect(() => {
    setFilteredPremade(questions);
  }, [questions]);

  const handleSearchModalOpen = () => {
    setSearchModalVisible(true);
    setSearchValue('');
    setSelectedCategories([]);
    setSelectedLevels([]);
    setFilteredPremade(questions);
  };

  const handleSearchModalClose = () => {
    setSearchModalVisible(false);
    setSearchValue('');
    setSelectedCategories([]);
    setSelectedLevels([]);
    setFilteredPremade(questions);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    applyFilters(value, selectedCategories, selectedLevels);
  };

  const handleCategoryToggle = (category) => {
    const newSelectedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(cat => cat !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newSelectedCategories);
    applyFilters(searchValue, newSelectedCategories, selectedLevels);
  };

  const handleLevelToggle = (level) => {
    const newSelectedLevels = selectedLevels.includes(level)
      ? selectedLevels.filter(lvl => lvl !== level)
      : [...selectedLevels, level];
    
    setSelectedLevels(newSelectedLevels);
    applyFilters(searchValue, selectedCategories, newSelectedLevels);
  };

  const applyFilters = (searchText, categories, levels) => {
    let filtered = questions;

    // Lọc theo text search
    if (searchText.trim() !== '') {
      filtered = filtered.filter(item => 
        item.question.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Lọc theo categories
    if (categories.length > 0) {
      filtered = filtered.filter(item => 
        categories.includes(item.category)
      );
    }

    // Lọc theo levels
    if (levels.length > 0) {
      filtered = filtered.filter(item => 
        levels.includes(item.level)
      );
    }

    setFilteredPremade(filtered);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Nếu có kết quả tìm kiếm, chọn câu hỏi đầu tiên
      if (filteredPremade.length > 0) {
        handleItemClick(filteredPremade[0].question);
      }
    }
  };

  const handleItemClick = (question) => {
    onQuestionSelect(question);
    handleSearchModalClose();
    setCurrentQuestion(null)
  };

  const handleModalOk = () => {
    // Nếu có câu hỏi được chọn, sẽ được xử lý trong handleItemClick
    // Nếu không có câu hỏi nào được chọn, chỉ đóng modal
    handleSearchModalClose();
  };

  const clearAllFilters = () => {
    setSearchValue('');
    setSelectedCategories([]);
    setSelectedLevels([]);
    setFilteredPremade(questions);
  };

  const uniqueCategories = getUniqueCategories();
  const uniqueLevels = getUniqueLevels();

  return (
    <div className={`${styles.premadePanel} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.panelTitle}>
        <span>💡 Kho tàng câu hỏi</span>
        <div className={styles.buttonGroup}>
          <button 
            className={styles.searchBtn} 
            onClick={handleSearchModalOpen}
            title="Tìm kiếm câu hỏi"
            aria-label="Mở modal tìm kiếm câu hỏi"
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
        <div className={styles.premadeList}>
          {questions.length > 0 ? (
            questions.map((item, index) => (
              <div 
                key={item.id || index}
                className={styles.premadeItem}
                onClick={() => handleItemClick(item.question)}
              >
                {item.question}
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              <div>Đang tải câu hỏi...</div>
            </div>
          )}
        </div>
      )}

      {/* Modal tìm kiếm */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>Khám phá kho tàng câu hỏi</span>
          </div>
        }
        open={searchModalVisible}
        onOk={handleModalOk}
        onCancel={handleSearchModalClose}
        width={window.innerWidth < 768 ? '90%' : 1200}
        footer={[
          <Button key="cancel" onClick={handleSearchModalClose} size="large">
            Đóng
          </Button>
        ]}
        destroyOnClose
        centered
        className={styles.modal}
        bodyStyle={{ 
          padding: '20px', 
          maxHeight: '80vh', 
          display: 'flex', 
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          gap: '20px'
        }}
      >
        {/* Left Panel - Search and Filters */}
        <div style={{ 
          flex: window.innerWidth < 768 ? 'none' : '0 0 350px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Search Input */}
          <div>
            <Input
              placeholder="Nhập từ khóa để tìm kiếm câu hỏi... (Enter để chọn câu hỏi đầu tiên)"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              prefix={<SearchOutlined />}
              size="large"
              autoFocus
              style={{ fontSize: 16 }}
            />
          </div>

          {/* Level Filters */}
          {uniqueLevels.length > 0 && (
            <div>
              <div style={{ 
                marginBottom: 16, 
                fontSize: 16, 
                fontWeight: 500,
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Lọc theo cấp độ:</span>
                {selectedLevels.length > 0 && (
                  <span style={{ 
                    fontSize: 14, 
                    color: '#1890ff',
                    fontWeight: 'normal'
                  }}>
                    Đã chọn {selectedLevels.length}/{uniqueLevels.length}
                  </span>
                )}
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 10,
                marginBottom: 16,
              }}>
                {uniqueLevels.map(level => (
                  <Tag
                    key={level}
                    color={selectedLevels.includes(level) ? 'green' : 'default'}
                    style={{ 
                      cursor: 'pointer',
                      margin: 0,
                      padding: '6px 12px',
                      fontSize: 14
                    }}
                    onClick={() => handleLevelToggle(level)}
                  >
                    {getLevelLabel(level)}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {/* Category Filters */}
          {uniqueCategories.length > 0 && (
            <div>
              <div style={{ 
                marginBottom: 16, 
                fontSize: 16, 
                fontWeight: 500,
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Lọc theo loại:</span>
                {selectedCategories.length > 0 && (
                  <span style={{ 
                    fontSize: 14, 
                    color: '#1890ff',
                    fontWeight: 'normal'
                  }}>
                    Đã chọn {selectedCategories.length}/{uniqueCategories.length}
                  </span>
                )}
              </div>
              <div style={{ 
                maxHeight: '120px',
                overflowY: 'auto',
                padding: 12,
                marginBottom: 16,
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 8,
                }}>
                  {uniqueCategories.map(category => (
                    <Tag
                      key={category}
                      color={selectedCategories.includes(category) ? 'blue' : 'default'}
                      style={{ 
                        cursor: 'pointer',
                        margin: 0,
                        padding: '6px 12px',
                        fontSize: 14,
                        flexShrink: 0
                      }}
                      onClick={() => handleCategoryToggle(category)}
                    >
                      {category}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clear All Filters Button */}
          {(selectedCategories.length > 0 || selectedLevels.length > 0) && (
            <div>
              <Button 
                size="middle" 
                onClick={clearAllFilters}
                style={{ fontSize: 14 }}
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          )}
        </div>

        {/* Right Panel - Results */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          <div style={{ 
            marginBottom: 16, 
            fontSize: 16, 
            fontWeight: 500,
            color: '#333',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Kết quả ({filteredPremade.length} câu hỏi):</span>
            {/* {filteredPremade.length > 0 && (
              <span style={{ fontSize: 14, color: '#666' }}>
                Nhấn Enter để chọn câu hỏi đầu tiên
              </span>
            )} */}
          </div>
          <div style={{ 
            overflow: 'auto',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            padding: 12,
            flex: 1,
            minHeight: window.innerWidth < 768 ? '40vh' : '60vh'
          }}>
            {filteredPremade.length > 0 ? (
              <List
                dataSource={filteredPremade}
                renderItem={(item, index) => (
                  <List.Item
                    style={{ 
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderRadius: 4,
                      marginBottom: 6,
                      border: 'none',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : 'white'
                    }}
                    onClick={() => handleItemClick(item.question)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e6f7ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fafafa' : 'white';
                    }}
                  >
                    <div style={{ 
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: '#333'
                    }}>
                      {item.question}
                    </div>
                    <div style={{ 
                      marginTop: 8,
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap'
                    }}>
                      {item.category && (
                        <Tag color="blue" size="small">{item.category}</Tag>
                      )}
                      {item.level && (
                        <Tag 
                          color={item.level === 'elementary' ? 'green' : item.level === 'intermediate' ? 'orange' : 'red'}
                          size="small"
                        >
                          {getLevelLabel(item.level)}
                        </Tag>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#999', 
                padding: '30px',
                fontSize: 16
              }}>
                Không tìm thấy câu hỏi nào phù hợp.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PremadePanel; 