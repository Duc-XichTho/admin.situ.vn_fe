import React, { useState, useEffect } from 'react';
import {
	Modal,
	Table,
	Button,
	Input,
	Space,
	Popconfirm,
	message,
	Tag,
	Typography,
	Upload,
	Image,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { uploadFiles } from '../../../apis/aiGen/uploadImageWikiNoteService.jsx';

const { Text } = Typography;
const { TextArea } = Input;

export default function TagProgramModal ({ visible, onClose, tag4Options, onSave }) {
  const [tagsList, setProgramList] = useState([]);
  const [editingTag, setEditingTag] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [editingImageFile, setEditingImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible) {
      setProgramList(tag4Options ? [...tag4Options] : []);
      // Reset editing states when modal opens
      setEditingTag(null);
      setEditingIndex(null);
      setNewTag('');
      setNewDescription('');
      setNewImageUrl('');
      setNewImageFile(null);
      setEditingImageFile(null);
    }
  }, [visible, tag4Options]);

	const handleImageSelect = (file) => {
		setNewImageFile(file);
		// Tạo preview URL để hiển thị
		const previewUrl = URL.createObjectURL(file);
		setNewImageUrl(previewUrl);
		message.info('Ảnh đã được chọn, sẽ upload khi lưu tag');
		return false; // Prevent default upload
	};

	const handleEditImageSelect = (file) => {
		setEditingImageFile(file);
		// Tạo preview URL để hiển thị
		const previewUrl = URL.createObjectURL(file);
		setEditingTag({ ...editingTag, imageUrl: previewUrl });
		message.info('Ảnh đã được chọn, sẽ upload khi lưu tag');
		return false; // Prevent default upload
	};

	const handleAddTag = async () => {
		if (!newTag.trim()) {
			message.warning('Vui lòng nhập tên tag!');
			return;
		}
		if (newTag.trim().length < 2) {
			message.warning('Tên tag phải có ít nhất 2 ký tự!');
			return;
		}
		if (newTag.trim().length > 50) {
			message.warning('Tên tag không được quá 50 ký tự!');
			return;
		}
		if (tagsList.find(tag => tag.label === newTag.trim())) {
			message.warning('Tên tag này đã tồn tại!');
			return;
		}

		setSaving(true);
		let finalImageUrl = newImageUrl.trim();

		// Upload ảnh nếu có file được chọn
		if (newImageFile) {
			try {
				const response = await uploadFiles([newImageFile]);
				finalImageUrl = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';
				if (!finalImageUrl) {
					message.error('Upload ảnh thất bại!');
					setSaving(false);
					return;
				}
			} catch (error) {
				console.error('Upload error:', error);
				message.error('Upload ảnh thất bại!');
				setSaving(false);
				return;
			}
		}

		const newTagItem = { 
			value: newTag.trim(), 
			label: newTag.trim(),
			description: newDescription.trim() || '',
			imageUrl: finalImageUrl || ''
		};
		const updatedList = [...tagsList, newTagItem];
		setProgramList(updatedList);
		setNewTag('');
		setNewDescription('');
		setNewImageUrl('');
		setNewImageFile(null);
		
		// Lưu ngay lập tức vào database
		try {
			await onSave(updatedList);
			message.success('Đã thêm tag!');
		} catch (error) {
			// Nếu lưu thất bại, rollback state
			setProgramList(tagsList);
			message.error('Lỗi khi lưu tag!');
		} finally {
			setSaving(false);
		}
	};

	const handleEditTag = (record, index) => {
		setEditingTag({ 
			value: record.value, // Giữ nguyên value
			label: record.label, // Chỉ edit label
			description: record.description || '', // Thêm description
			imageUrl: record.imageUrl || '', // Thêm imageUrl
			originalValue: record.value,
			originalLabel: record.label,
			originalDescription: record.description || '',
			originalImageUrl: record.imageUrl || ''
		});
		setEditingIndex(index);
	};

	const handleSaveEditTag = async () => {
		if (!editingTag || !editingTag.label.trim()) {
			message.warning('Vui lòng nhập tên tag!');
			return;
		}
		if (editingTag.label.trim().length < 2) {
			message.warning('Tên tag phải có ít nhất 2 ký tự!');
			return;
		}
		if (editingTag.label.trim().length > 50) {
			message.warning('Tên tag không được quá 50 ký tự!');
			return;
		}
		// Check if new label already exists (excluding current editing item)
		const existingTag = tagsList.find(tag => 
			tag.label === editingTag.label.trim() && 
			tag.value !== editingTag.originalValue
		);
		if (existingTag) {
			message.warning('Tên tag này đã tồn tại!');
			return;
		}

		setSaving(true);
		let finalImageUrl = editingTag.imageUrl.trim();

		// Upload ảnh nếu có file mới được chọn
		if (editingImageFile) {
			try {
				const response = await uploadFiles([editingImageFile]);
				finalImageUrl = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';
				if (!finalImageUrl) {
					message.error('Upload ảnh thất bại!');
					setSaving(false);
					return;
				}
			} catch (error) {
				console.error('Upload error:', error);
				message.error('Upload ảnh thất bại!');
				setSaving(false);
				return;
			}
		}

		const updatedList = tagsList.map(tag =>
			tag.value === editingTag.originalValue
				? { 
					value: editingTag.label.trim(), // Update value to match label
					label: editingTag.label.trim(),
					description: editingTag.description.trim() || '',
					imageUrl: finalImageUrl || ''
				} // Update both value and label to be the same
				: tag,
		);
		
		// Backup current states for rollback
		const originalProgramList = [...tagsList];
		const originalEditingTag = { ...editingTag };
		
		// Update UI optimistically
		setProgramList(updatedList);
		setEditingTag(null);
		setEditingIndex(null);
		setEditingImageFile(null);
		
		// Lưu ngay lập tức vào database
		try {
			await onSave(updatedList);
			message.success('Đã cập nhật tag!');
		} catch (error) {
			// Nếu lưu thất bại, rollback state
			setProgramList(originalProgramList);
			setEditingTag(originalEditingTag);
			setEditingIndex(null);
			message.error('Lỗi khi cập nhật tag!');
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteTag = async (value) => {
		const updatedList = tagsList.filter(tag => tag.value !== value);
		setProgramList(updatedList);
		
		// Lưu ngay lập tức vào database
		try {
			await onSave(updatedList);
			message.success('Đã xóa tag!');
		} catch (error) {
			// Nếu lưu thất bại, rollback state
			setProgramList(tagsList);
			message.error('Lỗi khi xóa tag!');
		}
	};

  const handleSave = async () => {
    // Tất cả thay đổi đã được lưu ngay lập tức, chỉ cần đóng modal
    onClose();
  };

	const tagsColumns = [
		{
			title: 'Program',
			dataIndex: 'label',
			key: 'label',
			width: 150,
			render: (text, record, index) => {
				const isEditing = editingIndex === index;
				if (isEditing) {
					return (
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<Input
								value={editingTag.label || ''}
								onChange={(e) => setEditingTag({ ...editingTag, label: e.target.value })}
								onPressEnter={handleSaveEditTag}
								onKeyDown={(e) => {
									if (e.key === 'Escape') {
										setEditingTag(null);
									}
								}}
								autoFocus
								size="small"
								style={{ flex: 1 }}
								placeholder="Nhập tên tag..."
							/>
						</div>
					);
				}
				return <Tag color="purple" style={{ margin: '2px 0' }}>{text}</Tag>;
			},
		},
		{
			title: 'Ảnh',
			dataIndex: 'imageUrl',
			key: 'imageUrl',
			width: 120,
			render: (text, record, index) => {
				const isEditing = editingIndex === index;
				if (isEditing) {
					return (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							<Input
								value={editingTag.imageUrl || ''}
								onChange={(e) => setEditingTag({ ...editingTag, imageUrl: e.target.value })}
								placeholder="URL ảnh..."
								size="small"
							/>
							<Upload
								showUploadList={false}
								beforeUpload={handleEditImageSelect}
								accept="image/*"
								disabled={saving}
							>
								<Button size="small" icon={<UploadOutlined />} loading={saving}>
									{saving ? 'Đang lưu...' : 'Chọn ảnh'}
								</Button>
							</Upload>
						</div>
					);
				}
				if (text) {
					return (
						<Image
							src={text}
							width={60}
							height={40}
							style={{ objectFit: 'cover', borderRadius: 4 }}
							fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+kmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
						/>
					);
				}
				return <Text type="secondary" style={{ fontSize: '12px' }}>Chưa có ảnh</Text>;
			},
		},
		{
			title: 'Mô tả',
			dataIndex: 'description',
			key: 'description',
			render: (text, record, index) => {
				const isEditing = editingIndex === index;
				if (isEditing) {
					return (
						<TextArea
							value={editingTag.description || ''}
							onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
							placeholder="Nhập mô tả..."
							autoSize={{ minRows: 2, maxRows: 4 }}
							size="small"
						/>
					);
				}
				return (
					<Text type="secondary" style={{ fontSize: '12px' }}>
						{text || 'Chưa có mô tả'}
					</Text>
				);
			},
		},
		{
			title: 'Thao tác',
			key: 'actions',
			width: 120,
			render: (_, record, index) => {
				const isEditing = editingIndex === index;
				if (isEditing) {
					return (
						<Space>
							<Button type="link" size="small" onClick={handleSaveEditTag} loading={saving}>
								{saving ? 'Đang lưu...' : 'Lưu'}
							</Button>
							<Button type="link" size="small" onClick={() => {
								setEditingTag(null);
								setEditingIndex(null);
							}}>
								Hủy
							</Button>
						</Space>
					);
				}
				return (
					<Space>
						<Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditTag(record, index)}>
							Sửa
						</Button>
						<Popconfirm
							title="Bạn có chắc muốn xóa tag này?"
							onConfirm={() => handleDeleteTag(record.value)}
							okText="Có"
							cancelText="Không"
						>
							<Button type="link" size="small" danger icon={<DeleteOutlined />}>
								Xóa
							</Button>
						</Popconfirm>
					</Space>
				);
			},
		},
	];

	return (
		<Modal
			title="Quản lý Program"
			open={visible}
			onCancel={onClose}
			width={800}
			footer={[
				<Button key="cancel" onClick={onClose}>
					Đóng
				</Button>,
			]}
		>
			<div style={{height: '60vh', overflowY: 'auto', padding: 10}}>
				<div style={{ marginBottom: '20px' }}>
					<Text type="secondary">
						Quản lý danh sách tags cho các bài viết. Program giúp phân loại và tìm kiếm nội dung dễ dàng hơn.
					</Text>
					<div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
						<Text type="success" style={{ fontSize: '12px' }}>
							💡 <strong>Hướng dẫn:</strong> Click vào nút "Sửa" để chỉnh sửa, "Xóa" để xóa, hoặc nhập tên mới và nhấn "Thêm". Tất cả thay đổi sẽ được lưu tự động!
						</Text>
					</div>
				</div>

				{/* Program Management */}
				<div>
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						marginBottom: '15px',
						gap: '10px'
					}}>
						<h4 style={{ margin: 0, color: '#722ed1' }}>Program - Phân loại nội dung</h4>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '300px' }}>
							<Input
								placeholder="Nhập tên tag mới"
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								onPressEnter={handleAddTag}
								size="small"
							/>
							<TextArea
								placeholder="Nhập mô tả cho tag (tùy chọn)"
								value={newDescription}
								onChange={(e) => setNewDescription(e.target.value)}
								autoSize={{ minRows: 2, maxRows: 3 }}
								size="small"
							/>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
								<Input
									placeholder="URL ảnh (tùy chọn)"
									value={newImageUrl}
									onChange={(e) => setNewImageUrl(e.target.value)}
									size="small"
								/>
								<Upload
									showUploadList={false}
									beforeUpload={handleImageSelect}
									accept="image/*"
									disabled={saving}
								>
									<Button size="small" icon={<UploadOutlined />} style={{ width: '100%' }} loading={saving}>
										{saving ? 'Đang lưu...' : 'Chọn ảnh'}
									</Button>
								</Upload>
							</div>
							<Button type="primary" icon={<PlusOutlined />} onClick={handleAddTag} size="small" loading={saving}>
								{saving ? 'Đang lưu...' : 'Thêm Tag'}
							</Button>
						</div>
					</div>
					<Table
						columns={tagsColumns}
						dataSource={tagsList}
						rowKey="value"
						pagination={false}
						size="small"
					/>
				</div>
			</div>

		</Modal>
	);
};

