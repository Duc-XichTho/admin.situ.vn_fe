import { useEffect, useState } from 'react';
import { Button, Input, Table, message, Popconfirm, Select } from 'antd';
import { EditOutlined, SaveOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
	getAllUser,
	createUser,
	updateUser,
	deleteUser,
} from '../../apis/userService';
import css from './UseManagement.module.css';

const { Option } = Select;

export default function UserManagement() {
	const [users, setUsers] = useState([]);
	const [editingKey, setEditingKey] = useState(null);
	const [editingData, setEditingData] = useState({});
	const [searchText, setSearchText] = useState('');

	const fetchUsers = async () => {
		try {
			const data = await getAllUser();
			if (Array.isArray(data?.result)) {
				setUsers(data.result);
			} else {
				message.error('Dữ liệu trả về không hợp lệ');
			}
		} catch (error) {
			console.error('Error fetching users:', error);
			message.error('Không thể lấy danh sách người dùng');
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const handleChange = (field, value) => {
		setEditingData(prev => ({ ...prev, [field]: field === 'email' || field === 'name' ? value.trimStart() : value }));
	};

	const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	const handleSave = async () => {
		const { email, name } = editingData;

		if (!email || !name) {
			message.warning('Vui lòng nhập đầy đủ thông tin!');
			return;
		}

		if (!isValidEmail(email)) {
			message.warning('Email không hợp lệ!');
			return;
		}

		const isCreating = editingKey === 'new_user';

		if (isCreating && users.some(u => u.email === email)) {
			message.warning('Email đã tồn tại!');
			return;
		}

		try {
			if (isCreating) {
				await createUser(editingData);
				message.success('Tạo người dùng thành công!');
			} else {
				await updateUser(editingKey, editingData);
				message.success('Cập nhật thành công!');
			}
			setEditingKey(null);
			setEditingData({});
			await fetchUsers();
		} catch (error) {
			message.error(isCreating ? 'Tạo mới thất bại!' : 'Cập nhật thất bại!');
		}
	};

	const handleEdit = (record) => {
		setEditingKey(record.email);
		setEditingData({ ...record });
	};

	const handleCancel = () => {
		if (editingKey === 'new_user') {
			setUsers(prev => prev.filter(u => u._key !== 'new_user'));
		}
		setEditingKey(null);
		setEditingData({});
	};

	const handleAddNewUser = () => {
		if (editingKey === 'new_user') return;

		setUsers(prev => [
			{ _key: 'new_user', email: '', name: '', isAdmin: false, _isNew: true },
			...prev,
		]);
		setEditingKey('new_user');
		setEditingData({ email: '', name: '', isAdmin: false });
	};

	const handleDelete = async (email) => {
		try {
			await deleteUser([email]);
			message.success('Đã xóa người dùng!');
			await fetchUsers();
		} catch (error) {
			message.error('Xóa thất bại!');
		}
	};

	const filteredUsers = users.filter(user =>
		user.email.toLowerCase().includes(searchText.toLowerCase()) ||
		user.name.toLowerCase().includes(searchText.toLowerCase())
	);

	const columns = [
		{
			title: 'Email',
			dataIndex: 'email',
			width: '40%',
			render: (_, record) =>
				record.email === editingKey || record._key === 'new_user' ? (
					record._isNew ? (
						<Input
							value={editingData.email}
							onChange={(e) => handleChange('email', e.target.value)}
						/>
					) : (
						<Input value={editingData.email} disabled />
					)
				) : (
					record.email
				),
		},
		{
			title: 'Tên',
			dataIndex: 'name',
			width: '30%',
			render: (_, record) =>
				record.email === editingKey || record._key === 'new_user' ? (
					<Input value={editingData.name} onChange={(e) => handleChange('name', e.target.value)} />
				) : (
					record.name
				),
		},
		{
			title: 'Phân quyền',
			dataIndex: 'isAdmin',
			width: '20%',
			render: (_, record) =>
				record.email === editingKey || record._key === 'new_user' ? (
					<Select
						value={editingData.isAdmin ? 'Admin' : 'User'}
						onChange={(val) => handleChange('isAdmin', val === 'Admin')}
					>
						<Option value='User'>User</Option>
						<Option value='Admin'>Admin</Option>
					</Select>
				) : (
					record.isAdmin ? 'Admin' : 'User'
				),
		},
		{
			title: 'Hành động',
			width: '15%',
			render: (_, record) => {
				const isEditing = record.email === editingKey || record._key === 'new_user';
				return isEditing ? (
					<div style={{ display: 'flex', gap: 8 }}>
						<Button type='primary' icon={<SaveOutlined />} onClick={handleSave}>Lưu</Button>
						<Button onClick={handleCancel}>Hủy</Button>
					</div>
				) : (
					<div style={{ display: 'flex', gap: 8 }}>
						<Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
						<Popconfirm
							title='Bạn có chắc muốn xóa người dùng này không?'
							onConfirm={() => handleDelete(record.email)}
							okText='Xóa'
							cancelText='Hủy'
						>
							<Button icon={<DeleteOutlined />} danger />
						</Popconfirm>
					</div>
				);
			}
		},
	];

	return (
		<div className={css.container}>
			<div className={css.SideBar}>
				<h2>Danh sách người dùng</h2>
				<div className={css.actions}>
					<Input placeholder="Tìm kiếm..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
					<Button type="primary" icon={<PlusOutlined />} onClick={handleAddNewUser}>Thêm người dùng</Button>
				</div>
			</div>
			<Table
				rowKey={(record) => record._key || record.email}
				dataSource={filteredUsers}
				columns={columns}
				pagination={false}
				bordered
				style={{ marginTop: 20 }}
			/>
		</div>
	);
}
