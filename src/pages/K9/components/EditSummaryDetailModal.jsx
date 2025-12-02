import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, message, Divider } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { updateK9 } from '../../../apis/k9Service.jsx';
import styles from '../K9.module.css';
import modalStyles from './EditDetailModal.module.css';

const { TextArea } = Input;

const EditSummaryDetailModal = ({
    visible,
    onClose,
    item,
    onUpdate
}) => {
    const [summaryDetail, setSummaryDetail] = useState('');
    const [loading, setLoading] = useState(false);

    // Cấu hình marked với katex extension
    marked.use(markedKatex({
        throwOnError: false,
        strict: false,
        trust: true
    }));

    // Hàm xử lý LaTeX trước khi parse với marked
    const preprocessLatex = (text) => {
        if (!text) return text;

        // Thay thế $$...$$ bằng placeholder để tránh double processing
        let processedText = text;
        const latexBlocks = [];

        // Tìm và thay thế display math ($$...$$)
        processedText = processedText.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
            const placeholder = `LATEX_DISPLAY_${latexBlocks.length}`;
            latexBlocks.push({ placeholder, formula, display: true });
            return placeholder;
        });

        // Tìm và thay thế inline math ($...$)
        processedText = processedText.replace(/\$([^$]+)\$/g, (match, formula) => {
            const placeholder = `LATEX_INLINE_${latexBlocks.length}`;
            latexBlocks.push({ placeholder, formula, display: false });
            return placeholder;
        });

        return { processedText, latexBlocks };
    };

    // Hàm khôi phục LaTeX sau khi parse với marked
    const postprocessLatex = (html, latexBlocks) => {
        if (!latexBlocks || latexBlocks.length === 0) return html;

        let result = html;

        // Replace ngược lại: từ placeholder về LaTeX đã render
        latexBlocks.forEach(({ placeholder, formula, display }) => {
            try {
                const renderedLatex = katex.renderToString(formula, {
                    throwOnError: false,
                    displayMode: display,
                    strict: false,
                    trust: true
                });

                // Tìm và replace tất cả các phiên bản của placeholder (có thể bị marked escape)
                result = result.replace(new RegExp(placeholder, 'g'), renderedLatex);
            } catch (error) {
                // ignore
            }
        });

        return result;
    };

    // Khởi tạo summaryDetail khi modal mở
    useEffect(() => {
        if (visible && item) {
            setSummaryDetail(item.summaryDetail || '');
        }
    }, [visible, item]);

    // Xử lý lưu
    const handleSave = async () => {
        if (!item || !item.id) {
            message.error('Không tìm thấy thông tin item để cập nhật!');
            return;
        }

        setLoading(true);
        try {
            const response = await updateK9({ id: item.id, summaryDetail: summaryDetail });

            if (response) {
                message.success('Cập nhật SummaryDetail thành công!');

                // Cập nhật item với summaryDetail mới
                const updatedItem = { ...item, summaryDetail };

                // Gọi callback để cập nhật state ở component cha
                if (onUpdate) {
                    onUpdate(updatedItem);
                }

                onClose();
            } else {
                message.error('Có lỗi khi cập nhật SummaryDetail!');
            }
        } catch (error) {
            message.error('Có lỗi khi cập nhật SummaryDetail!');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý đóng modal
    const handleClose = () => {
        setSummaryDetail('');
        onClose();
    };

    return (
        <Modal
            className={modalStyles.editDetailModal}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <EditOutlined style={{ color: '#52c41a' }} />
                    <span>Chỉnh sửa SummaryDetail - {item?.title}</span>
                </div>
            }
            open={visible}
            onCancel={handleClose}
            width="90%"
            top={10}
            footer={[
                <Button key="cancel" onClick={handleClose} icon={<CloseOutlined />}>Hủy</Button>,
                <Button key="save" type="primary" onClick={handleSave} loading={loading} icon={<SaveOutlined />}>Lưu thay đổi</Button>
            ]}
            destroyOnClose={true}
        >
            <div style={{ display: 'flex', height: '100%', gap: '16px' }}>
                {/* Panel trái - Raw content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#262626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>📝</span>
                        <span>Nội dung gốc (Markdown + LaTeX)</span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <TextArea
                            value={summaryDetail}
                            onChange={(e) => setSummaryDetail(e.target.value)}
                            placeholder="Nhập nội dung SummaryDetail..."
                            style={{
                                overflowY: 'auto',
                                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                height: '100%'
                            }}
                        />
                    </div>

                </div>

                <Divider type="vertical" style={{ height: 'auto' }} />

                {/* Panel phải - Formatted content */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#262626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>👁️</span>
                        <span>Xem trước (Formatted)</span>
                    </div>
                    <div
                        className={styles.markdownContent}
                        style={{ overflow: 'auto' }}
                        dangerouslySetInnerHTML={{
                            __html: (() => {
                                if (!summaryDetail) return '<div style="color: #999; font-style: italic;">Nhập nội dung để xem trước...</div>';

                                const { processedText, latexBlocks } = preprocessLatex(summaryDetail);
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
            </div>
        </Modal>
    );
};

export default EditSummaryDetailModal;

