import React, {useState, useEffect} from 'react';
import {Modal, Button, message} from 'antd';
import DOMPurify from 'dompurify';
import {marked} from 'marked';
import {getAllAiGenConfigList} from '../../../../apis/aiGen/aiGenConfigListService.jsx';
import {createNewQuestion} from "../../../../apis/questionService.jsx";
import {createNewAnswer} from "../../../../apis/answerService.jsx";

const AiGenHistoryViewerModal = ({
                                     isOpen,
                                     onClose,
                                     aiGenHistory
                                 }) => {
    const [aiConfigList, setAiConfigList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load AI config list when modal opens
    useEffect(() => {
        if (isOpen) {
            loadAiConfigList();
        }
    }, [isOpen]);

    const loadAiConfigList = async () => {
        try {
            setLoading(true);
            const data = await getAllAiGenConfigList();
            setAiConfigList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading AI config list:', error);
            setAiConfigList([]);
        } finally {
            setLoading(false);
        }
    };

    // Function to create object with question and content
    const handleCreate = async () => {
        if (!aiGenHistory) return;

        // Generate HTML content
        let htmlContent = '';

        // Audio section
        if (audioUrl) {
            htmlContent += `
                <div style="margin-bottom: 20px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; background-color: #f8f9fa;">
                    <div style="text-align: center;">
                        <audio controls src="${audioUrl}" style="width: 100%;">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </div>
            `;
        }

        // Text content section
        if (result) {
            const htmlText = DOMPurify.sanitize(marked(result));
            htmlContent += `
                <div style="margin-bottom: 20px; padding: 20px; border-radius: 8px; background-color: #fff; border: 1px solid #e9ecef;">
                    <div style="line-height: 1.6; font-size: 14px;">
                        ${htmlText}
                    </div>
                </div>
            `;
        }

        // Images section
        if (imageUrls && imageUrls.length > 0) {
            htmlContent += `
                <div style="padding: 20px; border-radius: 8px; background-color: #fff;">
                    <h4 style="margin-bottom: 16px; color: #333;">
                        🖼️ ${imageUrls.length} ảnh
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 12px; max-height: ${isSlideLayout ? '600px' : '400px'};">
            `;

            imageUrls.forEach((imageUrl, index) => {
                htmlContent += `
                    <div style="text-align: center; margin-bottom: ${isSlideLayout ? '24px' : '12px'}; padding: ${isSlideLayout ? '16px' : '0'}; border: ${isSlideLayout ? '1px solid #e9ecef' : 'none'}; border-radius: ${isSlideLayout ? '8px' : '0'}; background-color: ${isSlideLayout ? '#ffffff' : 'transparent'};">
                        <img src="${imageUrl}" alt="AI Generated Image ${index + 1}" style="max-width: 100%; max-height: ${isSlideLayout ? '400px' : '300px'}; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer;" onclick="window.open('${imageUrl}', '_blank')" />
                        <div style="margin-top: 8px; font-size: 12px; color: #666;">
                            ${!isSlideLayout ? `Ảnh ${index + 1}` : ''}
                `;

                // Add Vietnamese description for slide layout
                if (isSlideLayout && imageDescriptionsVi && imageDescriptionsVi[index]) {
                    htmlContent += `
                        <div style="margin-top: 8px; font-size: 14px; color: #555; font-style: italic; padding: 8px 12px; background-color: #f8f9fa; border-radius: 4px; line-height: 1.4; text-align: left;">
                            <strong>Mô tả:</strong> ${imageDescriptionsVi[index]}
                        </div>
                    `;
                }
                // Fallback to English description
                else if (isSlideLayout && (!imageDescriptionsVi || !imageDescriptionsVi[index]) && imageDescriptions && imageDescriptions[index]) {
                    htmlContent += `
                        <div style="margin-top: 8px; font-size: 14px; color: #555; font-style: italic; padding: 8px 12px; background-color: #f8f9fa; border-radius: 4px; line-height: 1.4; text-align: left;">
                            <strong>Mô tả:</strong> ${imageDescriptions[index]}
                        </div>
                    `;
                }

                htmlContent += `
                        </div>
                    </div>
                `;
            });

            htmlContent += `
                    </div>
                </div>
            `;
        }

        const createObject = {
            question: aiGenHistory.promt || aiGenHistory.prompt || '',
            content: aiGenHistory.anwser || '',
            html: htmlContent
        };
        try {
            const question = await createNewQuestion({
                question: aiGenHistory.promt || aiGenHistory.prompt || '',
            });

            if (question) {
                await createNewAnswer({
                    question_id: question.id,
                    title: question.question,
                    content: aiGenHistory.anwser || '',
                    html: htmlContent,
                });

                message.success('Tạo câu hỏi và câu trả lời thành công!');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            message.error('Đã xảy ra lỗi khi tạo câu hỏi hoặc câu trả lời!');
        }

        console.log('Created object:', createObject);
    };

    if (!aiGenHistory) {
        return (
            <Modal
                title="Xem chi tiết lịch sử"
                open={isOpen}
                onCancel={onClose}
                footer={
                    <>
                        <Button disabled>Tạo</Button>
                    </>
                }
                width={1000}
                centered
            >
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#999'
                }}>
                    Không có dữ liệu để hiển thị
                </div>
            </Modal>
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

    return (
        <Modal
            title={
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <span>Xem chi tiết lịch sử</span>
                    {isSlideLayout && (
                        <span style={{
                            backgroundColor: '#1890ff',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12
                        }}>
                            Slide Layout
                        </span>
                    )}
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            footer={
                <>
                    {/* <Button onClick={handleCreate}>Tạo</Button> */}
                </>
            }
            width={1200}
            centered
            style={{top: 20}}
        >
            <div style={{
                maxHeight: '60vh',
                overflowY: 'auto',
                padding: '20px 0'
            }}>
                {loading ? (
                    <div style={{textAlign: 'center', padding: '40px'}}>
                        Đang tải cấu hình...
                    </div>
                ) : (
                    <>
                        {/* Audio Section */}
                        {audioUrl && (
                            <div style={{
                                marginBottom: 20,
                                padding: 20,
                                border: '1px solid #e9ecef',
                                borderRadius: 8,
                                backgroundColor: '#f8f9fa'
                            }}>
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

                        {/* Text Content */}
                        <div style={{
                            marginBottom: 20,
                            padding: 20,
                            borderRadius: 8,
                            backgroundColor: '#fff',
                            border: '1px solid #e9ecef'
                        }}>

                            {/* Main Result */}
                            {result && (
                                <>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(marked(result))
                                        }}
                                        style={{
                                            lineHeight: 1.6,
                                            fontSize: '14px'
                                        }}
                                    />
                                </>
                            )}
                        </div>

                        {/* Images Section */}
                        {imageUrls && imageUrls.length > 0 && (
                            <div style={{
                                padding: 20,
                                borderRadius: 8,
                                backgroundColor: '#fff',
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
                                            border: isSlideLayout ? '1px solid #e9ecef' : 'none',
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
                                                        backgroundColor: '#f8f9fa',
                                                        borderRadius: 4,
                                                        lineHeight: 1.4,
                                                        textAlign: 'left'
                                                    }}>
                                                        <strong>Mô tả:</strong> {imageDescriptionsVi[index]}
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
                                                        <strong>Mô tả:</strong> {imageDescriptions[index]}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default AiGenHistoryViewerModal;
