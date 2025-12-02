import { Modal, Button, Upload } from 'antd';
import { DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';

export default function ImportDataExcel({importModalVisible , setImportPreviewData, setImportModalVisible, importPreviewData, uploadingImport, handleConfirmImport, handleDownloadTemplate, currentTab , handleImportExcel }) {

    return (
      <Modal
      title="Import dữ liệu từ Excel"
      open={importModalVisible}
      onCancel={() => {
        setImportModalVisible(false);
        setImportPreviewData(null);
      }}
      footer={[
        <Button key="cancel" onClick={() => {
          setImportModalVisible(false);
          setImportPreviewData(null);
        }}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirmImport}
          disabled={!importPreviewData || importPreviewData.records.length === 0}
          loading={uploadingImport}
        >
          Import {importPreviewData ? `(${importPreviewData.validRows} bản ghi)` : ''}
        </Button>
      ]}
      width={1000}
      centered={true}
    >
      <div style={{ marginBottom: '20px' }}>
        <h4>📋 Format Excel yêu cầu cho {
          currentTab === 'news' ? 'Business Concept' :
            currentTab === 'caseTraining' ? 'Case Training' :
            currentTab === 'library' ? 'Forum khởi nghiệp' :
              'Story & Case'
        }:</h4>
        <div style={{
          backgroundColor: '#f6f6f6',
          padding: '15px',
          borderRadius: '4px',
          fontSize: '12px',
          marginBottom: '15px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Các cột bắt buộc:</strong> Title, Summary
            <br />
            {(currentTab === 'news' || currentTab === 'caseTraining') && (
              <>
                <strong>Các cột tùy chọn:</strong> Detail, Category (Lý thuyết (Theory)/Khái niệm (Concept)/Nguyên tắc kinh doanh (Principle)/Khung phân tích (Framework)/Mô hình (Business model)/Phương pháp luận (Methodology)/Công cụ & kỹ thuật (Tools & Technique)/Các báo cáo ngành - vĩ mô/Best Practices/Case Studies/Tài nguyên khác),
                Source, Sentiment (positive/negative/neutral), Impact (important/normal)
              </>
            )}
            {currentTab === 'library' && (
              <>
                <strong>Các cột tùy chọn:</strong> Detail, Category (Ý tưởng khởi nghiệp/Tips khởi nghiệp/Sáng tạo khác), Pages
              </>
            )}
            {currentTab === 'story' && (
              <>
                <strong>Các cột tùy chọn:</strong> Detail, Category (Case study/Kinh tế - tài chính/Thế giới/Công nghệ/Đổi mới sáng tạo/Khác),
                Duration, StoryType (Podcast/Video Story/Interview/Documentary)
              </>
            )}
          </div>
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            style={{
              backgroundColor: '#52c41a',
              borderColor: '#52c41a'
            }}
          >
            📥 Tải mẫu Excel
          </Button>
        </div>

        <Upload.Dragger
          accept=".xlsx,.xls,.xlsm"
          beforeUpload={(file) => {
            handleImportExcel(file);
            return false;
          }}
          showUploadList={false}
          disabled={uploadingImport}
        >
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
          </p>
          <p className="ant-upload-text">
            {uploadingImport ? 'Đang xử lý file Excel...' : 'Click hoặc kéo thả file Excel vào đây'}
          </p>
          <p className="ant-upload-hint">
            Hỗ trợ .xlsx, .xls, .xlsm
          </p>
        </Upload.Dragger>
      </div>

      {/* Preview Data */}
      {importPreviewData && (
        <div>
          {console.log('📊 Rendering preview data:', importPreviewData)}
          <h4>📊 Xem trước dữ liệu ({importPreviewData.validRows}/{importPreviewData.totalRows} bản ghi hợp lệ):</h4>
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
                  {(currentTab === 'news' || currentTab === 'caseTraining') && (
                    <>
                      <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                        Source
                      </th>
                      <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                        Sentiment
                      </th>
                      <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                        Tag 1
                      </th>
                                               <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                           Tag 2
                         </th>
                         <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                           Tag 3
                         </th>
                       </>
                     )}
                  {currentTab === 'story' && (
                    <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'left' }}>
                      Duration
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {importPreviewData.records && importPreviewData.records.length > 0 ? importPreviewData.records.slice(0, 10).map((record, index) => (
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
                        {record.summary || record.description || ''}
                      </div>
                    </td>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                      {record.category || '-'}
                    </td>
                    {(currentTab === 'news' || currentTab === 'caseTraining') && (
                      <>
                        <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                          {record.source || '-'}
                        </td>
                        <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                          {record.sentiment || '-'}
                        </td>
                        <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                          {record.tag1 || '-'}
                        </td>
                                                 <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                           {record.tag2 || '-'}
                         </td>
                         <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                           {record.tag3 || '-'}
                         </td>
                       </>
                     )}
                    {currentTab === 'story' && (
                      <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                        {record.duration || '-'}
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={importPreviewData.headers ? importPreviewData.headers.length + 1 : 1} style={{ 
                      textAlign: 'center', 
                      padding: '20px',
                      color: '#999'
                    }}>
                      Không có dữ liệu để hiển thị
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {importPreviewData.records && importPreviewData.records.length > 10 && (
              <div style={{
                textAlign: 'center',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                fontSize: '12px',
                color: '#666'
              }}>
                ... và {importPreviewData.records.length - 10} bản ghi khác
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
    )
}