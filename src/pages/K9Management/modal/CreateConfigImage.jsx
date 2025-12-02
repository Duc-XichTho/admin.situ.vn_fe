import { Modal, Select, Input, Row, Col } from 'antd';
import { MODEL_AI_LIST, MODEL_IMG_AI_LIST } from '../../Admin/AIGen/AI_CONST.js';

const { Option } = Select;
const { TextArea } = Input;

export default function CreateConfigImage({ imageConfigModalVisible, setImageConfigModalVisible, imageConfig, setImageConfig, saveImageConfig }) {
  return (
    <Modal
      title="Cấu hình tạo ảnh"
      open={imageConfigModalVisible}
      onOk={saveImageConfig}
      onCancel={() => setImageConfigModalVisible(false)}
      width={1200}
      centered={true}
      okText="Lưu"
      cancelText="Hủy"
    >
      <div style={{ padding: '20px 10px', height: '61vh', overflowY: 'auto' }}>
        <Row gutter={24}>
          {/* Cột trái: Cấu hình AI Models */}
          <Col span={24}>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
                🤖 Cấu hình AI Models
              </h4>
              
              {/* Description Model */}
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h5 style={{ marginBottom: '10px', color: '#1890ff' }}>🔤 Model tạo mô tả tiếng Anh</h5>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>
                    Model AI:
                  </label>
                  <Select
                    value={imageConfig.descriptionModel}
                    onChange={(value) => setImageConfig(prev => ({ ...prev, descriptionModel: value }))}
                    style={{ width: '100%' }}
                    size="small"
                  >
                    {MODEL_AI_LIST.map(model => (
                      <Option key={model.value} value={model.value}>
                        {model.name}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>
                    System Message:
                  </label>
                  <TextArea
                    value={imageConfig.descriptionSystemMessage}
                    onChange={(e) => setImageConfig(prev => ({ ...prev, descriptionSystemMessage: e.target.value }))}
                    rows={10}
                    placeholder="Nhập system message cho việc tạo mô tả tiếng Anh..."
                    size="small"
                  />
                </div>
                <div style={{ margin: '12px 0' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>
                    Model tạo ảnh:
                  </label>
                  <Select
                    value={imageConfig.imageModel}
                    onChange={(value) => setImageConfig(prev => ({ ...prev, imageModel: value }))}
                    style={{ width: '100%' }}
                    size="small"
                  >
                    {MODEL_IMG_AI_LIST.map(model => (
                      <Option key={model.value} value={model.value}>
                        {model.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Current Configuration Summary */}
        <div style={{
          backgroundColor: '#e6f7ff',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#1890ff',
          marginTop: '20px',
          border: '1px solid #91d5ff'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '14px' }}>📋 Cấu hình hiện tại:</div>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Model tạo mô tả:</strong> {MODEL_AI_LIST.find(m => m.value === imageConfig.descriptionModel)?.name || imageConfig.descriptionModel}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Model tạo ảnh:</strong> {MODEL_IMG_AI_LIST.find(m => m.value === imageConfig.imageModel)?.name || imageConfig.imageModel}
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Meta Prompt:</strong> {(imageConfig.metaPrompt || '').substring(0, 40)}...
              </div>
              {/* <div>
                <strong>Template:</strong> {(imageConfig.englishPromptTemplate || '').substring(0, 40)}...
              </div> */}
            </Col>
          </Row>
        </div>
      </div>
    </Modal>
  )
}