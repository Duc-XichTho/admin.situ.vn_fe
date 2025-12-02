import { IconButton } from '@mui/material';
import { Drawer, Menu, message, Popover, Button } from 'antd';
import { LogIn, LogOut } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { createNewPageSection, updatePageSection } from '../../apis/pageSectionService.jsx';
import { updatePage } from '../../apis/pageService.jsx';
import { uploadFiles } from '../../apis/uploadImageWikiNoteService.jsx'; // Add this import
import {
	createNewSettingPublic,
	getPageDataByPathPublic,
	getPageSectionDataShareByIdPagePublic,
	getSettingByTypePublic,
} from '../../apis/public/publicService.jsx'; // Nếu bạn dùng Lucide

import SettingUser from './SettingUser.jsx'; // Import at the top
import { logout } from '../../apis/userService.jsx';
import { InfoAlbum, InfoFile, InfoForm, InfoTable } from '../../constain/Constain.js';
import { createTimestamp } from '../../generalFunction/format.js';
import {
	Album_Icon,
	File_Icon,
	Form_Icon,
	Item_Icon,
	ListTipTap_Icon,
	Menu_Icon,
	SettingIcon, Side_Bar,
	Table_Icon,
	TipTap_Icon,
} from '../../icon/IconSvg.jsx';
import { MyContext } from '../../MyContext.jsx';
import SettingThemeColor from './SettingThemeColor.jsx';
import ChangePasswordModal from './Action/ChangePasswordModal.jsx';
import CreateSectionPage from './Action/CreateSectionPage.jsx';
import EditHeaderPage from './Action/EditHeaderPage.jsx';
import SettingSectionPage from './Action/SettingSectionPage.jsx';
import css from './PageViewer.module.css';
import { Modal, Input } from 'antd';

export default function PageViewer() {
	const { page, sectionPageID } = useParams();
	const [dataPage, setDataPage] = useState(null);
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const navigate = useNavigate();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [inputValue, setInputValue] = useState('');
	const [headerTitle, setHeaderTitle] = useState(null);
	const [openPopover, setOpenPopover] = useState(false);
	const [createModalVisible, setCreateModalVisible] = useState(false);
	const [sectionName, setSectionName] = useState('');
	const [sectionType, setSectionType] = useState('');
	const { currentUser, setCheckAdminPage, checkAdminPage, checkEditorPage, setCheckEditorPage , loadData, setLoadData } = useContext(MyContext);
	const [isModalFolderVisible, setIsModalFolderVisible] = useState(false);
	const [newFolderData, setNewFolderData] = useState({ label: '' });
	const [editTabName, setEditTabName] = useState('');
	const [editTabId, setEditTabId] = useState(null);
	const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isPasswordConfirmed, setIsPasswordConfirmed] = useState(false);
	const [dataShare, setDataShare] = useState([]);
	const [passwordModalVisible, setPasswordModalVisible] = useState(false);
	const [pagePassword, setPagePassword] = useState('');
	const [passwordError, setPasswordError] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [themeColor, setThemeColor] = useState('#FFFFFF');
	const [settingTheme, setSettingTheme] = useState(null);
	const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
	const [uploadedFile, setUploadedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
	const [isUserSettingModalOpen, setIsUserSettingModalOpen] = useState(false);


	const fetchDataColor = async () => {
		try {
			let data = await getSettingByTypePublic(`settingTheme_${page}`);

			if (!data) {
				const defaultSetting = {type: `settingTheme_${page}`, setting: {themeColor: '#FFFFFF'}};
				data = await createNewSettingPublic(defaultSetting);
			}
			setThemeColor(data.setting.themeColor);
			setSettingTheme(data); // Save for update
		} catch (error) {
			console.error('Error fetching theme color:', error);
		}
	};

	useEffect(() => {
		fetchDataColor();
	}, []);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 768); // ngưỡng mobile
		};
		handleResize(); // gọi lúc đầu tiên
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const fetchDataPage = async () => {
		const data = await getPageDataByPathPublic(page);
		if (data) {
			const dataShare = await getPageSectionDataShareByIdPagePublic(data.id , currentUser);
			if (dataShare) {
				setDataShare(dataShare);
			}
		}
		if (data.admin_page == currentUser?.email) {
			setCheckAdminPage(true);
		}
		setDataPage(data);
		setHeaderTitle(data.name);
		if (data?.pageSections?.length > 0 && !sectionPageID) {
			const firstSectionId = data.pageSections[0].id;
			navigate(`/${page}/section/${firstSectionId}`);
		}
	};


	useEffect(() => {
		fetchDataPage();
	}, [page, currentUser , loadData]);

	const userList = dataPage?.user_list || [];
	const currentUserEmail = currentUser?.email;

	const filteredDataShare = dataShare.filter(item => {
		const shared = item.shared_to_page_ids;
		if (
			shared &&
			typeof shared === 'object' &&
			shared.private?.includes(dataPage?.id)
		) {
			// Only show if current user is in user_list or is admin_page
			return userList.includes(currentUserEmail) || dataPage?.admin_page === currentUserEmail;
		}
		// Show all other items
		return true;
	});


	console.log(filteredDataShare);



	// In PageViewer.jsx, update the useEffect for password checking
	useEffect(() => {
		if (dataPage) {
			setCurrentPassword(dataPage.password);
			if (dataPage.password && !sessionStorage.getItem(`page_auth_${dataPage.id}`)) {
				setPasswordModalVisible(true);
			} else {
				// Only fetch additional data if authentication passed or not needed
				fetchAdditionalPageData();
			}
		}
	}, [dataPage , currentUser]);

