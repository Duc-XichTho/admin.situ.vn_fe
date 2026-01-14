import { Empty, Image, Modal, Spin, Tag, Typography } from 'antd';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import React, { useContext, useRef, useState } from 'react';
import { getK9ByIdPublic } from '../../../apis/public/publicService.jsx';
import { MyContext } from '../../../MyContext';
import AudioPlayer from '../../../components/AudioPlayer/AudioPlayer.jsx';
import PreviewFileModal from '../../../components/PreviewFile/PreviewFileModal';
import { Customize_Icon, Document_Icon } from '../../../icon/IconSvg.jsx';
import QuizComponent from './QuizComponent.jsx';
import newsTabStyles from './NewsTab.module.css';
import styles from '../K9.module.css';

const { Text } = Typography;

// Configure marked with katex extension
marked.use(markedKatex({
    throwOnError: false,
    strict: false,
    trust: true
}));

const RelatedCaseTrainingModal = ({
    visible,
    onClose,
    selectedNewsItem,
    relatedCaseTrainingList,
    onRefresh,
}) => {
    const { currentUser } = useContext(MyContext);
    const [selectedCaseTrainingItem, setSelectedCaseTrainingItem] = useState(null);
    const [loadingCaseTrainingDetail, setLoadingCaseTrainingDetail] = useState(false);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const markdownContentRef = useRef(null);

    // Helper: Preprocess LaTeX
    const preprocessLatex = (text) => {
        if (!text) return { processedText: text, latexBlocks: [] };

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

    // Helper: Postprocess LaTeX
    const postprocessLatex = (html, latexBlocks) => {
        if (!latexBlocks || latexBlocks.length === 0) return html;

        let result = html;
        latexBlocks.forEach(({ placeholder, formula, display }) => {
            try {
                const renderedLatex = katex.renderToString(formula, {
                    throwOnError: false,
                    displayMode: display,
                    strict: false,
                    trust: true,
                });
                result = result.replace(new RegExp(placeholder, 'g'), renderedLatex);
            } catch (error) {
                console.warn('LaTeX rendering error:', error);
            }
        });

        return result;
    };

    // Helper: Get file icon
    const getFileIcon = (extension) => {
        const iconMap = {
            pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
            ppt: '📽️', pptx: '📽️', txt: '📄', jpg: '🖼️', jpeg: '🖼️',
            png: '🖼️', gif: '🖼️', mp4: '🎥', avi: '🎥', mov: '🎥',
            mp3: '🎵', wav: '🎵', zip: '📦', rar: '📦', '7z': '📦'
        };
        return iconMap[extension] || '📄';
    };

    // Helper: Open file preview
    const openFilePreview = (fileUrl, fileName) => {
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        setPreviewFile({
            url: fileUrl,
            name: fileName,
            extension: fileExtension
        });
        setPreviewModalVisible(true);
    };

    // Handle click vào một case training item để xem chi tiết
    const handleSelectCaseTrainingItem = async (caseItem) => {
        setLoadingCaseTrainingDetail(true);
        try {
            const fullItem = await getK9ByIdPublic(caseItem.id);
            setSelectedCaseTrainingItem(fullItem);
        } catch (error) {
            console.error('Error loading case training detail:', error);
        } finally {
            setLoadingCaseTrainingDetail(false);
        }
    };

    // Render content panel (tương tự CaseTrainingTab)
    const renderCaseTrainingContent = (item) => {
        if (!item) return null;

        return (
            <div className={`${styles.contentPanel} ${newsTabStyles.contentPanel}`}>
                <div className={`${styles.contentHeader} ${newsTabStyles.contentHeader}`}>
                    <span className={`${styles.contentTitle} ${newsTabStyles.contentTitle}`}>{item.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', marginTop: '20px' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>ID: {item.id}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', fontSize: '15px', color: '#9F9F9F', marginTop: '10px' }}>
                    {item.info?.filedLabel_1 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Customize_Icon /> {item.info?.filedLabel_1}
                        </span>
                    )}
                    {/*{item.info?.filedLabel_2 && (*/}
                    {/*    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>*/}
                    {/*        <Document_Icon /> {item.info?.filedLabel_2}*/}
                    {/*    </span>*/}
                    {/*)}*/}
                </div>

                {/* Video/Audio Player Section */}
                <div className={styles.audioPlayerContainer}>
                    {item.videoUrl ? (
                        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                            <video
                                src={item.videoUrl}
                                controls
                                controlsList="nodownload noplaybackrate"
                                disablePictureInPicture
                                onContextMenu={(e) => !currentUser?.isAdmin && e.preventDefault()}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: '8px',
                                    backgroundColor: '#000'
                                }}
                            >
                                Trình duyệt của bạn không hỗ trợ video.
                            </video>
                        </div>
                    ) : item.audioUrl ? (
                        <AudioPlayer audioUrl={item.audioUrl} />
                    ) : null}
                </div>

                <div className={newsTabStyles.contentMain}>
                    {/* File URLs Section */}
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
                    {(item.diagramUrl || item.diagramHtmlCode || item.diagramNote) && (
                        <div className={`${styles.valueSection} ${newsTabStyles.valueSection}`}>
                            <div className={`${styles.diagramSectionContent} ${newsTabStyles.diagramSectionContent}`}>
                                {item.diagramHtmlCode && Array.isArray(item.diagramHtmlCode) && (
                                    item.diagramHtmlCode.map((htmlCode, index) => (
                                        <div key={`html-${index}`}>
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
                                                {Array.isArray(item.diagramNote) && item.diagramNote[index] && (
                                                    <div className={`${styles.diagramNote} ${newsTabStyles.diagramNote}`}>
                                                        <div
                                                            style={{ color: 'white' }}
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
                                                        style={{ color: 'white' }}
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
                        {item.description && (
                            <div className={styles.contentDescription}>
                                <Text strong>Description:</Text>
                                <Text>{item.description}</Text>
                            </div>
                        )}

                        {item.detail && (
                            <div className={`${styles.contentDetail} ${newsTabStyles.contentDetail}`}>
                                <div
                                    ref={markdownContentRef}
                                    className={styles.markdownContent}
                                    dangerouslySetInnerHTML={{
                                        __html: (() => {
                                            const { processedText, latexBlocks } = preprocessLatex(item.detail || '');
                                            const html = marked.parse(processedText, {
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

                        {/* Quiz Component */}
                        {item.questionContent && (
                            <QuizComponent
                                allowRetake={item.allow_retake}
                                quizData={item.questionContent}
                                questionId={item.id}
                                onScoreUpdate={() => {}}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Modal
                title={
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                            Các bài kiểm tra liên quan
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', fontWeight: 'normal' }}>
                            {selectedNewsItem?.title || ''}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            CID: <strong>{selectedNewsItem?.cid || '-'}</strong>
                        </div>
                    </div>
                }
                open={visible}
                onCancel={() => {
                    onClose();
                    setSelectedCaseTrainingItem(null);
                }}
                footer={null}
                width="90%"
                style={{ top: 0  , paddingBottom: 0 }}
                className={newsTabStyles.modalContent}
            >
                <div style={{ 
                    display: 'flex', 
                    width: '100%', 
                    height: '100%',
                    overflow: 'auto',
                    gap: '16px'
                }}>
                    {/* Left Panel: Danh sách bài kiểm tra */}
                    <div style={{
                        width: '400px',
                        borderRight: '1px solid #f0f0f0',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            padding: '16px', 
                            borderBottom: '1px solid #f0f0f0',
                            background: '#fafafa'
                        }}>
                            <Text strong>
                                Danh sách ({relatedCaseTrainingList.length} bài)
                            </Text>
                        </div>
                        <div style={{ 
                            flex: 1, 
                            overflowY: 'auto',
                            padding: '8px'
                        }}>
                            {relatedCaseTrainingList.length === 0 ? (
                                <Empty
                                    description="Không có bài kiểm tra nào liên quan"
                                    style={{ padding: '40px 20px' }}
                                />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {relatedCaseTrainingList.map((item) => {
                                        const isSelected = selectedCaseTrainingItem?.id === item.id;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelectCaseTrainingItem(item)}
                                                style={{
                                                    padding: '12px',
                                                    border: `1px solid ${isSelected ? '#1890ff' : '#e8e8e8'}`,
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected ? '#e6f7ff' : '#fff',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.borderColor = '#1890ff';
                                                        e.currentTarget.style.backgroundColor = '#f0f8ff';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.borderColor = '#e8e8e8';
                                                        e.currentTarget.style.backgroundColor = '#fff';
                                                    }
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                                    <Text strong style={{ fontSize: '14px', flex: 1 }}>
                                                        {item.title}
                                                    </Text>
                                                    {item.type === 'exam' ? (
                                                        <Tag color="purple" style={{ marginLeft: '8px' }}>Đánh giá Định kỳ</Tag>
                                                    ) : (
                                                        <Tag color="blue" style={{ marginLeft: '8px' }}>Bài kiểm tra</Tag>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#999' }}>
                                                    <span>ID: {item.id}</span>
                                                    {item.cid && <span>• CID: {item.cid}</span>}
                                                </div>
                                                <div style={{ marginTop: '8px' }}>
                                                    <Tag color={
                                                        item.status === 'published' ? 'success' :
                                                        item.status === 'archived' ? 'warning' : 'default'
                                                    }>
                                                        {item.status === 'published' ? 'Đã xuất bản' :
                                                         item.status === 'archived' ? 'Đã lưu trữ' : 'Bản nháp'}
                                                    </Tag>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Content */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '20px',
                        background: '#fff'
                    }}>
                        {loadingCaseTrainingDetail ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                <Spin size="large" />
                                <div style={{ marginTop: '16px' }}>
                                    <Text type="secondary">Đang tải chi tiết...</Text>
                                </div>
                            </div>
                        ) : selectedCaseTrainingItem ? (
                            renderCaseTrainingContent(selectedCaseTrainingItem)
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                                <Text type="secondary">Chọn một bài kiểm tra để xem chi tiết</Text>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Preview File Modal */}
            <PreviewFileModal
                open={previewModalVisible}
                onClose={() => setPreviewModalVisible(false)}
                fileUrl={previewFile?.url}
                fileName={previewFile?.name}
                title={previewFile ? `${getFileIcon(previewFile.extension)} ${previewFile.name}` : 'Preview File'}
            />
        </>
    );
};

export default RelatedCaseTrainingModal;

