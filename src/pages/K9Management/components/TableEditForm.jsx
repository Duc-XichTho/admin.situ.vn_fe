import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button } from 'antd';

const { Option } = Select;

const TableEditForm = ({ table, onSave, onCancel, generateTableDataStructure }) => {
  const [form] = Form.useForm();
  const [tableData, setTableData] = useState(table.data || {});
  const [tableType, setTableType] = useState(table.type || 'quarterly');

  useEffect(() => {
    form.setFieldsValue({
      name: table.name || '',
      type: table.type || 'quarterly'
    });

    // Initialize table data if empty
    if (!table.data || Object.keys(table.data).length === 0) {
      const initialData = generateTableDataStructure(table.type || 'quarterly');
      setTableData(initialData);
    } else {
      setTableData(table.data);
    }
  }, [table, form, generateTableDataStructure]);

  const handleTypeChange = (newType) => {
    setTableType(newType);
    // Generate new data structure when type changes
    const newData = generateTableDataStructure(newType);
    setTableData(newData);
  };

  const handleDataChange = (key, value) => {
    setTableData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const saveData = {
        name: values.name,
        type: values.type,
        data: tableData
      };
      onSave(saveData);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        paddingBottom: '10px'
      }}>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên bảng"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên bảng!' }]}
          >
            <Input placeholder="Ví dụ: GDP, CPI, Lãi suất..." />
          </Form.Item>

          <Form.Item
            label="Loại bảng"
            name="type"
            rules={[{ required: true, message: 'Vui lòng chọn loại bảng!' }]}
          >
            <Select onChange={handleTypeChange}>
              <Option value="quarterly">Theo quý (4 quý)</Option>
              <Option value="monthly">Theo tháng (12 tháng)</Option>
              <Option value="yearly">Theo năm (3 năm)</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Dữ liệu">
            <div style={{
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              padding: '16px',
              backgroundColor: '#fafafa'
            }}>
              <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>
                📊 Điền dữ liệu cho bảng {
                  tableType === 'quarterly' ? 'theo quý' :
                  tableType === 'monthly' ? 'theo tháng' :
                  'theo năm'
                }
              </h4>

              <div style={{
                display: 'grid',
                gridTemplateColumns:
                  tableType === 'quarterly' ? 'repeat(2, 1fr)' :
                  tableType === 'monthly' ? 'repeat(3, 1fr)' :
                  'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {Object.entries(tableData).map(([key, value]) => (
                  <div key={key} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <label style={{
                      fontWeight: 'bold',
                      fontSize: '12px',
                      color: '#262626'
                    }}>
                      {key}
                    </label>
                    <Input
                      value={value}
                      onChange={(e) => handleDataChange(key, e.target.value)}
                      placeholder="Nhập số liệu..."
                      size="small"
                    />
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div>
                <h5 style={{ marginBottom: '8px', color: '#666' }}>👁️ Xem trước:</h5>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns:
                    tableType === 'quarterly' ? 'repeat(4, 1fr)' :
                    tableType === 'monthly' ? 'repeat(6, 1fr)' :
                    'repeat(3, 1fr)',
                  gap: '8px',
                  backgroundColor: '#fff',
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid #e8e8e8'
                }}>
                  {Object.entries(tableData).map(([key, value]) => (
                    <div key={key} style={{
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '3px'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{key}</div>
                      <div style={{ fontSize: '14px', color: '#1890ff' }}>
                        {value || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Form.Item>
        </Form>
      </div>

      {/* Fixed Footer with Action Buttons */}
      <div style={{
        borderTop: '1px solid #e8e8e8',
        padding: '16px 20px',
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px'
      }}>
        <Button onClick={onCancel}>
          Hủy
        </Button>
        <Button type="primary" onClick={handleSave}>
          Lưu bảng
        </Button>
      </div>
    </div>
  );
};

export default TableEditForm; 