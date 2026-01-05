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
	Tabs,
	Select,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function TagProgramModal ({ visible, onClose, tag4Options, onSave, coursesOptions, onSaveCourses }) {
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'programs'
  
  // Courses (Học phần) states
  const [coursesList, setCoursesList] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingCourseIndex, setEditingCourseIndex] = useState(null);
  const [newCourse, setNewCourse] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [savingCourse, setSavingCourse] = useState(false);
  
  // Programs (Chương trình) states
  const [tagsList, setProgramList] = useState([]);
  const [editingTag, setEditingTag] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newCourseId, setNewCourseId] = useState(undefined); // Course that program belongs to
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      // Load courses
      setCoursesList(coursesOptions ? [...coursesOptions] : []);
      // Load programs
      setProgramList(tag4Options ? [...tag4Options] : []);
      // Reset editing states when modal opens
      setEditingCourse(null);
      setEditingCourseIndex(null);
      setNewCourse('');
      setNewCourseDescription('');
      setEditingTag(null);
      setEditingIndex(null);
      setNewTag('');
      setNewDescription('');
      setNewDisplayName('');
      setNewCourseId(undefined);
      // Don't reset activeTab when modal is already open (only reset when first opening)
      // This prevents switching back to 'courses' tab when saving in 'programs' tab
    } else {
      // Only reset activeTab when modal closes
      setActiveTab('courses');
    }
  }, [visible, tag4Options, coursesOptions]);

	// ========== COURSES (HỌC PHẦN) HANDLERS ==========
	const handleAddCourse = async () => {
		if (!newCourse.trim()) {
			message.warning('Vui lòng nhập tên học phần!');
			return;
		}
		if (newCourse.trim().length < 2) {
			message.warning('Tên học phần phải có ít nhất 2 ký tự!');
			return;
		}
		if (newCourse.trim().length > 50) {
			message.warning('Tên học phần không được quá 50 ký tự!');
			return;
		}
		if (coursesList.find(course => course.label === newCourse.trim())) {
			message.warning('Tên học phần này đã tồn tại!');
			return;
		}

		setSavingCourse(true);

		const newCourseItem = { 
			value: newCourse.trim(), 
			label: newCourse.trim(),
			description: newCourseDescription.trim() || ''
		};
		const updatedList = [...coursesList, newCourseItem];
		setCoursesList(updatedList);
		setNewCourse('');
		setNewCourseDescription('');
		
		// Lưu ngay lập tức vào database
		try {
			await onSaveCourses(updatedList);
			message.success('Đã thêm học phần!');
		} catch (error) {
			// Nếu lưu thất bại, rollback state
			setCoursesList(coursesList);
			message.error('Lỗi khi lưu học phần!');
		} finally {
			setSavingCourse(false);
		}
	};

	const handleEditCourse = (record, index) => {
		setEditingCourse({ 
			value: record.value,
			label: record.label,
			description: record.description || '',
			originalValue: record.value,
			originalLabel: record.label,
			originalDescription: record.description || ''
		});
		setEditingCourseIndex(index);
	};

	const handleSaveEditCourse = async () => {
		if (!editingCourse || !editingCourse.label.trim()) {
			message.warning('Vui lòng nhập tên học phần!');
			return;
		}
		if (editingCourse.label.trim().length < 2) {
			message.warning('Tên học phần phải có ít nhất 2 ký tự!');
			return;
		}
		if (editingCourse.label.trim().length > 50) {
			message.warning('Tên học phần không được quá 50 ký tự!');
			return;
		}
		// Check if new label already exists (excluding current editing item)
		const existingCourse = coursesList.find(course => 
			course.label === editingCourse.label.trim() && 
			course.value !== editingCourse.originalValue
		);
		if (existingCourse) {
			message.warning('Tên học phần này đã tồn tại!');
			return;
		}

		setSavingCourse(true);

		const updatedList = coursesList.map(course =>
			course.value === editingCourse.originalValue
				? { 
					value: editingCourse.label.trim(),
					label: editingCourse.label.trim(),
					description: editingCourse.description.trim() || ''
				}
				: course,
		);
		
		// Backup current states for rollback
		const originalCoursesList = [...coursesList];
		const originalEditingCourse = { ...editingCourse };
		
		// Update UI optimistically
		setCoursesList(updatedList);
		setEditingCourse(null);
		setEditingCourseIndex(null);
		
		// Lưu ngay lập tức vào database
		try {
			await onSaveCourses(updatedList);
			message.success('Đã cập nhật học phần!');
		} catch (error) {
			// Nếu lưu thất bại, rollback state
			setCoursesList(originalCoursesList);
			setEditingCourse(originalEditingCourse);
			setEditingCourseIndex(null);
			message.error('Lỗi khi cập nhật học phần!');
		} finally {
			setSavingCourse(false);
		}
	};

	const handleDeleteCourse = async (value) => {
		// Check if any program is using this course
		const programsUsingCourse = tagsList.filter(program => program.courseId === value);
		if (programsUsingCourse.length > 0) {
			message.warning(`Không thể xóa học phần này vì có ${programsUsingCourse.length} chương trình đang sử dụng!`);
			return;
		}

		const updatedList = coursesList.filter(course => course.value !== value);
		setCoursesList(updatedList);
		
		// Lưu ngay lập tức vào database
		try {
			await onSaveCourses(updatedList);
			message.success('Đã xóa học phần!');
		} catch (error) {
			// Nếu lưu thất bại, rollback state
			setCoursesList(coursesList);
			message.error('Lỗi khi xóa học phần!');
		}
	};

	// ========== PROGRAMS (CHƯƠNG TRÌNH) HANDLERS ==========
	const handleAddTag = async () => {
		if (!newTag.trim()) {
			message.warning('Vui lòng nhập tên tag!');
			return;
		}
		if (newTag.trim().length < 2) {
			message.warning('Tên tag phải có ít nhất 2 ký tự!');
			return;
		}
		if (newTag.trim().length > 100) {
			message.warning('Tên tag không được quá 50 ký tự!');
			return;
		}
		if (tagsList.find(tag => tag.label === newTag.trim())) {
			message.warning('Tên tag này đã tồn tại!');
			return;
		}

		setSaving(true);

		const newTagItem = { 
			value: newTag.trim(), 
			label: newTag.trim(),
			description: newDescription.trim() || '',
			displayName: newDisplayName.trim() || '',
			courseId: newCourseId || undefined // Link to course
		};
		const updatedList = [...tagsList, newTagItem];
		setProgramList(updatedList);
		setNewTag('');
		setNewDescription('');
		setNewDisplayName('');
		setNewCourseId(undefined);
		
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
			value: record.value,
			label: record.label,
			description: record.description || '',
			displayName: record.displayName || '',
			courseId: record.courseId || undefined,
			originalValue: record.value,
			originalLabel: record.label,
			originalDescription: record.description || '',
			originalDisplayName: record.displayName || '',
			originalCourseId: record.courseId || undefined
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
		if (editingTag.label.trim().length > 100) {
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

		const updatedList = tagsList.map(tag =>
			tag.value === editingTag.originalValue
				? { 
					value: editingTag.label.trim(),
					label: editingTag.label.trim(),
					description: editingTag.description.trim() || '',
					displayName: editingTag.displayName.trim() || '',
					courseId: editingTag.courseId || undefined
				}
				: tag,
		);
		
		// Backup current states for rollback
		const originalProgramList = [...tagsList];
		const originalEditingTag = { ...editingTag };
		
		// Update UI optimistically
		setProgramList(updatedList);
		setEditingTag(null);
		setEditingIndex(null);
		
		// Lưu ngay lập tức vào database
		try {
			await onSave(updatedList);
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

	// ========== COURSES COLUMNS ==========
	const coursesColumns = [
		{
			title: 'Học phần',
			dataIndex: 'label',
			key: 'label',
			width: 200,
			render: (text, record, index) => {
				const isEditing = editingCourseIndex === index;
				if (isEditing) {
					return (
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<Input
								value={editingCourse.label || ''}
								onChange={(e) => setEditingCourse({ ...editingCourse, label: e.target.value })}
								onPressEnter={handleSaveEditCourse}
								onKeyDown={(e) => {
									if (e.key === 'Escape') {
										setEditingCourse(null);
										setEditingCourseIndex(null);
									}
								}}
								autoFocus
								size="small"
								style={{ flex: 1 }}
								placeholder="Nhập tên học phần..."
							/>
						</div>
					);
				}
				return <Tag color="blue" style={{ margin: '2px 0' }}>{text}</Tag>;
			},
		},
		{
			title: 'Mô tả',
			dataIndex: 'description',
			key: 'description',
			render: (text, record, index) => {
				const isEditing = editingCourseIndex === index;
				if (isEditing) {
					return (
						<TextArea
							value={editingCourse.description || ''}
							onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
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
				const isEditing = editingCourseIndex === index;
				if (isEditing) {
					return (
						<Space>
							<Button type="link" size="small" onClick={handleSaveEditCourse} loading={savingCourse}>
								{savingCourse ? 'Đang lưu...' : 'Lưu'}
							</Button>
							<Button type="link" size="small" onClick={() => {
								setEditingCourse(null);
								setEditingCourseIndex(null);
							}}>
								Hủy
							</Button>
						</Space>
					);
				}
				return (
					<Space>
						<Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditCourse(record, index)}>
							Sửa
						</Button>
						<Popconfirm
							title="Bạn có chắc muốn xóa học phần này?"
							onConfirm={() => handleDeleteCourse(record.value)}
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

	// ========== PROGRAMS COLUMNS ==========
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
			title: 'Học phần',
			dataIndex: 'courseId',
			key: 'courseId',
			width: 150,
			render: (courseId, record, index) => {
				const isEditing = editingIndex === index;
				if (isEditing) {
					return (
						<Select
							value={editingTag.courseId}
							onChange={(value) => setEditingTag({ ...editingTag, courseId: value })}
							placeholder="Chọn học phần"
							allowClear
							size="small"
							style={{ width: '100%' }}
						>
							{coursesList.map(course => (
								<Option key={course.value} value={course.value}>
									{course.label}
								</Option>
							))}
						</Select>
					);
				}
				const course = coursesList.find(c => c.value === courseId);
				return (
					<Text style={{ fontSize: '13px' }}>
						{course ? <Tag color="blue">{course.label}</Tag> : '-'}
					</Text>
				);
			},
		},
		{
			title: 'Tên hiển thị',
			dataIndex: 'displayName',
			key: 'displayName',
			width: 200,
			render: (text, record, index) => {
				const isEditing = editingIndex === index;
				if (isEditing) {
					return (
						<Input
							value={editingTag.displayName || ''}
							onChange={(e) => setEditingTag({ ...editingTag, displayName: e.target.value })}
							placeholder="Nhập tên hiển thị..."
							size="small"
						/>
					);
				}
				return (
					<Text style={{ fontSize: '13px', fontWeight: '500' }}>
						{text || '-'}
					</Text>
				);
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

	const tabItems = [
		{
			key: 'courses',
			label: 'Học phần',
			children: (
				<div style={{ padding: '10px 0' }}>
					<div style={{ marginBottom: '20px' }}>
						<Text type="secondary">
							Quản lý danh sách học phần. Mỗi học phần có thể chứa nhiều chương trình.
						</Text>
						<div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
							<Text type="info" style={{ fontSize: '12px' }}>
								💡 <strong>Hướng dẫn:</strong> Click vào nút "Sửa" để chỉnh sửa, "Xóa" để xóa, hoặc nhập tên mới và nhấn "Thêm". Tất cả thay đổi sẽ được lưu tự động!
							</Text>
						</div>
					</div>

					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						marginBottom: '15px',
						gap: '10px'
					}}>
						<h4 style={{ margin: 0, color: '#1890ff' }}>Học phần - Phân loại chương trình</h4>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '300px' }}>
							<Input
								placeholder="Nhập tên học phần mới"
								value={newCourse}
								onChange={(e) => setNewCourse(e.target.value)}
								onPressEnter={handleAddCourse}
								size="small"
							/>
							<TextArea
								placeholder="Nhập mô tả cho học phần (tùy chọn)"
								value={newCourseDescription}
								onChange={(e) => setNewCourseDescription(e.target.value)}
								autoSize={{ minRows: 2, maxRows: 3 }}
								size="small"
							/>
							<Button type="primary" icon={<PlusOutlined />} onClick={handleAddCourse} size="small" loading={savingCourse}>
								{savingCourse ? 'Đang lưu...' : 'Thêm Học phần'}
							</Button>
						</div>
					</div>
					<Table
						columns={coursesColumns}
						dataSource={coursesList}
						rowKey="value"
						pagination={false}
						size="small"
					/>
				</div>
			),
		},
		{
			key: 'programs',
			label: 'Chương trình',
			children: (
				<div style={{ padding: '10px 0' }}>
					<div style={{ marginBottom: '20px' }}>
						<Text type="secondary">
							Quản lý danh sách chương trình. Mỗi chương trình có thể thuộc về một học phần.
						</Text>
						<div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
							<Text type="success" style={{ fontSize: '12px' }}>
								💡 <strong>Hướng dẫn:</strong> Click vào nút "Sửa" để chỉnh sửa, "Xóa" để xóa, hoặc nhập tên mới và nhấn "Thêm". Tất cả thay đổi sẽ được lưu tự động!
							</Text>
						</div>
					</div>

					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						marginBottom: '15px',
						gap: '10px'
					}}>
						<h4 style={{ margin: 0, color: '#722ed1' }}>Chương trình - Phân loại nội dung</h4>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '300px' }}>
							<Input
								placeholder="Nhập tên chương trình mới"
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								onPressEnter={handleAddTag}
								size="small"
							/>
							<Select
								placeholder="Chọn học phần (tùy chọn)"
								value={newCourseId}
								onChange={setNewCourseId}
								allowClear
								size="small"
							>
								{coursesList.map(course => (
									<Option key={course.value} value={course.value}>
										{course.label}
									</Option>
								))}
							</Select>
							<TextArea
								placeholder="Nhập mô tả cho chương trình (tùy chọn)"
								value={newDescription}
								onChange={(e) => setNewDescription(e.target.value)}
								autoSize={{ minRows: 2, maxRows: 3 }}
								size="small"
							/>
							<Input
								placeholder="Tên hiển thị (VD: Bài 1, Bài 2...)"
								value={newDisplayName}
								onChange={(e) => setNewDisplayName(e.target.value)}
								size="small"
							/>
							<Button type="primary" icon={<PlusOutlined />} onClick={handleAddTag} size="small" loading={saving}>
								{saving ? 'Đang lưu...' : 'Thêm Chương trình'}
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
			),
		},
	];

	return (
		<Modal
			title="Quản lý Học phần & Chương trình"
			open={visible}
			onCancel={onClose}
			width={1400}
			footer={[
				<Button key="cancel" onClick={onClose}>
					Đóng
				</Button>,
			]}
		>
			<div style={{height: '100%', overflowY: 'auto', padding: 10}}>
				<Tabs
					activeKey={activeTab}
					onChange={setActiveTab}
					items={tabItems}
				/>
			</div>
		</Modal>
	);
};

