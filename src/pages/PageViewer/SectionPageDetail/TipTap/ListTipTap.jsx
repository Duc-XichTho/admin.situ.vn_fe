import React, { useContext, useEffect, useState } from 'react';
import css from './ListTipTap.module.css';
import { Album_Icon, File_Icon, Form_Icon, ListTipTap_Icon, Table_Icon, List_Icon } from '../../../../icon/IconSvg.jsx';
import { createNewContentPage, updateContentPage } from '../../../../apis/contentPageService.jsx';
import { MyContext } from '../../../../MyContext.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import ContentExam from '../Quiz/Admin/ContentExam.jsx';
import DropDownList from '../DropdownList.jsx';
import DropdownList from '../DropdownList.jsx';

export default function ListTipTap({ sectionPageData }) {
	const [listData, setListData] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showHidden, setShowHidden] = useState(false);
	const [imageSliderIndexes, setImageSliderIndexes] = useState({});
	const [loadingImages, setLoadingImages] = useState({});
	const { currentUser, checkAdminPage, checkEditorPage } = useContext(MyContext);
	const navigate = useNavigate();
	const { page, sectionPageID, itemID } = useParams();
	const [isMobile, setIsMobile] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [searchText, setSearchText] = useState('');

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
	}, [sectionPageData]);

	// Preload next images for all items
	useEffect(() => {
		listData.forEach(item => {
			const images = extractImagesFromContent(item?.content || '');
			const currentIndex = imageSliderIndexes[item.id] || 0;
			if (images[currentIndex + 1]) {
				preloadImage(images[currentIndex + 1]);
			}
		});
	}, [listData, imageSliderIndexes]);

	const extractImagesFromContent = (content) => {
		const parser = new DOMParser();
		const doc = parser.parseFromString(content, 'text/html');
		const images = Array.from(doc.getElementsByTagName('img'));
		return images.map(img => img.src);
	};

	const removeImagesFromContent = (content) => {
		const parser = new DOMParser();
		const doc = parser.parseFromString(content, 'text/html');
		const images = doc.getElementsByTagName('img');
		while (images.length > 0) {
			images[0].parentNode.removeChild(images[0]);
		}
		return doc.body.innerHTML;
	};

	const handleCreateNew = async (newContent) => {
		try {
			const newContentPage = {
				...newContent,
				id_pageSection: sectionPageID,
				hide: false
			};

			const response = await createNewContentPage(newContentPage);
			setListData(prevList => [...prevList, response]);
		} catch (error) {
			console.error('Error creating new content page:', error);
		}
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

	const preloadImage = (src) => {
		const img = new Image();
		img.src = src;
	};


	const filteredList = listData.filter(item =>
		(item.name || 'Tiêu đề').toLowerCase().includes(searchText.toLowerCase())
	);

	const handleViewDetail = (id) => {
		navigate(`/${page}/sectionShare/${sectionPageID}/detail/${id}`);
	};

	const handleImageLoad = (itemId, index) => {
		setLoadingImages(prev => ({
			...prev,
			[`${itemId}-${index}`]: false
		}));
	};

	const handleImageSlider = (itemId, direction, imagesLength, visibleCount) => {
		setImageSliderIndexes(prev => {
			const current = prev[itemId] || 0;
			let next = current + direction;
			if (next < 0) next = 0;
			if (next > imagesLength - visibleCount) next = imagesLength - visibleCount;
			if (next < 0) next = 0;

			// Preload next image
			const images = extractImagesFromContent(listData.find(item => item.id === itemId)?.content || '');
			if (images[next]) {
				preloadImage(images[next]);
			}

			return { ...prev, [itemId]: next };
		});
	};

	const renderSectionIcon = (section) => {
		switch (section?.type) {
			case 'ListTipTap':
				return <ListTipTap_Icon width={20} height={20} />;
			case 'Table':
				return <Table_Icon width={20} height={20} />;
			case 'Form':
				return <Form_Icon width={20} height={20} />;
			case 'File':
				return <File_Icon width={20} height={20} />;
			case 'Album':
				return <Album_Icon width={20} height={20} />;
			default:
				return null;
		}
	};


	const [currentEditItem, setCurrentEditItem] = useState(null);
	const [quizModalVisible, setQuizModalVisible] = useState(false);

	const handleQuizModal = (item) => {
		setCurrentEditItem(item);
		setQuizModalVisible(true);
	};

	const closeModal = () => {
		setQuizModalVisible(false);
		setCurrentEditItem(null);
	};

	return (
		<div className={css.main}>
			<div className={css.pageInfo} style={
				!(currentUser?.isAdmin || checkAdminPage || checkEditorPage)
					? { height: '1%' }
					: undefined
			}>
				<div className={css.pageTitle}>
					{renderSectionIcon(sectionPageData)}
					<span className={css.nameElement}>{sectionPageData?.name}</span>
				</div>
				{/*{(currentUser?.isAdmin || checkAdminPage || checkEditorPage ) && (*/}
				{/*	<div className={css.info}>*/}
				{/*		<span className={css.button} onClick={() => handleCreateNew()}>+ Mới</span>*/}
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
								handleViewDetail={handleViewDetail}
								minWidth={270}
							/>
						</div>
						<div className={css.info}>
							{(currentUser?.isAdmin) && (
								<span
									className={`${css.button} ${css.mobileText}`}
									onClick={() => setShowHidden(!showHidden)}
								>
									{showHidden ? 'Quay lại' : 'Xem mục đã ẩn'}
								</span>
							)}
							{(currentUser?.isAdmin) && (
								<span
									className={`${css.button} ${css.mobileText}`}
									onClick={() => handleCreateNew()}
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
								handleViewDetail={handleViewDetail}
								minWidth={330}
							/>
						</div>
						<div className={css.info}>
							<span
								className={css.button}
								onClick={() => setShowHidden(!showHidden)}
							>
								{showHidden ? 'Quay lại' : 'Xem mục đã ẩn'}
							</span>
							{(currentUser?.isAdmin) && (
								<span
									className={css.button}
									onClick={() => handleCreateNew()}
								>
									<span className={css.plusCircle}>+</span> Thêm
								</span>
							)}
						</div>
						</>
					)}
				</div>
			</div>

			{/*<div className={css.optionButton}>*/}
			{/*	/!* {(currentUser?.isAdmin || checkAdminPage || checkEditorPage) && (*/}
			{/*		<span style={{ cursor: 'pointer' }} onClick={() => setIsModalOpen(true)}>Cài đặt</span>*/}
			{/*	)} *!/*/}
			{/*	<span onClick={() => setShowHidden(!showHidden)}>*/}
			{/*{showHidden ? 'Quay lại' : 'Các mục đã ẩn'}*/}
			{/*			 </span>*/}
			{/*</div>*/}

			{/* Danh sách các item */}
			<div className={`${css.cardList} ${css.customScrollbar}`}>
				{listData.filter(item => showHidden ? item?.hide : !item?.hide).map((item) => {
					const title = item?.name || 'Tiêu đề';
					const images = extractImagesFromContent(item?.content || '');
					const contentWithoutImages = removeImagesFromContent(item?.content || '');
					const visibleCount = 1;
					const sliderIndex = imageSliderIndexes[item.id] || 0;
					const canSlideLeft = sliderIndex > 0;
					const canSlideRight = sliderIndex < images.length - 1;

					return (
						<div key={item.id} className={css.listItem} onClick={() => handleViewDetail(item.id)}>
							<div className={css.title}>
								<h2>{title}</h2>
								{/*<div className={css.quizButton}>*/}
								{/*	/!*{checkAdminPage && (*!/*/}
								{/*	/!*)}*!/*/}
								{/*	<Button onClick={()=> handleQuizModal(item)} >Cài đặt quiz</Button>*/}

								{/*	<QuestionCircleOutlined />*/}
								{/*</div>*/}

							</div>
							<div className={css.editorContent}>
								<div
									className={css.htmlContent}
									dangerouslySetInnerHTML={{ __html: contentWithoutImages }}
								/>
							</div>

							{images.length > 0 && (
								<div className={css.imagePreview}>
									<button
										disabled={!canSlideLeft}
										onClick={() => handleImageSlider(item.id, -1, images.length, visibleCount)}
										className={`${css.arrowButton} ${css.arrowButtonLeft}`}
									>
										&#8592;
									</button>
									<div className={css.imageSlider}>
										{loadingImages[`${item.id}-${sliderIndex}`] !== false && (
											<div className={css.loadingSpinner} />
										)}
										<img
											key={sliderIndex}
											src={images[sliderIndex]}
											alt={`Preview ${sliderIndex + 1}`}
											className={css.previewImage}
											style={{
												opacity: loadingImages[`${item.id}-${sliderIndex}`] === false ? 1 : 0
											}}
											loading="lazy"
											onLoad={() => handleImageLoad(item.id, sliderIndex)}
										/>
									</div>
									<button
										disabled={!canSlideRight}
										onClick={() => handleImageSlider(item.id, 1, images.length, visibleCount)}
										className={`${css.arrowButton} ${css.arrowButtonRight}`}
									>
										&#8594;
									</button>
									<div className={css.dotsContainer}>
										{images.map((_, index) => (
											<div
												key={index}
												className={`${css.dot} ${index === sliderIndex ? css.dotActive : ''}`}
											/>
										))}
									</div>
								</div>
							)}

							<div className={css.actions}>
								<button
									onClick={() => handleViewDetail(item.id)}
									className={css.detailButton}
								>
									Xem chi tiết
								</button>
								<button
									onClick={() => handleHideContent(item)}
									className={css.hideButton}
								>
									{item.hide ? 'Bỏ ẩn' : 'Ẩn'}
								</button>
							</div>
						</div>
					);
				})}
			</div>
			{quizModalVisible && <ContentExam quizModalVisible={quizModalVisible} currentEditItem={currentEditItem} closeModal = {closeModal} />}
		</div>
	);
}

const style = document.createElement('style');
style.textContent = `
	@keyframes spin {
		0% { transform: translate(-50%, -50%) rotate(0deg); }
		100% { transform: translate(-50%, -50%) rotate(360deg); }
	}
`;
document.head.appendChild(style);

