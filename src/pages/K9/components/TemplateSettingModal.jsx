import React, { useContext, useEffect, useState } from 'react';
import { Button, Input, message as antdMessage, Modal, Popconfirm, Select, Space, Table } from 'antd';
import { MyContext } from '../../../MyContext';
import { createAITemplateSetting, updateAITemplateSetting, getAITemplateSettingByEmail, deleteAITemplateSetting } from '../../../apis/aiTemplateSettingService.jsx';
import { getSettingByType } from '../../../apis/settingService.jsx';

const TemplateSettingModal = ({ visible, onClose, onTemplateUpdate }) => {
  const { currentUser } = useContext(MyContext);
  const [templateList, setTemplateList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState({ visible: false, editing: null });
  const [formState, setFormState] = useState({ label: '', template: '', defaultAdvisor: '' });
  const [advisorList, setAdvisorList] = useState([]);
  const [pipelineList, setPipelineList] = useState([]);

  useEffect(() => {
    if (visible) {
      loadTemplateList();
      loadAdvisorAndPipelineList();
    }
  }, [visible, currentUser]);

  const loadTemplateList = async () => {
    setLoading(true);
    try {
      const userEmail = currentUser?.email || currentUser?.id;
      const userTemplates = await getAITemplateSettingByEmail(userEmail);

      setTemplateList(userTemplates);
    } catch {
      // Nếu lỗi, hiển thị danh sách rỗng
      setTemplateList([]);
    } finally {
      setLoading(false);
    }
  };

  // Load advisor và pipeline list
  const loadAdvisorAndPipelineList = async () => {
    try {
      const [advisorSetting, pipelineSetting] = await Promise.all([
        getSettingByType('ADVISOR_SETTING'),
        getSettingByType('AI_PIPELINE_SETTING')
      ]);

      setAdvisorList(advisorSetting?.setting || []);
      setPipelineList(pipelineSetting?.setting || []);
    } catch (error) {
      console.error('Error loading advisor/pipeline list:', error);
      setAdvisorList([]);
      setPipelineList([]);
    }
  };

  const handleAdd = () => {
    setFormState({ label: '', template: '', defaultAdvisor: '' });
    setEditModal({ visible: true, editing: null });
  };

  const handleEdit = (record) => {
    setFormState({
      label: record.label,
      template: record.template,
      defaultAdvisor: record.defaultAdvisor || ''
    });
    setEditModal({ visible: true, editing: record });
  };

  const handleCopy = (record) => {
    // Copy template - mở form thêm mới với dữ liệu đã điền sẵn
    setFormState({
      label: record.label,
      template: record.template,
      defaultAdvisor: record.defaultAdvisor || ''
    });
    setEditModal({ visible: true, editing: null }); // null = mode thêm mới
  };

  const handleDelete = async (id) => {
    // Tìm template cần xóa
    const templateToDelete = templateList.find(item => item.id === id);

    if (templateToDelete && templateToDelete.id) {
      try {
        await deleteAITemplateSetting(templateToDelete.id);
        const newList = templateList.filter(item => item.id !== id);
        setTemplateList(newList);
        antdMessage.success('Đã xóa template!');
        if (onTemplateUpdate) {
          onTemplateUpdate(newList);
        }
      } catch {
        antdMessage.error('Lỗi khi xóa template!');
      }
    }
  };

  const handleSave = async () => {
    if (!formState.label || !formState.template) {
      antdMessage.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const userEmail = currentUser?.email || currentUser?.id;

    try {
      if (editModal.editing) {
        // Edit - cập nhật template có sẵn
        if (editModal.editing.id) {
          // Template từ DB - cập nhật trực tiếp
          await updateAITemplateSetting({
            id: editModal.editing.id,
            label: formState.label,
            template: formState.template,
            defaultAdvisor: formState.defaultAdvisor || '',
            userEmail: userEmail
          });

          // Cập nhật local state
          const newList = templateList.map(item =>
            item.id === editModal.editing.id ? {
              ...item,
              ...formState,
              userEmail: userEmail
            } : item
          );
          setTemplateList(newList);

          if (onTemplateUpdate) {
            onTemplateUpdate(newList);
          }
        } else {
          // Template không có id - tạo mới
          const response = await createAITemplateSetting({
            label: formState.label,
            template: formState.template,
            defaultAdvisor: formState.defaultAdvisor || '',
            userEmail: userEmail
          });

          const newTemplateList = [...templateList, response];
          setTemplateList(newTemplateList);

          if (onTemplateUpdate) {
            onTemplateUpdate(newTemplateList);
          }
        }
      } else {
        // Add - tạo template mới
        const response = await createAITemplateSetting({
          label: formState.label,
          template: formState.template,
          defaultAdvisor: formState.defaultAdvisor || '',
          userEmail: userEmail
        });

        const newTemplateList = [...templateList, response];
        setTemplateList(newTemplateList);

        if (onTemplateUpdate) {
          onTemplateUpdate(newTemplateList);
        }
      }

      antdMessage.success('Đã lưu template!');
    } catch {
      antdMessage.error('Lỗi khi lưu template!');
    }

    setEditModal({ visible: false, editing: null });
  };

  const handleResetToDefault = async () => {
    try {
      const userEmail = currentUser?.email || currentUser?.id;

      // Lấy danh sách template hiện tại của user
      const currentUserTemplates = await getAITemplateSettingByEmail(userEmail);

      // Xóa tất cả template của user
      for (const template of currentUserTemplates) {
        if (template.id) {
          await deleteAITemplateSetting(template.id);
        }
      }

      // Reset về danh sách rỗng
      setTemplateList([]);
      antdMessage.success('Đã xóa tất cả template!');

      if (onTemplateUpdate) {
        onTemplateUpdate([]);
      }
    } catch {
      antdMessage.error('Lỗi khi xóa template!');
    }
  };

  // Lấy tên advisor từ key
  const getAdvisorName = (advisorKey) => {
    if (!advisorKey) return 'Không có';

    const advisor = advisorList.find(a => a.key === advisorKey);
    const pipeline = pipelineList.find(p => p.key === advisorKey);

    if (advisor) return advisor.name;
    if (pipeline) return `${pipeline.name} (Pipeline)`;
    return advisorKey;
  };

  const columns = [
    { title: 'Tên Template', dataIndex: 'label', width: '20%' },
    { title: 'Nội dung Template', dataIndex: 'template', width: '35%', ellipsis: true, render: val => <span title={val}>{val?.slice(0, 80)}{val && val.length > 80 ? '...' : ''}</span> },
    {
      title: 'Advisor mặc định',
      dataIndex: 'defaultAdvisor',
      width: '15%',
      render: (advisorKey) => (
        <span style={{
          color: advisorKey ? '#1890ff' : '#999',
          fontSize: '12px'
        }}>
          {getAdvisorName(advisorKey)}
        </span>
      )
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: '20%',
      render: (_, record) => {
        return (
          <Space>
            <a onClick={() => handleEdit(record)}>Sửa</a>
            <Popconfirm title="Xóa template này?" onConfirm={() => handleDelete(record.id)}>
              <a>Xóa</a>
            </Popconfirm>
          </Space>
        );
      }
    },
  ];

  return (
    <Modal
      title="Cài đặt Template"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button type="primary" onClick={handleAdd}>Thêm Template</Button>
        {/* <Button onClick={handleResetToDefault}>Khôi phục mặc định</Button> */}
      </div>
      <Table
        bordered
        dataSource={templateList.map(item => ({ ...item }))}
        columns={columns}
        rowClassName="editable-row"
        pagination={false}
        loading={loading}
        style={{ marginTop: 8 }}
      />
      {/* Modal add/edit template */}
      <Modal
        title={editModal.editing ? 'Sửa Template' : 'Thêm Template'}
        open={editModal.visible}
        onCancel={() => setEditModal({ visible: false, editing: null })}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Tên Template</div>
            <Input
              value={formState.label}
              onChange={e => setFormState(f => ({ ...f, label: e.target.value }))}
              placeholder="vd: Tóm tắt tin tức cổ phiếu"
            />
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Advisor mặc định</div>
            <Select
              value={formState.defaultAdvisor}
              onChange={value => setFormState(f => ({ ...f, defaultAdvisor: value }))}
              placeholder="Chọn advisor mặc định (tùy chọn)"
              style={{ width: '100%' }}
              allowClear
            >
              <Select.OptGroup label="Advisors">
                {advisorList.map(advisor => (
                  <Select.Option key={advisor.key} value={advisor.key}>
                    {advisor.name}
                  </Select.Option>
                ))}
              </Select.OptGroup>
              <Select.OptGroup label="Pipelines">
                {pipelineList.map(pipeline => (
                  <Select.Option key={pipeline.key} value={pipeline.key}>
                    {pipeline.name} (Pipeline)
                  </Select.Option>
                ))}
              </Select.OptGroup>
            </Select>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              Khi chọn template này, advisor sẽ được tự động chuyển sang advisor đã cài đặt
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Nội dung Template</div>
            <Input.TextArea
              rows={8}
              value={formState.template}
              onChange={e => setFormState(f => ({ ...f, template: e.target.value }))}
              placeholder="Nhập nội dung template. Sử dụng &&& để đánh dấu vị trí cần thay thế."
            />
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              Sử dụng &&& để đánh dấu vị trí cần thay thế thông tin
            </div>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default TemplateSettingModal; 