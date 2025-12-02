import { Modal, Form, Input, Select, Button, Upload, Progress } from 'antd';
import { UploadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

export default function AISummaryEditModal({
  visible,
  onCancel,
  onOk,
  aiSummaryEditForm,
  selectedFiles,
  uploadingFiles,
  uploadProgress,
  tables,
  handleFileUpload,
  handleAddTable,
  handleEditTable,
  handleDeleteTable
}) {
  return (
    <Modal
      title="Chỉnh sửa AI Summary"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      width={900}
      centered={true}
      okText="Cập nhật"
      cancelText="Hủy"
    >
      <div style={{
        maxHeight: '70vh',
        overflowY: 'auto',
        paddingRight: '10px'
      }}>
        <Form
          form={aiSummaryEditForm}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Nhập tiêu đề..." />
          </Form.Item>

          <Form.Item
            label="URL Báo cáo"
            name="urlReport"
          >
            <Input placeholder="Nhập URL báo cáo..." />
          </Form.Item>

          <Form.Item
            label="Danh mục"
            name="category"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
          >
            <Select placeholder="Chọn danh mục...">
              <Option value="Ngành">Ngành</Option>
              <Option value="Vĩ mô">Vĩ mô</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái...">
              <Option value="draft">Nháp</Option>
              <Option value="published">Đã xuất bản</Option>
              <Option value="archived">Lưu trữ</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Tóm tắt"
            name="summary1"
            rules={[{ required: true, message: 'Vui lòng nhập tóm tắt!' }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập tóm tắt..."
            />
          </Form.Item>

          <Form.Item
            label="Chi tiết"
            name="summary2"
          >
            <TextArea
              rows={6}
              placeholder="Nhập chi tiết..."
            />
          </Form.Item>

          {/* File Upload Section */}
          <Form.Item label="File đính kèm">
            <Upload
              listType="text"
              fileList={selectedFiles}
              multiple
              beforeUpload={() => false} // Prevent auto upload
              onChange={({ fileList }) => handleFileUpload(fileList)}
              onRemove={(file) => {
                // Khi remove, filter ra file đó khỏi list
                const newFileList = selectedFiles.filter(item => item.uid !== file.uid);
                handleFileUpload(newFileList);
                return false; // Prevent default remove behavior
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
              showUploadList={{
                showPreviewIcon: true,
                showRemoveIcon: true,
              }}
              maxCount={10}
            >
              <Button icon={<UploadOutlined />} disabled={selectedFiles.length >= 10}>
                Upload Files {selectedFiles.length > 0 ? `(${selectedFiles.length}/10)` : ''}
              </Button>
            </Upload>
            {uploadingFiles && (
              <Progress
                percent={uploadProgress.files}
                size="small"
                style={{ marginTop: 10 }}
              />
            )}
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR. Tối đa 10 file.
            </div>
          </Form.Item>

          {/* Table Management Section */}
          <Form.Item label="Bảng thông số">
            <div style={{
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              padding: '16px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: 0, color: '#1890ff' }}>📊 Quản lý bảng thông số</h4>
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
                      padding: '12px'
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
                        <div>
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
                        </div>
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
      </div>
    </Modal>
  );
}
