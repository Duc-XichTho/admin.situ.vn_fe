import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Tag, Typography, Divider, Card, Row, Col, Tabs, Collapse, Alert, Input, message, Radio } from 'antd';
import { QuestionCircleOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, EditOutlined, SaveOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const QuestionContentModal = ({ visible, onCancel, questionContent, recordTitle, onUpdateQuestionContent }) => {
  const [activeTab, setActiveTab] = useState('formatted');
  const [expandedPanels, setExpandedPanels] = useState([]);
  const [editingData, setEditingData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');
  const [jsonError, setJsonError] = useState(null);

  // Initialize editing data when modal opens or questionContent changes
  useEffect(() => {
    if (visible && questionContent) {
      setEditingData(JSON.parse(JSON.stringify(questionContent))); // Deep copy
      setIsEditing(false);
      setRawJsonText(JSON.stringify(questionContent, null, 2));
      setJsonError(null);
    }
  }, [visible, questionContent]);

  // Update raw JSON text when editingData changes (but not when user is typing in raw JSON tab)
  useEffect(() => {
    if (activeTab !== 'raw' && editingData) {
      setRawJsonText(JSON.stringify(editingData, null, 2));
      setJsonError(null);
    }
  }, [editingData, activeTab]);

  const handleClearQuestionContent = () => {
    if (onUpdateQuestionContent) {
      onUpdateQuestionContent(null);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      
      let dataToSave = editingData;

      // If in raw JSON tab, parse JSON first
      if (activeTab === 'raw') {
        try {
          const parsed = JSON.parse(rawJsonText);
          setJsonError(null);
          dataToSave = parsed;
        } catch (error) {
          setJsonError('JSON không hợp lệ: ' + error.message);
          message.error('JSON không hợp lệ. Vui lòng kiểm tra lại.');
          return;
        }
      }

      if (!dataToSave) {
        message.error('Không có dữ liệu để lưu');
        return;
      }

      // Ensure arrays exist
      if (!dataToSave.questionQuiz) dataToSave.questionQuiz = [];
      if (!dataToSave.questionEssay) dataToSave.questionEssay = [];

      // Save
      if (onUpdateQuestionContent) {
        await onUpdateQuestionContent(dataToSave);
        setIsEditing(false);
        setJsonError(null);
        message.success('Cập nhật thành công!');
      }
    } catch (error) {
      console.error('Error saving question content:', error);
      message.error('Lỗi khi lưu: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleRawJsonChange = (value) => {
    setRawJsonText(value);
    // Try to parse JSON to validate
    try {
      JSON.parse(value);
      setJsonError(null);
      // Update editingData if valid
      const parsed = JSON.parse(value);
      setEditingData(parsed);
    } catch (error) {
      setJsonError('JSON không hợp lệ: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    if (questionContent) {
      setEditingData(JSON.parse(JSON.stringify(questionContent))); // Reset to original
    }
    setIsEditing(false);
  };

  const handleAddQuizQuestion = () => {
    if (!editingData) return;
    const newQuestion = {
      question: '',
      options: {
        A: '',
        B: '',
        C: '',
        D: ''
      },
      correct_answer: 'A',
      explanation: ''
    };
    setEditingData({
      ...editingData,
      questionQuiz: [...(editingData.questionQuiz || []), newQuestion]
    });
    setIsEditing(true);
  };

  const handleAddEssayQuestion = () => {
    if (!editingData) return;
    const newQuestion = {
      question: '',
      expectedAnswer: ''
    };
    setEditingData({
      ...editingData,
      questionEssay: [...(editingData.questionEssay || []), newQuestion]
    });
    setIsEditing(true);
  };

  const handleDeleteQuizQuestion = (index) => {
    if (!editingData) return;
    const newQuizQuestions = [...(editingData.questionQuiz || [])];
    newQuizQuestions.splice(index, 1);
    setEditingData({
      ...editingData,
      questionQuiz: newQuizQuestions
    });
    setIsEditing(true);
  };

  const handleDeleteEssayQuestion = (index) => {
    if (!editingData) return;
    const newEssayQuestions = [...(editingData.questionEssay || [])];
    newEssayQuestions.splice(index, 1);
    setEditingData({
      ...editingData,
      questionEssay: newEssayQuestions
    });
    setIsEditing(true);
  };

  const handleUpdateQuizQuestion = (index, field, value) => {
    if (!editingData) return;
    const newQuizQuestions = [...(editingData.questionQuiz || [])];
    newQuizQuestions[index] = {
      ...newQuizQuestions[index],
      [field]: value
    };
    setEditingData({
      ...editingData,
      questionQuiz: newQuizQuestions
    });
    setIsEditing(true);
  };

  const handleUpdateEssayQuestion = (index, field, value) => {
    if (!editingData) return;
    const newEssayQuestions = [...(editingData.questionEssay || [])];
    newEssayQuestions[index] = {
      ...newEssayQuestions[index],
      [field]: value
    };
    setEditingData({
      ...editingData,
      questionEssay: newEssayQuestions
    });
    setIsEditing(true);
  };

  const handleUpdateQuizOption = (questionIndex, optionKey, value) => {
    if (!editingData) return;
    const newQuizQuestions = [...(editingData.questionQuiz || [])];
    const currentOptions = newQuizQuestions[questionIndex].options || {};
    newQuizQuestions[questionIndex] = {
      ...newQuizQuestions[questionIndex],
      options: {
        ...currentOptions,
        [optionKey]: value
      }
    };
    setEditingData({
      ...editingData,
      questionQuiz: newQuizQuestions
    });
    setIsEditing(true);
  };

  const handleAddQuizOption = (questionIndex) => {
    if (!editingData) return;
    const newQuizQuestions = [...(editingData.questionQuiz || [])];
    const currentOptions = newQuizQuestions[questionIndex].options || {};
    const optionKeys = Object.keys(currentOptions);
    const nextKey = optionKeys.length > 0 
      ? String.fromCharCode(Math.max(...optionKeys.map(k => k.charCodeAt(0))) + 1)
      : 'A';
    newQuizQuestions[questionIndex] = {
      ...newQuizQuestions[questionIndex],
      options: {
        ...currentOptions,
        [nextKey]: ''
      }
    };
    setEditingData({
      ...editingData,
      questionQuiz: newQuizQuestions
    });
    setIsEditing(true);
  };

  const handleDeleteQuizOption = (questionIndex, optionKey) => {
    if (!editingData) return;
    const newQuizQuestions = [...(editingData.questionQuiz || [])];
    const currentOptions = { ...(newQuizQuestions[questionIndex].options || {}) };
    delete currentOptions[optionKey];
    newQuizQuestions[questionIndex] = {
      ...newQuizQuestions[questionIndex],
      options: currentOptions
    };
    setEditingData({
      ...editingData,
      questionQuiz: newQuizQuestions
    });
    setIsEditing(true);
  };

  if (!questionContent) {
    return (
      <Modal
        title={
          <Space>
            <QuestionCircleOutlined />
            <span>Nội dung Quiz - {recordTitle}</span>
          </Space>
        }
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="clear" danger onClick={handleClearQuestionContent}>
            Xóa Quiz
          </Button>,
          <Button key="close" onClick={onCancel}>
            Đóng
          </Button>
        ]}
        width={900}
      >
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <QuestionCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <Title level={4} style={{ color: '#666' }}>
            Không có nội dung quiz
          </Title>
          <Text type="secondary">
            Item này chưa có nội dung quiz được thiết lập.
          </Text>
        </div>
      </Modal>
    );
  }

  const renderQuizQuestions = (questions, type) => {
    const displayQuestions = isEditing && editingData 
      ? (type === 'questionQuiz' ? editingData.questionQuiz : editingData.questionEssay) || []
      : questions || [];

    if (!displayQuestions || !Array.isArray(displayQuestions) || displayQuestions.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <FileTextOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
          <br />
          Không có câu hỏi {type === 'questionQuiz' ? 'trắc nghiệm' : 'tự luận'}
          {isEditing && (
            <div style={{ marginTop: '12px' }}>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                onClick={type === 'questionQuiz' ? handleAddQuizQuestion : handleAddEssayQuestion}
              >
                Thêm câu hỏi {type === 'questionQuiz' ? 'trắc nghiệm' : 'tự luận'}
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        {isEditing && (
          <div style={{ marginBottom: '16px', textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={type === 'questionQuiz' ? handleAddQuizQuestion : handleAddEssayQuestion}
            >
              Thêm câu hỏi {type === 'questionQuiz' ? 'trắc nghiệm' : 'tự luận'}
            </Button>
          </div>
        )}
        <Collapse
          activeKey={expandedPanels}
          onChange={setExpandedPanels}
          expandIconPosition="end"
        >
          {displayQuestions.map((question, index) => (
            <Panel
              key={index}
              header={
                <Space>
                  <FileTextOutlined style={{ color: '#1890ff' }} />
                  <span>Câu hỏi {index + 1}</span>
                  {question.difficulty && (
                    <Tag color={
                      question.difficulty === 'easy' ? 'green' :
                      question.difficulty === 'medium' ? 'orange' :
                      question.difficulty === 'hard' ? 'red' : 'default'
                    } size="small">
                      {question.difficulty === 'easy' ? 'Dễ' :
                       question.difficulty === 'medium' ? 'Trung bình' :
                       question.difficulty === 'hard' ? 'Khó' : question.difficulty}
                    </Tag>
                  )}
                  {question.points && (
                    <Tag color="blue" size="small">
                      {question.points} điểm
                    </Tag>
                  )}
                  {isEditing && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (type === 'questionQuiz') {
                          handleDeleteQuizQuestion(index);
                        } else {
                          handleDeleteEssayQuestion(index);
                        }
                      }}
                    >
                      Xóa
                    </Button>
                  )}
                </Space>
              }
            >
              <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '14px' }}>Nội dung câu hỏi:</Text>
                  {isEditing ? (
                    <TextArea
                      value={question.question || question.content || ''}
                      onChange={(e) => handleUpdateQuizQuestion(index, 'question', e.target.value)}
                      rows={3}
                      style={{ marginTop: '8px' }}
                      placeholder="Nhập nội dung câu hỏi..."
                    />
                  ) : (
                    <Paragraph style={{ 
                      margin: '8px 0', 
                      fontSize: '14px',
                      backgroundColor: 'white',
                      padding: '12px',
                      borderRadius: '4px',
                      border: '1px solid #e8e8e8'
                    }}>
                      {question.question || question.content || 'Không có nội dung'}
                    </Paragraph>
                  )}
                </div>

                {type === 'questionQuiz' && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Text strong style={{ fontSize: '14px' }}>Các lựa chọn:</Text>
                      {isEditing && (
                        <Button 
                          type="dashed" 
                          size="small" 
                          icon={<PlusOutlined />}
                          onClick={() => handleAddQuizOption(index)}
                        >
                          Thêm lựa chọn
                        </Button>
                      )}
                    </div>
                    {isEditing ? (
                      <div style={{ marginTop: '8px' }}>
                        {question.options && typeof question.options === 'object' ? (
                          Object.entries(question.options || {}).map(([optionKey, optionValue]) => (
                            <div key={optionKey} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Text style={{ width: '30px' }}>{optionKey}.</Text>
                              <Input
                                value={optionValue || ''}
                                onChange={(e) => handleUpdateQuizOption(index, optionKey, e.target.value)}
                                placeholder={`Lựa chọn ${optionKey}`}
                                style={{ flex: 1 }}
                              />
                              <Radio
                                checked={question.correct_answer === optionKey}
                                onChange={() => handleUpdateQuizQuestion(index, 'correct_answer', optionKey)}
                              >
                                Đúng
                              </Radio>
                              {Object.keys(question.options || {}).length > 2 && (
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteQuizOption(index, optionKey)}
                                />
                              )}
                            </div>
                          ))
                        ) : (
                          <Text type="secondary" style={{ fontStyle: 'italic' }}>Không có lựa chọn</Text>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: '8px' }}>
                        {question.options && typeof question.options === 'object' && Object.keys(question.options).length > 0 ? (
                          Object.entries(question.options)
                            .filter(([key, value]) => value && value.trim() !== '') // Chỉ hiển thị options có giá trị
                            .map(([optionKey, optionValue]) => {
                              const isCorrect = question.correct_answer === optionKey;
                              return (
                                <div
                                  key={optionKey}
                                  style={{
                                    padding: '10px 12px',
                                    margin: '6px 0',
                                    backgroundColor: isCorrect ? '#f6ffed' : 'white',
                                    borderRadius: '6px',
                                    border: isCorrect ? '2px solid #52c41a' : '1px solid #e8e8e8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  {isCorrect ? (
                                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                                  ) : (
                                    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
                                  )}
                                  <Text style={{ flex: 1, fontWeight: isCorrect ? '600' : '400' }}>
                                    {optionKey}. {optionValue}
                                  </Text>
                                  {isCorrect && (
                                    <Tag color="success" icon={<CheckCircleOutlined />}>
                                      Đáp án đúng
                                    </Tag>
                                  )}
                                </div>
                              );
                            })
                        ) : (
                          <Text type="secondary" style={{ fontStyle: 'italic' }}>Không có lựa chọn</Text>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '14px' }}>Giải thích:</Text>
                  {isEditing ? (
                    <TextArea
                      value={question.explanation || ''}
                      onChange={(e) => {
                        if (type === 'questionQuiz') {
                          handleUpdateQuizQuestion(index, 'explanation', e.target.value);
                        } else {
                          handleUpdateEssayQuestion(index, 'explanation', e.target.value);
                        }
                      }}
                      rows={3}
                      style={{ marginTop: '8px' }}
                      placeholder="Nhập giải thích..."
                    />
                  ) : (
                    <Paragraph style={{ 
                      margin: '8px 0', 
                      fontSize: '14px', 
                      color: question.explanation ? '#666' : '#999',
                      backgroundColor: 'white',
                      padding: '12px',
                      borderRadius: '4px',
                      border: '1px solid #e8e8e8',
                      fontStyle: question.explanation ? 'normal' : 'italic',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {question.explanation || 'Không có giải thích'}
                    </Paragraph>
                  )}
                </div>

                {question.analysis_note && (
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong style={{ fontSize: '14px' }}>Ghi chú phân tích:</Text>
                    {isEditing ? (
                      <TextArea
                        value={question.analysis_note || ''}
                        onChange={(e) => {
                          if (type === 'questionQuiz') {
                            handleUpdateQuizQuestion(index, 'analysis_note', e.target.value);
                          } else {
                            handleUpdateEssayQuestion(index, 'analysis_note', e.target.value);
                          }
                        }}
                        rows={2}
                        style={{ marginTop: '8px' }}
                        placeholder="Nhập ghi chú phân tích..."
                      />
                    ) : (
                      <Paragraph style={{ 
                        margin: '8px 0', 
                        fontSize: '13px', 
                        color: '#8c8c8c',
                        backgroundColor: '#fafafa',
                        padding: '10px 12px',
                        borderRadius: '4px',
                        border: '1px solid #e8e8e8',
                        fontStyle: 'italic',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {question.analysis_note}
                      </Paragraph>
                    )}
                  </div>
                )}

                {type === 'questionEssay' && (
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong style={{ fontSize: '14px' }}>Đáp án mẫu:</Text>
                    {isEditing ? (
                      <TextArea
                        value={question.expectedAnswer || ''}
                        onChange={(e) => handleUpdateEssayQuestion(index, 'expectedAnswer', e.target.value)}
                        rows={4}
                        style={{ marginTop: '8px' }}
                        placeholder="Nhập đáp án mẫu..."
                      />
                    ) : (
                      <Paragraph style={{ 
                        margin: '8px 0', 
                        fontSize: '14px', 
                        color: question.expectedAnswer ? '#52c41a' : '#999',
                        backgroundColor: question.expectedAnswer ? '#f6ffed' : '#fafafa',
                        padding: '12px',
                        borderRadius: '4px',
                        border: question.expectedAnswer ? '1px solid #b7eb8f' : '1px solid #e8e8e8',
                        fontStyle: question.expectedAnswer ? 'normal' : 'italic'
                      }}>
                        {question.expectedAnswer || 'Không có đáp án mẫu'}
                      </Paragraph>
                    )}
                  </div>
                )}
              </div>
            </Panel>
          ))}
        </Collapse>
      </>
    );
  };

  const renderQuizInfo = () => {
    const currentData = isEditing && editingData ? editingData : questionContent;
    const quizQuestions = currentData?.questionQuiz || [];
    const essayQuestions = currentData?.questionEssay || [];
    const totalQuestions = quizQuestions.length + essayQuestions.length;
    const totalPoints = [...quizQuestions, ...essayQuestions].reduce((sum, q) => sum + (q.points || 0), 0);

    return (
      <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                {totalQuestions}
              </Title>
              <Text type="secondary">Tổng số câu hỏi</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                {quizQuestions.length}
              </Title>
              <Text type="secondary">Câu hỏi trắc nghiệm</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
                {essayQuestions.length}
              </Title>
              <Text type="secondary">Câu hỏi tự luận</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#722ed1' }}>
                {totalPoints}
              </Title>
              <Text type="secondary">Tổng điểm</Text>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };



  return (
    <Modal
      title={
        <Space>
          <QuestionCircleOutlined />
          <span>Nội dung Quiz - {recordTitle}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="clear" danger onClick={handleClearQuestionContent}>
          Xóa Quiz
        </Button>,
        isEditing ? (
          <>
            <Button key="cancel" onClick={handleCancelEdit}>
              Hủy
            </Button>
            <Button 
              key="save" 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={handleSaveEdit}
              loading={saving}
            >
              Lưu thay đổi
            </Button>
          </>
        ) : (
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
            Chỉnh sửa
          </Button>
        ),
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>
      ]}
      width={1000}
      style={{ top: 20 }}
    >
      <div style={{height: 500, overflowY: 'auto'}}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <EyeOutlined />
              Xem chi tiết
            </span>
          } 
          key="formatted"
        >
          {renderQuizInfo()}

          <Divider orientation="left">
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span>Câu hỏi trắc nghiệm ({isEditing && editingData ? editingData.questionQuiz?.length || 0 : questionContent.questionQuiz?.length || 0})</span>
            </Space>
          </Divider>
          {renderQuizQuestions(isEditing && editingData ? editingData.questionQuiz : questionContent.questionQuiz, 'questionQuiz')}

          <Divider orientation="left">
            <Space>
              <FileTextOutlined style={{ color: '#fa8c16' }} />
              <span>Câu hỏi tự luận ({isEditing && editingData ? editingData.questionEssay?.length || 0 : questionContent.questionEssay?.length || 0})</span>
            </Space>
          </Divider>
          {renderQuizQuestions(isEditing && editingData ? editingData.questionEssay : questionContent.questionEssay, 'questionEssay')}

        </TabPane>

        <TabPane 
          tab={
            <span>
              <FileTextOutlined />
              Raw JSON
            </span>
          } 
          key="raw"
        >
          <Alert
            message="Chỉnh sửa JSON trực tiếp"
            description="Bạn có thể chỉnh sửa JSON trực tiếp ở đây. Đảm bảo JSON hợp lệ trước khi lưu."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          {jsonError && (
            <Alert
              message="Lỗi JSON"
              description={jsonError}
              type="error"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}
          <TextArea
            value={rawJsonText}
            onChange={(e) => handleRawJsonChange(e.target.value)}
            rows={20}
            style={{ 
              fontFamily: 'monospace',
              fontSize: '13px'
            }}
            placeholder='{"questionQuiz": [], "questionEssay": []}'
          />
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <Button
              onClick={() => {
                try {
                  const parsed = JSON.parse(rawJsonText);
                  setEditingData(parsed);
                  setJsonError(null);
                  message.success('JSON hợp lệ!');
                } catch (error) {
                  setJsonError('JSON không hợp lệ: ' + error.message);
                  message.error('JSON không hợp lệ');
                }
              }}
              style={{ marginRight: '8px' }}
            >
              Validate JSON
            </Button>
            <Button
              onClick={() => {
                if (questionContent) {
                  setRawJsonText(JSON.stringify(questionContent, null, 2));
                  setJsonError(null);
                  message.info('Đã khôi phục về dữ liệu gốc');
                }
              }}
            >
              Khôi phục
            </Button>
          </div>
        </TabPane>

      </Tabs>
        </div>
    </Modal>
  );
};

export default QuestionContentModal;
