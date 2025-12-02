import React, { useState, useEffect } from 'react';
import { Modal, Button, message, Progress, Spin, Tag, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, StopOutlined } from '@ant-design/icons';
import { getK9ByCidType } from '../../../apis/k9Service';
import { aiGen } from '../../../apis/aiGen/botService';
import { getSettingByType } from '../../../apis/settingService';

const UpdateQuizContentModal = ({
    visible,
    onCancel,
    selectedRowKeys = [],
    data = [],
    onUpdate
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [recordStatuses, setRecordStatuses] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [promptSettings, setPromptSettings] = useState(null);
    const [loadingSettings, setLoadingSettings] = useState(false);

    // Load prompt settings when modal opens
    useEffect(() => {
        if (visible) {
            setIsUpdating(false);
            setIsStopped(false);
            setRecordStatuses({});
            setCurrentIndex(0);
            loadPromptSettings();
        }
    }, [visible]);

    const loadPromptSettings = async () => {
        setLoadingSettings(true);
        try {
            const settings = await getSettingByType('prompt_settings');
            if (settings && settings.setting) {
                setPromptSettings({
                    systemMessage: settings.setting.systemMessage || '',
                    selectedModel: settings.setting.selectedModel || 'claude-3-5-haiku-20241022'
                });
                setLoadingSettings(false);
            } else {
                message.error('Có lỗi xảy ra khi tải cài đặt!');
                setLoadingSettings(false);
            }
               
        } catch (error) {
            console.error('Lỗi khi tải prompt settings:', error);
            message.error('Có lỗi xảy ra khi tải cài đặt!');
        } 
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'error':
                return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
            case 'updating':
                return <LoadingOutlined style={{ color: '#1890ff' }} />;
            default:
                return null;
        }
    };

    const getStatusTag = (status) => {
        switch (status) {
            case 'success':
                return <Tag color="success">Thành công</Tag>;
            case 'error':
                return <Tag color="error">Lỗi</Tag>;
            case 'updating':
                return <Tag color="processing">Đang cập nhật</Tag>;
            default:
                return <Tag>Chờ xử lý</Tag>;
        }
    };

    const handleUpdate = async () => {
        if (isUpdating || !promptSettings) return;

        setIsUpdating(true);
        setIsStopped(false);
        setCurrentIndex(0);

        // Initialize all records as pending
        const initialStatuses = {};
        selectedRowKeys.forEach(key => {
            initialStatuses[key] = 'pending';
        });
        setRecordStatuses(initialStatuses);

        try {
            for (let i = 0; i < selectedRowKeys.length; i++) {
                if (isStopped) break;

                const key = selectedRowKeys[i];
                const record = data.find(item => item.id === key);

                setCurrentIndex(i);
                setRecordStatuses(prev => ({
                    ...prev,
                    [key]: 'updating'
                }));

                try {
                    // Lấy data theo CID với type='new'
                    const cidData = await getK9ByCidType(record.cid, 'news');
                    console.log('cidData', cidData);

                    if (!cidData || cidData.length === 0) {
                        throw new Error(`Không tìm thấy data cho CID: ${record.cid}`);
                    }

                    // Lấy phần tử đầu tiên
                    const sourceData = cidData[0];

                    if (!sourceData.detail) {
                        throw new Error(`Không có detail cho CID: ${record.cid}`);
                    }

                    // Tạo prompt từ detail
                    // Note: System Message cần yêu cầu AI trả về JSON với các trường: title, summary, detail, questionQuiz, questionEssay
                    const prompt = `Dựa trên nội dung sau: ${sourceData.detail}`;

                    // Gọi AI để tạo data mới
                    const aiResponse = await aiGen(
                        prompt,
                        promptSettings.systemMessage,
                        promptSettings.selectedModel,
                        'text'
                    );

                    console.log('aiResponse', aiResponse);
                    if (!aiResponse || !aiResponse.result) {
                        throw new Error('AI không trả về kết quả hợp lệ');
                    }

                    // Parse AI response JSON
                    let aiData;
                    try {
                        const responseText = aiResponse.result;

                        // Tìm JSON trong response (có thể có text thừa)
                        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            aiData = JSON.parse(jsonMatch[0]);
                        } else {
                            throw new Error('Không tìm thấy JSON trong response');
                        }
                    } catch (parseError) {
                        console.error('Lỗi parse JSON:', parseError);
                        throw new Error(`Lỗi parse JSON từ AI: ${parseError.message}`);
                    }

                    // Validate AI response structure
                    if (!aiData.questionQuiz || !Array.isArray(aiData.questionQuiz)) {
                        throw new Error('AI response không có cấu trúc questionQuiz hợp lệ');
                    }

                    if (!aiData.detail) {
                        throw new Error('AI response không có detail mới');
                    }

                    if (!aiData.title) {
                        throw new Error('AI response không có title mới');
                    }

                    if (!aiData.summary) {
                        throw new Error('AI response không có summary mới');
                    }

                    // Tách riêng detail và questionContent
                    const questionContentData = {
                        questionQuiz: aiData.questionQuiz || [],
                        questionEssay: aiData.questionEssay || []
                    };

                    // Cập nhật record với data mới (title, summary, detail, questionContent)
                    const updatedRecord = {
                        ...record,
                        title: aiData.title, // Tiêu đề mới
                        summary: aiData.summary, // Tóm tắt mới
                        detail: aiData.detail, // Tình huống mới (markdown text)
                        questionContent: questionContentData // Chứa questionQuiz và questionEssay
                    };

                    // Gọi callback để cập nhật
                    if (onUpdate) {
                        await onUpdate( updatedRecord);
                    }

                    setRecordStatuses(prev => ({
                        ...prev,
                        [key]: 'success'
                    }));

                } catch (error) {
                    setRecordStatuses(prev => ({
                        ...prev,
                        [key]: 'error'
                    }));
                    console.error(`Error updating record ${key}:`, error);
                }
            }
        } finally {
            setIsUpdating(false);
        }
    };

    const handleStop = () => {
        setIsStopped(true);
        setIsUpdating(false);
        message.warning('Đã dừng quá trình cập nhật');
    };

    const handleClose = () => {
        if (isUpdating) {
            message.warning('Đang cập nhật, vui lòng dừng trước khi đóng');
            return;
        }
        onCancel();
    };

    const successCount = Object.values(recordStatuses).filter(status => status === 'success').length;
    const errorCount = Object.values(recordStatuses).filter(status => status === 'error').length;
    const progress = selectedRowKeys.length > 0 ? ((successCount + errorCount) / selectedRowKeys.length) * 100 : 0;

    return (
        <Modal
            title="Cập nhật Title, Summary, Detail & Quiz theo CID"
            open={visible}
            onCancel={handleClose}
            footer={[
                <Button key="cancel" onClick={handleClose} disabled={isUpdating}>
                    {isUpdating ? 'Đang cập nhật...' : 'Đóng'}
                </Button>,
                !isUpdating ? (
                    <Button
                        key="update"
                        type="primary"
                        onClick={handleUpdate}
                        disabled={loadingSettings || !promptSettings}
                        loading={loadingSettings}
                    >
                        {loadingSettings ? 'Đang tải cài đặt...' : `Bắt đầu cập nhật (${selectedRowKeys.length})`}
                    </Button>
                ) : (
                    <Button key="stop" danger onClick={handleStop} icon={<StopOutlined />}>
                        Dừng cập nhật
                    </Button>
                )
            ]}
            width={600}
            closable={!isUpdating}
            maskClosable={!isUpdating}
        >
            <div>
                {/* Progress Summary */}
                {isUpdating && (
                    <div style={{ marginBottom: '20px' }}>
                        <Progress
                            percent={Math.round(progress)}
                            status={isStopped ? 'exception' : 'active'}
                            format={() => `${successCount + errorCount}/${selectedRowKeys.length}`}
                        />
                        <div style={{ marginTop: '8px', textAlign: 'center' }}>
                            <Space>
                                <Tag color="success">Thành công: {successCount}</Tag>
                                <Tag color="error">Lỗi: {errorCount}</Tag>
                                <Tag color="processing">Đang xử lý: {currentIndex + 1}</Tag>
                            </Space>
                        </div>
                    </div>
                )}

                {/* Records List */}
                <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    padding: '12px'
                }}>
                    {selectedRowKeys.map((key, index) => {
                        const record = data.find(item => item.id === key);
                        const status = recordStatuses[key] || 'pending';
                        const isCurrent = isUpdating && index === currentIndex;

                        return (
                            <div
                                key={key}
                                style={{
                                    marginBottom: '8px',
                                    padding: '12px',
                                    backgroundColor: isCurrent ? '#e6f7ff' : '#fafafa',
                                    borderRadius: '4px',
                                    border: isCurrent ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <strong>#{index + 1} - {record?.title || 'N/A'}</strong>
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                            ID: {record?.id} | CID: {record?.cid || 'N/A'}
                                        </div>
                                        {status === 'success' && (() => {
                                            try {
                                                const questionData = record.questionContent ? JSON.parse(record.questionContent) : {};
                                                const quizCount = questionData.questionQuiz?.length || 0;
                                                const essayCount = questionData.questionEssay?.length || 0;
                                                return (
                                                    <div style={{ fontSize: '11px', color: '#52c41a', marginTop: '4px' }}>
                                                        ✅ Đã cập nhật title, summary, detail{quizCount > 0 ? ` và ${quizCount} câu hỏi quiz` : ''}{essayCount > 0 ? `, ${essayCount} câu essay` : ''}
                                                    </div>
                                                );
                                            } catch (e) {
                                                return (
                                                    <div style={{ fontSize: '11px', color: '#52c41a', marginTop: '4px' }}>
                                                        ✅ Đã cập nhật thành công
                                                    </div>
                                                );
                                            }
                                        })()}
                                        {status === 'error' && (
                                            <div style={{ fontSize: '11px', color: '#ff4d4f', marginTop: '4px' }}>
                                                ❌ Lỗi khi cập nhật nội dung
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        {getStatusIcon(status)}
                                        {getStatusTag(status)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};

export default UpdateQuizContentModal;
