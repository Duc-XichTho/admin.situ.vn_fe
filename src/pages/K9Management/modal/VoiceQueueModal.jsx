import React from 'react';
import {
  Modal,
  List,
  Button,
  Badge,
  Typography,
  Tag,
  Space,
  Empty,
  Divider,
  Progress
} from 'antd';
import {
  SoundOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const VoiceQueueModal = ({
  visible,
  onCancel,
  voiceQueue,
  currentProcessing,
  onStopTask,
  completedTasks = []
}) => {
  const getTaskStatus = (task) => {
    if (currentProcessing && currentProcessing.id === task.id) {
      return {
        status: 'processing',
        icon: <LoadingOutlined spin style={{ color: '#1890ff', fontSize: '18px' }} />,
        badge: <Badge status="processing" text="Đang xử lý" />,
        color: '#1890ff'
      };
    }
    return {
      status: 'waiting',
      icon: <SoundOutlined style={{ color: '#faad14', fontSize: '18px' }} />,
      badge: <Badge status="default" text="Đang chờ" />,
      color: '#faad14'
    };
  };

  // Combine all tasks: processing, waiting, and completed
  const allTasks = [
    ...(currentProcessing ? [currentProcessing] : []),
    ...voiceQueue
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SoundOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>Voice Generation Queue</Title>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>,
      ]}
    >
      {/* Processing Task */}
      {currentProcessing && (
        <div style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ marginBottom: '16px' }}>
            🔄 Đang xử lý
          </Title>
          <div
            style={{
              padding: '16px',
              border: '2px solid #1890ff',
              borderRadius: '8px',
              backgroundColor: '#e6f7ff'
            }}
          >
            <List.Item>
              <List.Item.Meta
                avatar={<LoadingOutlined spin style={{ fontSize: '24px', color: '#1890ff' }} />}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong>{currentProcessing.title}</Text>
                    <Tag color="processing">Đang tạo voice...</Tag>
                  </div>
                }
                description={
                  <div>
                    <Space size="small" style={{ marginBottom: '8px' }}>
                      <Badge status="processing" text="Đang xử lý" />
                      {onStopTask && (
                        <Button
                          size="small"
                          danger
                          icon={<StopOutlined />}
                          onClick={() => onStopTask(currentProcessing.id)}
                        >
                          Dừng
                        </Button>
                      )}
                    </Space>
                    <Progress percent={50} status="active" strokeColor="#1890ff" />
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      • Record ID: {currentProcessing.recordId}<br/>
                      • Bắt đầu: {new Date(currentProcessing.createdAt || Date.now()).toLocaleString('vi-VN')}<br/>
                    </div>
                  </div>
                }
              />
            </List.Item>
          </div>
        </div>
      )}

      {/* Waiting Queue */}
      {voiceQueue.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ marginBottom: '16px' }}>
            📝 Hàng đợi ({voiceQueue.length})
          </Title>
          <List
            dataSource={voiceQueue}
            renderItem={(task, index) => {
              const taskStatus = getTaskStatus(task);
              return (
                <List.Item
                  style={{
                    padding: '12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    backgroundColor: '#fafafa'
                  }}
                  actions={[
                    <Button
                      key="stop"
                      size="small"
                      danger
                      icon={<StopOutlined />}
                      onClick={() => onStopTask && onStopTask(task.id)}
                      disabled={!onStopTask}
                    >
                      Dừng
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={taskStatus.icon}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text>#{index + 1}</Text>
                        <Text strong>{task.title}</Text>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: '4px' }}>{taskStatus.badge}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          • Record ID: {task.recordId}<br/>
                          • Source: {task.source || 'N/A'}<br/>
                          • Tạo lúc: {new Date(task.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>
      )}

      {/* Summary */}
      {allTasks.length > 0 && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f0f2f5',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Tổng số task:</Text>
              <Text style={{ marginLeft: '8px', fontSize: '16px', fontWeight: 'bold' }}>
                {allTasks.length}
              </Text>
            </div>
            <div>
              <Text strong>Đang xử lý:</Text>
              <Text style={{ marginLeft: '8px', fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                {currentProcessing ? '1' : '0'}
              </Text>
            </div>
            <div>
              <Text strong>Chờ xử lý:</Text>
              <Text style={{ marginLeft: '8px', fontSize: '16px', fontWeight: 'bold', color: '#faad14' }}>
                {voiceQueue.length}
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {allTasks.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Không có task nào trong queue"
        />
      )}
    </Modal>
  );
};

export default VoiceQueueModal;

