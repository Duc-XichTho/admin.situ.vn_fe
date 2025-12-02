import React from 'react';
import { Modal, Form, Input, Select, Upload, Progress, Button } from 'antd';
import { PlusOutlined, UploadOutlined, SoundOutlined, InboxOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const CreateEditModal = ({
  visible,
  modalMode,
  currentTab,
  selectedRecord,
  form,
  formKey,
  onOk,
  onCancel,
  // Upload states
  selectedImages,
  selectedVideo,
  selectedFiles,
  selectedAudio,
  uploadingImages,
  uploadingVideo,
  uploadingFiles,
  uploadingAudio,
  uploadProgress,
  // Upload handlers
  handleImageUpload,
  handleVideoUpload,
  handleFileUpload,
  handleAudioUpload,
  // Voice generation states
  audioText,
  setAudioText,
  voiceQueue,
  currentProcessing,
  addVoiceToQueue,
  // Form fields generator
  getFormFields
}) => {
  return (
    <Modal
      title={modalMode === 'create' ? 'Thêm mới' : 'Chỉnh sửa'}
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      width={900}
      centered={true}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form
        key={formKey}
        form={form}
        layout="vertical"
        initialValues={{ status: 'draft', audioText: '' }}
        style={{
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '24px',
          paddingBottom: 200
        }}
      >
        {getFormFields()}
      </Form>
    </Modal>
  );
};

export default CreateEditModal; 