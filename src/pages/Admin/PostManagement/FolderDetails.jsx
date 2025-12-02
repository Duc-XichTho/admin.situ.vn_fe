import { DeleteOutlined, EditOutlined, PlusOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, Modal, Popover, Spin, Table, Tag, Typography, Select } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deletePageSection, getPageSectionDataById, updatePageSection } from '../../../apis/pageSectionService';
import css from './FolderDetails.module.css';
import { Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import { createNewContentPage } from '../../../apis/contentPageService.jsx';
import { getAllPage } from '../../../apis/pageService.jsx';
import { createTimestamp } from '../../../generalFunction/format.js';
import { MyContext } from '../../../MyContext.jsx';
import { uploadFiles } from '../../../apis/uploadImageWikiNoteService.jsx';
import { ICON_SIDEBAR_LIST } from '../../../icon/IconSvg.jsx';

const { Title } = Typography;
const { TextArea } = Input;

const FolderDetails = () => {
	const { currentUser, loadData, setLoadData } = useContext(MyContext);
	const { folderId } = useParams();
	const [sectionPageData, setSectionPageData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [fieldConfigs, setFieldConfigs] = useState([]);
	const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
	const [currentFieldKey, setCurrentFieldKey] = useState(null);
	const [newOptionValue, setNewOptionValue] = useState('');
	const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [newContentName, setNewContentName] = useState('');
	const [editedName, setEditedName] = useState('');
	const [editedTag1, setEditedTag1] = useState('');
	const [editedTag2, setEditedTag2] = useState('');
	const [editedMota, setEditedMoTa] = useState('');
	const [deletePopoverVisible, setDeletePopoverVisible] = useState(false);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [pages, setPages] = useState([]);
	const [selectedPageIds, setSelectedPageIds] = useState([]);
	const navigate = useNavigate();
	const [selectedIcon, setSelectedIcon] = useState(null);
	// const [shareMode, setShareMode] = useState('user_list');
	const [selectedAllPageIds, setSelectedAllPageIds] = useState([]);
	const [selectedPrivatePageIds, setSelectedPrivatePageIds] = useState([]);
	const [editedImage, setEditedImage] = useState(null);
	const [avatar, setAvatar] = useState(null);

	const fetchSectionPageData = async () => {
		try {
			setLoading(true);
			const response = await getPageSectionDataById(folderId);
			setSectionPageData(response);
			setFieldConfigs(response?.info || []);
			setEditedName(response.name || '');
			setSelectedIcon(response.icon || '');
			setAvatar(response.avatar || null);
			setEditedTag1(response.tag1 || '');
			setEditedTag2(response.tag2 || '');
			setEditedMoTa(response.mo_ta || '');
		} catch (error) {
			console.error('Error fetching folder data:', error);
		} finally {
			setLoading(false);
		}
	};

	const fileUrl = Array.isArray(avatar) && avatar.length > 0 ? avatar[0].fileUrl : null;

	const fetchPages = async () => {
		try {
			const data = await getAllPage();
			setPages(data);

		} catch (error) {
			console.error('Error fetching pages:', error);
		}
	};

	useEffect(() => {
		if (folderId) {
			fetchSectionPageData();
			setEditedImage(null); // Reset image preview when switching sections
			setAvatar(null);      // Optionally reset avatar file input
		}
	}, [folderId]);

	// useEffect(() => {
	// 	if (isShareModalOpen) {
	// 		fetchPages();
	// 		// Set initially selected pages based on existing shared_to_page_ids and shareMode
	// 		if (sectionPageData?.shared_to_page_ids) {
	// 			if (shareMode === 'all') {
	// 				setSelectedPageIds(sectionPageData.shared_to_page_ids.all || []);
	// 			} else {
	// 				setSelectedPageIds(sectionPageData.shared_to_page_ids.private || []);
	// 			}
	// 		} else {
	// 			setSelectedPageIds([]);
	// 		}
	// 	}
	// }, [isShareModalOpen, shareMode]);

	// When opening modal, initialize both
	useEffect(() => {
		if (isShareModalOpen && sectionPageData) {
			fetchPages();
			setSelectedAllPageIds(sectionPageData.shared_to_page_ids?.all || []);
			setSelectedPrivatePageIds(sectionPageData.shared_to_page_ids?.private || []);
		}
	}, [isShareModalOpen, sectionPageData]);

// // When changing mode, update selectedPageIds for table
// 	useEffect(() => {
// 		setSelectedPageIds(shareMode === 'all' ? selectedAllPageIds : selectedPrivatePageIds);
// 	}, [shareMode, selectedAllPageIds, selectedPrivatePageIds]);


	if (loading) {
		return (
			<div style={{ padding: '24px', textAlign: 'center' }}>
				<Spin size='large' />
			</div>
		);
	}

	if (!sectionPageData) {
		return (
			<div style={{ padding: '24px', textAlign: 'center' }}>
				Không tìm thấy thông tin thư mục
			</div>
		);
	}

	const handleAddOptionClick = (key) => {
		setCurrentFieldKey(key);
		setIsOptionModalOpen(true);
		setNewOptionValue('');
	};

	const formatType = (type) => {
		switch (type) {
			case 'ListTipTap':
				return 'Kho văn bản';
			case 'TipTapRenderer':
				return 'Văn bản';
			case 'Table':
				return 'Thẻ thông tin';
			case 'Form':
				return 'Form';
			case 'File':
				return 'Kho File';
			case 'Album':
				return 'Album';
			default:
				return 'Không xác định';
		}
	};

	const handleSaveOption = async () => {
		if (!newOptionValue.trim()) return;

		let avatar = sectionPageData.avatar;
		// If an image is selected for upload
		if (editedImage && typeof editedImage !== 'string') {
			try {
				const uploadRes = await uploadFiles([editedImage]);
				const file = Array.isArray(uploadRes) ? uploadRes[0] : uploadRes;
				avatar = {
					fileUrl: file.url,
					fileName: file.name,
					fileExtension: file.type,
				};
			} catch (err) {
				message.error('Failed to upload image');
				return;
			}
		}

		const updatedConfigs = fieldConfigs.map((field) => {
			if (field.key === currentFieldKey) {
				return {
					...field,
					options: [...(field.options || []), newOptionValue],
				};
			}
			return field;
		});
		setFieldConfigs(updatedConfigs);
		const updatedSectionPageData = {
			...sectionPageData,
			info: updatedConfigs,
			avatar, // update avatar instead of icon
		};
		await updatePageSection(updatedSectionPageData);
		setIsOptionModalOpen(false);
		setEditedImage(null); // reset after save
	};

	const handleToggleShow = async (key, value) => {
		const updatedConfigs = fieldConfigs.map((field) =>
			field.key === key ? { ...field, show: value } : field,
		);
		setFieldConfigs(updatedConfigs);
		const updatedSectionPageData = {
			...sectionPageData,
			info: updatedConfigs,
		};
		await updatePageSection(updatedSectionPageData);
	};

	const handleToggleRequired = async (key, value) => {
		const updatedConfigs = fieldConfigs.map((field) =>
			field.key === key ? { ...field, required: value } : field,
		);
		setFieldConfigs(updatedConfigs);
		const updatedSectionPageData = {
			...sectionPageData,
			info: updatedConfigs,
		};
		await updatePageSection(updatedSectionPageData);
	};

	const handleAddContent = async () => {
		if (!newContentName.trim()) return;
		const newContent = {
			name: newContentName,
			id_pageSection: folderId,
			user_create: currentUser.email,
			created_at: createTimestamp(),
		};
		await createNewContentPage(newContent);
		setLoadData(!loadData);
		setNewContentName('');
		setIsAddContentModalOpen(false);
	};

	const handleEditInfo = async () => {
		if (!editedName.trim()) return;

		let avatarData = sectionPageData.avatar;
		// Only upload if avatar is a File object (new upload)
		if (avatar && avatar instanceof File) {
			try {
				const uploadRes = await uploadFiles([avatar]);
				console.log('Upload response:', uploadRes);
				
				if (uploadRes?.files && uploadRes.files.length > 0) {
					const f = uploadRes.files[0];
					avatarData = [{
						fileUrl: f.fileUrl,
						fileName: f.fileName,
						fileExtension: f.fileExtension
					}];
				} else {
					message.error('Failed to process uploaded image');
					return;
				}
			} catch (err) {
				console.error('Upload error:', err);
				message.error('Failed to upload image');
				return;
			}
		}

		try {
			const updatedSectionPageData = {
				...sectionPageData,  // Keep all existing data
				id: folderId,
				name: editedName,
				tag1: editedTag1,
				tag2: editedTag2,
				mo_ta: editedMota,
				icon: selectedIcon,
				avatar: avatarData,
			};
			
			const response = await updatePageSection(updatedSectionPageData);
			if (response?.status == 200) {
				await fetchSectionPageData();
				setLoadData(!loadData);
				setIsEditModalOpen(false);
				setAvatar(null);
				message.success('Cập nhật thông tin thành công');
			} else {
				message.error('Không thể cập nhật thông tin');
			}
		} catch (error) {
			console.error('Update error:', error);
			message.error('Không thể cập nhật thông tin');
		}
	};

	const handleDelete = async () => {
		await deletePageSection(folderId);
		setLoadData(!loadData);
		setDeletePopoverVisible(false);
		navigate('/admin/section-page/posts');
	};
	//
	// const handleShareModeChange = (mode) => {
	// 	setShareMode(mode);
	// 	if (sectionPageData?.shared_to_page_ids) {
	// 		setSelectedPageIds(
	// 			mode === 'all'
	// 				? sectionPageData.shared_to_page_ids.all || []
	// 				: sectionPageData.shared_to_page_ids.private || []
	// 		);
	// 	} else {
	// 		setSelectedPageIds([]);
	// 	}
	// };

	const handleShare = async () => {
		try {
			const shared_to_page_ids = {
				all: selectedAllPageIds,
				private: selectedPrivatePageIds,
			};
			const updatedSectionPageData = {
				...sectionPageData,
				shared_to_page_ids,
			};
			await updatePageSection(updatedSectionPageData);
			await fetchSectionPageData(); // Refresh data here
			setIsShareModalOpen(false);
			setLoadData(!loadData);
		} catch (error) {
			console.error('Error sharing section:', error);
		}
	};

	// const columns = [
	// 	{
	// 		title: 'Tên Page',
	// 		dataIndex: 'name',
	// 		key: 'name',
	// 		width: 500,
	// 	},
	// 	{
	// 		title: 'Người tạo',
	// 		dataIndex: 'user_create',
	// 		key: 'user_create',
	// 		width: 200,
	// 	}
	// ];

	const columns = [
		{
			title: 'Tên Page',
			dataIndex: 'name',
			key: 'name',
			width: 300,
		},
		{
			title: 'Chia sẻ với mọi người',
			dataIndex: 'shareAll',
			key: 'shareAll',
			width: 180,
			render: (_, record) => (
				<Checkbox
					checked={selectedAllPageIds.includes(record.id)}
					onChange={() => handleShareCheckboxChange(record.id, 'all')}
				/>
			),
		},
		{
			title: 'Chia sẻ với người dùng trong danh sách',
			dataIndex: 'sharePrivate',
			key: 'sharePrivate',
			width: 220,
			render: (_, record) => (
				<Checkbox
					checked={selectedPrivatePageIds.includes(record.id)}
					onChange={() => handleShareCheckboxChange(record.id, 'private')}
				/>
			),
		},
		{
			title: 'Người tạo',
			dataIndex: 'user_create',
			key: 'user_create',
			width: 200,
		},
	];

	const handleShareCheckboxChange = (pageId, type) => {
		if (type === 'all') {
			setSelectedAllPageIds(prev =>
				prev.includes(pageId) ? prev.filter(id => id !== pageId) : [...prev, pageId],
			);
			// Remove from private if added to all
			setSelectedPrivatePageIds(prev => prev.filter(id => id !== pageId));
		} else if (type === 'private') {
			setSelectedPrivatePageIds(prev =>
				prev.includes(pageId) ? prev.filter(id => id !== pageId) : [...prev, pageId],
			);
			// Remove from all if added to private
			setSelectedAllPageIds(prev => prev.filter(id => id !== pageId));
		}
	};
	// const rowSelection = {
	// 	selectedRowKeys: selectedPageIds,
	// 	onChange: (selectedRowKeys) => {
	// 		setSelectedPageIds(selectedRowKeys);
	// 	},
	// };

	// When selecting for 'all'
	const handleAllSelection = (selectedIds) => {
		// Remove selectedIds from private list
		const newPrivate = selectedPrivatePageIds.filter(id => !selectedIds.includes(id));
		setSelectedAllPageIds(selectedIds);
		setSelectedPrivatePageIds(newPrivate);
		setSelectedPageIds(selectedIds);
	};

// When selecting for 'private'
	const handlePrivateSelection = (selectedIds) => {
		// Remove selectedIds from all list
		const newAll = selectedAllPageIds.filter(id => !selectedIds.includes(id));
		setSelectedPrivatePageIds(selectedIds);
		setSelectedAllPageIds(newAll);
		setSelectedPageIds(selectedIds);
	};

	// const rowSelection = {
	// 	selectedRowKeys: selectedPageIds,
	// 	onChange: (selectedRowKeys) => {
	// 		if (shareMode === 'all') {
	// 			handleAllSelection(selectedRowKeys);
	// 		} else {
	// 			handlePrivateSelection(selectedRowKeys);
	// 		}
	// 	},
	// };

	return (
		<div className={css.container}>
			<Title level={3}>{sectionPageData.name}</Title>

			<div className={css.mainContent}>
				{/* Cột bên trái - Thông tin */}
				<div className={css.leftSection}>
					<div className={css.sectionTitle}>Thông tin</div>
					<div className={css.infoGrid}>
						<div className={css.infoItem}>
							<span className={css.infoLabel}>Loại:</span>
							<span> {formatType(sectionPageData.type)}</span>
						</div>
						<div className={css.infoItem}>
							<span className={css.infoLabel}>Số lượng nội dung:</span>
							<span> {sectionPageData.contentPage?.length || 0}</span>
						</div>
						{sectionPageData.created_at && (
							<div className={css.infoItem}>
								<span className={css.infoLabel}>Ngày tạo:</span>
								<span> {new Date(sectionPageData.created_at).toLocaleDateString()}</span>
							</div>
						)}
						{sectionPageData.user_create && (
							<div className={css.infoItem}>
								<span className={css.infoLabel}>Người tạo:</span>
								<span> {sectionPageData.user_create}</span>
							</div>
						)}
						<div className={css.infoItem}>
							<span className={css.infoLabel}>Tag 1:</span>
							<span> {sectionPageData.tag1}</span>
						</div>
						<div className={css.infoItem}>
							<span className={css.infoLabel}>Tag 2:</span>
							<span> {sectionPageData.tag2}</span>
						</div>
						<div className={css.infoItem}>
							<span className={css.infoLabel}>Mô tả:</span>
							<span> {sectionPageData.mo_ta}</span>
						</div>
					</div>
					<div className={css.actionButtons}>
						<Button
							icon={<PlusOutlined />}
							type='primary'
							onClick={() => setIsAddContentModalOpen(true)}
						>
							Thêm nội dung
						</Button>
						<Button
							icon={<EditOutlined />}
							type='primary'
							ghost
							onClick={() => {
								setEditedName(sectionPageData.name);
								setEditedTag1(sectionPageData.tag1);
								setEditedTag2(sectionPageData.tag2);
								setEditedMoTa(sectionPageData.mo_ta);
								setAvatar(sectionPageData.avatar);
								setIsEditModalOpen(true);
							}}
						>
							Sửa thông tin
						</Button>
						<Button
							icon={<ShareAltOutlined />}
							type='primary'
							onClick={() => setIsShareModalOpen(true)}
						>
							Chia sẻ
						</Button>
						<Popover
							content={
								<div>
									<p>Bạn có chắc chắn muốn xóa mục này?</p>
									<Button type='primary' danger onClick={handleDelete}>
										Xác nhận
									</Button>
									<Button style={{ marginLeft: 8 }} onClick={() => setDeletePopoverVisible(false)}>
										Hủy
									</Button>
								</div>
							}
							title='Xác nhận xóa'
							trigger='click'
							visible={deletePopoverVisible}
							onVisibleChange={setDeletePopoverVisible}
						>
							<Button icon={<DeleteOutlined />} danger>
								Xóa
							</Button>
						</Popover>
					</div>
				</div>

				{/* Cột bên phải - Cấu hình */}
				{sectionPageData.type != 'ListTipTap' && sectionPageData.type != 'TipTapRenderer'
					&&
					<div className={css.rightSection}>
						<div className={css.sectionTitle}>Thiết lập hiển thị</div>
						<div className={css.infoSetting}>
							{fieldConfigs.map((field) => (
								<div key={field.key} className={css.fieldConfigItem}>
									<div className={css.fieldLabel}>
										<div className={css.fieldTitle}>{field.label}</div>
										{field.options && (
											<div className={css.optionsContainer}>
												{field.options.map((opt) => (
													<Tag
														color='blue'
														key={opt}
														className={css.optionTag}
													>
														{opt}
													</Tag>
												))}
												<span
													className={css.addOptionButton}
													onClick={() => handleAddOptionClick(field.key)}
												>
                                                + Thêm
                                            </span>
											</div>
										)}
									</div>
									<div className={css.settingsContainer}>
										{['nguoi_gui', 'mo_ta'].includes(field.key) && (
											<div className={css.settingItem}>
												<span>Bắt buộc</span>
												<Checkbox
													checked={field.required}
													onChange={(e) => handleToggleRequired(field.key, e.target.checked)}
												/>
											</div>
										)}
										<div className={css.settingItem}>
											<span>{field.key !== 'tieu_de' ? 'Áp dụng' : 'Cài mặc định'}</span>
											<Checkbox
												checked={field.show}
												onChange={(e) => handleToggleShow(field.key, e.target.checked)}
												disabled={field.key === 'tieu_de'}
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

				}

			</div>

			{/* Add new modals */}
			<Modal
				title='Thêm nội dung mới'
				open={isAddContentModalOpen}
				onCancel={() => setIsAddContentModalOpen(false)}
				onOk={handleAddContent}
				okText='Thêm'
				cancelText='Hủy'
			>
				<Input
					value={newContentName}
					onChange={(e) => setNewContentName(e.target.value)}
					placeholder='Nhập tên nội dung'
				/>
			</Modal>

			<Modal
				title='Sửa thông tin'
				open={isEditModalOpen}
				onCancel={() => setIsEditModalOpen(false)}
				onOk={handleEditInfo}
				okText='Lưu'
				cancelText='Hủy'
			>
				<Input
					value={editedName}
					onChange={(e) => setEditedName(e.target.value)}
					placeholder='Nhập tên mới'
					style={{ marginBottom: '10px' }}
				/>
				<Input
					value={editedTag1}
					onChange={(e) => setEditedTag1(e.target.value)}
					placeholder='Tag 1'
					style={{ marginBottom: '10px' }}
				/>
				<Input
					value={editedTag2}
					onChange={(e) => setEditedTag2(e.target.value)}
					placeholder='Tag 2'
					style={{ marginBottom: '10px' }}
				/>

				<TextArea
					value={editedMota}
					onChange={(e) => setEditedMoTa(e.target.value)}
					placeholder='Nhập mô tả'
					rows={4}
					style={{ resize: 'vertical' }}
				/>
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
				<Upload
					accept='image/*'
					showUploadList={false}
					beforeUpload={file => {
						const isImage = file.type.startsWith('image/');
						if (!isImage) {
							message.error('You can only upload image files!');
							return false;
						}
						setAvatar(file);
						// Preview image
						const reader = new FileReader();
						reader.onload = e => setEditedImage(e.target.result);
						reader.readAsDataURL(file);
						// Optionally, store the file object for upload
						// setEditedImage(file);
						return false; // Prevent auto upload
					}}
				>
					<Button style={{ marginTop: '10px' }}
							icon={<UploadOutlined />}>Tải ảnh lên</Button>
				</Upload>
				{sectionPageData.avatar && !editedImage && (

					<div style={{ marginTop: 8 }}>
						<img src={fileUrl} alt='Current' style={{ maxWidth: 120, maxHeight: 120 }} />
					</div>
				)}
				{editedImage && (
					<div style={{ marginTop: 8 }}>
						<img src={editedImage} alt='Preview' style={{ maxWidth: 120, maxHeight: 120 }} />
						<Button
							type='text'
							danger
							size='small'
							onClick={() => setEditedImage(null)}
							style={{ marginLeft: 8 }}
						>
							Remove
						</Button>
					</div>
				)}
			</Modal>

			<Modal
				title='Thêm tùy chọn mới'
				open={isOptionModalOpen}
				onCancel={() => setIsOptionModalOpen(false)}
				onOk={handleSaveOption}
				okText='Lưu'
				cancelText='Hủy'
			>
				<Input
					value={newOptionValue}
					onChange={(e) => setNewOptionValue(e.target.value)}
					placeholder='Nhập giá trị mới'
				/>
			</Modal>

			<Modal
				title='Chia sẻ tới các trang'
				open={isShareModalOpen}
				onCancel={() => setIsShareModalOpen(false)}
				onOk={handleShare}
				okText='Lưu'
				cancelText='Hủy'
				width={1200}
			>
				{/*<div style={{ marginBottom: 16 }}>*/}
				{/*	<Select*/}
				{/*		value={shareMode}*/}
				{/*		onChange={handleShareModeChange}*/}
				{/*		style={{ width: 300 }}*/}
				{/*		options={[*/}
				{/*			{ value: 'all', label: 'Chia sẻ tới mọi người' },*/}
				{/*			{ value: 'user_list', label: 'Chia sẻ với người dùng trong danh sách' }*/}
				{/*		]}*/}
				{/*	/>*/}
				{/*</div>*/}
				<Table
					columns={columns}
					dataSource={pages}
					rowKey='id'
					pagination={false}
					scroll={{ y: 400 }}
				/>
			</Modal>
		</div>
	);
};

export default FolderDetails;