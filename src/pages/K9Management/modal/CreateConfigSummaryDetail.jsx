import { Modal, Select, Input, Form } from 'antd';
import { MODEL_AI_LIST } from '../../Admin/AIGen/AI_CONST.js';
import styles from './CreateConfigDiagram.module.css';

const { Option } = Select;
const { TextArea } = Input;

export default function CreateConfigSummaryDetail({
  summaryDetailConfigModalVisible,
  setSummaryDetailConfigModalVisible,
  summaryDetailConfig,
  setSummaryDetailConfig,
  saveSummaryDetailConfig
}) {
  return (
    <Modal
      title="Cấu hình tóm tắt Detail"
      open={summaryDetailConfigModalVisible}
      onOk={saveSummaryDetailConfig}
      onCancel={() => setSummaryDetailConfigModalVisible(false)}
      width={800}
      centered={true}
      okText="Lưu"
      cancelText="Hủy"
      className={styles.diagramConfigModal}
    >
      <div className={styles.contentContainer}>
        <div className={styles.configSection}>
          <h5 className={styles.aiConfigTitle}>🤖 Cấu hình AI tóm tắt Detail</h5>
          
          <div style={{ marginBottom: '16px' }}>
            <label className={styles.aiStepLabel}>
              AI Model:
            </label>
            <Select
              value={summaryDetailConfig.aiModel}
              onChange={(value) => setSummaryDetailConfig(prev => ({ 
                ...prev, 
                aiModel: value 
              }))}
              style={{ width: '100%' }}
              size="small"
              placeholder="Chọn AI Model"
            >
              {MODEL_AI_LIST.map(model => (
                <Option key={model.value} value={model.value}>
                  {model.name}
                </Option>
              ))}
            </Select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label className={styles.aiStepLabel}>
              AI Prompt (System Message):
            </label>
            <TextArea
              value={summaryDetailConfig.aiPrompt || ''}
              onChange={(e) => setSummaryDetailConfig(prev => ({ 
                ...prev, 
                aiPrompt: e.target.value 
              }))}
              placeholder="Nhập system message cho AI tóm tắt detail..."
              autoSize={{ minRows: 8, maxRows: 12 }}
              size="small"
            />
          </div>
          
          <div className={styles.aiStepDescription}>
            Detail → SummaryDetail (Tóm tắt ngắn gọn, súc tích, giữ lại thông tin quan trọng)
          </div>
        </div>
      </div>
    </Modal>
  );
}

