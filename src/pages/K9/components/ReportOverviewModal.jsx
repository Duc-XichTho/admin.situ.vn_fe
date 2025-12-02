import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Space, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { createOrUpdateSetting } from '../../../apis/settingService';

const { Option } = Select;
const { TextArea } = Input;

const ReportOverviewModal = ({ visible, onCancel, onSave, currentOverview = null }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [editingTable, setEditingTable] = useState(null);
  const [tableModalVisible, setTableModalVisible] = useState(false);

  useEffect(() => {
    if (visible && currentOverview) {
      form.setFieldsValue({
        overview: currentOverview.overview || '',
      });
      setTables(currentOverview.tables || []);
    } else if (visible) {
      form.resetFields();
      setTables([]);
    }
  }, [visible, currentOverview, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const overviewData = {
        overview: values.overview,
        tables: tables
      };

      await createOrUpdateSetting({
        type: 'REPORT_OVERVIEW',
        setting: overviewData
      });

      message.success('Đã lưu cấu hình Report Overview!');
      onSave(overviewData);
    } catch (error) {
      console.error('Error saving report overview:', error);
      message.error('Lỗi khi lưu cấu hình!');
    } finally {
      setLoading(false);
    }
  };

  // Table management functions
  const handleAddTable = () => {
    const newTable = {
      id: null,
      name: '',
      type: 'quarterly',
      data: {}
    };
    setEditingTable(newTable);
    setTableModalVisible(true);
  };

  const handleEditTable = (table) => {
    setEditingTable({ ...table });
    setTableModalVisible(true);
  };

  const handleDeleteTable = (tableId) => {
    Modal.confirm({
      title: 'Xác nhận xóa bảng',
      content: 'Bạn có chắc chắn muốn xóa bảng này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setTables(prev => prev.filter(table => table.id !== tableId));
        message.success('Xóa bảng thành công!');
      }
    });
  };

  const handleSaveTable = (tableData) => {
    if (editingTable.id) {
      setTables(prev => prev.map(table =>
        table.id === editingTable.id ? { ...tableData, id: editingTable.id } : table
      ));
      message.success('Cập nhật bảng thành công!');
    } else {
      setTables(prev => [...prev, { ...tableData, id: Date.now() + Math.random() }]);
      message.success('Thêm bảng thành công!');
    }
    setTableModalVisible(false);
    setEditingTable(null);
  };

  const generateTableDataStructure = (type) => {
    switch (type) {
      case 'quarterly':
        return {
          'Q1': '',
          'Q2': '',
          'Q3': '',
          'Q4': ''
        };
      case 'monthly':
        return {
          'Tháng 1': '', 'Tháng 2': '', 'Tháng 3': '', 'Tháng 4': '',
          'Tháng 5': '', 'Tháng 6': '', 'Tháng 7': '', 'Tháng 8': '',
          'Tháng 9': '', 'Tháng 10': '', 'Tháng 11': '', 'Tháng 12': ''
        };
      case 'yearly':
        const currentYear = new Date().getFullYear();
        return {
          [`Năm ${currentYear - 2}`]: '',
          [`Năm ${currentYear - 1}`]: '',
          [`Năm ${currentYear}`]: ''
        };
      default:
        return {};
    }
  };

  return (
    <>
      <Modal
        title="Cài đặt Report Overview"
        open={visible}
        onCancel={onCancel}
        onOk={handleSave}
        width={900}
        confirmLoading={loading}
        okText="Lưu cấu hình"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tổng quan báo cáo"
            name="overview"
            rules={[{ required: true, message: 'Vui lòng nhập tổng quan!' }]}
          >
            <TextArea
              rows={6}
              placeholder="Nhập tổng quan về các báo cáo ngành, vĩ mô..."
            />
          </Form.Item>

          <Divider />

          <Form.Item label="Bảng thông số tổng quan">
            <div style={{
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              padding: '16px',
              backgroundColor: '#fafafa',
              height: '30vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <h4 style={{ margin: 0, color: '#1890ff' }}>📊 Quản lý bảng thông số tổng quan</h4>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddTable}
                >
                  Thêm bảng
                </Button>
              </div>

              {tables.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#999',
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  border: '1px dashed #d9d9d9'
                }}>
                  Chưa có bảng thông số nào. Nhấn "Thêm bảng" để tạo bảng mới.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tables.map((table, index) => (
                    <div key={table.id} style={{
                      backgroundColor: '#fff',
                      border: '1px solid #e8e8e8',
                      borderRadius: '4px',
                      padding: '12px',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            {table.name || `Bảng ${index + 1}`}
                          </span>
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            backgroundColor: '#e6f7ff',
                            borderRadius: '3px',
                            fontSize: '12px',
                            color: '#1890ff'
                          }}>
                            {table.type === 'quarterly' ? 'Theo quý' :
                             table.type === 'monthly' ? 'Theo tháng' :
                             'Theo năm'}
                          </span>
                        </div>
                        <Space>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditTable(table)}
                          />
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteTable(table.id)}
                          />
                        </Space>
                      </div>

                      {/* Preview table data */}
                      {table.data && Object.keys(table.data).length > 0 && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: table.type === 'quarterly' ? 'repeat(4, 1fr)' :
                                             table.type === 'monthly' ? 'repeat(6, 1fr)' :
                                             'repeat(3, 1fr)',
                          gap: '8px',
                          marginTop: '8px'
                        }}>
                          {Object.entries(table.data).map(([key, value]) => (
                            <div key={key} style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              backgroundColor: '#f5f5f5',
                              borderRadius: '3px',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontWeight: 'bold' }}>{key}</div>
                              <div style={{ color: '#666' }}>{value || '-'}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Table Edit Modal */}
      <Modal
        title={editingTable?.id ? "Chỉnh sửa bảng thông số" : "Thêm bảng thông số mới"}
        open={tableModalVisible}
        onCancel={() => {
          setTableModalVisible(false);
          setEditingTable(null);
        }}
        footer={null}
        width={800}
        centered={true}
        bodyStyle={{
          height: '60vh',
          overflow: 'hidden',
          padding: '0px'
        }}
      >
        {editingTable && (
          <TableEditForm
            table={editingTable}
            onSave={handleSaveTable}
            onCancel={() => {
              setTableModalVisible(false);
              setEditingTable(null);
            }}
            generateTableDataStructure={generateTableDataStructure}
          />
        )}
      </Modal>
    </>
  );
};

// TableEditForm Component
const TableEditForm = ({ table, onSave, onCancel, generateTableDataStructure }) => {
  const [form] = Form.useForm();
  const [tableData, setTableData] = useState(table.data || {});
  const [tableType, setTableType] = useState(table.type || 'quarterly');

  React.useEffect(() => {
    form.setFieldsValue({
      name: table.name || '',
      type: table.type || 'quarterly'
    });

    if (!table.data || Object.keys(table.data).length === 0) {
      const initialData = generateTableDataStructure(table.type || 'quarterly');
      setTableData(initialData);
    } else {
      setTableData(table.data);
    }
  }, [table, form, generateTableDataStructure]);

  const handleTypeChange = (newType) => {
    setTableType(newType);
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
        paddingBottom: '10px',
        maxHeight: 'calc(60vh - 80px)' // Subtract footer height
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

      {/* Fixed Footer */}
      <div style={{
        borderTop: '1px solid #e8e8e8',
        padding: '16px 20px',
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        flexShrink: 0 // Prevent footer from shrinking
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

export default ReportOverviewModal;
