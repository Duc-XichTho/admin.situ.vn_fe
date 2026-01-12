import { Button, Form, Input, Modal, Select, Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import { MODEL_AI_LIST } from '../AIGen/AI_CONST';

const { TextArea } = Input;

const ImageSpellCheckSettings = ({ visible, onClose, onSave, initialSettings }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('ocr');

    useEffect(() => {
        if (visible && initialSettings) {
            form.setFieldsValue({
                // OCR settings
                ocrModel: initialSettings.ocrModel || MODEL_AI_LIST[0]?.value || '',
                ocrInstructions: initialSettings.ocrInstructions || '',
                ocrSystemMessage: initialSettings.ocrSystemMessage || '',
                // Scoring settings
                scoringPrompt: initialSettings.scoringPrompt || '',
                scoringModel: initialSettings.scoringModel || MODEL_AI_LIST[0]?.value || '',
            });
        }
    }, [visible, initialSettings, form]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            await onSave(values);
        } catch (error) {
            console.error('Validation error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Cài đặt OCR và Chấm điểm"
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Hủy
                </Button>,
                <Button key="save" type="primary" loading={loading} onClick={handleSave}>
                    Lưu
                </Button>,
            ]}
            width={900}
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: 'ocr',
                        label: 'Cài đặt OCR',
                        children: (
                            <div style={{ height: '500px', overflowY: 'auto' }}>
                                <Form
                                    form={form}
                                    layout="vertical"
                                    style={{ marginTop: '16px' }}
                                >
                                    <Form.Item
                                        label="OCR Model"
                                        name="ocrModel"
                                        rules={[{ required: true, message: 'Vui lòng chọn OCR model' }]}
                                        tooltip="Chọn model OCR (Google Document AI)"
                                    >
                                        <Select placeholder="Chọn OCR model">
                                            {MODEL_AI_LIST.map(model => (
                                                <Select.Option key={model.id} value={model.value}>
                                                    {model.name} - ({model.value})
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item
                                        label="Instructions"
                                        name="ocrInstructions"
                                        tooltip="Hướng dẫn cụ thể cho AI về cách xử lý và phân tích file"
                                    >
                                        <TextArea
                                            rows={6}
                                            placeholder="Nhập instructions cho OCR (tùy chọn)"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="System Message"
                                        name="ocrSystemMessage"
                                        tooltip="Tin nhắn hệ thống để định hướng hành vi và phong cách phản hồi của AI"
                                    >
                                        <TextArea
                                            rows={8}
                                            placeholder="Nhập system message cho OCR (tùy chọn)"
                                        />
                                    </Form.Item>
                                </Form>
                            </div>
                        ),
                    },
                    {
                        key: 'scoring',
                        label: 'Cài đặt Chấm điểm',
                        children: (
                            <div style={{ height: '500px', overflowY: 'auto' }}>
                                <Form
                                    form={form}
                                    layout="vertical"
                                    style={{ marginTop: '16px' }}
                                >
                                    <Form.Item
                                        label="Scoring Model"
                                        name="scoringModel"
                                        rules={[{ required: true, message: 'Vui lòng chọn Scoring model' }]}
                                    >
                                        <Select placeholder="Chọn Scoring model">
                                            {MODEL_AI_LIST.map(model => (
                                                <Select.Option key={model.id} value={model.value}>
                                                    {model.name} - ({model.value})
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item
                                        label="Scoring Prompt (System Message)"
                                        name="scoringPrompt"
                                        rules={[{ required: true, message: 'Vui lòng nhập Scoring prompt' }]}
                                    >
                                        <TextArea
                                            rows={8}
                                            placeholder="Nhập scoring prompt"
                                        />
                                    </Form.Item>
                                </Form>
                            </div>
                        ),
                    },
                ]}
            />
        </Modal>
    );
};

export default ImageSpellCheckSettings;

