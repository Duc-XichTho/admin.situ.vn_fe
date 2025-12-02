import { Modal, Button } from 'antd';

export default function AISummaryDetailModal({
  visible,
  onCancel,
  selectedAISummary
}) {
  return (
    <Modal
      title="Chi tiết AI Summary"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>
      ]}
      width={800}
      centered={true}
    >
      {selectedAISummary && (
        <div style={{ maxHeight: 600, overflowY: 'auto', fontSize: 15 }}>
          <div><b>ID:</b> {selectedAISummary.id}</div>
          <div><b>Title:</b> {(() => {
            try {
              const info = typeof selectedAISummary.info === 'string' ? JSON.parse(selectedAISummary.info) : selectedAISummary.info;
              return info?.title || '-';
            } catch {
              return '-';
            }
          })()}</div>
          <div><b>URLReport:</b> {(() => {
            try {
              const info = typeof selectedAISummary.info === 'string' ? JSON.parse(selectedAISummary.info) : selectedAISummary.info;
              return info?.URLReport ? <a href={info.URLReport} target="_blank" rel="noopener noreferrer">{info.URLReport}</a> : '-';
            } catch {
              return '-';
            }
          })()}</div>
          <div style={{ margin: '12px 0' }}><b>Summary:</b><br />
            <div style={{ background: '#f6f8fa', padding: 10, borderRadius: 6, whiteSpace: 'pre-wrap' }}>{selectedAISummary.summary1 || '-'}</div>
          </div>
          <div style={{ margin: '12px 0' }}><b>Detail:</b><br />
            <div style={{ background: '#f6f8fa', padding: 10, borderRadius: 6, whiteSpace: 'pre-wrap' }}>{selectedAISummary.summary2 || '-'}</div>
          </div>

          {/* Display Files */}
          {selectedAISummary.fileUrls && Array.isArray(selectedAISummary.fileUrls) && selectedAISummary.fileUrls.length > 0 && (
            <div style={{ margin: '12px 0' }}>
              <b>📎 File đính kèm:</b><br />
              <div style={{ marginTop: '8px' }}>
                {selectedAISummary.fileUrls.map((url, index) => {
                  const fileName = url.split('/').pop() || `file-${index + 1}`;
                  return (
                    <div key={index} style={{
                      background: '#f6f8fa',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      border: '1px solid #e1e4e8'
                    }}>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                        📄 {fileName}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Display Tables */}
          {selectedAISummary.tables && (() => {
            try {
              const tables = typeof selectedAISummary.tables === 'string' ? JSON.parse(selectedAISummary.tables) : selectedAISummary.tables;
              if (Array.isArray(tables) && tables.length > 0) {
                return (
                  <div style={{ margin: '12px 0' }}>
                    <b>📊 Bảng thông số:</b><br />
                    <div style={{ marginTop: '8px' }}>
                      {tables.map((table, index) => (
                        <div key={table.id || index} style={{
                          background: '#f6f8fa',
                          padding: '12px',
                          borderRadius: '6px',
                          marginBottom: '12px',
                          border: '1px solid #e1e4e8'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <h4 style={{ margin: 0, color: '#1890ff' }}>
                              {table.name || `Bảng ${index + 1}`}
                            </h4>
                            <span style={{
                              padding: '2px 8px',
                              backgroundColor: '#e6f7ff',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#1890ff'
                            }}>
                              {table.type === 'quarterly' ? 'Theo quý' :
                                table.type === 'monthly' ? 'Theo tháng' :
                                  'Theo năm'}
                            </span>
                          </div>

                          {table.data && Object.keys(table.data).length > 0 ? (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns:
                                table.type === 'quarterly' ? 'repeat(4, 1fr)' :
                                  table.type === 'monthly' ? 'repeat(6, 1fr)' :
                                    'repeat(3, 1fr)',
                              gap: '8px',
                              backgroundColor: '#fff',
                              padding: '12px',
                              borderRadius: '4px'
                            }}>
                              {Object.entries(table.data).map(([key, value]) => (
                                <div key={key} style={{
                                  textAlign: 'center',
                                  padding: '8px',
                                  backgroundColor: '#f5f5f5',
                                  borderRadius: '3px'
                                }}>
                                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{key}</div>
                                  <div style={{ fontSize: '14px', color: '#1890ff' }}>
                                    {value || '-'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{
                              textAlign: 'center',
                              color: '#999',
                              padding: '20px',
                              backgroundColor: '#fff',
                              borderRadius: '4px'
                            }}>
                              Chưa có dữ liệu
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch (e) {
              console.error('Error parsing tables:', e);
            }
            return null;
          })()}

          <div><b>Created At:</b> {selectedAISummary.created_at ? new Date(selectedAISummary.created_at).toLocaleString() : '-'}</div>
        </div>
      )}
    </Modal>
  );
}