// Add this function to fetch additional data only after authentication
	const fetchAdditionalPageData = async () => {
		if (!dataPage) return;

		const dataShare = await getPageSectionDataShareByIdPagePublic(dataPage.id , currentUser);
		if (dataShare) {
			setDataShare(dataShare);
		}

		if (dataPage.admin_page === currentUser?.email) {
			setCheckAdminPage(true);
		}

		if (dataPage?.pageSections?.length > 0 && !sectionPageID) {
			const firstSectionId = dataPage.pageSections[0].id;
			navigate(`/${page}/section/${firstSectionId}`);
		}
	};

// Update the handleVerifyPassword function to fetch additional data after successful authentication
	const handleVerifyPassword = () => {
		if (pagePassword === dataPage?.password) {
			sessionStorage.setItem(`page_auth_${dataPage.id}`, 'true');
			setPasswordModalVisible(false);
			setPasswordError(false);
			// Fetch additional data after successful authentication
			fetchAdditionalPageData();
		} else {
			setPasswordError(true);
			message.error('Sai mật khẩu, vui lòng thử lại');
		}
	};

	const openDrawerFromIcon = () => {
		if (isMobile) {
			setDrawerVisible(true);
		}
	};

	const closeDrawer = () => {
		setDrawerVisible(false);
	};

	const renderSectionIcon = (section) => {
		switch (section.type) {
			case 'ListTipTap':
				return <ListTipTap_Icon width={20} height={20} />;
			case 'TipTap':
				return <TipTap_Icon width={20} height={20} />;
			case 'Table':
				return <Table_Icon width={20} height={20} />;
			case 'Form':
				return <Form_Icon width={20} height={20} />;
			case 'Album':
				return <Album_Icon width={20} height={20} />;
			case 'File':
				return <File_Icon width={20} height={18} />;

			default:
				return;
		}
	};

	const handleClick = (value) => {
		if (value.origin_type === 'share') {
			navigate(`/${page}/sectionShare/${value.id}`);
		} else {
			navigate(`/${page}/section/${value.id}`);
		}
		setDrawerVisible(false);
	};

	const handleOpenChange = (visible) => {
		setOpenPopover(visible);
	};

	const handleEditHeader = () => {
		setIsModalOpen(true);
		setInputValue(dataPage?.name);
		handleOpenChange();
	};
	const handleSetPassword = () => {
		// Reset the password fields and show the modal
		setOldPassword('');
		setNewPassword('');
		setConfirmPassword('');
		setIsPasswordConfirmed(true);
		setIsChangePasswordModalVisible(true);
		handleOpenChange(false);
	};

	// const handleConfirmOldPassword = () => {
	// 	if (oldPassword === dataPage?.password) {
	// 		setIsPasswordConfirmed(true);
	// 		message.success('Mật khẩu cũ đúng');
	// 	} else {
	// 		message.error('Mật khẩu cũ không chính xác');

	// 	}
	// };

	const handleFileChange = (e) => {
		const file = e.target.files?.[0];
		setUploadedFile(file);
		if (file && file.type.startsWith('image/')) {
			setPreviewUrl(URL.createObjectURL(file));
		} else {
			setPreviewUrl(null);
		}
	};

	const handleSaveFile = async () => {
		if (!uploadedFile) return;
		try {
			// Upload file
			const res = await uploadFiles([uploadedFile]);
			// Assume res is an array of uploaded file info, e.g. [{ url, type }]
			const fileInfo = res.files[0];
			// Update page with avatar info
			await updatePage({
				...dataPage,
				avatar : fileInfo,
			});
			message.success('Cập nhật Avatar thành công!');
			setUploadedFile(null);
			setPreviewUrl(null);
			await fetchDataPage(); // Refresh page data
		} catch (err) {
			message.error('Upload failed');
		}
	};

	const handleUpdatePassword = async () => {
		// if (!isPasswordConfirmed) {
		// 	message.warning('Vui lòng xác nhận mật khẩu cũ');
		// 	return;
		// }
		// if (!newPassword || !confirmPassword) {
		// 	message.warning('Vui lòng nhập đầy đủ thông tin');
		// 	return;
		// }
		// if (newPassword !== confirmPassword) {
		// 	message.error('Mật khẩu xác nhận không khớp');
		// 	return;
		// }
		try {
			await updatePage({ ...dataPage, password: newPassword });
			await fetchDataPage();
			message.success('Thay đổi mật khẩu thành công');
			setIsChangePasswordModalVisible(false);
		} catch (err) {
			message.error('Có lỗi xảy ra khi cập nhật mật khẩu');
		}
	};

	const handleSettingPage = () => {
		setIsModalFolderVisible(true);
		handleOpenChange();
	};

	const handleOpenCreateSectionPage = () => {
		setCreateModalVisible(true);
		handleOpenChange();
	};

	const closeModal = () => setIsModalOpen(false);

	const closeModalCreateSectionPage = () => {
		setSectionName('');
		setSectionType('');
		setCreateModalVisible(false);
	};

	const handleOk = async () => {
		setHeaderTitle(inputValue);
		const updatedData = {
			...dataPage,
			name: inputValue,
		};
		await updatePage(updatedData);
		closeModal();
	};

	const handleCreateSectionPage = async () => {
		let sectionInfo;
		switch (sectionType) {
			case 'Table':
				sectionInfo = InfoTable;
				break;
			case 'Form':
				sectionInfo = InfoForm;
				break;
			case 'File':
				sectionInfo = InfoFile;
				break;
			case 'Album':
				sectionInfo = InfoAlbum;
				break;

			default:
				sectionInfo = [];
				break;
		}
		const updatedData = {
			id_page: dataPage.id,
			type: sectionType,
			name: sectionName,
			created_at: createTimestamp(),
			user_create: currentUser.email,
			info: sectionInfo,

		};

		const newSection = await createNewPageSection(updatedData);
		if (newSection) {
			setDataPage((prev) => ({
				...prev,
				pageSections: [...(prev?.pageSections || []), newSection],
			}));
		}
		closeModalCreateSectionPage();
	};


	const content = (
		<Menu
			items={[
				{
					key: 'create',
					label: 'Thêm mới',
					onClick: handleOpenCreateSectionPage,
				},
				{
					key: 'edit',
					label: 'Edit header',
					onClick: handleEditHeader,
				},
				...(checkAdminPage ? [{
					key: 'password',
					label: 'Đặt password',
					onClick: () => {
						console.log("1");
						handleSetPassword();
					},
				}] : []),
				{
					key: 'setting',
					label: 'Cài đặt trang',
					onClick: handleSettingPage,
				},
				{
					key: 'changeTheme',
					label: 'Thay đổi giao diện',
					onClick: () => {
						setIsThemeModalOpen(true);
					},
				},
				{
					key: 'changeAvatar',
					label: 'Thay đổi Avatar',
					onClick: () => {
						setIsAvatarModalOpen(true);
						handleOpenChange(false);
					},
				},
				{
					key: 'userSettings',
					label: 'Cài đặt người dùng',
					onClick: () => {
						setIsUserSettingModalOpen(true);
						handleOpenChange(false);
					},
				},
			]}
		/>
	);
	const refreshPage = async () => {
		await fetchDataPage();
	};

	const MenuIcon = ({ width = 20, height = 17, color = '#E77C4E' }) => (
		<svg width={width} height={height} viewBox="0 0 32 32" fill="none">
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M8.72727 0H0V8.72727H8.72727V0ZM20.3636 0H11.6364V8.72727H20.3636V0ZM32 0H23.2727V8.72727H32V0ZM8.72727 11.6364H0V20.3636H8.72727V11.6364ZM8.72727 23.2727H0V32H8.72727V23.2727ZM20.3636 11.6364H11.6364V20.3636H20.3636V11.6364ZM20.3636 23.2727H11.6364V32H20.3636V23.2727ZM32 11.6364H23.2727V20.3636H32V11.6364ZM32 23.2727H23.2727V32H32V23.2727Z"
				fill={color}
			/>
		</svg>
	);

	const updateTabName = async (tabId, newName) => {
		try {
			await updatePageSection({ id: tabId, name: newName });
			await fetchDataPage();
			setEditTabId(null);
		} catch (error) {
			console.error('Lỗi khi cập nhật:', error);
			message.error('Có lỗi xảy ra khi cập nhật');
		}
	};

	const swapPosition = async (tab1, tab2) => {
		if (!tab1 || !tab2) return;

		try {
			await updatePageSection({ id: tab1.id, position: tab2.position });
			await updatePageSection({ id: tab2.id, position: tab1.position });
			await fetchDataPage();
		} catch (error) {
			console.error('Error swapping position:', error);
			message.error('Có lỗi xảy ra khi đổi vị trí');
		}
	};

	const handleLogin = () => {
		const currentPath = window.location.pathname + window.location.search;
		window.open(`${import.meta.env.VITE_API_URL}/login?redirect=${encodeURIComponent(currentPath)}`, '_self');
	};

	const handleLogout = async () => {
		try {
			await logout();
			window.location.reload();
		} catch (error) {
			console.error('Logout failed:', error);
		}
	};


	return (
		<div className={css.container}>
			{dataPage?.password && !sessionStorage.getItem(`page_auth_${dataPage.id}`) ? (
				<Modal
					title="Trang được bảo vệ"
					open={true}
					onOk={handleVerifyPassword}
					onCancel={() => navigate('/')}
					okText="Xác nhận"
					cancelText="Quay lại"
					closable={false}
					maskClosable={false}
				>
					<p>Trang này yêu cầu mật khẩu để truy cập.</p>
					<Input
						placeholder="Nhập mật khẩu"
						value={pagePassword}
						onChange={(e) => setPagePassword(e.target.value)}
						status={passwordError ? 'error' : ''}
						onPressEnter={handleVerifyPassword}
						style={{ marginTop: 16 }}
						autoFocus
					/>
				</Modal>
			) : (
			<div className={css.layout}>


				{!isMobile && <div className={css.sidebar} />}

				<div className={css.main}>
					<div className={css.headerCard}
						 style={{ backgroundColor: themeColor }}>
						<div className={css.headerItem}>
							{/* Bấm vào icon để mở Drawer */}
							{ isMobile && (<IconButton onClick={openDrawerFromIcon}>
								<MenuIcon color={settingTheme?.setting?.fontColor || '#E77C4E'} />
							</IconButton>)}

							<div
								className={css.headerTitle}
								style={{ color: settingTheme?.setting?.fontColor || '#000' }}
							>
								{headerTitle}
							</div>
						</div>
					</div>
					<div className={css.mainInfo}>
						{
							!isMobile &&
							<div className={css.sidebarDesktop} style={{ width: isMobile ? '0%' : '30%' }}>
								<div style={{

									alignItems: 'center',
									gap: 8,
									justifyContent: 'space-between',
								}}>
									{/*<div*/}
									{/*	style={{*/}
									{/*		width: '100%',*/}
									{/*		height: 240,*/}
									{/*		border: '2px dashed #bbb',*/}
									{/*		borderRadius: 8,*/}
									{/*		display: 'flex',*/}
									{/*		alignItems: 'center',*/}
									{/*		justifyContent: 'center',*/}
									{/*		marginBottom: 16,*/}
									{/*		background: '#fafafa',*/}
									{/*		flexDirection: 'column',*/}
									{/*		position: 'relative',*/}
									{/*	}}*/}
									{/*>*/}
									{/*	<input*/}
									{/*		type="file"*/}
									{/*		onChange={handleFileChange}*/}
									{/*		style={{ marginBottom: 8 }}*/}
									{/*	/>*/}
									{/*	{uploadedFile ? (*/}
									{/*		<>*/}
									{/*			{previewUrl ? (*/}
									{/*				<img*/}
									{/*					src={previewUrl}*/}
									{/*					alt="preview"*/}
									{/*					style={{ maxWidth: 200, maxHeight: 120, marginBottom: 8 }}*/}
									{/*				/>*/}
									{/*			) : (*/}
									{/*				<span style={{ fontSize: 14 }}>{uploadedFile.name}</span>*/}
									{/*			)}*/}
									{/*			<Button type="primary" size="small" onClick={handleSaveFile}>*/}
									{/*				Save*/}
									{/*			</Button>*/}
									{/*		</>*/}
									{/*	) : (*/}
									{/*		dataPage?.avatar?.fileUrl && (*/}
									{/*			<img*/}
									{/*				src={dataPage.avatar.fileUrl}*/}
									{/*				alt="avatar"*/}
									{/*				style={{ maxWidth: 200, maxHeight: 120, marginBottom: 8 }}*/}
									{/*			/>*/}
									{/*		)*/}
									{/*	)}*/}
									{/*</div>*/}
									<div
										style={{
											width: '100%',
											height: 220,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											marginBottom: 16,
											background: '#fafafa',
											flexDirection: 'column',
											position: 'relative',
										}}
									>
										{dataPage?.avatar?.fileUrl && (
											<img
												src={dataPage.avatar.fileUrl}
												alt="avatar"
												style={{
													width: '100%',
													height: '100%',
													objectFit: 'cover',
												}}
											/>
										)}
									</div>
									{/*<span className={css.titleShare}>Danh sách</span>*/}
									<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
										<Popover
											visible={openPopover}
											onVisibleChange={handleOpenChange}
											content={content}
											trigger='click'
											placement='right'
											overlayStyle={{ zIndex: 2000 }}
										>
											{(currentUser?.isAdmin || checkAdminPage) && (
												<span style={{ color: '#262626', fontWeight: 600, cursor: 'pointer' }}>
        										Cài đặt
												</span>
											)}
										</Popover>
									</div>

								</div>
								<div className={css.scrollableSection}>
								<div className={css.sectionList}>
									{dataPage?.pageSections
										?.filter((section) => section.hide === false) // chỉ lấy section không bị ẩn
										?.map((section) => (
											<div className={css.sectionItem} key={section.id}>
												{renderSectionIcon(section)}
												<span
													onClick={() => handleClick(section)}
													className={`${css.sectionTitle} ${sectionPageID === section.id ? css.active : ''
													}`}
												>
												{section.name}
											</span>
											</div>
										))}
								</div>
								<div className={css.optionModule}>
									{
										dataShare.length > 0 &&
										<span className={css.titleShare}>Kho tài nguyên - {dataPage?.path}</span>
									}
									{filteredDataShare?.map((item) => {
										const isListTipTap = item.type === 'ListTipTap';
										let completed = 0;
										let notCompleted = 0;
										item.contentPages.forEach(page => {
											if (page.quiz && page.quizUser && page.quizUser.status === 'complete') {
												completed++;
											} else if (page.quiz && page.quizUser && page.quizUser.status === 'onGoing'){
												notCompleted++;
											}
										});
										// if (isListTipTap && Array.isArray(item.info)) {
										// 	completed = item.info.filter(i => i.completed).length;
										// 	notCompleted = item.info.length - completed;
										// }
										return (
											<div
												className={`${css.sectionItem}`}
												key={item.id}
												onClick={() => handleClick(item)}
												style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
											>
												{Array.isArray(item.avatar) && item.avatar.length > 0 && item.avatar[0].fileUrl ? (
													<img
														src={item.avatar[0].fileUrl}
														alt={item.avatar[0].fileName || 'avatar'}
														style={{ width: 80, height: 80, objectFit: 'cover' }}
													/>
												) : (
													<div className={css.itemBox}></div>
												)}
												<div style={{ marginLeft: 20, display: 'flex', flexDirection: 'column', gap: '5px' }}>
													<div className={`${sectionPageID === item.id ? css.active : ''}`} style={{fontSize: '14.5px'}}>{item.name}</div>
													<div style={{fontSize: '12px', fontWeight: 400, color: '#888'}}>{item.mo_ta}</div>
													<div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
														{item.tag1 && <div className={css.tag1} style={{ fontSize: isMobile ? 11.5 : undefined }}>{item.tag1}</div>}
														{item.tag2 && <div className={css.tag2} style={{ fontSize: isMobile ? 11.5 : undefined }}>{item.tag2}</div>}
														{isListTipTap && (
															<span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>
																{completed > 0 && <>✔️ {completed} &nbsp;</>}
																{notCompleted > 0 && <>❌ {notCompleted}</>}
															</span>
														)}
													</div>
												</div>
											</div>
										);
									})}
									{
										currentUser?.email ?
											<div className={css.sectionItem} onClick={handleLogout}>
												<LogOut width={20} height={20} />
												<span className={css.sectionTitle}>Đăng xuất</span>
											</div> :
											<div className={css.sectionItem} onClick={handleLogin}>
												<LogIn width={20} height={20} />
												<span className={css.sectionTitle}>Đăng Nhập</span>
											</div>
									}

								</div>
								</div>
								<div className={css.footerSection}>
									<div className={css.footerLogoRow}>
										<Side_Bar />
										<span className={css.footerTitle}>hongky.info</span>
									</div>
									<div className={css.footerSubtitle}>Miniweb & Tài nguyên số</div>
									<div className={css.footerContact}>Liên hệ hỗ trợ +84906627590</div>
								</div>

							</div>
						}

						<div className={css.cardWrapper} style={{ padding: !isMobile ? '20px' : '0px 0px 0px 0px' }}>

							<div className={css.info}>
								<Outlet />
							</div>

						</div>
					</div>

				</div>

				{!isMobile && <div className={css.sidebar} />}
			</div>
			)}
			{/* Drawer để hiển thị danh sách mục */}
			{
				isMobile &&
				<Drawer
					title={
						<div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>

							<span className={css.titleShare}>Danh sách</span>
							<Popover
								visible={openPopover}
								onVisibleChange={handleOpenChange}
								content={content}
								trigger='click'
								placement='right'
								overlayStyle={{ zIndex: 2000 }}
							>
								{(currentUser?.isAdmin || checkAdminPage) && (
									<IconButton>
										<SettingIcon width={15} height={16} />
									</IconButton>
								)}

							</Popover>

						</div>
					}
					placement='left'
					width={isMobile ? '89%' : 310}
					visible={drawerVisible}
					onClose={closeDrawer}
					bodyStyle={{ padding: '20px',display: 'flex', flexDirection: 'column' }}
					style={{ zIndex: 1001 }}
				>

					<div style={{ flex: 1, overflowY: 'auto' }}>
						<div className={css.sectionList}>
							<div
								style={{
									width: '100%',
									height: 180,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: 16,
									background: '#fafafa',
									flexDirection: 'column',
									position: 'relative',
								}}
							>
								{dataPage?.avatar?.fileUrl && (
									<img
										src={dataPage.avatar.fileUrl}
										alt="avatar"
										style={{
											width: '100%',
											height: '100%',
											objectFit: 'cover',
										}}
									/>
								)}
							</div>
							{dataPage?.pageSections
								?.filter(section => !section.hide)
								?.map(section => (
									<div className={css.sectionItem} key={section.id}>
										{renderSectionIcon(section)}
										<span
											onClick={() => handleClick(section)}
											className={`${css.sectionTitle} ${sectionPageID === section.id ? css.active : ''}`}
										>
              								{section.name}
            							</span>
									</div>
								))}
						</div>
						<div className={css.optionModule}>
							{
								dataShare.length > 0 &&
								<span className={css.titleShare}>Kho tài nguyên - {dataPage?.path}</span>
							}
							{filteredDataShare?.map((item) => {
								const isListTipTap = item.type === 'ListTipTap';
								let completed = 0;
								let notCompleted = 0;
								item.contentPages.forEach(page => {
									if (page.quiz && page.quizUser && page.quizUser.status === 'complete') {
										completed++;
									} else if (page.quiz && page.quizUser && page.quizUser.status === 'onGoing'){
										notCompleted++;
									}
								});
								// if (isListTipTap && Array.isArray(item.info)) {
								// 	completed = item.info.filter(i => i.completed).length;
								// 	notCompleted = item.info.length - completed;
								// }
								return (
									<div
										className={`${css.sectionItem}`}
										key={item.id}
										onClick={() => handleClick(item)}
										style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
									>
										{Array.isArray(item.avatar) && item.avatar.length > 0 && item.avatar[0].fileUrl ? (
											<img
												src={item.avatar[0].fileUrl}
												alt={item.avatar[0].fileName || 'avatar'}
												style={{ width: 80, height: 80, objectFit: 'cover' }}
											/>
										) : (
											<div className={css.itemBox}></div>
										)}
										<div style={{ marginLeft: 20, display: 'flex', flexDirection: 'column', gap: '5px' }}>
											<div className={`${sectionPageID === item.id ? css.active : ''}`} style={{fontSize: '14.5px'}}>{item.name}</div>
											<div style={{fontSize: '12px', fontWeight: 400, color: '#888'}}>{item.mo_ta}</div>
											<div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
												{item.tag1 && <div className={css.tag1} style={{ fontSize: isMobile ? 11.5 : undefined }}>{item.tag1}</div>}
												{item.tag2 && <div className={css.tag2} style={{ fontSize: isMobile ? 11.5 : undefined }}>{item.tag2}</div>}
												{isListTipTap && (
													<span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>
														{completed > 0 && <>✔️ {completed} &nbsp;</>}
														{notCompleted > 0 && <>❌ {notCompleted}</>}
													</span>
												)}
											</div>
										</div>
									</div>
								);
							})}
							{currentUser?.email ? (
								<div className={css.sectionItem} onClick={handleLogout}>
									<LogOut width={20} height={20} />
									<span className={css.sectionTitle}>Đăng xuất</span>
								</div>
							) : (
								<div className={css.sectionItem} onClick={handleLogin}>
									<LogIn width={20} height={20} />
									<span className={css.sectionTitle}>Đăng Nhập</span>
								</div>
							)}
						</div>
					</div>
					<div className={css.footerSection} style={{ marginTop: 'auto' }}>
						<div className={css.footerLogoRow}>
							<Side_Bar />
							<span className={css.footerTitle}>hongky.info</span>
						</div>
						<div className={css.footerSubtitle}>Miniweb & Tài nguyên số</div>
						<div className={css.footerContact}>Liên hệ hỗ trợ +84906627590</div>
					</div>
				</Drawer>
			}
			<Modal
				title="Thay đổi Avatar"
				open={isAvatarModalOpen}
				onCancel={() => {
					setIsAvatarModalOpen(false);
					setUploadedFile(null);
					setPreviewUrl(null);
				}}
				footer={null}
				centered
			>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					<input
						type="file"
						accept="image/*"
						onChange={handleFileChange}
						style={{ marginBottom: 16 }}
					/>
					{previewUrl ? (
						<img
							src={previewUrl}
							alt="preview"
							style={{ width: 200, height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
						/>
					) : dataPage?.avatar?.fileUrl ? (
						<img
							src={dataPage.avatar.fileUrl}
							alt="avatar"
							style={{ width: 200, height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
						/>
					) : null}
					<Button
						type="primary"
						onClick={async () => {
							await handleSaveFile();
							setIsAvatarModalOpen(false);
						}}
						disabled={!uploadedFile}
						style={{ marginTop: 8 }}
					>
						Lưu Avatar
					</Button>
				</div>
			</Modal>

			<SettingThemeColor
			isOpen={isThemeModalOpen}
			onClose={() => setIsThemeModalOpen(false)}
			/>

			{isModalOpen && <EditHeaderPage isModalOpen={isModalOpen}
											handleOk={handleOk}
											inputValue={inputValue}
											setInputValue={setInputValue}
											closeModal={closeModal}
			/>}

			{createModalVisible && <CreateSectionPage createModalVisible={createModalVisible}
													  sectionName={sectionName}
													  sectionType={sectionType}
													  setSectionName={setSectionName}
													  setSectionType={setSectionType}
													  handleCreateSectionPage={handleCreateSectionPage}
													  closeModalCreateSectionPage={closeModalCreateSectionPage}
			/>}

			{isModalFolderVisible && <SettingSectionPage isModalFolderVisible={isModalFolderVisible}
														 setIsModalFolderVisible={setIsModalFolderVisible}
														 setNewFolderData={setNewFolderData}
														 newFolderData={newFolderData}
														 tabs={dataPage?.pageSections}
														 editTabName={editTabName}
														 editTabId={editTabId}
														 setEditTabName={setEditTabName}
														 updateTabName={updateTabName}
														 swapPosition={swapPosition}
														 setEditTabId={setEditTabId}
														 loadFileTab={fetchDataPage}
			/>}

			<ChangePasswordModal
				visible={isChangePasswordModalVisible}
				onCancel={() => setIsChangePasswordModalVisible(false)}
				onOk={handleUpdatePassword}
				oldPassword={oldPassword}
				newPassword={newPassword}
				confirmPassword={confirmPassword}
				onChangeOldPassword={(e) => setOldPassword(e.target.value)}
				onChangeNewPassword={(e) => setNewPassword(e.target.value)}
				onChangeConfirmPassword={(e) => setConfirmPassword(e.target.value)}
				isPasswordConfirmed={isPasswordConfirmed}
				currentPassword={currentPassword}
				// onConfirmOldPassword={handleConfirmOldPassword}
			/>
			<SettingUser
				visible={isUserSettingModalOpen}
				onClose={() => setIsUserSettingModalOpen(false)}
				dataPage={dataPage}
				refreshPage={refreshPage}
			/>

		</div>
	);
}
