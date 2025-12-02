import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Select, Button, Progress, List, message, Space, Typography } from 'antd';
import { MODEL_AI_LIST } from '../../Admin/AIGen/AI_CONST';
import { aiGen } from '../../../apis/aiGen/botService';
import { updateK9 } from '../../../apis/k9Service';
import { createTimestamp } from '../../../generalFunction/format';
import SelectPromptModal from './SelectPromptModal';
const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const RATE_LIMIT_MS = 800;
const MAX_RETRY = 2;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ImproveDetailModal = ({
    visible,
    onCancel,
    selectedRecords = [],
    onSuccess,
    setImproveDetailLoading
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState([]);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [selectPromptModalVisible, setSelectPromptModalVisible] = useState(false);
    const [processingModalVisible, setProcessingModalVisible] = useState(false);
    const cancelRef = useRef(false);

    useEffect(() => {
        if (visible) {
            setSelectPromptModalVisible(true);
            setProcessingModalVisible(false);
            setSelectedPrompt(null);
        } else {
            setSelectPromptModalVisible(false);
            setProcessingModalVisible(false);
        }
    }, [visible]);

    const handlePromptSelected = (prompt) => {
        setSelectedPrompt(prompt);
        setSelectPromptModalVisible(false);
        setProcessingModalVisible(true);
        form.setFieldsValue({
            prompt: prompt.prompt,
            model: prompt.model
        });
    };

    const processRecord = async (record, prompt, model, attempt = 0) => {
        console.log('record', record);
        if (cancelRef.current) return { id: record.id, error: 'cancelled' };
        const sourceText = `<${record.title}>${record.detail }`;
        if (!sourceText.trim()) {
            return { id: record.id, error: 'no_content' };
        }
        try {
            const aiResponse = await aiGen(sourceText, prompt, model);
            const improvedDetail = aiResponse?.result;
            if (!improvedDetail) {
                throw new Error('empty_result');
            }
            await updateK9({ id: record.id, detail: improvedDetail, isImprove: true , improveTime: createTimestamp() , modelImprove: model });
            return { id: record.id, detail: improvedDetail, isImprove: true , improveTime: createTimestamp() , modelImprove: model };
        } catch (err) {
            if (attempt < MAX_RETRY && !cancelRef.current) {
                const backoff = RATE_LIMIT_MS * Math.pow(2, attempt);
                await sleep(backoff);
                return processRecord(record, prompt, model, attempt + 1);
            }
            return { id: record.id, error: err?.message || 'unknown' };
        }
    };

    const handleSubmit = async () => {
        try {
            if (!selectedPrompt) {
                message.warning('Vui lòng chọn cài đặt prompt trước!');
                return;
            }

            const prompt = selectedPrompt.prompt;
            const model = selectedPrompt.model;

            if (!prompt || !model) {
                message.warning('Cài đặt prompt không đầy đủ. Vui lòng kiểm tra lại!');
                return;
            }

            if (!Array.isArray(selectedRecords) || selectedRecords.length === 0) {
                message.warning('Vui lòng chọn ít nhất một bản ghi để cải thiện');
                return;
            }

            cancelRef.current = false;
            setImproveDetailLoading(true);
            setLoading(true);
            setCurrentIndex(0);
            setProgress(0);
            setProcessingStatus(selectedRecords.map(r => ({ id: r.id, status: 'pending', message: 'Chờ xử lý' })));

            const updatedRecords = [];
            for (let i = 0; i < selectedRecords.length; i++) {
                const record = selectedRecords[i];
                if (cancelRef.current) break;

                setCurrentIndex(i);
                setProcessingStatus(prev => {
                    const copy = [...prev];
                    copy[i] = { id: record.id, status: 'processing', message: 'Đang xử lý...' };
                    return copy;
                });

                const result = await processRecord(record, prompt, model);

                if (result.detail) {
                    updatedRecords.push({ id: result.id, detail: result.detail, isImprove: true , improveTime: result.improveTime , modelImprove: result.modelImprove });
                    setProcessingStatus(prev => {
                        const copy = [...prev];
                        copy[i] = { id: record.id, status: 'success', message: 'Cải thiện thành công' };
                        return copy;
                    });
                } else {
                    setProcessingStatus(prev => {
                        const copy = [...prev];
                        copy[i] = { id: record.id, status: 'error', message: `Lỗi: ${result.error}` };
                        return copy;
                    });
                }

                setProgress(((i + 1) / selectedRecords.length) * 100);
                if (i < selectedRecords.length - 1 && !cancelRef.current) {
                    await sleep(RATE_LIMIT_MS);
                }
            }

            if (!cancelRef.current && updatedRecords.length > 0) {
                message.success(`Cải thiện thành công ${updatedRecords.length}/${selectedRecords.length} bản ghi`);
                if (onSuccess) onSuccess(updatedRecords);
            } else if (cancelRef.current) {
                message.info('Đã dừng xử lý');
                if (onSuccess && updatedRecords.length > 0) onSuccess(updatedRecords);
            } else {
                message.warning('Không có bản ghi nào được cải thiện');
            }
        } catch (error) {
            message.error('Có lỗi xảy ra: ' + error.message);
        } finally {
            setLoading(false);
            setImproveDetailLoading(false);
        }
    };

    const handleCancel = () => {
        setSelectPromptModalVisible(false);
        setProcessingModalVisible(false);
        onCancel();
    };

    return (
        <>
            <SelectPromptModal
                visible={selectPromptModalVisible}
                onCancel={handleCancel}
                onSelect={handlePromptSelected}
                promptType="IMPROVE_DETAIL_PROMPTS"
                title="Chọn cài đặt Prompt - Improve Detail"
            />

            <Modal
                title={
                    <div>
                        <Title level={4} style={{ margin: 0 }}>Cải thiện Chi tiết</Title>
                        <Text type="secondary">Đã chọn {selectedRecords.length} bản ghi</Text>
                        {selectedPrompt && (
                            <div style={{ marginTop: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Cài đặt: {selectedPrompt.name}
                                </Text>
                            </div>
                        )}
                    </div>
                }
                open={processingModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={800}
                centered
                destroyOnClose={false}
            >
                <div style={{ height: '60vh', overflowY: 'auto', overflowX: 'hidden' }}>

                    {selectedPrompt && (
                        <div style={{ 
                            marginBottom: 16, 
                            padding: 12, 
                            background: '#e6f7ff', 
                            border: '1px solid #91d5ff',
                            borderRadius: 4 
                        }}>
                            <Text strong style={{ color: '#1890ff' }}>Cấu hình đang sử dụng:</Text>
                            <div style={{ marginTop: 8 }}>
                                <Text><strong>Tên:</strong> {selectedPrompt.name}</Text>
                            </div>
                        </div>
                    )}

                    <Form
                        form={form}
                        layout="vertical"
                    >
                        <Form.Item
                            label="Prompt cải thiện"
                            name="prompt"
                        >
                            <TextArea rows={6} placeholder="Prompt từ cài đặt đã chọn..." showCount disabled={true} />
                        </Form.Item>

                        <Form.Item
                            label="Model AI"
                            name="model"
                        >
                            <Select placeholder="Model từ cài đặt đã chọn" disabled={true}>
                                {MODEL_AI_LIST.map(model => (
                                    <Option key={model.value} value={model.value}>
                                        {model.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                    {processingStatus.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                            <Text strong>Trạng thái xử lý:</Text>
                            <List
                                size="small"
                                dataSource={processingStatus}
                                renderItem={(item) => (
                                    <List.Item>
                                        <Space>
                                            <Text>ID: {item.id}</Text>
                                            <Text type="secondary">{item.message}</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </div>
                    )}

                    {loading && (
                        <div style={{ marginBottom: '16px' }}>
                            <Progress
                                percent={progress}
                                status={progress === 100 ? 'success' : 'active'}
                                format={(percent) => `${Math.round(percent)}% (${currentIndex + 1}/${selectedRecords.length})`}
                            />
                        </div>
                    )}

                        <div style={{ textAlign: 'right', marginTop: '16px' }}>
                            <Space>
                                <Button onClick={handleCancel} disabled={loading}>Đóng</Button>
                                <Button onClick={() => { setProcessingModalVisible(false); setSelectPromptModalVisible(true); }} disabled={loading}>
                                    Chọn lại prompt
                                </Button>
                                {loading && (
                                    <Button danger onClick={() => { cancelRef.current = true; }}>
                                        Dừng
                                    </Button>
                                )}
                                <Button type="primary" onClick={handleSubmit} loading={loading} disabled={selectedRecords.length === 0 || !selectedPrompt}>
                                    {loading ? 'Đang xử lý...' : 'Bắt đầu cải thiện'}
                                </Button>
                            </Space>
                        </div>
                    </Form>
                </div>
            </Modal>
        </>
    );
};

export default ImproveDetailModal;
