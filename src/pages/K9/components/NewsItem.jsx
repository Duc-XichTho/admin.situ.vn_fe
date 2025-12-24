import { Image } from 'antd';
import { Star } from 'lucide-react';
import React from 'react';
import ReactDOM from 'react-dom';
import { FileList } from '../../../components/PreviewFile';
import styles from '../K9.module.css';
import {
	BookMark_Icon_Off,
	BookMark_Icon_On,
	DoneRead_Icon,
	InfoMore_Icon,
	NotDoneRead_Icon,
	Copy_Icon,
} from '../../../icon/IconSvg.jsx';
import { IconButton } from '@mui/material';
import { Tag, } from 'antd';
import { formatDateToDDMMYYYY } from '../../../generalFunction/format.js';
import { useState, useEffect } from 'react';

const NewsItem = ({
	item,
	expandedItem,
	showDetailId,
	onItemClick,
	onShowDetail,
	onOpenSource,
	isBookmarked = false,
	onToggleBookmark,
	isRead = false,
	onToggleRead,
	isSelected = false,
	quizScore,
	'data-item-id': dataItemId, // Add support for data-item-id
	isHome = false, // Thêm prop isHome với default false
	isCase = false,
	onCopyCase, // Thêm prop onCopyCase
	isGridView = false, // Thêm prop isGridView để render layout khác cho grid view
	currentUser, // Thêm prop currentUser để kiểm tra account_type
}) => {
	const [showHoverPopup, setShowHoverPopup] = React.useState(false);
	const [popupPosition, setPopupPosition] = React.useState({ x: 0, y: 0 });
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	const getCategoryLabel = (category) => {
		switch (category) {
			case 'economy':
				return 'Kinh tế';
			case 'world':
				return 'Thế giới';
			case 'politics':
				return 'Chính trị';
			case 'tech':
				return 'Công nghệ';
			case 'culture':
				return 'Văn hóa';
			default:
				return category;
		}
	};

	const getTimeAgo = (createdAt) => {
		if (!createdAt) return '-';

		const date = new Date(createdAt);
		if (isNaN(date.getTime())) return '-';

		const now = new Date();
		const diffMs = now - date;
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays > 0) {
			return `${diffDays} ngày trước`;
		} else if (diffHours > 0) {
			return `${diffHours} giờ trước`;
		} else {
			const diffMinutes = Math.floor(diffMs / (1000 * 60));
			return diffMinutes > 0 ? `${diffMinutes} phút trước` : 'Vừa xong';
		}
	};

	const handleIconMouseEnter = (e) => {
		const rect = e.currentTarget.getBoundingClientRect();
		setPopupPosition({
			x: rect.left + rect.width / 2,
			y: rect.top - 10,
		});
		setShowHoverPopup(true);
	};

	const handleIconMouseLeave = () => {
		setShowHoverPopup(false);
	};

	const renderQuizStatus = () => {
		if (item.questionContent === undefined || item.questionContent === null) {
			return (
				<span
					style={{
						padding: '2px 8px',
						borderRadius: '6px',
						fontSize: 12,
						fontWeight: 600,
						backgroundColor: '#E9FBFF',
						color: '#88B7CD',
						border: '1px solid #9ED5D8',
					}}
					title='Tham khảo'
				>
					Tham khảo
				</span>
			);
		}
		if (quizScore === undefined || quizScore === null) {
			return (
				<span
					style={{
						padding: '2px 8px',
						borderRadius: '6px',
						fontSize: 12,
						fontWeight: 600,
						backgroundColor: '#FFE9ED',
						color: '#E39191',
						border: '1px solid #F3B2B2',
					}}
					title='Chưa làm'
				>
					Chưa làm
				</span>
			);
		}
		const numeric = Number(quizScore);
		const pass = !isNaN(numeric) && numeric >= 60;
		return (
			<span
				style={{
					marginLeft: 8,
					padding: '2px 8px',
					borderRadius: '6px',
					fontSize: 12,
					fontWeight: 600,
					backgroundColor: pass ? '#E5F6DD' : '#E9EEFF',
					color: pass ? '#75C341' : '#7A8ED7',
					border: pass ? '1px solid #9FDE7D' : '1px solid #B9C4F7',
				}}
				title={'Đạt ' + numeric + '/' + 100}
			>
				{'Đạt ' + numeric + '/' + 100}
			</span>
		);
	};

	// console.log('item', item);

	// Grid View Layout: Ảnh + title + summary ở hàng trên, CID + nút ở hàng dưới
	if (isGridView) {
		return (
			<div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0px' }}>
				{/* Hàng trên: Ảnh + Title + Summary */}
				<div style={{ display: 'flex', flexDirection: 'row', gap: '16px', flex: 1, minHeight: 0 }}>
					{/* Image - Bên trái */}
					{item.avatarUrl && (
						<div
							className={styles.avatarGridWrapper}
						>
							<Image
								src={item.avatarUrl}
								alt={item.title}
								preview={{
									mask: 'Xem ảnh',
									maskClassName: 'custom-mask'
								}}
							/>
						</div>
					)}

					{/* Content - Bên phải */}
					<div
						style={{
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							gap: '6px',
							minWidth: 0,
							overflow: 'hidden',
							position: 'relative'
						}}
						onClick={() => onItemClick && onItemClick(item)}
					>
						{/* Lesson Number - Above title */}
						{item.lessonNumber && (
							<div style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '4px',
								width: '100%'
							}}>
								<div style={{
									backgroundColor: '#b0b2c6',
									color: '#ffffff',
									padding: '2px 10px',
									borderRadius: '4px',
									fontSize: '12px',
									fontWeight: '500',
									width: 'fit-content'
								}}>
									{item.lessonNumber}
								</div>
								{/* Check mark for score >= 70 */}
								{(() => {
									const numeric = typeof quizScore === 'number' ? quizScore : parseFloat(quizScore);
									const hasPassed = !isNaN(numeric) && numeric >= 70;
									return hasPassed ? (
										<div style={{
											width: 20,
											height: 20,
											borderRadius: '50%',
											background: '#52c41a',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											flexShrink: 0,
											boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)'
										}}>
											<span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
										</div>
									) : null;
								})()}
							</div>
						)}

						{/* Title */}
						<div
							style={{
								fontSize: '16px',
								fontWeight: '600',
								lineHeight: '1.4',
								overflow: 'hidden',
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								color: '#1f2937',
								cursor: 'pointer',
								marginTop: item.lessonNumber ? '0' : '0'
							}}
						>
							{currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
								<span style={{ marginRight: '6px', fontSize: '14px', verticalAlign: 'middle' }}>🔒</span>
							)}
							{item.title}
						</div>

						{/* Summary */}
						{item.summary && (
							<div style={{
								fontSize: '12px',
								color: '#6b7280',
								overflow: 'hidden',
								display: '-webkit-box',
								WebkitLineClamp: 4,
								WebkitBoxOrient: 'vertical',
								lineHeight: '1.4',
							}}>
								{item.summary}
							</div>
						)}
					</div>
				</div>

				{/* Hàng dưới: Meta (CID + nút) nằm dưới cả ảnh + title + summary */}
				{!isHome && (
					<div
						style={{
							display: 'flex',
							gap: '4px',
							marginTop: 'auto',
							width: '100%',
						}}
					>
						{/* CID và ID: cùng 1 dòng */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
								color: '#868686',
								fontSize: '11px',
								fontWeight: '500',
								width: '100%',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{item.cid && <span>CID: {item.cid}</span>}
							{item.id && item.cid && <span>|</span>}
							{item.id && <span>ID: {item.id}</span>}
						</div>

						{/* Action buttons: xuống hẳn 1 dòng dưới CID */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'flex-end',
								gap: '2px',
								flexWrap: 'wrap',
								width: '100%',
							}}
						>
							{/* Quiz status */}
							{renderQuizStatus()}

							{/* Info icon */}
							{(item.summary || item.source) && (
								<IconButton
									style={{ padding: '4px' }}
									onMouseEnter={handleIconMouseEnter}
									onMouseLeave={handleIconMouseLeave}
									onClick={(e) => e.stopPropagation()}
								>
									<InfoMore_Icon width={14} height={14} />
								</IconButton>
							)}

							{/* Read status */}
							<IconButton
								style={{ padding: '4px' }}
								title={isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
								onClick={(e) => {
									e.stopPropagation();
									onToggleRead(item);
								}}
							>
								{isRead ? (
									<DoneRead_Icon height={16} width={16} />
								) : (
									<NotDoneRead_Icon height={16} width={16} />
								)}
							</IconButton>

							{/* Bookmark */}
							<IconButton
								style={{ padding: '4px' }}
								title={isBookmarked ? 'Bỏ bookmark' : 'Thêm bookmark'}
								onClick={(e) => {
									e.stopPropagation();
									onToggleBookmark(item);
								}}
							>
								{isBookmarked ? (
									<BookMark_Icon_On height={14} width={14} />
								) : (
									<BookMark_Icon_Off height={14} width={14} />
								)}
							</IconButton>
						</div>
					</div>
				)}

				{/* Hover Popup for Grid View - Using Portal to avoid overflow issues */}
				{showHoverPopup && (item.summary || item.source) && ReactDOM.createPortal(
					<div
						style={{
							position: 'fixed',
							left: `${popupPosition.x}px`,
							top: `${popupPosition.y}px`,
							transform: 'translateX(-50%) translateY(-100%)',
							zIndex: 9999,
							backgroundColor: '#ffffff',
							border: '1px solid #e5e7eb',
							borderRadius: '12px',
							boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
							padding: '16px',
							maxWidth: '400px',
							minWidth: '300px',
							pointerEvents: 'none',
						}}
					>
						{/* Arrow pointing down */}
						<div
							style={{
								position: 'absolute',
								bottom: '-8px',
								left: '50%',
								transform: 'translateX(-50%)',
								width: 0,
								height: 0,
								borderLeft: '8px solid transparent',
								borderRight: '8px solid transparent',
								borderTop: '8px solid #ffffff',
								filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
							}}
						/>

						{/* Summary */}
						{item.summary && (
							<div style={{ marginBottom: (item.source || item.category) ? '12px' : '0' }}>
								<div style={{ fontSize: '14px', lineHeight: '1.5', color: '#374151' }}>
									{item.summary}
								</div>
							</div>
						)}

						{/* Category */}
						{item.category && (
							<div style={{
								borderTop: item.summary ? '1px solid #f3f4f6' : 'none',
								paddingTop: item.summary ? '12px' : '0',
								marginBottom: (item.source || item.createdAt) ? '12px' : '0',
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
							}}>
								<span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
									📂 Danh mục:
								</span>
								<span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
									{item.emoji} {getCategoryLabel(item.category)}
								</span>
							</div>
						)}

						{/* Time */}
						{item.createdAt && (
							<span className={styles.newsTime}>
								{getTimeAgo(item.createdAt)}
							</span>
						)}

						{/* Source */}
						{item.source && (
							<div style={{
								borderTop: (item.summary || item.category || item.createdAt) ? '1px solid #f3f4f6' : 'none',
								paddingTop: (item.summary || item.category || item.createdAt) ? '12px' : '0',
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
							}}>
								<span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
									🔗 Nguồn:
								</span>
								<span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
									{item.source}
								</span>
							</div>
						)}
					</div>,
					document.body
				)}
			</div>
		);
	}

	// Default List View Layout
	return (
		<div
			className={`${styles.newsItem} ${item.impact !== 'important' ? styles.noImpact : ''} ${isBookmarked ? styles.hasBookmark : ''} ${isRead ? styles.hasRead : ''} ${isSelected ? styles.selected : ''}`}
			style={{ height: isCase ? '100%' : 'auto'}}
			onClick={(e) => {
				if (onItemClick) {
					onItemClick(item);
				} else if (onShowDetail) {
					onShowDetail(item, e);
				}
			}}
			data-item-id={dataItemId}
		>
			{/* Hover Popup */}
			{showHoverPopup && (item.summary || item.source) && (
				<div
					style={{
						position: 'fixed',
						left: `${popupPosition.x}px`,
						top: `${popupPosition.y}px`,
						transform: 'translateX(-50%) translateY(-100%)',
						zIndex: 1000,
						backgroundColor: '#ffffff',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
						padding: '16px',
						maxWidth: '400px',
						minWidth: '300px',
						pointerEvents: 'none',
					}}
				>
					{/* Arrow pointing down */}
					<div
						style={{
							position: 'absolute',
							bottom: '-8px',
							left: '50%',
							transform: 'translateX(-50%)',
							width: 0,
							height: 0,
							borderLeft: '8px solid transparent',
							borderRight: '8px solid transparent',
							borderTop: '8px solid #ffffff',
							filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
						}}
					/>

					{/* Summary */}
					{item.summary && (
						<div style={{ marginBottom: (item.source || item.category) ? '12px' : '0' }}>
							<div style={{ fontSize: '14px', lineHeight: '1.5', color: '#374151' }}>
								{item.summary}
							</div>
						</div>
					)}

					{/* Category */}
					{item.category && (
						<div style={{
							borderTop: item.summary ? '1px solid #f3f4f6' : 'none',
							paddingTop: item.summary ? '12px' : '0',
							marginBottom: (item.source || item.createdAt) ? '12px' : '0',
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
						}}>
							<span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
								📂 Danh mục:
							</span>
							<span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
								{item.emoji} {getCategoryLabel(item.category)}
							</span>
						</div>
					)}

					{/* Time */}
					{item.createdAt && (
						<span className={styles.newsTime}>
							{getTimeAgo(item.createdAt)}
						</span>
					)}

					{/* Source */}
					{item.source && (
						<div style={{
							borderTop: (item.summary || item.category || item.createdAt) ? '1px solid #f3f4f6' : 'none',
							paddingTop: (item.summary || item.category || item.createdAt) ? '12px' : '0',
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
						}}>
							<span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
								🔗 Nguồn:
							</span>
							<span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
								{item.source}
							</span>
						</div>
					)}
				</div>
			)}

			{/*/!* Avatar or Cover Image *!/*/}

			<div
				className={`${styles.newsContent}`}
				style={{ paddingBottom: isHome ? '6px' : '0' }}
			>
				{/* Khi isHome=true, chỉ hiển thị title */}
				{isHome ? (
					<>
						<div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
							{item.avatarUrl && (
								<div className={styles.avatarWrapper} onClick={(e) => { e.stopPropagation() }}>
									<Image src={item.avatarUrl} alt="Avatar" style={{
										width: '120px',
										height: '120px',
										objectFit: 'cover',
										objectPosition: 'center',
										display: 'block',
									}}
									/>
								</div>
							)}
							<div style={{ 
								display: 'flex', 
								flexDirection: 'column',
								width: '100%',
								position: 'relative',
								gap: '6px',
								minWidth: 0
							}}>
								{/* Lesson Number - Above title */}
								{item.lessonNumber && (
									<div style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										width: '100%'
									}}>
										<div style={{
											backgroundColor: '#b0b2c6',
											color: '#ffffff',
											padding: '4px 10px',
											borderRadius: '4px',
											fontSize: '12px',
											fontWeight: '500',
											width: 'fit-content'
										}}>
											{item.lessonNumber}
										</div>
										{/* Check mark for score >= 70 */}
										{(() => {
											const numeric = typeof quizScore === 'number' ? quizScore : parseFloat(quizScore);
											const hasPassed = !isNaN(numeric) && numeric >= 70;
											return hasPassed ? (
												<div style={{
													width: 20,
													height: 20,
													borderRadius: '50%',
													background: '#52c41a',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													flexShrink: 0,
													boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)'
												}}>
													<span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
												</div>
											) : null;
										})()}
									</div>
								)}

								<div className={styles.newsTitle} style={{ 
									position: 'relative',
									width: '100%',
									minWidth: 0,
									paddingRight: item.id ? '50px' : '0',
									overflow: 'hidden',
									display: '-webkit-box',
									WebkitLineClamp: 2,
									WebkitBoxOrient: 'vertical',
									lineHeight: '1.4',
								}}>
									{currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
										<span style={{ marginRight: '6px', fontSize: '14px', verticalAlign: 'middle' }}>🔒</span>
									)}
									{item.title}
									
									{/* ID - Top right corner */}
									{item.id && (
										<div style={{
											position: 'absolute',
											top: '0',
											right: '0',
											fontSize: '10px',
											color: '#9F9F9F',
											backgroundColor: '#f5f5f5',
											padding: '2px 6px',
											borderRadius: '4px',
											zIndex: 1,
											flexShrink: 0
										}}>
											ID: {item.id}
										</div>
									)}
								</div>
							</div>


						</div>
						{isCase &&
							<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'start', }}>
								<div style={{ display: 'flex', alignItems: 'center', marginLeft: isMobile ? '0' : '0px' }}>
									<Tag color="green">{formatDateToDDMMYYYY(item?.created_at)}</Tag>
									<IconButton
										style={{ padding: '4px' }}
										title="Copy case này"
										onClick={(e) => {
											e.stopPropagation();
											onCopyCase(item);
										}}
									>
										<Copy_Icon width={15} height={15} />
									</IconButton>
								</div>

							</div>
						}
						{item.history && (
							<>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: '7px', }}>
									<span
										style={{
											color: 'rgb(38 38 38 / 60%)',
											fontSize: 12
										}}
									>
										Thời gian làm: {formatDateToDDMMYYYY(item.history?.updated_at)}
									</span>
									<span
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: 6,
											backgroundColor: '#16a34a',
											color: '#fff',
											padding: '4px 10px',
											borderRadius: '12px',
											fontSize: 11,
											fontWeight: 600,
											lineHeight: 1.6
										}}
									>
										{item.history?.score} / 100
									</span>
								</div>
							</>
						)}
						{isCase &&
							<div className={styles.programStatsContainer} style={{ marginTop: '10px' }}>
								{
									item?.info && (
										<>
											<span className={styles.programStatTag}>
												🏢 Lĩnh vực: {item.info.area}
											</span>
											<span className={styles.programStatTag}>
												🎯 Chuyên ngành: {item.info.domain}
											</span>
										</>
									)
								}
								{
									item.questionContent && (
										<>
											<span className={styles.programStatTag}>
												📋 {item.questionContent.mcqCount} câu trắc nghiệm
											</span>
											<span className={styles.programStatTag}>
												✍️ {item.questionContent.essayCount} câu tự luận
											</span>
										</>
									)
								}
							</div>
						}
					</>

				) : (
					<>
						{/* Lesson Number - Above title */}
						{item.lessonNumber && (
							<div style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '6px',
								width: '100%'
							}}>
								<div style={{
									backgroundColor: '#b0b2c6',
									color: '#ffffff',
									padding: '4px 10px',
									borderRadius: '4px',
									fontSize: '12px',
									fontWeight: '500',
									width: 'fit-content'
								}}>
									{item.lessonNumber}
								</div>
								{/* Check mark for score >= 70 */}
								{(() => {
									const numeric = typeof quizScore === 'number' ? quizScore : parseFloat(quizScore);
									const hasPassed = !isNaN(numeric) && numeric >= 70;
									return hasPassed ? (
										<div style={{
											width: 20,
											height: 20,
											borderRadius: '50%',
											background: '#52c41a',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											flexShrink: 0,
											boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)'
										}}>
											<span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
										</div>
									) : null;
								})()}
							</div>
						)}

						<div className={styles.newsTitle} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
							<div style={{ 
								flex: 1, 
								minWidth: 0, 
								paddingRight: item.id ? '50px' : '0',
								overflow: 'hidden',
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								lineHeight: '1.4',
							}}>
								{currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
									<span style={{ marginRight: '6px', fontSize: '14px', verticalAlign: 'middle' }}>🔒</span>
								)}
								{item.title}
							</div>
							
							{/* ID - Top right corner */}
							{item.id && (
								<div style={{
									position: 'absolute',
									top: '0',
									right: '0',
									fontSize: '10px',
									color: '#9F9F9F',
									backgroundColor: '#f5f5f5',
									padding: '2px 6px',
									borderRadius: '4px',
									zIndex: 1,
									flexShrink: 0
								}}>
									ID: {item.id}
								</div>
							)}
						</div>
						<div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
							{item.avatarUrl && (
								<div className={styles.avatarWrapper} onClick={(e) => { e.stopPropagation() }}>
									<Image src={item.avatarUrl} alt="Avatar" style={{
										width: '120px',
										height: '120px',
										objectFit: 'cover',
										objectPosition: 'center',
										display: 'block',
									}}
									/>
								</div>
							)}

							{/* Always expanded by default, so show expanded content */}
							<div className={styles.newsExpandedContent}>
								{/* Summary is now hidden and shown in hover popup instead */}
								{item.summary && (
									<div className={styles.summary}>
										<p title={item.summary}>{item.summary}</p>
									</div>
								)}
								{/*
							{item.videoUrl && (<div
								className={styles.newsVideoSection}
								onClick={(e) => {
									e.stopPropagation();
								}}
							>
								<video
									controls
									onClick={(e) => {
										e.stopPropagation();
									}}
									style={{
										width: '100%',
										maxWidth: '500px',
										height: 'auto',
										borderRadius: '8px',
										marginBottom: '20px',
									}}
								>
									<source src={item.videoUrl} type='video/mp4' />
									<source src={item.videoUrl} type='video/webm' />
									<source src={item.videoUrl} type='video/ogg' />
									Trình duyệt của bạn không hỗ trợ video.
								</video>
							</div>)}

							{item.fileUrls && Array.isArray(item.fileUrls) && item.fileUrls.length > 0 && (
								<div style={{ marginTop: '12px', marginBottom: '12px' }}>
									<FileList
										fileUrls={item.fileUrls}
										title='File đính kèm'
										showCount={true}
									/>
								</div>)} */}

								<div className={styles.newsMeta}>
									{/* Left side: Primary info */}


									{/* Center: Media indicators */}
									{/* <div style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									marginLeft: 'auto',
									marginRight: '12px',
								}}>
									{item.videoUrl && (<span style={{ color: '#8c8c8c', fontSize: '12px' }}>🎥</span>)}
									{item.imgUrls && item.imgUrls.length > 0 && (
										<span style={{
											color: '#8c8c8c',
											fontSize: '12px',
										}}>🖼️ {item.imgUrls.length}</span>
									)}
									{item.fileUrls && Array.isArray(item.fileUrls) && item.fileUrls.length > 0 && (
										<span className={styles.fileIndicator}
											title={`${item.fileUrls.length} file đính kèm`}>
											<Paperclip size={12} />
											{item.fileUrls.length}
										</span>
									)}
								</div> */}

									{/* Right side: Action buttons */}
									<div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1', color: '#868686', fontSize: '12px', fontWeight: '500' }}>
											CID: {item.cid || ''}
										</div>

										<div style={{ display: 'flex', alignItems: 'center', width: 'max-content' }}>
											<div style={{ marginRight: '10px' }}>
												{renderQuizStatus()}
											</div>

											{/* Question mark icon */}
											{(item.summary || item.source) && (
												<IconButton
													style={{ padding: '4px' }}
													onMouseEnter={handleIconMouseEnter}
													onMouseLeave={handleIconMouseLeave}>
													<InfoMore_Icon
														width={16}
														height={16}
													/>
												</IconButton>

											)}

											{/* Action buttons */}
											<IconButton
												style={{ padding: '4px' }}
												title={isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
												onClick={(e) => {
													e.stopPropagation();
													onToggleRead(item);
												}}
											>
												{isRead ? <DoneRead_Icon height={18} width={18} /> :
													<NotDoneRead_Icon height={18} width={18} />}
											</IconButton>
											<IconButton
												style={{ padding: '4px' }}
												title={isBookmarked ? 'Bỏ bookmark' : 'Thêm bookmark'}
												onClick={(e) => {
													e.stopPropagation();
													onToggleBookmark(item);
												}}
											>
												{isBookmarked ? <BookMark_Icon_On height={15} width={15} /> :
													<BookMark_Icon_Off height={15} width={15} />}
											</IconButton>




											{/* {item.source && (
										<button
											className={styles.actionBtn}
											title="Đến nguồn"
											onClick={(e) => onOpenSource(item, e)}
										>
											🔗
										</button>
									)} */}
										</div>


									</div>
								</div>

								{/* Move important icon to the end, same level as category and time */}
								{/* {showDetailId === item.id && item.detail && (<div className={styles.newsDetail}>
								<div
									className={styles.markdownContent}
									dangerouslySetInnerHTML={{
										__html: DOMPurify.sanitize(marked.parse(item.detail || '')),
									}}
								/>
							</div>)} */}

								{/* Images Section - Hiển thị cuối cùng */}
								{/* {item.imgUrls && Array.isArray(item.imgUrls) && item.imgUrls.length > 0 && (<div
								className={styles.newsImagesSection}
								onClick={(e) => {
									e.stopPropagation();
								}}
							>
								<div style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
									gap: '10px',
									marginTop: '10px',
								}}>
									{item.imgUrls.map((url, index) => (<div
										key={index}
										style={{ position: 'relative' }}
										onClick={(e) => {
											e.stopPropagation();
										}}
									>
										<Image
											src={url}
											alt={`Hình ${index + 1}`}
											style={{
												width: '100%',
												height: '150px',
												objectFit: 'cover',
												borderRadius: '8px',
												cursor: 'pointer',
												transition: 'transform 0.2s',
											}}
											onClick={(e) => {
												e.stopPropagation();
											}}
											onMouseOver={(e) => {
												e.target.style.transform = 'scale(1.05)';
											}}
											onMouseOut={(e) => {
												e.target.style.transform = 'scale(1)';
											}}
											preview={{
												mask: <div style={{ fontSize: '16px' }}>🔍 Xem</div>,
												onVisibleChange: (visible) => {
													// Prevent event bubbling when closing preview
													if (!visible) {
														setTimeout(() => {
															const previewMask = document.querySelector('.ant-image-preview-mask');
															if (previewMask) {
																previewMask.onclick = (e) => {
																	e.stopPropagation();
																};
															}
														}, 0);
													}
												},
											}}
											placeholder={<div style={{
												width: '100%',
												height: '150px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												backgroundColor: '#f0f0f0',
												borderRadius: '8px',
											}}>
												Loading...
											</div>}
										/>
									</div>))}
								</div>
							</div>)} */}
							</div>
						</div>


					</>
				)}
			</div>
		</div>);
};

export default NewsItem;
