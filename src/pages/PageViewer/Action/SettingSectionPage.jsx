import { Input, Modal, Switch, Tooltip, message, Tag, Button } from 'antd';
import {
	ArrowDownOutlined,
	ArrowUpOutlined,
	DeleteOutlined,
	EditOutlined,
	EyeInvisibleOutlined,
	EyeOutlined,
} from '@ant-design/icons';

import css from './SettingSectionPage.module.css';
import { deletePageSection, updatePageSection } from '../../../apis/pageSectionService.jsx';
import { useState, useEffect } from 'react';
import EditorSectionPage from './EditorSectionPage.jsx';

export default function SettingSectionPage({
											   isModalFolderVisible,
											   setIsModalFolderVisible,
											   setNewFolderData,
											   newFolderData,
											   tabs,
											   editTabName,
											   editTabId,
											   setEditTabName,
											   updateTabName,
											   swapPosition,
											   setEditTabId,
											   loadFileTab,
										   }) {
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
	const checkDisabled = !newFolderData.label;
	const okButtonStyle = checkDisabled
		? {}
		: {
			backgroundColor: '#2d9d5b',
			color: 'white',
			border: 'none',
		};
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [newEditor, setNewEditor] = useState('');
	const [tab, setTab] = useState([]);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleOpenEditor = (data) => {
		setTab(data);
		setIsModalVisible(true);
	};

	const handleCloseEditor = () => {
		setNewEditor('');
		setTab([]);
	};

	return (
		<Modal
			title='Danh sách hiện tại'
			open={isModalFolderVisible}
			onCancel={() => {
				setIsModalFolderVisible(false);
				setNewFolderData({ label: '' });
			}}
			footer={null}
			width={isMobile ? '95%' : 1200}
			okText='Tạo'
			cancelText='Hủy'
			bodyStyle={{ 
				height: isMobile ? '80vh' : '70vh',
				padding: isMobile ? '10px' : '24px'
			}}
			okButtonProps={{
				disabled: checkDisabled,
				style: okButtonStyle,
			}}
		>
			<div className={css.modalContent}>
				<div>
					{tabs
						.filter((template) => template.key !== 'tapFavorite')
						.sort((a, b) => (b.position || 0) - (a.position || 0))
						.map((tab, index, array) => (
							<div
								key={tab.key}
								style={{
									display: 'flex',
									flexDirection: isMobile ? 'column' : 'row',
									padding: isMobile ? '8px' : '12px',
									backgroundColor: '#f9f9f9',
									borderRadius: '8px',
									boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
									marginBottom: 17,
									gap: isMobile ? 10 : 5,
								}}
							>
								<div style={{ flex: 1, marginBottom: isMobile ? '10px' : 0 }}>
									{editTabId === tab.id ? (
										<Input
											value={editTabName}
											onChange={(e) => setEditTabName(e.target.value)}
											onPressEnter={async () =>
												await updateTabName(tab.id, editTabName)
											}
											onBlur={async () =>
												await updateTabName(tab.id, editTabName)
											}
											autoFocus
										/>
									) : (
										<>
											<span style={{ fontWeight: 500 }}>{tab.name}</span>

											<div style={{ 
												fontSize: 12, 
												color: '#888', 
												marginTop: 4,
												display: 'flex',
												flexWrap: 'wrap',
												gap: '4px'
											}}>
												Editor: {Array.isArray(tab.editor) && tab.editor.length > 0
												? tab.editor.map((editor, index) => (
													<Tag
														key={index}
														color='blue'
														closable
														onClose={async () => {
															try {
																const updatedEditors = tab.editor.filter((item) => item !== editor);
																const updatedTab = { ...tab, editor: updatedEditors };
																await updatePageSection(updatedTab);
																message.success('Đã xóa editor thành công');
																await loadFileTab();
															} catch (error) {
																console.error('Error removing editor:', error);
																message.error('Có lỗi xảy ra khi xóa editor');
															}
														}}
														style={{ marginBottom: 4 }}
													>
														{editor}
													</Tag>
												))
												: 'Chưa có editor'}
											</div>
										</>
									)}
								</div>

								<div style={{ 
									display: 'flex',
									gap: isMobile ? '8px' : '15px',
									width: isMobile ? '100%' : 'max-content',
									alignItems: 'center',
									flexWrap: isMobile ? 'wrap' : 'nowrap',
									justifyContent: isMobile ? 'space-between' : 'flex-end'
								}}>
									
									
									<div style={{ 
										display: 'flex', 
										gap: isMobile ? '12px' : '15px',
										alignItems: 'center'
									}}>
										<Button 
										size={isMobile ? 'small' : 'middle'}
										onClick={() => handleOpenEditor(tab)}
									>
										Editor
									</Button>
										<Tooltip title='Lên'>
											<ArrowUpOutlined
												onClick={() => swapPosition(tab, array[index - 1])}
												style={{
													color: index === 0 ? '#ccc' : '#1890ff',
													cursor: index === 0 ? 'not-allowed' : 'pointer',
													fontSize: isMobile ? '16px' : '14px'
												}}
											/>
										</Tooltip>

										<Tooltip title='Xuống'>
											<ArrowDownOutlined
												onClick={() => swapPosition(tab, array[index + 1])}
												style={{
													color: index === array.length - 1 ? '#ccc' : '#1890ff',
													cursor: index === array.length - 1 ? 'not-allowed' : 'pointer',
													fontSize: isMobile ? '16px' : '14px'
												}}
											/>
										</Tooltip>

										<Tooltip title='Sửa'>
											<EditOutlined
												onClick={() => {
													setEditTabId(tab.id);
													setEditTabName(tab.name);
												}}
												style={{ 
													color: '#52c41a', 
													cursor: 'pointer',
													fontSize: isMobile ? '16px' : '14px'
												}}
											/>
										</Tooltip>

										<Tooltip title={tab.hide ? 'Hiện' : 'Ẩn'}>
											<Switch
												size={isMobile ? 'small' : 'default'}
												checked={!tab.hide}
												onChange={async (checked) => {
													try {
														await updatePageSection({
															...tab,
															hide: !checked,
														});
														message.success(
															checked ? 'Hiện thành công' : 'Ẩn thành công',
														);
														await loadFileTab();
													} catch (error) {
														console.error('Error toggle tab visibility:', error);
														message.error('Có lỗi xảy ra');
													}
												}}
												checkedChildren={<EyeOutlined />}
												unCheckedChildren={<EyeInvisibleOutlined />}
												style={{
													background: tab.hide ? '#df515a' : '#259c63',
												}}
											/>
										</Tooltip>

									
										<Tooltip title={tab.is_editor ? 'Tắt chế độ Editor' : 'Bật chế độ Editor'}>
										<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
											<Switch
												size={isMobile ? 'small' : 'default'}
												checked={tab.is_editor === true}
												onChange={async (checked) => {
													try {
														await updatePageSection({
															...tab,
															is_editor: checked,
														});
														message.success(
															checked
																? 'Đã bật chế độ chỉ Admin và Editor xem được'
																: 'Đã bật chế độ tất cả người dùng đều xem được',
														);
														await loadFileTab();
													} catch (error) {
														console.error('Error toggling editor mode:', error);
														message.error('Có lỗi khi thay đổi chế độ chỉnh sửa');
													}
												}}
												checkedChildren="Editor"
												unCheckedChildren="Public"
												style={{
													background: tab.is_editor ? '#259c63' : '#df515a',
												}}
											/>
										</div>
									</Tooltip>
									<Tooltip title='Xóa'>
											<DeleteOutlined
												onClick={async () => {
													try {
														await deletePageSection(tab.id);
														message.success('Xóa thành công');
														await loadFileTab();
													} catch (error) {
														console.error('Error deleting tab:', error);
														message.error('Có lỗi xảy ra khi xóa');
													}
												}}
												style={{ 
													color: '#f5222d', 
													cursor: 'pointer',
													fontSize: isMobile ? '16px' : '14px'
												}}
											/>
										</Tooltip>
									</div>
								</div>
							</div>
						))}
				</div>
			</div>
			{isModalVisible && <EditorSectionPage 
				isModalVisible={isModalVisible}
				setIsModalVisible={setIsModalVisible}
				tab={tab}
				updatePageSection={updatePageSection}
				loadFileTab={loadFileTab}
				newEditor={newEditor}
				setNewEditor={setNewEditor}
			/>}
		</Modal>
	);
}
