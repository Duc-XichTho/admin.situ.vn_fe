import React from 'react';
import { Modal, Form } from 'antd';

const CreateEditModal = ({
                             visible,
                             onOk,
                             onCancel,
                             modalMode,
                             formKey,
                             form,
                             getFormFields
                         }) => {
    return (
        <Modal
            title={modalMode === 'create' ? 'Thêm mới' : 'Chỉnh sửa'}
            open={visible}
            onOk={onOk}
            onCancel={onCancel}
            width={1200}
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
