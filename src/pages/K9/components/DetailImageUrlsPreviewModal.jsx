import { FileImageOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Image, Modal, Tag, message } from 'antd';
import React from 'react';
import { uploadFiles } from '../../../apis/aiGen/uploadImageWikiNoteService.jsx';
import { updateK9 } from '../../../apis/k9Service.jsx';

const DetailImageUrlsPreviewModal = ({
    visible,
    previewingDetailImageUrlsRecord,
    setDetailImageUrlsPreviewModalVisible,
    setPreviewingDetailImageUrlsRecord,
    setEditingDescriptions,
    uploadingImageIndex,
    setUploadingImageIndex,
    setK9Data,
    className,
}) => {
    const handleClose = () => {
        setDetailImageUrlsPreviewModalVisible(false);
        setPreviewingDetailImageUrlsRecord(null);
        setEditingDescriptions({});
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileImageOutlined style={{ color: '#722ed1', fontSize: '20px' }} />
                    <span style={{ fontSize: '18px', fontWeight: 600 }}>
                        {previewingDetailImageUrlsRecord?.title || 'Preview detailImageUrls'}
                    </span>
                    {previewingDetailImageUrlsRecord?.detailImageUrls &&
                        Array.isArray(previewingDetailImageUrlsRecord.detailImageUrls) && (
                            <Tag color="purple" style={{ fontSize: '13px', padding: '4px 12px' }}>
                                {previewingDetailImageUrlsRecord.detailImageUrls.length} ảnh
                            </Tag>
                        )}
                </div>
            }
            open={visible}
            onCancel={handleClose}
            footer={[
                <Button
                    key="close"
                    onClick={() => {
                        handleClose();
                    }}
                >
                    Đóng
                </Button>,
            ]}
            width={1400}
            className={className}
        >
            {previewingDetailImageUrlsRecord?.detailImageUrls &&
            Array.isArray(previewingDetailImageUrlsRecord.detailImageUrls) &&
            previewingDetailImageUrlsRecord.detailImageUrls.length > 0 ? (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        overflow: 'auto',
                        position: 'relative',
                        marginTop: '16px',
                    }}
                >
                    {previewingDetailImageUrlsRecord.detailImageUrls.map((imgItem, index) => {
                        const imageUrl = typeof imgItem === 'string' ? imgItem : imgItem?.url || imgItem?.image_url || '';
                        const description = typeof imgItem === 'object' ? imgItem?.description : '';
                        const partNumber = typeof imgItem === 'object' ? imgItem?.partNumber : index + 1;
                        const partContent = typeof imgItem === 'object' ? imgItem?.partContent : '';

                        if (!imageUrl) return null;

                        return (
                            <Card
                                key={index}
                                hoverable={false}
                                style={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                    border: '1px solid #e8e8e8',
                                    width: '100%',
                                    marginBottom: '16px',
                                }}
                                bodyStyle={{ padding: 0 }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                    {/* Image Section */}
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: '100%',
                                            backgroundColor: '#fafafa',
                                            minHeight: '200px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            borderBottom: '1px solid #f0f0f0',
                                            padding: '16px',
                                        }}
                                    >
                                        <Image
                                            src={imageUrl}
                                            alt={`Ảnh ${index + 1}`}
                                            style={{
                                                width: 'auto',
                                                height: 'auto',
                                                maxWidth: '100%',
                                                maxHeight: '400px',
                                                objectFit: 'contain',
                                            }}
                                            preview={{
                                                mask: (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            fontSize: '13px',
                                                            fontWeight: 500,
                                                            color: 'white',
                                                        }}
                                                    >
                                                        <span>🔍</span>
                                                        <span>Xem</span>
                                                    </div>
                                                ),
                                            }}
                                        />

                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                backgroundColor: 'rgba(114, 46, 209, 0.85)',
                                                color: 'white',
                                                padding: '2px 10px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                backdropFilter: 'blur(4px)',
                                            }}
                                        >
                                            Phần {partNumber}
                                        </div>

                                        {/* Upload Button */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                right: '8px',
                                                display: 'flex',
                                                gap: '8px',
                                            }}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                id={`upload-detail-image-${index}`}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    try {
                                                        setUploadingImageIndex(index);
                                                        message.loading('Đang upload ảnh...', 0);

                                                        // Upload file
                                                        const response = await uploadFiles([file]);
                                                        const newImageUrl =
                                                            response.files?.[0]?.fileUrl ||
                                                            response.files?.[0]?.url ||
                                                            '';

                                                        if (!newImageUrl) {
                                                            throw new Error('Upload ảnh thất bại');
                                                        }

                                                        // Update detailImageUrls with URL mới, giữ nguyên partContent và description
                                                        const updatedDetailImageUrls = [
                                                            ...(previewingDetailImageUrlsRecord?.detailImageUrls || []),
                                                        ];
                                                        updatedDetailImageUrls[index] = {
                                                            ...updatedDetailImageUrls[index],
                                                            url: newImageUrl,
                                                        };

                                                        const updateData = {
                                                            id: previewingDetailImageUrlsRecord?.id,
                                                            detailImageUrls: updatedDetailImageUrls,
                                                        };

                                                        const updateResponse = await updateK9(updateData);
                                                        const updatedRecord = updateResponse?.data || updateResponse;

                                                        // Update local state
                                                        const updater = (list) =>
                                                            list.map((item) =>
                                                                item.id === previewingDetailImageUrlsRecord?.id
                                                                    ? { ...item, ...updatedRecord }
                                                                    : item
                                                            );

                                                        setK9Data((prev) => ({
                                                            news: updater(prev.news || []),
                                                            document: updater(prev.document || []),
                                                            caseTraining: updater(prev.caseTraining || []),
                                                            longForm: updater(prev.longForm || []),
                                                            home: updater(prev.home || []),
                                                        }));

                                                        // Update previewing record
                                                        setPreviewingDetailImageUrlsRecord((prev) => ({
                                                            ...prev,
                                                            detailImageUrls: updatedDetailImageUrls,
                                                        }));

                                                        message.destroy();
                                                        message.success('Upload ảnh thành công!');
                                                    } catch (error) {
                                                        console.error('Error uploading image:', error);
                                                        message.destroy();
                                                        message.error('Upload ảnh thất bại!');
                                                    } finally {
                                                        setUploadingImageIndex(null);
                                                        // Reset input
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />

                                            <Button
                                                type="primary"
                                                icon={<UploadOutlined />}
                                                size="small"
                                                loading={uploadingImageIndex === index}
                                                onClick={() => {
                                                    document.getElementById(`upload-detail-image-${index}`)?.click();
                                                }}
                                                style={{
                                                    backgroundColor: '#722ed1',
                                                    borderColor: '#722ed1',
                                                    boxShadow: '0 2px 4px rgba(114, 46, 209, 0.3)',
                                                }}
                                            >
                                                Upload lại ảnh
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Part Content Section */}
                                    {partContent && (
                                        <div
                                            style={{
                                                padding: '12px 16px',
                                                backgroundColor: '#f9f0ff',
                                                borderBottom: '1px solid #f0f0f0',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#595959',
                                                    fontWeight: 500,
                                                    marginBottom: '6px',
                                                }}
                                            >
                                                Nội dung phần {partNumber}:
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    color: '#434343',
                                                    lineHeight: '1.6',
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                {partContent}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description Section */}
                                    <div
                                        style={{
                                            padding: '16px',
                                            backgroundColor: '#fff',
                                        }}
                                    >
                                        <div
                                            style={{
                                                marginBottom: '10px',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#595959',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                Mô tả
                                            </span>
                                        </div>

                                        {description ? (
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    color: '#434343',
                                                    lineHeight: '1.6',
                                                    wordBreak: 'break-word',
                                                    fontWeight: 400,
                                                }}
                                            >
                                                {description}
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    color: '#bfbfbf',
                                                    fontSize: '12px',
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                Chưa có mô tả
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        color: '#8c8c8c',
                    }}
                >
                    <FileImageOutlined style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.2 }} />
                    <div style={{ fontSize: '18px', fontWeight: 500 }}>Không có detailImageUrls</div>
                </div>
            )}
        </Modal>
    );
};

export default DetailImageUrlsPreviewModal;

