import { Button, Image, Popover, Switch } from 'antd';
import { LeftOutlined, RightOutlined, StarOutlined } from '@ant-design/icons';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import React, { useState } from 'react';
import styles from '../K9.module.css';
import newsTabStyles from './NewsTab.module.css';
import QuizComponent from './QuizComponent.jsx';
import ShareButton from './ShareButton.jsx';
import AudioPlayer from '../../../components/AudioPlayer/AudioPlayer.jsx';
import { formatDateFromTimestamp } from '../../../generalFunction/format.js';
import { Clock_Icon, FeedBack_Icon, Expand_Icon, Close_Icon } from '../../../icon/IconSvg.jsx';
import AccessDenied from './AccessDenied.jsx';
import ExcalidrawViewer from '../../K9Management/components/ExcalidrawViewer';
import RatingPopup from './RatingPopup.jsx';
const ContentPanel = ({
  fetchItem,
  item,
  currentUser,
  isMobile,
  isAnimating,
  showSummaryDetail,
  selectedDetailImageIndex,
  searchText,
  activeTab,
  viewMode,
  contentPanelRef,
  markdownContentRef,
  hasAccess,
  renderSkeleton,
  highlightTextInContent,
  getFileIcon,
  openFilePreview,
  handleEditClick,
  relatedCaseTrainingItems,
  relatedQuizScores,
  selectedProgram,
  onShare,
  setShowSummaryDetail,
  setSelectedDetailImageIndex,
  setShowFeedbackModal,
  setIsPackageModalOpen,
  setQuestionScoreMap,
  preprocessLatex,
  postprocessLatex,
  isRead = false,
  onToggleRead,
  hideHeaderMeta = false,
  hideSummaryDetailToggle = false,
}) => {
  const [quizPopoverVisible, setQuizPopoverVisible] = useState(false);
  const [ratingPopupVisible, setRatingPopupVisible] = useState(false);
  if (!item) return null;

  const handleQuizItemClick = (quizItem) => {
    const url = new URL(`${window.location.origin}/home`);
    url.searchParams.set('tab', 'caseTraining');
    url.searchParams.set('item', quizItem.id);
    if (selectedProgram && selectedProgram !== 'all') {
      url.searchParams.set('program', selectedProgram);
    }
    window.open(url.toString(), '_blank');
    setQuizPopoverVisible(false);
  };

  const renderQuizPopoverContent = () => {
    const quizItems = relatedCaseTrainingItems;

    if (quizItems.length === 0) {
      return (
        <div style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
          Không có quiz nào
        </div>
      );
    }

    return (
      <div style={{
        maxWidth: isMobile ? '350px' : '500px',
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '8px 0'
      }}>
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid #f0f0f0',
          fontWeight: '600',
          fontSize: '14px',
          color: '#262626',
          marginBottom: '4px'
        }}>
          Bài kiểm tra liên quan ({quizItems.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {quizItems.map((quizItem) => {
            const quizScore = relatedQuizScores[quizItem.id];
            const hasScore = quizScore !== undefined && quizScore !== null;
            const numeric = hasScore ? Number(quizScore) : null;
            const pass = numeric !== null && !isNaN(numeric) && numeric >= 70;

            return (
              <div
                key={quizItem.id}
                onClick={() => handleQuizItemClick(quizItem)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {quizItem.avatarUrl && (
                  <Image
                    src={quizItem.avatarUrl}
                    alt={quizItem.title}
                    width={70}
                    height={70}
                    style={{
                      objectFit: 'cover',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}
                    preview={false}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#262626',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {quizItem.title}
                  </div>
                  {quizItem.summary && (
                    <div style={{
                      fontSize: '11px',
                      color: '#8c8c8c',
                      marginBottom: '6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {quizItem.summary}
                    </div>
                  )}
                  {/* ID and Quiz Status Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px',
                      color: '#8c8c8c',
                      fontWeight: '500'
                    }}>
                      ID: {quizItem.id}
                    </span>
                    {hasScore ? (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: pass ? '#E5F6DD' : '#E9EEFF',
                          color: pass ? '#75C341' : '#7A8ED7',
                          border: pass ? '1px solid #9FDE7D' : '1px solid #B9C4F7',
                        }}
                        title={`Đạt ${numeric}/100`}
                      >
                        {numeric}/100
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: '#FFE9ED',
                          color: '#E39191',
                          border: '1px solid #F3B2B2',
                        }}
                        title='Chưa làm'
                      >
                        Chưa làm
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Check access permission
  if (!hasAccess(item)) {
    const isTrialAccount = currentUser?.account_type === 'Dùng thử';
    return (
      <div
        ref={contentPanelRef}
        className={`${styles.contentPanel} ${newsTabStyles.contentPanel}`}
      >
        <AccessDenied
          isTrialAccount={isTrialAccount}
          onUpgradeClick={() => setIsPackageModalOpen(true)}
        />
      </div>
    );
  }

  // Show skeleton while animating
  if (isAnimating) {
    return renderSkeleton();
  }

  return (
    <div
      ref={contentPanelRef}
      className={`${styles.contentPanel} ${newsTabStyles.contentPanel}`}
    >
      {!hideHeaderMeta && (
        <div className={`${styles.contentHeader} ${newsTabStyles.contentHeader}`}
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: isMobile ? '12px' : '0'
          }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: isMobile ? '0' : '10px',
            flex: isMobile ? '1 1 100%' : 1,
            minWidth: 0,
            width: isMobile ? '100%' : 'auto',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            <span style={{
              fontSize: '13px',
              color: '#9F9F9F',
              marginLeft: isMobile ? '0' : '40px',
              width: 'max-content',
              flexShrink: 0
            }}>ID: {item.id}</span>

            <ShareButton onShare={() => onShare(item)} />

            {item.updatedAt && (
              <Button
                type="text"
                icon={<Clock_Icon width={13} height={13} />}
                size={'small'}
                style={{ color: '#9F9F9F', fontSize: '13px', flexShrink: 0 }}
              >
                {formatDateFromTimestamp(item.updatedAt)}
              </Button>
            )}
            {item.tag4 && Array.isArray(item.tag4) && item.tag4.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                color: '#9F9F9F',
                minWidth: 0,
                flex: isMobile ? '1 1 100%' : '1 1 auto',
                overflow: 'hidden',
                maxWidth: isMobile ? '100%' : 'none',
                width: isMobile ? '100%' : 'auto'
              }}>
                <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Related module:</span>
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                  flex: '1 1 auto',
                  maxWidth: '100%'
                }} title={item.tag4.join(', ')}>
                  {item.tag4.join(', ')}
                </span>
              </div>
            )}

          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: isMobile ? 'flex-start' : 'flex-end',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            marginLeft: isMobile ? '0' : '8px',
            marginTop: isMobile ? '8px' : '0',
            width: isMobile ? '100%' : 'auto'
          }}>
            {/* Rating button */}
            {currentUser?.id && (
              <Button
                type="text"
                size="small"
                icon={<StarOutlined style={{ color: '#faad14' }} />}
                onClick={() => setRatingPopupVisible(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#faad14',
                  border: 'none',
                  boxShadow: 'none',
                  flexShrink: 0
                }}
                title="Đánh giá bài viết"
              >
                {item.scoreFeedback != null ? (
                  <span style={{ fontSize: '13px' }}>
                    {Number(item.scoreFeedback || 0).toFixed(2)}
                  </span>
                ) : (
                  <span style={{ fontSize: '13px' }}>Đánh giá</span>
                )}
              </Button>
            )}
            {/* Read status toggle */}
            {onToggleRead && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: isRead ? '#f0f9ff' : '#fafafa',
                transition: 'all 0.2s',
                flexShrink: 0
              }}>
                <Switch
                  checked={isRead}
                  onChange={(checked) => {
                    onToggleRead(item);
                  }}
                  size="small"
                  checkedChildren="Đã đọc"
                  unCheckedChildren="Chưa đọc"
                />
              </div>
            )}
            {currentUser?.isAdmin && !isMobile && (
              <Button
                type="text"
                size="small"
                onClick={handleEditClick}
                style={{
                  color: '#9F9F9F',
                  border: 'none',
                  boxShadow: 'none',
                  flexShrink: 0
                }}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      )}

      {/* File URLs Section */}
      <div className={newsTabStyles.contentMain} style={{ padding: isMobile ? '0px' : viewMode === 'grid' ? '0 50px' : '0 100px' }}>
        <div className={styles.contentTitleContainer}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`${styles.contentTitle} ${newsTabStyles.contentTitle}`}>{item.title}</span>
            </div>
          </div>
          {item.summary && !hideHeaderMeta && (
            <div className={`${styles.contentDetail} ${newsTabStyles.contentDetail}`} style={{ marginTop: '12px', marginBottom: '12px' }}>
              <div
                className={styles.markdownContent}
                style={{ fontSize: '16px' }}
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const { processedText, latexBlocks } = preprocessLatex(item.summary || '');
                    let html = marked.parse(processedText, {
                      headerIds: true,
                      mangle: false,
                      headerPrefix: '',
                      breaks: false,
                      gfm: true
                    });
                    const finalHtml = postprocessLatex(html, latexBlocks);
                    return DOMPurify.sanitize(finalHtml);
                  })(),
                }}
              />
            </div>
          )}
          {item.summaryDetail && showSummaryDetail && (
            <div className={`${styles.contentDetail} ${newsTabStyles.contentDetail}`} style={{ marginTop: '12px', marginBottom: '12px' }}>
              <div
                className={styles.markdownContent}
                style={{ fontSize: '16px' }}
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const { processedText, latexBlocks } = preprocessLatex(item.summaryDetail || '');
                    let html = marked.parse(processedText, {
                      headerIds: true,
                      mangle: false,
                      headerPrefix: '',
                      breaks: false,
                      gfm: true
                    });
                    const finalHtml = postprocessLatex(html, latexBlocks);
                    return DOMPurify.sanitize(finalHtml);
                  })(),
                }}
              />
            </div>
          )}
          <div style={{
            display: 'flex',
            gap: isMobile ? '12px' : '16px',
            fontSize: '15px',
            color: '#9F9F9F',
            marginTop: '10px',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center'
          }}>
            {!hideSummaryDetailToggle && item.summaryDetail && (
              <Button
                type="text"
                size="small"
                onClick={() => setShowSummaryDetail(!showSummaryDetail)}
                title={showSummaryDetail ? 'Ẩn Shortform' : 'Hiện Shortform'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  color: '#595959',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: 'none'
                }}
                icon={showSummaryDetail ? <Close_Icon width={12} height={12} /> : <Expand_Icon width={12} height={12} />}
              >
                Shortform
              </Button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

              {item.info?.filedLabel_1 && (
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {item.info?.filedLabel_1}
                </span>
              )}
              {/*{item.info?.filedLabel_1 && item.info?.filedLabel_2 && (*/}
              {/*  <span style={{ color: '#C4C4C4' }}>|</span>*/}
              {/*)}*/}
              {/*{item.info?.filedLabel_2 && (*/}
              {/*  <span style={{ display: 'flex', alignItems: 'center' }}>*/}
              {/*    {item.info?.filedLabel_2}*/}
              {/*  </span>*/}
              {/*)}*/}
            </div>
            {
              !hideHeaderMeta && activeTab === 'stream' && relatedCaseTrainingItems.length > 0 && (
                <Popover
                  content={renderQuizPopoverContent}
                  title={null}
                  trigger="click"
                  open={quizPopoverVisible}
                  onOpenChange={setQuizPopoverVisible}
                  placement="bottomLeft"
                  overlayStyle={{ zIndex: 1001 }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      color: '#9F9F9F'
                    }}
                    title="Bài kiểm tra liên quan"
                  >
                    <span style={{ fontSize: '17px' }}>📝</span> Bài kiểm tra liên quan
                  </span>
                </Popover>
              )
            }

          </div>
          {/* Audio Player Section */}
          <div className={styles.audioPlayerContainer}>
            <AudioPlayer audioUrl={item.audioUrl} />
          </div>
        </div>

        {item.fileUrls && item.fileUrls.length > 0 && (
          <div className={`${styles.fileTagsContainer} ${newsTabStyles.fileTagsContainer}`}>
            {item.fileUrls.map((fileUrl, index) => {
              const fileName = fileUrl.split('/').pop() || `file-${index + 1}`;
              const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

              return (
                <div
                  key={index}
                  className={`${styles.fileTag} ${newsTabStyles.fileTag}`}
                  onClick={() => openFilePreview(fileUrl, fileName)}
                  title={fileName}
                >
                  <span className={`${styles.fileTagIcon} ${newsTabStyles.fileTagIcon}`}>
                    {getFileIcon(fileExtension)}
                  </span>
                  <span className={`${styles.fileTagName} ${newsTabStyles.fileTagName}`}>
                    {fileName}
                  </span>
                  <span className={`${styles.fileTagExtension} ${newsTabStyles.fileTagExtension}`}>
                    {fileExtension.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Diagram Section */}
        {(item.diagramUrl || ((item.diagramHtmlCode || item.diagramHtmlCodeFromSummaryDetail) && item.showHtml !== false) || (item.diagramExcalidrawJson && item.showExcalidraw !== false) || item.diagramNote || item.diagramExcalidrawNote || (item.imgUrls && item.showImgUrls !== false) || (item.detailImageUrls && Array.isArray(item.detailImageUrls) && item.detailImageUrls.length > 0 && item.showDetailImageUrls !== false)) && (
          <div className={`${styles.valueSection} ${newsTabStyles.valueSection}`}>
            <div className={`${styles.diagramSectionContent} ${newsTabStyles.diagramSectionContent}`}>
              {/* Handle Excalidraw React Diagrams */}
              {item.diagramExcalidrawJson && Array.isArray(item.diagramExcalidrawJson) && item.showExcalidraw !== false && (
                item.diagramExcalidrawJson.map((jsonString, index) => {
                  // Lấy imageUrl nếu có
                  const imageUrl = item.diagramExcalidrawImageUrls && Array.isArray(item.diagramExcalidrawImageUrls)
                    ? item.diagramExcalidrawImageUrls[index]
                    : null;

                  return (
                    <div key={`excalidraw-${index}`} style={{ marginBottom: '20px' }}>
                      <div style={{
                        border: '1px solid #e1e4e8',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#fff'
                      }}>
                        <ExcalidrawViewer
                          jsonString={jsonString}
                          readOnly={true}
                          height="500px"
                          imageUrl={imageUrl}
                        />
                      </div>
                      {/* Show corresponding note if available */}
                      {(Array.isArray(item.diagramExcalidrawNote) && item.diagramExcalidrawNote[index]) && (
                        <div className={`${styles.diagramNote} ${newsTabStyles.diagramNote}`}>
                          <div
                            className={styles.markdownContent}
                            dangerouslySetInnerHTML={{
                              __html: (() => {
                                const { processedText, latexBlocks } = preprocessLatex(item.diagramExcalidrawNote[index] || '');
                                const html = marked.parse(processedText);
                                const finalHtml = postprocessLatex(html, latexBlocks);
                                return DOMPurify.sanitize(finalHtml);
                              })(),
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Handle imgUrls from SummaryDetail */}
              {item.imgUrls && Array.isArray(item.imgUrls) && item.imgUrls.length > 0 && item.showImgUrls !== false && (
                item.imgUrls.map((imgItem, index) => {
                  const imageUrl = typeof imgItem === 'string' ? imgItem : (imgItem?.url || imgItem?.image_url || '');
                  const description = typeof imgItem === 'object' ? imgItem?.description : '';
                  if (!imageUrl) return null;

                  return (
                    <div key={`imgurls-${index}`} style={{ marginBottom: '20px' }}>
                      <div className={`${styles.diagramImage} ${newsTabStyles.diagramImage}`}>
                        <Image
                          src={imageUrl}
                          alt={description || `Ảnh ${index + 1}`}
                          className={`${styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
                          preview={{
                            mask: 'Xem ảnh',
                            maskClassName: 'custom-mask'
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}

              {/* Handle detailImageUrls from Detail - Gallery Style */}
              {item.detailImageUrls && Array.isArray(item.detailImageUrls) && item.detailImageUrls.length > 0 && item.showDetailImageUrls !== false && (() => {
                const currentSelectedIndex = selectedDetailImageIndex[item.id] ?? 0;
                const mainImage = item.detailImageUrls[currentSelectedIndex];
                const mainImageUrl = typeof mainImage === 'string' ? mainImage : (mainImage?.url || mainImage?.image_url || '');
                const totalImages = item.detailImageUrls.length;
                const hasMultipleImages = totalImages > 1;

                if (!mainImageUrl) return null;

                const handlePrevious = () => {
                  const newIndex = currentSelectedIndex === 0 ? totalImages - 1 : currentSelectedIndex - 1;
                  setSelectedDetailImageIndex(prev => ({
                    ...prev,
                    [item.id]: newIndex
                  }));
                };

                const handleNext = () => {
                  const newIndex = currentSelectedIndex === totalImages - 1 ? 0 : currentSelectedIndex + 1;
                  setSelectedDetailImageIndex(prev => ({
                    ...prev,
                    [item.id]: newIndex
                  }));
                };

                return (
                  <div key={`detailimageurls-gallery`} style={{ marginBottom: '20px' }}>
                    <div className={`${styles.diagramImage} ${newsTabStyles.diagramImage}`} style={{ position: 'relative' }}>
                      <Image
                        src={mainImageUrl}
                        alt={`Ảnh ${currentSelectedIndex + 1}`}
                        className={`${styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
                        preview={{
                          mask: 'Xem ảnh',
                          maskClassName: 'custom-mask'
                        }}
                      />

                      {/* Navigation Buttons */}
                      {hasMultipleImages && (
                        <>
                          <Button
                            type="default"
                            shape="circle"
                            icon={<LeftOutlined />}
                            onClick={handlePrevious}
                            style={{
                              position: 'absolute',
                              left: '20px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '48px',
                              height: '48px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              border: '1px solid #d9d9d9',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              zIndex: 10,
                              fontSize: '18px',
                              transition: 'all 0.3s ease',
                              color: '#595959'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                              e.currentTarget.style.borderColor = '#bfbfbf';
                              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                              e.currentTarget.style.borderColor = '#d9d9d9';
                              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            }}
                            title="Ảnh trước (←)"
                          />
                          <Button
                            type="default"
                            shape="circle"
                            icon={<RightOutlined />}
                            onClick={handleNext}
                            style={{
                              position: 'absolute',
                              right: '20px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '48px',
                              height: '48px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              border: '1px solid #d9d9d9',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              zIndex: 10,
                              fontSize: '18px',
                              transition: 'all 0.3s ease',
                              color: '#595959'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                              e.currentTarget.style.borderColor = '#bfbfbf';
                              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                              e.currentTarget.style.borderColor = '#d9d9d9';
                              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            }}
                            title="Ảnh sau (→)"
                          />
                          {/* Image Counter */}
                          <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 500,
                            zIndex: 10,
                            backdropFilter: 'blur(4px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}>
                            {currentSelectedIndex + 1} / {totalImages}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Gallery (only show if more than 1 image) */}
                    {hasMultipleImages && (
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        backgroundColor: '#fafafa',
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          {item.detailImageUrls.map((imgItem, index) => {
                            const thumbUrl = typeof imgItem === 'string' ? imgItem : (imgItem?.url || imgItem?.image_url || '');
                            const isSelected = index === currentSelectedIndex;

                            if (!thumbUrl) return null;

                            return (
                              <div
                                key={index}
                                onClick={() => {
                                  setSelectedDetailImageIndex(prev => ({
                                    ...prev,
                                    [item.id]: index
                                  }));
                                }}
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  borderRadius: '10px',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  border: isSelected ? '1px solid #bfbfbf' : '1px solid #e8e8e8',
                                  backgroundColor: '#fff',
                                  position: 'relative',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                  boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
                                  opacity: isSelected ? 1 : 0.85
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#bfbfbf';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                    e.currentTarget.style.opacity = '1';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#e8e8e8';
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.opacity = '0.85';
                                  }
                                }}
                                title={`Ảnh ${index + 1} - Click để xem`}
                              >
                                <img
                                  src={thumbUrl}
                                  alt={`Thumbnail ${index + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                                {/* Selected indicator */}
                                {isSelected && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    backgroundColor: '#8c8c8c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid white',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                    zIndex: 10
                                  }}>
                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Handle HTML Code Diagrams */}
              {item.diagramHtmlCode && Array.isArray(item.diagramHtmlCode) && item.showHtml !== false && (
                item.diagramHtmlCode.map((htmlCode, index) => (
                  <div key={`html-${index}`} >
                    <div className={`${styles.diagramHtmlCode} ${newsTabStyles.diagramHtmlCode}`}>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(htmlCode || ''),
                        }}
                      />
                    </div>
                  </div>
                ))
              )}

              {/* Handle HTML Code Diagrams from SummaryDetail */}
              {item.diagramHtmlCodeFromSummaryDetail && item.showHtml !== false && (
                (Array.isArray(item.diagramHtmlCodeFromSummaryDetail) ? item.diagramHtmlCodeFromSummaryDetail : [item.diagramHtmlCodeFromSummaryDetail]).map((htmlCode, index) => (
                  <div key={`html-summary-${index}`} >
                    <div className={`${styles.diagramHtmlCode} ${newsTabStyles.diagramHtmlCode}`}>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(htmlCode || ''),
                        }}
                      />
                    </div>
                  </div>
                ))
              )}

              {/* Handle Kroki Image Diagrams */}
              {item.diagramUrl && (
                Array.isArray(item.diagramUrl) ? (
                  item.diagramUrl.map((diagramUrl, index) => (
                    <div key={`kroki-${index}`} style={{ marginBottom: '20px' }}>
                      <div className={`${styles.diagramImage} ${newsTabStyles.diagramImage}`}>
                        <Image
                          src={diagramUrl}
                          alt={`Diagram ${index + 1}`}
                          className={`${styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
                          preview={{
                            mask: 'Xem ảnh',
                            maskClassName: 'custom-mask'
                          }}
                        />
                      </div>
                      {/* Show corresponding note if available */}
                      {Array.isArray(item.diagramNote) && item.diagramNote[index] && (
                        <div className={`${styles.diagramNote} ${newsTabStyles.diagramNote}`}>
                          <div
                            className={styles.markdownContent}
                            dangerouslySetInnerHTML={{
                              __html: (() => {
                                const { processedText, latexBlocks } = preprocessLatex(item.diagramNote[index] || '');
                                const html = marked.parse(processedText);
                                const finalHtml = postprocessLatex(html, latexBlocks);
                                return DOMPurify.sanitize(finalHtml);
                              })(),
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  /* Handle single diagram (backward compatibility) */
                  <>
                    <div className={`${styles.diagramImage} ${newsTabStyles.diagramImage}`}>
                      <Image
                        src={item.diagramUrl}
                        alt="Diagram"
                        className={`${styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
                        preview={{
                          mask: 'Xem ảnh',
                          maskClassName: 'custom-mask'
                        }}
                      />
                    </div>
                    {item.diagramNote && (
                      <div className={`${styles.diagramNote} ${newsTabStyles.diagramNote}`}>
                        <div
                          className={styles.markdownContent}
                          dangerouslySetInnerHTML={{
                            __html: (() => {
                              const { processedText, latexBlocks } = preprocessLatex(
                                Array.isArray(item.diagramNote)
                                  ? item.diagramNote[0] || ''
                                  : item.diagramNote || ''
                              );
                              const html = marked.parse(processedText);
                              const finalHtml = postprocessLatex(html, latexBlocks);
                              return DOMPurify.sanitize(finalHtml);
                            })(),
                          }}
                        />
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          </div>
        )}

        <div className={`${styles.contentBody} ${newsTabStyles.contentBody}`}>
          {item.detail && item.showDetail !== false && (
            <div className={`${styles.contentDetail} ${newsTabStyles.contentDetail}`}>
              <div
                ref={markdownContentRef}
                className={styles.markdownContent}
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const { processedText, latexBlocks } = preprocessLatex(item.detail || '');
                    let html = marked.parse(processedText, {
                      headerIds: true,
                      mangle: false,
                      headerPrefix: '',
                      breaks: false,
                      gfm: true
                    });

                    // Apply search highlight if searchText exists
                    if (searchText && searchText.trim()) {
                      html = highlightTextInContent(html, searchText);
                    }
                    const finalHtml = postprocessLatex(html, latexBlocks);
                    return DOMPurify.sanitize(finalHtml);
                  })(),
                }}
              />
            </div>
          )}

          {/* Quiz Component - Hiển thị cuối cùng khi xem chi tiết */}
          {item.questionContent && (
            <QuizComponent
              allowRetake={item.allow_retake}
              quizData={item.questionContent}
              questionId={item.id}
              onScoreUpdate={(qid, score) => setQuestionScoreMap(prev => ({ ...prev, [qid]: score }))}
            />
          )}
        </div>
      </div>

      {/* Rating Popup */}
      {currentUser?.id && (
        <RatingPopup
          fetchItem={fetchItem}
          visible={ratingPopupVisible}
          onCancel={() => setRatingPopupVisible(false)}
          contentId={item.id}
          contentTitle={item.title}
          currentUser={currentUser}
          currentAverageRating={Number(item.scoreFeedback)}
          currentRatingCount={item?.feedbackCount || 0}
          onRatingUpdate={() => {
            // Callback để refresh data nếu cần
            // Có thể trigger reload từ parent component
            setRatingPopupVisible(false);
          }}
          activeTab={activeTab}
        />
      )}
    </div>
  );
};

export default ContentPanel;

