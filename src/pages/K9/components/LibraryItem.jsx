import React from 'react';
import { Image, Avatar } from 'antd';
import styles from '../K9.module.css';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const LibraryItem = ({
  item,
  expandedItem,
  onItemClick,
  isBookmarked = false,
  onToggleBookmark
}) => {
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'research': return 'Nghiên cứu';
      case 'analysis': return 'Phân tích';
      case 'guide': return 'Hướng dẫn';
      case 'trend': return 'Xu hướng';
      default: return category;
    }
  };

  return (
    <div className={`${styles.libraryItem} ${isBookmarked ? styles.hasBookmark : ''}`} onClick={() => onItemClick(item)}>
      {/* Avatar on the left */}
      {item.avatarUrl && (
        <div className={styles.avatarWrapper}>
          <Avatar src={item.avatarUrl} size={40} />
        </div>
      )}
      <div className={styles.libraryContent}>
        <div className={styles.libraryTitle}>{item.title}</div>
        <div className={styles.librarySummary}>{item.summary}</div>
        {/* Always expanded by default */}
        <div className={styles.libraryDetail}>
              {/* Video Section - Hiển thị đầu tiên */}
              {item.videoUrl && (
                  <div 
                    className={styles.libraryVideoSection}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <video
                        controls
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        style={{
                          width: '100%',
                          maxWidth: '500px',
                          height: 'auto',
                          borderRadius: '8px',
                          marginBottom: '20px',
                        }}
                    >
                      <source src={item.videoUrl} type="video/mp4" />
                      <source src={item.videoUrl} type="video/webm" />
                      <source src={item.videoUrl} type="video/ogg" />
                      Trình duyệt của bạn không hỗ trợ video.
                    </video>
                  </div>
              )}

              <div className={styles.newsDetail}>
                <div
                    className={styles.markdownContent}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(marked.parse(item.detail || '')),
                    }}
                />
              </div>

              {/* Images Section - Hiển thị cuối cùng */}
              {item.imgUrls && Array.isArray(item.imgUrls) && item.imgUrls.length > 0 && (
                  <div 
                    className={styles.libraryImagesSection}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '10px',
                      marginTop: '10px',
                    }}>
                      {item.imgUrls.map((url, index) => (
                          <div 
                            key={index} 
                            style={{ position: 'relative' }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Image
                                src={url}
                                alt={`Hình ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '150px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                }}
                                preview={{
                                  mask: <div style={{ fontSize: '16px' }}>🔍 Xem</div>,
                                  onVisibleChange: (visible) => {
                                    // Prevent event bubbling when closing preview
                                    if (!visible) {
                                      setTimeout(() => {
                                        const previewMask = document.querySelector('.ant-image-preview-mask');
                                        if (previewMask) {
                                          previewMask.onclick = (e) => {
                                            e.stopPropagation();
                                          };
                                        }
                                      }, 0);
                                    }
                                  }
                                }}
                                placeholder={
                                  <div style={{
                                    width: '100%',
                                    height: '150px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f0f0f0',
                                    borderRadius: '8px',
                                  }}>
                                    Loading...
                                  </div>
                                }
                            />
                          </div>
                      ))}
                    </div>
                  </div>
              )}
            </div>
        <div className={styles.libraryMeta}>
          <span className={styles.categoryTag}>
            <span className={styles.categoryEmoji}>{item.emoji}</span>
            {getCategoryLabel(item.category)}
          </span>
          {/* Hiển thị indicator có media trong meta nhưng không hiển thị media ở đây */}
          {item.videoUrl && (
            <span style={{ color: '#8c8c8c', fontSize: '12px' }}> • 🎥 Có video</span>
          )}
          {item.imgUrls && item.imgUrls.length > 0 && (
            <span style={{ color: '#8c8c8c', fontSize: '12px' }}> • 🖼️ {item.imgUrls.length} ảnh</span>
          )}
          {/* Move important icon to the end, same level as category and time */}
          {item.impact === 'important' && <span className={styles.impactIcon} style={{marginLeft: 6}}></span>}
        </div>

        <div className={styles.libraryActions}>
          <button
            className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            title={isBookmarked ? "Bỏ bookmark" : "Thêm bookmark"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(item);
            }}
          >
            {isBookmarked ? '🔖' : '📖'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LibraryItem;
