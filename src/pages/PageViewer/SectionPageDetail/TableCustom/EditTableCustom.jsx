import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Select, Upload, message, Switch } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { uploadFiles } from '../../../../apis/uploadImageWikiNoteService.jsx';
import { ICON_SIDEBAR_LIST } from '../../../../icon/IconSvg.jsx';

const { Option } = Select;

export default function EditTableCustom({ isOpen, fieldConfigs, onClose, onSave, existingData }) {
	const [formData, setFormData] = useState({});
	const [fileList, setFileList] = useState({
		dinh_kem: [],
		anh_minh_hoa: [],
	});
	const [tieuDe, setTieuDe] = useState('');
	const [downloadable, setDownloadable] = useState(true);
	const [selectedIcon, setSelectedIcon] = useState( null);

	useEffect(() => {
		if (existingData) {
			setFormData(existingData?.info || {});
			setFileList({
				dinh_kem: formatFileList(existingData?.info?.dinh_kem, true),
				anh_minh_hoa: formatFileList(existingData?.info?.anh_minh_hoa),
			});
			setSelectedIcon(existingData?.icon)
			setTieuDe(existingData?.name || '');
			// Set downloadable from existingData
			const dk = existingData?.info?.dinh_kem;
			if (Array.isArray(dk) && dk[0]?.downloadable !== undefined) {
				setDownloadable(dk[0].downloadable);
			} else {
				setDownloadable(true);
			}
		}
	}, [existingData]);

	const formatFileList = (files, isDinhKem = false) => {
		if (isDinhKem && Array.isArray(files) && files[0]?.files) {
			return files[0].files.map(file => ({
				uid: file.fileName,
				name: file.fileName,
				status: 'done',
				url: file.fileUrl,
				type: file.fileExtension,
			}));
		}
		return files?.map(file => ({
			uid: file.fileName,
			name: file.fileName,
			status: 'done',
			url: file.fileUrl,
			type: file.fileExtension,
		})) || [];
	};

	const handleFieldChange = (key, value) => {
		setFormData(prevData => ({ ...prevData, [key]: value }));
	};

	const handleFileChange = (key, info) => {
		if (key === 'anh_minh_hoa') {
			setFileList(prev => ({ ...prev, [key]: info.fileList.slice(-1) }));
		} else {
			setFileList(prev => ({ ...prev, [key]: info.fileList }));
		}
	};

	const handleSave = async () => {
		const missingRequiredFields = fieldConfigs.filter(field => {
			if (field.key === 'tieu_de') return false;
			if (!field.show || field.key === 'time' || !field.required) return false;
			if (['attachment', 'dinh_kem'].includes(field.key) && !fileList[field.key]?.length) return true;
			if (['anh_minh_hoa', 'image'].includes(field.key) && !fileList[field.key]?.length) return true;
			return !formData[field.key];
		});
		if (missingRequiredFields.length > 0) {
			message.error('Vui lòng điền đầy đủ các trường bắt buộc.');
			return;
		}

		const updatedData = { ...formData };
		for (const field of fieldConfigs) {
			const key = field.key;

			if (!updatedData[key] && updatedData[key] !== 0) {
				updatedData[key] = null;
			}

			if (key === 'anh_minh_hoa' || key === 'dinh_kem') {
				const files = fileList[key]?.map(f => f.originFileObj).filter(f => f?.lastModifiedDate).filter(Boolean);
				if (files.length === 0) {
					const data = fileList[key]?.map(file => ({
						fileUrl: file.url,
						fileName: file.name,
						fileExtension: file.type,
					}));
					if (key === 'dinh_kem') {
						updatedData[key] = data && data.length > 0 ? [{ files: data, downloadable }] : [];
					} else {
						updatedData[key] = data;
					}
				} else {
					const result = await uploadFiles(files);
					const newFilesData = result?.files.map(f => ({
						fileUrl: f.fileUrl,
						fileName: f.fileName,
						fileExtension: f.fileExtension,
					}));
					if (key === 'anh_minh_hoa') {
						updatedData[key] = newFilesData;
					} else if (key === 'dinh_kem') {
						const updatedFileList = [...fileList[key]].filter(file => {
							return !files.some(newFile => newFile.name === file.name);
						}).map(file => ({
							fileUrl: file.url,
							fileName: file.name,
							fileExtension: file.type,
						}));

						const combinedFiles = [
							...updatedFileList,
							...newFilesData,
						];

						updatedData[key] = combinedFiles && combinedFiles.length > 0 ? [{ files: combinedFiles, downloadable }] : [];
					}
				}
			}
		}
		onSave({ ...updatedData, icon: selectedIcon }, tieuDe);
		onClose();
	};

	return (
		<Modal title='Chỉnh sửa thông tin' open={isOpen} onCancel={onClose} footer={null} width={600}>
			<div style={{
				display: 'flex',
				flexDirection: 'column',
				gap: 16,
				height: '60vh',
				overflow: 'auto',
				padding: '20px',
			}}>
				<label style={{ fontWeight: 600 }}>
					Tiêu đề  <span style={{ color: 'red' }}>*</span>
				</label>
				<Input
					value={tieuDe}
					onChange={e => setTieuDe(e.target.value)}
					placeholder={`Nhập tiêu đề`}
				/>
				<div style={{ marginBottom: 16 }}>
					<div style={{
						marginBottom: 8,
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}>
						<span>Chọn biểu tượng:</span>
						{selectedIcon && (
							<Button
								type="text"
								danger
								size="small"
								onClick={() => setSelectedIcon(null)}
							>
								Xóa icon
							</Button>
						)}
					</div>
					<div style={{
						display: 'flex',
						gap: 8,
						flexWrap: 'wrap',
						maxHeight: '120px',
						overflowY: 'auto',
						padding: '8px',
						border: '1px solid #d9d9d9',
						borderRadius: '4px',
					}}>
						{ICON_SIDEBAR_LIST.map(({ name, icon }) => (
							<div
								key={name}
								onClick={() => setSelectedIcon(name)}
								style={{
									padding: '8px',
									cursor: 'pointer',
									border: selectedIcon == name ? '2px solid #1890ff' : '2px solid transparent',
									borderRadius: '4px',
								}}
							>
								<img
									src={icon}
									alt={name}
									width={20}
									height={20}
								/>
							</div>
						))}
					</div>
				</div>

				{fieldConfigs.map(
					field =>
						field.show && field.key !== 'time' && field.key !== 'xac_nhan' && field.key !== 'public_access' && field.key !== 'tieu_de' && (
							<div key={field.key} style={{ display: 'flex', flexDirection: 'column' }}>
								<label style={{ fontWeight: 600 }}>
									{field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
								</label>
								{['dinh_kem', 'anh_minh_hoa'].includes(field.key) ? (
									<>
										<Upload
											multiple={field.key === 'dinh_kem'}
											fileList={fileList[field.key] || []}
											onChange={info => handleFileChange(field.key, info)}
											beforeUpload={() => false}
										>
											<Button icon={<UploadOutlined />}>
												{field.key === 'dinh_kem' ? 'Tải đính kèm' : 'Tải ảnh minh họa'}
											</Button>
										</Upload>
										{field.key === 'dinh_kem' && (
											<div style={{ marginTop: 8 }}>
												<span style={{ marginRight: 8 }}>Cho phép tải về</span>
												<Switch checked={downloadable} onChange={checked => setDownloadable(checked)} />
											</div>
										)}
									</>
								) : field.options ? (
									<Select
										value={formData[field.key]}
										onChange={value => handleFieldChange(field.key, value)}
										style={{ width: '100%' }}
										placeholder={`Chọn ${field.label}`}
									>
										{field.options.map(opt => (
											<Option key={opt} value={opt}>
												{opt}
											</Option>
										))}
									</Select>
								) : (
									<Input
										value={field.key === 'gia_tri' ? formData[field.key]?.toLocaleString('vi-VN') || '' : formData[field.key] || ''}
										onChange={e => {
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
								{/*<div style={{ marginBottom: 16 }}>*/}
								{/*	<div style={{*/}
								{/*		marginBottom: 8,*/}
								{/*		display: 'flex',*/}
								{/*		justifyContent: 'space-between',*/}
								{/*		alignItems: 'center',*/}
								{/*	}}>*/}
								{/*		<span>Chọn biểu tượng:</span>*/}
								{/*		{selectedIcon && (*/}
								{/*			<Button*/}
								{/*				type="text"*/}
								{/*				danger*/}
								{/*				size="small"*/}
								{/*				onClick={() => setSelectedIcon(null)}*/}
								{/*			>*/}
								{/*				Xóa icon*/}
								{/*			</Button>*/}
								{/*		)}*/}
								{/*	</div>*/}
								{/*	<div style={{*/}
								{/*		display: 'flex',*/}
								{/*		gap: 8,*/}
								{/*		flexWrap: 'wrap',*/}
								{/*		maxHeight: '120px',*/}
								{/*		overflowY: 'auto',*/}
								{/*		padding: '8px',*/}
								{/*		border: '1px solid #d9d9d9',*/}
								{/*		borderRadius: '4px',*/}
								{/*	}}>*/}
								{/*		{ICON_SIDEBAR_LIST.map(({ name, icon }) => (*/}
								{/*			<div*/}
								{/*				key={name}*/}
								{/*				onClick={() => setSelectedIcon(name)}*/}
								{/*				style={{*/}
								{/*					padding: '8px',*/}
								{/*					cursor: 'pointer',*/}
								{/*					border: selectedIcon == name ? '2px solid #1890ff' : '2px solid transparent',*/}
								{/*					borderRadius: '4px',*/}
								{/*				}}*/}
								{/*			>*/}
								{/*				<img*/}
								{/*					src={icon}*/}
								{/*					alt={name}*/}
								{/*					width={20}*/}
								{/*					height={20}*/}
								{/*				/>*/}
								{/*			</div>*/}
								{/*		))}*/}
								{/*	</div>*/}
								{/*</div>*/}
							</div>
						),
				)}
			</div>
			<div style={{ marginTop: 24, textAlign: 'right' }}>
				<Button type='primary' onClick={handleSave}>
					Lưu
				</Button>
			</div>
		</Modal>
	);
}