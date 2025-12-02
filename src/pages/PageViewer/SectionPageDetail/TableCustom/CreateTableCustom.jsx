import React, { useState } from 'react';
import { Modal, Input, Button, Select, Upload, message, Switch } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { uploadFiles } from '../../../../apis/uploadImageWikiNoteService.jsx';

const { Option } = Select;

export default function CreateTableCustom({ isOpen, fieldConfigs, onClose, onSave }) {
	const [formData, setFormData] = useState({});
	const [fileList, setFileList] = useState({});
	const [downloadable, setDownloadable] = useState({});

	const handleFieldChange = (key, value) => {
		setFormData((prevData) => ({ ...prevData, [key]: value }));
	};

	const handleFileChange = (key, info) => {
		setFileList((prev) => ({ ...prev, [key]: info.fileList }));
	};

	const handleDownloadableChange = (key, checked) => {
		setDownloadable(prev => ({ ...prev, [key]: checked }));
	};

	const handleSave = async () => {
		const missingRequiredFields = fieldConfigs.filter((field) => {
			if (!field.show || field.key === 'time' || !field.required) return false;

			if (
				['attachment', 'dinh_kem'].includes(field.key) &&
				!fileList[field.key]?.length
			) {
				return true;
			}

			if (
				['anh_minh_hoa', 'image'].includes(field.key) &&
				!fileList[field.key]?.length
			) {
				return true;
			}

			return !formData[field.key];
		});


		if (missingRequiredFields.length > 0) {
			message.error('Vui lòng điền đầy đủ các trường bắt buộc.');
			return;
		}

		const updatedData = { ...formData };

		// Duyệt qua các trường và kiểm tra nếu không có dữ liệu thì gán null
		for (const field of fieldConfigs) {
			const key = field.key;
			if (!updatedData[key] && updatedData[key] !== 0) {
				updatedData[key] = null; // Gán null nếu không có dữ liệu
			}

			const files = fileList[key]?.map((f) => f.originFileObj).filter(Boolean);

			if (['attachment', 'dinh_kem'].includes(key) && files?.length) {
				let result = await uploadFiles(files);
				if (!Array.isArray(result)) {
					result = [result]; // Ensure result is always an array
				}
				// Add downloadable property to each file object
				updatedData[key] = result.map(file => ({
					...file,
					downloadable: downloadable[key] ?? true, // default true if not set
				}));
			}

			if (['anh_minh_hoa', 'image'].includes(key) && files?.length) {
				const result = await uploadFiles(files);
				updatedData[key] = result;
			}
		}

		// Gọi hàm onSave với updatedData
		onSave(updatedData);
		onClose();
	};


	return (
		<Modal title="Thêm mới" open={isOpen} onCancel={onClose} footer={null} width={600}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '60vh', overflow: 'auto', padding: '20px' }}>
				{fieldConfigs.map(
					(field) =>
						field.show && field.key !== 'time' && field.key !== 'xac_nhan' && field.key !== 'public_access' &&(
							<div key={field.key} style={{ display: 'flex', flexDirection: 'column' }}>
								<label style={{ fontWeight: 600 }}>
									{field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
								</label>

								{['attachment', 'dinh_kem'].includes(field.key) ? (
									<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
										<Upload
											multiple
											fileList={fileList[field.key] || []}
											onChange={(info) => handleFileChange(field.key, info)}
											beforeUpload={() => false}
										>
											<Button icon={<UploadOutlined />}>Tải đính kèm</Button>
										</Upload>
										<Switch
											checked={downloadable[field.key] ?? true}
											onChange={checked => handleDownloadableChange(field.key, checked)}
											style={{ marginLeft: 8 }}
										/>
										<span style={{ marginLeft: 4 }}>Cho phép tải về</span>
									</div>
								) : ['anh_minh_hoa', 'image'].includes(field.key) ? (
									<Upload
										fileList={fileList[field.key] || []}
										onChange={(info) => handleFileChange(field.key, info)}
										beforeUpload={() => false}
										maxCount={1}
									>
										<Button icon={<UploadOutlined />}>Tải ảnh minh họa</Button>
									</Upload>
								) : field.options ? (
									<Select
										value={formData[field.key]}
										onChange={(value) => handleFieldChange(field.key, value)}
										style={{ width: '100%' }}
										placeholder={`Chọn ${field.label}`}
									>
										{field.options.map((opt) => (
											<Option key={opt} value={opt}>
												{opt}
											</Option>
										))}
									</Select>
								) : (
									<Input
										value={
											field.key === 'gia_tri'
												? formData[field.key]?.toLocaleString('vi-VN') || ''
												: formData[field.key] || ''
										}
										onChange={(e) => {
											let value = e.target.value;

											if (field.key === 'gia_tri') {
												value = value.replace(/[.,\s]/g, '');
												if (!isNaN(Number(value))) {
													handleFieldChange(field.key, Number(value));
												}
											} else {
												handleFieldChange(field.key, value);
											}
										}}
										placeholder={`Nhập ${field.label}`}
									/>

								)}
							</div>
						)
				)}
				{fieldConfigs.some(field => field.key === 'time' && field.show) && (
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<label style={{ fontWeight: 600 }}>
							Thời gian
						</label>
						<Input
							type="datetime-local"
							value={formData.time || ''}
							onChange={e => handleFieldChange('time', e.target.value)}
							placeholder="Chọn thời gian"
						/>
					</div>
				)}
			</div>

			<div style={{ marginTop: 24, textAlign: 'right' }}>
				<Button type="primary" onClick={handleSave}>
					Lưu
				</Button>
			</div>
		</Modal>
	);
}
