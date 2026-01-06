import { Modal, Button, Input } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

const { TextArea } = Input;
export default function ImportDataJson({ setJsonInput, setJsonPreviewData, jsonImportModalVisible, setJsonImportModalVisible, jsonInput, jsonPreviewData, uploadingJson, currentTab, handleJsonInputChange, handleJsonPreview, handleConfirmJsonImport, handleLoadJsonTemplate }) {
  return (
    <Modal
      title="Import dữ liệu từ JSON"
      open={jsonImportModalVisible}
      onCancel={() => {
        setJsonImportModalVisible(false);
        setJsonInput('');
        setJsonPreviewData(null);
      }}
      footer={[
        <Button key="cancel" onClick={() => {
          setJsonImportModalVisible(false);
          setJsonInput('');
          setJsonPreviewData(null);
        }}>
          Hủy
        </Button>,
        <Button
          key="preview"
          onClick={handleJsonPreview}
          disabled={!jsonInput.trim()}
        >
          Xem trước
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirmJsonImport}
          disabled={!jsonPreviewData || jsonPreviewData.records.length === 0}
          loading={uploadingJson}
        >
          Import {jsonPreviewData ? `(${jsonPreviewData.validRows} bản ghi)` : ''}
        </Button>
      ]}
      width={1200}
      centered={true}
    >
      <div style={{ height: '100%', overflowY: 'auto' }}>
        <div style={{ marginBottom: '20px', }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4>📋 Format JSON yêu cầu cho {
              currentTab === 'news' ? 'Business Concept' :
                currentTab === 'caseTraining' ? 'Case Training' :
                  currentTab === 'library' ? 'Forum khởi nghiệp' :
                    'Story & Case'
            }:</h4>
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleLoadJsonTemplate}
              style={{
                backgroundColor: '#722ed1',
                borderColor: '#722ed1'
              }}
            >
              📥 Tải mẫu JSON
            </Button>
          </div>

          <div style={{
            backgroundColor: '#f6f6f6',
            padding: '15px',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '15px'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>Các trường bắt buộc:</strong> title, summary
              <br />
              {(currentTab === 'news' || currentTab === 'caseTraining') && (
                <>
                  <strong>Các trường tùy chọn:</strong> detail, category (Lý thuyết (Theory)/Khái niệm (Concept)/Nguyên tắc kinh doanh (Principle)/Khung phân tích (Framework)/Mô hình (Business model)/Phương pháp luận (Methodology)/Công cụ & kỹ thuật (Tools & Technique)/Các báo cáo ngành - vĩ mô/Best Practices/Case Studies/Tài nguyên khác),
                  source, sentiment (positive/negative/neutral), impact (important/normal), tag1, tag2, tag3, status
                </>
              )}
              {currentTab === 'library' && (
                <>
                  <strong>Các trường tùy chọn:</strong> detail, category (Ý tưởng khởi nghiệp/Tips khởi nghiệp/Sáng tạo khác), pages, status
                </>
              )}
              {currentTab === 'story' && (
                <>
                  <strong>Các trường tùy chọn:</strong> detail, category (Case study/Kinh tế - tài chính/Thế giới/Công nghệ/Đổi mới sáng tạo/Khác),
                  duration, storyType (Podcast/Video Story/Interview/Documentary), audioText, status
                </>
              )}
            </div>
          </div>

          {/* JSON Input */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Nhập JSON:</h4>
            <TextArea
              value={jsonInput}
              onChange={(e) => handleJsonInputChange(e.target.value)}
              placeholder="Nhập JSON array ở đây..."
              rows={12}
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                backgroundColor: '#fafafa'
              }}
            />
          </div>
        </div>

        {/* Preview Data */}
        {jsonPreviewData && (
          <div>
            <h4>📊 Xem trước dữ liệu ({jsonPreviewData.validRows}/{jsonPreviewData.totalRows} bản ghi hợp lệ):</h4>

            {/* Error Summary */}
            {jsonPreviewData.invalidRecords.length > 0 && (
              <div style={{
                backgroundColor: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '15px'
              }}>
                <h5 style={{ color: '#cf1322', margin: '0 0 8px 0' }}>❌ Bản ghi không hợp lệ:</h5>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {jsonPreviewData.invalidRecords.map((invalid, index) => (
                    <li key={index} style={{ fontSize: '12px', color: '#cf1322' }}>
                      Dòng {invalid.index}: {invalid.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Valid Records Table */}
            <div style={{
              maxHeight: '400px',
              overflow: 'auto',
              border: '1px solid #d9d9d9',
              borderRadius: '6px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa' }}>
                    <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                      #
                    </th>
                    <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                      Title
                    </th>
                    <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                      Summary
                    </th>
                    <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                      Category
                    </th>
                    {currentTab === 'news' && (
                      <>
                        <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                          Source
                        </th>
                        <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                          Sentiment
                        </th>
                      </>
                    )}
                    {currentTab === 'story' && (
                      <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                        Duration
                      </th>
                    )}
                    <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jsonPreviewData.records.slice(0, 10).map((record, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                        {index + 1}
                      </td>
                      <td style={{ border: '1px solid #d9d9d9', padding: '8px', maxWidth: '200px' }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {record.title}
                        </div>
                      </td>
                      <td style={{ border: '1px solid #d9d9d9', padding: '8px', maxWidth: '300px' }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {record.summary || ''}
                        </div>
                      </td>
                      <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                        {record.category || '-'}
                      </td>
                      {currentTab === 'news' && (
                        <>
                          <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                            {record.source || '-'}
                          </td>
                          <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                            {record.sentiment || '-'}
                          </td>
                        </>
                      )}
                      {currentTab === 'story' && (
                        <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                          {record.duration || '-'}
                        </td>
                      )}
                      <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                        {record.status || 'published'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {jsonPreviewData.records.length > 10 && (
                <div style={{
                  textAlign: 'center',
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  ... và {jsonPreviewData.records.length - 10} bản ghi khác
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}