import React, { useState, useEffect } from 'react';
import { Layout, Button, Form, Input, Select, Space, message, Popconfirm, Card, Tag, List, Typography, Empty, Modal, Tooltip, Alert, Tabs } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  UserOutlined,
  EyeOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { getAllQuestion, createNewQuestion, updateQuestion, deleteQuestion } from '../../apis/questionService';
import { getAllAnswer, createNewAnswer, updateAnswer, deleteAnswer } from '../../apis/answerService';
import { getAllCategory } from '../../apis/categoryService';
import styles from './Management.module.css';

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Management = () => {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();
  
  // Question management states
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm] = Form.useForm();

  console.log(questions);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [questionsData, categoriesData] = await Promise.all([
        getAllQuestion(),
        getAllCategory()
      ]);
      
      // Sort questions by index
      const sortedQuestions = (questionsData || []).sort((a, b) => {
        if (a.index === null && b.index === null) return 0;
        if (a.index === null) return 1;
        if (b.index === null) return -1;
        return a.index - b.index;
      });
      
      setQuestions(sortedQuestions);
      setCategories(categoriesData || []);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get answer for selected question
  const getSelectedQuestionAnswer = () => {
    if (!selectedQuestion) return null;
    return selectedQuestion.answer;
  };

  // Check if answer is AI-generated
  const isAIAnswer = (answer) => {
    return answer && answer.ai_gen_id;
  };

  // Handle question selection
  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setIsEditing(false);
    
    const answer = question.answer;
    if (answer) {
      editForm.setFieldsValue({
        html: answer.html || answer.content || ''
      });
    } else {
      editForm.setFieldsValue({
        html: ''
      });
    }
  };

  // Handle edit mode
  const handleEdit = () => {
    const answer = getSelectedQuestionAnswer();
    if (isAIAnswer(answer)) {
      message.warning('Không thể chỉnh sửa câu trả lời do AI tạo');
      return;
    }
    setIsEditing(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    const answer = getSelectedQuestionAnswer();
    if (answer) {
      editForm.setFieldsValue({
        html: answer.html || answer.content || ''
      });
    }
  };

  // Handle save answer
  const handleSaveAnswer = async (values) => {
    try {
      const existingAnswer = getSelectedQuestionAnswer();
      if (existingAnswer) {
        await updateAnswer({ 
          ...existingAnswer, 
          html: values.html 
        });
        message.success('Cập nhật câu trả lời thành công');
      } else {
        await createNewAnswer({
          title: selectedQuestion.question,
          content: values.html, // Fallback content
          html: values.html,
          level: selectedQuestion.level,
          show: true,
          question_id: selectedQuestion.id
        });
        message.success('Thêm câu trả lời thành công');
      }
      
      setIsEditing(false);
      fetchData(); // Refresh to get updated data
    } catch (error) {
      message.error('Lỗi khi lưu câu trả lời');
      console.error('Error saving answer:', error);
    }
  };

  // Question management functions
  const handleAddQuestion = () => {
    setEditingQuestion(null);
    questionForm.resetFields();
    setQuestionModalVisible(true);
  };

  const handleEditQuestion = (question, e) => {
    e.stopPropagation();
    setEditingQuestion(question);
    questionForm.setFieldsValue(question);
    setQuestionModalVisible(true);
  };

  const handleDeleteQuestion = async (questionId, e) => {
    e.stopPropagation();
    try {
      await deleteQuestion(questionId);
      message.success('Xóa câu hỏi thành công');
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion(null);
      }
      fetchData();
    } catch (error) {
      message.error('Lỗi khi xóa câu hỏi');
    }
  };

  const handleQuestionSubmit = async (values) => {
    try {
      if (editingQuestion) {
        await updateQuestion({ ...values, id: editingQuestion.id });
        message.success('Cập nhật câu hỏi thành công');
      } else {
        // When creating new question, also create a default answer
        const newQuestion = await createNewQuestion(values);
        message.success('Thêm câu hỏi thành công');
        
        // Create default answer for new question
        if (newQuestion && newQuestion.id) {
          try {
            await createNewAnswer({
              title: values.question,
              content: '',
              html: '',
              level: values.level,
              show: true,
              question_id: newQuestion.id
            });
          } catch (answerError) {
            console.error('Error creating default answer:', answerError);
          }
        }
      }
      setQuestionModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Lỗi khi lưu câu hỏi');
      console.error('Error saving question:', error);
    }
  };

  // Move question up/down
  const moveQuestion = async (questionId, direction) => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;

    const newQuestions = [...questions];
    let targetIndex;

    if (direction === 'up' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < newQuestions.length - 1) {
      targetIndex = currentIndex + 1;
    } else {
      return;
    }

    // Swap questions
    [newQuestions[currentIndex], newQuestions[targetIndex]] = 
    [newQuestions[targetIndex], newQuestions[currentIndex]];

    // Update indices
    const currentQuestion = newQuestions[targetIndex];
    const targetQuestion = newQuestions[currentIndex];

    try {
      // Update both questions with new indices
      await Promise.all([
        updateQuestion({ 
          ...currentQuestion, 
          index: targetIndex 
        }),
        updateQuestion({ 
          ...targetQuestion, 
          index: currentIndex 
        })
      ]);

      setQuestions(newQuestions);
      message.success('Cập nhật vị trí thành công');
    } catch (error) {
      message.error('Lỗi khi cập nhật vị trí');
      console.error('Error updating positions:', error);
    }
  };

  // Get current HTML content for preview
  const getCurrentHtmlContent = () => {
    const answer = getSelectedQuestionAnswer();
    if (!answer) return '';
    return answer.html || answer.content || '';
  };

  return (
    <Layout className={styles.managementLayout}>
      {/* Sidebar with Questions */}
      <Sider width={450} className={styles.sider}>
        <div className={styles.siderHeader}>
          <QuestionCircleOutlined className={styles.headerIcon} />
          <h2>Quản lý Câu hỏi</h2>
        </div>
        
        <div className={styles.siderContent}>
          <div className={styles.questionHeader}>
            <Title level={4}>Danh sách câu hỏi</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddQuestion}
              size="small"
              className={styles.addButton}
            >
              Thêm câu hỏi
            </Button>
          </div>

          <div className={styles.questionList}>
            <List
              loading={loading}
              dataSource={questions}
              renderItem={(question, index) => (
                <List.Item
                  className={`${styles.questionItem} ${selectedQuestion?.id === question.id ? styles.selected : ''}`}
                  onClick={() => handleQuestionSelect(question)}
                >
                  <div className={styles.questionContent}>
                    <div className={styles.questionMain}>
                      <div className={styles.questionTitle}>
                        {question.question}
                      </div>
                      <div className={styles.questionMeta}>
                        <Tag color="blue" size="small">{question.category}</Tag>
                        {question.level && (
                          <Tag 
                            color={question.level === 'elementary' ? 'green' : question.level === 'intermediate' ? 'orange' : 'red'}
                            size="small"
                          >
                            {question.level === 'elementary' ? 'Cơ bản' : question.level === 'intermediate' ? 'Trung bình' : 'Nâng cao'}
                          </Tag>
                        )}
                        
                        {/* AI/Manual indicator */}
                        {question.answer && (
                          <Tag 
                            color={isAIAnswer(question.answer) ? 'purple' : 'cyan'}
                            size="small"
                            icon={isAIAnswer(question.answer) ? <RobotOutlined /> : <UserOutlined />}
                          >
                            {isAIAnswer(question.answer) ? 'AI tạo' : 'Thủ công'}
                          </Tag>
                        )}
                  
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {question.answer ? 'Có câu trả lời' : 'Chưa có câu trả lời'}
                        </Text>
                      </div>
                    </div>
                    
                    <div className={styles.questionActions}>
                      <Space size="small">
                        <Tooltip title="Di chuyển lên">
                          <Button
                            type="text"
                            size="small"
                            icon={<UpOutlined />}
                            disabled={index === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveQuestion(question.id, 'up');
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="Di chuyển xuống">
                          <Button
                            type="text"
                            size="small"
                            icon={<DownOutlined />}
                            disabled={index === questions.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveQuestion(question.id, 'down');
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="Sửa câu hỏi">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => handleEditQuestion(question, e)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="Bạn có chắc muốn xóa câu hỏi này?"
                          onConfirm={(e) => handleDeleteQuestion(question.id, e)}
                          okText="Có"
                          cancelText="Không"
                        >
                          <Tooltip title="Xóa câu hỏi">
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Tooltip>
                        </Popconfirm>
                      </Space>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>
      </Sider>
      
      {/* Main Content with Answer */}
      <Content className={styles.content}>
        {selectedQuestion ? (
          <div className={styles.answerSection}>
            <div className={styles.answerHeader}>
              <div className={styles.questionInfo}>
                <Title level={3} style={{ margin: 0 }}>
                  {selectedQuestion.question}
                </Title>
                <div className={styles.questionDetails}>
                  <Tag color="blue">{selectedQuestion.category}</Tag>
                  {selectedQuestion.level && (
                    <Tag color={selectedQuestion.level === 'elementary' ? 'green' : selectedQuestion.level === 'intermediate' ? 'orange' : 'red'}>
                      {selectedQuestion.level === 'elementary' ? 'Cơ bản' : selectedQuestion.level === 'intermediate' ? 'Trung bình' : 'Nâng cao'}
                    </Tag>
                  )}
                  
                  {/* AI/Manual indicator */}
                  {selectedQuestion.answer && (
                    <Tag 
                      color={isAIAnswer(selectedQuestion.answer) ? 'purple' : 'cyan'}
                      icon={isAIAnswer(selectedQuestion.answer) ? <RobotOutlined /> : <UserOutlined />}
                    >
                      {isAIAnswer(selectedQuestion.answer) ? 'AI tạo' : 'Thủ công'}
                    </Tag>
                  )}
                </div>
              </div>
              
              {/* Only show edit button for manual answers */}
              {selectedQuestion.answer && !isAIAnswer(selectedQuestion.answer) && !isEditing && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  size="large"
                >
                  Chỉnh sửa câu trả lời
                </Button>
              )}
            </div>
            
            {/* AI Answer Warning */}
            {selectedQuestion.answer && isAIAnswer(selectedQuestion.answer) && (
              <Alert
                message="Câu trả lời do AI tạo"
                description="Câu trả lời này được tạo tự động bởi AI và không thể chỉnh sửa trực tiếp. Để thay đổi, hãy tạo lại câu trả lời từ AI Gen."
                type="info"
                showIcon
                icon={<RobotOutlined />}
                style={{ marginBottom: 16 }}
              />
            )}
            
            <div className={styles.answerContent}>
              {selectedQuestion.answer && isAIAnswer(selectedQuestion.answer) ? (
                // AI Answer - Show with Tabs for Preview/HTML
                <Tabs defaultActiveKey="preview" className={styles.answerTabs}>
                  <TabPane 
                    tab={
                      <span>
                        Xem trước
                      </span>
                    } 
                    key="preview"
                  >
                    <div 
                      className={styles.htmlPreview}
                      dangerouslySetInnerHTML={{ __html: getCurrentHtmlContent() }}
                    />
                  </TabPane>
                  <TabPane 
                    tab={
                      <span>
                        Mã HTML
                      </span>
                    } 
                    key="html"
                  >
                    <div className={styles.htmlCode}>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '16px', 
                        borderRadius: '6px',
                        overflow: 'auto',
                        maxHeight: '500px',
                        fontSize: '12px',
                        lineHeight: '1.4'
                      }}>
                        <code>{getCurrentHtmlContent()}</code>
                      </pre>
                    </div>
                  </TabPane>
                </Tabs>
              ) : (
                // Manual Answer - Show edit form with tabs
                <Tabs defaultActiveKey="edit" className={styles.answerTabs}>
                  <TabPane 
                    tab={
                      <span>
                        Chỉnh sửa
                      </span>
                    } 
                    key="edit"
                  >
                    <Form
                      form={editForm}
                      layout="vertical"
                      onFinish={handleSaveAnswer}
                      className={styles.editForm}
                    >
                      <Form.Item
                        name="html"
                        label="Nội dung câu trả lời (HTML)"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung câu trả lời' }]}
                      >
                        <TextArea 
                          rows={20} 
                          placeholder="Nhập nội dung câu trả lời (hỗ trợ HTML)..."
                          className={styles.contentTextarea}
                          disabled={!isEditing}
                        />
                      </Form.Item>
                      
                      {isEditing && (
                        <Form.Item className={styles.formActions}>
                          <Space>
                            <Button
                              type="primary"
                              icon={<SaveOutlined />}
                              onClick={() => editForm.submit()}
                              size="large"
                            >
                              Lưu thay đổi
                            </Button>
                            <Button
                              icon={<CloseOutlined />}
                              onClick={handleCancelEdit}
                              size="large"
                            >
                              Hủy bỏ
                            </Button>
                          </Space>
                        </Form.Item>
                      )}
                    </Form>
                  </TabPane>
                  <TabPane 
                    tab={
                      <span>
                        Xem trước
                      </span>
                    } 
                    key="preview"
                  >
                    <div 
                      className={styles.htmlPreview}
                      dangerouslySetInnerHTML={{ __html: getCurrentHtmlContent() }}
                    />
                  </TabPane>
                
                </Tabs>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.emptyContent}>
            <Empty
              description="Chọn một câu hỏi từ sidebar để xem và chỉnh sửa câu trả lời"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </Content>

      {/* Question Modal */}
      <Modal
        title={`${editingQuestion ? 'Sửa' : 'Thêm'} câu hỏi`}
        open={questionModalVisible}
        onCancel={() => setQuestionModalVisible(false)}
        footer={null}
        width={600}
        className={styles.questionModal}
      >
        <Form
          form={questionForm}
          layout="vertical"
          onFinish={handleQuestionSubmit}
        >
          <Form.Item
            name="question"
            label="Câu hỏi"
            rules={[{ required: true, message: 'Vui lòng nhập câu hỏi' }]}
          >
            <TextArea rows={3} placeholder="Nhập câu hỏi..." />
          </Form.Item>
          <Form.Item
            name="category"
            label="Loại"
            rules={[{ required: true, message: 'Vui lòng nhập loại câu hỏi' }]}
          >
            <Input placeholder="Nhập loại câu hỏi (ví dụ: Khoa học, Lịch sử, Toán học...)" />
          </Form.Item>
          <Form.Item
            name="level"
            label="Cấp độ"
            rules={[{ required: true, message: 'Vui lòng chọn cấp độ' }]}
          >
            <Select placeholder="Chọn cấp độ">
              <Option value="elementary">Cơ bản</Option>
              <Option value="intermediate">Trung bình</Option>
              <Option value="advanced">Nâng cao</Option>
            </Select>
          </Form.Item>
        
          <Form.Item className={styles.formActions}>
            <Space>
              <Button onClick={() => setQuestionModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingQuestion ? 'Cập nhật' : 'Thêm'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Management; 