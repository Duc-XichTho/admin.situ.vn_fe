import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { List, Button, Space, Typography, Tag, Avatar } from 'antd';
import {
  EyeOutlined,
  DownloadOutlined,
  ExportOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileZipOutlined,
  FileOutlined
} from '@ant-design/icons';
import PreviewFileModal from './PreviewFileModal';
import css from './FileList.module.css';

const { Text, Title } = Typography;

const FileList = ({
  fileUrls = [],
  title = "File đính kèm",
  showCount = true
}) => {
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [currentPreviewFile, setCurrentPreviewFile] = useState(null);

  // Get file info from URL
  const getFileInfo = (url) => {
    const fileName = url.split('/').pop() || 'unknown-file';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    return { fileName, fileExtension };
  };

  // Get file icon based on extension
  const getFileIcon = (extension) => {
    const iconMap = {
      pdf: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
      doc: <FileWordOutlined style={{ color: '#1890ff' }} />,
      docx: <FileWordOutlined style={{ color: '#1890ff' }} />,
      xls: <FileExcelOutlined style={{ color: '#52c41a' }} />,
      xlsx: <FileExcelOutlined style={{ color: '#52c41a' }} />,
      ppt: <FilePptOutlined style={{ color: '#fa8c16' }} />,
      pptx: <FilePptOutlined style={{ color: '#fa8c16' }} />,
      txt: <FileTextOutlined style={{ color: '#8c8c8c' }} />,
      csv: <FileTextOutlined style={{ color: '#8c8c8c' }} />,
      jpg: <FileImageOutlined style={{ color: '#722ed1' }} />,
      jpeg: <FileImageOutlined style={{ color: '#722ed1' }} />,
      png: <FileImageOutlined style={{ color: '#722ed1' }} />,
      gif: <FileImageOutlined style={{ color: '#722ed1' }} />,
      svg: <FileImageOutlined style={{ color: '#722ed1' }} />,
      webp: <FileImageOutlined style={{ color: '#722ed1' }} />,
      zip: <FileZipOutlined style={{ color: '#faad14' }} />,
      rar: <FileZipOutlined style={{ color: '#faad14' }} />,
    };
    return iconMap[extension] || <FileOutlined style={{ color: '#8c8c8c' }} />;
  };

  // Get file type tag
  const getFileTypeTag = (extension) => {
    const typeMap = {
      pdf: { color: 'red', text: 'PDF' },
      doc: { color: 'blue', text: 'Word' },
      docx: { color: 'blue', text: 'Word' },
      xls: { color: 'green', text: 'Excel' },
      xlsx: { color: 'green', text: 'Excel' },
      ppt: { color: 'orange', text: 'PowerPoint' },
      pptx: { color: 'orange', text: 'PowerPoint' },
      txt: { color: 'default', text: 'Text' },
      csv: { color: 'default', text: 'CSV' },
      jpg: { color: 'purple', text: 'Image' },
      jpeg: { color: 'purple', text: 'Image' },
      png: { color: 'purple', text: 'Image' },
      gif: { color: 'purple', text: 'Image' },
      svg: { color: 'purple', text: 'Image' },
      webp: { color: 'purple', text: 'Image' },
      zip: { color: 'gold', text: 'Archive' },
      rar: { color: 'gold', text: 'Archive' },
    };
    const type = typeMap[extension] || { color: 'default', text: extension.toUpperCase() };
    return <Tag color={type.color}>{type.text}</Tag>;
  };

  // Check if file can be previewed
  const canPreview = (extension) => {
    const previewableTypes = [
      'pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp',
      'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'
    ];
    return previewableTypes.includes(extension);
  };

  // Handle preview
  const handlePreview = (url, e) => {
    if (e) {
      e.stopPropagation();
    }
    const { fileName } = getFileInfo(url);
    setCurrentPreviewFile({ url, fileName });
    setPreviewModalOpen(true);
  };

  // Handle download
  const handleDownload = async (url, e) => {
    if (e) {
      e.stopPropagation();
    }
    const { fileName } = getFileInfo(url);
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: mở file trong tab mới
      window.open(url, '_blank');
    }
  };

  // Handle open new tab
  const handleOpenNewTab = (url, e) => {
    if (e) {
      e.stopPropagation();
    }
    window.open(url, '_blank');
  };

  if (!fileUrls || fileUrls.length === 0) {
    return (
      <div className={css.emptyState}>
        <FileOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
        <Text type="secondary">Không có file đính kèm</Text>
      </div>
    );
  }

  return (
    <div
      className={css.fileListContainer}
      onClick={(e) => e.stopPropagation()}
    >
      <List
        className={css.fileList}
        itemLayout="horizontal"
        dataSource={fileUrls}
        renderItem={(url, index) => {
          const { fileName, fileExtension } = getFileInfo(url);
          const canPreviewFile = canPreview(fileExtension);

          return (
            <List.Item
              className={css.fileItem}
              actions={[
                <Space key="actions" size="small">
                  {canPreviewFile && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={(e) => handlePreview(url, e)}
                      title="Preview file"
                    >
                    </Button>
                  )}
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={(e) => handleDownload(url, e)}
                    title="Tải xuống"
                  >
                  </Button>
                </Space>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={getFileIcon(fileExtension)}
                    style={{ backgroundColor: '#f6f6f6' }}
                  />
                }
                title={
                  <Space>
                    <Text strong className={css.fileName}>
                      {fileName}
                    </Text>
                    {getFileTypeTag(fileExtension)}
                  </Space>
                }
                description={
                  <Text type="secondary" className={css.fileUrl}>
                    {url}
                  </Text>
                }
              />
            </List.Item>
          );
        }}
      />

      {/* Preview Modal */}
      <PreviewFileModal
        open={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setCurrentPreviewFile(null);
        }}
        fileUrl={currentPreviewFile?.url}
        fileName={currentPreviewFile?.fileName}
      />
    </div>
  );
};

FileList.propTypes = {
  fileUrls: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string,
  showCount: PropTypes.bool,
};

export default FileList;
