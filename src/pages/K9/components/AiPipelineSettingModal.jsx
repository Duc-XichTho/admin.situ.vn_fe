import React, { useEffect, useState } from 'react';
import {
  Modal,
  Table,
  Button,
  Input,
  Select,
  Space,
  Popconfirm,
  message as antdMessage,
  Switch,
  Card,
  Row,
  Col,
  Divider,
  Typography,
  Tooltip,
  Badge
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  DragOutlined,
  RobotOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { MODEL_AI_LIST } from '../../Admin/AIGen/AI_CONST';
import { getSettingByType, createOrUpdateSetting } from '../../../apis/settingService';

const { TextArea } = Input;
const { Title, Text } = Typography;

const AiPipelineSettingModal = ({ visible, onClose, onPipelineUpdate }) => {
  const [pipelineList, setPipelineList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState({ visible: false, editing: null });
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    isPipeline: false,
    steps: []
  });

  useEffect(() => {
    if (visible) loadPipelineList();
  }, [visible]);

  const loadPipelineList = async () => {
    setLoading(true);
    try {
      const setting = await getSettingByType('AI_PIPELINE_SETTING');
      setPipelineList(setting?.setting || []);
    } catch {
      setPipelineList([]);
    } finally {
      setLoading(false);
    }
  };

  const savePipelineList = async (newList) => {
    setLoading(true);
    try {
      await createOrUpdateSetting({ type: 'AI_PIPELINE_SETTING', setting: newList });
      setPipelineList(newList);
      antdMessage.success('Đã lưu cấu hình AI Pipeline!');
      if (onPipelineUpdate) {
        onPipelineUpdate(newList);
      }
    } catch {
      antdMessage.error('Lỗi khi lưu AI Pipeline!');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormState({
      name: '',
      description: '',
      isPipeline: false,
      steps: []
    });
    setEditModal({ visible: true, editing: null });
  };

  const handleEdit = (record) => {
    setFormState({
      name: record.name,
      description: record.description || '',
      isPipeline: record.isPipeline || false,
      steps: record.steps || []
    });
    setEditModal({ visible: true, editing: record });
  };

  const handleDelete = async (key) => {
    const newList = pipelineList.filter(item => item.key !== key);
    await savePipelineList(newList);
  };

  const handleSave = async () => {
    if (!formState.name.trim()) {
      antdMessage.error('Vui lòng nhập tên pipeline!');
      return;
    }

    if (formState.isPipeline && formState.steps.length === 0) {
      antdMessage.error('Pipeline phải có ít nhất 1 bước AI!');
      return;
    }

    let newList;
    if (editModal.editing) {
      // Edit
      newList = pipelineList.map(item =>
        item.key === editModal.editing.key ? { ...item, ...formState } : item
      );
    } else {
      // Add
      newList = [...pipelineList, { ...formState, key: Date.now().toString() }];
    }
    await savePipelineList(newList);
    setEditModal({ visible: false, editing: null });
  };

  // Pipeline step management
  const addPipelineStep = () => {
    const newStep = {
      id: Date.now(),
      name: `AI Step ${formState.steps.length + 1}`,
      model: 'claude-3-5-haiku-20241022',
      systemMessage: '',
      enableWebsearch: false,
      description: ''
    };
    setFormState(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const removePipelineStep = (stepId) => {
    setFormState(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }));
  };

  const updatePipelineStep = (stepId, field, value) => {
    setFormState(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step
      )
    }));
  };

  const movePipelineStep = (stepId, direction) => {
    setFormState(prev => {
      const steps = [...prev.steps];
      const currentIndex = steps.findIndex(step => step.id === stepId);
      if (currentIndex === -1) return prev;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= steps.length) return prev;

      [steps[currentIndex], steps[newIndex]] = [steps[newIndex], steps[currentIndex]];
      return { ...prev, steps };
    });
  };

  const columns = [
    {
      title: 'Tên Pipeline',
      dataIndex: 'name',
      width: '25%',
      render: (val, record) => (
        <Space>
          <span>{val}</span>
          {record.isPipeline && (
            <Badge count="Pipeline" style={{ backgroundColor: '#52c41a' }} />
          )}
        </Space>
      )
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      width: '30%',
      ellipsis: true,
      render: val => <span title={val}>{val || '-'}</span>
    },
    {
      title: 'Loại',
      dataIndex: 'isPipeline',
      width: '15%',
      render: (val) => val ? 'Pipeline (Nhiều AI)' : 'Đơn lẻ'
    },
    {
      title: 'Số bước',
      dataIndex: 'steps',
      width: '15%',
      render: (steps, record) => {
        if (record.isPipeline) {
          return `${steps?.length || 0} bước`;
        }
        return '1 AI';
      }
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: '15%',
      render: (_, record) => (
        <Space>
          <a onClick={() => handleEdit(record)}>Sửa</a>
          <Popconfirm title="Xóa pipeline này?" onConfirm={() => handleDelete(record.key)}>
            <a>Xóa</a>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>Cài đặt AI Pipeline</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
    >
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm Pipeline
        </Button>
        <Text style={{ marginLeft: 16, color: '#666' }}>
          Tạo pipeline để nhiều AI làm việc tuần tự
        </Text>
      </div>

      <Table
        bordered
        dataSource={pipelineList.map(item => ({ ...item, key: item.key || item.name || Date.now().toString() }))}
        columns={columns}
        rowClassName="editable-row"
        pagination={false}
        loading={loading}
        style={{ marginTop: 8 }}
      />

      {/* Modal add/edit pipeline */}
      <Modal
        title={
          <Space>
            <RobotOutlined />
            <span>{editModal.editing ? 'Sửa Pipeline' : 'Thêm Pipeline'}</span>
          </Space>
        }
        open={editModal.visible}
        onCancel={() => setEditModal({ visible: false, editing: null })}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
        width={1000}
      >
        <div style={{overflowY: 'scroll', height: '60vh', paddingBottom: 60, overflowX: 'hidden' }}>
          <Row gutter={16}>
            <Col span={12}>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Tên Pipeline *</div>
                <Input
                  value={formState.name}
                  onChange={e => setFormState(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nhập tên pipeline..."
                />
              </div>
            </Col>
            <Col span={12}>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Loại Pipeline</div>
                <Switch
                  checked={formState.isPipeline}
                  onChange={val => setFormState(f => ({ ...f, isPipeline: val }))}
                  checkedChildren="Pipeline (Nhiều AI)"
                  unCheckedChildren="Đơn lẻ"
                />
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {formState.isPipeline
                    ? 'Nhiều AI sẽ chạy tuần tự, output của AI trước sẽ là input của AI sau'
                    : 'Chỉ sử dụng 1 AI duy nhất'
                  }
                </div>
              </div>
            </Col>
          </Row>

          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Mô tả</div>
            <TextArea
              rows={3}
              value={formState.description}
              onChange={e => setFormState(f => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả chức năng của pipeline..."
            />
          </div>

          {formState.isPipeline && (
            <>
              <Divider orientation="left">
                <Space>
                  <RobotOutlined />
                  <span>Các bước AI trong Pipeline</span>
                </Space>
              </Divider>

              {formState.steps.map((step, index) => (
                <Card
                  key={step.id}
                  size="small"
                  title={
                    <Space>
                      <DragOutlined style={{ color: '#999' }} />
                      <span>Bước {index + 1}: {step.name}</span>
                    </Space>
                  }
                  extra={
                    <Space>
                      {index > 0 && (
                        <Button
                          size="small"
                          onClick={() => movePipelineStep(step.id, 'up')}
                          title="Di chuyển lên"
                        >
                          ↑
                        </Button>
                      )}
                      {index < formState.steps.length - 1 && (
                        <Button
                          size="small"
                          onClick={() => movePipelineStep(step.id, 'down')}
                          title="Di chuyển xuống"
                        >
                          ↓
                        </Button>
                      )}
                      <Popconfirm
                        title="Xóa bước này?"
                        onConfirm={() => removePipelineStep(step.id)}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>Tên bước</div>
                        <Input
                          value={step.name}
                          onChange={e => updatePipelineStep(step.id, 'name', e.target.value)}
                          placeholder="Tên bước AI..."
                        />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>Model AI</div>
                        <Select
                          value={step.model}
                          onChange={val => updatePipelineStep(step.id, 'model', val)}
                          options={MODEL_AI_LIST.map(m => ({ value: m.value, label: m.name }))}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </Col>
                  </Row>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      Mô tả bước
                      <Tooltip title="Mô tả ngắn về chức năng của bước này">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                      </Tooltip>
                    </div>
                    <Input
                      value={step.description}
                      onChange={e => updatePipelineStep(step.id, 'description', e.target.value)}
                      placeholder="Mô tả chức năng của bước này..."
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      Bật Websearch
                      <Tooltip title="Khi bật, AI sẽ tìm kiếm thông tin mới nhất từ internet">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
                      </Tooltip>
                    </div>
                    <Switch
                      checked={step.enableWebsearch}
                      onChange={val => updatePipelineStep(step.id, 'enableWebsearch', val)}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>System Message</div>
                    <TextArea
                      rows={6}
                      value={step.systemMessage}
                      onChange={e => updatePipelineStep(step.id, 'systemMessage', e.target.value)}
                      placeholder="Nhập system message cho AI này..."
                    />
                  </div>
                </Card>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addPipelineStep}
                style={{ width: '30%', marginLeft: '50%', transform: 'translateX(-50%)' }}
              >
                Thêm bước AI
              </Button>
            </>
          )}

          {!formState.isPipeline && (
            <>
              <Divider orientation="left">
                <Space>
                  <RobotOutlined />
                  <span>Cấu hình AI đơn lẻ</span>
                </Space>
              </Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Model AI</div>
                    <Select
                      value={formState.model || 'claude-3-5-haiku-20241022'}
                      onChange={val => setFormState(f => ({ ...f, model: val }))}
                      options={MODEL_AI_LIST.map(m => ({ value: m.value, label: m.name }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Bật Websearch</div>
                    <Switch
                      checked={formState.enableWebsearch || false}
                      onChange={val => setFormState(f => ({ ...f, enableWebsearch: val }))}
                    />
                  </div>
                </Col>
              </Row>

              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>System Message</div>
                <TextArea
                  rows={8}
                  value={formState.systemMessage || ''}
                  onChange={e => setFormState(f => ({ ...f, systemMessage: e.target.value }))}
                  placeholder="Nhập system message cho AI..."
                />
              </div>
            </>
          )}
        </div>
      </Modal>
    </Modal>
  );
};

export default AiPipelineSettingModal;
