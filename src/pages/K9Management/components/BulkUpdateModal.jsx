import React, { useState } from 'react';
import { Modal, Form, Select, message, Button, Space, Typography, Divider } from 'antd';
import { updateK9Bulk } from '../../../apis/k9Service';

const { Option } = Select;
const { Text } = Typography;

const BulkUpdateModal = ({
                           visible,
                           onClose,
                           selectedIds,
                           fieldToUpdate,
                           currentTab, // Thêm currentTab để biết đang ở tab nào
                           onSuccess,
                           categoryOptions,
                           tagOptions = [], // Options cho tag
                           levelOptions = [], // Options cho level
                           seriesOptions = [], // Options cho series
                           programOptions = [], // Options cho program
                           setUpdateCategoryLoading
                         }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);


  // Lấy options dựa trên field cần update và tab hiện tại
  const getFieldOptions = () => {
    switch (fieldToUpdate) {
      case 'category':
        return categoryOptions;
      case 'tag1':
        return tagOptions;
      case 'tag2':
        return levelOptions;
      case 'tag3':
        return seriesOptions;
      case 'tag4':
        return programOptions;
      default:
        return [];
    }
  };

  // Lấy label cho field
  const getFieldLabel = () => {
    switch (fieldToUpdate) {
      case 'category':
        return 'Danh mục';
      case 'tag1':
        return 'Tag 1';
      case 'tag2':
        return 'Level';
      case 'tag3':
        return 'Series';
      case 'tag4':
        return 'Program';
      default:
        return fieldToUpdate.charAt(0).toUpperCase() + fieldToUpdate.slice(1);
    }
  };

  // Lấy placeholder cho field
  const getFieldPlaceholder = () => {
    switch (fieldToUpdate) {
      case 'category':
        return 'Chọn danh mục...';
      case 'tag1':
        return 'Chọn tag...';
      case 'tag2':
        return 'Chọn level...';
      case 'tag3':
        return 'Chọn series...';
      case 'tag4':
        return 'Chọn program...';
      default:
        return `Chọn ${getFieldLabel()}...`;
    }
  };

  // Kiểm tra xem field có phù hợp với tab hiện tại không
  const isFieldValidForTab = () => {
    switch (currentTab) {
      case 'caseTraining':
        return ['category', 'tag1', 'tag2', 'tag3', 'tag4'].includes(fieldToUpdate);
      case 'news':
      case 'longForm':
      case 'home':
      case 'report':
      case 'reportDN':
        return ['category', 'tag4'].includes(fieldToUpdate);
      case 'story':
        return ['category', 'tag4'].includes(fieldToUpdate);
      case 'library':
        return ['category', 'tag4'].includes(fieldToUpdate);
      default:
        return ['category', 'tag4'].includes(fieldToUpdate);
    }
  };

  // Kiểm tra xem field có hỗ trợ chọn nhiều không
  const isMultipleSelection = () => {
    return fieldToUpdate === 'tag4';
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setUpdateCategoryLoading(true);

      const updateData = {
        ids: selectedIds,
        fieldToUpdate: fieldToUpdate,
        value: values[fieldToUpdate]
      };

      await updateK9Bulk(updateData);

      message.success(`Đã cập nhật thành công ${selectedIds.length} bản ghi`);
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating bulk records:', error);
      message.error('Có lỗi xảy ra khi cập nhật: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
      setUpdateCategoryLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Nếu field không hợp lệ cho tab hiện tại, hiển thị thông báo lỗi
  if (!isFieldValidForTab()) {
    return (
        <Modal
            title="Lỗi"
            open={visible}
            onCancel={onClose}
            footer={[
              <Button key="close" onClick={onClose}>
                Đóng
              </Button>
            ]}
            width={500}
        >
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Text type="danger">
              Trường <strong>{getFieldLabel()}</strong> không khả dụng cho tab <strong>{currentTab}</strong>
            </Text>
          </div>
        </Modal>
    );
  }

  return (
      <Modal
          title={`Cập nhật hàng loạt - ${getFieldLabel()}`}
          open={visible}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              Hủy
            </Button>,
            <Button
                key="submit"
                type="primary"
                loading={loading}
                onClick={handleSubmit}
                disabled={selectedIds.length === 0}
            >
              Cập nhật ({selectedIds.length} bản ghi)
            </Button>
          ]}
          width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Bạn đã chọn <Text strong>{selectedIds.length}</Text> bản ghi để cập nhật
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Tab hiện tại: <Text strong>{currentTab}</Text>
          </Text>
          {fieldToUpdate === 'tag4' && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '12px', color: '#1890ff' }}>
                  <strong>Lưu ý:</strong> Program sẽ được lưu vào trường Tag4
                </Text>
              </>
          )}
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
              label={`Chọn ${getFieldLabel()} mới`}
              name={fieldToUpdate}
              rules={[{ required: true, message: `Vui lòng chọn ${getFieldLabel()}` }]}
          >
            <Select
                placeholder={getFieldPlaceholder()}
                showSearch
                mode={isMultipleSelection() ? 'multiple' : undefined}
                maxTagCount={isMultipleSelection() ? 'responsive' : undefined}
                filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                allowClear
            >
              {getFieldOptions().map(option => (
                  <Option key={option.value} value={option.value} label={option.label}>
                    {option.label}
                  </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: 6
        }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <strong>Lưu ý:</strong> Hành động này sẽ cập nhật {selectedIds.length} bản ghi cùng lúc.
            Vui lòng kiểm tra kỹ trước khi thực hiện.
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
            <strong>Trường được cập nhật:</strong> {fieldToUpdate === 'tag4' ? 'Tag4 (Program)' : getFieldLabel()}
          </Text>
          {fieldToUpdate === 'tag4' && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                  <strong>Chế độ:</strong> Chọn nhiều giá trị
                </Text>
              </>
          )}
        </div>
      </Modal>
  );
};

export default BulkUpdateModal;
