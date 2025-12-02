import { Button, Col, Form, Input, List, message, Modal, Progress, Row, Select, Space, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { aiGen } from '../../../apis/aiGen/botService';
import { updateK9 } from '../../../apis/k9Service';
import { MODEL_AI_LIST } from '../../Admin/AIGen/AI_CONST';
import SelectPromptModal from './SelectPromptModal';
const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const RATE_LIMIT_MS = 800;
const MAX_RETRY = 2;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to extract JSON from markdown code blocks
const extractJsonFromResponse = (response) => {
    if (!response) return null;

    let text = '';
    if (typeof response === 'string') {
        text = response;
    } else if (response.result) {
        text = response.result;
    } else {
        return response;
    }


    // Try to extract JSON from markdown code blocks (```json ... ```)
    const jsonBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonBlockMatch) {
        try {
            return JSON.parse(jsonBlockMatch[1]);
        } catch (e) {
            console.error('Failed to parse JSON from code block:', e);
        }
    }

    // Try to find JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error('Failed to parse JSON from text:', e);
        }
    }

    // If no JSON found, try parsing the entire text
    try {
        console.log('Trying to parse entire text as JSON');
        return JSON.parse(text);
    } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        return null;
    }
};

const CreateQuizModal = ({ visible, onCancel, selectedRecords = [], onSuccess, setCreateQuizzLoading }) => {
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
            evaluationPrompt: prompt.evaluationPrompt,
            createModel: prompt.createModel,
            evaluationModel: prompt.evaluationModel,
            countQuiz: prompt.countQuiz,
            countEssay: prompt.countEssay
        });
    };

    const handleSubmit = async () => {
        try {
            if (!selectedPrompt) {
                message.warning('Vui lòng chọn cài đặt prompt trước!');
                return;
            }

            const prompt = selectedPrompt.prompt;
            const evaluationPrompt = selectedPrompt.evaluationPrompt;
            const createModel = selectedPrompt.createModel;
            const evaluationModel = selectedPrompt.evaluationModel;
            const countQuiz = selectedPrompt.countQuiz;
            const countEssay = selectedPrompt.countEssay;

            if (!prompt || !evaluationPrompt || !createModel || !evaluationModel) {
                message.warning('Cài đặt prompt không đầy đủ. Vui lòng kiểm tra lại!');
                return;
            }

            if (!Array.isArray(selectedRecords) || selectedRecords.length === 0) {
                message.warning('Vui lòng chọn ít nhất một bản ghi để tạo quiz');
                return;
            }

            cancelRef.current = false;
            setCreateQuizzLoading(true);
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
                    copy[i] = { id: record.id, status: 'processing', message: 'Đang tạo quiz...' };
                    return copy;
                });

                const sourceText = record.detail;
                if (!sourceText.trim()) {
                    setProcessingStatus(prev => {
                        const copy = [...prev];
                        copy[i] = { id: record.id, status: 'error', message: 'Bỏ qua: không có nội dung' };
                        return copy;
                    });
                    setProgress(((i + 1) / selectedRecords.length) * 100);
                    continue;
                }

                // Determine existing questions and how many to add
                const existingContent = record.questionContent || null;
                const existingQuizQuestions = Array.isArray(existingContent?.questionQuiz) ? existingContent.questionQuiz : [];
                const existingEssayQuestions = Array.isArray(existingContent?.questionEssay) ? existingContent.questionEssay : [];
                const targetQuiz = Number(countQuiz) || 0;
                const targetEssay = Number(countEssay) || 0;

                // Calculate what's needed
                const neededQuiz = Math.max(0, targetQuiz - existingQuizQuestions.length);
                const neededEssay = Math.max(0, targetEssay - existingEssayQuestions.length);

                if (neededQuiz === 0 && neededEssay === 0) {
                    setProcessingStatus(prev => {
                        const copy = [...prev];
                        copy[i] = { id: record.id, status: 'success', message: 'Đủ số lượng câu hỏi quiz và essay, bỏ qua cập nhật' };
                        return copy;
                    });
                } else {
                    // Dedup helpers
                    const buildKey = (q) => (q?.question ? String(q.question).trim().toLowerCase() : JSON.stringify(q));
                    const quizKeySet = new Set(existingQuizQuestions.map(buildKey));
                    const essayKeySet = new Set(existingEssayQuestions.map(buildKey));

                    let accumulatedQuizQuestions = [...existingQuizQuestions];
                    let accumulatedEssayQuestions = [...existingEssayQuestions];
                    let success = false;

                    for (let attempt = 0; attempt <= MAX_RETRY && (neededQuiz > 0 || neededEssay > 0) && !success && !cancelRef.current; attempt++) {
                        try {
                            // Build dynamic prompt based on what's needed
                            let promptText = `${prompt} `;
                            if (neededQuiz > 0 && neededEssay > 0) {
                                promptText += `Hãy tạo ${neededQuiz} câu hỏi trắc nghiệm và ${neededEssay} câu hỏi tự luận để kiểm tra hiểu biết của người dùng về nội dung này.`;
                            } else if (neededQuiz > 0) {
                                promptText += `Hãy tạo ${neededQuiz} câu hỏi trắc nghiệm để kiểm tra hiểu biết của người dùng về nội dung này.`;
                            } else if (neededEssay > 0) {
                                promptText += `Hãy tạo ${neededEssay} câu hỏi tự luận để kiểm tra hiểu biết của người dùng về nội dung này.`;
                            }
                            promptText += ` Tránh trùng lặp với danh sách đã có.`;

                            const systemMessage = promptText;
                            const aiResponse = await aiGen(sourceText, systemMessage, createModel, 'text');
                            console.log('AI Response:', aiResponse);
                            // Parse primary using helper function
                            const parsedData = extractJsonFromResponse(aiResponse);
                            if (!parsedData) {
                                throw new Error('Invalid AI response format - could not parse JSON');
                            }

                            // Handle both old and new format
                            let quizQuestions = [];
                            let essayQuestions = [];

                            if (parsedData.questionQuiz && Array.isArray(parsedData.questionQuiz)) {
                                // New format with questionQuiz and questionEssay
                                quizQuestions = parsedData.questionQuiz;
                                essayQuestions = parsedData.questionEssay || [];
                            } else if (parsedData.questions && Array.isArray(parsedData.questions)) {
                                // Old format with questions array - treat all as quiz questions
                                quizQuestions = parsedData.questions;
                            } else {
                                throw new Error('Invalid AI response format - missing questions array');
                            }

                            // Convert quiz questions to expected format if needed
                            const convertedQuizQuestions = quizQuestions.map(q => {
                                if (q.options && typeof q.options === 'object') {
                                    // Already in correct format
                                    return q;
                                } else if (Array.isArray(q.options)) {
                                    // Convert array to object format
                                    const optionsObj = {};
                                    q.options.forEach((opt, index) => {
                                        optionsObj[String.fromCharCode(65 + index)] = opt;
                                    });
                                    return {
                                        ...q,
                                        options: optionsObj
                                    };
                                }
                                return q;
                            });

                            let finalParsedData = {
                                questionQuiz: convertedQuizQuestions,
                                questionEssay: essayQuestions
                            };
                            console.log('Final Parsed Data:', finalParsedData);

                            if (cancelRef.current) throw new Error('cancelled');

                            // Evaluation
                            const evaluationSystemMessage = evaluationPrompt 
                            const evaluationPromptText = `Danh sách câu hỏi quiz đã có (tránh trùng):\n${JSON.stringify(accumulatedQuizQuestions, null, 2)}\n\nDanh sách câu hỏi essay đã có (tránh trùng):\n${JSON.stringify(accumulatedEssayQuestions, null, 2)}\n\nDữ liệu quiz và essay cần đánh giá và loại bỏ trùng lặp:\n${JSON.stringify(finalParsedData, null, 2)}\n\nTài liệu gốc: ${sourceText}`;
                            try {
                                if (cancelRef.current) throw new Error('cancelled');
                                console.log('Starting evaluation...');
                                const evaluationResult = await aiGen(evaluationPromptText, evaluationSystemMessage, evaluationModel, 'text');
                                console.log('Evaluation Result:', evaluationResult);
                                let evaluatedData = extractJsonFromResponse(evaluationResult);
                                console.log('Evaluated Data:', evaluatedData);
                                if (evaluatedData) {
                                    // Handle both old and new format for evaluation result
                                    let evalQuizQuestions = [];
                                    let evalEssayQuestions = [];

                                    if (evaluatedData.questionQuiz && Array.isArray(evaluatedData.questionQuiz)) {
                                        evalQuizQuestions = evaluatedData.questionQuiz;
                                        evalEssayQuestions = evaluatedData.questionEssay || [];
                                    } else if (evaluatedData.questions && Array.isArray(evaluatedData.questions)) {
                                        // Old format - treat all as quiz questions
                                        evalQuizQuestions = evaluatedData.questions;
                                    }

                                    if (evalQuizQuestions.length > 0 || evalEssayQuestions.length > 0) {
                                        // Convert quiz questions to expected format if needed
                                        const convertedEvalQuizQuestions = evalQuizQuestions.map(q => {
                                            if (q.options && typeof q.options === 'object') {
                                                return q;
                                            } else if (Array.isArray(q.options)) {
                                                const optionsObj = {};
                                                q.options.forEach((opt, index) => {
                                                    optionsObj[String.fromCharCode(65 + index)] = opt;
                                                });
                                                return { ...q, options: optionsObj };
                                            }
                                            return q;
                                        });

                                        // Create new variable instead of reassigning
                                        const updatedFinalParsedData = {
                                            questionQuiz: convertedEvalQuizQuestions,
                                            questionEssay: evalEssayQuestions
                                        };
                                        // Update the reference
                                        Object.assign(finalParsedData, updatedFinalParsedData);
                                        console.log('Updated Parsed Data after evaluation:', finalParsedData);
                                    }
                                }
                            } catch (evalErr) {
                                console.error('Error parsing evaluation result:', evalErr);
                                if (evalErr?.message === 'cancelled' || cancelRef.current) throw evalErr;
                            }


                            console.log('Final data to process:', finalParsedData)

                            // Merge with existing content instead of overwriting
                            let mergedQuiz = [...existingQuizQuestions];
                            for (const q of (finalParsedData.questionQuiz || [])) {
                                if (mergedQuiz.length >= targetQuiz) break;
                                const key = buildKey(q);
                                if (!quizKeySet.has(key)) {
                                    quizKeySet.add(key);
                                    mergedQuiz.push(q);
                                }
                            }

                            let mergedEssay = [...existingEssayQuestions];
                            for (const q of (finalParsedData.questionEssay || [])) {
                                if (mergedEssay.length >= targetEssay) break;
                                const key = buildKey(q);
                                if (!essayKeySet.has(key)) {
                                    essayKeySet.add(key);
                                    mergedEssay.push(q);
                                }
                            }

                            const newContent = {
                                ...(existingContent || {}),
                                questionQuiz: (neededQuiz === 0) ? existingQuizQuestions : mergedQuiz.slice(0, targetQuiz),
                                questionEssay: (neededEssay === 0) ? existingEssayQuestions : mergedEssay.slice(0, targetEssay)
                            };

                            const addedQuiz = Math.max(0, newContent.questionQuiz.length - existingQuizQuestions.length);
                            const addedEssay = Math.max(0, newContent.questionEssay.length - existingEssayQuestions.length);

                            await updateK9({ id: record.id, questionContent: newContent });
                            updatedRecords.push({ id: record.id, questionContent: newContent });
                            setProcessingStatus(prev => {
                                const copy = [...prev];
                                const parts = [];
                                if (addedQuiz > 0) parts.push(`${addedQuiz} câu quiz`);
                                if (addedEssay > 0) parts.push(`${addedEssay} câu essay`);
                                const message = parts.length > 0 ? `Đã bổ sung ${parts.join(' và ')}` : 'Không có câu hỏi mới phù hợp để bổ sung';
                                copy[i] = { id: record.id, status: 'success', message };
                                return copy;
                            });
                            success = true;
                            break;

                        } catch (e) {
                            if (e?.message === 'cancelled' || cancelRef.current) {
                                setProcessingStatus(prev => {
                                    const copy = [...prev];
                                    copy[i] = { id: record.id, status: 'stopped', message: 'Đã dừng bởi người dùng' };
                                    return copy;
                                });
                                break;
                            }
                            if (attempt === MAX_RETRY) {
                                setProcessingStatus(prev => {
                                    const copy = [...prev];
                                    const errorDetails = neededQuiz > 0 ? `quiz (${neededQuiz})` : '';
                                    const errorDetails2 = neededEssay > 0 ? `essay (${neededEssay})` : '';
                                    const errorType = errorDetails && errorDetails2 ? `${errorDetails}, ${errorDetails2}` : (errorDetails || errorDetails2);
                                    copy[i] = { id: record.id, status: 'error', message: `Lỗi tạo ${errorType}: ${e?.message || 'Không xác định'}` };
                                    return copy;
                                });
                            } else {
                                await sleep(RATE_LIMIT_MS * Math.pow(2, attempt));
                            }
                        }
                    }
                }

                setProgress(((i + 1) / selectedRecords.length) * 100);
                if (i < selectedRecords.length - 1 && !cancelRef.current) await sleep(RATE_LIMIT_MS);
            }

            if (!cancelRef.current && updatedRecords.length > 0) {
                message.success(`Tạo quiz thành công ${updatedRecords.length}/${selectedRecords.length} bản ghi`);
                if (onSuccess) onSuccess(updatedRecords);
            } else if (cancelRef.current) {
                message.info('Đã dừng tạo quiz');
                if (onSuccess && updatedRecords.length > 0) onSuccess(updatedRecords);
            } else {
                message.warning('Không có bản ghi nào được tạo quiz');
            }
        } catch (error) {
            message.error('Có lỗi xảy ra: ' + error.message);
        } finally {
            setLoading(false);
            setCreateQuizzLoading(false);
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
                promptType="CREATE_QUIZ_PROMPTS"
                title="Chọn cài đặt Prompt - Create Quiz"
            />

            <Modal
                title={
                    <div>
                        <Title level={4} style={{ margin: 0 }}>Tạo Question</Title>
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
                footer={
                    <Space>
                        <Button onClick={handleCancel} disabled={loading}>Đóng</Button>
                        <Button onClick={() => { setProcessingModalVisible(false); setSelectPromptModalVisible(true); }} disabled={loading}>
                            Chọn lại prompt
                        </Button>
                        {loading && (
                            <Button danger onClick={() => { cancelRef.current = true; }}>Dừng</Button>
                        )}
                        <Button type="primary" onClick={handleSubmit} loading={loading} disabled={selectedRecords.length === 0 || !selectedPrompt}>
                            {loading ? 'Đang xử lý...' : 'Bắt đầu tạo quiz'}
                        </Button>
                    </Space>
                }
            width={800}
            centered
            destroyOnClose={false}
        >
            <div style={{ height: '57vh', overflowY: 'auto', overflowX: 'hidden' }}>
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
                    {/* Section 1: Tạo Question */}
                    <div style={{ 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '8px', 
                        padding: '16px', 
                        marginBottom: '16px',
                        backgroundColor: '#fafafa'
                    }}>
                        <Title level={5} style={{ marginBottom: '16px', color: '#1890ff' }}>
                            🤖 Tạo Question
                        </Title>
                        
                        <Form.Item label="Prompt tạo Question" name="prompt">
                            <TextArea rows={5} placeholder="Prompt từ cài đặt đã chọn..." showCount disabled={true} />
                        </Form.Item>
                        
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Model AI tạo Question"
                                    name="createModel"
                                >
                                    <Select placeholder="Model từ cài đặt đã chọn" disabled={true}>
                                        {MODEL_AI_LIST.map(model => (
                                            <Option key={model.value} value={model.value}>{model.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    {/* Section 2: Đánh giá Question */}
                    <div style={{ 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '8px', 
                        padding: '16px', 
                        marginBottom: '16px',
                        backgroundColor: '#fafafa'
                    }}>
                        <Title level={5} style={{ marginBottom: '16px', color: '#52c41a' }}>
                            ✅ Đánh giá & Sửa lỗi Question
                        </Title>
                        
                        <Form.Item label="Prompt đánh giá Question" name="evaluationPrompt">
                            <TextArea rows={5} placeholder="Prompt từ cài đặt đã chọn..." showCount disabled={true} />
                        </Form.Item>
                        
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Model AI đánh giá"
                                    name="evaluationModel"
                                >
                                    <Select placeholder="Model từ cài đặt đã chọn" disabled={true}>
                                        {MODEL_AI_LIST.map(model => (
                                            <Option key={model.value} value={model.value}>{model.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    {/* Section 3: Cấu hình số lượng */}
                    <div style={{ 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '8px', 
                        padding: '16px', 
                        marginBottom: '16px',
                        backgroundColor: '#fafafa'
                    }}>
                        <Title level={5} style={{ marginBottom: '16px', color: '#722ed1' }}>
                            ⚙️ Cấu hình số lượng
                        </Title>
                        
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="Số câu hỏi Quiz mỗi bản ghi"
                                    name="countQuiz"
                                >
                                    <Input type="number" disabled={true} />
                                </Form.Item>
                            </Col>

                            <Col span={8}>
                                <Form.Item
                                    label="Số câu hỏi Essay mỗi bản ghi"
                                    name="countEssay"
                                >
                                    <Input type="number" disabled={true} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    {processingStatus.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
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
                        <div style={{ marginBottom: 16 }}>
                            <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} format={(p) => `${Math.round(p)}% (${currentIndex + 1}/${selectedRecords.length})`} />
                        </div>
                    )}
                </Form>
            </div>

            </Modal>
        </>
    );
};

export default CreateQuizModal;


