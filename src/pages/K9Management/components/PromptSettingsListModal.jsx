import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Button, Form, Input, Select, message, Space, List, Popconfirm, Card, Divider } from 'antd';
import { SettingOutlined, PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { getSettingByType, createOrUpdateSetting } from '../../../apis/settingService';
import { MODEL_AI_LIST, MODEL_IMG_AI_LIST } from '../../Admin/AIGen/AI_CONST';
import styles from './PromptSettingsListModal.module.css';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const PromptSettingsListModal = ({
    visible,
    onCancel,
    onSuccess
}) => {
    const [activeTab, setActiveTab] = useState('improve_detail');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    // State for each prompt type
    const [improveDetailPrompts, setImproveDetailPrompts] = useState([]);
    const [createQuizPrompts, setCreateQuizPrompts] = useState([]);
    const [excalidrawReactPrompts, setExcalidrawReactPrompts] = useState([]);
    const [htmlFromDetailPrompts, setHtmlFromDetailPrompts] = useState([]);
    const [htmlFromSummaryDetailPrompts, setHtmlFromSummaryDetailPrompts] = useState([]);
    // New: prompts để tạo Case Training từ Learning Block
    const [caseFromLearningBlockPrompts, setCaseFromLearningBlockPrompts] = useState([]);
    // New: prompts để tạo ImageUrl từ SummaryDetail
    const [imageUrlFromSummaryDetailPrompts, setImageUrlFromSummaryDetailPrompts] = useState([]);
    // Summary Detail Config (AI tóm tắt Detail)
    const [summaryDetailConfig, setSummaryDetailConfig] = useState({
        aiModel: '',
        aiPrompt: ''
    });

    useEffect(() => {
        if (visible) {
            loadAllSettings();
        }
    }, [visible]);

    const loadAllSettings = async () => {
        setLoading(true);
        try {
            // Load Improve Detail Prompts
            const improveDetailSettings = await getSettingByType('IMPROVE_DETAIL_PROMPTS');
            if (improveDetailSettings?.setting && Array.isArray(improveDetailSettings.setting)) {
                setImproveDetailPrompts(improveDetailSettings.setting);
            } else {
                setImproveDetailPrompts([]);
            }

            // Load Create Quiz Prompts
            const createQuizSettings = await getSettingByType('CREATE_QUIZ_PROMPTS');
            if (createQuizSettings?.setting && Array.isArray(createQuizSettings.setting)) {
                setCreateQuizPrompts(createQuizSettings.setting);
            } else {
                setCreateQuizPrompts([]);
            }

            // Load Excalidraw React Prompts
            const excalidrawReactSettings = await getSettingByType('EXCALIDRAW_REACT_PROMPTS');
            if (excalidrawReactSettings?.setting && Array.isArray(excalidrawReactSettings.setting)) {
                setExcalidrawReactPrompts(excalidrawReactSettings.setting);
            } else {
                setExcalidrawReactPrompts([]);
            }

            // Load HTML from Detail Prompts
            const htmlFromDetailSettings = await getSettingByType('HTML_FROM_DETAIL_PROMPTS');
            if (htmlFromDetailSettings?.setting && Array.isArray(htmlFromDetailSettings.setting)) {
                setHtmlFromDetailPrompts(htmlFromDetailSettings.setting);
            } else {
                setHtmlFromDetailPrompts([]);
            }

            // Load HTML from SummaryDetail Prompts
            const htmlFromSummaryDetailSettings = await getSettingByType('HTML_FROM_SUMMARYDETAIL_PROMPTS');
            if (htmlFromSummaryDetailSettings?.setting && Array.isArray(htmlFromSummaryDetailSettings.setting)) {
                setHtmlFromSummaryDetailPrompts(htmlFromSummaryDetailSettings.setting);
            } else {
                setHtmlFromSummaryDetailPrompts([]);
            }

            // Load Case Training from Learning Block Prompts
            const caseFromLearningBlockSettings = await getSettingByType('CASE_FROM_LEARNING_BLOCK_PROMPTS');
            if (caseFromLearningBlockSettings?.setting && Array.isArray(caseFromLearningBlockSettings.setting)) {
                setCaseFromLearningBlockPrompts(caseFromLearningBlockSettings.setting);
            } else {
                setCaseFromLearningBlockPrompts([]);
            }

            // Load ImageUrl from SummaryDetail Prompts
            const imageUrlFromSummaryDetailSettings = await getSettingByType('IMAGEURL_FROM_SUMMARYDETAIL_PROMPTS');
            if (imageUrlFromSummaryDetailSettings?.setting && Array.isArray(imageUrlFromSummaryDetailSettings.setting)) {
                setImageUrlFromSummaryDetailPrompts(imageUrlFromSummaryDetailSettings.setting);
            } else {
                setImageUrlFromSummaryDetailPrompts([]);
            }

            // Load Summary Detail Config
            const summaryDetailConfigSettings = await getSettingByType('SUMMARY_DETAIL_CONFIG');
            if (summaryDetailConfigSettings?.setting) {
                setSummaryDetailConfig(summaryDetailConfigSettings.setting);
            } else {
                setSummaryDetailConfig({ aiModel: '', aiPrompt: '' });
            }
        } catch (error) {
            console.error('Error loading prompt settings:', error);
            message.error('Lỗi khi tải cài đặt prompt!');
        } finally {
            setLoading(false);
        }
    };

    const saveAllSettings = async () => {
        setSaving(true);
        try {
            // Save Improve Detail Prompts
            await createOrUpdateSetting({
                type: 'IMPROVE_DETAIL_PROMPTS',
                setting: improveDetailPrompts
            });

            // Save Create Quiz Prompts
            await createOrUpdateSetting({
                type: 'CREATE_QUIZ_PROMPTS',
                setting: createQuizPrompts
            });

            // Save Excalidraw React Prompts
            await createOrUpdateSetting({
                type: 'EXCALIDRAW_REACT_PROMPTS',
                setting: excalidrawReactPrompts
            });

            // Save HTML from Detail Prompts
            await createOrUpdateSetting({
                type: 'HTML_FROM_DETAIL_PROMPTS',
                setting: htmlFromDetailPrompts
            });

            // Save HTML from SummaryDetail Prompts
            await createOrUpdateSetting({
                type: 'HTML_FROM_SUMMARYDETAIL_PROMPTS',
                setting: htmlFromSummaryDetailPrompts
            });

            // Save Case Training from Learning Block Prompts
            await createOrUpdateSetting({
                type: 'CASE_FROM_LEARNING_BLOCK_PROMPTS',
                setting: caseFromLearningBlockPrompts
            });

            // Save ImageUrl from SummaryDetail Prompts
            await createOrUpdateSetting({
                type: 'IMAGEURL_FROM_SUMMARYDETAIL_PROMPTS',
                setting: imageUrlFromSummaryDetailPrompts
            });

            // Save Summary Detail Config
            await createOrUpdateSetting({
                type: 'SUMMARY_DETAIL_CONFIG',
                setting: summaryDetailConfig
            });

            message.success('Đã lưu tất cả cài đặt prompt thành công!');
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error saving prompt settings:', error);
            message.error('Lỗi khi lưu cài đặt prompt!');
        } finally {
            setSaving(false);
        }
    };

    // Helper functions for each prompt type
    const addImproveDetailPrompt = () => {
        const newPrompt = {
            id: `improve_${Date.now()}`,
            name: `Cài đặt ${improveDetailPrompts.length + 1}`,
            prompt: '',
            model: ''
        };
        setImproveDetailPrompts([...improveDetailPrompts, newPrompt]);
    };

    const removeImproveDetailPrompt = (id) => {
        setImproveDetailPrompts(improveDetailPrompts.filter(p => p.id !== id));
    };

    const updateImproveDetailPrompt = (id, field, value) => {
        setImproveDetailPrompts(improveDetailPrompts.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const addCreateQuizPrompt = () => {
        const newPrompt = {
            id: `quiz_${Date.now()}`,
            name: `Cài đặt ${createQuizPrompts.length + 1}`,
            prompt: '',
            evaluationPrompt: '',
            createModel: '',
            evaluationModel: '',
            countQuiz: 5,
            countEssay: 2
        };
        setCreateQuizPrompts([...createQuizPrompts, newPrompt]);
    };

    const removeCreateQuizPrompt = (id) => {
        setCreateQuizPrompts(createQuizPrompts.filter(p => p.id !== id));
    };

    const updateCreateQuizPrompt = (id, field, value) => {
        setCreateQuizPrompts(createQuizPrompts.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const addExcalidrawReactPrompt = () => {
        const newPrompt = {
            id: `excalidraw_${Date.now()}`,
            name: `Cài đặt ${excalidrawReactPrompts.length + 1}`,
            aiPrompt: '',
            aiModel: '',
            notePrompt: '',
            noteModel: '',
            quantity: 1
        };
        setExcalidrawReactPrompts([...excalidrawReactPrompts, newPrompt]);
    };

    const removeExcalidrawReactPrompt = (id) => {
        setExcalidrawReactPrompts(excalidrawReactPrompts.filter(p => p.id !== id));
    };

    const updateExcalidrawReactPrompt = (id, field, value) => {
        setExcalidrawReactPrompts(excalidrawReactPrompts.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const addHtmlFromDetailPrompt = () => {
        const newPrompt = {
            id: `html_detail_${Date.now()}`,
            name: `Cài đặt ${htmlFromDetailPrompts.length + 1}`,
            ai4Prompt: '',
            ai4Model: ''
        };
        setHtmlFromDetailPrompts([...htmlFromDetailPrompts, newPrompt]);
    };

    const removeHtmlFromDetailPrompt = (id) => {
        setHtmlFromDetailPrompts(htmlFromDetailPrompts.filter(p => p.id !== id));
    };

    const updateHtmlFromDetailPrompt = (id, field, value) => {
        setHtmlFromDetailPrompts(htmlFromDetailPrompts.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const addHtmlFromSummaryDetailPrompt = () => {
        const newPrompt = {
            id: `html_summary_${Date.now()}`,
            name: `Cài đặt ${htmlFromSummaryDetailPrompts.length + 1}`,
            aiPrompt: '',
            aiModel: ''
        };
        setHtmlFromSummaryDetailPrompts([...htmlFromSummaryDetailPrompts, newPrompt]);
    };

    const removeHtmlFromSummaryDetailPrompt = (id) => {
        setHtmlFromSummaryDetailPrompts(htmlFromSummaryDetailPrompts.filter(p => p.id !== id));
    };

    const updateHtmlFromSummaryDetailPrompt = (id, field, value) => {
        setHtmlFromSummaryDetailPrompts(htmlFromSummaryDetailPrompts.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const renderImproveDetailTab = () => {
        return (
            <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Danh sách cài đặt Improve Detail</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addImproveDetailPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <List
                    dataSource={improveDetailPrompts}
                    renderItem={(item, index) => (
                        <List.Item>
                            <Card style={{ width: '100%' }}>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={item.name}
                                            onChange={(e) => updateImproveDetailPrompt(item.id, 'name', e.target.value)}
                                            style={{ flex: 1, marginRight: 8 }}
                                        />
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeImproveDetailPrompt(item.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="Prompt">
                                        <TextArea
                                            rows={4}
                                            value={item.prompt}
                                            onChange={(e) => updateImproveDetailPrompt(item.id, 'prompt', e.target.value)}
                                            placeholder="Nhập prompt..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="Model">
                                        <Select
                                            value={item.model}
                                            onChange={(value) => updateImproveDetailPrompt(item.id, 'model', value)}
                                            style={{ width: '100%' }}
                                        >
                                            {MODEL_AI_LIST.map(model => (
                                                <Option key={model.value} value={model.value}>
                                                    {model.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Space>
                            </Card>
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    const renderCreateQuizTab = () => {
        return (
            <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Danh sách cài đặt Create Quiz</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addCreateQuizPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <List
                    dataSource={createQuizPrompts}
                    renderItem={(item) => (
                        <List.Item>
                            <Card style={{ width: '100%' }}>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={item.name}
                                            onChange={(e) => updateCreateQuizPrompt(item.id, 'name', e.target.value)}
                                            style={{ flex: 1, marginRight: 8 }}
                                        />
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeCreateQuizPrompt(item.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="Prompt">
                                        <TextArea
                                            rows={3}
                                            value={item.prompt}
                                            onChange={(e) => updateCreateQuizPrompt(item.id, 'prompt', e.target.value)}
                                            placeholder="Nhập prompt tạo quiz..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="Evaluation Prompt">
                                        <TextArea
                                            rows={3}
                                            value={item.evaluationPrompt}
                                            onChange={(e) => updateCreateQuizPrompt(item.id, 'evaluationPrompt', e.target.value)}
                                            placeholder="Nhập prompt đánh giá..."
                                        />
                                    </Form.Item>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <Form.Item label="Create Model" style={{ flex: 1 }}>
                                            <Select
                                                value={item.createModel}
                                                onChange={(value) => updateCreateQuizPrompt(item.id, 'createModel', value)}
                                                style={{ width: '100%' }}
                                            >
                                                {MODEL_AI_LIST.map(model => (
                                                    <Option key={model.value} value={model.value}>
                                                        {model.name}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item label="Evaluation Model" style={{ flex: 1 }}>
                                            <Select
                                                value={item.evaluationModel}
                                                onChange={(value) => updateCreateQuizPrompt(item.id, 'evaluationModel', value)}
                                                style={{ width: '100%' }}
                                            >
                                                {MODEL_AI_LIST.map(model => (
                                                    <Option key={model.value} value={model.value}>
                                                        {model.name}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </div>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <Form.Item label="Số lượng Quiz" style={{ flex: 1 }}>
                                            <Input
                                                type="number"
                                                value={item.countQuiz}
                                                onChange={(e) => updateCreateQuizPrompt(item.id, 'countQuiz', parseInt(e.target.value) || 0)}
                                            />
                                        </Form.Item>
                                        <Form.Item label="Số lượng Essay" style={{ flex: 1 }}>
                                            <Input
                                                type="number"
                                                value={item.countEssay}
                                                onChange={(e) => updateCreateQuizPrompt(item.id, 'countEssay', parseInt(e.target.value) || 0)}
                                            />
                                        </Form.Item>
                                    </div>
                                </Space>
                            </Card>
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    const renderExcalidrawReactTab = () => {
        return (
            <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Danh sách cài đặt Excalidraw React</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addExcalidrawReactPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <List
                    dataSource={excalidrawReactPrompts}
                    renderItem={(item) => (
                        <List.Item>
                            <Card style={{ width: '100%' }}>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={item.name}
                                            onChange={(e) => updateExcalidrawReactPrompt(item.id, 'name', e.target.value)}
                                            style={{ flex: 1, marginRight: 8 }}
                                        />
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeExcalidrawReactPrompt(item.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="AI Prompt (System Message)">
                                        <TextArea
                                            rows={4}
                                            value={item.aiPrompt}
                                            onChange={(e) => updateExcalidrawReactPrompt(item.id, 'aiPrompt', e.target.value)}
                                            placeholder="Nhập prompt tạo Excalidraw JSON..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI Model">
                                        <Select
                                            value={item.aiModel}
                                            onChange={(value) => updateExcalidrawReactPrompt(item.id, 'aiModel', value)}
                                            style={{ width: '100%' }}
                                        >
                                            {MODEL_AI_LIST.map(model => (
                                                <Option key={model.value} value={model.value}>
                                                    {model.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Divider />
                                    <Form.Item label="Note Prompt (System Message)">
                                        <TextArea
                                            rows={3}
                                            value={item.notePrompt}
                                            onChange={(e) => updateExcalidrawReactPrompt(item.id, 'notePrompt', e.target.value)}
                                            placeholder="Nhập prompt tạo ghi chú..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="Note Model">
                                        <Select
                                            value={item.noteModel}
                                            onChange={(value) => updateExcalidrawReactPrompt(item.id, 'noteModel', value)}
                                            style={{ width: '100%' }}
                                        >
                                            {MODEL_AI_LIST.map(model => (
                                                <Option key={model.value} value={model.value}>
                                                    {model.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label="Số lượng">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={10}
                                            value={item.quantity}
                                            onChange={(e) => updateExcalidrawReactPrompt(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                        />
                                    </Form.Item>
                                </Space>
                            </Card>
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    const renderHtmlFromDetailTab = () => {
        return (
            <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Danh sách cài đặt HTML từ Detail</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addHtmlFromDetailPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <List
                    dataSource={htmlFromDetailPrompts}
                    renderItem={(item) => (
                        <List.Item>
                            <Card style={{ width: '100%' }}>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={item.name}
                                            onChange={(e) => updateHtmlFromDetailPrompt(item.id, 'name', e.target.value)}
                                            style={{ flex: 1, marginRight: 8 }}
                                        />
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeHtmlFromDetailPrompt(item.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="AI4 Prompt">
                                        <TextArea
                                            rows={4}
                                            value={item.ai4Prompt}
                                            onChange={(e) => updateHtmlFromDetailPrompt(item.id, 'ai4Prompt', e.target.value)}
                                            placeholder="Nhập prompt tạo HTML code..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI4 Model">
                                        <Select
                                            value={item.ai4Model}
                                            onChange={(value) => updateHtmlFromDetailPrompt(item.id, 'ai4Model', value)}
                                            style={{ width: '100%' }}
                                        >
                                            {MODEL_AI_LIST.map(model => (
                                                <Option key={model.value} value={model.value}>
                                                    {model.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Space>
                            </Card>
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    const renderHtmlFromSummaryDetailTab = () => {
        return (
            <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Danh sách cài đặt HTML từ SummaryDetail</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addHtmlFromSummaryDetailPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <List
                    dataSource={htmlFromSummaryDetailPrompts}
                    renderItem={(item) => (
                        <List.Item>
                            <Card style={{ width: '100%' }}>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={item.name}
                                            onChange={(e) => updateHtmlFromSummaryDetailPrompt(item.id, 'name', e.target.value)}
                                            style={{ flex: 1, marginRight: 8 }}
                                        />
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeHtmlFromSummaryDetailPrompt(item.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="AI Prompt">
                                        <TextArea
                                            rows={4}
                                            value={item.aiPrompt}
                                            onChange={(e) => updateHtmlFromSummaryDetailPrompt(item.id, 'aiPrompt', e.target.value)}
                                            placeholder="Nhập prompt tạo HTML code từ SummaryDetail..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI Model">
                                        <Select
                                            value={item.aiModel}
                                            onChange={(value) => updateHtmlFromSummaryDetailPrompt(item.id, 'aiModel', value)}
                                            style={{ width: '100%' }}
                                        >
                                            {MODEL_AI_LIST.map(model => (
                                                <Option key={model.value} value={model.value}>
                                                    {model.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Space>
                            </Card>
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    // New: tab cấu hình tạo Case Training từ Learning Block
    const addCaseFromLearningBlockPrompt = () => {
        const newPrompt = {
            id: `case_from_learning_${Date.now()}`,
            name: `Cài đặt ${caseFromLearningBlockPrompts.length + 1}`,
            aiPrompt: '',
            aiModel: '',
            // Số lượng case tạo từ mỗi Learning Block
            quantity: 1,
            // Số lượng câu hỏi trong questionContent cho mỗi case
            countQuiz: 2,
            countEssay: 1
        };
        setCaseFromLearningBlockPrompts([...caseFromLearningBlockPrompts, newPrompt]);
    };

    const removeCaseFromLearningBlockPrompt = (id) => {
        setCaseFromLearningBlockPrompts(caseFromLearningBlockPrompts.filter(p => p.id !== id));
    };

    const updateCaseFromLearningBlockPrompt = (id, field, value) => {
        setCaseFromLearningBlockPrompts(caseFromLearningBlockPrompts.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const addImageUrlFromSummaryDetailPrompt = () => {
        const newPrompt = {
            id: `imageurl_summary_${Date.now()}`,
            name: `Cài đặt ${imageUrlFromSummaryDetailPrompts.length + 1}`,
            // Step 1: Tạo English description từ summaryDetail
            descriptionPrompt: '',
            descriptionModel: '',
            // Step 2: Tạo ảnh từ description (dùng aiGen2)
            imagePrompt: '',
            imageModel: ''
        };
        setImageUrlFromSummaryDetailPrompts([...imageUrlFromSummaryDetailPrompts, newPrompt]);
    };

    const removeImageUrlFromSummaryDetailPrompt = (id) => {
        setImageUrlFromSummaryDetailPrompts(imageUrlFromSummaryDetailPrompts.filter(p => p.id !== id));
    };

    const updateImageUrlFromSummaryDetailPrompt = (id, field, value) => {
        setImageUrlFromSummaryDetailPrompts(imageUrlFromSummaryDetailPrompts.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const renderCaseFromLearningBlockTab = () => {
        return (
            <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Danh sách cài đặt tạo Case Training từ Learning Block</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addCaseFromLearningBlockPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <List
                    dataSource={caseFromLearningBlockPrompts}
                    renderItem={(item) => (
                        <List.Item>
                            <Card style={{ width: '100%' }}>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={item.name}
                                            onChange={(e) => updateCaseFromLearningBlockPrompt(item.id, 'name', e.target.value)}
                                            style={{ flex: 1, marginRight: 8 }}
                                        />
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeCaseFromLearningBlockPrompt(item.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="AI Prompt (System Message)">
                                        <TextArea
                                            rows={4}
                                            value={item.aiPrompt}
                                            onChange={(e) => updateCaseFromLearningBlockPrompt(item.id, 'aiPrompt', e.target.value)}
                                            placeholder="Nhập prompt để AI tạo Case Training từ Learning Block (JSON, có đầy đủ trường cần thiết)..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI Model">
                                        <Select
                                            value={item.aiModel}
                                            onChange={(value) => updateCaseFromLearningBlockPrompt(item.id, 'aiModel', value)}
                                            style={{ width: '100%' }}
                                        >
                                            {MODEL_AI_LIST.map(model => (
                                                <Option key={model.value} value={model.value}>
                                                    {model.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <Form.Item label="Số case tạo / mỗi Learning Block" style={{ flex: 1 }}>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={item.quantity}
                                                onChange={(e) => updateCaseFromLearningBlockPrompt(
                                                    item.id,
                                                    'quantity',
                                                    parseInt(e.target.value, 10) > 0 ? parseInt(e.target.value, 10) : 1
                                                )}
                                            />
                                        </Form.Item>
                                        <Form.Item label="Số câu trắc nghiệm / case" style={{ flex: 1 }}>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={20}
                                                value={item.countQuiz}
                                                onChange={(e) => updateCaseFromLearningBlockPrompt(
                                                    item.id,
                                                    'countQuiz',
                                                    Math.max(0, parseInt(e.target.value, 10) || 0)
                                                )}
                                            />
                                        </Form.Item>
                                        <Form.Item label="Số câu tự luận / case" style={{ flex: 1 }}>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={20}
                                                value={item.countEssay}
                                                onChange={(e) => updateCaseFromLearningBlockPrompt(
                                                    item.id,
                                                    'countEssay',
                                                    Math.max(0, parseInt(e.target.value, 10) || 0)
                                                )}
                                            />
                                        </Form.Item>
                                    </div>
                                </Space>
                            </Card>
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    const renderImageUrlFromSummaryDetailTab = () => {
        return (
            <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Danh sách cài đặt ImageUrl từ SummaryDetail</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addImageUrlFromSummaryDetailPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <List
                    dataSource={imageUrlFromSummaryDetailPrompts}
                    renderItem={(item) => (
                        <List.Item>
                            <Card style={{ width: '100%' }}>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={item.name}
                                            onChange={(e) => updateImageUrlFromSummaryDetailPrompt(item.id, 'name', e.target.value)}
                                            style={{ flex: 1, marginRight: 8 }}
                                        />
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeImageUrlFromSummaryDetailPrompt(item.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </div>
                                    <Divider>Bước 1: Tạo English Description từ SummaryDetail</Divider>
                                    <Form.Item label="Description Prompt (System Message)">
                                        <TextArea
                                            rows={3}
                                            value={item.descriptionPrompt}
                                            onChange={(e) => updateImageUrlFromSummaryDetailPrompt(item.id, 'descriptionPrompt', e.target.value)}
                                            placeholder="Nhập prompt để tạo English description từ SummaryDetail..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="Description Model">
                                        <Select
                                            value={item.descriptionModel}
                                            onChange={(value) => updateImageUrlFromSummaryDetailPrompt(item.id, 'descriptionModel', value)}
                                            style={{ width: '100%' }}
                                        >
                                            {MODEL_AI_LIST.map(model => (
                                                <Option key={model.value} value={model.value}>
                                                    {model.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Divider>Bước 2: Tạo ảnh từ Description (aiGen2)</Divider>
                                    <Form.Item label="Image Prompt (System Message)">
                                        <TextArea
                                            rows={3}
                                            value={item.imagePrompt}
                                            onChange={(e) => updateImageUrlFromSummaryDetailPrompt(item.id, 'imagePrompt', e.target.value)}
                                            placeholder="Nhập prompt system message cho aiGen2 tạo ảnh..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="Image Model">
                                        <Select
                                            value={item.imageModel}
                                            onChange={(value) => updateImageUrlFromSummaryDetailPrompt(item.id, 'imageModel', value)}
                                            style={{ width: '100%' }}
                                        >
                                            {MODEL_IMG_AI_LIST.map(model => (
                                                <Option key={model.value} value={model.value}>
                                                    {model.name}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                                        Lưu ý: Sau khi tạo ảnh, hệ thống sẽ tự động lưu vào imgUrls (mảng) với mỗi phần tử là object JSON (url, description, generatedFrom, title, createdAt)
                                    </div>
                                </Space>
                            </Card>
                        </List.Item>
                    )}
                />
            </div>
        );
    };

    const renderSummaryDetailConfigTab = () => {
        return (
            <div>
                <div style={{ marginBottom: 16 }}>
                    <h4>🤖 Cấu hình AI tóm tắt Detail</h4>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                        Detail → SummaryDetail (Tóm tắt ngắn gọn, súc tích, giữ lại thông tin quan trọng)
                    </div>
                </div>
                <Card>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Form.Item label="AI Model">
                            <Select
                                value={summaryDetailConfig.aiModel}
                                onChange={(value) => setSummaryDetailConfig(prev => ({ ...prev, aiModel: value }))}
                                style={{ width: '100%' }}
                                placeholder="Chọn AI Model"
                            >
                                {MODEL_AI_LIST.map(model => (
                                    <Option key={model.value} value={model.value}>
                                        {model.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item label="AI Prompt (System Message)">
                            <TextArea
                                rows={8}
                                value={summaryDetailConfig.aiPrompt || ''}
                                onChange={(e) => setSummaryDetailConfig(prev => ({ ...prev, aiPrompt: e.target.value }))}
                                placeholder="Nhập system message cho AI tóm tắt detail..."
                            />
                        </Form.Item>
                    </Space>
                </Card>
            </div>
        );
    };

    return (
        <Modal
            title={
                <Space>
                    <SettingOutlined />
                    Cài đặt Prompt AI (Danh sách)
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            width={1700}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button
                    key="save"
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={saveAllSettings}
                >
                    Lưu tất cả
                </Button>
            ]}
            confirmLoading={saving}
            style={{
                top: '0px' , paddingBottom: '0px'
              }}
            className={styles.promptSettingsListModal}
        >
            <div className={styles.contentContainer}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
                    <TabPane tab="1. Improve Detail" key="improve_detail">
                        {renderImproveDetailTab()}
                    </TabPane>
                    <TabPane tab="2. Create Quiz" key="create_quiz">
                        {renderCreateQuizTab()}
                    </TabPane>
                    <TabPane tab="3. Excalidraw React" key="excalidraw_react">
                        {renderExcalidrawReactTab()}
                    </TabPane>
                    <TabPane tab="4. HTML từ Detail" key="html_from_detail">
                        {renderHtmlFromDetailTab()}
                    </TabPane>
                    <TabPane tab="5. HTML từ SummaryDetail" key="html_from_summarydetail">
                        {renderHtmlFromSummaryDetailTab()}
                    </TabPane>
                    <TabPane tab="6. Case từ Learning Block" key="case_from_learning_block">
                        {renderCaseFromLearningBlockTab()}
                    </TabPane>
                    <TabPane tab="7. ImageUrl từ SummaryDetail" key="imageurl_from_summarydetail">
                        {renderImageUrlFromSummaryDetailTab()}
                    </TabPane>
                    <TabPane tab="8. AI Tóm tắt Detail" key="summary_detail_config">
                        {renderSummaryDetailConfigTab()}
                    </TabPane>
                </Tabs>
            </div>
        </Modal>
    );
};

export default PromptSettingsListModal;

