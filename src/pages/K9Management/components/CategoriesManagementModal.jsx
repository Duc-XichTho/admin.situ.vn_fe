import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Input,
  Space,
  Popconfirm,
  message,
  Tag,
  Typography,
  Divider,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const CategoriesManagementModal = ({ visible, onClose, categoriesOptions, onSave }) => {
  const [categoriesList, setCategoriesList] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (visible) {
      setCategoriesList([...categoriesOptions]);
      // Reset editing states when modal opens
      setEditingCategory(null);
      setNewCategory('');
    }
  }, [visible, categoriesOptions]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      message.warning('Vui lòng nhập tên category!');
      return;
    }

    const categoryKey = newCategory.trim();
    const categoryLabel = newCategory.trim();

    // Check if category already exists
    if (categoriesList.some(cat => cat.key === categoryKey)) {
      message.warning('Category này đã tồn tại!');
      return;
    }

    const newCategoryItem = {
      key: categoryKey,
      label: categoryLabel
    };

    const updatedList = [...categoriesList, newCategoryItem];
    setCategoriesList(updatedList);
    setNewCategory('');
    
    // Auto save after adding
    try {
      await onSave(updatedList);
      message.success('Đã thêm category thành công!');
    } catch (error) {
      console.error('Error saving categories:', error);
      message.error('Lỗi khi lưu category!');
    }
  };

  const handleEditCategory = (record) => {
    setEditingCategory(record.key);
  };

  const handleSaveEdit = async (key, newLabel) => {
    if (!newLabel.trim()) {
      message.warning('Vui lòng nhập tên category!');
      return;
    }

    const trimmedLabel = newLabel.trim();
    
    // Check if new label already exists (except for current item)
    if (categoriesList.some(cat => cat.key !== key && cat.label === trimmedLabel)) {
      message.warning('Category này đã tồn tại!');
      return;
    }

    const updatedList = categoriesList.map(cat => 
      cat.key === key 
        ? { key: trimmedLabel, label: trimmedLabel }
        : cat
    );
    
    setCategoriesList(updatedList);
    setEditingCategory(null);
    
    // Auto save after editing
    try {
      await onSave(updatedList);
      message.success('Đã cập nhật category thành công!');
    } catch (error) {
      console.error('Error saving categories:', error);
      message.error('Lỗi khi lưu category!');
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (key) => {
    if (key === 'all') {
      message.warning('Không thể xóa category "Tất cả"!');
      return;
    }

    const updatedList = categoriesList.filter(cat => cat.key !== key);
    setCategoriesList(updatedList);
    
    // Auto save after deleting
    try {
      await onSave(updatedList);
      message.success('Đã xóa category thành công!');
    } catch (error) {
      console.error('Error saving categories:', error);
      message.error('Lỗi khi lưu category!');
    }
  };


  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (text) => (
        <Tag color="blue">{text}</Tag>
      ),
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      render: (text, record) => {
        if (editingCategory === record.key) {
          return (
            <Input
              defaultValue={text}
              data-key={record.key}
              autoFocus
            />
          );
        }
        return <Text>{text}</Text>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          {editingCategory === record.key ? (
            <>
              <Button 
                size="small" 
                type="primary"
                onClick={() => {
                  const input = document.querySelector(`input[data-key="${record.key}"]`);
                  if (input) {
                    handleSaveEdit(record.key, input.value);
                  }
                }}
              >
                Lưu
              </Button>
              <Button 
                size="small" 
                onClick={() => handleCancelEdit()}
              >
                Hủy
              </Button>
            </>
          ) : (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditCategory(record)}
                disabled={record.key === 'all'}
              />
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa category này?"
                onConfirm={() => handleDeleteCategory(record.key)}
                okText="Xóa"
                cancelText="Hủy"
                disabled={record.key === 'all'}
              >
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={record.key === 'all'}
                />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="Quản lý Categories Của Lý thuyết và Kho tài nguyên"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Nhập tên category mới"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onPressEnter={handleAddCategory}
            style={{ width: 300 }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddCategory}
          >
            Thêm
          </Button>
        </Space>
      </div>

      <Divider />

      <Table
        columns={columns}
        dataSource={categoriesList}
        rowKey="key"
        pagination={false}
        size="small"
        scroll={{ y: 400 }}
      />

      <div style={{ marginTop: 16, fontSize: '12px', color: '#999' }}>
        <Text type="secondary">
          • Key sẽ được sử dụng để lưu trữ trong database<br/>
          • Label sẽ được hiển thị cho người dùng<br/>
          • Category "Tất cả" không thể xóa hoặc chỉnh sửa
        </Text>
      </div>
    </Modal>
  );
};

export default CategoriesManagementModal;
