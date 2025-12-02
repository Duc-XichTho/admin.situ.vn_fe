import {Input, Button, Modal, message, Select, Switch, List, Card, Space, Divider, Typography, Tabs} from 'antd';
import {useState, useEffect} from 'react';
import {MODEL_AI_LIST, MODEL_IMG_AI_LIST, MODEL_AUDIO_AI_LIST} from "./AI_CONST.js";
import {PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined} from '@ant-design/icons';
import {
    getAllAiGenConfigList,
    createAiGenConfigList,
    updateAiGenConfigList,
    deleteAiGenConfigList
} from '../../../apis/aiGen/aiGenConfigListService.jsx';

const {Title, Text} = Typography;
const {TabPane} = Tabs;

export default function AIGenForm({
                                      isOpen,
                                      onClose,
                                      onAnalyze,
                                      onConfigListChange
                                  }) {
    // State cho danh sách cấu hình
    const [configList, setConfigList] = useState([]);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // State cho modal thêm mới
    const [addConfigModal, setAddConfigModal] = useState(false);
    const [newConfigName, setNewConfigName] = useState('');

    // State cho cấu hình hiện tại (5 AI configs)
    const [currentConfig, setCurrentConfig] = useState({
        name: '',
        layout: 'slide',
        aiConfigs: [
            {
                name: 'AI1 (Text Gen AI)',
                systemMessage: '',
                model: MODEL_AI_LIST[0].value,
                isUse: true,
                useUserPrompt: false,
                sendDirectToOutput: false
            },
            {
                name: 'AI2 (Text Gen AI)',
                systemMessage: '',
                model: MODEL_AI_LIST[0].value,
                isUse: true,
                useUserPrompt: false
            },
            {
                name: 'AI3 (Text Output AI)',
                systemMessage: '',
                model: MODEL_AI_LIST[0].value,
                isUse: true,
                useUserPrompt: false
            },
            {
                name: 'AI4 (Image Output AI)',
                systemMessage: '',
                model: MODEL_IMG_AI_LIST[0].value,
                isUse: true,
                useUserPrompt: false
            },
            {
                name: 'AI5 (Voice AI)',
                systemMessage: '',
                model: MODEL_AUDIO_AI_LIST[0].value,
                isUse: true,
                useUserPrompt: false
            }
        ]
    });

    useEffect(() => {
        if (isOpen) {
            loadConfigList();
        }
    }, [isOpen]);

    const loadConfigList = async () => {
        try {
            setLoading(true);
            const data = await getAllAiGenConfigList();
            setConfigList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading config list:', error);
            message.error('Lỗi khi tải danh sách cấu hình');
            setConfigList([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNewConfig = () => {
        setAddConfigModal(true);
    };

    const handleCreateConfig = async () => {
        if (!newConfigName.trim()) {
            message.error('Vui lòng nhập tên cấu hình');
            return;
        }

        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('currentUser'));
            const configData = {
                name: newConfigName,
                layout: currentConfig.layout,
                aiConfigs: currentConfig.aiConfigs,
                created_at: new Date().toISOString(),
                user_create: user?.email || '',
                show: true
            };

            const result = await createAiGenConfigList(configData);
            if (result.success) {
                message.success('Đã tạo cấu hình mới');
                await loadConfigList(); // Reload danh sách
                onConfigListChange();
                setAddConfigModal(false);
                setNewConfigName('');
            } else {
                message.error('Lỗi khi tạo cấu hình');
            }
        } catch (error) {
            console.error('Error creating config:', error);
            message.error('Lỗi khi tạo cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectConfig = (config) => {
        setSelectedConfig(config);
        setCurrentConfig(config);
        setIsEditing(false);
    };

    const handleEditConfig = () => {
        setIsEditing(true);
    };

    const handleSaveConfig = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('currentUser'));
            const configData = {
                id: selectedConfig.id,
                name: currentConfig.name,
                layout: currentConfig.layout,
                aiConfigs: currentConfig.aiConfigs,
                created_at: selectedConfig.created_at,
                user_create: user?.email || '',
                show: true
            };

            const result = await updateAiGenConfigList(configData);
            if (result.success) {
                message.success('Đã lưu cấu hình');
                await loadConfigList(); // Reload danh sách
                onConfigListChange();
                setIsEditing(false);
            } else {
                message.error('Lỗi khi lưu cấu hình');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            message.error('Lỗi khi lưu cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfig = async (configId) => {
        try {
            setLoading(true);
            const result = await deleteAiGenConfigList(configId);
            if (result.success) {
                message.success('Đã xóa cấu hình');
                await loadConfigList(); // Reload danh sách
                onConfigListChange();

                if (selectedConfig && selectedConfig.id === configId) {
                    setSelectedConfig(null);
                    setCurrentConfig({
                        name: '',
                        layout: 'article',
                        aiConfigs: currentConfig.aiConfigs.map(config => {
                            let defaultModel = MODEL_AI_LIST[0].value;
                            if (config.name.includes('AI4')) {
                                defaultModel = MODEL_IMG_AI_LIST[0].value;
                            } else if (config.name.includes('AI5')) {
                                defaultModel = MODEL_AUDIO_AI_LIST[0].value;
                            }

                            return {
                                ...config,
                                systemMessage: '',
                                model: defaultModel,
                                isUse: true,
                                useUserPrompt: false,
                                sendDirectToOutput: config.name === 'AI1 (Text Gen AI)' ? false : undefined
                            };
                        })
                    });
                    setIsEditing(false);
                }
            } else {
                message.error('Lỗi khi xóa cấu hình');
            }
        } catch (error) {
            console.error('Error deleting config:', error);
            message.error('Lỗi khi xóa cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const updateAiConfig = (index, field, value) => {
        const newAiConfigs = [...currentConfig.aiConfigs];
        newAiConfigs[index] = {...newAiConfigs[index], [field]: value};
        setCurrentConfig({...currentConfig, aiConfigs: newAiConfigs});
    };

    // Helper function to get the appropriate model list based on AI type
    const getModelListForAI = (aiName) => {
        if (aiName.includes('AI4')) {
            return MODEL_IMG_AI_LIST;
        } else if (aiName.includes('AI5')) {
            return MODEL_AUDIO_AI_LIST;
        } else {
            return MODEL_AI_LIST;
        }
    };

    const handleAnalyzeClick = () => {
        if (!selectedConfig) {
            message.error('Vui lòng chọn một cấu hình để phân tích');
            return;
        }
        onAnalyze(selectedConfig);
        onClose();
    };

    return (
        <Modal
            title="Quản lý cấu hình AI"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={'95vw'}
            height={'90vh'}
            centered
            style={{top: 20}}
        >
            <div style={{display: 'flex', gap: 20, height: '95%'}}>
                {/* Nửa trái - Danh sách cấu hình */}
                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                    <div style={{marginBottom: 16}}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            onClick={handleAddNewConfig}
                            style={{width: '100%'}}
                            loading={loading}
                        >
                            Thêm cấu hình mới
                        </Button>
                    </div>

                    <div style={{flex: 1, overflowY: 'auto'}}>
                        <List
                            loading={loading}
                            dataSource={configList}
                            renderItem={(config) => (
                                <Card
                                    size="small"
                                    style={{
                                        marginBottom: 8,
                                        cursor: 'pointer',
                                        border: selectedConfig?.id === config.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                    }}
                                    onClick={() => handleSelectConfig(config)}
                                >
                                    <List.Item style={{padding: 0}}>
                                        <List.Item.Meta
                                            title={
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span>{config.name}</span>
                                                    <div style={{display: 'flex', gap: 8}}>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            icon={<EditOutlined/>}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelectConfig(config);
                                                                handleEditConfig();
                                                            }}
                                                        />
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            icon={<DeleteOutlined/>}
                                                            style={{color: '#ff4d4f'}}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteConfig(config.id);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            }
                                            description={`${config.aiConfigs.filter(ai => ai.isUse).length}/5 AI đang hoạt động`}
                                        />
                                    </List.Item>
                                </Card>
                            )}
                        />
                    </div>
                </div>

                <Divider type="vertical" style={{height: '100%'}}/>

                {/* Nửa phải - Form cấu hình chi tiết */}
                <div style={{flex: 3, display: 'flex', flexDirection: 'column'}}>
                    {selectedConfig ? (
                        <>
                            <div style={{
                                marginBottom: 16,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                                    <Title level={4} style={{margin: 0}}>
                                        {isEditing ? 'Chỉnh sửa cấu hình' : 'Xem cấu hình'}: {selectedConfig.name}
                                    </Title>
                                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                        <Text strong>Layout:</Text>
                                        <Select
                                            style={{width: 120}}
                                            value={currentConfig.layout}
                                            onChange={(value) => setCurrentConfig({...currentConfig, layout: value})}
                                            disabled={!isEditing}
                                            options={[
                                                {value: 'article', label: 'Article'},
                                                {value: 'slide', label: 'Slide'}
                                            ]}
                                        />
                                    </div>
                                </div>
                                <Space>
                                    {isEditing ? (
                                        <>
                                            <Button onClick={() => setIsEditing(false)} disabled={loading}>
                                                Hủy
                                            </Button>
                                            <Button
                                                type="primary"
                                                icon={<SaveOutlined/>}
                                                onClick={handleSaveConfig}
                                                loading={loading}
                                            >
                                                Lưu
                                            </Button>
                                        </>
                                    ) : (
                                        <Button type="primary" icon={<EditOutlined/>} onClick={handleEditConfig}>
                                            Chỉnh sửa
                                        </Button>
                                    )}
                                </Space>
                            </div>

                            <div style={{flex: 1, overflowY: 'auto'}}>
                                <Tabs defaultActiveKey="0" type="card">
                                    {currentConfig.aiConfigs.map((aiConfig, index) => (
                                        <TabPane
                                            tab={`${aiConfig.name} ${aiConfig.isUse ? '✅' : '❌'}`}
                                            key={index}
                                        >
                                            <div style={{marginTop: 16}}>
                                                <div style={{display: 'flex', gap: 16, height: 500}}>
                                                    {/* Cột trái - System Message (75%) */}
                                                    <div style={{flex: 3}}>
                                                        <Text strong>System Message:</Text>
                                                        <Input.TextArea
                                                            value={aiConfig.systemMessage}
                                                            onChange={(e) => updateAiConfig(index, 'systemMessage', e.target.value)}
                                                            style={{marginTop: 8, height: 'calc(100% - 30px)'}}
                                                            placeholder={`Nhập system message cho ${aiConfig.name}`}
                                                            disabled={!isEditing}
                                                        />
                                                    </div>

                                                    {/* Cột phải - Model và Switch (25%) */}
                                                    <div style={{flex: 1}}>
                                                        <Space direction="vertical" style={{width: '100%'}}>

                                                            <div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 8,
                                                                    marginBottom: 8,
                                                                }}>
                                                                    <Text strong>Sử dụng:</Text>
                                                                    <Switch
                                                                        checked={aiConfig.isUse}
                                                                        onChange={(checked) => updateAiConfig(index, 'isUse', checked)}
                                                                        disabled={!isEditing}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 8,
                                                                    marginBottom: 8,
                                                                }}>
                                                                    <Text strong>Truyền prompt người dùng:</Text>
                                                                    <Switch
                                                                        checked={aiConfig.useUserPrompt || false}
                                                                        onChange={(checked) => updateAiConfig(index, 'useUserPrompt', checked)}
                                                                        disabled={!isEditing}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {index === 0 && (
                                                                <div>
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 8,
                                                                        marginBottom: 8,
                                                                    }}>
                                                                        <Text strong>Gửi thẳng cho output:</Text>
                                                                        <Switch
                                                                            checked={aiConfig.sendDirectToOutput || false}
                                                                            onChange={(checked) => updateAiConfig(index, 'sendDirectToOutput', checked)}
                                                                            disabled={!isEditing}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div>
                                                                <Text strong>Model:</Text>
                                                                <Select
                                                                    style={{width: '100%', marginTop: 8}}
                                                                    value={aiConfig.model}
                                                                    onChange={(value) => updateAiConfig(index, 'model', value)}
                                                                    options={getModelListForAI(aiConfig.name)}
                                                                    disabled={!isEditing}
                                                                />
                                                            </div>
                                                        </Space>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabPane>
                                    ))}
                                </Tabs>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            color: '#999'
                        }}>
                            <Text>Vui lòng chọn một cấu hình từ danh sách bên trái</Text>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal thêm cấu hình mới */}
            <Modal
                title="Thêm cấu hình mới"
                open={addConfigModal}
                onCancel={() => {
                    setAddConfigModal(false);
                    setNewConfigName('');
                }}
                onOk={handleCreateConfig}
                okText="Tạo"
                cancelText="Hủy"
                confirmLoading={loading}
            >
                <Input
                    placeholder="Nhập tên cấu hình..."
                    value={newConfigName}
                    onChange={(e) => setNewConfigName(e.target.value)}
                    onPressEnter={handleCreateConfig}
                />
            </Modal>
        </Modal>
    );
}
