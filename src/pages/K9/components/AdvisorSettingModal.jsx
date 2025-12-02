import React, { useEffect, useState } from 'react';
import { Modal, Table, Button, Input, Select, Space, Popconfirm, message as antdMessage, Switch } from 'antd';
import { MODEL_AI_LIST } from '../../Admin/AIGen/AI_CONST';
import { getSettingByType, createOrUpdateSetting } from '../../../apis/settingService';

const AdvisorSettingModal = ({ visible, onClose, onAdvisorUpdate }) => {
  const [advisorList, setAdvisorList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState({ visible: false, editing: null });
  const [formState, setFormState] = useState({ name: '', model: '', systemMessage: '', enableWebsearch: false });

  useEffect(() => {
    if (visible) loadAdvisorList();
  }, [visible]);

  const loadAdvisorList = async () => {
    setLoading(true);
    try {
      const setting = await getSettingByType('ADVISOR_SETTING');
      setAdvisorList(setting?.setting || []);
    } catch {
      setAdvisorList([]);
    } finally {
      setLoading(false);
    }
  };

  const saveAdvisorList = async (newList) => {
    setLoading(true);
    try {
      await createOrUpdateSetting({ type: 'ADVISOR_SETTING', setting: newList });
      setAdvisorList(newList);
      antdMessage.success('Đã lưu cấu hình Advisor!');
      if (onAdvisorUpdate) {
        onAdvisorUpdate(newList);
      }
    } catch {
      antdMessage.error('Lỗi khi lưu Advisor!');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormState({ name: '', model: '', systemMessage: '', enableWebsearch: false });
    setEditModal({ visible: true, editing: null });
  };

  const handleEdit = (record) => {
    setFormState({
      name: record.name,
      model: record.model,
      systemMessage: record.systemMessage,
      enableWebsearch: record.enableWebsearch || false
    });
    setEditModal({ visible: true, editing: record });
  };

  const handleDelete = async (key) => {
    const newList = advisorList.filter(item => item.key !== key);
    await saveAdvisorList(newList);
  };

  const handleSave = async () => {
    let newList;
    if (editModal.editing) {
      // Edit
      newList = advisorList.map(item =>
          item.key === editModal.editing.key ? { ...item, ...formState } : item
      );
    } else {
      // Add
      newList = [...advisorList, { ...formState, key: Date.now().toString() }];
    }
    await saveAdvisorList(newList);
    setEditModal({ visible: false, editing: null });
  };

  const columns = [
    { title: 'Tên Advisor', dataIndex: 'name', width: '20%' },
    { title: 'Model', dataIndex: 'model', width: '15%', render: val => MODEL_AI_LIST.find(m => m.value === val)?.name || val },
    { title: 'Websearch', dataIndex: 'enableWebsearch', width: '10%', render: val => <Switch checked={val} disabled /> },
    { title: 'System Message', dataIndex: 'systemMessage', width: '35%', ellipsis: true, render: val => <span title={val}>{val?.slice(0, 60)}{val && val.length > 60 ? '...' : ''}</span> },
    { title: 'Hành động', dataIndex: 'action', width: '20%', render: (_, record) => (
          <Space>
            <a onClick={() => handleEdit(record)}>Sửa</a>
            <Popconfirm title="Xóa advisor này?" onConfirm={() => handleDelete(record.key)}><a>Xóa</a></Popconfirm>
          </Space>
      ) },
  ];

  return (
      <Modal
          title="Cài đặt Advisor"
          open={visible}
          onCancel={onClose}
          footer={null}
          width={900}
      >
        <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>Thêm Advisor</Button>
        <Table
            bordered
            dataSource={advisorList.map(item => ({ ...item, key: item.key || item.name || Date.now().toString() }))}
            columns={columns}
            rowClassName="editable-row"
            pagination={false}
            loading={loading}
            style={{ marginTop: 8 }}
        />
        {/* Modal add/edit advisor */}
        <Modal
            title={editModal.editing ? 'Sửa Advisor' : 'Thêm Advisor'}
            open={editModal.visible}
            onCancel={() => setEditModal({ visible: false, editing: null })}
            onOk={handleSave}
            okText="Lưu"
            cancelText="Hủy"
            destroyOnClose
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>Tên Advisor</div>
              <Input value={formState.name} onChange={e => setFormState(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>Model</div>
              <Select
                  value={formState.model}
                  onChange={val => setFormState(f => ({ ...f, model: val }))}
                  options={MODEL_AI_LIST.map(m => ({ value: m.value, label: m.name }))}
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  allowClear
              />
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>Bật Websearch</div>
              <Switch
                  checked={formState.enableWebsearch}
                  onChange={val => setFormState(f => ({ ...f, enableWebsearch: val }))}
              />
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Khi bật, advisor sẽ sử dụng websearch để tìm kiếm thông tin mới nhất từ internet
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>System Message</div>
              <Input.TextArea rows={15} value={formState.systemMessage} onChange={e => setFormState(f => ({ ...f, systemMessage: e.target.value }))} />
            </div>
          </div>
        </Modal>
      </Modal>
  );
};

export default AdvisorSettingModal;
