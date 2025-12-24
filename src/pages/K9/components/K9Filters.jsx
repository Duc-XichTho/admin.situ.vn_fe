import { Button, Input } from 'antd';
import { Bookmark, Menu, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import styles from '../K9.module.css';
import {
	SearchOutlined
} from '@ant-design/icons';

const K9Filters = ({
	selectedProgram,
	filters,
	onFilterChange,
	onSearchChange,
	filterConfig,
	activeTab,
	showBookmarkFilter = false,
	onBookmarkFilterChange,
	bookmarkFilter = 'all',
	showReadFilter = false,
	onReadFilterChange,
	readFilter = 'all',
	showImportantFilter = false,
	filteredCount = 0,
	totalCount = 0,
	categoryCounts = [],
	showQuizStatusFilter = false,
	onQuizStatusFilterChange,
	quizStatusFilter = 'all',
	newsItems = [], // Add newsItems prop
	onItemSelect, // Add callback for item selection
	onResetAllFilters, // Add reset all filters callback
	filteredNews, // Add filteredNews prop
}) => {
	const { searchPlaceholder, categories, showTimeFilter = false, showSentimentFilter = false } = filterConfig;
	const [isExpanded, setIsExpanded] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(null); // Track which dropdown is open
	const [mobileTitleDropdownOpen, setMobileTitleDropdownOpen] = useState(false); // Mobile title dropdown


	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			// Check if click is outside the dropdown menu and not on a dropdown item
			if (!event.target.closest(`.${styles.dropdownMenu}`) &&
				!event.target.closest(`.${styles.dropdownToggle}`) &&
				!event.target.closest(`.${styles.mobileTitleDropdown}`)) {
				setDropdownOpen(null);
				setMobileTitleDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Get titles for a specific category
	const getTitlesForCategory = (categoryKey) => {
		let newsData = newsItems;
		if (selectedProgram && selectedProgram !== 'all') {
			if (Array.isArray(selectedProgram)) {
				newsData = newsItems.filter(item => selectedProgram.some(prog => item.tag4?.includes(prog)));
			} else {
				newsData = newsItems.filter(item => item.tag4?.includes(selectedProgram));
			}
		}
		if (categoryKey === 'all') return newsData;
		return newsData.filter(item => item.category === categoryKey).map(item => ({
			id: item.id,
			title: item.title,
			lessonNumber: item.lessonNumber
		}));
	};

	// Handle item selection
	const handleItemSelect = (itemId, event, categoryKey) => {
		// Find the item to get its category from the complete newsItems list
		const selectedItem = newsItems.find(item => item.id === itemId);

		// Always change category to match the selected item's category
		if (selectedItem && selectedItem.category && selectedItem.category !== filters.category) {
			// Automatically switch to the correct category
			onFilterChange('category', selectedItem.category);

			// Wait for the category change to take effect, then select the item
			setTimeout(() => {
				setDropdownOpen(null);
				if (onItemSelect) {
					onItemSelect(itemId, event);
				}
			}, 300); // Increased delay to ensure category change takes effect
		} else {
			// If category is already correct, select item immediately
			setDropdownOpen(null);
			if (onItemSelect) {
				onItemSelect(itemId, event);
			}
		}
	};

	// Toggle dropdown for a category
	const toggleDropdown = (categoryKey, event) => {
		event.stopPropagation();
		setDropdownOpen(dropdownOpen === categoryKey ? null : categoryKey);
	};

	// Toggle mobile title dropdown
	const toggleMobileTitleDropdown = (event) => {
		event.stopPropagation();
		setMobileTitleDropdownOpen(!mobileTitleDropdownOpen);
	};

	// Get all titles for mobile dropdown
	const getAllTitlesForMobile = () => {
		const newsData = newsItems.filter(item => item.tag4.includes(selectedProgram));
		return newsData.map(item => ({
			id: item.id,
			title: item.title,
			category: item.category,
			lessonNumber: item.lessonNumber
		}));
	};

	// Helper function để lấy count của một category
	const getCategoryCount = (catKey) => {
		const countObj = Array.isArray(categoryCounts)
			? categoryCounts.find(c => c.key === catKey)
			: (categoryCounts && categoryCounts[catKey]);
		return countObj ? (countObj.count ?? countObj) : 0;
	};

	// Lọc categories có bản ghi (count > 0 hoặc là 'all')
	const getCategoriesWithData = () => {
		return categories.filter(cat => {
			if (cat.key === 'all') return true; // Luôn hiển thị 'all'
			const count = getCategoryCount(cat.key);
			return count > 0;
		});
	};

	// Tính toán số dòng cần thiết để hiển thị categories có dữ liệu
	const calculateRows = () => {
		const visibleCategories = getCategoriesWithData();
		// Giả sử mỗi dòng có thể chứa khoảng 4-5 buttons (tùy thuộc vào CSS)
		const buttonsPerRow = 6;
		return Math.ceil(visibleCategories.length / buttonsPerRow);
	};

	const totalRows = calculateRows();
	const shouldShowExpand = totalRows > 2;

	// Lọc categories hiển thị
	const getVisibleCategories = () => {
		// Chỉ hiển thị categories có dữ liệu
		const categoriesWithData = getCategoriesWithData();

		if (!shouldShowExpand || isExpanded) {
			return categoriesWithData;
		}

		// Chỉ hiển thị 2 dòng đầu (khoảng 9 buttons)
		return categoriesWithData.slice(0, 9);
	};

	const visibleCategories = getVisibleCategories();

	return (
		<div className={styles.filters}>
			<div className={styles.filterRow}>
				<div className={styles.searchContainer}>
					<div className={styles.searchContainer2} style={{ width: isMobile ? '100%' : 'auto' }}>
						<div className={styles.searchGroup} style={{ display: 'flex', alignItems: 'center', gap: 5, width: isMobile ? '100%' : '90%' }}>
							<Input
								placeholder={searchPlaceholder}
								value={filters.search}
								onChange={onSearchChange}
								prefix={<SearchOutlined />}
								allowClear
								size="large"
								style={{
									width: '100%',
									...(filters.search && { backgroundColor: 'rgb(245, 231, 231)' })
								}}
							/>
						</div>
						{mobileTitleDropdownOpen && isMobile && (
							<div className={styles.popoverOverlay} onClick={() => setMobileTitleDropdownOpen(false)} />
						)}
						{isMobile && (
							<div className={styles.mobileTitleDropdownContainer}>
								<button
									className={styles.mobileTitleDropdownButton}
									onClick={toggleMobileTitleDropdown}
									title="Chọn bài viết theo tiêu đề"
								>
									<Menu size={16} />
									<span>Chọn bài</span>
								</button>

								{mobileTitleDropdownOpen && (
									<div className={styles.mobileTitleDropdown}>
										<div className={styles.mobileTitleDropdownHeader}>
											<span>Chọn bài viết</span>
											<button
												className={styles.closeDropdown}
												onClick={toggleMobileTitleDropdown}
											>
												×
											</button>
										</div>
										<div className={styles.mobileTitleDropdownItems}>
											{getAllTitlesForMobile().map(item => (
												<button
													key={item.id}
													className={styles.mobileTitleDropdownItem}
													onClick={(e) => {
														handleItemSelect(item.id, e, item.category);
														setMobileTitleDropdownOpen(false);
													}}
												>
													<div className={styles.mobileTitleItemTitle}>
														{item.lessonNumber && (
														<>	
																{item.lessonNumber}:
														</>
														)}
														<> {item.title}</>
													</div>
													<div className={styles.mobileTitleItemCategory}>{item.category}</div>
												</button>
											))}
										</div>

									</div>
								)}
							</div>
						)}


						{onResetAllFilters && isMobile && (
							<Button
								onClick={onResetAllFilters}
								size="middle"
								className={styles.filterResetButton}
							>
								<span style={{ fontSize: '13px' }}>🗑️</span>
							</Button>

						)}
					</div>
				</div>
				<div className={styles.filterActionsContainer}>
					<div style={{ display: 'flex', justifyContent: 'end', gap: 5 }}>

						{showBookmarkFilter && (
							<button
								className={`${styles.desktopOnly} ${styles.bookmarkBtn} ${bookmarkFilter === 'bookmarked' ? styles.active : ''}`}
								onClick={() => onBookmarkFilterChange(bookmarkFilter === 'bookmarked' ? 'all' : 'bookmarked')}
								title={bookmarkFilter === 'bookmarked' ? 'Hiển thị tất cả' : 'Chỉ hiển thị đã bookmark'}
							>
								<Bookmark size={16} />
							</button>
						)}

						{showReadFilter && (
							<select
								className={styles.readFilterSelect}
								value={readFilter}
								onChange={(e) => onReadFilterChange(e.target.value)}
								title="Lọc theo trạng thái đọc"
							>
								<option value="all">Tất cả</option>
								<option value="read">Đã đọc</option>
								<option value="unread">Chưa đọc</option>
							</select>
						)}

						{showQuizStatusFilter && (
							<select
								className={styles.readFilterSelect}
								value={quizStatusFilter}
								onChange={(e) => onQuizStatusFilterChange(e.target.value)}
								title="Lọc theo trạng thái quiz"
							>
								<option value="all">Tất cả</option>
								<option value="completed">Đã hoàn thành Quiz</option>
								<option value="incomplete">Chưa hoàn thành Quiz</option>
							</select>
						)}

						{/* {showImportantFilter && (
							<button
								className={`${styles.importantBtn} ${filters.filter === 'important' ? styles.active : ''}`}
								onClick={() => onFilterChange('filter', filters.filter === 'important' ? 'all' : 'important')}
								title={filters.filter === 'important' ? 'Hiển thị tất cả' : 'Chỉ hiển thị tin quan trọng'}
							>

								<Star size={14} style={{ marginRight: 5 }} />
								Nổi bật
							</button>
						)} */}
						{showBookmarkFilter && (
							<button
								className={`${styles.bookmarkBtn} ${styles.mobileOnly} ${bookmarkFilter === 'bookmarked' ? styles.active : ''}`}
								onClick={() => onBookmarkFilterChange(bookmarkFilter === 'bookmarked' ? 'all' : 'bookmarked')}
								title={bookmarkFilter === 'bookmarked' ? 'Hiển thị tất cả' : 'Chỉ hiển thị đã bookmark'}
							>
								<Bookmark size={16} />
							</button>
						)}
						{onResetAllFilters && !isMobile && (
							<Button
								onClick={onResetAllFilters}
								size="middle"
								className={styles.filterResetButton}
							>
								<span style={{ fontSize: '13px' }}>🗑️ Xóa tất cả bộ lọc</span>
							</Button>

						)}
					</div>
				</div>
			</div>

			{showTimeFilter && (
				<div className={styles.filterRow}>
					<div className={styles.filterLabel}>Thời gian</div>
					<div className={styles.filterButtons}>
						{[
							{ key: 'all', label: 'Tất cả' },
							{ key: 'today', label: 'Hôm nay' },
							{ key: 'yesterday', label: 'Hôm qua' },
							{ key: 'week', label: 'Tuần qua' },
						].map(time => (
							<button
								key={time.key}
								className={`${styles.filterBtn} ${filters.time === time.key ? styles.active : ''}`}
								onClick={() => onFilterChange('time', time.key)}
							>
								{time.label}
							</button>
						))}
					</div>
					<select
						className={styles.filterSelect}
						value={filters.time}
						onChange={(e) => onFilterChange('time', e.target.value)}
					>
						{[
							{ key: 'all', label: 'Tất cả' },
							{ key: 'today', label: 'Hôm nay' },
							{ key: 'yesterday', label: 'Hôm qua' },
							{ key: 'week', label: 'Tuần qua' },
						].map(time => (
							<option key={time.key} value={time.key}>
								{time.label}
							</option>
						))}
					</select>
				</div>
			)}

			<div className={styles.filterRow}>
				<div className={`${styles.filterButtons} ${!isExpanded && shouldShowExpand ? styles.collapsed : ''}`}>
					{visibleCategories.map(cat => {
						const count = getCategoryCount(cat.key);
						const titlesInCategory = getTitlesForCategory(cat.key);
						const hasItems = titlesInCategory.length > 0;

						return (
							<div key={cat.key} className={styles.categoryButtonContainer}>
								<button
									className={`${styles.filterBtn} ${filters.category === cat.key ? styles.active : ''}`}
									onClick={() => onFilterChange('category', cat.key)}
								>
									<span className={styles.chipCountInBtn}>{count}</span>
									{cat.label}
									{/* {hasItems && ( */}
										<button
											className={styles.dropdownToggle}
											onClick={(e) => toggleDropdown(cat.key, e)}
											title={`Xem danh sách ${cat.label}`}
										>
											<Menu size={14} color={filters.category === cat.key ? '#fff' : '#000'} />
										</button>
									{/* )} */}
								</button>

								{hasItems && dropdownOpen === cat.key && (
									<div className={styles.dropdownMenu}>
										<div className={styles.dropdownHeader}>
											<span>{cat.label}</span>
											<button
												className={styles.closeDropdown}
												onClick={(e) => toggleDropdown(cat.key, e)}
											>
												×
											</button>
										</div>
										<div className={styles.dropdownItems}>
											{titlesInCategory.map(item => (
												<button
													key={item.id}
													className={styles.dropdownItem}
													onClick={(e) => handleItemSelect(item.id, e , cat.key)}
												>
														{item.lessonNumber && (
														<>	
																{item.lessonNumber}:
														</>
													)}
													<> {item.title}</>
												</button>
											))}
										</div>
									</div>
								)}
							</div>
						);
					})}
					{shouldShowExpand && (
						<button
							className={`${styles.filterBtn} ${styles.expandBtn}`}
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? 'Thu gọn' : '...'}
						</button>
					)}
				</div>
				<select
					className={styles.filterSelect}
					value={filters.category}
					onChange={(e) => onFilterChange('category', e.target.value)}
				>
					{getCategoriesWithData().map(cat => {
						const count = getCategoryCount(cat.key);
						return (
							<option key={cat.key} value={cat.key} style={{ width: 100, fontSize: 14 }}>
								{`(${count}) ${cat.label}`}
							</option>
						);
					})}
				</select>
			</div>


			{/* Sentiment filter - only for stream tab */}
			{/*{activeTab === 'stream' && (*/}
			{/*	<div className={styles.filterRow}>*/}
			{/*		<div className={styles.filterLabel}>Sentiment</div>*/}
			{/*		<div className={styles.filterButtons}>*/}
			{/*			{[*/}
			{/*				{ key: 'all', label: 'Tất cả' },*/}
			{/*				{ key: 'positive', label: 'Tích cực' },*/}
			{/*				{ key: 'negative', label: 'Tiêu cực' },*/}
			{/*				{ key: 'neutral', label: 'Trung tính' },*/}
			{/*			].map(filter => (*/}
			{/*				<button*/}
			{/*					key={filter.key}*/}
			{/*					className={`${styles.filterBtn} ${filters.filter === filter.key ? styles.active : ''}`}*/}
			{/*					onClick={() => onFilterChange('filter', filter.key)}*/}
			{/*				>*/}
			{/*					{filter.label}*/}
			{/*				</button>*/}
			{/*			))}*/}
			{/*		</div>*/}
			{/*		<select*/}
			{/*			className={styles.filterSelect}*/}
			{/*			value={filters.filter}*/}
			{/*			onChange={(e) => onFilterChange('filter', e.target.value)}*/}
			{/*		>*/}
			{/*			{[*/}
			{/*				{ key: 'all', label: 'Tất cả' },*/}
			{/*				{ key: 'positive', label: 'Tích cực' },*/}
			{/*				{ key: 'negative', label: 'Tiêu cực' },*/}
			{/*				{ key: 'neutral', label: 'Trung tính' },*/}
			{/*			].map(filter => (*/}
			{/*				<option key={filter.key} value={filter.key}>*/}
			{/*					{filter.label}*/}
			{/*				</option>*/}
			{/*			))}*/}
			{/*		</select>*/}
			{/*	</div>*/}
			{/*)}*/}

			{/* Reset All Filters Button */}

		</div>
	);
};

export default K9Filters;
