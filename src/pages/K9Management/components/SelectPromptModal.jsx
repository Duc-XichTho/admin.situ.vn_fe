import React, { useState, useEffect } from 'react';
import { Modal, Select, message, Space, Typography, InputNumber } from 'antd';
import { getSettingByType } from '../../../apis/settingService';

const { Option } = Select;
const { Text } = Typography;

const SelectPromptModal = ({
    visible,
    onCancel,
    onSelect,
    promptType, // 'IMPROVE_DETAIL_PROMPTS', 'CREATE_QUIZ_PROMPTS', etc.
    title
}) => {
    const [prompts, setPrompts] = useState([]);
    const [selectedPromptId, setSelectedPromptId] = useState(null);
    const [loading, setLoading] = useState(false);
    // Cho phép override số lượng khi prompt có field quantity
    const [overrideQuantity, setOverrideQuantity] = useState(null);

    useEffect(() => {
        if (visible && promptType) {
            loadPrompts();
        }
        if (!visible) {
            setSelectedPromptId(null);
            setOverrideQuantity(null);
        }
    }, [visible, promptType]);

    useEffect(() => {
        // Mỗi lần chọn prompt mới thì reset overrideQuantity
        setOverrideQuantity(null);
    }, [selectedPromptId]);

    const loadPrompts = async () => {
        setLoading(true);
        try {
            const settings = await getSettingByType(promptType);
            if (settings?.setting && Array.isArray(settings.setting)) {
                setPrompts(settings.setting);
                if (settings.setting.length === 0) {
                    message.warning('Chưa có cài đặt prompt nào. Vui lòng tạo cài đặt trước!');
                }
            } else {
                setPrompts([]);
                message.warning('Chưa có cài đặt prompt nào. Vui lòng tạo cài đặt trước!');
            }
        } catch (error) {
            console.error('Error loading prompts:', error);
            message.error('Lỗi khi tải danh sách prompt!');
            setPrompts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOk = () => {
        if (!selectedPromptId) {
            message.warning('Vui lòng chọn một cài đặt prompt!');
            return;
        }
        const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
        if (!selectedPrompt) {
            message.error('Không tìm thấy cài đặt prompt đã chọn!');
            return;
        }

        // Gộp quantity override (nếu có) để các luồng dùng chung (diagram, case, ...)
        const finalPrompt = {
            ...selectedPrompt,
            ...(selectedPrompt.quantity !== undefined || overrideQuantity !== null
                ? { quantity: overrideQuantity || selectedPrompt.quantity || 1 }
                : {})
        };

        onSelect(finalPrompt);
    };

    return (
        <Modal
            title={title || 'Chọn cài đặt Prompt'}
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            okText="Chọn"
            cancelText="Hủy"
            width={600}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                    <Text strong>Chọn cài đặt prompt:</Text>
                </div>
                <Select
                    placeholder="Chọn cài đặt prompt..."
                    style={{ width: '100%' }}
                    value={selectedPromptId}
                    onChange={setSelectedPromptId}
                    loading={loading}
                    showSearch
                    filterOption={(input, option) =>
                        (option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                >
                    {prompts.map(prompt => (
                        <Option key={prompt.id} value={prompt.id}>
                            {prompt.name || `Cài đặt ${prompt.id}`}
                        </Option>
                    ))}
                </Select>
                {selectedPromptId && (() => {
                    const selected = prompts.find(p => p.id === selectedPromptId);
                    if (!selected) return null;
                    return (
                        <div style={{ marginTop: 16, padding: 16, background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4 }}>
                            <Text strong style={{ color: '#1890ff', display: 'block', marginBottom: 8 }}>Preview cấu hình:</Text>
                            <div style={{ fontSize: 13 }}>
                                <div style={{ marginBottom: 4 }}><Text strong>Tên:</Text> {selected.name}</div>
                                {selected.prompt && <div style={{ marginBottom: 4 }}><Text strong>Prompt:</Text> {selected.prompt.substring(0, 100)}...</div>}
                                {selected.model && <div style={{ marginBottom: 4 }}><Text strong>Model:</Text> {selected.model}</div>}
                                {selected.aiPrompt && <div style={{ marginBottom: 4 }}><Text strong>AI Prompt:</Text> {selected.aiPrompt.substring(0, 100)}...</div>}
                                {selected.aiModel && <div style={{ marginBottom: 4 }}><Text strong>AI Model:</Text> {selected.aiModel}</div>}
                                {selected.ai4Prompt && <div style={{ marginBottom: 4 }}><Text strong>AI4 Prompt:</Text> {selected.ai4Prompt.substring(0, 100)}...</div>}
                                {selected.ai4Model && <div style={{ marginBottom: 4 }}><Text strong>AI4 Model:</Text> {selected.ai4Model}</div>}
                                {selected.createModel && <div style={{ marginBottom: 4 }}><Text strong>Create Model:</Text> {selected.createModel}</div>}
                                {selected.evaluationModel && <div style={{ marginBottom: 4 }}><Text strong>Evaluation Model:</Text> {selected.evaluationModel}</div>}
                                {selected.countQuiz !== undefined && <div style={{ marginBottom: 4 }}><Text strong>Số Quiz:</Text> {selected.countQuiz}</div>}
                                {selected.countEssay !== undefined && <div style={{ marginBottom: 4 }}><Text strong>Số Essay:</Text> {selected.countEssay}</div>}
                                {selected.quantity !== undefined && (
                                    <div style={{ marginBottom: 4 }}>
                                        <Text strong>Số lượng tạo ra Case Training:</Text> {selected.quantity}
                                    </div>
                                )}
                            </div>
                           
                        </div>
                    );
                })()}
            </Space>
        </Modal>
    );
};

export default SelectPromptModal;

