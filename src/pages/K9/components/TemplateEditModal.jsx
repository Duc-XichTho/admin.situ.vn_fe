import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Form, message } from 'antd';
import styles from './TemplateEditModal.module.css';

const TemplateEditModal = ({ visible, onCancel, onConfirm, template, onCreateNewSession }) => {
	const [form] = Form.useForm();
	const [templateParts, setTemplateParts] = useState([]);
	const [placeholders, setPlaceholders] = useState([]);
	const firstInputRef = useRef(null);

	useEffect(() => {
		if (visible && template) {
			// Parse template để tách các phần text và placeholders
			const parts = [];
			const placeholderValues = [];
			let currentIndex = 0;
			let placeholderIndex = 0;

			const templateText = template.template;
			const regex = /&&&/g;
			let match;

			while ((match = regex.exec(templateText)) !== null) {
				// Thêm text trước placeholder
				if (match.index > currentIndex) {
					parts.push({
						type: 'text',
						content: templateText.substring(currentIndex, match.index)
					});
				}

				// Thêm placeholder
				parts.push({
					type: 'placeholder',
					index: placeholderIndex,
					content: '&&&'
				});

				placeholderValues.push('');
				placeholderIndex++;
				currentIndex = match.index + 3; // 3 là độ dài của "&&&"
			}

			// Thêm text còn lại sau placeholder cuối
			if (currentIndex < templateText.length) {
				parts.push({
					type: 'text',
					content: templateText.substring(currentIndex)
				});
			}

			setTemplateParts(parts);
			setPlaceholders(placeholderValues);

			// Reset form values
			const initialValues = {};
			placeholderValues.forEach((_, index) => {
				initialValues[`placeholder_${index}`] = '';
			});
			form.setFieldsValue(initialValues);
		}
	}, [visible, template, form]);

	// Auto focus vào input đầu tiên khi modal mở
	useEffect(() => {
		if (visible && placeholders.length > 0) {
			setTimeout(() => {
				if (firstInputRef.current) {
					firstInputRef.current.focus();
				}
			}, 100);
		}
	}, [visible, placeholders.length]);

	const handlePlaceholderChange = (index, value) => {
		const newPlaceholders = [...placeholders];
		newPlaceholders[index] = value;
		setPlaceholders(newPlaceholders);
	};

	const handleConfirm = () => {
		// Kiểm tra xem tất cả placeholder đã được điền chưa
		const emptyPlaceholders = placeholders.some(p => !p.trim());
		if (emptyPlaceholders) {
			message.warning('Vui lòng điền đầy đủ thông tin vào tất cả các trường');
			return;
		}

		// Tạo template đã được điền
		let filledTemplate = '';
		let placeholderIndex = 0;

		templateParts.forEach(part => {
			if (part.type === 'text') {
				filledTemplate += part.content;
			} else if (part.type === 'placeholder') {
				filledTemplate += placeholders[placeholderIndex];
				placeholderIndex++;
			}
		});

		onConfirm(filledTemplate);
		handleCancel();
	};

	const handleCreateNewSession = () => {
		// Kiểm tra xem tất cả placeholder đã được điền chưa
		const emptyPlaceholders = placeholders.some(p => !p.trim());
		if (emptyPlaceholders) {
			message.warning('Vui lòng điền đầy đủ thông tin vào tất cả các trường');
			return;
		}

		// Tạo template đã được điền
		let filledTemplate = '';
		let placeholderIndex = 0;

		templateParts.forEach(part => {
			if (part.type === 'text') {
				filledTemplate += part.content;
			} else if (part.type === 'placeholder') {
				filledTemplate += placeholders[placeholderIndex];
				placeholderIndex++;
			}
		});

		onCreateNewSession(filledTemplate);
		handleCancel();
	};

	const handleCancel = () => {
		form.resetFields();
		setPlaceholders([]);
		setTemplateParts([]);
		onCancel();
	};

	const handleKeyDown = (e, index) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (index < placeholders.length - 1) {
				// Focus vào input tiếp theo
				const nextInput = document.querySelector(`input[name="placeholder_${index + 1}"]`);
				if (nextInput) {
					nextInput.focus();
				}
			} else {
				// Nếu là input cuối cùng, thực hiện confirm
				handleConfirm();
			}
		} else if (e.key === 'Tab') {
			// Cho phép Tab bình thường để chuyển giữa các input
			return;
		}
	};

	return (
		<Modal
			title="Điền thông tin template"
			open={visible}
			onCancel={handleCancel}
			footer={[
				<Button key="cancel" onClick={handleCancel}>
					Hủy
				</Button>,
				<Button key="confirm" type="primary" onClick={handleConfirm}>
					Áp dụng
				</Button>,
				<Button key="newSession" type="default" onClick={handleCreateNewSession}>
					Tạo chat mới
				</Button>
			]}
			width={600}
			className={styles.templateEditModal}
		>
			<div className={styles.modalContent}>
				<div className={styles.templatePreview}>
					<h4>Template: {template?.label}</h4>
					<div className={styles.previewText}>
						{templateParts.map((part, index) => (
							<span key={index}>
								{part.type === 'text' ? (
									part.content
								) : (
									<span className={styles.placeholderHighlight}>
										[{part.index + 1}]
									</span>
								)}
							</span>
						))}
					</div>
				</div>

				{placeholders.length > 0 && (
					<Form form={form} layout="vertical" className={styles.placeholderForm}>
						<div className={styles.instructionText}>
							<small>💡 Nhập thông tin vào các trường bên dưới. Bấm Tab để chuyển trường, Enter để áp dụng.</small>
						</div>
						{placeholders.map((placeholder, index) => (
							<Form.Item
								key={index}
								label={`Thông tin ${index + 1}:`}
								name={`placeholder_${index}`}
								rules={[{ required: true, message: 'Vui lòng điền thông tin này' }]}
							>
								<Input
									ref={index === 0 ? firstInputRef : null}
									placeholder={`Nhập thông tin cho vị trí ${index + 1}...`}
									value={placeholder}
									onChange={(e) => handlePlaceholderChange(index, e.target.value)}
									onKeyDown={(e) => handleKeyDown(e, index)}
									autoComplete="off"
								/>
							</Form.Item>
						))}
					</Form>
				)}
			</div>
		</Modal>
	);
};

export default TemplateEditModal;
