import React, { useState, useEffect } from 'react';
import { Modal, Rate, Input, Space, Typography, Statistic, Divider, message, Card } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import { createFeedback, getFeedbackByIdUserAndIdContent } from '../../../apis/feedbackService.jsx';
import { createTimestamp } from '../../../generalFunction/format.js';

const { TextArea } = Input;
const { Text } = Typography;

const RatingPopup = ({
    fetchItem,
    visible,
    onCancel,
    contentId,
    contentTitle,
    currentUser,
    currentAverageRating = 0,
    currentRatingCount = 0,
    activeTab
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingUserRating, setLoadingUserRating] = useState(false);
    const [userRating, setUserRating] = useState(null);

    useEffect(() => {
        if (visible && contentId && currentUser?.id) {
            loadUserRating();
        } else {
            setRating(0);
            setComment('');
        }
    }, [visible, contentId, currentUser?.id]);

    const loadUserRating = async () => {
        setLoadingUserRating(true);
        try {
            // Gọi API trực tiếp với idUser và idContent
            const data = await getFeedbackByIdUserAndIdContent(currentUser.id, contentId);

            // API trả về mảng, lấy phần tử đầu tiên
            const feedbacks = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
            const userFeedback = feedbacks.length > 0 ? feedbacks[0] : null;

            // Chỉ lấy nếu có rating (đây là rating, không phải feedback thông thường)
            if (userFeedback && userFeedback.rating != null && userFeedback.rating >= 1 && userFeedback.rating <= 5) {
                setUserRating(userFeedback);
                setRating(userFeedback.rating || 0);
                setComment(userFeedback.comment || userFeedback.desc || '');
            } else {
                setUserRating(null);
                setRating(0);
                setComment('');
            }
        } catch (error) {
            // User chưa có rating (404 hoặc không tìm thấy), không cần xử lý lỗi
            if (error.response?.status !== 404) {
                console.error('Error loading user rating:', error);
            }
            setUserRating(null);
            setRating(0);
            setComment('');
        } finally {
            setLoadingUserRating(false);
        }
    };

    const handleSubmit = async () => {
        // Kiểm tra đã đánh giá chưa
        if (userRating) {
            message.warning('Bạn đã đánh giá bài viết này rồi');
            return;
        }

        if (rating === 0) {
            message.warning('Vui lòng chọn số sao đánh giá');
            return;
        }

        if (comment && comment.length > 35) {
            message.warning('Comment không được vượt quá 35 ký tự');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                k9Content_Id: contentId,
                user_id: currentUser.id,
                user_name: currentUser.name || currentUser.email || 'User',
                rating: rating,
                desc: comment || null,
                source_tab: activeTab,
                createdAt: createTimestamp(),
                ...(userRating?.id && { id: userRating.id })
            };

            await createFeedback(payload);
            message.success('Đánh giá đã được lưu thành công');
            await fetchItem(contentId);
            onCancel();
        } catch (error) {
            console.error('Error saving rating:', error);
            message.error('Có lỗi xảy ra khi lưu đánh giá');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span>Đánh giá bài viết</span>
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            onOk={userRating ? undefined : handleSubmit}
            confirmLoading={loading}
            okText={userRating ? undefined : "Lưu đánh giá"}
            cancelText="Đóng"
            footer={userRating ? null : undefined}
            width={500} 
        >
            <div style={{ height: '100%' , overflowY: 'auto'}}>
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 14 }}>{contentTitle}</Text>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* Thông tin điểm hiện tại */}
                <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 20 }}>
                    <Statistic
                        title="Điểm trung bình"
                        value={currentAverageRating || 0}
                        precision={2}
                        prefix={<StarOutlined style={{ color: '#faad14' }} />}
                        valueStyle={{ color: '#faad14', fontSize: 24 }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Dựa trên {currentRatingCount || 0} đánh giá
                    </Text>
                </Space>

                <Divider style={{ margin: '12px 0' }} />

                {/* Đánh giá của user */}
                {userRating ? (
                    <div>
                        <Text type="warning" strong style={{ fontSize: 14 }}>
                            ⚠️ Bạn đã đánh giá bài viết này rồi
                        </Text>
                        <Divider style={{ margin: '12px 0' }} />
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div>
                                <Text strong>Đánh giá của bạn:</Text>
                                <div style={{ marginTop: 8 }}>
                                    <Rate
                                        value={rating}
                                        disabled
                                        style={{ fontSize: 28 }}
                                    />
                                </div>
                            </div>
                            {comment && (
                                <div>
                                    <Text strong>Comment của bạn:</Text>
                                    <Card size="small" style={{ marginTop: 8, background: '#fafafa' }}>
                                        <Text>{comment}</Text>
                                    </Card>
                                </div>
                            )}
                        </Space>
                    </div>
                ) : (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <div>
                            <Text strong>Đánh giá của bạn:</Text>
                            <div style={{ marginTop: 8 }}>
                                <Rate
                                    value={rating}
                                    onChange={setRating}
                                    allowClear
                                    disabled={loadingUserRating}
                                    style={{ fontSize: 28 }}
                                />
                            </div>
                        </div>

                        <div>
                            <Text strong>Comment (tùy chọn, tối đa 35 ký tự):</Text>
                            <TextArea
                                value={comment}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length <= 35) {
                                        setComment(value);
                                    }
                                }}
                                placeholder="Nhập comment của bạn..."
                                maxLength={35}
                                rows={3}
                                showCount
                                disabled={loadingUserRating}
                                style={{ marginTop: 8 }}
                            />
                        </div>
                    </Space>
                )}
            </div>

        </Modal>
    );
};

export default RatingPopup;
