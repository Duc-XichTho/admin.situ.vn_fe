import React, { useState, useEffect, useContext } from 'react';
import { MyContext } from '../../../MyContext';
import { thesisService } from '../../../apis/thesisService';
import { Button, Modal, Form, Input, Select, message, Popconfirm, Card, Space, Tag, List, Collapse, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, BookOutlined, DownOutlined, UpOutlined, SaveOutlined, FileTextOutlined, MenuOutlined } from '@ant-design/icons';
import { Sparkles } from 'lucide-react';
import { aiGen } from '../../../apis/aiGen/botService';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import styles from '../K9.module.css';

const { TextArea } = Input;
const { Option } = Select;

const ThesisTab = () => {
  const { currentUser } = useContext(MyContext);
  const [thesisList, setThesisList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingThesis, setEditingThesis] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();
  const [editingChatIndex, setEditingChatIndex] = useState(null);
  const [showAddChatForm, setShowAddChatForm] = useState(false);
  const [chatForm] = Form.useForm();
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingThesisSummary, setGeneratingThesisSummary] = useState(false);
  const [selectedThesis, setSelectedThesis] = useState(null);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [editingSummary, setEditingSummary] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
      setSidebarCollapsed(newIsMobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const closeSidebar = () => isMobile && setSidebarCollapsed(true);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Load thesis data
  const loadThesis = async () => {
    setLoading(true);
    try {
      const data = await thesisService.getAllThesis();

      // Ensure data is an array
      const thesisArray = Array.isArray(data) ? data.filter(item => item.userCreated === currentUser?.email) : (data?.data || data?.thesis || []);

      setThesisList(thesisArray);
      
      // Select first thesis if none selected
      if (thesisArray.length > 0 && !selectedThesis) {
        setSelectedThesis(thesisArray[0]);
      }
    } catch (error) {
      message.error('Không thể tải danh sách thesis');
      console.error('Error loading thesis:', error);
      setThesisList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThesis();
  }, []);

  // Search thesis
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadThesis();
      return;
    }

    setLoading(true);
    try {
      const data = await thesisService.searchThesis(searchTerm);
      // Ensure data is an array
      const thesisArray = Array.isArray(data) ? data : (data?.data || data?.thesis || []);
      setThesisList(thesisArray);
      
      // Select first thesis from search results if none selected
      if (thesisArray.length > 0 && !selectedThesis) {
        setSelectedThesis(thesisArray[0]);
      }
    } catch (error) {
      message.error('Lỗi tìm kiếm thesis');
      console.error('Error searching thesis:', error);
      setThesisList([]);
    } finally {
      setLoading(false);
    }
  };

  // Create/Update thesis
  const handleSubmit = async (values) => {
    try {
      if (editingThesis) {
        // Cập nhật thesis hiện có
        await thesisService.updateThesis(editingThesis.id, {
          ...editingThesis,
          ...values
        });
        message.success('Cập nhật thesis thành công');
      } else {
        // Tạo thesis mới với list_chat rỗng
        await thesisService.createThesis({
          content: '',
          summary: '',
          userCreated: currentUser?.email || currentUser?.id,
          list_chat: []
        });
        message.success('Tạo thesis thành công');
      }
      
      setModalVisible(false);
      setEditingThesis(null);
      setEditingChatIndex(null);
      form.resetFields();
      chatForm.resetFields();
      loadThesis();
    } catch (error) {
      message.error(editingThesis ? 'Lỗi cập nhật thesis' : 'Lỗi tạo thesis');
      console.error('Error submitting thesis:', error);
    }
  };

  // Delete thesis
  const handleDelete = async (id) => {
    try {
      await thesisService.deleteThesis(id);
      message.success('Xóa thesis thành công');
      
      // If deleted thesis was selected, clear selection
      if (selectedThesis && selectedThesis.id === id) {
        setSelectedThesis(null);
      }
      
      loadThesis();
    } catch (error) {
      message.error('Lỗi xóa thesis');
      console.error('Error deleting thesis:', error);
    }
  };

  // Edit thesis
  const handleEdit = (thesis) => {
    setEditingThesis(thesis);
    setEditingChatIndex(null);
    setShowAddChatForm(false);
    form.resetFields();
    chatForm.resetFields();
    setModalVisible(true);
  };

  // Add new chat
  const handleAddChat = () => {
    console.log('handleAddChat called');
    setEditingChatIndex(null);
    setShowAddChatForm(true);
    chatForm.resetFields();
    console.log('Form reset, editingChatIndex set to null, showAddChatForm set to true');
  };

  // Edit chat
  const handleEditChat = (chat, index) => {
    setEditingChatIndex(index);
    chatForm.setFieldsValue({
      content: chat.content,
      summary: chat.summary
    });
  };

  // Save chat
  const handleSaveChat = async (values) => {
    if (!editingThesis) return;

    try {
      const updatedListChat = [...(editingThesis.list_chat || [])];
      
      if (editingChatIndex !== null) {
        // Cập nhật chat hiện có
        updatedListChat[editingChatIndex] = {
          ...updatedListChat[editingChatIndex],
          ...values
        };
      } else {
        // Thêm chat mới
        const newOrder = updatedListChat.length + 1;
        updatedListChat.push({
          order: newOrder,
          ...values
        });
      }

      const updatedThesis = {
        ...editingThesis,
        list_chat: updatedListChat
      };

      await thesisService.updateThesis(editingThesis.id, updatedThesis);
      setEditingThesis(updatedThesis);
      setEditingChatIndex(null);
      setShowAddChatForm(false);
      chatForm.resetFields();
      message.success(editingChatIndex !== null ? 'Cập nhật chat thành công' : 'Thêm chat thành công');
      loadThesis(); // Reload the list
    } catch (error) {
      message.error('Lỗi khi lưu chat');
      console.error('Error saving chat:', error);
    }
  };

  // Delete chat
  const handleDeleteChat = async (index) => {
    if (!editingThesis) return;

    try {
      const updatedListChat = [...(editingThesis.list_chat || [])];
      updatedListChat.splice(index, 1);
      
      // Cập nhật lại order
      updatedListChat.forEach((chat, idx) => {
        chat.order = idx + 1;
      });

      const updatedThesis = {
        ...editingThesis,
        list_chat: updatedListChat
      };

      await thesisService.updateThesis(editingThesis.id, updatedThesis);
      setEditingThesis(updatedThesis);
      message.success('Xóa chat thành công');
      loadThesis(); // Reload the list
    } catch (error) {
      message.error('Lỗi khi xóa chat');
      console.error('Error deleting chat:', error);
    }
  };

  // Open create modal
  const handleCreate = () => {
    setEditingThesis(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Close modal
  const handleCancel = () => {
    setModalVisible(false);
    setEditingThesis(null);
    form.resetFields();
  };

  // Open summary modal
  const handleOpenSummaryModal = () => {
    setEditingSummary(selectedThesis.summary || '');
    setSummaryModalVisible(true);
  };

  // Close summary modal
  const handleCloseSummaryModal = () => {
    setSummaryModalVisible(false);
    setEditingSummary('');
  };

  // Save summary
  const handleSaveSummary = async () => {
    try {
      const updatedThesis = {
        ...selectedThesis,
        summary: editingSummary
      };

      await thesisService.updateThesis(selectedThesis.id, updatedThesis);
      setSelectedThesis(updatedThesis);
      message.success('Đã lưu tóm tắt thesis');
      loadThesis(); // Reload the list
      handleCloseSummaryModal();
    } catch (error) {
      message.error('Lỗi khi lưu tóm tắt');
      console.error('Error saving thesis summary:', error);
    }
  };

  // Get content preview
  const getContentPreview = (content) => {
    if (!content) return 'Không có nội dung';
    return content.length > 150 ? `${content.substring(0, 150)}...` : content;
  };

  // Get summary preview
  const getSummaryPreview = (summary) => {
    if (!summary) return 'Không có tóm tắt';
    return summary.length > 100 ? `${summary.substring(0, 100)}...` : summary;
  };

  // Function to generate AI summary
  const generateSummaryWithAI = async (content) => {
    if (!content || content.trim().length === 0) {
      message.warning('Vui lòng nhập nội dung trước khi tạo tóm tắt');
      return;
    }

    setGeneratingSummary(true);
    try {
      const prompt = `Hãy tạo một tóm tắt ngắn gọn và súc tích cho nội dung sau đây. Tóm tắt nên có độ dài khoảng 100-150 ký tự và nêu bật những điểm chính:

${content}

Tóm tắt:`;

      const response = await aiGen(
        prompt,
        'Bạn là một trợ lý AI chuyên tạo tóm tắt ngắn gọn và chính xác. Sử dụng ngôn ngữ Việt Nam, câu từ trịnh trọng.',
        'google/gemini-2.5-flash',
        'text'
      );

      if (response && response.result) {
        const aiSummary = response.result.trim();
        chatForm.setFieldValue('summary', aiSummary);
        message.success('Đã tạo tóm tắt thành công!');
      } else {
        message.error('Không thể tạo tóm tắt. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      message.error('Lỗi khi tạo tóm tắt. Vui lòng thử lại.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Function to generate AI summary for entire thesis
  const handleGenerateThesisSummary = async () => {
    if (!selectedThesis || !selectedThesis.list_chat || selectedThesis.list_chat.length === 0) {
      message.warning('Không có nội dung chat để tạo tóm tắt');
      return;
    }

    setGeneratingThesisSummary(true);
    try {
      // Combine all chat content
      const allContent = selectedThesis.list_chat
          .sort((a, b) => a.order - b.order)
          .map(chat => `Đoạn ${chat.order}:\n${chat.content}`)
          .join('\n\n');
      console.log('All content:', allContent);
      const prompt = `Hãy tạo một tóm tắt tổng hợp và súc tích cho toàn bộ nội dung thesis sau đây. Tóm tắt nên có độ dài khoảng 200-300 ký tự và nêu bật những điểm chính, kết luận quan trọng:

${allContent}
Chỉ trả về câu tóm tắt, không có gì khác.`;

      const response = await aiGen(
        prompt,
        'Bạn là một trợ lý AI chuyên tạo tóm tắt tổng hợp cho các thesis. Sử dụng ngôn ngữ Việt Nam, câu từ trịnh trọng và chuyên nghiệp.',
        'gpt-4.1-2025-04-14',
        'text'
      );
      console.log('Response:', response);
      if (response && response.result) {
        const thesisSummary = response.result.trim();
        console.log('Thesis summary:', thesisSummary);
        setEditingSummary(thesisSummary);
        
        // Cập nhật cả editingThesis.summary nếu đang trong edit mode
        if (editingThesis) {
          const updatedThesis = {
            ...editingThesis,
            summary: thesisSummary
          };
          setEditingThesis(updatedThesis);
        }
        
        message.success('Đã tạo tóm tắt thesis thành công!');
      } else {
        message.error('Không thể tạo tóm tắt thesis. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error generating thesis summary:', error);
      message.error('Lỗi khi tạo tóm tắt thesis. Vui lòng thử lại.');
    } finally {
      setGeneratingThesisSummary(false);
    }
  };

  return (
    <div className={styles.thesisTab}>
      {/* Overlay for mobile when sidebar is open */}
      <div
        className={`${styles.sidebarOverlay} ${!sidebarCollapsed && isMobile ? styles.mobileOpen : ''}`}
        onClick={closeSidebar}
      />
      <Button className={styles.thesisTitle} style={{ display: 'flex', alignItems: 'center', position: 'relative' }} onClick={toggleSidebar}>
      
        <BookOutlined style={{ marginRight: 8 }}  />
        Quản lý Thesis ({Array.isArray(thesisList) ? thesisList.length : 0} bài)
      </Button>
      <div className={styles.thesisLayout}>
        {/* Sidebar */}
        <div
          className={
            `${styles.thesisSidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${!sidebarCollapsed && isMobile ? styles.mobileOpen : ''}`
          }
        >
          {/* Header */}
          <div className={styles.thesisHeader}>
            
            
        
              {/* Search */}
              <Input
                placeholder="Tìm kiếm thesis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={handleSearch}
                style={{width: '70%', marginRight: '10px'}}
                suffix={
                  <SearchOutlined 
                    onClick={handleSearch}
                    style={{ cursor: 'pointer' }}
                  />
                }
              />
              
              {/* Create button */}
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreate}
                style={{width: '30%'}}
              >Thesis
              </Button>
            
          </div>

          {/* Thesis List */}
          <div className={styles.thesisList}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loading}>Đang tải...</div>
              </div>
            ) : (!Array.isArray(thesisList) || thesisList.length === 0) ? (
              <div className={styles.emptyContainer}>
                <BookOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                <p>Chưa có thesis nào</p>
                <Button type="primary" onClick={handleCreate}>
                  Tạo thesis đầu tiên
                </Button>
              </div>
            ) : (
              <List
                dataSource={thesisList}
                renderItem={(thesis) => (
                  <div 
                    className={`${styles.thesisListItem} ${selectedThesis?.id === thesis.id ? styles.selectedThesis : ''}`}
                    onClick={() => {
                      setSelectedThesis(thesis);
                      closeSidebar(); // Đóng sidebar khi chọn thesis trên mobile
                    }}
                  >
                    <div className={styles.thesisItemHeader}>
                      <div className={styles.thesisItemInfo}>
                        <div className={styles.thesisItemTitle}>
                          <BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                          Thesis #{thesis.id}
                        </div>
                        <div className={styles.thesisItemSummary}>
                          <div className={styles.thesisChatPreview}>
                            {thesis.summary ? thesis.summary : 'Chưa có tóm tắt thesis'}
                          </div>
                          <div className={styles.thesisChatCount}>
                            📝 {thesis.list_chat ? thesis.list_chat.length : 0} đoạn chat
                          </div>
                        </div>
                        <div className={styles.thesisItemMeta}>
                          <span className={styles.thesisDate}>
                            {formatDate(thesis.createAt)}
                          </span>
                        
                        </div>
                        <div className={styles.thesisItemMeta}>
                        <span className={styles.thesisUser}>
                            {thesis.userCreated}
                          </span>
                        </div>
                      </div>
                      <div className={styles.thesisItemActions}>
                        <Button 
                          type="text" 
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(thesis);
                          }}
                        />
                        <Popconfirm
                          title="Bạn có chắc chắn muốn xóa thesis này?"
                          onConfirm={() => handleDelete(thesis.id)}
                          okText="Có"
                          cancelText="Không"
                        >
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()}
                         />
                        </Popconfirm>
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
          </div>
        </div>

        {/* Right Content Area */}
        <div className={styles.thesisContent}>
          {selectedThesis ? (
            <div className={styles.thesisContentWrapper}>
              {/* Header with Summary Button */}
              <div className={styles.thesisContentHeader}>
                <div className={styles.thesisContentTitle}>
                  <BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  Thesis #{selectedThesis.id}
                </div>
                <div className={styles.thesisContentSummary}>
                  {selectedThesis.summary ? (
                    <div 
                      style={{
                        fontSize: '14px',
                        lineHeight: '1.6',
                        fontStyle: 'italic',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: selectedThesis.summary,
                      }}
                    />
                  ) : (
                    <div className={styles.noSummary}>
                      Chưa có tóm tắt thesis
                    </div>
                  )}
                </div>
                
              </div>

              {/* Chat Content Area */}
              <div className={styles.thesisChatArea}>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '10px', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #e8e8e8'}}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingThesis(selectedThesis);
                      handleAddChat();
                    }}
                  >
                    Thêm chat
                  </Button>
                </div>

                <div className={styles.thesisChatList}>
                  {selectedThesis.list_chat && selectedThesis.list_chat.length > 0 ? (
                    selectedThesis.list_chat
                      .sort((a, b) => a.order - b.order)
                      .map((chat, index) => (
                        <div key={index} className={styles.thesisChatItem}>
                          <div className={styles.thesisChatHeader}>
                            <span className={styles.thesisChatOrder}>
                              Đoạn #{chat.order}
                            </span>
                            
                          </div>
                          
                          <div className={styles.thesisChatSummary}>
                            {chat.summary ? (
                            <div style={{
                              fontSize: '14px',
                              lineHeight: '1.6',
                              fontStyle: 'italic',
                            }}>
                              {chat.summary}
                            </div>  
                            ) : (
                              'Không có tóm tắt'
                            )}
                          </div>
                          
                          <div className={styles.thesisChatContent}>
                            <div 
                              className={styles.thesisChatText}
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(marked.parse(chat.content || '')),
                              }}
                            />
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className={styles.thesisDetailEmpty}>
                      <div className={styles.thesisEmptyContent}>
                        <BookOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                        <h4>Chưa có nội dung</h4>
                        <Button 
                          type="primary" 
                          onClick={() => {
                            setEditingThesis(selectedThesis);
                            handleAddChat();
                          }}
                        >
                          Thêm chat đầu tiên

                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.thesisContentEmpty}>
              <BookOutlined style={{ fontSize: 64, color: '#ccc', marginBottom: 24 }} />
              <h3>Chọn một thesis để xem nội dung</h3>
              <p>Vui lòng chọn một thesis từ danh sách bên trái để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Modal */}
      <Modal
        title={`Tóm tắt Thesis #${selectedThesis?.id}`}
        open={summaryModalVisible}
        onCancel={handleCloseSummaryModal}
        footer={[
          <Button key="cancel" onClick={handleCloseSummaryModal}>
            Hủy
          </Button>,
          <Button 
            key="generate" 
            icon={<Sparkles size={14} />}
            onClick={handleGenerateThesisSummary}
            loading={generatingThesisSummary}
            disabled={!selectedThesis?.list_chat || selectedThesis?.list_chat.length === 0}
          >
            AI Tóm tắt
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveSummary}>
            Lưu
          </Button>
        ]}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="Thông tin"
            description="Tóm tắt này sẽ hiển thị tổng quan về toàn bộ nội dung thesis. Bạn có thể chỉnh sửa trực tiếp hoặc sử dụng AI để tạo tóm tắt tự động."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </div>
        
        <TextArea
          value={editingSummary}
          onChange={(e) => setEditingSummary(e.target.value)}
          placeholder="Nhập tóm tắt tổng hợp cho thesis này..."
          rows={12}
          style={{ 
            fontSize: '14px',
            lineHeight: '1.6',
            resize: 'vertical'
          }}
        />
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        title={editingThesis ? `Chỉnh sửa Thesis #${editingThesis.id}` : 'Tạo Thesis mới'}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        {editingThesis ? (
          /* Edit mode: Hiển thị danh sách chat và form thêm/sửa */
          <div>
            {/* Thesis Summary Section */}
            <div style={{ marginBottom: 24, padding: '16px', border: '1px solid #e8e8e8', borderRadius: '8px', backgroundColor: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, color: '#1890ff' }}>Tóm tắt toàn bộ nội dung thesis</h4>
                <Space>
                  <Button 
                    type="default" 
                    size="small"
                    icon={<Sparkles size={14} />}
                    onClick={() => handleGenerateThesisSummary()}
                    loading={generatingThesisSummary}
                    disabled={!editingThesis.list_chat || editingThesis.list_chat.length === 0}
                    title="Sử dụng AI để tạo tóm tắt tổng hợp cho toàn bộ thesis"
                  >
                    AI Tóm tắt
                  </Button>
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<SaveOutlined />}
                    onClick={async () => {
                      try {
                        await thesisService.updateThesis(editingThesis.id, {
                          ...editingThesis,
                          summary: editingThesis.summary
                        });
                        message.success('Đã lưu tóm tắt thesis');
                        loadThesis(); // Reload the list
                      } catch (error) {
                        message.error('Lỗi khi lưu tóm tắt');
                        console.error('Error saving thesis summary:', error);
                      }
                    }}
                    title="Lưu tóm tắt thesis"
                  />
                </Space>
              </div>
              <TextArea
                value={editingThesis.summary || ''}
                onChange={(e) => {
                  const updatedThesis = {
                    ...editingThesis,
                    summary: e.target.value
                  };
                  setEditingThesis(updatedThesis);
                }}
                placeholder="Nhập tóm tắt tổng hợp cho thesis này..."
                rows={4}
                style={{ 
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Header với nút thêm chat */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Danh sách chat ({editingThesis.list_chat?.length || 0} đoạn)</h3>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  console.log('Add chat button clicked');
                  handleAddChat();
                }}
              >
                Thêm chat
              </Button>
            </div>

            {/* Danh sách chat */}
            {editingThesis.list_chat && editingThesis.list_chat.length > 0 ? (
              <div style={{ marginBottom: 24 }}>
                {editingThesis.list_chat
                  .sort((a, b) => a.order - b.order)
                  .map((chat, index) => (
                    <div key={index} style={{ 
                      border: '1px solid #e8e8e8', 
                      borderRadius: '8px', 
                      padding: '12px', 
                      marginBottom: '8px',
                      background: editingChatIndex === index ? '#f0f8ff' : 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#1890ff' }}>Đoạn #{chat.order}</span>
                        <Space>
                          <Button 
                            type="text" 
                            size="small"
                            onClick={() => handleEditChat(chat, index)}
                          >
                            Sửa
                          </Button>
                          <Popconfirm
                            title="Xóa đoạn chat này?"
                            onConfirm={() => handleDeleteChat(index)}
                            okText="Có"
                            cancelText="Không"
                          >
                            <Button 
                              type="text" 
                              size="small"
                              danger
                            >
                              Xóa
                            </Button>
                          </Popconfirm>
                        </Space>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                        {chat.summary || 'Không có tóm tắt'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#333' }}>
                        {chat.content.length > 100 ? chat.content.substring(0, 100) + '...' : chat.content}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                <BookOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                <p>Chưa có đoạn chat nào</p>
                <Button type="primary" onClick={() => {
                  console.log('Add first chat button clicked');
                  handleAddChat();
                }}>
                  Thêm chat đầu tiên
                </Button>
              </div>
            )}

            {/* Form thêm/sửa chat */}
            {(() => {
              const shouldShowForm = editingChatIndex !== null || editingThesis.list_chat?.length === 0 || showAddChatForm;
              console.log('Form display condition:', {
                editingChatIndex,
                listChatLength: editingThesis.list_chat?.length,
                showAddChatForm,
                shouldShowForm
              });
              return shouldShowForm;
            })()}

            <Modal
              title="Sửa đoạn chat"
              open={editingChatIndex !== null}
              onCancel={() => setEditingChatIndex(null)}
              footer={null}
              width={800}
            >
              <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '16px' }}>
                <h4>{editingChatIndex !== null ? 'Sửa chat' : 'Thêm chat mới'}</h4>
                <Form
                  form={chatForm}
                  layout="vertical"
                  onFinish={handleSaveChat}
                >
                  <Form.Item
                    name="content"
                    label="Nội dung"
                    rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                  >
                    <TextArea 
                      rows={6} 
                      placeholder="Nhập nội dung chat"
                    />
                  </Form.Item>

                  <Form.Item
                    name="summary"
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Tóm tắt</span>
                        <Button
                          type="text"
                          size="small"
                          icon={<Sparkles size={14} />}
                          onClick={() => {
                            const content = chatForm.getFieldValue('content');
                            if (content) {
                              generateSummaryWithAI(content);
                            }
                          }}
                          loading={generatingSummary}
                          title="Sử dụng AI để tạo tóm tắt tự động"
                          style={{
                            color: '#1890ff',
                            padding: '2px 8px',
                            height: '24px',
                            fontSize: '12px'
                          }}
                        >
                          AI Tóm tắt
                        </Button>
                      </div>
                    }
                  >
                    <TextArea 
                      rows={3} 
                      placeholder="Tóm tắt ngắn gọn (hoặc click nút AI Tóm tắt để tạo tự động)"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">
                        {editingChatIndex !== null ? 'Cập nhật' : 'Thêm'}
                      </Button>
                      <Button onClick={() => {
                        setEditingChatIndex(null);
                        setShowAddChatForm(false);
                        chatForm.resetFields();
                      }}>
                        Hủy
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </div>
            </Modal>
          </div>
        ) : (
          /* Create mode: Form tạo thesis mới */
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Alert
              message="Thông tin"
              description="Thesis mới sẽ được tạo với danh sách chat rỗng. Bạn có thể thêm các đoạn chat sau khi tạo."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Tạo Thesis
                </Button>
                <Button onClick={handleCancel}>
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ThesisTab; 