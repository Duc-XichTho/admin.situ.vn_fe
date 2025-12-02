import React from 'react';
import { Modal, Button, Image } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { FileList } from '../../../components/PreviewFile';
import styles from '../K9Management.module.css';

const ViewModal = ({
  visible,
  onCancel,
  selectedRecord,
  audioRef,
  isAudioPlaying,
  setIsAudioPlaying,
  setIsAudioLoading,
  handlePlayAudio
}) => {
  const handleClose = () => {
    // Dừng audio khi đóng modal
    if (audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
      setIsAudioLoading(false);
    }
    onCancel();
  };

  return (
    <Modal
      title="Chi tiết"
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose}>
          Đóng
        </Button>
      ]}
      width={800}
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
              />
            </div>
          )}

          {/* Display audio for story type */}
          {selectedRecord.type === 'story' && selectedRecord.audioUrl && (
            <div className={styles.viewSection}>
              <h3>Audio</h3>
              <div style={{
                backgroundColor: '#f6f8fa',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e1e4e8'
              }}>
                <audio
                  ref={audioRef}
                  controls
                  style={{ width: '100%' }}
                  onPlay={() => setIsAudioPlaying(true)}
                  onPause={() => setIsAudioPlaying(false)}
                  onEnded={() => setIsAudioPlaying(false)}
                >
                  <source src={selectedRecord.audioUrl} type="audio/mpeg" />
                  <source src={selectedRecord.audioUrl} type="audio/wav" />
                  <source src={selectedRecord.audioUrl} type="audio/aac" />
                  <source src={selectedRecord.audioUrl} type="audio/m4a" />
                  Trình duyệt của bạn không hỗ trợ audio.
                </audio>
                <p style={{ marginTop: '8px' }}>
                  <a href={selectedRecord.audioUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#666' }}>
                    {selectedRecord.audioUrl}
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Display metadata */}
          <div className={styles.viewSection}>
            <h3>Thông tin bổ sung</h3>
            <div style={{
              backgroundColor: '#f6f8fa',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #e1e4e8'
            }}>
              <p><strong>Loại:</strong> {selectedRecord.type}</p>
              <p><strong>Danh mục:</strong> {selectedRecord.category || 'Chưa phân loại'}</p>
              <p><strong>Trạng thái:</strong> {selectedRecord.status}</p>
              {selectedRecord.sentiment && (
                <p><strong>Sentiment:</strong> {selectedRecord.sentiment}</p>
              )}
              {selectedRecord.impact && (
                <p><strong>Tầm quan trọng:</strong> {selectedRecord.impact}</p>
              )}
              {selectedRecord.source && (
                <p><strong>Nguồn:</strong> {selectedRecord.source}</p>
              )}
              {selectedRecord.duration && (
                <p><strong>Thời lượng:</strong> {selectedRecord.duration}</p>
              )}
              {selectedRecord.storyType && (
                <p><strong>Loại story:</strong> {selectedRecord.storyType}</p>
              )}
              <p><strong>Ngày tạo:</strong> {new Date(selectedRecord.createdAt).toLocaleString('vi-VN')}</p>
              {selectedRecord.updatedAt && (
                <p><strong>Ngày cập nhật:</strong> {new Date(selectedRecord.updatedAt).toLocaleString('vi-VN')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ViewModal; 