import { Input, Modal, Select } from 'antd';

export default function CreateSection({
    createModalVisible,
    sectionName,
    sectionType,
    setSectionName,
    setSectionType,
    handleCreateSection,
    closeModalCreateSection
}) {
    return (
        <Modal
            title='Tạo mới'
            open={createModalVisible}
            onOk={() => {
                handleCreateSection();
            }}
            onCancel={() => closeModalCreateSection()}
            okText='Lưu'
            cancelText='Hủy'
        >
            <div style={{ marginBottom: 16 }}>
                <label>Tên</label>
                <Input
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder='Nhập tên section'
                />
            </div>
            <div>
                <label>Loại</label>
                <Select
                    style={{ width: '100%' }}
                    value={sectionType}
                    onChange={(value) => setSectionType(value)}
                    placeholder='Chọn loại'
                    showSearch
                    optionFilterProp='label'
                    filterOption={(input, option) =>
                        option.label.toLowerCase().includes(input.toLowerCase())
                    }
                    options={[
                        { label: 'Văn bản', value: 'TipTapRenderer' },
                        { label: 'Kho Văn bản', value: 'ListTipTap' },
                        { label: 'Thẻ thông tin', value: 'Table' },
                        { label: 'Form', value: 'Form' },
                        { label: 'Kho File', value: 'File' },
                        { label: 'Album', value: 'Album' },
                    ]}
                />
            </div>
        </Modal>
    );
} 