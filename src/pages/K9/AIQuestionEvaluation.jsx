import { SearchOutlined, SettingOutlined, RobotOutlined, HomeOutlined, FilterOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Empty, Form, Input, message, Modal, Select, Space, Table, Tabs, Tag, Tooltip, Radio } from 'antd';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiGen } from '../../apis/aiGen/botService.jsx';
import { getK9ByCidType, getK9ByType, updateK9 } from '../../apis/k9Service.jsx';
import { createOrUpdateSetting, getSettingByType } from '../../apis/settingService.jsx';
import { MODEL_AI_LIST } from '../Admin/AIGen/AI_CONST.js';
import QuizEditorModal from '../K9Management/components/QuizEditorModal.jsx';
import EditDetailModal from './components/EditDetailModal.jsx';

const { TabPane } = Tabs;
const { TextArea } = Input;

const AIQuestionEvaluation = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('news');
    const [searchText, setSearchText] = useState('');
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedDetailRecord, setSelectedDetailRecord] = useState(null);
    const [quizEditorVisible, setQuizEditorVisible] = useState(false);
    const [quizEditorRecord, setQuizEditorRecord] = useState(null);
    const [savingQuiz, setSavingQuiz] = useState(false);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [systemMessage, setSystemMessage] = useState('');
    const [model, setModel] = useState(MODEL_AI_LIST[0]?.value || '');
    const [evaluatingRecordId, setEvaluatingRecordId] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [form] = Form.useForm();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(1000);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState('');
    const [feedbackFilter, setFeedbackFilter] = useState('all'); // 'all', 'has', 'none'
    const [feedbackSearchText, setFeedbackSearchText] = useState('');

    // K9 data for each tab
    const [k9Data, setK9Data] = useState({
        news: [],
        caseTraining: [],
        longForm: [],
    });

    // Load K9 data for all tabs
    const loadK9Data = async () => {
        setLoading(true);
        try {
            const [newsData, caseTrainingData, longFormData] = await Promise.all([
                getK9ByType('news', { data_type: 'global', }),
                getK9ByType('caseTraining', { data_type: 'global' }),
                getK9ByType('longForm', { data_type: 'global' }),
            ]);

            const newK9Data = {
                news: newsData?.data || newsData || [],
                caseTraining: caseTrainingData?.data || caseTrainingData || [],
                longForm: longFormData?.data || longFormData || [],
            };
            setK9Data(newK9Data);
        } catch (error) {
            console.error('Error loading K9 data:', error);
            message.error('Lỗi khi tải dữ liệu K9');
        } finally {
            setLoading(false);
        }
    };

    // Load settings
    const loadSettings = async () => {
        try {
            const settings = await getSettingByType('AI_QUESTION_EVALUATION_CONFIG');
            if (settings?.setting) {
                setSystemMessage(settings.setting.systemMessage || '');
                setModel(settings.setting.model || MODEL_AI_LIST[0]?.value || '');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    // Save settings
    const handleSaveSettings = async () => {
        try {
            await createOrUpdateSetting({
                type: 'AI_QUESTION_EVALUATION_CONFIG',
                setting: {
                    systemMessage: systemMessage,
                    model: model,
                }
            });
            message.success('Đã lưu cài đặt thành công');
            setSettingsModalVisible(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            message.error('Lỗi khi lưu cài đặt');
        }
    };

    // Handle AI evaluation for single record
    const evaluateSingleRecord = async (record) => {
        // Lấy detail và questionContent của record hiện tại
        const currentDetail = record.detail || '';
        const currentQuestionContent = record.questionContent || '';

        // Chuyển questionContent thành JSON string để AI dễ parse
        let questionContentText = '';
        if (typeof currentQuestionContent === 'string') {
            questionContentText = currentQuestionContent;
        } else if (typeof currentQuestionContent === 'object' && !Array.isArray(currentQuestionContent)) {
            // Gửi cả object JSON với format đẹp
            questionContentText = JSON.stringify(currentQuestionContent, null, 2);
        }

        // Tìm bài lý thuyết liên quan bằng CID - chỉ cho caseTraining
        let relatedTheoryDetail = '';
        if (activeTab === 'caseTraining' && record.cid) {
            try {
                const cidData = await getK9ByCidType(record.cid, 'news');
                if (cidData && cidData.length > 0) {
                    const theoryItem = cidData[0];
                    relatedTheoryDetail = theoryItem.detail || '';
                }
            } catch (error) {
                console.error('Error fetching related theory:', error);
                // Tiếp tục mà không có bài lý thuyết
            }
        }

        // Tạo prompt dạng JSON với 3 fields
        const promptData = {
            Current_details: currentDetail,
            question: questionContentText,
            ...(activeTab === 'caseTraining' && relatedTheoryDetail && {
                Related_Theory: relatedTheoryDetail
            })
        };

        // Chuyển thành JSON string để gửi cho AI
        const prompt = JSON.stringify(promptData, null, 2);

        // Gọi AI
        const aiResponse = await aiGen(
            prompt,
            systemMessage,
            model,
            'text'
        );

        if (!aiResponse || !aiResponse.result) {
            throw new Error('AI không trả về kết quả hợp lệ');
        }

        const feedbackText = aiResponse.result || aiResponse.answer || aiResponse.content || '';

        // Lưu vào ai_feedback_quiz
        await updateK9({
            id: record.id,
            ai_feedback_quiz: feedbackText,
        });

        // Update local data
        const updater = (list) => list.map(item =>
            item.id === record.id
                ? { ...item, ai_feedback_quiz: feedbackText }
                : item
        );

        setK9Data(prev => ({
            news: updater(prev.news || []),
            caseTraining: updater(prev.caseTraining || []),
            longForm: updater(prev.longForm || []),
        }));

        return { success: true, recordId: record.id };
    };

    // Handle AI evaluation for multiple records
    const handleAIEvaluation = async () => {
        if (!systemMessage || !model) {
            message.warning('Vui lòng cài đặt systemMessage và model trước');
            setSettingsModalVisible(true);
            return;
        }

        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để đánh giá');
            return;
        }

        setIsEvaluating(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            // Lấy các record đã chọn
            const selectedRecords = filteredData.filter(item => selectedRowKeys.includes(item.id));

            for (let i = 0; i < selectedRecords.length; i++) {
                const record = selectedRecords[i];
                setEvaluatingRecordId(record.id);

                try {
                    await evaluateSingleRecord(record);
                    successCount++;
                    message.success(`Đánh giá thành công cho ID: ${record.id} (${i + 1}/${selectedRecords.length})`);
                } catch (error) {
                    console.error(`Error evaluating record ${record.id}:`, error);
                    errorCount++;
                    message.error(`Lỗi khi đánh giá ID: ${record.id} - ${error.message}`);
                }

                // Delay nhỏ giữa các request để tránh quá tải
                if (i < selectedRecords.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            message.success(`Hoàn thành: ${successCount} thành công, ${errorCount} lỗi`);
            setSelectedRowKeys([]);
        } catch (error) {
            console.error('Error in batch evaluation:', error);
            message.error('Lỗi khi đánh giá: ' + (error.message || 'Unknown error'));
        } finally {
            setIsEvaluating(false);
            setEvaluatingRecordId(null);
        }
    };

    useEffect(() => {
        loadK9Data();
        loadSettings();
    }, []);

    // Memoize current tab data to avoid unnecessary recalculations
    const currentTabData = useMemo(() => {
        if (activeTab && k9Data[activeTab] && Array.isArray(k9Data[activeTab])) {
            return k9Data[activeTab];
        }
        return [];
    }, [activeTab, k9Data.news, k9Data.caseTraining, k9Data.longForm]);

    // Reset to page 1 when tab, search, or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchText, feedbackFilter, feedbackSearchText]);

    // Optimize filter with useMemo - only recalculate when searchText, feedbackFilter, feedbackSearchText or currentTabData changes
    const filteredData = useMemo(() => {
        let data = [...currentTabData];

        // Filter by feedback status (has/none)
        if (feedbackFilter === 'has') {
            data = data.filter(item => item.ai_feedback_quiz && item.ai_feedback_quiz.trim());
        } else if (feedbackFilter === 'none') {
            data = data.filter(item => !item.ai_feedback_quiz || !item.ai_feedback_quiz.trim());
        }

        // Filter by feedback search text
        if (feedbackSearchText.trim()) {
            const feedbackSearchLower = feedbackSearchText.toLowerCase();
            data = data.filter(item => {
                const feedbackText = String(item.ai_feedback_quiz || '').toLowerCase();
                return feedbackText.includes(feedbackSearchLower);
            });
        }

        // Filter by general search text
        if (searchText.trim()) {
            const searchLower = searchText.toLowerCase();
            data = data.filter(item => {
                const id = String(item.id || '').toLowerCase();
                const cid = String(item.cid || '').toLowerCase();
                const detail = String(item.detail || '').toLowerCase();

                // Handle questionContent (can be string or object)
                let questionContentText = '';
                if (item.questionContent) {
                    if (typeof item.questionContent === 'string') {
                        questionContentText = item.questionContent.toLowerCase();
                    } else if (typeof item.questionContent === 'object') {
                        // Extract text from quiz and essay questions
                        const quizText = Array.isArray(item.questionContent.questionQuiz)
                            ? item.questionContent.questionQuiz.map(q => q.question || '').join(' ')
                            : '';
                        const essayText = Array.isArray(item.questionContent.questionEssay)
                            ? item.questionContent.questionEssay.map(q => q.question || '').join(' ')
                            : '';
                        questionContentText = (quizText + ' ' + essayText).toLowerCase();
                    }
                }

                return id.includes(searchLower) ||
                    cid.includes(searchLower) ||
                    questionContentText.includes(searchLower) ||
                    detail.includes(searchLower);
            });
        }

        return data;
    }, [searchText, feedbackFilter, feedbackSearchText, currentTabData]);

    // Handle quiz edit - memoized to prevent re-renders
    const handleEditQuiz = useCallback((record) => {
        setQuizEditorRecord(record);
        setQuizEditorVisible(true);
    }, []);

    // Memoize render functions to prevent re-renders
    const renderQuestionContent = useCallback((questionContent, record) => {
        if (!questionContent) return '-';

        // Handle object format: {questionQuiz: [...], questionEssay: [...]}
        if (typeof questionContent === 'object' && !Array.isArray(questionContent)) {
            const quizCount = Array.isArray(questionContent.questionQuiz) ? questionContent.questionQuiz.length : 0;
            const essayCount = Array.isArray(questionContent.questionEssay) ? questionContent.questionEssay.length : 0;
            return (
                <div>
                    <div>Quiz: {quizCount} câu</div>
                    <div>Essay: {essayCount} câu</div>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            handleEditQuiz(record);
                        }}
                    >
                        Xem chi tiết
                    </Button>
                </div>
            );
        }

        // Handle string format
        const text = String(questionContent);
        if (text.length > 100) {
            return (
                <div>
                    {text.substring(0, 100)}...
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            setSelectedQuestion({ questionContent: text });
                            setPreviewVisible(true);
                        }}
                    >
                        Xem thêm
                    </Button>
                </div>
            );
        }
        return <div>{text}</div>;
    }, [handleEditQuiz, setSelectedQuestion, setPreviewVisible]);

    const renderDetail = useCallback((text) => {
        if (!text) return '-';
        const detailText = String(text);
        // Only show first 200 chars in tooltip to reduce memory
        const tooltipText = detailText.length > 200 ? detailText.substring(0, 200) + '...' : detailText;
        return (
            <Tooltip placement="topLeft" title={tooltipText} mouseEnterDelay={0.5}>
                <div
                    style={{
                        whiteSpace: 'pre-wrap',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        wordBreak: 'break-word'
                    }}
                >
                    {detailText}
                </div>
            </Tooltip>
        );
    }, []);

    const renderFeedback = useCallback((text) => {
        if (!text) return '-';
        const feedbackText = String(text);
        return (
            <div
                style={{
                    cursor: 'pointer',
                    whiteSpace: 'pre-wrap',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                    color: '#1677ff'
                }}
                onClick={() => {
                    setSelectedFeedback(feedbackText);
                    setFeedbackModalVisible(true);
                }}
                title="Click để xem chi tiết"
            >
                {feedbackText}
            </div>
        );
    }, []);

    const renderAction = useCallback((_, record) => (
        <Space>
            {record.questionContent && (
                <Button
                    type="link"
                    size="small"
                    onClick={() => {
                        const questionContent = record.questionContent;
                        if (typeof questionContent === 'object' && !Array.isArray(questionContent)) {
                            handleEditQuiz(record);
                        } else {
                            setSelectedQuestion({ questionContent: String(questionContent) });
                            setPreviewVisible(true);
                        }
                    }}
                >
                    Xem Quiz
                </Button>
            )}
            {record.detail && (
                <Button
                    type="link"
                    size="small"
                    onClick={() => {
                        setSelectedDetailRecord(record);
                        setDetailModalVisible(true);
                    }}
                >
                    Xem Detail
                </Button>
            )}
        </Space>
    ), [handleEditQuiz, setSelectedQuestion, setPreviewVisible, setSelectedDetailRecord, setDetailModalVisible]);

    // Handle quiz save
    const handleQuizSave = async (questionContent) => {
        if (!quizEditorRecord) return;
        setSavingQuiz(true);
        try {
            await updateK9({
                id: quizEditorRecord.id,
                questionContent: questionContent,
            });
            message.success('Cập nhật quiz thành công');

            // Update local data
            const updater = (list) => list.map(item =>
                item.id === quizEditorRecord.id
                    ? { ...item, questionContent }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
            }));

            setQuizEditorVisible(false);
            setQuizEditorRecord(null);
        } catch (error) {
            console.error('Error saving quiz:', error);
            message.error('Lỗi khi lưu quiz: ' + error.message);
        } finally {
            setSavingQuiz(false);
        }
    };


    // Memoize columns to prevent table re-render on every component update
    const columns = useMemo(() => [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            fixed: 'left',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'CID',
            dataIndex: 'cid',
            key: 'cid',
            width: 100,
            render: (cid) => cid ? <Tag color="blue">{cid}</Tag> : '-',
        },
        {
            title: 'Question Content',
            dataIndex: 'questionContent',
            key: 'questionContent',
            width: 150,
            ellipsis: {
                showTitle: false,
            },
            render: renderQuestionContent,
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: 400,
            render: (text, record) => {
                return <div>{record.title}</div>;
            },
        },
        {
            title: 'Detail',
            dataIndex: 'detail',
            key: 'detail',
            width: 400,
            ellipsis: {
                showTitle: false,
            },
            render: renderDetail,
        },
        {
            title: 'AI Feedback',
            dataIndex: 'ai_feedback_quiz',
            key: 'ai_feedback_quiz',
            width: 400,
            ellipsis: {
                showTitle: false,
            },
            render: renderFeedback,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 250,
            fixed: 'right',
            render: renderAction,
        },
    ], [renderQuestionContent, renderDetail, renderFeedback, renderAction]);

    return (
        <div style={{ padding: '24px', maxWidth: '1700px', margin: '0 auto' }}>
            <Card>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Button
                            type="default"
                            icon={<HomeOutlined />}
                            onClick={() => navigate('/home')}
                        >
                            Về trang chủ
                        </Button>
                        <h2 style={{ marginBottom: 0, margin: 0 }}>AI Đánh giá Câu hỏi</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', width: '40%' }}>
                        <Input
                            placeholder="Tìm kiếm theo ID, CID, Question Content, hoặc Detail..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ flex: 1, maxWidth: '500px' }}
                            allowClear
                        />
                        <Button
                            type="default"
                            icon={<SettingOutlined />}
                            onClick={() => setSettingsModalVisible(true)}
                        >
                            Cài đặt
                        </Button>
                    </div>

                </div>

                <div style={{ marginBottom: '16px' }}>

                    {/* Action buttons */}
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            type="primary"
                            icon={<RobotOutlined />}
                            loading={isEvaluating}
                            onClick={handleAIEvaluation}
                            disabled={selectedRowKeys.length === 0}
                        >
                            Đánh giá AI ({selectedRowKeys.length})
                        </Button>
                        {selectedRowKeys.length > 0 && (
                            <Button
                                type="link"
                                onClick={() => setSelectedRowKeys([])}
                            >
                                Bỏ chọn tất cả
                            </Button>
                        )}
                        
                        {/* Feedback Filter */}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Lọc Feedback:</span>
                            <Radio.Group
                                value={feedbackFilter}
                                onChange={(e) => setFeedbackFilter(e.target.value)}
                                size="small"
                                buttonStyle="solid"
                            >
                                <Radio.Button value="all">Tất cả</Radio.Button>
                                <Radio.Button value="has">Đã đánh giá</Radio.Button>
                                <Radio.Button value="none">Chưa đánh giá</Radio.Button>
                            </Radio.Group>
                            
                            {/* Feedback Search */}
                            <Input
                                placeholder="Tìm kiếm trong Feedback..."
                                prefix={<SearchOutlined />}
                                value={feedbackSearchText}
                                onChange={(e) => setFeedbackSearchText(e.target.value)}
                                style={{ width: '250px' }}
                                allowClear
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs activeKey={activeTab} onChange={setActiveTab}>
                        <TabPane
                            tab={<span>Lý thuyết <Badge count={k9Data.news?.length || 0} size="small" /></span>}
                            key="news"
                        />
                        <TabPane
                            tab={<span>Case Training <Badge count={k9Data.caseTraining?.length || 0} size="small" /></span>}
                            key="caseTraining"
                        />
                        <TabPane
                            tab={<span>Kho tài nguyên <Badge count={k9Data.longForm?.length || 0} size="small" /></span>}
                            key="longForm"
                        />
                    </Tabs>
                </div>

                {/* Table */}
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1200, y: 600 }}
                    rowSelection={{
                        type: 'checkbox',
                        columnWidth: 60, // Fixed width cho checkbox column để không bị che khi scroll ngang
                        fixed: true, // Fix checkbox column ở bên trái
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                        getCheckboxProps: (record) => ({
                            disabled: isEvaluating && evaluatingRecordId === record.id,
                        }),
                    }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['1000', '2000', '3000', '4000'],
                        showTotal: (total) => `Tổng ${total} câu hỏi (Tab: ${activeTab})`,
                        onShowSizeChange: (current, size) => {
                            // Tính toán lại trang để giữ nguyên vị trí hiện tại
                            const newPage = Math.ceil((currentPage - 1) * pageSize / size) + 1;
                            setPageSize(size);
                            setCurrentPage(newPage);
                        },
                        onChange: (page) => {
                            setCurrentPage(page);
                        },
                    }}
                    virtual
                    locale={{
                        emptyText: <Empty description="Không có câu hỏi nào" />,
                    }}
                />
            </Card>

            {/* Quiz Editor Modal */}
            <QuizEditorModal
                visible={quizEditorVisible}
                onCancel={() => {
                    setQuizEditorVisible(false);
                    setQuizEditorRecord(null);
                }}
                record={quizEditorRecord}
                confirmLoading={savingQuiz}
                onSave={handleQuizSave}
            />

            {/* Detail Modal */}
            <EditDetailModal
                visible={detailModalVisible}
                onClose={() => {
                    setDetailModalVisible(false);
                    setSelectedDetailRecord(null);
                }}
                item={selectedDetailRecord}
                onUpdate={(updatedItem) => {
                    // Update local data
                    const updater = (list) => list.map(item =>
                        item.id === updatedItem.id
                            ? { ...item, detail: updatedItem.detail }
                            : item
                    );

                    setK9Data(prev => ({
                        news: updater(prev.news || []),
                        caseTraining: updater(prev.caseTraining || []),
                        longForm: updater(prev.longForm || []),
                    }));
                }}
            />

            {/* Preview Modal for string questionContent */}
            {previewVisible && selectedQuestion && selectedQuestion.questionContent && typeof selectedQuestion.questionContent === 'string' && (
                <Modal
                    title="Question Content"
                    open={previewVisible}
                    onCancel={() => {
                        setPreviewVisible(false);
                        setSelectedQuestion(null);
                    }}
                    footer={[
                        <Button key="close" onClick={() => {
                            setPreviewVisible(false);
                            setSelectedQuestion(null);
                        }}>
                            Đóng
                        </Button>
                    ]}
                    width={800}
                >
                    <div style={{ padding: '16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {String(selectedQuestion.questionContent)}
                    </div>
                </Modal>
            )}

            {/* Settings Modal */}
            <Modal
                title="Cài đặt AI Đánh giá Câu hỏi"
                open={settingsModalVisible}
                onCancel={() => setSettingsModalVisible(false)}
                onOk={handleSaveSettings}
                width={900}
                okText="Lưu"
                cancelText="Hủy"
            >
                <div style={{ display: 'flex', width: '100%', height: '55vh', overflowY: 'auto' }}>
                    <Form form={form} layout="vertical" style={{ marginTop: '16px', width: '100%' }}>
                        <Form.Item
                            label={<span style={{ fontWeight: 500 }}>Model</span>}
                            style={{ marginBottom: '0' }}
                        >
                            <Select
                                value={model}
                                onChange={setModel}
                                style={{ width: '100%' }}
                                placeholder="Chọn model"
                                size="large"
                            >
                                {MODEL_AI_LIST.map(item => (
                                    <Select.Option key={item.value} value={item.value}>
                                        {item.name}
                                    </Select.Option>
                                ))}
                            </Select>
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                                Chọn model AI để sử dụng cho việc đánh giá
                            </div>
                        </Form.Item>
                        <Form.Item
                            label={<span style={{ fontWeight: 500 }}>System Message</span>}
                            style={{ marginBottom: '24px' }}
                        >
                            <TextArea
                                rows={12}
                                value={systemMessage}
                                onChange={(e) => setSystemMessage(e.target.value)}
                                placeholder="Nhập system message cho AI..."
                                style={{
                                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    resize: 'vertical'
                                }}
                            />
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                                System message sẽ được sử dụng để hướng dẫn AI đánh giá câu hỏi
                            </div>
                        </Form.Item>

                    </Form>
                </div>
            </Modal>

            {/* Feedback Modal */}
            <Modal
                title="AI Feedback"
                open={feedbackModalVisible}
                onCancel={() => {
                    setFeedbackModalVisible(false);
                    setSelectedFeedback('');
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setFeedbackModalVisible(false);
                        setSelectedFeedback('');
                    }}>
                        Đóng
                    </Button>
                ]}
                width={900}
            >
                <div style={{ 
                    padding: '16px', 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word',
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    lineHeight: '1.6',
                    fontSize: '14px'
                }}>
                    {selectedFeedback || 'Không có feedback'}
                </div>
            </Modal>
        </div>
    );
};

export default AIQuestionEvaluation;

