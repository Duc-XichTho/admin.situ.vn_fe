import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, message, List } from 'antd';
import { updatePage } from '../../apis/pageService';

const SettingUser = ({ visible, onClose, dataPage, refreshPage }) => {
	const [gmail, setGmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [userList, setUserList] = useState([]);

	useEffect(() => {
		if (visible && dataPage) {
			setUserList(Array.isArray(dataPage.user_list) ? dataPage.user_list : []);
		}
	}, [visible, dataPage]);

	const handleAddGmail = async () => {
		if (!gmail) {
			message.warning('Nhập địa chỉ Gmail');
			return;
		}
		setLoading(true);
		try {
			if (userList.includes(gmail)) {
				message.warning('Gmail đã có trong danh sách');
				setLoading(false);
				return;
			}
			const newList = [...userList, gmail];
			await updatePage({ ...dataPage, user_list: newList });
			setGmail('');
			setUserList(newList);
		} catch (err) {
			message.error('Lỗi khi thêm Gmail');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title="Cài đặt người dùng"
			open={visible}
			onCancel={onClose}
			footer={null}
			centered
		>
			<div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
				<Input
					placeholder="Nhập Gmail"
					value={gmail}
					onChange={e => setGmail(e.target.value)}
					style={{ flex: 1 }}
				/>
				<Button
					type="primary"
					loading={loading}
					onClick={handleAddGmail}
				>
					Add
				</Button>
			</div>
			<div>
				<b>Danh sách người dùng trang này:</b>
				<List
					size="small"
					bordered
					dataSource={userList}
					renderItem={item => <List.Item>{item}</List.Item>}
					style={{ marginTop: 8 }}
				/>
			</div>
		</Modal>
	);
};

export default SettingUser;