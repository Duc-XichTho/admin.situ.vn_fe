import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, message, Tag, Space } from 'antd';
import { getAllRequestPage, updateRequestPage, deleteRequestPage } from '../../apis/requestPageService';
import { CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { createNewPage } from '../../apis/pageService';
import { MyContext } from '../../MyContext.jsx';
import { sendRequestApproved } from '../../apis/emailService';
import { createTimestamp } from '../../generalFunction/format.js';
import { InfoTable } from '../../constain/Constain.js';
import { createNewPageSection } from '../../apis/pageSectionService.jsx';

// Import BASE_URL
const BASE_URL = import.meta.env.VITE_DOMAIN_URL;

export default function RequestManagement() {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const { currentUser } = useContext(MyContext);

	useEffect(() => {
		fetchRequests();
	}, []);

	const createTimestamp = () => {
		const now = new Date();``
		return now.toISOString();
	};

	const fetchRequests = async () => {
		try {
			setLoading(true);
			const data = await getAllRequestPage();
			setRequests(data);
		} catch (error) {
			message.error('Lỗi khi tải danh sách yêu cầu!');
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const handleApprove = async (record) => {
		try {
			// const pinCode = Math.floor(1000 + Math.random() * 9000).toString();
			// First create a new page entry
			const pageData = {
				name: record.website_name,
				path: record.website_path,
				user_create: currentUser.email,
				admin_page: record.email,
				created_at: createTimestamp()
			};

			const data = await createNewPage(pageData);

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

			const emailData = {
				to: record.email,
				subject: "Your page request has been approved",
				website_name: record.website_name,
				website_path: `${BASE_URL}/${record.website_path}`,
				email: record.email,
				phone: record.phone,
				purpose: record.purpose,
				created_at: record.created_at,
				status: 'approved',
			};

			await sendRequestApproved(emailData);


			// Then update the request status
			const updatedData = {
				...record,
				status: 'approved',
				updated_at: createTimestamp()
			};
			await updateRequestPage(updatedData);

			message.success('Đã duyệt yêu cầu và tạo trang mới thành công!');
			fetchRequests();
		} catch (error) {
			message.error('Lỗi khi duyệt yêu cầu: ' + error.message);
			console.error(error);
		}
	};

	const handleReject = async (record) => {
		try {
			const updatedData = {
				...record,
				status: 'rejected',
				updated_at: createTimestamp()
			};
			await updateRequestPage(updatedData);
			message.success('Đã từ chối yêu cầu!');
			fetchRequests();
		} catch (error) {
			message.error('Lỗi khi từ chối yêu cầu!');
		}
	};

	const handleDelete = async (id) => {
		try {
			await deleteRequestPage(id);
			message.success('Đã xóa yêu cầu!');
			fetchRequests();
		} catch (error) {
			message.error('Lỗi khi xóa yêu cầu!');
		}
	};

	const columns = [
		{
			title: 'Tên trang',
			dataIndex: 'website_name',
			key: 'website_name',
			width: 200,
		},
		{
			title: 'Đường dẫn',
			dataIndex: 'website_path',
			key: 'website_path',
		},
		{
			title: 'Email',
			dataIndex: 'email',
			key: 'email',
		},
		{
			title: 'Số điện thoại',
			dataIndex: 'phone',
			key: 'phone',
			width: 150,
		},
		{
			title: 'Mục đích',
			dataIndex: 'purpose',
			key: 'purpose',
			ellipsis: true,
		},
		{
			title: 'Trạng thái',
			dataIndex: 'status',
			key: 'status',
			width: 130,
			render: (status) => (
				<Tag color={
					status === 'approved' ? 'green' :
						status === 'rejected' ? 'red' : 'orange'
				}>
					{status === 'pendding' ? 'Đang chờ' :
						status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
				</Tag>
			),
		},
		{
			title: 'Ngày tạo',
			dataIndex: 'created_at',
			key: 'created_at',
		},
		{
			title: 'Thao tác',
			key: 'action',
			render: (_, record) => (
				<Space>
					{record.status === 'pendding' && (
						<>
							<Button
								type="primary"
								icon={<CheckOutlined />}
								onClick={() => handleApprove(record)}
								title="Duyệt yêu cầu"
							>
								Duyệt
							</Button>
							<Button
								danger
								icon={<CloseOutlined />}
								onClick={() => handleReject(record)}
								title="Từ chối yêu cầu"
							>
								Từ chối
							</Button>
						</>
					)}
					<Button
						icon={<DeleteOutlined />}
						onClick={() => handleDelete(record.id)}
						title="Xóa yêu cầu"
					/>
				</Space>
			),
		},
	];

	return (
		<div style={{ padding: '20px' }}>
			<div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
				<h2>Quản lý yêu cầu đăng ký trang</h2>
				<Button onClick={fetchRequests} type="primary">Làm mới</Button>
			</div>
			<Table
				columns={columns}
				dataSource={requests}
				rowKey="id"
				loading={loading}
				pagination={{ pageSize: 10 }}
				bordered
			/>
		</div>
	);
}