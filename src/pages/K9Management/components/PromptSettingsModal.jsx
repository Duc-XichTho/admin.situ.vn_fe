import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, Select, message, Space, Divider } from 'antd';
import { SettingOutlined, SaveOutlined } from '@ant-design/icons';
import { getSettingByType, createOrUpdateSetting } from '../../../apis/settingService';
import { MODEL_AI_LIST } from '../../Admin/AIGen/AI_CONST';

const { TextArea } = Input;
const { Option } = Select;

const PromptSettingsModal = ({
    visible,
    onCancel,
    onSuccess
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Sử dụng danh sách model từ constant có sẵn
    const modelOptions = MODEL_AI_LIST;

    // Lấy model mặc định (GPT-4.1)
    const getDefaultModel = () => {
        return MODEL_AI_LIST[0];
    };


    // Load cài đặt khi modal mở
    useEffect(() => {
        if (visible) {
            loadSettings();
        }
    }, [visible]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const settings = await getSettingByType('prompt_settings');
            if (settings && settings.setting) {
                form.setFieldsValue({
                    id: settings.id,
                    systemMessage: settings.setting.systemMessage || '',
                    selectedModel: settings.setting.selectedModel || getDefaultModel().value
                });
                setLoading(false);
            } else {
                setLoading(false);
            }
        } catch (error) { 
            message.error('Có lỗi xảy ra khi tải cài đặt!');
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            const settingData = {
                id: values.id,
                type: 'prompt_settings',
                setting: {
                    systemMessage: values.systemMessage,
                    selectedModel: values.selectedModel,
                    updatedAt: new Date().toISOString()
                },
            };

            await createOrUpdateSetting(settingData);

            message.success('Đã lưu cài đặt prompt thành công!');

            if (onSuccess) {
                onSuccess(values);
            }

            onCancel();
        } catch (error) {
            console.error('Lỗi khi lưu cài đặt:', error);
            message.error('Có lỗi xảy ra khi lưu cài đặt!');
        } finally {
            setSaving(false);
        }
    };


    return (
        <Modal
            title={
                <Space>
                    <SettingOutlined />
                    Cài đặt Prompt AI
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            width={800}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy
                </Button>,

                <Button
                    key="save"
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={handleSave}
                >
                    Lưu cài đặt
                </Button>
            ]}
            confirmLoading={saving}
        >
            <Form
                form={form}
                layout="vertical"
                disabled={loading}
            >
                <Form.Item
                    label="Model AI"
                    name="selectedModel"
                    rules={[{ required: true, message: 'Vui lòng chọn model AI!' }]}
                >
                    <Select
                        placeholder="Chọn model AI"
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {modelOptions.map(model => (
                            <Option key={model.value} value={model.value}>
                                <div style={{ fontWeight: 'bold' }}>{model.value}</div>
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Divider />

                <Form.Item
                    label="System Message"
                    name="systemMessage"
                    rules={[{ required: true, message: 'Vui lòng nhập system message!' }]}
                    extra="System message sẽ được gửi kèm với mỗi request để định hướng hành vi của AI"
                >
                    <TextArea
                        rows={12}
                        placeholder="Nhập system message..."
                        style={{ fontFamily: 'monospace' }}
                    />
                </Form.Item>


            </Form>
        </Modal>
    );
};

export default PromptSettingsModal;
