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
	Divider,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const TagManagementModal = ({ visible, onClose, tag1Options, tag2Options, tag3Options, onSave }) => {
  const [categoriesList, setCategoriesList] = useState([]);
  const [levelsList, setLevelsList] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);
  const [editingSeries, setEditingSeries] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [newSeries, setNewSeries] = useState('');
  const [saving, setSaving] = useState(false);

	  		  	useEffect(() => {
     if (visible) {
       setCategoriesList([...tag1Options]);
       setLevelsList([...tag2Options]);
       setSeriesList([...tag3Options]);
       // Reset editing states when modal opens
       setEditingCategory(null);
       setEditingLevel(null);
       setEditingSeries(null);
       setNewCategory('');
       setNewLevel('');
       setNewSeries('');
     }
   }, [visible, tag1Options, tag2Options, tag3Options]);

	const handleAddCategory = async () => {
		if (!newCategory.trim()) {
			message.warning('Vui lòng nhập tên category!');
			return;
		}
		if (newCategory.trim().length < 2) {
			message.warning('Tên category phải có ít nhất 2 ký tự!');
			return;
		}
		if (newCategory.trim().length > 50) {
			message.warning('Tên category không được quá 50 ký tự!');
			return;
		}
		if (categoriesList.find(tag => tag.value === newCategory.trim())) {
			message.warning('Category này đã tồn tại!');
			return;
		}
		const newTag = { value: newCategory.trim(), label: newCategory.trim() };
		const updatedList = [...categoriesList, newTag];
		setCategoriesList(updatedList);
		setNewCategory('');
		
		// Lưu ngay lập tức vào database
		try {
			await onSave(updatedList, levelsList, seriesList);
			message.success('Đã thêm category!');
		} catch (error) {
			// Nếu lưu thất bại, rollback state
			setCategoriesList(categoriesList);
			message.error('Lỗi khi lưu category!');
		}
	};

	const handleAddLevel = async () => {
		if (!newLevel.trim()) {
			message.warning('Vui lòng nhập tên level!');
			return;
		}
		if (newLevel.trim().length < 2) {
			message.warning('Tên level phải có ít nhất 2 ký tự!');
			return;
		}
		if (newLevel.trim().length > 50) {
			message.warning('Tên level không được quá 50 ký tự!');
			return;
		}
		if (levelsList.find(tag => tag.value === newLevel.trim())) {
			message.warning('Level này đã tồn tại!');
			return;
		}
		const newTag = { value: newLevel.trim(), label: newLevel.trim() };
		const updatedList = [...levelsList, newTag];
		setLevelsList(updatedList);
		setNewLevel('');
		
		// Lưu ngay lập tức vào database
		try {
			await onSave(categoriesList, updatedList, seriesList);
			message.success('Đã thêm level!');
		} catch (error) {
			// Nếu lưu thất bại, rollback state
			setLevelsList(levelsList);
			message.error('Lỗi khi lưu level!');
		}
	};

	const handleEditCategory = (record) => {
		setEditingCategory({ ...record, originalValue: record.value });
	};

	const handleEditLevel = (record) => {
		setEditingLevel({ ...record, originalValue: record.value });
	};

	const handleSaveEditCategory = async () => {
		if (!editingCategory.value.trim()) {
			message.warning('Vui lòng nhập tên category!');
			return;
		}
		if (editingCategory.value.trim().length < 2) {
			message.warning('Tên category phải có ít nhất 2 ký tự!');
			return;
		}
		if (editingCategory.value.trim().length > 50) {
			message.warning('Tên category không được quá 50 ký tự!');
			return;
		}
		// Check if new value already exists (excluding current editing item)
		const existingTag = categoriesList.find(tag => 
			tag.value === editingCategory.value.trim() && 
			tag.value !== editingCategory.originalValue
		);
		if (existingTag) {
			message.warning('Category này đã tồn tại!');
			return;
		}
		const updatedList = categoriesList.map(tag =>
			tag.value === editingCategory.originalValue
				? { value: editingCategory.value.trim(), label: editingCategory.value.trim() }
				: tag,
		);
		setCategoriesList(updatedList);
		setEditingCategory(null);
		
		// Lưu ngay lập tức vào database
		try {
			await onSave(updatedList, levelsList, seriesList);
			message.success('Đã cập nhật category!');
		} catch (error) {
			// Nếu lưu thất bại, rollback state
			setCategoriesList(categoriesList);
			message.error('Lỗi khi cập nhật category!');
		}
	};

	const handleSaveEditLevel = async () => {
		if (!editingLevel.value.trim()) {
			message.warning('Vui lòng nhập tên level!');
			return;
		}
		if (editingLevel.value.trim().length < 2) {
			message.warning('Tên level phải có ít nhất 2 ký tự!');
			return;
		}
		if (editingLevel.value.trim().length > 50) {
			message.warning('Tên level không được quá 50 ký tự!');
			return;
		}
		// Check if new value already exists (excluding current editing item)
		const existingTag = levelsList.find(tag => 
			tag.value === editingLevel.value.trim() && 
			tag.value !== editingLevel.originalValue
		);
		if (existingTag) {
			message.warning('Level này đã tồn tại!');
			return;
		}
		const updatedList = levelsList.map(tag =>
			tag.value === editingLevel.originalValue
				? { value: editingLevel.value.trim(), label: editingLevel.value.trim() }
				: tag,
		);
		setLevelsList(updatedList);
		setEditingLevel(null);
		
		// Lưu ngay lập tức vào database
		try {
			await onSave(categoriesList, updatedList, seriesList);
			message.success('Đã cập nhật level!');
		} catch (error) {
			// Nếu lưu thất bại, rollback state
			setLevelsList(levelsList);
			message.error('Lỗi khi cập nhật level!');
		}
	};

	const handleDeleteCategory = async (value) => {
		const updatedList = categoriesList.filter(tag => tag.value !== value);
		setCategoriesList(updatedList);
		
		// Lưu ngay lập tức vào database
		try {
			await onSave(updatedList, levelsList, seriesList);
			message.success('Đã xóa category!');
		} catch (error) {
			// Nếu lưu thất bại, rollback state
			setCategoriesList(categoriesList);
			message.error('Lỗi khi xóa category!');
		}
	};

	  const handleDeleteLevel = async (value) => {
    const updatedList = levelsList.filter(tag => tag.value !== value);
    setLevelsList(updatedList);
    
    // Lưu ngay lập tức vào database
    try {
      await onSave(categoriesList, updatedList, seriesList);
      message.success('Đã xóa level!');
    } catch (error) {
      // Nếu lưu thất bại, rollback state
      setLevelsList(levelsList);
      message.error('Lỗi khi xóa level!');
    }
  };

  const handleAddSeries = async () => {
    if (!newSeries.trim()) {
      message.warning('Vui lòng nhập tên series!');
      return;
    }
    if (newSeries.trim().length < 2) {
      message.warning('Tên series phải có ít nhất 2 ký tự!');
      return;
    }
    if (newSeries.trim().length > 50) {
      message.warning('Tên series không được quá 50 ký tự!');
      return;
    }
    if (seriesList.find(tag => tag.value === newSeries.trim())) {
      message.warning('Series này đã tồn tại!');
      return;
    }
    const newTag = { value: newSeries.trim(), label: newSeries.trim() };
    const updatedList = [...seriesList, newTag];
    setSeriesList(updatedList);
    setNewSeries('');
    
    // Lưu ngay lập tức vào database
    try {
      await onSave(categoriesList, levelsList, updatedList);
      message.success('Đã thêm series!');
    } catch (error) {
      // Nếu lưu thất bại, rollback state
      setSeriesList(seriesList);
      message.error('Lỗi khi lưu series!');
    }
  };

  const handleEditSeries = (record) => {
    setEditingSeries({ ...record, originalValue: record.value });
  };

  const handleSaveEditSeries = async () => {
    if (!editingSeries.value.trim()) {
      message.warning('Vui lòng nhập tên series!');
      return;
    }
    if (editingSeries.value.trim().length < 2) {
      message.warning('Tên series phải có ít nhất 2 ký tự!');
      return;
    }
    if (editingSeries.value.trim().length > 50) {
      message.warning('Tên series không được quá 50 ký tự!');
      return;
    }
    // Check if new value already exists (excluding current editing item)
    const existingTag = seriesList.find(tag => 
      tag.value === editingSeries.value.trim() && 
      tag.value !== editingSeries.originalValue
    );
    if (existingTag) {
      message.warning('Series này đã tồn tại!');
      return;
    }
    const updatedList = seriesList.map(tag =>
      tag.value === editingSeries.originalValue
        ? { value: editingSeries.value.trim(), label: editingSeries.value.trim() }
        : tag,
    );
    setSeriesList(updatedList);
    setEditingSeries(null);
    
    // Lưu ngay lập tức vào database
    try {
      await onSave(categoriesList, levelsList, updatedList);
      message.success('Đã cập nhật series!');
    } catch (error) {
      // Nếu lưu thất bại, rollback state
      setSeriesList(seriesList);
      message.error('Lỗi khi cập nhật series!');
    }
  };

  const handleDeleteSeries = async (value) => {
    const updatedList = seriesList.filter(tag => tag.value !== value);
    setSeriesList(updatedList);
    
    // Lưu ngay lập tức vào database
    try {
      await onSave(categoriesList, levelsList, updatedList);
      message.success('Đã xóa series!');
    } catch (error) {
      // Nếu lưu thất bại, rollback state
      setSeriesList(seriesList);
      message.error('Lỗi khi xóa series!');
    }
  };

  const handleSave = async () => {
    // Tất cả thay đổi đã được lưu ngay lập tức, chỉ cần đóng modal
    onClose();
  };

	const categoriesColumns = [
		{
			title: 'Categories',
			dataIndex: 'label',
			key: 'label',
			render: (text, record) => {
				if (editingCategory && editingCategory.originalValue === record.value) {
					return (
						<Input
							value={editingCategory.value}
							onChange={(e) => setEditingCategory({ ...editingCategory, value: e.target.value })}
							onPressEnter={handleSaveEditCategory}
							autoFocus
						/>
					);
				}
				return <Tag color="blue">{text}</Tag>;
			},
		},
		{
			title: 'Thao tác',
			key: 'actions',
			width: 120,
			render: (_, record) => {
				if (editingCategory && editingCategory.originalValue === record.value) {
					return (
						<Space>
							<Button type="link" size="small" onClick={handleSaveEditCategory}>
								Lưu
							</Button>
							<Button type="link" size="small" onClick={() => setEditingCategory(null)}>
								Hủy
							</Button>
						</Space>
					);
				}
				return (
					<Space>
						<Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditCategory(record)}>
							Sửa
						</Button>
						<Popconfirm
							title="Bạn có chắc muốn xóa category này?"
							onConfirm={() => handleDeleteCategory(record.value)}
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

	  const levelsColumns = [
    {
      title: 'Levels',
      dataIndex: 'label',
      key: 'label',
      render: (text, record) => {
        if (editingLevel && editingLevel.originalValue === record.value) {
          return (
            <Input
              value={editingLevel.value}
              onChange={(e) => setEditingLevel({ ...editingLevel, value: e.target.value })}
              onPressEnter={handleSaveEditLevel}
              autoFocus
            />
          );
        }
        return <Tag color="green">{text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => {
        if (editingLevel && editingLevel.originalValue === record.value) {
          return (
            <Space>
              <Button type="link" size="small" onClick={handleSaveEditLevel}>
                Lưu
              </Button>
              <Button type="link" size="small" onClick={() => setEditingLevel(null)}>
                Hủy
              </Button>
            </Space>
          );
        }
        return (
          <Space>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditLevel(record)}>
              Sửa
            </Button>
            <Popconfirm
              title="Bạn có chắc muốn xóa level này?"
              onConfirm={() => handleDeleteLevel(record.value)}
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

  const seriesColumns = [
    {
      title: 'Series',
      dataIndex: 'label',
      key: 'label',
      render: (text, record) => {
        if (editingSeries && editingSeries.originalValue === record.value) {
          return (
            <Input
              value={editingSeries.value}
              onChange={(e) => setEditingSeries({ ...editingSeries, value: e.target.value })}
              onPressEnter={handleSaveEditSeries}
              autoFocus
            />
          );
        }
        return <Tag color="orange">{text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => {
        if (editingSeries && editingSeries.originalValue === record.value) {
          return (
            <Space>
              <Button type="link" size="small" onClick={handleSaveEditSeries}>
                Lưu
              </Button>
              <Button type="link" size="small" onClick={() => setEditingSeries(null)}>
                Hủy
              </Button>
            </Space>
          );
        }
        return (
          <Space>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditSeries(record)}>
              Sửa
            </Button>
            <Popconfirm
              title="Bạn có chắc muốn xóa series này?"
              onConfirm={() => handleDeleteSeries(record.value)}
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
			title="Quản lý Categories, Levels & Series Của Case Training"
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
						Quản lý danh sách categories, levels và series cho các bài viết. Categories thường dùng để phân loại chủ đề, Levels thường dùng
						để phân loại mức độ, Series thường dùng để phân loại quy mô.
					</Text>
					<div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
						<Text type="success" style={{ fontSize: '12px' }}>
							💡 <strong>Hướng dẫn:</strong> Click vào nút "Sửa" để chỉnh sửa, "Xóa" để xóa, hoặc nhập tên mới và nhấn "Thêm". Tất cả thay đổi sẽ được lưu tự động!
						</Text>
					</div>
				</div>

				{/* Categories Management */}
				<div style={{ marginBottom: '30px' }}>
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '15px',
					}}>
						<h4 style={{ margin: 0, color: '#1890ff' }}>Categories - Phân loại chủ đề</h4>
						<Space>
							<Input
								placeholder="Nhập tên category mới"
								value={newCategory}
								onChange={(e) => setNewCategory(e.target.value)}
								onPressEnter={handleAddCategory}
								style={{ width: 200 }}
							/>
							<Button type="primary" icon={<PlusOutlined />} onClick={handleAddCategory}>
								Thêm
							</Button>
						</Space>
					</div>
					<Table
						columns={categoriesColumns}
						dataSource={categoriesList}
						rowKey="value"
						pagination={false}
						size="small"
					/>
				</div>

				<Divider />

				{/* Levels Management */}
				<div>
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '15px',
					}}>
						<h4 style={{ margin: 0, color: '#52c41a' }}>Levels - Phân loại mức độ</h4>
						<Space>
							<Input
								placeholder="Nhập tên level mới"
								value={newLevel}
								onChange={(e) => setNewLevel(e.target.value)}
								onPressEnter={handleAddLevel}
								style={{ width: 200 }}
							/>
							<Button type="primary" icon={<PlusOutlined />} onClick={handleAddLevel}>
								Thêm
							</Button>
						</Space>
					</div>
					<Table
						columns={levelsColumns}
						dataSource={levelsList}
						rowKey="value"
						pagination={false}
						size="small"
					/>
				</div>

				<Divider />

				{/* Series Management */}
				<div>
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '15px',
					}}>
						<h4 style={{ margin: 0, color: '#fa8c16' }}>Series - Phân loại quy mô</h4>
						<Space>
							<Input
								placeholder="Nhập tên series mới"
								value={newSeries}
								onChange={(e) => setNewSeries(e.target.value)}
								onPressEnter={handleAddSeries}
								style={{ width: 200 }}
							/>
							<Button type="primary" icon={<PlusOutlined />} onClick={handleAddSeries}>
								Thêm
							</Button>
						</Space>
					</div>
					<Table
						columns={seriesColumns}
						dataSource={seriesList}
						rowKey="value"
						pagination={false}
						size="small"
					/>
				</div>
			</div>

		</Modal>
	);
};

export default TagManagementModal;
