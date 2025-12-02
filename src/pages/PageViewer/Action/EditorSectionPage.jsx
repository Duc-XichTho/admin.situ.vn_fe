import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Empty, Modal, Row, Select, message } from 'antd';
import { DeleteOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { getPageDataById } from '../../../apis/pageService';

export default function EditorSectionPage({
											  setIsModalVisible,
											  isModalVisible,
											  tab,
											  updatePageSection,
											  loadFileTab,
										  }) {
	const [localEditors, setLocalEditors] = useState([]);
	const [userList, setUserList] = useState([]);
	const [selectedUser, setSelectedUser] = useState('');

	// Fetch user_list when modal opens
	useEffect(() => {
		console.log('tab:', tab);
		if (isModalVisible && tab?.id_page) {
			getPageDataById(tab.id_page).then((data) => {
				setUserList(Array.isArray(data.user_list) ? data.user_list : []);
			});
		}
	}, [isModalVisible, tab?.id_page]);

	useEffect(() => {
		if (Array.isArray(tab.editor)) {
			setLocalEditors(tab.editor);
		}
	}, [tab?.editor]);

	const handleCancel = () => {
		setSelectedUser('');
		setIsModalVisible(false);
	};

	const handleAddEditor = async () => {
		if (!selectedUser) {
			message.error('Vui lòng chọn user');
			return;
		}
		if (localEditors.includes(selectedUser)) {
			message.warning('Editor này đã tồn tại');
			return;
		}
		const updatedEditors = [...localEditors, selectedUser];
		await updateTabEditors(updatedEditors);
	};

	const handleRemoveEditor = async (editorToRemove) => {
		const updatedEditors = localEditors.filter((editor) => editor !== editorToRemove);
		await updateTabEditors(updatedEditors);
	};

	const updateTabEditors = async (updatedEditors) => {
		try {
			const updatedTab = { ...tab, editor: updatedEditors };
			await updatePageSection(updatedTab);
			setLocalEditors(updatedEditors);
			setSelectedUser('');
			message.success('Cập nhật editor thành công');
			await loadFileTab();
		} catch (error) {
			message.error('Có lỗi xảy ra khi cập nhật editor');
		}
	};

	return (
		<Modal
			title="Quản lý Editor"
			open={isModalVisible}
			onCancel={handleCancel}
			footer={null}
			width={700}
			bodyStyle={{ padding: '24px' }}
			destroyOnClose
		>
			<Row gutter={16} style={{ marginBottom: 24 }}>
				<Col span={18}>
					<Select
						showSearch
						placeholder="Chọn user từ danh sách"
						value={selectedUser || undefined}
						onChange={setSelectedUser}
						style={{ width: '100%', borderRadius: 8 }}
						options={userList.map((user) => ({ value: user, label: user }))}
						allowClear
						suffixIcon={<UserOutlined />}
					/>
				</Col>
				<Col span={6}>
					<Button
						type="primary"
						block
						icon={<EditOutlined />}
						onClick={handleAddEditor}
						disabled={!selectedUser}
						style={{ borderRadius: 8, height: '100%' }}
					>
						Thêm Editor
					</Button>
				</Col>
			</Row>
			{Array.isArray(localEditors) && localEditors.length > 0 ? (
				<Row gutter={[16, 16]}>
					{localEditors.map((editor, index) => (
						<Col span={8} key={index}>
							<Card
								title={editor}
								size="small"
								style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
							>
								<div style={{ display: 'flex', justifyContent: 'center' }}>
									<DeleteOutlined
										key="delete"
										style={{ color: '#ff4d4f', cursor: 'pointer' }}
										onClick={() => handleRemoveEditor(editor)}
									/>
								</div>
							</Card>
						</Col>
					))}
				</Row>
			) : (
				<Empty description="Chưa có editor nào" />
			)}
		</Modal>
	);
}