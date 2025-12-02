import React, { useContext, useEffect, useState, useRef } from 'react';
import css from './TableCustom.module.css';
import { Album_Icon, File_Icon, Form_Icon, Item_Icon, Table_Icon,List_Icon } from '../../../../icon/IconSvg.jsx';
import { updatePageSection } from '../../../../apis/pageSectionService.jsx';
import SettingTableCustom from './SettingTableCustom.jsx';
import CreateTableCustom from './CreateTableCustom.jsx';
import { updateContentPage } from '../../../../apis/contentPageService.jsx';
import { createTimestamp, formatDateToDDMMYYYY2, getEmailPrefix } from '../../../../generalFunction/format.js';
import { MyContext } from '../../../../MyContext.jsx';
import ListFile from './PreviewFile/ListFile.jsx';
import EditTableCustom from './EditTableCustom.jsx';
import { createNewContentPagePublic } from '../../../../apis/public/publicService.jsx';
import { message } from 'antd';
import { DownloadOutlined, EyeOutlined, SettingOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import PreviewComponent from './PreviewFile/PreviewFile.jsx';
import { ICON_SIDEBAR_LIST } from '../../../../icon/IconSvg.jsx';
import { updateUser, getCurrentUserLogin } from '../../../../apis/userService.jsx';
import DropdownList from '../DropdownList.jsx';

export default function TableCustomShare({ sectionPageData }) {
	const [listData, setListData] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isModalOpenCreate, setIsModalOpenCreate] = useState(false);
	const [fieldConfigs, setFieldConfigs] = useState([]);
	const { currentUser, checkAdminPage, checkEditorPage, fetchCurrentUser } = useContext(MyContext);
	const [isMobile, setIsMobile] = useState(false);
	const [showHidden, setShowHidden] = useState(false);
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
	const [previewFiles, setPreviewFiles] = useState([]);
	const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
	const [existingData, setExistingData] = useState(null);
	const [currentFile, setCurrentFile] = useState(null);
	const [showFavoriteOnly, setShowFavoriteOnly] = useState(false);
	const [favoriteIds, setFavoriteIds] = useState([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [searchText, setSearchText] = useState('');
	const itemRefs = useRef({});

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 768); // ngưỡng mobile
		};
		handleResize(); // gọi lúc đầu tiên
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);


	useEffect(() => {
		setListData(sectionPageData?.contentPage || []);
		setFieldConfigs(sectionPageData?.info || []);
	}, [sectionPageData]);

	useEffect(() => {
		// Mark items as favorite based on currentUser.info.favorite
		const favoriteIds = Array.isArray(currentUser?.info?.favorite) ? currentUser.info.favorite : [];
		setListData(
			(sectionPageData?.contentPage || []).map(item => ({
				...item,
				favorite: favoriteIds.includes(item.id),
			}))
		);
		setFieldConfigs(sectionPageData?.info || []);
	}, [sectionPageData, currentUser]);

	useEffect(() => {
		setFavoriteIds(Array.isArray(currentUser?.info?.favorite) ? currentUser.info.favorite : []);
	}, [currentUser]);

	useEffect(() => {
		setListData(
			(sectionPageData?.contentPage || []).map(item => ({
				...item,
				favorite: favoriteIds.includes(item.id),
			}))
		);
		setFieldConfigs(sectionPageData?.info || []);
	}, [sectionPageData, favoriteIds]);


	const filteredList = listData.filter(item =>
		(item.name || 'Tiêu đề').toLowerCase().includes(searchText.toLowerCase())
	);

	const handleScrollToItem = (id) => {
		const ref = itemRefs.current[id];
		if (ref) {
			ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	};

	const handleToggleShow = (key, value) => {
		setFieldConfigs((prevFieldConfigs) =>
			prevFieldConfigs.map((field) =>
				field.key === key ? { ...field, show: value } : field,
			),
		);
	};

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				// Refetch or resync favoriteIds from currentUser
				setFavoriteIds(Array.isArray(currentUser?.info?.favorite) ? currentUser.info.favorite : []);
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
	}, [currentUser]);

	const handleToggleRequired = (key, value) => {
		setFieldConfigs((prevFieldConfigs) =>
			prevFieldConfigs.map((field) =>
				field.key === key ? { ...field, required: value } : field,
			),
		);
	};

	const handleSave = async () => {
		const updatedSectionPageData = {
			...sectionPageData,
			info: fieldConfigs,
		};
		await updatePageSection(updatedSectionPageData);
	};


	const handleCloseModal = async () => {
		await handleSave();
		setIsModalOpen(false);
	};

	const handleCloseModalCreate = () => {
		setIsModalOpenCreate(false);
	};


	const handleOpenModalCreate = () => {
		setIsModalOpenCreate(true);
	};

	const handleCloseModalEdit = () => {
		setIsModalOpenEdit(false);
	};


	const handleSaveCreate = async (formData) => {
		const simplifiedData = { ...formData };

		['anh_minh_hoa', 'dinh_kem'].forEach((key) => {
			if (simplifiedData[key]?.files) {
				simplifiedData[key] = simplifiedData[key].files;
			}
		});
		const newData = {
			created_at: createTimestamp(),
			updated_at: createTimestamp(),
			user_create: currentUser?.email,
			user_update: currentUser?.email,
			id_pageSection: sectionPageData.id,
			info: simplifiedData,
			name: simplifiedData?.tieu_de || 'Tiêu đề',
		};
		const data = await createNewContentPagePublic(newData);
		const newList = [...listData, data].sort(
			(a, b) => new Date(a.created_at) - new Date(b.created_at)
		);
		setListData(newList);
	};

	const handleSaveEdit = async (formData , tieuDe) => {
		const simplifiedData = { ...formData };
		const newData = {
			id: existingData.id,
			updated_at: createTimestamp(),
			user_update: currentUser.email,
			info: simplifiedData,
			name : tieuDe
		};
		const data = await updateContentPage(newData);
		setListData(prevListData => {
			return prevListData.map(item =>
				item.id === data.id ? { ...item, ...data } : item,
			);
		});
	};

	const handleHideContent = async (item) => {
		const updatedItem = {
			...item,
			hide: item.hide === true ? false : true,
		};

		setListData((prevList) =>
			prevList.map((el) =>
				el.id === updatedItem.id ? updatedItem : el,
			),
		);

		if (updatedItem.hide !== item.hide) {
			await updateContentPage(updatedItem);
		}
	};

	const handleConfirm = async (item) => {
		if (currentUser?.isAdmin) {
			if (!item?.info?.xac_nhan) {
				const updatedItem = {
					...item,
					info: {
						...item.info,
						xac_nhan: true,
						user_confirm: currentUser.email,
					},
				};

				setListData((prevList) =>
					prevList.map((el) =>
						el.id === updatedItem.id ? updatedItem : el,
					),
				);
				await updateContentPage(updatedItem);
			}
		} else {
			message.warning("Bạn không thể thao tác dữ liệu với các mục được chia sẻ")
		}
	};

	const handleOpenPreviewModal = (files) => {
		setPreviewFiles(files);
		setIsPreviewModalOpen(true);
	};

	const handleClosePreviewModal = () => {
		setIsPreviewModalOpen(false);
	};

	const handleEdit = (item) => {
		setExistingData(item);
		setIsModalOpenEdit(true);
	};


	const renderSectionIcon = (section) => {
		return <Item_Icon width={24} height={20}/>
		// switch (section.type) {
		// 	case 'Table':
		// 		return <Table_Icon width={20} height={20} />;
		// 	case 'Form':
		// 		return <Form_Icon width={20} height={20} />;
		// 	case 'File':
		// 		return <File_Icon width={20} height={20} />;
		// 	case 'Album':
		// 		return <Album_Icon width={20} height={20} />;
		// 	default:
		// 		return null;
		// }
	};
	function renderSidebarIcon(iconName, style = { width: 20, height: 20 }) {
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


	return (
		<div className={css.main}>
			<div className={css.pageInfo}>
				<div className={css.pageTitle}>
					{/*{renderSectionIcon(sectionPageData)}*/}
					<span className={css.nameElement}>{sectionPageData?.name}</span>
				</div>
				{/*{(currentUser?.isAdmin) && (*/}
				{/*	<div className={css.info}>*/}
				{/*		<span className={css.button} onClick={handleOpenModalCreate}>+ Mới</span>*/}
				{/*	</div>*/}
				{/*)}*/}
				<div className={css.info}>
					{isMobile ? (
						<>
						<div style={{ position: 'relative', display: 'inline-block', marginRight: 10 }}>
							  <span
								  className={`${css.button} ${css.mobileText}`}
								  onClick={() => setShowDropdown(v => !v)}
								  style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 10 }}
							  >
								Danh sách
								<List_Icon width={18} height={18} />
							  </span>
							<DropdownList
								show={showDropdown}
								onClose={() => setShowDropdown(false)}
								searchText={searchText}
								setSearchText={setSearchText}
								filteredList={filteredList}
								handleViewDetail={handleScrollToItem}
								minWidth={270}
							/>
						</div>
						<div className={css.info}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
								<span
									className={`${css.button} ${css.mobileText}`}
									onClick={() => setShowFavoriteOnly(fav => !fav)}
								>
									<HeartFilled style={{ color: showFavoriteOnly ? 'red' : '#aaa'}} />
								</span>
							</div>
							{(currentUser?.isAdmin || checkAdminPage || checkEditorPage) && (
								<span
									className={`${css.button} ${css.mobileText}`}
									onClick={() => setShowHidden(!showHidden)}
								>
							  {showHidden ? 'Quay lại' : 'Xem mục đã ẩn'}
							</span>
							)}
							{(currentUser?.isAdmin || checkAdminPage || checkEditorPage) && (
								<span
									className={`${css.button} ${css.mobileText}`}
									onClick={() => setIsModalOpen(true)}
								>
							  <SettingOutlined style={{ fontSize: 14 }} />
							</span>
							)}
							{(currentUser?.isAdmin) && (
								<span
									className={`${css.button} ${css.mobileText}`}
									onClick={handleOpenModalCreate}
								>
							  <span className={css.plusCircleMobile}>+</span>
							</span>
							)}
						</div>
						</>
					) : (
						<>
						<div style={{ position: 'relative', display: 'inline-block', marginRight: 16 }}>
							  <span
								  className={css.button}
								  onClick={() => setShowDropdown(v => !v)}
								  style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 10 }}
							  >
								Danh sách bài viết
								<List_Icon width={18} height={18} />
							  </span>
							<DropdownList
								show={showDropdown}
								onClose={() => setShowDropdown(false)}
								searchText={searchText}
								setSearchText={setSearchText}
								filteredList={filteredList}
								handleViewDetail={handleScrollToItem}
								minWidth={330}
							/>
						</div>
						<div className={css.info}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
								<span
									className={css.button}
									onClick={() => setShowFavoriteOnly(fav => !fav)}
								>
									<HeartFilled style={{ color: showFavoriteOnly ? 'red' : '#aaa'}} />
								</span>
							</div>
							{(currentUser?.isAdmin || checkAdminPage || checkEditorPage) && (
								<span
									className={css.button}
									onClick={() => setShowHidden(!showHidden)}
								>
							  {showHidden ? 'Quay lại' : 'Xem mục đã ẩn'}
							</span>
							)}
							{(currentUser?.isAdmin || checkAdminPage || checkEditorPage) && (
								<span
									className={css.button}
									style={{ cursor: 'pointer' }}
									onClick={() => setIsModalOpen(true)}
								>
								  Cài đặt
								</span>
							)}
							{(currentUser?.isAdmin) && (
								<span className={css.button} onClick={handleOpenModalCreate}>
								  <span className={css.plusCircle}>+</span> Thêm
								</span>
							)}
						</div>
						</>
					)}
				</div>

			</div>

			{/*<div className={css.optionButton}>*/}
			{/*	{(currentUser?.isAdmin || checkAdminPage || checkEditorPage) &&*/}
			{/*		<span style={{ cursor: 'pointer' }} onClick={() => setIsModalOpen(true)}>Cài đặt</span>*/}
			{/*	}*/}
			{/*	{(currentUser?.isAdmin || checkAdminPage || checkEditorPage) && (*/}
			{/*		<span onClick={() => setShowHidden(!showHidden)}>*/}
    		{/*			{showHidden ? 'Quay lại' : 'Xem mục đã ẩn'}*/}
  			{/*		</span>*/}
			{/*	)}*/}
			{/*</div>*/}

			{/* Danh sách các item */}
			<div className={`${css.cardList} ${css.customScrollbar}`}>
				{listData.filter(item => showHidden ? item?.hide : !item?.hide)
					.filter(item => !showFavoriteOnly || item.favorite)
					.map((item, index) => {
						return (
							<div
								key={item.id}
								ref={el => { itemRefs.current[item.id] = el; }}
								className={css.card}
							>
								{fieldConfigs.some(field => field.key === 'anh_minh_hoa' && field.show) && (
									<div
										style={{
											backgroundImage: `url(${(item?.info?.anh_minh_hoa?.[0]?.fileUrl)?.replace(/ /g, '%20')})`,
											backgroundSize: 'cover',
											backgroundPosition: 'center',
											backgroundRepeat: 'no-repeat',
											width: '100%',
											height: isMobile ? '250px' : '500px', // hoặc chỉnh chiều cao theo layout
											borderRadius: '8px', // nếu muốn bo góc
											padding: '10px',
											transition: 'background-image 0.3s ease-in-out',
										}}
									/>
								)}

								<div className={css.content}>

									{/*<h3 className={css.title}>{item?.info?.tieu_de || 'Tiêu đề'}</h3>*/}
									<div style={{display: 'flex', gap: '5px'}}>
										{item.icon && ICON_SIDEBAR_LIST.some(i => i.name === item.icon) && renderSidebarIcon(item.icon)}
										<h3 className={css.title}>{item?.name || 'Tiêu đề'}</h3>
									</div>


									{/* Mô tả */}
									{fieldConfigs.some(field => field.key === 'mo_ta' && field.show) && (
										<p className={css.desc}>
											<strong>Mô tả:</strong> {item?.info?.mo_ta}
										</p>
									)}

									{/* Note */}
									{fieldConfigs.some(field => field.key === 'note' && field.show) && (
										<p className={css.note}>
											<strong>Note:</strong> {item?.info?.note}
										</p>
									)}

									{/* Số tiền */}
									{fieldConfigs.some(field => field.key === 'gia_tri' && field.show) && (
										<p className={css.amount}>
											<strong>Số tiền:</strong> {item?.info?.gia_tri?.toLocaleString()}
										</p>
									)}

									{/*Phân loại */}
									{fieldConfigs.some(field => field.key === 'phan_loai' && field.show) && (
										<p className={css.amount}>
											<strong>Phân loại:</strong> {item?.info?.phan_loai}
										</p>
									)}

									{fieldConfigs.some(field => field.key === 'nguoi_gui' && field.show) && (
										<p className={css.amount}>
											<strong>Người gửi:</strong> {item?.info?.nguoi_gui}
										</p>
									)}

									{/* Đính kèm */}
									{/*{fieldConfigs.some(field => field.key === 'dinh_kem' && field.show) && (*/}
									{/*	<p className={css.attach}>*/}
									{/*		<strong>Đính kèm:</strong> {item?.info?.dinh_kem?.length}*/}
									{/*		<button style={{ marginLeft: '20px', cursor: 'pointer' }}*/}
									{/*				onClick={() => handleOpenPreviewModal(item?.info?.dinh_kem)}>Xem*/}
									{/*			trước*/}
									{/*		</button>*/}

									{/*	</p>*/}
									{/*)}*/}
									{fieldConfigs.some(field => field.key === 'dinh_kem' && field.show) && (
										<div className={css.attach}>
											<strong>Đính kèm</strong>
											{(() => {
												const dinhKem = item?.info?.dinh_kem;
												let files = [];
												let downloadable = true;
												if (Array.isArray(dinhKem) && dinhKem.length > 0) {
													if (dinhKem[0].files) {
														files = dinhKem[0].files;
														downloadable = dinhKem[0].downloadable !== false; // default true
													} else {
														files = dinhKem;
														downloadable = true;
													}
												}
												return files.length > 0 ? (
													<div style={{ margin: 0, paddingLeft: 16 }}>
														{files.map((file, idx) => (
															<div
																key={idx}
																className={css.card}
																style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
															>
															<span className={css.fileNameEllipsis} style={{ flex: 1 }} onClick={() => setCurrentFile(file)}>
																	  {file.fileName}
																	</span>
																<span
																	style={{ marginLeft: 10, cursor: 'pointer', fontSize: 18 }}
																	onClick={() => setCurrentFile(file)}
																	title={downloadable ? 'Tải về' : 'Xem trước'}
																>
																  {downloadable ? <DownloadOutlined /> : <EyeOutlined />}
																</span>
															</div>
														))}
													</div>
												) : (
													<span> Không có file đính kèm</span>
												);
											})()}
										</div>
									)}

									{fieldConfigs.some(field => field.key === 'time' && field.show) && (
										<p className={css.update}><strong>Thời gian: </strong>{formatDateToDDMMYYYY2(item?.info?.time|| item?.created_at)}
										</p>
									)}
									<div className={css.footer}>
										<div className={css.timeInfo}>
											<div>
											  <span className={css.update}>
												Update {formatDateToDDMMYYYY2(item?.updated_at || item?.created_at)} <span className={css.hideOnMobile}>{getEmailPrefix(item?.user_update)}</span>
											  </span>
												<span style={{padding: '0 2px'}}>
													  ||
												</span>
												<span className={css.create}>
													Create {formatDateToDDMMYYYY2(item.created_at)}
												  </span>
											</div>
											<div className={css.footerActions}>

												{fieldConfigs.some(field => field.key === 'xac_nhan' && field.show) && (
													<span
														onClick={() => handleConfirm(item)}
														style={{
															color: item?.info?.xac_nhan ? 'rgba(32, 135, 86, 1)' : 'rgba(224, 110, 34, 1)', // Thêm màu cho "Đã xác nhận" và "Chưa xác nhận"
															cursor: 'pointer', // Để người dùng biết có thể click vào
															fontSize: '14px', // Kích thước chữ
														}}
													>
										  {item?.info?.xac_nhan ? (
											  <>
												  Đã xác nhận ({getEmailPrefix(item?.info?.user_confirm)})
											  </>
										  ) : (
											  'Chưa xác nhận'
										  )}
										</span>
												)}

												{(currentUser?.isAdmin || checkAdminPage || checkEditorPage) &&
													<>
												<span className={css.action}
													  onClick={() => handleEdit(item)}>Edit</span>
														<span className={css.action}
															  onClick={() => handleHideContent(item)}>{item?.hide ? 'Bỏ ẩn' : 'Ẩn'}</span>
													</>
												}
												<span
													style={{ marginLeft: 8, color: item.favorite ? 'red' : '#aaa', cursor: 'pointer', fontSize: 18 }}
													onClick={async () => {
														const isFav = favoriteIds.includes(item.id);
														const newFavorite = isFav
															? favoriteIds.filter(id => id !== item.id)
															: [...favoriteIds, item.id];

														// Optimistically update UI
														setFavoriteIds(newFavorite);
														setListData(list =>
															list.map(el =>
																el.id === item.id ? { ...el, favorite: !el.favorite } : el
															)
														);

														// Update backend and refetch user from context
														await updateUser(currentUser.email, {
															info: { ...currentUser.info, favorite: newFavorite }
														});
														await fetchCurrentUser(); // This updates currentUser in context
													}}
												>
											  {item.favorite ? <HeartFilled /> : <HeartOutlined />}
											</span>
											</div>
										</div>

									</div>

								</div>
							</div>
						);
					})}

			</div>


			{isModalOpen && <SettingTableCustom isModalOpen={isModalOpen}
												handleCloseModal={handleCloseModal}
												handleToggleRequired={handleToggleRequired}
												handleToggleShow={handleToggleShow}
												fieldConfigs={fieldConfigs}
												setFieldConfigs={setFieldConfigs}

			/>}

			{isModalOpenCreate && <CreateTableCustom isOpen={isModalOpenCreate}
													 fieldConfigs={fieldConfigs}
													 onClose={handleCloseModalCreate}
													 onSave={handleSaveCreate}
			/>}

			{isPreviewModalOpen && <ListFile isPreviewModalOpen={isPreviewModalOpen}
											 previewFiles={previewFiles}
											 handleClosePreviewModal={handleClosePreviewModal}
			/>}

			{isModalOpenEdit && <EditTableCustom isOpen={isModalOpenEdit}
												 fieldConfigs={fieldConfigs}
												 onClose={handleCloseModalEdit}
												 onSave={handleSaveEdit}
												 existingData={existingData} // Truyền dữ liệu cũ vào để chỉnh sửa

			/>}
			{currentFile && (
				<PreviewComponent
					data={currentFile}
					onClose={() => setCurrentFile(null)}
					allowDownload={
						(() => {
							// Find the parent dinh_kem object for the current file
							const parentDinhKem = listData
								.find(item =>
									Array.isArray(item?.info?.dinh_kem) &&
									item.info.dinh_kem.some(dk =>
										Array.isArray(dk?.files) &&
										dk.files.some(f => f.fileUrl === currentFile.fileUrl)
									)
								)?.info?.dinh_kem?.find(dk =>
									Array.isArray(dk?.files) &&
									dk.files.some(f => f.fileUrl === currentFile.fileUrl)
								);
							// Default to true if not found
							return parentDinhKem?.downloadable !== false;
						})()
					}
				/>
			)}

		</div>
	);
}
