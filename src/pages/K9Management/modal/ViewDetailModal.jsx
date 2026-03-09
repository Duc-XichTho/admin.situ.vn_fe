import { Modal, Tooltip } from 'antd';
import { ClockCircleOutlined, ShareAltOutlined, StarOutlined } from '@ant-design/icons';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import DOMPurify from 'dompurify';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ContentPanel from '../../K9/components/ContentPanel.jsx';
import CaseTrainingContentPanel from '../../K9/components/CaseTrainingContentPanel.jsx';
import QuizComponent from '../../K9/components/QuizComponent.jsx';
import PreviewFileModal from '../../../components/PreviewFile/PreviewFileModal.jsx';
import { formatDateFromTimestamp } from '../../../generalFunction/format.js';
import newsTabStyles from '../../K9/components/NewsTab.module.css';

marked.use(markedKatex({
  throwOnError: false,
  strict: false,
  trust: true
}));

const getFileIcon = (extension) => {
  const iconMap = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📽️', pptx: '📽️', txt: '📄', jpg: '🖼️', jpeg: '🖼️',
    png: '🖼️', gif: '🖼️', mp4: '🎥', avi: '🎥', mov: '🎥',
    mp3: '🎵', wav: '🎵', zip: '📦', rar: '📦', '7z': '📦'
  };
  return iconMap[extension] || '📄';
};

const preprocessLatex = (text) => {
  if (!text) return { processedText: '', latexBlocks: [] };
  let processedText = text;
  const latexBlocks = [];
  processedText = processedText.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
    const placeholder = `LATEX_DISPLAY_${latexBlocks.length}`;
    latexBlocks.push({ placeholder, formula, display: true });
    return placeholder;
  });
  processedText = processedText.replace(/\$([^$]+)\$/g, (match, formula) => {
    const placeholder = `LATEX_INLINE_${latexBlocks.length}`;
    latexBlocks.push({ placeholder, formula, display: false });
    return placeholder;
  });
  return { processedText, latexBlocks };
};

const postprocessLatex = (html, latexBlocks) => {
  if (!latexBlocks || latexBlocks.length === 0) return html;
  let result = html;
  latexBlocks.forEach(({ placeholder, formula, display }) => {
    try {
      const renderedLatex = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: display,
        strict: false,
        trust: true
      });
      result = result.replace(new RegExp(placeholder, 'g'), renderedLatex);
    } catch (error) {
      console.warn('LaTeX rendering error:', error);
    }
  });
  return result;
};

const highlightTextInContent = (html) => html;

const extractHeadings = (content) => {
  if (!content) return [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const extractedHeadings = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    extractedHeadings.push({ level: match[1].length, text: match[2].trim() });
  }
  return extractedHeadings;
};

