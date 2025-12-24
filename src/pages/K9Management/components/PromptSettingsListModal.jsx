import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Button, Form, Input, Select, message, Space, List, Popconfirm, Card, Divider, Layout } from 'antd';
import { SettingOutlined, PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { getSettingByType, createOrUpdateSetting } from '../../../apis/settingService';
import { MODEL_AI_LIST, MODEL_IMG_AI_LIST } from '../../Admin/AIGen/AI_CONST';
import styles from './PromptSettingsListModal.module.css';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;
const { Sider, Content } = Layout;

const PromptSettingsListModal = ({
    visible,
    onCancel,
    onSuccess
}) => {
    const [activeTab, setActiveTab] = useState('improve_detail');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedImproveDetailId, setSelectedImproveDetailId] = useState(null);
    const [selectedCreateQuizId, setSelectedCreateQuizId] = useState(null);
    const [selectedExcalidrawReactId, setSelectedExcalidrawReactId] = useState(null);
    const [selectedHtmlFromDetailId, setSelectedHtmlFromDetailId] = useState(null);
    const [selectedHtmlFromSummaryDetailId, setSelectedHtmlFromSummaryDetailId] = useState(null);
    const [selectedCaseFromLearningBlockId, setSelectedCaseFromLearningBlockId] = useState(null);
    const [selectedImageUrlFromSummaryDetailId, setSelectedImageUrlFromSummaryDetailId] = useState(null);

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

    // Auto-select first item when prompts change
    useEffect(() => {
        if (!selectedImproveDetailId && improveDetailPrompts.length > 0) {
            setSelectedImproveDetailId(improveDetailPrompts[0].id);
        } else if (selectedImproveDetailId && !improveDetailPrompts.find(p => p.id === selectedImproveDetailId)) {
            setSelectedImproveDetailId(improveDetailPrompts.length > 0 ? improveDetailPrompts[0].id : null);
        }
    }, [improveDetailPrompts, selectedImproveDetailId]);

    useEffect(() => {
        if (!selectedCreateQuizId && createQuizPrompts.length > 0) {
            setSelectedCreateQuizId(createQuizPrompts[0].id);
        } else if (selectedCreateQuizId && !createQuizPrompts.find(p => p.id === selectedCreateQuizId)) {
            setSelectedCreateQuizId(createQuizPrompts.length > 0 ? createQuizPrompts[0].id : null);
        }
    }, [createQuizPrompts, selectedCreateQuizId]);

    useEffect(() => {
        if (!selectedExcalidrawReactId && excalidrawReactPrompts.length > 0) {
            setSelectedExcalidrawReactId(excalidrawReactPrompts[0].id);
        } else if (selectedExcalidrawReactId && !excalidrawReactPrompts.find(p => p.id === selectedExcalidrawReactId)) {
            setSelectedExcalidrawReactId(excalidrawReactPrompts.length > 0 ? excalidrawReactPrompts[0].id : null);
        }
    }, [excalidrawReactPrompts, selectedExcalidrawReactId]);

    useEffect(() => {
        if (!selectedHtmlFromDetailId && htmlFromDetailPrompts.length > 0) {
            setSelectedHtmlFromDetailId(htmlFromDetailPrompts[0].id);
        } else if (selectedHtmlFromDetailId && !htmlFromDetailPrompts.find(p => p.id === selectedHtmlFromDetailId)) {
            setSelectedHtmlFromDetailId(htmlFromDetailPrompts.length > 0 ? htmlFromDetailPrompts[0].id : null);
        }
    }, [htmlFromDetailPrompts, selectedHtmlFromDetailId]);

    useEffect(() => {
        if (!selectedHtmlFromSummaryDetailId && htmlFromSummaryDetailPrompts.length > 0) {
            setSelectedHtmlFromSummaryDetailId(htmlFromSummaryDetailPrompts[0].id);
        } else if (selectedHtmlFromSummaryDetailId && !htmlFromSummaryDetailPrompts.find(p => p.id === selectedHtmlFromSummaryDetailId)) {
            setSelectedHtmlFromSummaryDetailId(htmlFromSummaryDetailPrompts.length > 0 ? htmlFromSummaryDetailPrompts[0].id : null);
        }
    }, [htmlFromSummaryDetailPrompts, selectedHtmlFromSummaryDetailId]);

    useEffect(() => {
        if (!selectedCaseFromLearningBlockId && caseFromLearningBlockPrompts.length > 0) {
            setSelectedCaseFromLearningBlockId(caseFromLearningBlockPrompts[0].id);
        } else if (selectedCaseFromLearningBlockId && !caseFromLearningBlockPrompts.find(p => p.id === selectedCaseFromLearningBlockId)) {
            setSelectedCaseFromLearningBlockId(caseFromLearningBlockPrompts.length > 0 ? caseFromLearningBlockPrompts[0].id : null);
        }
    }, [caseFromLearningBlockPrompts, selectedCaseFromLearningBlockId]);

    useEffect(() => {
        if (!selectedImageUrlFromSummaryDetailId && imageUrlFromSummaryDetailPrompts.length > 0) {
            setSelectedImageUrlFromSummaryDetailId(imageUrlFromSummaryDetailPrompts[0].id);
        } else if (selectedImageUrlFromSummaryDetailId && !imageUrlFromSummaryDetailPrompts.find(p => p.id === selectedImageUrlFromSummaryDetailId)) {
            setSelectedImageUrlFromSummaryDetailId(imageUrlFromSummaryDetailPrompts.length > 0 ? imageUrlFromSummaryDetailPrompts[0].id : null);
        }
    }, [imageUrlFromSummaryDetailPrompts, selectedImageUrlFromSummaryDetailId]);

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
        const updatedPrompts = [...improveDetailPrompts, newPrompt];
        setImproveDetailPrompts(updatedPrompts);
        setSelectedImproveDetailId(newPrompt.id);
    };

    const removeImproveDetailPrompt = (id) => {
        const updatedPrompts = improveDetailPrompts.filter(p => p.id !== id);
        setImproveDetailPrompts(updatedPrompts);
        if (selectedImproveDetailId === id) {
            setSelectedImproveDetailId(updatedPrompts.length > 0 ? updatedPrompts[0].id : null);
        }
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
        const updatedPrompts = [...createQuizPrompts, newPrompt];
        setCreateQuizPrompts(updatedPrompts);
        setSelectedCreateQuizId(newPrompt.id);
    };

    const removeCreateQuizPrompt = (id) => {
        const updatedPrompts = createQuizPrompts.filter(p => p.id !== id);
        setCreateQuizPrompts(updatedPrompts);
        if (selectedCreateQuizId === id) {
            setSelectedCreateQuizId(updatedPrompts.length > 0 ? updatedPrompts[0].id : null);
        }
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
        const updatedPrompts = [...excalidrawReactPrompts, newPrompt];
        setExcalidrawReactPrompts(updatedPrompts);
        setSelectedExcalidrawReactId(newPrompt.id);
    };

    const removeExcalidrawReactPrompt = (id) => {
        const updatedPrompts = excalidrawReactPrompts.filter(p => p.id !== id);
        setExcalidrawReactPrompts(updatedPrompts);
        if (selectedExcalidrawReactId === id) {
            setSelectedExcalidrawReactId(updatedPrompts.length > 0 ? updatedPrompts[0].id : null);
        }
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
        const updatedPrompts = [...htmlFromDetailPrompts, newPrompt];
        setHtmlFromDetailPrompts(updatedPrompts);
        setSelectedHtmlFromDetailId(newPrompt.id);
    };

    const removeHtmlFromDetailPrompt = (id) => {
        const updatedPrompts = htmlFromDetailPrompts.filter(p => p.id !== id);
        setHtmlFromDetailPrompts(updatedPrompts);
        if (selectedHtmlFromDetailId === id) {
            setSelectedHtmlFromDetailId(updatedPrompts.length > 0 ? updatedPrompts[0].id : null);
        }
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
        const updatedPrompts = [...htmlFromSummaryDetailPrompts, newPrompt];
        setHtmlFromSummaryDetailPrompts(updatedPrompts);
        setSelectedHtmlFromSummaryDetailId(newPrompt.id);
    };

    const removeHtmlFromSummaryDetailPrompt = (id) => {
        const updatedPrompts = htmlFromSummaryDetailPrompts.filter(p => p.id !== id);
        setHtmlFromSummaryDetailPrompts(updatedPrompts);
        if (selectedHtmlFromSummaryDetailId === id) {
            setSelectedHtmlFromSummaryDetailId(updatedPrompts.length > 0 ? updatedPrompts[0].id : null);
        }
    };

    const updateHtmlFromSummaryDetailPrompt = (id, field, value) => {
        setHtmlFromSummaryDetailPrompts(htmlFromSummaryDetailPrompts.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const renderImproveDetailTab = () => {
        const selectedItem = improveDetailPrompts.find(p => p.id === selectedImproveDetailId);

        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h4>Danh sách cài đặt Improve Detail</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addImproveDetailPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <Layout style={{ flex: 1, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 4, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                    <Sider 
                        width={280} 
                        style={{ 
                            background: '#fafafa', 
                            borderRight: '1px solid #f0f0f0',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            height: '100%',
                            flexShrink: 0
                        }}
                    >
                        <div style={{ padding: '8px' }}>
                            {improveDetailPrompts.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                                    Chưa có cài đặt nào
                                </div>
                            ) : (
                                improveDetailPrompts.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedImproveDetailId(item.id)}
                                        style={{
                                            padding: '12px 16px',
                                            marginBottom: '4px',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            backgroundColor: selectedImproveDetailId === item.id ? '#e6f7ff' : 'transparent',
                                            border: selectedImproveDetailId === item.id ? '1px solid #91d5ff' : '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedImproveDetailId !== item.id) {
                                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedImproveDetailId !== item.id) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <div style={{ fontWeight: selectedImproveDetailId === item.id ? 600 : 400 }}>
                                            {item.name || `Cài đặt ${item.id}`}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Sider>
                    <Content style={{ padding: '24px', overflowY: 'auto', overflowX: 'hidden', height: '100%', flex: 1, minWidth: 0 }}>
                        {selectedItem ? (
                            <Card>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0 }}>Chi tiết cài đặt</h4>
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeImproveDetailPrompt(selectedItem.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />}>
                                                Xóa
                                            </Button>
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="Tên cài đặt">
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={selectedItem.name}
                                            onChange={(e) => updateImproveDetailPrompt(selectedItem.id, 'name', e.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Prompt">
                                        <TextArea
                                            rows={8}
                                            value={selectedItem.prompt}
                                            onChange={(e) => updateImproveDetailPrompt(selectedItem.id, 'prompt', e.target.value)}
                                            placeholder="Nhập prompt..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="Model">
                                        <Select
                                            value={selectedItem.model}
                                            onChange={(value) => updateImproveDetailPrompt(selectedItem.id, 'model', value)}
                                            style={{ width: '100%' }}
                                            placeholder="Chọn model"
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
                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: '100%',
                                color: '#999'
                            }}>
                                {improveDetailPrompts.length === 0 
                                    ? 'Chưa có cài đặt nào. Hãy thêm cài đặt mới.' 
                                    : 'Chọn một cài đặt từ danh sách bên trái'}
                            </div>
                        )}
                    </Content>
                </Layout>
            </div>
        );
    };

    const renderCreateQuizTab = () => {
        const selectedItem = createQuizPrompts.find(p => p.id === selectedCreateQuizId);

        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h4>Danh sách cài đặt Create Quiz</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addCreateQuizPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <Layout style={{ flex: 1, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 4, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                    <Sider 
                        width={280} 
                        style={{ 
                            background: '#fafafa', 
                            borderRight: '1px solid #f0f0f0',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            height: '100%',
                            flexShrink: 0
                        }}
                    >
                        <div style={{ padding: '8px' }}>
                            {createQuizPrompts.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                                    Chưa có cài đặt nào
                                </div>
                            ) : (
                                createQuizPrompts.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedCreateQuizId(item.id)}
                                        style={{
                                            padding: '12px 16px',
                                            marginBottom: '4px',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            backgroundColor: selectedCreateQuizId === item.id ? '#e6f7ff' : 'transparent',
                                            border: selectedCreateQuizId === item.id ? '1px solid #91d5ff' : '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedCreateQuizId !== item.id) {
                                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedCreateQuizId !== item.id) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <div style={{ fontWeight: selectedCreateQuizId === item.id ? 600 : 400 }}>
                                            {item.name || `Cài đặt ${item.id}`}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Sider>
                    <Content style={{ padding: '24px', overflowY: 'auto', overflowX: 'hidden', height: '100%', flex: 1, minWidth: 0 }}>
                        {selectedItem ? (
                            <Card>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0 }}>Chi tiết cài đặt</h4>
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeCreateQuizPrompt(selectedItem.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />}>
                                                Xóa
                                            </Button>
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="Tên cài đặt">
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={selectedItem.name}
                                            onChange={(e) => updateCreateQuizPrompt(selectedItem.id, 'name', e.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Prompt">
                                        <TextArea
                                            rows={4}
                                            value={selectedItem.prompt}
                                            onChange={(e) => updateCreateQuizPrompt(selectedItem.id, 'prompt', e.target.value)}
                                            placeholder="Nhập prompt tạo quiz..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="Evaluation Prompt">
                                        <TextArea
                                            rows={4}
                                            value={selectedItem.evaluationPrompt}
                                            onChange={(e) => updateCreateQuizPrompt(selectedItem.id, 'evaluationPrompt', e.target.value)}
                                            placeholder="Nhập prompt đánh giá..."
                                        />
                                    </Form.Item>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <Form.Item label="Create Model" style={{ flex: 1 }}>
                                            <Select
                                                value={selectedItem.createModel}
                                                onChange={(value) => updateCreateQuizPrompt(selectedItem.id, 'createModel', value)}
                                                style={{ width: '100%' }}
                                                placeholder="Chọn model"
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
                                                value={selectedItem.evaluationModel}
                                                onChange={(value) => updateCreateQuizPrompt(selectedItem.id, 'evaluationModel', value)}
                                                style={{ width: '100%' }}
                                                placeholder="Chọn model"
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
                                                value={selectedItem.countQuiz}
                                                onChange={(e) => updateCreateQuizPrompt(selectedItem.id, 'countQuiz', parseInt(e.target.value) || 0)}
                                            />
                                        </Form.Item>
                                        <Form.Item label="Số lượng Essay" style={{ flex: 1 }}>
                                            <Input
                                                type="number"
                                                value={selectedItem.countEssay}
                                                onChange={(e) => updateCreateQuizPrompt(selectedItem.id, 'countEssay', parseInt(e.target.value) || 0)}
                                            />
                                        </Form.Item>
                                    </div>
                                </Space>
                            </Card>
                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: '100%',
                                color: '#999'
                            }}>
                                {createQuizPrompts.length === 0 
                                    ? 'Chưa có cài đặt nào. Hãy thêm cài đặt mới.' 
                                    : 'Chọn một cài đặt từ danh sách bên trái'}
                            </div>
                        )}
                    </Content>
                </Layout>
            </div>
        );
    };

    const renderExcalidrawReactTab = () => {
        const selectedItem = excalidrawReactPrompts.find(p => p.id === selectedExcalidrawReactId);

        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h4>Danh sách cài đặt Excalidraw React</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addExcalidrawReactPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <Layout style={{ flex: 1, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 4, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                    <Sider 
                        width={280} 
                        style={{ 
                            background: '#fafafa', 
                            borderRight: '1px solid #f0f0f0',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            height: '100%',
                            flexShrink: 0
                        }}
                    >
                        <div style={{ padding: '8px' }}>
                            {excalidrawReactPrompts.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                                    Chưa có cài đặt nào
                                </div>
                            ) : (
                                excalidrawReactPrompts.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedExcalidrawReactId(item.id)}
                                        style={{
                                            padding: '12px 16px',
                                            marginBottom: '4px',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            backgroundColor: selectedExcalidrawReactId === item.id ? '#e6f7ff' : 'transparent',
                                            border: selectedExcalidrawReactId === item.id ? '1px solid #91d5ff' : '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedExcalidrawReactId !== item.id) {
                                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedExcalidrawReactId !== item.id) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <div style={{ fontWeight: selectedExcalidrawReactId === item.id ? 600 : 400 }}>
                                            {item.name || `Cài đặt ${item.id}`}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Sider>
                    <Content style={{ padding: '24px', overflowY: 'auto', overflowX: 'hidden', height: '100%', flex: 1, minWidth: 0 }}>
                        {selectedItem ? (
                            <Card>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0 }}>Chi tiết cài đặt</h4>
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeExcalidrawReactPrompt(selectedItem.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />}>
                                                Xóa
                                            </Button>
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="Tên cài đặt">
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={selectedItem.name}
                                            onChange={(e) => updateExcalidrawReactPrompt(selectedItem.id, 'name', e.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI Prompt (System Message)">
                                        <TextArea
                                            rows={6}
                                            value={selectedItem.aiPrompt}
                                            onChange={(e) => updateExcalidrawReactPrompt(selectedItem.id, 'aiPrompt', e.target.value)}
                                            placeholder="Nhập prompt tạo Excalidraw JSON..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI Model">
                                        <Select
                                            value={selectedItem.aiModel}
                                            onChange={(value) => updateExcalidrawReactPrompt(selectedItem.id, 'aiModel', value)}
                                            style={{ width: '100%' }}
                                            placeholder="Chọn model"
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
                                            rows={4}
                                            value={selectedItem.notePrompt}
                                            onChange={(e) => updateExcalidrawReactPrompt(selectedItem.id, 'notePrompt', e.target.value)}
                                            placeholder="Nhập prompt tạo ghi chú..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="Note Model">
                                        <Select
                                            value={selectedItem.noteModel}
                                            onChange={(value) => updateExcalidrawReactPrompt(selectedItem.id, 'noteModel', value)}
                                            style={{ width: '100%' }}
                                            placeholder="Chọn model"
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
                                            value={selectedItem.quantity}
                                            onChange={(e) => updateExcalidrawReactPrompt(selectedItem.id, 'quantity', parseInt(e.target.value) || 1)}
                                        />
                                    </Form.Item>
                                </Space>
                            </Card>
                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: '100%',
                                color: '#999'
                            }}>
                                {excalidrawReactPrompts.length === 0 
                                    ? 'Chưa có cài đặt nào. Hãy thêm cài đặt mới.' 
                                    : 'Chọn một cài đặt từ danh sách bên trái'}
                            </div>
                        )}
                    </Content>
                </Layout>
            </div>
        );
    };

    const renderHtmlFromDetailTab = () => {
        const selectedItem = htmlFromDetailPrompts.find(p => p.id === selectedHtmlFromDetailId);

        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h4>Danh sách cài đặt HTML từ Detail</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addHtmlFromDetailPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <Layout style={{ flex: 1, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 4, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                    <Sider 
                        width={280} 
                        style={{ 
                            background: '#fafafa', 
                            borderRight: '1px solid #f0f0f0',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            height: '100%',
                            flexShrink: 0
                        }}
                    >
                        <div style={{ padding: '8px' }}>
                            {htmlFromDetailPrompts.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                                    Chưa có cài đặt nào
                                </div>
                            ) : (
                                htmlFromDetailPrompts.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedHtmlFromDetailId(item.id)}
                                        style={{
                                            padding: '12px 16px',
                                            marginBottom: '4px',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            backgroundColor: selectedHtmlFromDetailId === item.id ? '#e6f7ff' : 'transparent',
                                            border: selectedHtmlFromDetailId === item.id ? '1px solid #91d5ff' : '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedHtmlFromDetailId !== item.id) {
                                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedHtmlFromDetailId !== item.id) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <div style={{ fontWeight: selectedHtmlFromDetailId === item.id ? 600 : 400 }}>
                                            {item.name || `Cài đặt ${item.id}`}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Sider>
                    <Content style={{ padding: '24px', overflowY: 'auto', overflowX: 'hidden', height: '100%', flex: 1, minWidth: 0 }}>
                        {selectedItem ? (
                            <Card>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0 }}>Chi tiết cài đặt</h4>
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeHtmlFromDetailPrompt(selectedItem.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />}>
                                                Xóa
                                            </Button>
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="Tên cài đặt">
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={selectedItem.name}
                                            onChange={(e) => updateHtmlFromDetailPrompt(selectedItem.id, 'name', e.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI4 Prompt">
                                        <TextArea
                                            rows={8}
                                            value={selectedItem.ai4Prompt}
                                            onChange={(e) => updateHtmlFromDetailPrompt(selectedItem.id, 'ai4Prompt', e.target.value)}
                                            placeholder="Nhập prompt tạo HTML code..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI4 Model">
                                        <Select
                                            value={selectedItem.ai4Model}
                                            onChange={(value) => updateHtmlFromDetailPrompt(selectedItem.id, 'ai4Model', value)}
                                            style={{ width: '100%' }}
                                            placeholder="Chọn model"
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
                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: '100%',
                                color: '#999'
                            }}>
                                {htmlFromDetailPrompts.length === 0 
                                    ? 'Chưa có cài đặt nào. Hãy thêm cài đặt mới.' 
                                    : 'Chọn một cài đặt từ danh sách bên trái'}
                            </div>
                        )}
                    </Content>
                </Layout>
            </div>
        );
    };

    const renderHtmlFromSummaryDetailTab = () => {
        const selectedItem = htmlFromSummaryDetailPrompts.find(p => p.id === selectedHtmlFromSummaryDetailId);

        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h4>Danh sách cài đặt HTML từ SummaryDetail</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addHtmlFromSummaryDetailPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <Layout style={{ flex: 1, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 4, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                    <Sider 
                        width={280} 
                        style={{ 
                            background: '#fafafa', 
                            borderRight: '1px solid #f0f0f0',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            height: '100%',
                            flexShrink: 0
                        }}
                    >
                        <div style={{ padding: '8px' }}>
                            {htmlFromSummaryDetailPrompts.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                                    Chưa có cài đặt nào
                                </div>
                            ) : (
                                htmlFromSummaryDetailPrompts.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedHtmlFromSummaryDetailId(item.id)}
                                        style={{
                                            padding: '12px 16px',
                                            marginBottom: '4px',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            backgroundColor: selectedHtmlFromSummaryDetailId === item.id ? '#e6f7ff' : 'transparent',
                                            border: selectedHtmlFromSummaryDetailId === item.id ? '1px solid #91d5ff' : '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedHtmlFromSummaryDetailId !== item.id) {
                                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedHtmlFromSummaryDetailId !== item.id) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <div style={{ fontWeight: selectedHtmlFromSummaryDetailId === item.id ? 600 : 400 }}>
                                            {item.name || `Cài đặt ${item.id}`}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Sider>
                    <Content style={{ padding: '24px', overflowY: 'auto', overflowX: 'hidden', height: '100%', flex: 1, minWidth: 0 }}>
                        {selectedItem ? (
                            <Card>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0 }}>Chi tiết cài đặt</h4>
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeHtmlFromSummaryDetailPrompt(selectedItem.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />}>
                                                Xóa
                                            </Button>
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="Tên cài đặt">
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={selectedItem.name}
                                            onChange={(e) => updateHtmlFromSummaryDetailPrompt(selectedItem.id, 'name', e.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI Prompt">
                                        <TextArea
                                            rows={8}
                                            value={selectedItem.aiPrompt}
                                            onChange={(e) => updateHtmlFromSummaryDetailPrompt(selectedItem.id, 'aiPrompt', e.target.value)}
                                            placeholder="Nhập prompt tạo HTML code từ SummaryDetail..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI Model">
                                        <Select
                                            value={selectedItem.aiModel}
                                            onChange={(value) => updateHtmlFromSummaryDetailPrompt(selectedItem.id, 'aiModel', value)}
                                            style={{ width: '100%' }}
                                            placeholder="Chọn model"
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
                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: '100%',
                                color: '#999'
                            }}>
                                {htmlFromSummaryDetailPrompts.length === 0 
                                    ? 'Chưa có cài đặt nào. Hãy thêm cài đặt mới.' 
                                    : 'Chọn một cài đặt từ danh sách bên trái'}
                            </div>
                        )}
                    </Content>
                </Layout>
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
        const updatedPrompts = [...caseFromLearningBlockPrompts, newPrompt];
        setCaseFromLearningBlockPrompts(updatedPrompts);
        setSelectedCaseFromLearningBlockId(newPrompt.id);
    };

    const removeCaseFromLearningBlockPrompt = (id) => {
        const updatedPrompts = caseFromLearningBlockPrompts.filter(p => p.id !== id);
        setCaseFromLearningBlockPrompts(updatedPrompts);
        if (selectedCaseFromLearningBlockId === id) {
            setSelectedCaseFromLearningBlockId(updatedPrompts.length > 0 ? updatedPrompts[0].id : null);
        }
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
        const updatedPrompts = [...imageUrlFromSummaryDetailPrompts, newPrompt];
        setImageUrlFromSummaryDetailPrompts(updatedPrompts);
        setSelectedImageUrlFromSummaryDetailId(newPrompt.id);
    };

    const removeImageUrlFromSummaryDetailPrompt = (id) => {
        const updatedPrompts = imageUrlFromSummaryDetailPrompts.filter(p => p.id !== id);
        setImageUrlFromSummaryDetailPrompts(updatedPrompts);
        if (selectedImageUrlFromSummaryDetailId === id) {
            setSelectedImageUrlFromSummaryDetailId(updatedPrompts.length > 0 ? updatedPrompts[0].id : null);
        }
    };

    const updateImageUrlFromSummaryDetailPrompt = (id, field, value) => {
        setImageUrlFromSummaryDetailPrompts(imageUrlFromSummaryDetailPrompts.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const renderCaseFromLearningBlockTab = () => {
        const selectedItem = caseFromLearningBlockPrompts.find(p => p.id === selectedCaseFromLearningBlockId);

        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h4>Danh sách cài đặt tạo Case Training từ Learning Block</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addCaseFromLearningBlockPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <Layout style={{ flex: 1, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 4, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                    <Sider 
                        width={280} 
                        style={{ 
                            background: '#fafafa', 
                            borderRight: '1px solid #f0f0f0',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            height: '100%',
                            flexShrink: 0
                        }}
                    >
                        <div style={{ padding: '8px' }}>
                            {caseFromLearningBlockPrompts.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                                    Chưa có cài đặt nào
                                </div>
                            ) : (
                                caseFromLearningBlockPrompts.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedCaseFromLearningBlockId(item.id)}
                                        style={{
                                            padding: '12px 16px',
                                            marginBottom: '4px',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            backgroundColor: selectedCaseFromLearningBlockId === item.id ? '#e6f7ff' : 'transparent',
                                            border: selectedCaseFromLearningBlockId === item.id ? '1px solid #91d5ff' : '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedCaseFromLearningBlockId !== item.id) {
                                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedCaseFromLearningBlockId !== item.id) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <div style={{ fontWeight: selectedCaseFromLearningBlockId === item.id ? 600 : 400 }}>
                                            {item.name || `Cài đặt ${item.id}`}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Sider>
                    <Content style={{ padding: '24px', overflowY: 'auto', overflowX: 'hidden', height: '100%', flex: 1, minWidth: 0 }}>
                        {selectedItem ? (
                            <Card>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0 }}>Chi tiết cài đặt</h4>
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeCaseFromLearningBlockPrompt(selectedItem.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />}>
                                                Xóa
                                            </Button>
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="Tên cài đặt">
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={selectedItem.name}
                                            onChange={(e) => updateCaseFromLearningBlockPrompt(selectedItem.id, 'name', e.target.value)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI Prompt (System Message)">
                                        <TextArea
                                            rows={6}
                                            value={selectedItem.aiPrompt}
                                            onChange={(e) => updateCaseFromLearningBlockPrompt(selectedItem.id, 'aiPrompt', e.target.value)}
                                            placeholder="Nhập prompt để AI tạo Case Training từ Learning Block (JSON, có đầy đủ trường cần thiết)..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="AI Model">
                                        <Select
                                            value={selectedItem.aiModel}
                                            onChange={(value) => updateCaseFromLearningBlockPrompt(selectedItem.id, 'aiModel', value)}
                                            style={{ width: '100%' }}
                                            placeholder="Chọn model"
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
                                                value={selectedItem.quantity}
                                                onChange={(e) => updateCaseFromLearningBlockPrompt(
                                                    selectedItem.id,
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
                                                value={selectedItem.countQuiz}
                                                onChange={(e) => updateCaseFromLearningBlockPrompt(
                                                    selectedItem.id,
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
                                                value={selectedItem.countEssay}
                                                onChange={(e) => updateCaseFromLearningBlockPrompt(
                                                    selectedItem.id,
                                                    'countEssay',
                                                    Math.max(0, parseInt(e.target.value, 10) || 0)
                                                )}
                                            />
                                        </Form.Item>
                                    </div>
                                </Space>
                            </Card>
                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: '100%',
                                color: '#999'
                            }}>
                                {caseFromLearningBlockPrompts.length === 0 
                                    ? 'Chưa có cài đặt nào. Hãy thêm cài đặt mới.' 
                                    : 'Chọn một cài đặt từ danh sách bên trái'}
                            </div>
                        )}
                    </Content>
                </Layout>
            </div>
        );
    };

    const renderImageUrlFromSummaryDetailTab = () => {
        const selectedItem = imageUrlFromSummaryDetailPrompts.find(p => p.id === selectedImageUrlFromSummaryDetailId);

        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h4>Danh sách cài đặt ImageUrl từ SummaryDetail</h4>
                    <Button type="primary" icon={<PlusOutlined />} onClick={addImageUrlFromSummaryDetailPrompt}>
                        Thêm cài đặt
                    </Button>
                </div>
                <Layout style={{ flex: 1, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 4, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                    <Sider 
                        width={280} 
                        style={{ 
                            background: '#fafafa', 
                            borderRight: '1px solid #f0f0f0',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            height: '100%',
                            flexShrink: 0
                        }}
                    >
                        <div style={{ padding: '8px' }}>
                            {imageUrlFromSummaryDetailPrompts.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                                    Chưa có cài đặt nào
                                </div>
                            ) : (
                                imageUrlFromSummaryDetailPrompts.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedImageUrlFromSummaryDetailId(item.id)}
                                        style={{
                                            padding: '12px 16px',
                                            marginBottom: '4px',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            backgroundColor: selectedImageUrlFromSummaryDetailId === item.id ? '#e6f7ff' : 'transparent',
                                            border: selectedImageUrlFromSummaryDetailId === item.id ? '1px solid #91d5ff' : '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedImageUrlFromSummaryDetailId !== item.id) {
                                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedImageUrlFromSummaryDetailId !== item.id) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <div style={{ fontWeight: selectedImageUrlFromSummaryDetailId === item.id ? 600 : 400 }}>
                                            {item.name || `Cài đặt ${item.id}`}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Sider>
                    <Content style={{ padding: '24px', overflowY: 'auto', overflowX: 'hidden', height: '100%', flex: 1, minWidth: 0 }}>
                        {selectedItem ? (
                            <Card>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0 }}>Chi tiết cài đặt</h4>
                                        <Popconfirm
                                            title="Xóa cài đặt này?"
                                            onConfirm={() => removeImageUrlFromSummaryDetailPrompt(selectedItem.id)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button danger icon={<DeleteOutlined />}>
                                                Xóa
                                            </Button>
                                        </Popconfirm>
                                    </div>
                                    <Form.Item label="Tên cài đặt">
                                        <Input
                                            placeholder="Tên cài đặt"
                                            value={selectedItem.name}
                                            onChange={(e) => updateImageUrlFromSummaryDetailPrompt(selectedItem.id, 'name', e.target.value)}
                                        />
                                    </Form.Item>
                                    <Divider>Bước 1: Tạo English Description từ SummaryDetail</Divider>
                                    <Form.Item label="Description Prompt (System Message)">
                                        <TextArea
                                            rows={4}
                                            value={selectedItem.descriptionPrompt}
                                            onChange={(e) => updateImageUrlFromSummaryDetailPrompt(selectedItem.id, 'descriptionPrompt', e.target.value)}
                                            placeholder="Nhập prompt để tạo English description từ SummaryDetail..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="Description Model">
                                        <Select
                                            value={selectedItem.descriptionModel}
                                            onChange={(value) => updateImageUrlFromSummaryDetailPrompt(selectedItem.id, 'descriptionModel', value)}
                                            style={{ width: '100%' }}
                                            placeholder="Chọn model"
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
                                            rows={4}
                                            value={selectedItem.imagePrompt}
                                            onChange={(e) => updateImageUrlFromSummaryDetailPrompt(selectedItem.id, 'imagePrompt', e.target.value)}
                                            placeholder="Nhập prompt system message cho aiGen2 tạo ảnh..."
                                        />
                                    </Form.Item>
                                    <Form.Item label="Image Model">
                                        <Select
                                            value={selectedItem.imageModel}
                                            onChange={(value) => updateImageUrlFromSummaryDetailPrompt(selectedItem.id, 'imageModel', value)}
                                            style={{ width: '100%' }}
                                            placeholder="Chọn model"
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
                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: '100%',
                                color: '#999'
                            }}>
                                {imageUrlFromSummaryDetailPrompts.length === 0 
                                    ? 'Chưa có cài đặt nào. Hãy thêm cài đặt mới.' 
                                    : 'Chọn một cài đặt từ danh sách bên trái'}
                            </div>
                        )}
                    </Content>
                </Layout>
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

