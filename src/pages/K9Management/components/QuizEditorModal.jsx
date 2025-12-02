import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Divider, Select, Typography, Row, Col, Card, Tag } from 'antd';

const { TextArea } = Input;
const { Title, Text } = Typography;

const defaultOptionKeys = ['A', 'B', 'C', 'D'];

const toArrayQuestions = (content) => {
    const quiz = Array.isArray(content?.questionQuiz) ? content.questionQuiz : [];
    const essay = Array.isArray(content?.questionEssay) ? content.questionEssay : [];
    // Normalize options into fields A-D
    const normalizedQuiz = quiz.map(q => ({
        question: q.question || '',
        explanation: q.explanation || '',
        correct_answer: q?.correct_answer || 'A',
        A: q.options?.A || '',
        B: q.options?.B || '',
        C: q.options?.C || '',
        D: q.options?.D || ''
    }));
    const normalizedEssay = essay.map(q => ({
        question: q.question || ''
    }));
    return { quiz: normalizedQuiz, essay: normalizedEssay };
};

const toQuestionContent = (values) => {
    const quiz = (values.quiz || []).map(q => ({
        question: q.question || '',
        options: {
            A: q.A || '',
            B: q.B || '',
            C: q.C || '',
            D: q.D || ''
        },
        correct_answer: q?.correct_answer || 'A',
        explanation: q.explanation || ''
    }));
    const essay = (values.essay || []).map(q => ({ question: q.question || '' }));
    return { questionQuiz: quiz, questionEssay: essay };
};

const QuizEditorModal = ({ visible, onCancel, record, onSave, confirmLoading }) => {
    const [form] = Form.useForm();
    const quizList = Form.useWatch('quiz', form) || [];
    const essayList = Form.useWatch('essay', form) || [];

    useEffect(() => {
        if (visible && record) {
            const content = record.questionContent || record.quizContent || record.quizzContent || {};
            const initial = toArrayQuestions(content);
            form.setFieldsValue(initial);
        } else {
            form.resetFields();
        }
    }, [visible, record, form]);

    const handleOk = async () => {
        const values = await form.validateFields();
        const questionContent = toQuestionContent(values);
        if (onSave) await onSave(questionContent);
    };

    return (
        <Modal
            title="Quiz/Essay"
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            okText="Lưu"
            confirmLoading={confirmLoading}
            width={900}
            destroyOnClose
        >
            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 10 }}>

                <Form form={form} layout="vertical">
                    <Form.List name="quiz">
                        {(fields, { add, remove }) => (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Title level={5} style={{ margin: 0 }}>
                                        Câu hỏi trắc nghiệm (MCQ) <Tag color="blue">{Array.isArray(quizList) ? quizList.length : 0}</Tag>
                                    </Title>
                                    <Button type="dashed" onClick={() => add({ correct_answer: 'A' })}>+ Thêm câu MCQ</Button>
                                </div>

                                {fields.map(({ key, name, ...restField }, index) => (
                                    <Card key={key} size="small" title={`MCQ #${index + 1}`} style={{ marginBottom: 12 }} extra={<Button danger size="small" onClick={() => remove(name)}>Xóa</Button>}>
                                        <Form.Item {...restField} name={[name, 'question']} label="Câu hỏi" rules={[{ required: true, message: 'Nhập câu hỏi' }]} style={{ marginBottom: 12 }}>
                                            <TextArea rows={2} placeholder="Nhập câu hỏi" />
                                        </Form.Item>
                                        <Row gutter={12}>
                                            {defaultOptionKeys.map(k => (
                                                <Col span={12} key={k}>
                                                    <Form.Item name={[name, k]} label={`Đáp án ${k}`} rules={[{ required: true, message: `Nhập đáp án ${k}` }]}>
                                                        <Input placeholder={`Đáp án ${k}`} />
                                                    </Form.Item>
                                                </Col>
                                            ))}
                                        </Row>
                                        <Row gutter={12}>
                                            <Col span={8}>
                                                <Form.Item name={[name, 'correct_answer']} label="Đáp án đúng" rules={[{ required: true, message: 'Chọn đáp án đúng' }]} style={{ marginBottom: 0 }}>
                                                    <Select options={defaultOptionKeys.map(k => ({ label: k, value: k }))} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={16}>
                                                <Form.Item name={[name, 'explanation']} label="Giải thích" style={{ marginBottom: 0 }}>
                                                    <TextArea rows={2} placeholder="Giải thích ngắn" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}

                                <Button type="dashed" onClick={() => add({ correct_answer: 'A' })} block>
                                    + Thêm câu MCQ
                                </Button>
                            </>
                        )}
                    </Form.List>

                    <Divider />

                    <Form.List name="essay">
                        {(fields, { add, remove }) => (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Title level={5} style={{ margin: 0 }}>
                                        Câu hỏi tự luận <Tag color="purple">{Array.isArray(essayList) ? essayList.length : 0}</Tag>
                                    </Title>
                                    <Button type="dashed" onClick={() => add()}>+ Thêm câu tự luận</Button>
                                </div>

                                {fields.map(({ key, name, ...restField }, index) => (
                                    <Card key={key} size="small" title={`Essay #${index + 1}`} style={{ marginBottom: 12 }} extra={<Button danger size="small" onClick={() => remove(name)}>Xóa</Button>}>
                                        <Form.Item {...restField} name={[name, 'question']} label="Câu hỏi" rules={[{ required: true, message: 'Nhập câu hỏi' }]} style={{ marginBottom: 0 }}>
                                            <TextArea rows={3} placeholder="Nhập câu hỏi tự luận" />
                                        </Form.Item>
                                    </Card>
                                ))}

                                <Button type="dashed" onClick={() => add()} block>
                                    + Thêm câu tự luận
                                </Button>
                            </>
                        )}
                    </Form.List>

                    <Divider />
                    <Text type="secondary">Lưu ý: Lưu sẽ ghi đè nội dung quiz/essay của bản ghi này bằng dữ liệu đang hiển thị.</Text>
                </Form>
            </div>
        </Modal>
    );
};

export default QuizEditorModal;


