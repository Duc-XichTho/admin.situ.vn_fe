import React, {useRef} from 'react';
import {Button, Input} from 'antd';
import DOMPurify from 'dompurify';
import {marked} from 'marked';

const AiGenHistoryViewer = ({
                                aiGenHistory,
                                aiConfigList = [],
                                isEditing = false,
                                editedContent = '',
                                onEditChange = () => {
                                },
                                onTextMouseUp = () => {
                                },
                                showImproveBtn = false,
                                improveBtnPos = {top: 0, left: 0},
                                onImproveClick = () => {
                                },
                                onAudioCreate = () => {
                                },
                                onAudioRecreate = () => {
                                },
                                onEditStart = () => {
                                },
                                onEditSave = () => {
                                },
                                onEditCancel = () => {
                                },
                                isLoading = false,
                                currentUser = null
                            }) => {
    const markedContentRef = useRef(null);
    const ai3ContentRef = useRef(null);

    if (!aiGenHistory) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#999'
            }}>
                Chọn một lịch sử để xem chi tiết
            </div>
        );
    }

    // Get flow config from aiGenHistory
    const flowConfig = aiConfigList.find(config => config.id == aiGenHistory.AIGenConfigId);

    // Determine layout
    let isSlideLayout = flowConfig?.layout === 'slide';
    if (!isSlideLayout && aiGenHistory.settings?.layout === 'slide') {
        isSlideLayout = true;
    }

    // Get data from history
    const result = aiGenHistory.anwser || '';
    const ai3Result = aiGenHistory.settings?.ai3Result || '';
    const imageUrls = aiGenHistory.imageUrls || [];
    const imageDescriptions = aiGenHistory.settings?.imageDescriptions || []; // English descriptions (for reference)
    const imageDescriptionsVi = aiGenHistory.settings?.imageDescriptionsVi || []; // Vietnamese descriptions (for display)
    const audioUrl = aiGenHistory.audioUrl || '';

    // Check if AI5 is enabled
    const hasAI5 = flowConfig?.aiConfigs?.some(ai => ai.name.startsWith('AI5') && ai.isUse);

    // Enhanced text mouse up handler that works for both AI3 and Main result
    const handleTextMouseUp = (e, contentType = 'main') => {
        // Add contentType parameter to distinguish between AI3 and main content
        const event = {
            ...e,
            contentType: contentType
        };
        onTextMouseUp(event);
    };

    return (
        <div style={{width: '100%'}}>
            {/* Audio Section */}
            <div>
                {/* Audio create button */}
                {hasAI5 && !audioUrl && result && (
                    <Button
                        type="primary"
                        loading={isLoading}
                        style={{marginBottom: 12}}
                        onClick={() => onAudioCreate(aiGenHistory)}
                    >
                        Tạo audio
                    </Button>
                )}

                {/* Audio player */}
                {audioUrl && (
                    <div style={{
                        marginBottom: 12,
                        padding: 20,
                        border: '1px solid #e9ecef',
                        borderRadius: 8,
                        backgroundColor: '#f8f9fa'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16
                        }}>
                            {hasAI5 && (
                                <Button
                                    type="default"
                                    size="small"
                                    loading={isLoading}
                                    onClick={() => onAudioRecreate(aiGenHistory)}
                                    style={{
                                        backgroundColor: '#ffa940',
                                        borderColor: '#ffa940',
                                        color: '#fff'
                                    }}
                                >
                                    🔄 Tạo lại audio
                                </Button>
                            )}
                        </div>
                        <div style={{textAlign: 'center'}}>
                            <audio
                                controls
                                src={audioUrl}
                                style={{width: '100%'}}
                            >
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                )}
            </div>

            {/* Text Content */}
            <div style={{minWidth: 0}}>
                <div style={{
                    padding: '20px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    minHeight: '200px'
                }}>
                    {/* Edit Controls */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        marginBottom: 16,
                        gap: 8
                    }}>
                        {!isEditing ? (
                            <Button
                                type="text"
                                size="small"
                                onClick={onEditStart}
                                disabled={!result}
                                style={{
                                    fontSize: 12,
                                    padding: '2px 8px'
                                }}
                            >
                                ✏️ Chỉnh sửa
                            </Button>
                        ) : (
                            <>
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={onEditSave}
                                    loading={isLoading}
                                    style={{
                                        fontSize: 12,
                                        padding: '2px 12px'
                                    }}
                                >
                                    💾 Lưu
                                </Button>
                                <Button
                                    type="default"
                                    size="small"
                                    onClick={onEditCancel}
                                    disabled={isLoading}
                                    style={{
                                        fontSize: 12,
                                        padding: '2px 12px'
                                    }}
                                >
                                    ❌ Hủy
                                </Button>
                            </>
                        )}
                    </div>

                    <div>
                        {isEditing ? (
                            <Input.TextArea
                                value={editedContent}
                                onChange={e => onEditChange(e.target.value)}
                                autoSize={{minRows: 6}}
                                style={{marginBottom: 12}}
                                placeholder="Nhập nội dung..."
                            />
                        ) : (
                            <>

                                {/* Main Result */}
                                {result && (
                                    <div>
                                        <div
                                            ref={markedContentRef}
                                            data-improve-enabled="true"
                                            onMouseUp={(e) => handleTextMouseUp(e, 'main')}
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(marked(result))
                                            }}
                                            style={{
                                                marginBottom: 0,
                                                position: 'relative',
                                                lineHeight: 1.6,
                                                fontSize: '14px',
                                                cursor: 'text',
                                                userSelect: 'text'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Improve Button */}
                                {showImproveBtn && (
                                    <button
                                        onClick={onImproveClick}
                                        style={{
                                            position: 'fixed',
                                            top: improveBtnPos.top,
                                            left: improveBtnPos.left,
                                            zIndex: 9999,
                                            background: '#1677ff',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 4,
                                            padding: '4px 12px',
                                            fontSize: 12,
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = '#0958d9';
                                            e.target.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = '#1677ff';
                                            e.target.style.transform = 'scale(1)';
                                        }}
                                    >
                                        ✨ Improve
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Images Section */}
            <div>
                {imageUrls && imageUrls.length > 0 && (
                    <div style={{
                        marginTop: 12,
                        padding: 20,
                        borderRadius: 8
                    }}>
                        <h4 style={{marginBottom: 16, color: '#333'}}>
                            🖼️ {imageUrls.length} ảnh
                        </h4>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            maxHeight: isSlideLayout ? '600px' : '400px',
                        }}>
                            {imageUrls.map((imageUrl, index) => (
                                <div key={index} style={{
                                    textAlign: 'center',
                                    marginBottom: isSlideLayout ? 24 : 12,
                                    padding: isSlideLayout ? 16 : 0,
                                    borderRadius: isSlideLayout ? 8 : 0,
                                    backgroundColor: isSlideLayout ? '#ffffff' : 'transparent'
                                }}>

                                    <img
                                        src={imageUrl}
                                        alt={`AI Generated Image ${index + 1}`}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: isSlideLayout ? '400px' : '300px',
                                            borderRadius: 8,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => window.open(imageUrl, '_blank')}
                                    />

                                    <div style={{
                                        marginTop: 8,
                                        fontSize: 12,
                                        color: '#666'
                                    }}>
                                        {!isSlideLayout && `Ảnh ${index + 1}`}

                                        {/* Show Vietnamese description for slide layout */}
                                        {isSlideLayout && imageDescriptionsVi && imageDescriptionsVi[index] && (
                                            <div style={{
                                                marginTop: 8,
                                                fontSize: 14,
                                                color: '#555',
                                                fontStyle: 'italic',
                                                padding: '8px 12px',
                                                borderRadius: 4,
                                                lineHeight: 1.4,
                                                textAlign: 'center',    
                                            }}>
                                              {imageDescriptionsVi[index]}
                                            </div>
                                        )}

                                        {/* Fallback to English description if Vietnamese is not available */}
                                        {isSlideLayout && (!imageDescriptionsVi || !imageDescriptionsVi[index]) && imageDescriptions && imageDescriptions[index] && (
                                            <div style={{
                                                marginTop: 8,
                                                fontSize: 14,
                                                color: '#555',
                                                fontStyle: 'italic',
                                                padding: '8px 12px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: 4,
                                                lineHeight: 1.4,
                                                textAlign: 'left'
                                            }}>
                                               {imageDescriptions[index]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiGenHistoryViewer;