export default function ViewDetailModal({
  visible,
  onCancel,
  selectedRecord,
  isAudioPlaying,
  isAudioLoading,
  handlePlayAudio
}) {
  const [showSummaryDetail, setShowSummaryDetail] = useState(true);
  const [selectedDetailImageIndex, setSelectedDetailImageIndex] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [modalPcSplitRatio, setModalPcSplitRatio] = useState(0.35);
  const [modalResizeStartRatio, setModalResizeStartRatio] = useState(null);
  const [headings, setHeadings] = useState([]);
  const [activeHeadingIndex, setActiveHeadingIndex] = useState(-1);
  const contentPanelRef = useRef(null);
  const markdownContentRef = useRef(null);
  const resizableContainerRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setShowSummaryDetail(true);
      setSelectedDetailImageIndex({});
      setPreviewFile(null);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && selectedRecord) {
      const hasQuiz = selectedRecord.type === 'caseTraining' && (selectedRecord?.questionContent || selectedRecord?.quizContent || selectedRecord?.quizzContent);
      setModalPcSplitRatio(hasQuiz ? 0.75 : 0.35);
    }
  }, [visible, selectedRecord?.id, selectedRecord?.type]);

  useEffect(() => {
    if (selectedRecord?.detail) {
      setHeadings(extractHeadings(selectedRecord.detail));
      setActiveHeadingIndex(-1);
    } else {
      setHeadings([]);
      setActiveHeadingIndex(-1);
    }
  }, [selectedRecord?.id, selectedRecord?.detail]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (modalResizeStartRatio !== null && resizableContainerRef.current) {
        const rect = resizableContainerRef.current.getBoundingClientRect();
        const newRatio = (e.clientX - rect.left) / rect.width;
        const hasQuiz = selectedRecord?.type === 'caseTraining' && (selectedRecord?.questionContent || selectedRecord?.quizContent || selectedRecord?.quizzContent);
        const minR = hasQuiz ? 0.3 : 0.2;
        const maxR = hasQuiz ? 0.85 : 0.6;
        if (newRatio > minR && newRatio < maxR) {
          setModalPcSplitRatio(newRatio);
        }
      }
    };
    const handleMouseUp = () => setModalResizeStartRatio(null);
    if (modalResizeStartRatio !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [modalResizeStartRatio, selectedRecord]);

  const openFilePreview = useCallback((fileUrl, fileName) => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    setPreviewFile({ url: fileUrl, name: fileName, extension: fileExtension });
  }, []);

  const handleClosePreview = useCallback(() => setPreviewFile(null), []);

  const scrollToHeading = useCallback((headingIndex) => {
    setActiveHeadingIndex(headingIndex);
    const markdownContent = markdownContentRef.current;
    if (!markdownContent) return;
    const headingEls = markdownContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const element = headingEls[headingIndex];
    if (element) {
      headingEls.forEach(h => h.classList.remove(newsTabStyles.headingHighlight));
      element.classList.add(newsTabStyles.headingHighlight);
      element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }, []);

  const isMobile = false;
  const hasQuiz = selectedRecord?.type === 'caseTraining' && (selectedRecord?.questionContent || selectedRecord?.quizContent || selectedRecord?.quizzContent);
  const isNewsType = selectedRecord && ['news', 'home', 'longForm', 'library', 'story'].includes(selectedRecord.type);

  const renderArticleSidebarContent = (item) => {
    if (!item) return null;
    return (
      <div className={`${newsTabStyles.articleSidebar} ${newsTabStyles.sidebarPC}`}>
        <div className={newsTabStyles.sidebarRow1}>
          <span>ID: {item.id}</span>
          <div className={newsTabStyles.sidebarActionItem} style={{ cursor: 'default', opacity: 0.7 }}>
            <ShareAltOutlined /> Chia sẻ
          </div>
          <div className={newsTabStyles.sidebarActionItem} style={{ cursor: 'default', opacity: 0.7 }}>
            <StarOutlined style={{ color: '#faad14' }} />
            {item.scoreFeedback != null ? (
              <span style={{ fontWeight: '500' }}>{Number(item.scoreFeedback || 0).toFixed(2)}</span>
            ) : (
              'Đánh giá'
            )}
          </div>
        </div>
        {item.summary && (
          <div className={newsTabStyles.sidebarShortformSection}>
            <div
              className={newsTabStyles.sidebarSummaryText}
              dangerouslySetInnerHTML={{
                __html: (() => {
                  const { processedText, latexBlocks } = preprocessLatex(item.summary || '');
                  let html = marked.parse(processedText);
                  return DOMPurify.sanitize(postprocessLatex(html, latexBlocks));
                })(),
              }}
            />
          </div>
        )}
        <div className={newsTabStyles.sidebarMetadataRow}>
          {(item.updatedAt || item.createdAt) && (
            <span className={newsTabStyles.sidebarMetadataDate}>
              <ClockCircleOutlined />
              {formatDateFromTimestamp(item.updatedAt || item.createdAt)}
            </span>
          )}
          {item.tag4 && Array.isArray(item.tag4) && item.tag4.length > 0 && (
            <div className={newsTabStyles.sidebarRelatedModuleWrapper}>
              <Tooltip title={`Related module: ${item.tag4.join(', ')}`} mouseEnterDelay={0.5}>
                <div className={newsTabStyles.sidebarRelatedModuleText}>
                  Related module: {item.tag4.join(', ')}
                </div>
              </Tooltip>
            </div>
          )}
        </div>
        <div className={newsTabStyles.sidebarDividerLine} />
      </div>
    );
  };

  const renderTOCSidebar = () => {
    if (headings.length === 0) return null;
    return (
      <div className={newsTabStyles.tocSidebar}>
        <div className={newsTabStyles.tocSidebarHeader}>
          <h4>Mục lục</h4>
        </div>
        <div className={newsTabStyles.tocSidebarList}>
          {headings.map((heading, index) => (
            <div
              key={index}
              className={`${newsTabStyles.tocSidebarItem} ${newsTabStyles[`tocSidebarLevel${heading.level}`]} ${activeHeadingIndex === index ? newsTabStyles.tocSidebarItemActive : ''}`}
              onClick={() => scrollToHeading(index)}
              title={`Cuộn đến: ${heading.text}`}
            >
              {heading.text}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!selectedRecord) return null;
    if (selectedRecord.type === 'caseTraining') {
      return (
        <CaseTrainingContentPanel
          item={selectedRecord}
          currentUser={null}
          isMobile={isMobile}
          isAnimating={false}
          showSummaryDetail={showSummaryDetail}
          selectedDetailImageIndex={selectedDetailImageIndex}
          searchText=""
          cidSourceInfo={null}
          selectedItem={selectedRecord}
          contentPanelRef={contentPanelRef}
          markdownContentRef={markdownContentRef}
          hasAccess={() => true}
          renderSkeleton={() => null}
          highlightTextInContent={highlightTextInContent}
          getFileIcon={getFileIcon}
          openFilePreview={openFilePreview}
          handleEditClick={onCancel}
          handleCidSourceInfoClick={() => {}}
          onShare={() => {}}
          setShowSummaryDetail={setShowSummaryDetail}
          setSelectedDetailImageIndex={setSelectedDetailImageIndex}
          setShowFeedbackModal={() => {}}
          setIsPackageModalOpen={() => {}}
          setQuizScores={() => {}}
          preprocessLatex={preprocessLatex}
          postprocessLatex={postprocessLatex}
          activeTab="caseTraining"
          fetchItem={() => {}}
          hideQuiz={true}
          hideEdit={true}
        />
      );
    }
    return (
      <ContentPanel
        fetchItem={() => {}}
        item={selectedRecord}
        currentUser={null}
        isMobile={isMobile}
        isAnimating={false}
        showSummaryDetail={showSummaryDetail}
        selectedDetailImageIndex={selectedDetailImageIndex}
        searchText=""
        activeTab={selectedRecord?.type || 'news'}
        viewMode="list"
        contentPanelRef={contentPanelRef}
        markdownContentRef={markdownContentRef}
        hasAccess={() => true}
        renderSkeleton={() => null}
        highlightTextInContent={highlightTextInContent}
        getFileIcon={getFileIcon}
        openFilePreview={openFilePreview}
        handleEditClick={onCancel}
        relatedCaseTrainingItems={[]}
        relatedQuizScores={{}}
        selectedProgram={null}
        onShare={() => {}}
        setShowSummaryDetail={setShowSummaryDetail}
        setSelectedDetailImageIndex={setSelectedDetailImageIndex}
        setShowFeedbackModal={() => {}}
        setIsPackageModalOpen={() => {}}
        setQuestionScoreMap={() => {}}
        preprocessLatex={preprocessLatex}
        postprocessLatex={postprocessLatex}
        isRead={false}
        onToggleRead={() => {}}
        hideHeaderMeta={true}
        hideSummaryDetailToggle={true}
      />
    );
  };

  return (
    <>
      <Modal
        title={null}
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={selectedRecord ? 1400 : 1000}
        style={{ top: 0, paddingBottom: 0 }}
        destroyOnClose
        maskClosable
        closable
        className={newsTabStyles.modalContent}
      >
        {selectedRecord && (
          isNewsType ? (
            <div className={newsTabStyles.resizablePanel} ref={resizableContainerRef}>
              <div
                className={newsTabStyles.modalSidebarPanel}
                style={{ width: `${modalPcSplitRatio * 100}%`, padding: '24px', overflowY: 'auto' }}
              >
                {renderArticleSidebarContent(selectedRecord)}
                {headings.length > 0 && <div style={{ height: 'auto', marginTop: 16 }}>{renderTOCSidebar()}</div>}
              </div>
              <div
                className={`${newsTabStyles.resizer} ${modalResizeStartRatio !== null ? newsTabStyles.resizerActive : ''}`}
                onMouseDown={(e) => {
                  setModalResizeStartRatio(modalPcSplitRatio);
                  e.preventDefault();
                }}
              />
              <div className={newsTabStyles.modalContentPanel} style={{ padding: '24px' }}>
                {renderContent()}
              </div>
            </div>
          ) : hasQuiz ? (
            <div className={newsTabStyles.resizablePanel} ref={resizableContainerRef}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
                <div
                  className={newsTabStyles.modalSidebarPanel}
                  style={{
                    height: '100%',
                    width: `${modalPcSplitRatio * 100}%`,
                    padding: '24px',
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                    borderRight: 'none'
                  }}
                >
                  {renderContent()}
                </div>
                <div
                  className={`${newsTabStyles.resizer} ${modalResizeStartRatio !== null ? newsTabStyles.resizerActive : ''}`}
                  onMouseDown={(e) => {
                    setModalResizeStartRatio(modalPcSplitRatio);
                    e.preventDefault();
                  }}
                  style={{ marginLeft: '10px' }}
                />
                <div
                  className={newsTabStyles.modalContentPanel}
                  style={{ width: `${(1 - modalPcSplitRatio) * 100}%` }}
                >
                  <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    height: '100%',
                    overflowY: 'auto'
                  }}>
                    <QuizComponent
                      allowRetake={selectedRecord.allow_retake}
                      quizData={selectedRecord.questionContent || selectedRecord.quizContent || selectedRecord.quizzContent}
                      questionId={selectedRecord.id}
                      onScoreUpdate={() => {}}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', overflowY: 'auto', padding: '24px' }}>
              {renderContent()}
            </div>
          )
        )}
      </Modal>

      <PreviewFileModal
        open={!!previewFile}
        onClose={handleClosePreview}
        fileUrl={previewFile?.url}
        fileName={previewFile?.name}
        title={previewFile ? `${getFileIcon(previewFile.extension)} ${previewFile.name}` : 'Preview File'}
      />
    </>
  );
}
