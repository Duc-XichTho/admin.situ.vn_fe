import React, { useState, useEffect } from 'react';
import { MODEL_AI_LIST } from '../../Admin/AIGen/AI_CONST';
import { getSettingByType, createOrUpdateSetting } from '../../../apis/settingService';
import styles from './CaseUser.module.css';
import { Modal } from 'antd';

const SettingsModal = ({ isMobile, isOpen, onClose }) => {
	const [settings, setSettings] = useState({
		// AI settings
		selectedModel: '',
		prompt: '',
		// Question count settings
		mcqCount: 5,
		essayCount: 2
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	// Load existing settings on modal open
	useEffect(() => {
		if (isOpen) {
			loadSettings();
		}
	}, [isOpen]);

	const loadSettings = async () => {
		try {
			// Load AI settings from database
			const aiSettings = await getSettingByType('ai_settings_for_user');
			if (aiSettings && aiSettings.setting) {
				setSettings({
					selectedModel: aiSettings.setting.selectedModel || '',
					prompt: aiSettings.setting.prompt || '',
					mcqCount: aiSettings.setting.mcqCount || 5,
					essayCount: aiSettings.setting.essayCount || 2
				});
			}
		} catch (error) {
			console.error('Error loading settings:', error);
			// If no settings found, keep default empty values
		}
	};

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setSettings(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value
		}));
	};

	const handleNumberChange = (e) => {
		const { name, value } = e.target;
		const numValue = parseInt(value) || 0;
		setSettings(prev => ({
			...prev,
			[name]: numValue
		}));
	};

	const handleSave = async () => {
		setLoading(true);
		setError('');
		setSuccess('');

		try {
			// Save settings to database
			const settingData = {
				type: 'ai_settings_for_user',
				setting: {
					selectedModel: settings.selectedModel,
					prompt: settings.prompt,
					mcqCount: settings.mcqCount,
					essayCount: settings.essayCount
				}
			};

			await createOrUpdateSetting(settingData);

			setSuccess('Cài đặt đã được lưu thành công!');
			setTimeout(() => {
				onClose();
			}, 1500);
		} catch (error) {
			console.error('Error saving settings:', error);
			setError('Có lỗi xảy ra khi lưu cài đặt. Vui lòng thử lại.');
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<Modal
			title={`Cài đặt AI`}
			open={isOpen}
			onCancel={onClose}
			footer={null}
			width={800}
			style={{
				...(isMobile && { top: '30px' })
			}}
		>
			<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modalBody}>
					{error && (
						<div className={styles.errorMessage}>
							{error}
						</div>
					)}
					{success && (
						<div className={styles.successMessage}>
							{success}
						</div>
					)}

					{/* AI Settings */}
					<div className={styles.settingsSection}>
						<h4>1. Cài đặt AI</h4>
						<div className={styles.formGroup}>
							<label>Model AI *</label>
							<select
								name="selectedModel"
								value={settings.selectedModel}
								onChange={handleInputChange}
								required
							>
								<option value="">Chọn model AI</option>
								{MODEL_AI_LIST.map(model => (
									<option key={model.id} value={model.value}>
										{model.name} - ({model.value})
									</option>
								))}
							</select>
						</div>
						<div className={styles.formGroup}>
							<label>Prompt yêu cầu *</label>
							<textarea
								name="prompt"
								value={settings.prompt}
								onChange={handleInputChange}
								placeholder="Nhập prompt yêu cầu cho AI..."
								rows={6}
								required
							/>
						</div>
					</div>

					{/* Question Count Settings */}
					{/* <div className={styles.settingsSection}>
						<h4>2. Cài đặt số lượng câu hỏi</h4>
						<div className={styles.formGroup}>
							<label>Số lượng câu hỏi trắc nghiệm (MCQ) *</label>
							<input
								type="number"
								name="mcqCount"
								value={settings.mcqCount}
								onChange={handleNumberChange}
								min="1"
								max="20"
								required
							/>
							<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
								* Số lượng câu hỏi trắc nghiệm sẽ được tạo ra (1-20 câu)
							</div>
						</div>
						<div className={styles.formGroup}>
							<label>Số lượng câu hỏi tự luận (Essay) *</label>
							<input
								type="number"
								name="essayCount"
								value={settings.essayCount}
								onChange={handleNumberChange}
								min="1"
								max="10"
								required
							/>
							<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
								* Số lượng câu hỏi tự luận sẽ được tạo ra (1-10 câu)
							</div>
						</div>
					</div> */}
				</div>
				<div className={styles.modalFooter}>
					<button
						type="button"
						className={styles.btn}
						onClick={onClose}
					>
						Hủy
					</button>
					<button
						type="button"
						className={`${styles.btn} ${styles.btnPrimary}`}
						onClick={handleSave}
						disabled={loading || !settings.selectedModel || !settings.prompt || !settings.mcqCount || !settings.essayCount}
					>
						{loading ? 'Đang lưu...' : 'Lưu cài đặt'}
					</button>
				</div>
			</div>
		</Modal>

	);
};

export default SettingsModal;
