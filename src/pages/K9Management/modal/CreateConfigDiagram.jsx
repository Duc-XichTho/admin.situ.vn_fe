import { Modal, Select, Input, Row, Col, Divider, Form, Tabs } from 'antd';
import { MODEL_AI_LIST } from '../../Admin/AIGen/AI_CONST.js';
import styles from './CreateConfigDiagram.module.css';

const { Option } = Select;
const { TabPane } = Tabs;

export default function CreateConfigDiagram({ diagramConfigModalVisible, setDiagramConfigModalVisible, diagramConfig, setDiagramConfig, saveDiagramConfig }) {
    return (
        <Modal
            title="Cấu hình tạo diagram AI"
            open={diagramConfigModalVisible}
            onOk={saveDiagramConfig}
            onCancel={() => setDiagramConfigModalVisible(false)}
            width={1400}
            centered={true}
            okText="Lưu"
            cancelText="Hủy"
            className={styles.diagramConfigModal}
        >
            <div className={styles.contentContainer}>
                <Tabs 
                    type="card"
                >
                    {/* HTML Code Tab */}
                    <TabPane tab="💻 HTML Code" key="html">
                        <div className={styles.configSection}>
                          
                            {/* AI Single-Step Configuration */}
                            <div className={styles.aiConfigSection}>
                                <h5 className={styles.aiConfigTitle}>🤖 Cấu hình AI</h5>
                                
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <div className={styles.aiStepContainer}>
                                            <h6 className={`${styles.aiStepTitle} ${styles.ai1}`}>🎨 AI - Tạo HTML code</h6>
                                            
                                            <div className={styles.aiStepModel}>
                                                <label className={styles.aiStepLabel}>
                                                    AI Model:
                                                </label>
                                                <Select
                                                    value={diagramConfig.html?.ai4Model }
                                                    onChange={(value) => setDiagramConfig(prev => ({ 
                                                        ...prev, 
                                                        html: { 
                                                            ...prev.html, 
                                                            aiModel: prev.html?.aiModel,
                                                            ai4Model: value 
                                                        }
                                                    }))}
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
                                            
                                            <div className={styles.aiStepPrompt}>
                                                <label className={styles.aiStepLabel}>
                                                    AI Prompt:
                                                </label>
                                                <Input.TextArea
                                                    value={diagramConfig.html?.ai4Prompt || ''}
                                                    onChange={(e) => setDiagramConfig(prev => ({ 
                                                        ...prev, 
                                                        html: { 
                                                            ...prev.html, 
                                                            aiModel: prev.html?.aiModel,
                                                            ai4Prompt: e.target.value 
                                                        }
                                                    }))}
                                                    placeholder="Prompt AI..."
                                                    autoSize={{ minRows: 8, maxRows: 12 }}
                                                    size="small"
                                                />
                                            </div>
                                            
                                            <div className={styles.aiStepDescription}>
                                                Nội dung bài viết → Tạo HTML code
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </TabPane>

                    {/* Excalidraw React Tab */}
                    <TabPane tab="🎨 Excalidraw React" key="excalidraw-react">
                        <div className={styles.configSection}>
                            <div className={styles.diagramConfigSection}>
                                <h5 className={styles.diagramConfigTitle}>🔧 Cấu hình Excalidraw React</h5>
                                <div className={styles.diagramConfigDescription}>
                                    Tạo diagram sử dụng React Excalidraw component (không cần API bên ngoài)
                                </div>
                            </div>

                            <Divider />

                            {/* AI Configuration for Excalidraw JSON */}
                            <div className={styles.aiConfigSection}>
                                <h5 className={styles.aiConfigTitle}>🤖 Cấu hình AI tạo Excalidraw JSON</h5>
                                
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <div className={styles.aiStepContainer}>
                                            <h6 className={`${styles.aiStepTitle} ${styles.ai1}`}>🎨 AI - Tạo Excalidraw JSON</h6>
                                            
                                            <div className={styles.aiStepModel}>
                                                <label className={styles.aiStepLabel}>
                                                    AI Model:
                                                </label>
                                                <Select
                                                    value={diagramConfig.excalidrawReact?.aiModel}
                                                    onChange={(value) => setDiagramConfig(prev => ({ 
                                                        ...prev, 
                                                        excalidrawReact: {
                                                            ...prev.excalidrawReact,
                                                            aiModel: value
                                                        }
                                                    }))}
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
                                            
                                            <div className={styles.aiStepPrompt}>
                                                <label className={styles.aiStepLabel}>
                                                    AI Prompt (System Message):
                                                </label>
                                                <Input.TextArea
                                                    value={diagramConfig.excalidrawReact?.aiPrompt || ''}
                                                    onChange={(e) => setDiagramConfig(prev => ({ 
                                                        ...prev, 
                                                        excalidrawReact: {
                                                            ...prev.excalidrawReact,
                                                            aiPrompt: e.target.value
                                                        }
                                                    }))}
                                                    placeholder="Nhập system message cho AI tạo Excalidraw JSON..."
                                                    autoSize={{ minRows: 8, maxRows: 12 }}
                                                    size="small"
                                                />
                                            </div>
                                            
                                            <div className={styles.aiStepDescription}>
                                                Nội dung bài viết → Tạo Excalidraw JSON
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>

                            <Divider />

                            {/* AI Configuration for Note */}
                            <div className={styles.aiConfigSection}>
                                <h5 className={styles.aiConfigTitle}>📝 Cấu hình AI tạo Ghi chú</h5>
                                
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <div className={styles.aiStepContainer}>
                                            <h6 className={`${styles.aiStepTitle} ${styles.ai3}`}>📝 AI - Tạo Ghi chú Diagram</h6>
                                            
                                            <div className={styles.aiStepModel}>
                                                <label className={styles.aiStepLabel}>
                                                    Note Model:
                                                </label>
                                                <Select
                                                    value={diagramConfig.excalidrawReact?.noteModel}
                                                    onChange={(value) => setDiagramConfig(prev => ({ 
                                                        ...prev, 
                                                        excalidrawReact: {
                                                            ...prev.excalidrawReact,
                                                            noteModel: value
                                                        }
                                                    }))}
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
                                            
                                            <div className={styles.aiStepPrompt}>
                                                <label className={styles.aiStepLabel}>
                                                    Note Prompt (System Message):
                                                </label>
                                                <Input.TextArea
                                                    value={diagramConfig.excalidrawReact?.notePrompt || ''}
                                                    onChange={(e) => setDiagramConfig(prev => ({ 
                                                        ...prev, 
                                                        excalidrawReact: {
                                                            ...prev.excalidrawReact,
                                                            notePrompt: e.target.value
                                                        }
                                                    }))}
                                                    placeholder="Nhập system message cho AI tạo ghi chú..."
                                                    autoSize={{ minRows: 5, maxRows: 8 }}
                                                    size="small"
                                                />
                                            </div>
                                            
                                            <div className={styles.aiStepDescription}>
                                                Nội dung bài viết → Tạo ghi chú cho diagram
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>

                            <Divider />

                            {/* Quantity Configuration */}
                            <div className={styles.diagramConfigSection}>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <div className={styles.diagramConfigRow}>
                                            <label className={styles.diagramConfigLabel}>
                                                Số lượng:
                                            </label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={diagramConfig.excalidrawReact?.quantity || 1}
                                                onChange={(e) => setDiagramConfig(prev => ({ 
                                                    ...prev, 
                                                    excalidrawReact: {
                                                        ...(prev.excalidrawReact || {}),
                                                        quantity: parseInt(e.target.value) || 1
                                                    }
                                                }))}
                                                style={{ width: '100%' }}
                                                size="small"
                                                placeholder="1"
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </TabPane>
                </Tabs>
            </div>
        </Modal>
    )
}