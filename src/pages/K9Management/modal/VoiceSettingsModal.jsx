import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Card,
} from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { MODEL_AI_LIST, MODEL_AUDIO_AI_LIST } from '../../Admin/AIGen/AI_CONST';

const { Option } = Select;

const VoiceSettingsModal = ({
  visible,
  onCancel,
  settings,
  onSave
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && settings) {
      form.setFieldsValue({
        systemMessage: settings.systemMessage,
        textModel: settings.textModel,
        audioModel: settings.audioModel,
        voiceType: settings.voiceType || 'nova',
        speed: settings.speed || 1.0,
      });
    }
  }, [visible, settings, form]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      // Thêm các giá trị hard code vào settings
      const finalSettings = {
        ...values,
      };
      onSave(finalSettings);
    });
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SoundOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <span>Cài đặt Voice Generation</span>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Lưu
        </Button>,
      ]}
    >
      <div style={{
        maxHeight: '80vh',
        overflowY: 'auto',
        padding: '24px'
      }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
        >
          <Row gutter={24}>
            {/* Left Panel - Voice Settings */}
            <Col span={12}>
              <Card title="Cài đặt Voice" size="small" style={{ height: '100%' }}>
                {/* Text Model */}
                <Form.Item
                  name="textModel"
                  label="Text Model (Model AI để chuyển đổi văn bản)"
                  rules={[{ required: true, message: 'Vui lòng chọn text model!' }]}
                >
                  <Select placeholder="Chọn text model" showSearch>
                    {MODEL_AI_LIST.map(model => (
                      <Option key={model.value} value={model.value}>
                        {model.value}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Audio Model */}
                <Form.Item
                  name="audioModel"
                  label="Audio Model (Model AI để tạo voice)"
                  rules={[{ required: true, message: 'Vui lòng chọn audio model!' }]}
                >
                  <Select placeholder="Chọn audio model" showSearch>
                    {MODEL_AUDIO_AI_LIST.map(model => (
                      <Option key={model.value} value={model.value}>
                        {model.value}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Voice Type */}
                <Form.Item
                  name="voiceType"
                  label="Voice Type (Loại giọng nói)"
                  rules={[{ required: true, message: 'Vui lòng chọn voice type!' }]}
                >
                  <Select placeholder="Chọn voice type" showSearch>
                    <Option value="alloy">alloy</Option>
                    <Option value="echo">echo</Option>
                    <Option value="fable">fable</Option>
                    <Option value="onyx">onyx</Option>
                    <Option value="nova">nova</Option>
                    <Option value="shimmer">shimmer</Option>
                    <Option value="sulafat">sulafat</Option>
                    <Option value="kore">kore</Option>
                    <Option value="callirrhoe">callirrhoe</Option>
                    <Option value="charon">charon</Option>
                    <Option value="fenrir">fenrir</Option>
                    <Option value="aoede">aoede</Option>
                    <Option value="Despina">Despina</Option>
                  </Select>
                </Form.Item>

                {/* Speed */}
                <Form.Item
                  name="speed"
                  label="Speed (Tốc độ phát âm)"
                  rules={[{ required: true, message: 'Vui lòng nhập speed!' }]}
                >
                  <Input
                    type="number"
                    min="0.25"
                    max="4.0"
                    step="0.25"
                    placeholder="Nhập tốc độ (0.25 - 4.0)"
                  />
                </Form.Item>
              </Card>
            </Col>

            {/* Right Panel - System Message */}
            <Col span={12}>
              <Card title="System Message" size="small" style={{ height: '100%' }}>
                <Form.Item
                  name="systemMessage"
                  label="Prompt để chuyển đổi văn bản đọc thành văn bản nói"
                  rules={[{ required: true, message: 'Vui lòng nhập system message!' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input.TextArea
                    rows={18}
                    placeholder="Nhập system message để hướng dẫn AI chuyển đổi văn bản..."
                    showCount
                    maxLength={10000}
                    style={{ resize: 'none' }}
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
};

export default VoiceSettingsModal;

