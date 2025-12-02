import { Button, Space, Typography, Spin, Modal, Input } from 'antd';
import {
	EditOutlined,
	ShareAltOutlined,
	DeleteOutlined,
	SettingOutlined,
	QuestionCircleOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { getContentPageDataById } from '../../../apis/contentPageService';
import { getPageSectionDataById } from '../../../apis/pageSectionService';
import React, { useState, useEffect, useContext } from 'react';
import { MyContext } from '../../../MyContext.jsx';
import SectionRenderer from './SectionRenderer/SectionRenderer.jsx';
import { updateContentPage } from '../../../apis/contentPageService';
import { ICON_SIDEBAR_LIST } from '../../../icon/IconSvg.jsx';
import ContentExam from '../../PageViewer/SectionPageDetail/Quiz/Admin/ContentExam.jsx';

const { Title } = Typography;

const ItemDetails = () => {
	const { itemId, folderId } = useParams();
	const [itemData, setItemData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [sectionPageData, setSectionPageData] = useState(null);
	const [fieldConfigs, setFieldConfigs] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editedName, setEditedName] = useState('');
	const [editedDescription, setEditedDescription] = useState('');
	const [selectedIcon, setSelectedIcon] = useState('');
	const [currentEditItem, setCurrentEditItem] = useState(null);
	const [quizModalVisible, setQuizModalVisible] = useState(false);


	const fetchItemData = async () => {
		try {
			setLoading(true);
			const response = await getContentPageDataById(itemId);
			const pageSection = await getPageSectionDataById(response.id_pageSection);
			setSectionPageData(pageSection);
			setFieldConfigs(pageSection?.info || []);
			setItemData(response);
		} catch (error) {
			console.error('Error fetching folder data:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (itemId) {
			fetchItemData();
		}
	}, [itemId]);


	const handleOpenModal = () => {
		setEditedName(itemData?.name || '');
		setEditedDescription(itemData?.description || '');
		setSelectedIcon(itemData?.icon || '');
		setIsModalOpen(true);
	};

	const handleSaveName = async () => {
		try {
			const updated = { ...itemData, name: editedName, icon: selectedIcon, description: editedDescription };
			await updateContentPage(updated);
			setItemData(updated);
			setIsModalOpen(false);
		} catch (error) {
			console.error('Failed to update name:', error);
		}
	};

	function renderSidebarIcon(iconName, style = { width: 15, height: 15 }) {
		const iconObj = ICON_SIDEBAR_LIST.find(i => i.name === iconName);
		if (iconObj && iconObj.icon) {
			// If icon is a string (SVG path), render as <img>
			if (typeof iconObj.icon === 'string') {
				return (
					<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
          <img src={iconObj.icon} alt={iconName} style={{ width: style.width, height: style.height }} />
        </span>
				);
			}
			// If icon is a React component, render as component
			return (
				<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        {React.createElement(iconObj.icon, style)}
      </span>
			);
		}
		return <div style={style} />;
	}


	if (loading) {
		return (
			<div style={{ padding: '24px', textAlign: 'center' }}>
				<Spin size='large' />
			</div>
		);
	}


	const handleQuizModal = (item) => {
		setCurrentEditItem(item);
		setQuizModalVisible(true);
	};

	const closeModal = () => {
		setQuizModalVisible(false);
		setCurrentEditItem(null);
	};

	return (
		<div style={{ padding: '24px', height: '100%' }}>
			<div style={{ marginBottom: '24px' }}>
				<div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
					<div style={{ display: 'flex', alignItems: 'center' }}>{renderSidebarIcon(itemData?.icon)}</div>
					<Title style={{ marginBottom: '0px' }} level={4}>{itemData?.name}</Title>
				</div>
				<Space>
					<Button icon={<SettingOutlined />}
							onClick={handleOpenModal}
							size='small'
					>
						Cài đặt
					</Button>
					{
						sectionPageData.type == 'ListTipTap' &&
						<Button icon={<QuestionCircleOutlined />}
								size='small'
								onClick={() => handleQuizModal(itemData)}>Cài đặt quiz</Button>
					}


				</Space>

			</div>

			<Modal
				title='Đổi tên mục'
				open={isModalOpen}
				onOk={handleSaveName}
				onCancel={() => setIsModalOpen(false)}
				okText='Lưu'
				cancelText='Hủy'
			>
				<Input
					value={editedName}
					onChange={e => setEditedName(e.target.value)}
					placeholder='Nhập tên mới'
					style={{ marginBottom: 16 }}
				/>
				<Input.TextArea
					value={editedDescription}
					onChange={e => setEditedDescription(e.target.value)}
					placeholder='Nhập mô tả'
					style={{ marginBottom: 16 }}
				/>
				<div style={{ marginBottom: 16 }}>
					<div style={{
						marginBottom: 8,
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}>
						<span>Chọn biểu tượng:</span>
						{selectedIcon && (
							<Button
								type='text'
								danger
								size='small'
								onClick={() => setSelectedIcon(null)}
							>
								Xóa icon
							</Button>
						)}
					</div>
					<div style={{
						display: 'flex',
						gap: 8,
						flexWrap: 'wrap',
						maxHeight: '120px',
						overflowY: 'auto',
						padding: '8px',
						border: '1px solid #d9d9d9',
						borderRadius: '4px',
					}}>
						{ICON_SIDEBAR_LIST.map(({ name, icon }) => (
							<div
								key={name}
								onClick={() => setSelectedIcon(name)}
								style={{
									padding: '8px',
									cursor: 'pointer',
									border: selectedIcon == name ? '2px solid #1890ff' : '2px solid transparent',
									borderRadius: '4px',
								}}
							>
								<img
									src={icon}
									alt={name}
									width={20}
									height={20}
								/>
							</div>
						))}
					</div>
				</div>
			</Modal>

			{sectionPageData && <SectionRenderer sectionPageData={sectionPageData}
												 fieldConfigs={fieldConfigs}
												 itemData={itemData}
												 setItemData={setItemData}
			/>}
			{quizModalVisible && <ContentExam quizModalVisible={quizModalVisible}
											  currentEditItem={currentEditItem}
											  closeModal={closeModal} />}

		</div>
	);
};

export default ItemDetails; 