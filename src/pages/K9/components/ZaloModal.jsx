import React, { useState, useEffect } from 'react';
import styles from './ZaloModal.module.css';
import { createOrUpdateSetting, getSettingByType } from '../../../apis/settingService';
import { uploadFiles } from '../../../apis/aiGen/uploadImageWikiNoteService';

const ZaloModal = ({ visible, onClose, currentUser }) => {
	const [zaloInfo, setZaloInfo] = useState({
		phone: '0123456789',
		image: '/Logo.png',
		text: 'Liên hệ với chúng tôi qua Zalo để được hỗ trợ tốt nhất!'
	});
	const [isEditing, setIsEditing] = useState(false);
	const [editForm, setEditForm] = useState({ ...zaloInfo });
	const [loading, setLoading] = useState(false);
	const [imageUploading, setImageUploading] = useState(false);

	useEffect(() => {
		// Load zalo info from settings
		const loadZaloInfo = async () => {
			try {
				const zaloSetting = await getSettingByType('ZALO_INFO');
				if (zaloSetting?.setting) {
					setZaloInfo(zaloSetting.setting);
					setEditForm(zaloSetting.setting);
				}
			} catch (error) {
				console.error('Error loading zalo info from settings:', error);
				// Fallback to localStorage if settings fail
				try {
					const saved = localStorage.getItem('zaloInfo');
					if (saved) {
						const parsed = JSON.parse(saved);
						setZaloInfo(parsed);
						setEditForm(parsed);
					}
				} catch (localError) {
					console.error('Error loading from localStorage:', localError);
				}
			}
		};

		loadZaloInfo();
	}, []);

	const handleCopyPhone = async () => {
		try {
			await navigator.clipboard.writeText(zaloInfo.phone);
			// Show success message
			alert('Đã sao chép số điện thoại!');
		} catch (error) {
			console.error('Error copying phone:', error);
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = zaloInfo.phone;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			alert('Đã sao chép số điện thoại!');
		}
	};

	const handleEdit = () => {
		setIsEditing(true);
		setEditForm({ ...zaloInfo });
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditForm({ ...zaloInfo });
	};

	const handleSave = async () => {
		setLoading(true);
		try {
			// Save to settings using createOrUpdateSetting
			await createOrUpdateSetting({
				type: 'ZALO_INFO',
				setting: editForm
			});
			
			// Also save to localStorage as backup
			localStorage.setItem('zaloInfo', JSON.stringify(editForm));
			setZaloInfo(editForm);
			setIsEditing(false);
			alert('Đã lưu thông tin Zalo!');
		} catch (error) {
			console.error('Error saving zalo info to settings:', error);
			// Fallback to localStorage only
			try {
				localStorage.setItem('zaloInfo', JSON.stringify(editForm));
				setZaloInfo(editForm);
				setIsEditing(false);
				alert('Đã lưu thông tin vào bộ nhớ cục bộ!');
			} catch (localError) {
				console.error('Error saving to localStorage:', localError);
				alert('Có lỗi xảy ra khi lưu!');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleImageChange = async (e) => {
		console.log(e)
		const file = e.target.files[0];
		if (file) {
			setImageUploading(true);
			try {
				// Upload image to server
				const uploadResult = await uploadFiles([file]);
				if (uploadResult && uploadResult.files && uploadResult.files.length > 0) {
					// Get the uploaded image URL from the response
					const imageUrl = uploadResult.files[0].fileUrl;
					const fileName = uploadResult.files[0].fileName;
					
					setEditForm(prev => ({
						...prev,
						image: imageUrl
					}));
					
					// Show success message with file info
					console.log(`✅ Upload thành công: ${fileName}`);
				} else {
					throw new Error('Upload failed - no response data');
				}
			} catch (error) {
				console.error('Error uploading image:', error);
				alert('Có lỗi xảy ra khi upload ảnh!');
				
				// Fallback to local preview if upload fails
				const reader = new FileReader();
				reader.onload = (e) => {
					setEditForm(prev => ({
						...prev,
						image: e.target.result
					}));
				};
				reader.readAsDataURL(file);
			} finally {
				setImageUploading(false);
			}
		}
	};

	if (!visible) return null;

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.header}>
					<h3>Liên hệ qua Zalo</h3>
					<button className={styles.closeButton} onClick={onClose}>
						×
					</button>
				</div>

				<div className={styles.content}>
					{!isEditing ? (
						// View mode
						<>
							<div className={styles.imageContainer}>
								<img src={zaloInfo.image} alt="Zalo" className={styles.zaloImage} />
							</div>
							
							<div className={styles.phoneSection}>
								<h4>Số điện thoại Zalo:</h4>
								<div className={styles.phoneDisplay}>
									<span className={styles.phoneNumber}>{zaloInfo.phone}</span>
									<button 
										className={styles.copyButton}
										onClick={handleCopyPhone}
									>
										📋 Sao chép
									</button>
								</div>
							</div>

							<div className={styles.textSection}>
								<h4>Thông tin:</h4>
								<p className={styles.zaloText}>{zaloInfo.text}</p>
							</div>

							{currentUser?.isAdmin && (
								<div className={styles.adminActions}>
									<button 
										className={styles.editButton}
										onClick={handleEdit}
									>
										Chỉnh sửa
									</button>
								</div>
							)}
						</>
					) : (
						// Edit mode (admin only)
						<>
							<div className={styles.imageContainer}>
								<img src={editForm.image} alt="Zalo" className={styles.zaloImage} />
								<input
									type="file"
									accept=".jpg,.jpeg,.png,.gif,.webp"
									onChange={handleImageChange}
									className={styles.imageInput}
									id="imageInput"
									disabled={imageUploading}
								/>
								<label 
									htmlFor="imageInput" 
									className={`${styles.imageUploadLabel} ${imageUploading ? styles.disabled : ''}`}
								>
									{imageUploading ? '⏳ Đang upload...' : '📷 Thay đổi ảnh'}
								</label>
							</div>

							<div className={styles.editForm}>
								<div className={styles.inputGroup}>
									<label htmlFor="phone">Số điện thoại:</label>
									<input
										type="tel"
										id="phone"
										value={editForm.phone}
										onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
										placeholder="Nhập số điện thoại"
									/>
								</div>

								<div className={styles.inputGroup}>
									<label htmlFor="text">Thông tin:</label>
									<textarea
										id="text"
										value={editForm.text}
										onChange={(e) => setEditForm(prev => ({ ...prev, text: e.target.value }))}
										placeholder="Nhập thông tin"
										rows={3}
									/>
								</div>
							</div>

							<div className={styles.editActions}>
								<button 
									className={styles.cancelButton}
									onClick={handleCancelEdit}
								>
									Hủy
								</button>
								<button 
									className={styles.saveButton}
									onClick={handleSave}
									disabled={loading}
								>
									{loading ? 'Đang lưu...' : 'Lưu'}
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default ZaloModal;
