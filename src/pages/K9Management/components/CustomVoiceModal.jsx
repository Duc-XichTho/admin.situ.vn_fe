import React from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { SoundOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const CustomVoiceModal = ({
  visible,
  onCancel,
  onConfirm,
  customVoiceText,
  setCustomVoiceText,
  addVoiceToQueue
}) => {
  const handleCreateVoice = async () => {
    if (!customVoiceText.trim()) {
      message.warning('Vui lòng nhập nội dung để tạo voice!');
      return;
    }

    // Add to voice queue
    const task = addVoiceToQueue(
      `custom_${Date.now()}`,
      'Voice tùy chỉnh',
      customVoiceText,
      'custom'
    );

    if (task) {
      message.success('📝 Đã thêm voice tùy chỉnh vào hàng đợi!');
      setCustomVoiceText('');
      onCancel();
    }
  };

  return (
    <Modal
      title="Tạo Voice Tùy chỉnh"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="create"
          type="primary"
          icon={<SoundOutlined />}
          onClick={handleCreateVoice}
          disabled={!customVoiceText.trim()}
        >
          Thêm vào hàng đợi
        </Button>
      ]}
      width={600}
      centered={true}
    >
      <Form layout="vertical">
        <Form.Item
          label="Nội dung Voice"
          required
        >
          <TextArea
            rows={8}
            placeholder="Nhập nội dung để tạo voice..."
            value={customVoiceText}
            onChange={(e) => setCustomVoiceText(e.target.value)}
            showCount
            maxLength={50000}
          />
          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
            Nội dung này sẽ được sử dụng để tạo voice. Tối đa 50000 ký tự.
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomVoiceModal; 