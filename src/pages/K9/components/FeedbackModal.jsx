import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { createFeedback } from '../../../apis/feedbackService.jsx';
import { createTimestamp } from '../../../generalFunction/format.js';
import styles from './FeedbackModal.module.css';

const { TextArea } = Input;

const FeedbackModal = ({
  visible,
  onClose,
  item,          // { id, title }
  currentUser,   // optional: to prefill email
  activeTab,
}) => {
  const [feedbackPhone, setFeedbackPhone] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      // Prefill email from currentUser if available
      setFeedbackEmail(currentUser?.email || '');
    }
  }, [visible, currentUser]);

  const handleSubmit = async () => {
    const phoneOk = /^\+?\d{8,15}$/.test((feedbackPhone || '').trim());
    const emailOk = /[^\s@]+@[^\s@]+\.[^\s@]+/.test((feedbackEmail || '').trim());
    const contentOk = (feedbackContent || '').trim().length > 0;

    if (!phoneOk) {
      message.error('Vui lòng nhập số điện thoại hợp lệ (8-15 chữ số).');
      return;
    }
    if (!emailOk) {
      message.error('Vui lòng nhập email hợp lệ.');
      return;
    }
    if (!contentOk) {
      message.error('Vui lòng nhập nội dung góp ý.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        k9Content_Id: item?.id ?? null,
        user_id: currentUser?.id ?? null,
        phone: feedbackPhone.trim(),
        email: feedbackEmail.trim(),
        desc: feedbackContent.trim(),
        source_tab: activeTab,
        createdAt: createTimestamp(),
      };

      await createFeedback(payload);

      message.success('Đã gửi góp ý thành công. Cảm ơn bạn!');
      onClose?.();
      setFeedbackPhone('');
      setFeedbackEmail('');
      setFeedbackContent('');
    } catch (e) {
      message.error('Gửi góp ý thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={visible}
      title="Góp ý - Phản hồi nội dung"
      onCancel={onClose}
      footer={null}
      width={520}
      className={styles.feedbackModal}
    >
      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Số điện thoại" required>
          <Input
            placeholder="Ví dụ: +84901234567 hoặc 0901234567"
            value={feedbackPhone}
            onChange={(e) => setFeedbackPhone(e.target.value)}
          />
        </Form.Item>

        <Form.Item label="Nội dung góp ý" required>
          <TextArea
            placeholder="Nêu rõ góp ý/feedback của bạn về nội dung..."
            rows={4}
            value={feedbackContent}
            onChange={(e) => setFeedbackContent(e.target.value)}
          />
        </Form.Item>

        <Form.Item label="Email liên hệ" required help="Chúng tôi sẽ liên hệ qua email này">
          <Input
            placeholder="name@example.com"
            type="email"
            value={feedbackEmail}
            onChange={(e) => setFeedbackEmail(e.target.value)}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={submitting}>Gửi góp ý</Button>
        </div>
      </Form>
    </Modal>
  );
};

export default FeedbackModal;
