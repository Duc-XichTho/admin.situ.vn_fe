import React from 'react';
import { Modal, Upload, Button, Table, message } from 'antd';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Dragger } = Upload;

const ImportModal = ({
  visible,
  onCancel,
  onConfirm,
  currentTab,
  uploadingImport,
  importPreviewData,
  setImportPreviewData,
  handleImportExcel,
  handleDownloadTemplate
}) => {
  const getTemplateColumns = () => {
    if (currentTab === 'news' || currentTab === 'caseTraining') {
      return [
        { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
        { title: 'Danh mục', dataIndex: 'category', key: 'category' },
        { title: 'Tóm tắt', dataIndex: 'summary', key: 'summary' },
        { title: 'Chi tiết', dataIndex: 'detail', key: 'detail' },
        { title: 'Sentiment', dataIndex: 'sentiment', key: 'sentiment' },
        { title: 'Tầm quan trọng', dataIndex: 'impact', key: 'impact' },
        { title: 'Nguồn', dataIndex: 'source', key: 'source' },
        { title: 'Tag 1', dataIndex: 'tag1', key: 'tag1' },
        { title: 'Tag 2', dataIndex: 'tag2', key: 'tag2' },
        { title: 'Tag 3', dataIndex: 'tag3', key: 'tag3' },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status' }
      ];
    } else if (currentTab === 'library') {
      return [
        { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
        { title: 'Danh mục', dataIndex: 'category', key: 'category' },
        { title: 'Tóm tắt', dataIndex: 'summary', key: 'summary' },
        { title: 'Chi tiết', dataIndex: 'detail', key: 'detail' },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status' }
      ];
    } else if (currentTab === 'story') {
      return [
        { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
        { title: 'Danh mục', dataIndex: 'category', key: 'category' },
        { title: 'Tóm tắt', dataIndex: 'summary', key: 'summary' },
        { title: 'Chi tiết', dataIndex: 'detail', key: 'detail' },
        { title: 'Thời lượng', dataIndex: 'duration', key: 'duration' },
        { title: 'Loại', dataIndex: 'storyType', key: 'storyType' },
        { title: 'Nội dung Voice', dataIndex: 'audioText', key: 'audioText' },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status' }
      ];
    }
    return [];
  };

  const getTemplateData = () => {
    if (currentTab === 'news' || currentTab === 'caseTraining') {
      return [
        {
          title: 'Ví dụ tiêu đề tin tức',
          category: 'Lý thuyết (Theory)',
          summary: 'Tóm tắt ngắn gọn về nội dung',
          detail: 'Chi tiết đầy đủ về nội dung',
          sentiment: 'positive',
          impact: 'important',
          source: 'Nguồn tin tức',
          tag1: 'Business Strategy',
          tag2: 'Advanced',
          tag3: 'Enterprise',
          status: 'draft'
        }
      ];
    } else if (currentTab === 'library') {
      return [
        {
          title: 'Ví dụ tiêu đề thư viện',
          category: 'Ý tưởng khởi nghiệp',
          summary: 'Tóm tắt ngắn gọn về nội dung',
          detail: 'Chi tiết đầy đủ về nội dung',
          status: 'draft'
        }
      ];
    } else if (currentTab === 'story') {
      return [
        {
          title: 'Ví dụ tiêu đề story',
          category: 'Podcast',
          summary: 'Tóm tắt ngắn gọn về nội dung',
          detail: 'Chi tiết đầy đủ về nội dung',
          duration: '15 phút',
          storyType: 'Podcast',
          audioText: 'Nội dung để tạo voice',
          status: 'draft'
        }
      ];
    }
    return [];
  };

  return (
    <Modal
      title="Import Excel"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="template"
          icon={<DownloadOutlined />}
          onClick={handleDownloadTemplate}
        >
          Tải template
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={uploadingImport}
          onClick={onConfirm}
          disabled={!importPreviewData}
        >
          Xác nhận Import
        </Button>
      ]}
      width={1200}
      centered={true}
    >
      <div style={{ marginBottom: '20px' }}>
        <Dragger
          accept=".xlsx,.xls"
          beforeUpload={(file) => {
            handleImportExcel(file);
            return false;
          }}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click hoặc kéo thả file Excel vào đây</p>
          <p className="ant-upload-hint">
            Hỗ trợ: XLSX, XLS. Vui lòng tải template để xem cấu trúc file.
          </p>
        </Dragger>
      </div>

      {importPreviewData && (
        <div>
          <h4>Dữ liệu preview ({importPreviewData.length} dòng):</h4>
          <Table
            columns={getTemplateColumns()}
            dataSource={importPreviewData}
            rowKey={(record, index) => index}
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              showQuickJumper: false
            }}
            scroll={{ x: 800 }}
            size="small"
          />
        </div>
      )}
    </Modal>
  );
};

export default ImportModal; 