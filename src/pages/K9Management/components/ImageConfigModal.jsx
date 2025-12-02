import React from 'react';
import { Modal, Select, TextArea } from 'antd';
import { MODEL_AI_LIST, MODEL_IMG_AI_LIST } from '../../Admin/AIGen/AI_CONST.js';

const { Option } = Select;

const ImageConfigModal = ({
  imageConfigModalVisible,
  setImageConfigModalVisible,
  imageConfig,
  setImageConfig,
  saveImageConfig
}) => {
  return (
    <Modal
      title="Cấu hình tạo ảnh"
      open={imageConfigModalVisible}
      onOk={saveImageConfig}
      onCancel={() => setImageConfigModalVisible(false)}
      width={800}
      centered={true}
      okText="Lưu"
      cancelText="Hủy"
    >
      <div style={{ padding: '20px 0' }}>
        {/* Description Model Configuration */}
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ marginBottom: '15px', color: '#1890ff' }}>🔤 Cấu hình tạo mô tả tiếng Anh</h4>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Model AI:
            </label>
            <Select
              value={imageConfig.descriptionModel}
              onChange={(value) => setImageConfig(prev => ({ ...prev, descriptionModel: value }))}
              style={{ width: '100%' }}
            >
              {MODEL_AI_LIST.map(model => (
                <Option key={model.value} value={model.value}>
                  {model.name}
                </Option>
              ))}
            </Select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              System Message:
            </label>
            <TextArea
              value={imageConfig.descriptionSystemMessage}
              onChange={(e) => setImageConfig(prev => ({ ...prev, descriptionSystemMessage: e.target.value }))}
              rows={4}
              placeholder="Nhập system message cho việc tạo mô tả tiếng Anh..."
            />
          </div>
        </div>

        {/* Image Model Configuration */}
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ marginBottom: '15px', color: '#1890ff' }}>🎨 Cấu hình tạo ảnh</h4>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Model AI:
            </label>
            <Select
              value={imageConfig.imageModel}
              onChange={(value) => setImageConfig(prev => ({ ...prev, imageModel: value }))}
              style={{ width: '100%' }}
            >
              {MODEL_IMG_AI_LIST.map(model => (
                <Option key={model.value} value={model.value}>
                  {model.name}
                </Option>
              ))}
            </Select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              System Message:
            </label>
            <TextArea
              value={imageConfig.imageSystemMessage}
              onChange={(e) => setImageConfig(prev => ({ ...prev, imageSystemMessage: e.target.value }))}
              rows={4}
              placeholder="Nhập system message cho việc tạo ảnh..."
            />
          </div>
        </div>

        {/* Template Configuration */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '15px', color: '#1890ff' }}>📝 Template mô tả tiếng Anh</h4>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Template:
            </label>
            <TextArea
              value={imageConfig.englishPromptTemplate}
              onChange={(e) => setImageConfig(prev => ({ ...prev, englishPromptTemplate: e.target.value }))}
              rows={8}
              placeholder="Nhập template cho việc tạo mô tả tiếng Anh..."
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              Template này sẽ được kết hợp với nội dung summary để tạo prompt cho AI. Luôn trả về format "1. [mô tả]" để hệ thống có thể parse chính xác.
            </div>
          </div>
        </div>

        {/* Current Configuration Summary */}
        <div style={{
          backgroundColor: '#f6f8fa',
          padding: '15px',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#586069'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>📋 Cấu hình hiện tại:</div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Model tạo mô tả:</strong> {MODEL_AI_LIST.find(m => m.value === imageConfig.descriptionModel)?.name || imageConfig.descriptionModel}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Model tạo ảnh:</strong> {MODEL_IMG_AI_LIST.find(m => m.value === imageConfig.imageModel)?.name || imageConfig.imageModel}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>System message mô tả:</strong> {imageConfig.descriptionSystemMessage.substring(0, 50)}...
          </div>
          <div>
            <strong>System message ảnh:</strong> {imageConfig.imageSystemMessage.substring(0, 50)}...
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ImageConfigModal; 