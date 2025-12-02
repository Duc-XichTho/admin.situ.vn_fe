import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Card,
  Tooltip,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { BCTC } from '../../DataDemo/BCTC.js';
import { CompanyInfo } from '../../DataDemo/CompanyInfo.js';
import { CompanyEvent } from '../../DataDemo/CompanyEvent.js';
import CompanyReportPreview from '../K9Management/components/CompanyReportPreview.jsx';
import styles from './CompanyReport.module.css';

const { Option } = Select;

const CompanyReport = () => {
  const navigate = useNavigate();
  const [companyReportModalVisible, setCompanyReportModalVisible] = useState(false);
  const [selectedCompanyReport, setSelectedCompanyReport] = useState(null);
  const [companyReportForm] = Form.useForm();
  const [companyReportData, setCompanyReportData] = useState(() => {
    // Load từ localStorage nếu có, không thì dùng CompanyInfo
    const saved = localStorage.getItem('companyReportData');
    return saved ? JSON.parse(saved) : CompanyInfo;
  });
  
  // Preview states
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [previewSettings, setPreviewSettings] = useState(null);

  // Get available columns from data sources
  const getAvailableColumns = (dataSource) => {
    let data = [];
    switch (dataSource) {
      case 'BCTC':
        data = BCTC;
        break;
      case 'CompanyInfo':
        data = CompanyInfo;
        break;
      case 'CompanyEvent':
        data = CompanyEvent;
        break;
      default:
        return [];
    }
    
    if (data.length === 0) return [];
    
    // Lấy tất cả các thuộc tính từ tất cả các object
    const allKeys = new Set();
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'id') {
          allKeys.add(key);
        }
      });
    });
    
    return Array.from(allKeys);
  };

  // Handle data source change
  const handleDataSourceChange = (tableType, dataSource) => {
    const availableColumns = getAvailableColumns(dataSource);
    const firstColumn = availableColumns[0] || '';
    
    companyReportForm.setFieldsValue({
      [tableType]: {
        dataSource: dataSource,
        compareColumn: firstColumn,
        rowCount: 5
      }
    });
  };

  // Save to localStorage
  const saveToLocalStorage = (data) => {
    localStorage.setItem('companyReportData', JSON.stringify(data));
  };

  // Handle preview
  const handlePreview = (record) => {
    setPreviewRecord(record);
    setPreviewSettings(record.settings || {
      valuationTable: {
        dataSource: 'BCTC',
        compareColumn: 'Mã CK',
        rowCount: 5
      },
      financialRatioTable: {
        dataSource: 'CompanyInfo',
        compareColumn: 'Mã CK',
        rowCount: 5
      }
    });
    setPreviewModalVisible(true);
  };

  // Company Report functions
  const handleCompanyReportSettings = (record) => {
    setSelectedCompanyReport(record);
    setCompanyReportModalVisible(true);
    
    // Load existing settings or use defaults
    const settings = record.settings || {};
    companyReportForm.setFieldsValue({
      name: `Báo cáo ${record['Tên tiếng Việt']} (${record['Mã CK']})`,
      valuationTable: settings.valuationTable || {
        dataSource: 'BCTC',
        compareColumn: 'Mã CK',
        rowCount: 5
      },
      financialRatioTable: settings.financialRatioTable || {
        dataSource: 'CompanyInfo',
        compareColumn: 'Mã CK',
        rowCount: 5
      },
      industryComparisonTable: settings.industryComparisonTable || {
        dataSource: 'CompanyEvent',
        compareColumn: 'Mã CK',
        rowCount: 5
      }
    });
  };

  const handleCompanyReportSave = async () => {
    try {
      const values = await companyReportForm.validateFields();
      console.log('Company report settings:', values);
      
      if (selectedCompanyReport) {
        // Update existing report - chỉ cập nhật settings
        const updatedData = companyReportData.map(item => 
          item.id === selectedCompanyReport.id 
            ? { 
                ...item, 
                settings: {
                  valuationTable: values.valuationTable,
                  financialRatioTable: values.financialRatioTable,
                  industryComparisonTable: values.industryComparisonTable
                }
              }
            : item
        );
        setCompanyReportData(updatedData);
        saveToLocalStorage(updatedData);
        message.success('Cập nhật báo cáo doanh nghiệp thành công!');
      } else {
        // Create new report - tạo từ CompanyInfo mẫu
        const newReport = {
          ...CompanyInfo[0], // Copy thuộc tính từ CompanyInfo đầu tiên
          id: Date.now(),
          'Mã CK': 'NEW',
          'Tên tiếng Việt': 'Công ty mới',
          settings: {
            valuationTable: values.valuationTable,
            financialRatioTable: values.financialRatioTable,
            industryComparisonTable: values.industryComparisonTable
          }
        };
        const newData = [...companyReportData, newReport];
        setCompanyReportData(newData);
        saveToLocalStorage(newData);
        message.success('Thêm báo cáo doanh nghiệp mới thành công!');
      }
      
      setCompanyReportModalVisible(false);
    } catch (error) {
      console.error('Error saving company report settings:', error);
      message.error('Lưu cài đặt thất bại!');
    }
  };

  const getCompanyReportColumns = () => [
    ...getAvailableColumns('CompanyInfo').map(column => ({
      title: column,
      dataIndex: column,
      key: column,
      width: 150, // Độ rộng đều nhau cho tất cả cột
      render: (value) => {
        if (value === null || value === undefined || value === '') {
          return '-';
        }
        
        let displayValue = value;
        
        // Format số tiền nếu có chứa "đồng" hoặc "Vốn"
        if (typeof value === 'number' || (typeof value === 'string' && (value.includes('E+') || column.includes('Vốn') || column.includes('đồng')))) {
          if (typeof value === 'string' && value.includes('E+')) {
            displayValue = Number(value).toLocaleString('vi-VN');
          } else {
            displayValue = typeof value === 'number' ? value.toLocaleString('vi-VN') : value;
          }
        }
        
        // Giới hạn hiển thị 50 ký tự
        if (typeof displayValue === 'string' && displayValue.length > 50) {
          return (
            <Tooltip title={displayValue}>
              <span>{displayValue.substring(0, 50)}...</span>
            </Tooltip>
          );
        }
        
        return displayValue;
      }
    })),
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
            title="Preview"
          />
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => handleCompanyReportSettings(record)}
            title="Cài đặt"
          />
          <Popconfirm
            title="Xóa báo cáo"
            description="Bạn có chắc chắn muốn xóa báo cáo này?"
            onConfirm={() => {
              const newData = companyReportData.filter(item => item.id !== record.id);
              setCompanyReportData(newData);
              saveToLocalStorage(newData);
              message.success('Đã xóa báo cáo!');
            }}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                className={styles.backButton}
              >
                Quay lại
              </Button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedCompanyReport(null);
                  setCompanyReportModalVisible(true);
                  companyReportForm.resetFields();
                }}
              >
                Thêm báo cáo mới
              </Button>
            </div>
          </div>
        </div>

        <Table
          key="company-report-table"
          columns={getCompanyReportColumns()}
          dataSource={companyReportData}
          rowKey="id"
          pagination={{
            total: companyReportData.length,
            pageSize: 100,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} mục`
          }}
          scroll={{ x: 800 }}
          className={styles.table}
        />
      </Card>

      {/* Company Report Settings Modal */}
      <Modal
        title={selectedCompanyReport ? `Cài đặt báo cáo ${selectedCompanyReport['Tên tiếng Việt']} (${selectedCompanyReport['Mã CK']})` : "Thêm báo cáo doanh nghiệp mới"}
        open={companyReportModalVisible}
        onOk={handleCompanyReportSave}
        onCancel={() => setCompanyReportModalVisible(false)}
        width={900}
        centered={true}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form
          form={companyReportForm}
          layout="vertical"
          style={{
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '24px',
            paddingBottom: 200
          }}
        >
          <Form.Item
            name="name"
            label="Tên báo cáo"
            rules={[{ required: true, message: 'Vui lòng nhập tên báo cáo!' }]}
          >
            <Input placeholder="Nhập tên báo cáo" />
          </Form.Item>

          {/* Bảng Định giá */}
          <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
            <h4 style={{ marginBottom: '15px', color: '#1890ff' }}>📊 Bảng Định giá</h4>
            
            <Form.Item
              name={['valuationTable', 'dataSource']}
              label="Nguồn dữ liệu"
              rules={[{ required: true, message: 'Vui lòng chọn nguồn dữ liệu!' }]}
            >
              <Select 
                placeholder="Chọn nguồn dữ liệu"
                onChange={(value) => handleDataSourceChange('valuationTable', value)}
              >
                <Option value="BCTC">BCTC</Option>
                <Option value="CompanyInfo">CompanyInfo</Option>
                <Option value="CompanyEvent">CompanyEvent</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name={['valuationTable', 'compareColumn']}
              label="Cột so sánh với Mã CK"
              dependencies={[['valuationTable', 'dataSource']]}
              rules={[{ required: true, message: 'Vui lòng chọn cột so sánh!' }]}
            >
              <Select placeholder="Chọn cột so sánh">
                {(() => {
                  const dataSource = companyReportForm.getFieldValue(['valuationTable', 'dataSource']) || 'BCTC';
                  return getAvailableColumns(dataSource).map(column => (
                    <Option key={column} value={column}>{column}</Option>
                  ));
                })()}
              </Select>
            </Form.Item>

            <Form.Item
              name={['valuationTable', 'rowCount']}
              label="Số lượng dòng"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng dòng!' }]}
            >
              <Input type="number" min={1} max={100} placeholder="Nhập số lượng dòng" />
            </Form.Item>
          </div>

          {/* Bảng tỷ số tài chính */}
          <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
            <h4 style={{ marginBottom: '15px', color: '#1890ff' }}>💰 Bảng tỷ số tài chính</h4>
            
            <Form.Item
              name={['financialRatioTable', 'dataSource']}
              label="Nguồn dữ liệu"
              rules={[{ required: true, message: 'Vui lòng chọn nguồn dữ liệu!' }]}
            >
              <Select 
                placeholder="Chọn nguồn dữ liệu"
                onChange={(value) => handleDataSourceChange('financialRatioTable', value)}
              >
                <Option value="BCTC">BCTC</Option>
                <Option value="CompanyInfo">CompanyInfo</Option>
                <Option value="CompanyEvent">CompanyEvent</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name={['financialRatioTable', 'compareColumn']}
              label="Cột so sánh với Mã CK"
              dependencies={[['financialRatioTable', 'dataSource']]}
              rules={[{ required: true, message: 'Vui lòng chọn cột so sánh!' }]}
            >
              <Select placeholder="Chọn cột so sánh">
                {(() => {
                  const dataSource = companyReportForm.getFieldValue(['financialRatioTable', 'dataSource']) || 'CompanyInfo';
                  return getAvailableColumns(dataSource).map(column => (
                    <Option key={column} value={column}>{column}</Option>
                  ));
                })()}
              </Select>
            </Form.Item>

            <Form.Item
              name={['financialRatioTable', 'rowCount']}
              label="Số lượng dòng"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng dòng!' }]}
            >
              <Input type="number" min={1} max={100} placeholder="Nhập số lượng dòng" />
            </Form.Item>
          </div>

          {/* Bảng so sánh cùng ngành */}
          <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
            <h4 style={{ marginBottom: '15px', color: '#1890ff' }}>🏭 Bảng so sánh cùng ngành</h4>
            
            <Form.Item
              name={['industryComparisonTable', 'dataSource']}
              label="Nguồn dữ liệu"
              rules={[{ required: true, message: 'Vui lòng chọn nguồn dữ liệu!' }]}
            >
              <Select 
                placeholder="Chọn nguồn dữ liệu"
                onChange={(value) => handleDataSourceChange('industryComparisonTable', value)}
              >
                <Option value="BCTC">BCTC</Option>
                <Option value="CompanyInfo">CompanyInfo</Option>
                <Option value="CompanyEvent">CompanyEvent</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name={['industryComparisonTable', 'compareColumn']}
              label="Cột so sánh với Mã CK"
              dependencies={[['industryComparisonTable', 'dataSource']]}
              rules={[{ required: true, message: 'Vui lòng chọn cột so sánh!' }]}
            >
              <Select placeholder="Chọn cột so sánh">
                {(() => {
                  const dataSource = companyReportForm.getFieldValue(['industryComparisonTable', 'dataSource']) || 'CompanyEvent';
                  return getAvailableColumns(dataSource).map(column => (
                    <Option key={column} value={column}>{column}</Option>
                  ));
                })()}
              </Select>
            </Form.Item>

            <Form.Item
              name={['industryComparisonTable', 'rowCount']}
              label="Số lượng dòng"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng dòng!' }]}
            >
              <Input type="number" min={1} max={100} placeholder="Nhập số lượng dòng" />
            </Form.Item>
          </div>

          {/* Bảng danh sách công ty */}
          <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
            <h4 style={{ marginBottom: '15px', color: '#1890ff' }}>🏢 Danh sách công ty từ CompanyInfo.js</h4>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table
                dataSource={CompanyInfo}
                columns={getAvailableColumns('CompanyInfo').map(column => ({
                  title: column,
                  dataIndex: column,
                  key: column,
                  width: column.length * 8 + 50, // Tự động tính width dựa trên độ dài tên cột
                  render: (value) => {
                    if (value === null || value === undefined || value === '') {
                      return '-';
                    }
                    // Format số tiền nếu có chứa "đồng" hoặc "Vốn"
                    if (typeof value === 'number' || (typeof value === 'string' && (value.includes('E+') || column.includes('Vốn') || column.includes('đồng')))) {
                      if (typeof value === 'string' && value.includes('E+')) {
                        return Number(value).toLocaleString('vi-VN');
                      }
                      return typeof value === 'number' ? value.toLocaleString('vi-VN') : value;
                    }
                    return value;
                  }
                }))}
                pagination={false}
                size="small"
                scroll={{ x: 1200 }}
                rowKey="id"
              />
            </div>
          </div>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title="Preview Báo cáo doanh nghiệp"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={1200}
        centered={true}
        style={{ top: 20 }}
      >
        <CompanyReportPreview 
          record={previewRecord} 
          settings={previewSettings} 
        />
      </Modal>
    </div>
  );
};

export default CompanyReport; 