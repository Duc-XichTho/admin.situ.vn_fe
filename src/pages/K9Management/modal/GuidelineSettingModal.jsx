import { Modal, Upload, Input, Button, message, Image } from 'antd';
import { PictureOutlined, FileTextOutlined } from '@ant-design/icons';
import React, { useState, useEffect } from 'react';

const { TextArea } = Input;

export default function GuidelineSettingModal({
  visible,
  onCancel,
  onOk,
  guidelineSettings,
  setGuidelineSettings,
  guidelineImageFile,
  guidelineImageUploading,
  handleGuidelineImageUpload
}) {
  const [markdownText, setMarkdownText] = useState('');

  // Load existing settings when modal opens
  useEffect(() => {
    if (visible && guidelineSettings) {
      setMarkdownText(guidelineSettings.markdownText || '');
    }
  }, [visible, guidelineSettings]);

  const handleSave = async () => {
    console.log('🔧 GuidelineSettingModal: handleSave called');
    console.log('📝 GuidelineSettingModal: markdownText:', markdownText);
    console.log('🖼️ GuidelineSettingModal: guidelineSettings:', guidelineSettings);
    
    try {
      const updatedSettings = {
        ...guidelineSettings,
        markdownText: markdownText
      };
      
      console.log('💾 GuidelineSettingModal: Saving settings:', updatedSettings);
      await onOk(updatedSettings);
      message.success('Lưu cài đặt guideline thành công!');
    } catch (error) {
      console.error('❌ GuidelineSettingModal: Error saving settings:', error);
      message.error('Có lỗi xảy ra khi lưu cài đặt!');
    }
  };

  return (
    <Modal
      title="Cài đặt Guideline"
      open={visible}
      onOk={handleSave}
      onCancel={onCancel}
      width={600}
      centered={true}
      okText="Lưu"
      cancelText="Hủy"
    >
      <div style={{ padding: '20px 0' }}>
        {/* Image Upload Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#262626' }}>
            <PictureOutlined style={{ marginRight: '8px' }} />
            Hình ảnh Guideline
          </h4>
          
          <Upload.Dragger
            fileList={guidelineImageFile ? [guidelineImageFile] : []}
            beforeUpload={() => false}
            onChange={({ fileList }) => {
              console.log('📁 GuidelineSettingModal: File list changed:', fileList);
              if (fileList.length === 0) {
                handleGuidelineImageUpload(null);
              } else {
                const file = fileList[fileList.length - 1];
                console.log('📁 GuidelineSettingModal: Selected file:', file);
                handleGuidelineImageUpload(file);
              }
            }}
            onRemove={() => {
              console.log('🗑️ GuidelineSettingModal: Removing file');
              handleGuidelineImageUpload(null);
              return false;
            }}
            accept="image/*"
            maxCount={1}
            showUploadList={{
              showPreviewIcon: true,
              showRemoveIcon: true,
            }}
            disabled={guidelineImageUploading}
            style={{ marginBottom: '16px' }}
          >
            <p className="ant-upload-drag-icon">
              <PictureOutlined />
            </p>
            <p className="ant-upload-text">
              {guidelineImageUploading ? 'Đang upload...' : 'Upload hình ảnh guideline'}
            </p>
            <p className="ant-upload-hint">
              PNG, JPG, JPEG, GIF (Tối đa 5MB)
            </p>
          </Upload.Dragger>

          {/* Preview current image */}
          {guidelineSettings?.imageUrl && !guidelineImageFile && (
            <div style={{ marginTop: '16px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Hình ảnh hiện tại:
              </h5>
              <Image
                src={guidelineSettings.imageUrl}
                alt="Guideline Image"
                style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover' }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
              />
            </div>
          )}
        </div>

        {/* Markdown Text Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#262626' }}>
            <FileTextOutlined style={{ marginRight: '8px' }} />
            Nội dung Guideline (Markdown)
          </h4>
          
          <TextArea
            value={markdownText}
            onChange={(e) => {
              console.log('📝 GuidelineSettingModal: Markdown text changed:', e.target.value);
              setMarkdownText(e.target.value);
            }}
            placeholder="Nhập nội dung guideline bằng Markdown..."
            rows={8}
            style={{ 
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '13px'
            }}
          />
          
          <div style={{ 
            marginTop: '8px', 
            fontSize: '12px', 
            color: '#8c8c8c',
            fontStyle: 'italic'
          }}>
            Hỗ trợ Markdown: **bold**, *italic*, [link](url), ![image](url), # heading, - list, etc.
          </div>
        </div>

        {/* Status Section */}
        <div style={{
          backgroundColor: '#f6f8fa',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#586069'
        }}>
          <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#262626' }}>
            Trạng thái cài đặt:
          </h5>
          <div style={{ marginBottom: '4px' }}>
            <strong>Hình ảnh:</strong> {guidelineSettings?.imageUrl ? '✅ Đã có' : '❌ Chưa có'}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Nội dung:</strong> {markdownText ? '✅ Đã có' : '❌ Chưa có'}
          </div>
          <div>
            <strong>Độ dài nội dung:</strong> {markdownText.length} ký tự
          </div>
        </div>
      </div>
    </Modal>
  );
}
