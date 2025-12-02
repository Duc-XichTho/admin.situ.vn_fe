import React, { useState } from 'react';
import { Modal, Button, Space, Tag, Typography, Divider, Card, Row, Col, Tabs, Collapse, Alert } from 'antd';
import { QuestionCircleOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, SettingOutlined, CodeOutlined, EyeOutlined } from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const QuestionContentModal = ({ visible, onCancel, questionContent, recordTitle, onUpdateQuestionContent }) => {
  const [activeTab, setActiveTab] = useState('formatted');
  const [expandedPanels, setExpandedPanels] = useState([]);

  const handleClearQuestionContent = () => {
    if (onUpdateQuestionContent) {
      onUpdateQuestionContent(null);
    }
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
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <FileTextOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
          <br />
          Không có câu hỏi {type === 'questionQuiz' ? 'trắc nghiệm' : 'tự luận'}
        </div>
      );
    }

    return (
      <Collapse
        activeKey={expandedPanels}
        onChange={setExpandedPanels}
        expandIconPosition="end"
      >
        {questions.map((question, index) => (
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
              </Space>
            }
          >
            <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ fontSize: '14px' }}>Nội dung câu hỏi:</Text>
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
              </div>

              {type === 'questionQuiz' && question.options && Array.isArray(question.options) && (
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '14px' }}>Các lựa chọn:</Text>
                  <div style={{ marginTop: '8px' }}>
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        style={{
                          padding: '10px 12px',
                          margin: '6px 0',
                          backgroundColor: question.correctAnswer === optIndex ? '#f6ffed' : 'white',
                          borderRadius: '6px',
                          border: question.correctAnswer === optIndex ? '2px solid #52c41a' : '1px solid #e8e8e8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {question.correctAnswer === optIndex ? (
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                        ) : (
                          <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
                        )}
                        <Text style={{ flex: 1, fontWeight: question.correctAnswer === optIndex ? '600' : '400' }}>
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </Text>
                        {question.correctAnswer === optIndex && (
                          <Tag color="success" icon={<CheckCircleOutlined />}>
                            Đáp án đúng
                          </Tag>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {question.explanation && (
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '14px' }}>Giải thích:</Text>
                  <Paragraph style={{ 
                    margin: '8px 0', 
                    fontSize: '14px', 
                    color: '#666',
                    backgroundColor: 'white',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #e8e8e8'
                  }}>
                    {question.explanation}
                  </Paragraph>
                </div>
              )}

              {question.expectedAnswer && (
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ fontSize: '14px' }}>Đáp án mẫu:</Text>
                  <Paragraph style={{ 
                    margin: '8px 0', 
                    fontSize: '14px', 
                    color: '#52c41a',
                    backgroundColor: '#f6ffed',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #b7eb8f'
                  }}>
                    {question.expectedAnswer}
                  </Paragraph>
                </div>
              )}
            </div>
          </Panel>
        ))}
      </Collapse>
    );
  };

  const renderQuizInfo = () => {
    const quizQuestions = questionContent.questionQuiz || [];
    const essayQuestions = questionContent.questionEssay || [];
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

  const renderSettings = () => {
    if (!questionContent.settings) {
      return (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <SettingOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
          <br />
          Không có cài đặt quiz
        </div>
      );
    }

    return (
      <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
        <Row gutter={16}>
          {questionContent.settings.timeLimit && (
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <Text strong>Thời gian làm bài:</Text>
                <br />
                <Tag color="blue" size="large" style={{ marginTop: '8px' }}>
                  {questionContent.settings.timeLimit} phút
                </Tag>
              </div>
            </Col>
          )}
          {questionContent.settings.passingScore && (
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <Text strong>Điểm đạt:</Text>
                <br />
                <Tag color="green" size="large" style={{ marginTop: '8px' }}>
                  {questionContent.settings.passingScore}%
                </Tag>
              </div>
            </Col>
          )}
          {questionContent.settings.shuffleQuestions !== undefined && (
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <Text strong>Xáo trộn câu hỏi:</Text>
                <br />
                <Tag color={questionContent.settings.shuffleQuestions ? 'success' : 'default'} size="large" style={{ marginTop: '8px' }}>
                  {questionContent.settings.shuffleQuestions ? 'Có' : 'Không'}
                </Tag>
              </div>
            </Col>
          )}
        </Row>
      </Card>
    );
  };

  const renderRawJSON = () => {
    return (
      <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '6px' }}>
        <Alert
          message="Dữ liệu JSON gốc"
          description="Đây là dữ liệu JSONB được lưu trữ trong database"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <pre style={{ 
          backgroundColor: 'white', 
          padding: '16px', 
          borderRadius: '4px', 
          border: '1px solid #e8e8e8',
          overflow: 'auto',
          fontSize: '12px',
          lineHeight: '1.5'
        }}>
          {JSON.stringify(questionContent, null, 2)}
        </pre>
      </div>
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
              <span>Câu hỏi trắc nghiệm ({questionContent.questionQuiz?.length || 0})</span>
            </Space>
          </Divider>
          {renderQuizQuestions(questionContent.questionQuiz, 'questionQuiz')}

          <Divider orientation="left">
            <Space>
              <FileTextOutlined style={{ color: '#fa8c16' }} />
              <span>Câu hỏi tự luận ({questionContent.questionEssay?.length || 0})</span>
            </Space>
          </Divider>
          {renderQuizQuestions(questionContent.questionEssay, 'questionEssay')}

          <Divider orientation="left">
            <Space>
              <SettingOutlined style={{ color: '#722ed1' }} />
              <span>Cài đặt Quiz</span>
            </Space>
          </Divider>
          {renderSettings()}
        </TabPane>

        <TabPane 
          tab={
            <span>
              <CodeOutlined />
              Raw JSON
            </span>
          } 
          key="raw"
        >
          {renderRawJSON()}
        </TabPane>
      </Tabs>
        </div>
    </Modal>
  );
};

export default QuestionContentModal;
