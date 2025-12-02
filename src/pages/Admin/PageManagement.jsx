import { Button, Input, message, Popconfirm, Select, Table, Tooltip } from 'antd';
import { useContext, useEffect, useState } from 'react';
import { createNewPage, deletePage, getAllPage, updatePage } from '../../apis/pageService';
import { DeleteOutlined, EditOutlined, SaveOutlined, ShareAltOutlined } from '@ant-design/icons';
import { createTimestamp } from '../../generalFunction/format.js';
import { MyContext } from '../../MyContext.jsx';
import css from './PageManagement.module.css';
import { createNewPageSection } from '../../apis/pageSectionService.jsx';
import { logout } from '../../apis/userService.jsx';
import { InfoTable } from '../../constain/Constain.js';
import { ReservedPaths } from '../../constain/ReservedPaths.js';

const { Option } = Select;

export default function PageManagement() {
	const [pages, setPages] = useState([]);
	const [admins, setAdmins] = useState([]);
	const [editingRowId, setEditingRowId] = useState(null);
	const [editingData, setEditingData] = useState({});
	const { currentUser, setCurrentUser } = useContext(MyContext);

	const fetchData = async () => {
		const data = await getAllPage();
		setPages(data);
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleEdit = (record) => {
		setEditingRowId(record.id);
		setEditingData({ ...record });
	};

	const handleLogout = async () => {
		try {
			await logout();
			window.location.href = '/login';
		} catch (error) {
			console.error('Logout failed:', error);
		}
	};

	const handleCreate = async () => {
		const newData = {
			created_at: createTimestamp(),
			user_create: currentUser.email,

		};
		const data = await createNewPage(newData);
		setPages([data, ...pages]);

		const dataContentPage = {
			id_page : data.id,
			type : "TipTap",
			name : "Trang chủ",
			created_at: createTimestamp(),
			user_create: currentUser.email,
		}
		const dataContentPage2 = {
			id_page : data.id,
			type : "Table",
			name : "Thẻ info",
			created_at: createTimestamp(),
			user_create: currentUser.email,
			info: InfoTable
		}
		await createNewPageSection(dataContentPage);
		await createNewPageSection(dataContentPage2);
	};

	const handleSave = async () => {
		// Trim và chuẩn hóa dữ liệu
		const trimmedName = editingData.name?.trim().replace(/\s+/g, ' ');
		const trimmedPath = editingData.path?.trim().replace(/\s+/g, '-').toLowerCase(); // chuyển khoảng trắng thành dấu `-`, để chuẩn URL
		const trimmedEmail = editingData.admin_page?.trim();

		const isValidEmail = (email) =>
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

		if (!trimmedName || !trimmedPath || !trimmedEmail) {
			message.warning('Vui lòng nhập đầy đủ thông tin!');
			return;
		}

		if (!isValidEmail(trimmedEmail)) {
			message.warning('Email admin không hợp lệ!');
			return;
		}

		// Kiểm tra trùng với các đường dẫn đã được reserved
		if (ReservedPaths.includes(trimmedPath)) {
			message.warning(`Đường dẫn "${trimmedPath}" đã được sử dụng. Vui lòng chọn đường dẫn khác!`);
			return;
		}

		const payload = {
			id: editingRowId,
			name: trimmedName,
			path: trimmedPath,
			admin_page: trimmedEmail,
		};

		try {
			await updatePage(payload);

			setPages(prevPages =>
				prevPages.map(item =>
					item.id === editingRowId ? { ...item, ...payload } : item,
				),
			);

			setEditingRowId(null);
			message.success('Cập nhật thành công!');
		} catch (err) {
			message.error('Có lỗi xảy ra khi cập nhật!');
		}
	};



	const handleChange = (field, value) => {
		setEditingData(prev => ({ ...prev, [field]: value }));
	};

	const handleShare = (record) => {
		const shareUrl = `${window.location.origin}/${record.path}`;
		navigator.clipboard.writeText(shareUrl);
		message.success('Đã sao chép đường dẫn!');
	};

	const [visible, setVisible] = useState(false);

	const handleCancel = () => {
		setVisible(false); // Đóng Popover khi bấm "Hủy"
	};


	const DeleteButton = ({ record }) => (
		<Popconfirm
			title="Bạn có chắc chắn muốn xóa trang này không?"
			onConfirm={() => handleDelete(record)}
			okText="Xóa"
			cancelText="Hủy"
		>
			<Button icon={<DeleteOutlined />} danger />
		</Popconfirm>
	);

	const handleDelete = async (record) => {
		// Xử lý xóa trong Popover
		await deletePage(record.id);
		message.success('Đã xóa thành công!');
		await fetchData();
	};

	const columns = [
		{
			title: 'Tên page',
			dataIndex: 'name',
			width: '45%', // rộng hơn
			render: (_, record) =>
				record.id === editingRowId ? (
					<Input
						value={editingData.name}
						onChange={(e) => handleChange('name', e.target.value)}
					/>
				) : (
					record.name
				),
		},
		{
			title: 'Đường dẫn',
			dataIndex: 'path',
			width: '25%',
			render: (_, record) =>
				record.id === editingRowId ? (
					<Input
						value={editingData.path}
						onChange={(e) => handleChange('path', e.target.value)}
					/>
				) : (
					record.path
				),
		},
		{
			title: 'Admin',
			dataIndex: 'admin_page',
			width: '20%',
			render: (_, record) =>
				record.id === editingRowId ? (
					<Input
						value={editingData.admin_page}
						onChange={(e) => handleChange('admin_page', e.target.value)}
					/>
				) : (
					<span>{record.admin_page}</span>
				),
		},
		{
			title: 'Hành động',
			width: '15%', // thu nhỏ lại
			render: (_, record) =>
				record.id === editingRowId ? (
					<div style={{ display: 'flex', gap: 8 }}>
						<Button
							type='primary'
							icon={<SaveOutlined />}
							onClick={handleSave}
						>
							Lưu
						</Button>
						<Button onClick={() => setEditingRowId(null)}>
							Hủy
						</Button>
					</div>
				) : (
					<div style={{ display: 'flex', gap: 8 }}>
						<Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
							Sửa
						</Button>


						<DeleteButton record={record} />

						<Tooltip title='Chia sẻ'>
							<Button icon={<ShareAltOutlined />} onClick={() => handleShare(record)} />
						</Tooltip>
					</div>
				),
		},
	];

	return (
		<div className={css.container}>
			<div className={css.containerMain}>
				<div style={{ display: 'flex', gap: '10px' }}>
					<h2>Danh sách các Page</h2>
					<Button onClick={handleCreate}>Thêm mới</Button>
					<Button onClick={handleLogout}>Logout</Button>
				</div>
				<div style={{ marginTop: 20 }}>
					<Table
						rowKey='id'
						dataSource={pages}
						columns={columns}
						pagination={false}
						bordered
					/>
				</div>
			</div>


		</div>
	);
}
