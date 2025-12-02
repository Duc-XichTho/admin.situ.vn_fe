import { Modal, Button, Image, Tag, Space } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { FileList } from '../../../components/PreviewFile';
import styles from '../K9Management.module.css';

export default function ViewDetailModal({
  visible,
  onCancel,
  selectedRecord,
  isAudioPlaying,
  isAudioLoading,
  handlePlayAudio
}) {
  return (
    <Modal
      title="Chi tiết"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>
      ]}
      width={1200}
      centered={true}
    >
      {selectedRecord && (
        <div className={styles.viewContent}
          style={{
            height: '80vh',
            overflowY: 'auto',
            paddingBottom: 200
          }}>
          <div className={styles.viewSection}>
            <h3>Tiêu đề</h3>
            <p>{selectedRecord.title}</p>
          </div>
          <div className={styles.viewSection}>
            <h3>Tóm tắt</h3>
            <p>{selectedRecord.summary}</p>
          </div>
          <div className={styles.viewSection}>
            <h3>Chi tiết</h3>
            <p>{selectedRecord.detail}</p>
          </div>

          {/* Display avatar for news type */}
          {selectedRecord.type === 'news' && selectedRecord.avatarUrl && (
            <div className={styles.viewSection}>
              <h3>Avatar</h3>
              <Image
                width={200}
                height={200}
                src={selectedRecord.avatarUrl}
                style={{ objectFit: 'cover', borderRadius: '8px' }}
                placeholder={
                  <div style={{
                    width: 200,
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '8px'
                  }}>
                    <PictureOutlined style={{ fontSize: '48px', color: '#999' }} />
                  </div>
                }
              />
            </div>
          )}

          {/* Display audioText if available */}
          {selectedRecord.audioText && (
            <div className={styles.viewSection}>
              <h3>📝 Nội dung Voice</h3>
              <div style={{
                backgroundColor: '#f6f8fa',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #e1e4e8',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {selectedRecord.audioText}
              </div>
            </div>
          )}

          {/* Display images for library type */}
          {selectedRecord.type === 'library' && selectedRecord.imgUrls && selectedRecord.imgUrls.length > 0 && (
            <div className={styles.viewSection}>
              <h3>Hình ảnh ({selectedRecord.imgUrls.length})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {selectedRecord.imgUrls.map((url, index) => (
                  <Image
                    key={index}
                    width={150}
                    height={150}
                    src={url}
                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                    placeholder={
                      <div style={{
                        width: 150,
                        height: 150,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px'
                      }}>
                        Loading...
                      </div>
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Display video for library type */}
          {selectedRecord.type === 'library' && selectedRecord.videoUrl && (
            <div className={styles.viewSection}>
              <h3>Video</h3>
              <video
                controls
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  height: 'auto',
                  borderRadius: '8px'
                }}
              >
                <source src={selectedRecord.videoUrl} type="video/mp4" />
                <source src={selectedRecord.videoUrl} type="video/webm" />
                <source src={selectedRecord.videoUrl} type="video/ogg" />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
              <p style={{ marginTop: '8px' }}>
                <a href={selectedRecord.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#666' }}>
                  {selectedRecord.videoUrl}
                </a>
              </p>
            </div>
          )}

          {/* Display images for news type */}
          {selectedRecord.type === 'news' && selectedRecord.imgUrls && selectedRecord.imgUrls.length > 0 && (
            <div className={styles.viewSection}>
              <h3>Hình ảnh ({selectedRecord.imgUrls.length})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {selectedRecord.imgUrls.map((url, index) => (
                  <Image
                    key={index}
                    width={150}
                    height={150}
                    src={url}
                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                    placeholder={
                      <div style={{
                        width: 150,
                        height: 150,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px'
                      }}>
                        Loading...
                      </div>
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Display video for news type */}
          {selectedRecord.type === 'news' && selectedRecord.videoUrl && (
            <div className={styles.viewSection}>
              <h3>Video</h3>
              <video
                controls
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  height: 'auto',
                  borderRadius: '8px'
                }}
              >
                <source src={selectedRecord.videoUrl} type="video/mp4" />
                <source src={selectedRecord.videoUrl} type="video/webm" />
                <source src={selectedRecord.videoUrl} type="video/ogg" />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
              <p style={{ marginTop: '8px' }}>
                <a href={selectedRecord.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#666' }}>
                  {selectedRecord.videoUrl}
                </a>
              </p>
            </div>
          )}

          {/* Display files for news type */}
          {selectedRecord.type === 'news' && selectedRecord.fileUrls && selectedRecord.fileUrls.length > 0 && (
            <div className={styles.viewSection}>
              <FileList
                fileUrls={selectedRecord.fileUrls}
                title="File đính kèm"
                showCount={true}
              />
            </div>
          )}

          {/* Display files for report type */}
          {selectedRecord.type === 'report' && selectedRecord.fileUrls && selectedRecord.fileUrls.length > 0 && (
            <div className={styles.viewSection}>
              <FileList
                fileUrls={selectedRecord.fileUrls}
                title="File đính kèm"
                showCount={true}
              />
            </div>
          )}

          {selectedRecord.audioUrl && (
            <div className={styles.viewSection}>
              <h3>Audio</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Button
                  type="primary"
                  icon={isAudioLoading ? '⏳' : isAudioPlaying ? '⏸️' : '▶️'}
                  onClick={() => handlePlayAudio(selectedRecord.audioUrl)}
                  loading={isAudioLoading}
                  disabled={isAudioLoading}
                >
                  {isAudioLoading ? 'Loading...' : isAudioPlaying ? 'Pause' : ''}
                </Button>
              </div>
              <p>
                <a href={selectedRecord.audioUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#666' }}>
                  {selectedRecord.audioUrl}
                </a>
              </p>
            </div>
          )}
          <div className={styles.viewMeta}>
            <Space wrap>
              <Tag>Danh mục: {selectedRecord.category}</Tag>
              <Tag>Trạng thái: {selectedRecord.status}</Tag>
              {selectedRecord.createdAt && (
                <Tag>Ngày tạo: {(() => {
                  const date = new Date(selectedRecord.createdAt);
                  if (isNaN(date.getTime())) return '-';
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  const hours = String(date.getHours()).padStart(2, '0');
                  const minutes = String(date.getMinutes()).padStart(2, '0');
                  return `${day}/${month}/${year} ${hours}:${minutes}`;
                })()}</Tag>
              )}
              {selectedRecord.source && <Tag>Nguồn: {selectedRecord.source}</Tag>}
              {selectedRecord.sentiment && <Tag>Sentiment: {selectedRecord.sentiment}</Tag>}
              {selectedRecord.impact && <Tag>Tầm quan trọng: {selectedRecord.impact}</Tag>}
              {selectedRecord.duration && <Tag>Thời lượng: {selectedRecord.duration}</Tag>}
              {selectedRecord.storyType && <Tag>Loại: {selectedRecord.storyType}</Tag>}
              {selectedRecord.audioUrl && <Tag color="green">🔊 Có voice</Tag>}
              {selectedRecord.audioText && <Tag color="blue">📝 Có nội dung voice</Tag>}
              {selectedRecord.type === 'library' && selectedRecord.imgUrls && selectedRecord.imgUrls.length > 0 && (
                <Tag color="blue">🖼️ {selectedRecord.imgUrls.length} ảnh</Tag>
              )}
              {selectedRecord.type === 'library' && selectedRecord.videoUrl && (
                <Tag color="purple">🎥 Có video</Tag>
              )}
              {selectedRecord.type === 'news' && selectedRecord.fileUrls && selectedRecord.fileUrls.length > 0 && (
                <Tag color="green">📎 {selectedRecord.fileUrls.length} file</Tag>
              )}
              {selectedRecord.type === 'report' && selectedRecord.fileUrls && selectedRecord.fileUrls.length > 0 && (
                <Tag color="green">📎 {selectedRecord.fileUrls.length} file</Tag>
              )}
              {selectedRecord.type === 'news' && selectedRecord.imgUrls && selectedRecord.imgUrls.length > 0 && (
                <Tag color="blue">🖼️ {selectedRecord.imgUrls.length} ảnh</Tag>
              )}
              {selectedRecord.type === 'news' && selectedRecord.videoUrl && (
                <Tag color="purple">🎥 Có video</Tag>
              )}
              {selectedRecord.type === 'news' && selectedRecord.avatarUrl && (
                <Tag color="green">🖼️ Có avatar</Tag>
              )}
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
}
