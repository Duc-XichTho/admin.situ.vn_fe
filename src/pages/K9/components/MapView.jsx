import { ClearOutlined, FilterOutlined, StarOutlined, CloseOutlined, MoreOutlined, SearchOutlined, ClockCircleOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Button, Menu, Checkbox, Dropdown, Divider, Image, Input, Modal, Popover, Radio, Select, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import DOMPurify from 'dompurify';
import { formatDateFromTimestamp } from '../../../generalFunction/format.js';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getK9ByCidTypePublic, getK9ByIdPublic, getSettingByTypePublic } from '../../../apis/public/publicService.jsx';
import { getListQuestionHistoryByUser } from '../../../apis/questionHistoryService';
import { getCurrentUserLogin, updateUser } from '../../../apis/userService';
import PaymentModal from '../../../components/PaymentModal/PaymentModal';
import { Icon_View_Modal, BookMark_Icon_On, BookMark_Icon_Off, DoneRead_Icon, NotDoneRead_Icon } from '../../../icon/IconSvg.jsx';
import PreviewFileModal from '../../../components/PreviewFile/PreviewFileModal';

import k9Styles from '../K9.module.css';
import CaseTrainingContentPanel from './CaseTrainingContentPanel.jsx';
import ContentPanel from './ContentPanel.jsx';
import EditDetailModal from './EditDetailModal.jsx';
import FeedbackModal from './FeedbackModal.jsx';
import RatingPopup from './RatingPopup.jsx';
import QuizComponent from './QuizComponent.jsx';
import styles from './MapView.module.css';
import MapViewConnectionLines from './MapViewConnectionLines';
import newsTabStyles from './NewsTab.module.css';

const { Text } = Typography;

// Cấu hình marked với KaTeX extension
marked.use(markedKatex({
	throwOnError: false,
	strict: false,
	trust: true,
}));

const MapView = ({
	headerStats,
	setHeaderStats,
	newsItems = [],
	caseTrainingItems = [],
	longFormItems = [],
	homeItems = [],
	activeTab,
	selectedProgram,
	tag4Filter,
	currentUser,
	tag4Options,
	expandedItem,
	showDetailId,
	onShare,
}) => {

	console.log('expandedItem', expandedItem);
	const [historyData, setHistoryData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedLongFormItem, setSelectedLongFormItem] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [modalLoading, setModalLoading] = useState(false);
	const [quizScores, setQuizScores] = useState({}); // Quiz scores map for longFormItems
	const [searchText, setSearchText] = useState(''); // Search text for filtering items (panel 2)
	// Search in content states (for wiki and theory modals)
	const [modalSearchText, setModalSearchText] = useState(''); // Search text in modal content
	const [searchResults, setSearchResults] = useState([]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [showSearchResultsPanel, setShowSearchResultsPanel] = useState(false);
	const [panelPosition, setPanelPosition] = useState({ x: 10, y: 50 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const panelRef = useRef(null);
	const markdownContentRef = useRef(null);

	// Search in content states (for case modal)
	const [caseModalSearchText, setCaseModalSearchText] = useState(''); // Search text in case modal content
	const [caseSearchResults, setCaseSearchResults] = useState([]);
	const [caseHighlightedIndex, setCaseHighlightedIndex] = useState(-1);
	const [caseShowSearchResultsPanel, setCaseShowSearchResultsPanel] = useState(false);
	const [casePanelPosition, setCasePanelPosition] = useState({ x: 10, y: 50 });
	const [caseIsDragging, setCaseIsDragging] = useState(false);
	const [caseDragOffset, setCaseDragOffset] = useState({ x: 0, y: 0 });
	const casePanelRef = useRef(null);
	const caseMarkdownContentRef = useRef(null);

	// Table of Contents sidebar states
	const [showTOCSidebar, setShowTOCSidebar] = useState(false);
	const [headings, setHeadings] = useState([]);
	const [activeHeadingIndex, setActiveHeadingIndex] = useState(-1);

	// Panel 1 states - Theory column
	const [theorySearchText, setTheorySearchText] = useState(''); // Search text for theory column
	const [selectedTheoryItem, setSelectedTheoryItem] = useState(null); // Selected item in theory column
	const [theoryModalVisible, setTheoryModalVisible] = useState(false); // Modal visibility for theory item
	const [theoryModalItem, setTheoryModalItem] = useState(null); // Full item data for theory modal
	const [theoryModalLoading, setTheoryModalLoading] = useState(false); // Loading state for theory modal
	const theoryItemRefs = useRef({}); // Refs for theory items
	const theoryContainerRef = useRef(null); // Container ref for theory column

	// Panel 1 states - Case column
	const [caseSearchText, setCaseSearchText] = useState(''); // Search text for case column
	const [caseSortByConnection, setCaseSortByConnection] = useState(true); // Sort by connection for case
	const [selectedCaseItem, setSelectedCaseItem] = useState(null); // Selected item in case column
	const [caseModalVisible, setCaseModalVisible] = useState(false); // Modal visibility for case item
	const [caseModalItem, setCaseModalItem] = useState(null); // Full item data for case modal
	const [caseModalLoading, setCaseModalLoading] = useState(false); // Loading state for case modal
	const [showSummaryDetail, setShowSummaryDetail] = useState(false); // SummaryDetail collapse state
	const [previewModalVisible, setPreviewModalVisible] = useState(false); // File preview modal
	const [previewFile, setPreviewFile] = useState(null); // Preview file data
	const [showFeedbackModal, setShowFeedbackModal] = useState(false); // Feedback modal
	const [cidSourceInfo, setCidSourceInfo] = useState(null); // CID source info for case
	const [isPackageModalOpen, setIsPackageModalOpen] = useState(false); // Package purchase modal
	const [selectedDetailImageIndex, setSelectedDetailImageIndex] = useState({}); // DetailImageUrls gallery state
	const [isAnimating, setIsAnimating] = useState(false); // Animation state
	const [readItems, setReadItems] = useState([]); // Read items state
	const [bookmarkedItems, setBookmarkedItems] = useState([]); // Bookmarked items state
	// Edit modal states
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [editingItem, setEditingItem] = useState(null);

	// Rating popup states
	const [ratingPopupVisible, setRatingPopupVisible] = useState(false);
	const [ratingPopupItem, setRatingPopupItem] = useState(null);

	// Extract headings from markdown content
	const extractHeadings = (content) => {
		if (!content) return [];
		const headingRegex = /^(#{1,6})\s+(.+)$/gm;
		const extractedHeadings = [];
		let match;
		while ((match = headingRegex.exec(content)) !== null) {
			const level = match[1].length;
			const text = match[2].trim();
			extractedHeadings.push({
				level,
				text,
			});
		}
		return extractedHeadings;
	};

	const contentPanelRef = useRef(null); // Content panel ref
	const caseItemRefs = useRef({}); // Refs for case items
	const caseContainerRef = useRef(null); // Container ref for case column

	// Resize states for modals (separate for each type)
	const [theoryModalSplitRatio, setTheoryModalSplitRatio] = useState(0.25); // Small sidebar for theory
	const [wikiModalSplitRatio, setWikiModalSplitRatio] = useState(0.25); // Small sidebar for wiki
	const [caseModalSplitRatio, setCaseModalSplitRatio] = useState(0.6); // Lesson vs Quiz split for case study
	const [modalIsDraggingResizer, setModalIsDraggingResizer] = useState(false);
	const [modalResizeStartRatio, setModalResizeStartRatio] = useState(0.5);

	// Combined refs for connection lines
	const panel1ItemRefs = useRef({}); // Combined refs for all panel 1 items
	const panel1ContainerRef = useRef(null); // Container ref for panel 1

	// Infinite scroll states (panel 2)
	const [visibleItems, setVisibleItems] = useState([]);
	const [renderedCount, setRenderedCount] = useState(20);
	const lastItemRef = useRef(null);

	// Tag5 filter state - now an array to support multiple selection in future
	const [selectedTag5, setSelectedTag5] = useState([]); // empty array means all, otherwise filter by tag5 values
	const [visibleTagCount, setVisibleTagCount] = useState(Infinity); // Number of visible tags (2 rows)
	const tagListRef = useRef(null); // Ref for tag list container
	const hiddenTagListRef = useRef(null); // Ref for hidden container to measure
	const [categories, setCategories] = useState([]);
	const [tag1Options, setTag1Options] = useState([]);
	const [tag2Options, setTag2Options] = useState([]);
	const [tag3Options, setTag3Options] = useState([]);

	useEffect(() => {
		const loadFilterOptions = async () => {
			try {
				// Load Categories for Theory and Wiki
				const categoriesSetting = await getSettingByTypePublic('CATEGORIES_OPTIONS');
				if (categoriesSetting?.setting) {
					setCategories(categoriesSetting.setting.filter(cat => cat.key !== 'all'));
				}

				// Load Tag Options for Case Study
				const tag1Setting = await getSettingByTypePublic('TAG1_OPTIONS');
				if (tag1Setting?.setting && Array.isArray(tag1Setting.setting)) {
					setTag1Options(tag1Setting.setting);
				}

				const tag2Setting = await getSettingByTypePublic('TAG2_OPTIONS');
				if (tag2Setting?.setting && Array.isArray(tag2Setting.setting)) {
					setTag2Options(tag2Setting.setting);
				}

				const tag3Setting = await getSettingByTypePublic('TAG3_OPTIONS');
				if (tag3Setting?.setting && Array.isArray(tag3Setting.setting)) {
					setTag3Options(tag3Setting.setting);
				}
			} catch (error) {
				console.error('Error loading filter options:', error);
			}
		};
		loadFilterOptions();
	}, []);

	// Filter states for each section
	const [theoryFilters, setTheoryFilters] = useState({
		readStatus: 'all',
		bookmarked: false,
		quizStatus: 'all',
		category: 'all',
	});

	const [caseFilters, setCaseFilters] = useState({
		readStatus: 'all',
		bookmarked: false,
		quizStatus: 'all',
		impact: 'all',
		tag1: [],
		tag2: [],
		tag3: [],
	});

	const [wikiFilters, setWikiFilters] = useState({
		readStatus: 'all',
		bookmarked: false,
		quizStatus: 'all',
		category: 'all',
	});

	const [relatedQuizScores, setRelatedQuizScores] = useState({});
	const [relatedCaseTrainingItems, setRelatedCaseTrainingItems] = useState([]);
	const [dropdownOpen, setDropdownOpen] = useState(null); // Track which category dropdown is open in popover

	const getCategoryCount = (catKey, itemsList) => {
		if (catKey === 'all') return itemsList.length;
		return itemsList.filter(item => item.category === catKey).length;
	};

	const getTitlesForCategory = (catKey, itemsList) => {
		const list = catKey === 'all' ? itemsList : itemsList.filter(item => item.category === catKey);
		return list.map(item => ({
			id: item.id,
			title: item.title,
			lessonNumber: item.lessonNumber
		}));
	};

	const getCategoryLabel = (catKey) => {
		if (catKey === 'all') return 'Tất cả';
		const found = categories.find(c => c.key === catKey);
		return found ? found.label : catKey;
	};

	const getTagCount = (tagType, tagValue, itemsList) => {
		if (!tagValue) return 0;
		return itemsList.filter(item => item[tagType] === tagValue).length;
	};

	const getTitlesForTag = (tagType, tagValue, itemsList) => {
		if (!tagValue) return [];
		return itemsList.filter(item => item[tagType] === tagValue).map(item => ({
			id: item.id,
			title: item.title,
			lessonNumber: item.lessonNumber
		}));
	};

	const renderFilterPopover = (filters, setFilters, itemsList, sectionType) => {
		const toggleDropdown = (key, e) => {
			if (e) e.stopPropagation();
			setDropdownOpen(dropdownOpen === key ? null : key);
		};

		const handleItemSelect = (itemId, e, catKey) => {
			if (e) e.stopPropagation();
			setDropdownOpen(null);
			if (sectionType === 'case') {
				// For case studies, we toggle tags in an array
				const currentTags = filters[catKey.tagType] || [];
				if (!currentTags.includes(catKey.value)) {
					setFilters({ ...filters, [catKey.tagType]: [...currentTags, catKey.value] });
				}
			} else {
				if (filters.category !== catKey) {
					setFilters({ ...filters, category: catKey });
				}
			}
			// Automatic scroll to item
			setTimeout(() => {
				const element = document.querySelector(`[data-item-id="${itemId}"]`) || (sectionType === 'theory' ? theoryItemRefs.current[itemId] : sectionType === 'case' ? caseItemRefs.current[itemId] : null);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'center' });
					element.click();
				}
			}, 300);
		};

		const content = (
			<div style={{ width: 320, padding: '4px 0' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
					<span style={{ fontWeight: 600, fontSize: 16 }}>Bộ lọc tìm kiếm</span>
				</div>
				<Divider style={{ margin: '8px 0' }} />

				<div style={{ marginBottom: 16 }}>
					<div style={{ display: 'flex', alignItems: 'center', marginTop: 8, gap: 10 }}>
						<span style={{ color: '#595959' }}>Hoàn thành Quiz</span>
						<Select
							size="small"
							style={{ width: 120 }}
							value={filters.quizStatus}
							onChange={(val) => setFilters({ ...filters, quizStatus: val })}
							options={[
								{ value: 'all', label: 'Tất cả' },
								{ value: 'completed', label: 'Đã hoàn thành' },
								{ value: 'incomplete', label: 'Chưa hoàn thành' },
							]}
						/>
					</div>
					{sectionType !== 'case' && (
						<>
							<div style={{ display: 'flex', alignItems: 'center', marginTop: 8, gap: 10 }}>
								<span style={{ color: '#595959' }}>Trạng thái đọc</span>
								<Select
									size="small"
									style={{ width: 120 }}
									value={filters.readStatus}
									onChange={(val) => setFilters({ ...filters, readStatus: val })}
									options={[
										{ value: 'all', label: 'Tất cả' },
										{ value: 'read', label: 'Đã đọc' },
										{ value: 'unread', label: 'Chưa đọc' },
									]}
								/>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', marginTop: 8, gap: 10 }}>
								<span style={{ color: '#595959' }}>Lọc các bài Bookmark</span>
								<Checkbox
									checked={filters.bookmarked}
									onChange={(e) => setFilters({ ...filters, bookmarked: e.target.checked })}
								/>
							</div>
						</>
					)}
				</div>

				{sectionType === 'case' ? (
					<>
						<Divider style={{ margin: '8px 0' }} />
						<div style={{ marginBottom: 16 }}>
							<div style={{ fontWeight: 600, marginBottom: 12, color: '#595959' }}>Danh mục</div>
							<div className={k9Styles.filterButtons} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
								{tag1Options.map(option => {
									const count = getTagCount('tag1', option.value, itemsList);
									const titles = getTitlesForTag('tag1', option.value, itemsList);
									const hasItems = titles.length > 0;
									const isActive = filters.tag1?.includes(option.value);
									const dropdownKey = `tag1-${option.value}`;

									if (count === 0 && !isActive) return null;

									return (
										<div key={option.value} className={k9Styles.categoryButtonContainer} style={{ position: 'relative' }}>
											<button
												className={`${k9Styles.filterBtn} ${isActive ? k9Styles.active : ''}`}
												onClick={() => {
													const current = filters.tag1 || [];
													const next = current.includes(option.value)
														? current.filter(v => v !== option.value)
														: [...current, option.value];
													setFilters({ ...filters, tag1: next });
												}}
												style={{ padding: '4px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
											>
												<span className={k9Styles.chipCountInBtn} style={{ minWidth: '18px', height: '18px', lineHeight: '18px' }}>{count}</span>
												{option.label}
												{hasItems && (
													<button
														className={k9Styles.dropdownToggle}
														onClick={(e) => toggleDropdown(dropdownKey, e)}
														style={{ border: 'none', background: 'transparent', padding: '0 0 0 4px', display: 'flex', alignItems: 'center' }}
													>
														<Menu size={12} color={isActive ? '#fff' : '#000'} />
													</button>
												)}
											</button>

											{hasItems && dropdownOpen === dropdownKey && (
												<div className={k9Styles.dropdownMenu} style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, width: '250px', maxHeight: '300px', overflowY: 'auto', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '4px', border: '1px solid #f0f0f0' }}>
													<div className={k9Styles.dropdownHeader} style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
														<span>{option.label}</span>
														<button className={k9Styles.closeDropdown} onClick={(e) => toggleDropdown(dropdownKey, e)} style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer' }}>×</button>
													</div>
													<div className={k9Styles.dropdownItems}>
														{titles.map(item => (
															<button
																key={item.id}
																className={k9Styles.dropdownItem}
																onClick={(e) => handleItemSelect(item.id, e, { tagType: 'tag1', value: option.value })}
																style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid #f9f9f9', fontSize: '12px' }}
															>
																{item.lessonNumber && <span style={{ marginRight: '4px', color: '#1890ff' }}>{item.lessonNumber}:</span>}
																{item.title}
															</button>
														))}
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>

						<Divider style={{ margin: '8px 0' }} />
						<div style={{ marginBottom: 16 }}>
							<div style={{ fontWeight: 600, marginBottom: 12, color: '#595959' }}>Cấp độ</div>
							<div className={k9Styles.filterButtons} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
								{tag2Options.map(option => {
									const count = getTagCount('tag2', option.value, itemsList);
									const isActive = filters.tag2?.includes(option.value);

									return (
										<button
											key={option.value}
											className={`${k9Styles.filterBtn} ${isActive ? k9Styles.active : ''}`}
											onClick={() => {
												const current = filters.tag2 || [];
												const next = current.includes(option.value)
													? current.filter(v => v !== option.value)
													: [...current, option.value];
												setFilters({ ...filters, tag2: next });
											}}
											style={{ padding: '4px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
										>
											<span className={k9Styles.chipCountInBtn} style={{ minWidth: '18px', height: '18px', lineHeight: '18px' }}>{count}</span>
											{option.label}
										</button>
									);
								})}
							</div>
						</div>
					</>
				) : (
					<>
						<Divider style={{ margin: '8px 0' }} />
						<div style={{ marginBottom: 16 }}>
							<div style={{ fontWeight: 600, marginBottom: 12, color: '#595959' }}>Danh mục</div>
							<div className={k9Styles.filterButtons} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
								{[{ key: 'all', label: 'Tất cả' }, ...categories]
									.filter(cat => cat.key === 'all' || getCategoryCount(cat.key, itemsList) > 0)
									.map(cat => {
										const count = getCategoryCount(cat.key, itemsList);
										const titlesInCategory = getTitlesForCategory(cat.key, itemsList);
										const hasItems = titlesInCategory.length > 0;
										const isActive = filters.category === cat.key;

										return (
											<div key={cat.key} className={k9Styles.categoryButtonContainer} style={{ position: 'relative' }}>
												<button
													className={`${k9Styles.filterBtn} ${isActive ? k9Styles.active : ''}`}
													onClick={() => setFilters({ ...filters, category: cat.key })}
													style={{ padding: '4px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
												>
													<span className={k9Styles.chipCountInBtn} style={{ minWidth: '18px', height: '18px', lineHeight: '18px' }}>{count}</span>
													{cat.label}
													{hasItems && (
														<button
															className={k9Styles.dropdownToggle}
															onClick={(e) => toggleDropdown(cat.key, e)}
															style={{ border: 'none', background: 'transparent', padding: '0 0 0 4px', display: 'flex', alignItems: 'center' }}
														>
															<Menu size={12} color={isActive ? '#fff' : '#000'} />
														</button>
													)}
												</button>

												{hasItems && dropdownOpen === cat.key && (
													<div className={k9Styles.dropdownMenu} style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, width: '250px', maxHeight: '300px', overflowY: 'auto', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '4px', border: '1px solid #f0f0f0' }}>
														<div className={k9Styles.dropdownHeader} style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
															<span>{cat.label}</span>
															<button className={k9Styles.closeDropdown} onClick={(e) => toggleDropdown(cat.key, e)} style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer' }}>×</button>
														</div>
														<div className={k9Styles.dropdownItems}>
															{titlesInCategory.map(item => (
																<button
																	key={item.id}
																	className={k9Styles.dropdownItem}
																	onClick={(e) => handleItemSelect(item.id, e, cat.key)}
																	style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid #f9f9f9' }}
																>
																	{item.lessonNumber && <span style={{ marginRight: '4px', color: '#1890ff' }}>{item.lessonNumber}:</span>}
																	{item.title}
																</button>
															))}
														</div>
													</div>
												)}
											</div>
										);
									})}
							</div>
						</div>
					</>
				)}

				<Divider style={{ margin: '8px 0' }} />

				<div style={{ textAlign: 'right' }}>
					<Button
						type="link"
						danger
						size="small"
						onClick={() => {
							if (sectionType === 'case') {
								setFilters({
									readStatus: 'all',
									bookmarked: false,
									quizStatus: 'all',
									impact: 'all',
									tag1: [],
									tag2: [],
									tag3: [],
								});
							} else {
								setFilters({
									readStatus: 'all',
									bookmarked: false,
									quizStatus: 'all',
									category: 'all'
								});
							}
						}}
					>
						Xóa bộ lọc
					</Button>
				</div>
			</div>
		);

		return (
			<Popover
				content={content}
				trigger="click"
				placement="bottomRight"
			>
				<Button
					size="small"
					icon={<FilterOutlined />}
					style={{ marginLeft: 8 }}
				/>
			</Popover>
		);
	};

	const fetchRelatedCaseTrainingItems = async (cid) => {
		if (!cid) {
			setRelatedCaseTrainingItems([]);
			setRelatedQuizScores({});
			return;
		}
		try {
			const data = await getK9ByCidTypePublic(cid, 'caseTraining', currentUser?.id);
			if (data && Array.isArray(data)) {
				// Filter only items with questionContent (quiz items)
				const quizItems = data.filter(item =>
					item.status === 'published',
				);
				setRelatedCaseTrainingItems(quizItems);

				// Fetch quiz scores for these items
				if (currentUser?.id && quizItems.length > 0) {
					try {
						const histories = await getListQuestionHistoryByUser({ where: { user_id: currentUser.id } });
						if (Array.isArray(histories?.data)) {
							const scoreMap = {};
							quizItems.forEach(item => {
								const history = histories.data.find(h => {
									const qid = h.question_id ?? h.questionId ?? h.idQuestion;
									return qid === item.id;
								});
								if (history) {
									const raw = history.score;
									const num = typeof raw === 'number' ? raw : parseFloat(raw);
									scoreMap[item.id] = isNaN(num) ? null : num;
								} else {
									scoreMap[item.id] = null;
								}
							});
							setRelatedQuizScores(scoreMap);
						} else {
							setRelatedQuizScores({});
						}
					} catch (err) {
						console.error('Error fetching quiz scores:', err);
						setRelatedQuizScores({});
					}
				} else {
					setRelatedQuizScores({});
				}
			} else {
				setRelatedCaseTrainingItems([]);
				setRelatedQuizScores({});
			}
		} catch (error) {
			console.error('Error fetching related caseTraining items:', error);
			setRelatedCaseTrainingItems([]);
			setRelatedQuizScores({});
		}
	};

	// Load history data and build quiz scores map (for all items: newsItems, caseTrainingItems, longFormItems)
	useEffect(() => {
		if (currentUser?.id) {
			setLoading(true);
			getListQuestionHistoryByUser({ where: { user_id: currentUser.id } })
				.then((response) => {
					const historyDataResponse = response || [];
					setHistoryData(historyDataResponse);

					// Build quiz scores map (similar to NewsTab)
					if (Array.isArray(historyDataResponse?.data)) {
						const map = historyDataResponse.data.reduce((acc, h) => {
							const qid = h.question_id ?? h.questionId ?? h.idQuestion;
							if (!qid) return acc;
							const prev = acc[qid];
							// Choose the latest by updated_at/created_at
							const currTime = new Date(h.updated_at || h.created_at || 0).getTime();
							const prevTime = prev ? new Date(prev.updated_at || prev.created_at || 0).getTime() : -1;
							if (!prev || currTime >= prevTime) {
								acc[qid] = h;
							}
							return acc;
						}, {});
						const scoreMap = Object.fromEntries(
							Object.entries(map).map(([qid, hist]) => {
								const raw = hist.score;
								const num = typeof raw === 'number' ? raw : parseFloat(raw);
								return [qid, isNaN(num) ? null : num];
							}),
						);
						setQuizScores(scoreMap);
					} else {
						setQuizScores({});
					}
				})
				.catch((error) => {
					console.error('Error loading history data:', error);
					setQuizScores({});
				})
				.finally(() => setLoading(false));
		} else {
			setQuizScores({});
		}
	}, [currentUser?.id]);

	// Load user app data (read items and bookmarks)
	useEffect(() => {
		const loadUserAppData = async () => {
			if (currentUser?.id) {
				try {
					const user = (await getCurrentUserLogin()).data;
					if (user?.info) {
						if (user.info.read_items_stream) {
							setReadItems(user.info.read_items_stream);
						} else {
							setReadItems([]);
						}
						if (user.info.bookmarks_stream) {
							setBookmarkedItems(user.info.bookmarks_stream);
						} else {
							setBookmarkedItems([]);
						}
					}
				} catch (error) {
					console.error('Error loading user app data:', error);
				}
			} else {
				setReadItems([]);
				setBookmarkedItems([]);
			}
		};
		loadUserAppData();
	}, [currentUser?.id]);

	// Modal Resize effect
	useEffect(() => {
		if (modalResizeStartRatio === null) return;

		const handleMouseMove = (e) => {
			if (!panel1ContainerRef.current) return;
			const rect = panel1ContainerRef.current.parentElement.getBoundingClientRect();
			if (rect.width === 0) return;
			const newRatio = (e.clientX - rect.left) / rect.width;
			setModalPcSplitRatio(Math.max(0.2, Math.min(0.8, newRatio)));
		};

		const handleMouseUp = () => {
			setModalIsDraggingResizer(false);
			setModalResizeStartRatio(null);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [modalResizeStartRatio]);

	// Fetch item by ID and determine its type, then open appropriate modal
	const fetchItem = async (id) => {
		if (!id) return;

		try {
			const itemData = await getK9ByIdPublic(id);
			if (!itemData) return;

			// Determine item type by checking which array contains this item
			const isTheory = newsItems.some(item => item.id == id);
			const isCase = caseTrainingItems.some(item => item.id == id);
			const isLongForm = longFormItems.some(item => item.id == id);

			if (isTheory) {
				// Open theory modal
				setTheoryModalLoading(true);
				setTheoryModalVisible(true);
				setTheoryModalItem(itemData);
				setSelectedTheoryItem(itemData);
				setTheoryModalLoading(false);
			} else if (isCase) {
				// Open case modal
				setCaseModalLoading(true);
				setCaseModalVisible(true);
				setCaseModalItem(itemData);
				setSelectedCaseItem(itemData);
				setSelectedTheoryItem(null); // Clear theory selection
				setShowSummaryDetail(false);

				// Fetch CID source info if has CID
				if (itemData.cid) {
					await fetchCidSourceInfo(itemData.cid);
				}
				setCaseModalLoading(false);
			} else if (isLongForm) {
				// Open long form modal
				setModalLoading(true);
				setIsModalVisible(true);
				setSelectedLongFormItem(itemData);
				setModalLoading(false);
			}

			// FETCH RELATED TESTS FOR ALL TYPES IF CID EXISTS
			if (itemData.cid) {
				await fetchRelatedCaseTrainingItems(itemData.cid);
			}

			// Scroll to item if it's visible in the list
			setTimeout(() => {
				const targetElement = document.querySelector(`[data-item-id="${id}"]`);
				if (targetElement) {
					targetElement.scrollIntoView({
						behavior: 'smooth',
						block: 'center',
						inline: 'nearest',
					});
					// Add highlight effect
					targetElement.style.backgroundColor = '#e6f7ff';
					targetElement.style.border = '2px solid #1890ff';
					setTimeout(() => {
						targetElement.style.backgroundColor = '';
						targetElement.style.border = '';
					}, 3000);
				}
			}, 500);
		} catch (error) {
			console.error('Error fetching item:', error);
		}
	};

	// Handle expandedItem from URL params
	useEffect(() => {
		if (expandedItem && currentUser.id) {
			fetchItem(expandedItem);

		}
	}, [expandedItem, newsItems, caseTrainingItems, longFormItems, currentUser]);


	// Get current program name
	const getCurrentProgramName = () => {
		if (!selectedProgram || selectedProgram === 'all') return 'Tất cả chương trình';
		if (Array.isArray(selectedProgram)) {
			if (selectedProgram.length === 0) return 'Chọn chương trình';
			if (selectedProgram.length === 1) {
				const option = tag4Options?.find(opt => opt.value === selectedProgram[0]);
				return option?.displayName || option?.label || 'Chương trình';
			}
			return `${selectedProgram.length} chương trình`;
		}
		const selectedProgramOption = tag4Options?.find(option => option.value === selectedProgram);
		return selectedProgramOption?.displayName || selectedProgramOption?.label || 'Chọn chương trình';
	};

	const programName = getCurrentProgramName();

	// Calculate completion rate from headerStats
	const completionRate = headerStats?.totalQuizzes > 0
		? Math.round((headerStats.completedQuizzes / headerStats.totalQuizzes) * 100)
		: 0;

	// Filter longFormItems by selectedProgram and search text
	// Helper function to get quiz status (same logic as NewsItem)
	const getQuizStatus = (item) => {
		// Check if item has questionContent (quiz available)
		if (item.questionContent === undefined || item.questionContent === null) {
			return {
				type: 'reference', // Tham khảo
			};
		}

		// Check quiz score
		const quizScore = quizScores[item.id];
		if (quizScore === undefined || quizScore === null) {
			return {
				type: 'notDone', // Chưa làm
			};
		}

		// Has score
		const numeric = Number(quizScore);
		const pass = !isNaN(numeric) && numeric >= 70; // Pass threshold is 70 to match CaseTrainingTab.jsx

		return {
			type: 'done',
			numeric,
			pass,
		};
	};

	// Render quiz status badge (same logic as NewsItem)
	const renderQuizStatusBadge = (item) => {
		const quizStatus = getQuizStatus(item);

		if (quizStatus.type === 'reference') {
			return (
				<span
					className={`${styles.quizStatusBadge} ${styles.quizStatusReference}`}
					title='Tham khảo'
				>
					Tham khảo
				</span>
			);
		}

		if (quizStatus.type === 'notDone') {
			return (
				<span
					className={`${styles.quizStatusBadge} ${styles.quizStatusNotDone}`}
					title='Chưa làm'
				>
					Chưa làm
				</span>
			);
		}

		// Has score
		return (
			<span
				className={`${styles.quizStatusBadge} ${quizStatus.pass ? styles.quizStatusPass : styles.quizStatusFail}`}
				title={`Đạt ${quizStatus.numeric}/100`}
			>
				Đạt {quizStatus.numeric}/100
			</span>
		);
	};

	const wikiBaseFilteredList = useMemo(() => {
		let filtered = longFormItems.filter(item => item.status === 'published');

		// Filter by selectedProgram
		if (selectedProgram && selectedProgram !== 'all') {
			filtered = filtered.filter(item => {
				if (!Array.isArray(item.tag4)) return false;
				if (Array.isArray(selectedProgram)) {
					return selectedProgram.some(prog => item.tag4.includes(prog));
				}
				return item.tag4.includes(selectedProgram);
			});
		}

		// New Filters (except category)
		if (wikiFilters.readStatus === 'read') {
			filtered = filtered.filter(item => readItems.includes(item.id));
		} else if (wikiFilters.readStatus === 'unread') {
			filtered = filtered.filter(item => !readItems.includes(item.id));
		}

		if (wikiFilters.bookmarked) {
			filtered = filtered.filter(item => bookmarkedItems.includes(item.id));
		}

		if (wikiFilters.quizStatus !== 'all') {
			filtered = filtered.filter(item => {
				const status = getQuizStatus(item);
				if (wikiFilters.quizStatus === 'completed') {
					return status.type === 'done' && status.pass;
				} else {
					return status.type === 'notDone' || (status.type === 'done' && !status.pass);
				}
			});
		}

		// Filter by tag5 (Bottom row filter)
		if (selectedTag5.length > 0) {
			filtered = filtered.filter(item => {
				if (!item.tag5) return false;
				if (Array.isArray(item.tag5)) {
					return selectedTag5.some(tag => item.tag5.includes(tag));
				}
				return selectedTag5.includes(item.tag5);
			});
		}

		// Filter by search text
		if (searchText && searchText.trim()) {
			const searchTerm = searchText.toLowerCase().trim();
			filtered = filtered.filter(item => {
				const searchableText = `${item.title} ${item.summary || ''} ${item.description || ''} ${item.detail || ''}`.toLowerCase();
				return searchableText.includes(searchTerm);
			});
		}

		return filtered;
	}, [longFormItems, selectedProgram, selectedTag5, searchText, wikiFilters.readStatus, wikiFilters.bookmarked, wikiFilters.quizStatus, readItems, bookmarkedItems, quizScores]);

	const filteredLongFormItems = useMemo(() => {
		if (wikiFilters.category === 'all') return wikiBaseFilteredList;
		return wikiBaseFilteredList.filter(item => item.category === wikiFilters.category);
	}, [wikiBaseFilteredList, wikiFilters.category]);

	// Get all unique tag5 values from all items - use state instead of useMemo
	const [allTag5Options, setAllTag5Options] = useState([]);
	console.log('allTag5Options', allTag5Options);


	// Calculate progress for each tag5
	const tag5Progress = useMemo(() => {
		const progress = {};
		allTag5Options.forEach(tag5Value => {
			const allItems = [...newsItems, ...caseTrainingItems, ...longFormItems];
			const itemsWithTag5 = allItems.filter(item => {
				if (!item.tag5) return false;
				if (Array.isArray(item.tag5)) {
					return item.tag5.includes(tag5Value);
				}
				return item.tag5 === tag5Value;
			});

			// Filter by selectedProgram if needed
			const filteredItems = selectedProgram && selectedProgram !== 'all'
				? itemsWithTag5.filter(item => {
					if (!Array.isArray(item.tag4)) return false;
					if (Array.isArray(selectedProgram)) {
						return selectedProgram.some(prog => item.tag4.includes(prog));
					}
					return item.tag4.includes(selectedProgram);
				})
				: itemsWithTag5;

			// Count items with quiz (questionContent)
			const itemsWithQuiz = filteredItems.filter(item =>
				item.questionContent !== undefined && item.questionContent !== null,
			);
			const total = itemsWithQuiz.length;

			// Count completed (has score, regardless of score value)
			const completed = itemsWithQuiz.filter(item => {
				const score = quizScores[item.id];
				const numeric = typeof score === 'number' ? score : parseFloat(score);
				return !isNaN(numeric) && numeric >= 0;
			}).length;

			const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

			progress[tag5Value] = {
				total,
				completed,
				completionRate,
			};
		});
		return progress;
	}, [allTag5Options, newsItems, caseTrainingItems, longFormItems, selectedProgram, quizScores]);

	// Panel 1: Theory column - Filter and sort items
	const theoryBaseFilteredList = useMemo(() => {
		let filtered = (newsItems || []).filter(item => item.status === 'published');

		// Filter by selectedProgram
		if (selectedProgram && selectedProgram !== 'all') {
			filtered = filtered.filter(item => {
				if (!Array.isArray(item.tag4)) return false;
				if (Array.isArray(selectedProgram)) {
					return selectedProgram.some(prog => item.tag4.includes(prog));
				}
				return item.tag4.includes(selectedProgram);
			});
		}

		// New Filters (except category)
		if (theoryFilters.readStatus === 'read') {
			filtered = filtered.filter(item => readItems.includes(item.id));
		} else if (theoryFilters.readStatus === 'unread') {
			filtered = filtered.filter(item => !readItems.includes(item.id));
		}

		if (theoryFilters.bookmarked) {
			filtered = filtered.filter(item => bookmarkedItems.includes(item.id));
		}

		if (theoryFilters.quizStatus !== 'all') {
			filtered = filtered.filter(item => {
				const status = getQuizStatus(item);
				if (theoryFilters.quizStatus === 'completed') {
					return status.type === 'done' && status.pass;
				} else {
					return status.type === 'notDone' || (status.type === 'done' && !status.pass);
				}
			});
		}

		// Filter by tag5 (Bottom row filter)
		if (selectedTag5.length > 0) {
			filtered = filtered.filter(item => {
				if (!item.tag5) return false;
				if (Array.isArray(item.tag5)) {
					return selectedTag5.some(tag => item.tag5.includes(tag));
				}
				return selectedTag5.includes(item.tag5);
			});
		}

		// Filter by search text
		if (theorySearchText && theorySearchText.trim()) {
			const searchTerm = theorySearchText.toLowerCase().trim();
			filtered = filtered.filter(item => {
				const searchableText = `${item.title} ${item.summary || ''} ${item.description || ''} ${item.detail || ''}`.toLowerCase();
				return searchableText.includes(searchTerm);
			});
		}

		return filtered;
	}, [newsItems, selectedProgram, selectedTag5, theorySearchText, theoryFilters.readStatus, theoryFilters.bookmarked, theoryFilters.quizStatus, readItems, bookmarkedItems, quizScores]);

	const filteredTheoryItems = useMemo(() => {
		if (theoryFilters.category === 'all') return theoryBaseFilteredList;
		return theoryBaseFilteredList.filter(item => item.category === theoryFilters.category);
	}, [theoryBaseFilteredList, theoryFilters.category]);

	// Panel 1: Case column - Filter and sort items
	const caseBaseFilteredList = useMemo(() => {
		let filtered = (caseTrainingItems || []).filter(item =>
			item.status === 'published' && item.impact !== 'skip'
		);

		// Filter by selectedProgram
		if (selectedProgram && selectedProgram !== 'all') {
			filtered = filtered.filter(item => {
				if (!Array.isArray(item.tag4)) return false;
				if (Array.isArray(selectedProgram)) {
					return selectedProgram.some(prog => item.tag4.includes(prog));
				}
				return item.tag4.includes(selectedProgram);
			});
		}

		// New Filters (except tags)
		if (caseFilters.readStatus === 'read') {
			filtered = filtered.filter(item => readItems.includes(item.id));
		} else if (caseFilters.readStatus === 'unread') {
			filtered = filtered.filter(item => !readItems.includes(item.id));
		}

		if (caseFilters.bookmarked) {
			filtered = filtered.filter(item => bookmarkedItems.includes(item.id));
		}

		if (caseFilters.quizStatus !== 'all') {
			filtered = filtered.filter(item => {
				const status = getQuizStatus(item);
				if (caseFilters.quizStatus === 'completed') {
					return status.type === 'done' && status.pass;
				} else {
					return status.type === 'notDone' || (status.type === 'done' && !status.pass);
				}
			});
		}

		// Impact filter
		if (caseFilters.impact && caseFilters.impact !== 'all') {
			filtered = filtered.filter(item => item.impact === caseFilters.impact);
		}

		// Filter by tag5 (Bottom row filter)
		if (selectedTag5.length > 0) {
			filtered = filtered.filter(item => {
				if (!item.tag5) return false;
				if (Array.isArray(item.tag5)) {
					return selectedTag5.some(tag => item.tag5.includes(tag));
				}
				return selectedTag5.includes(item.tag5);
			});
		}

		// Filter by search text
		if (caseSearchText && caseSearchText.trim()) {
			const searchTerm = caseSearchText.toLowerCase().trim();
			filtered = filtered.filter(item => {
				const searchableText = `${item.title} ${item.summary || ''} ${item.description || ''} ${item.detail || ''}`.toLowerCase();
				return searchableText.includes(searchTerm);
			});
		}

		return filtered;
	}, [caseTrainingItems, selectedProgram, selectedTag5, caseSearchText, caseFilters.readStatus, caseFilters.bookmarked, caseFilters.quizStatus, readItems, bookmarkedItems, quizScores]);

	const filteredCaseItems = useMemo(() => {
		let filtered = caseBaseFilteredList;

		if (caseFilters.tag1 && caseFilters.tag1.length > 0) {
			filtered = filtered.filter(item => caseFilters.tag1.includes(item.tag1));
		}
		if (caseFilters.tag2 && caseFilters.tag2.length > 0) {
			filtered = filtered.filter(item => caseFilters.tag2.includes(item.tag2));
		}
		if (caseFilters.tag3 && caseFilters.tag3.length > 0) {
			filtered = filtered.filter(item => caseFilters.tag3.includes(item.tag3));
		}

		// Sort by connection if enabled
		if (caseSortByConnection) {
			filtered = [...filtered].sort((a, b) => {
				// First priority: selected item goes to top
				if (selectedCaseItem) {
					if (a.id === selectedCaseItem.id) return -1;
					if (b.id === selectedCaseItem.id) return 1;
				}

				// Second priority: items with connection to selected theory item
				if (selectedTheoryItem && selectedTheoryItem.cid) {
					const aHasConnection = a.cid === selectedTheoryItem.cid;
					const bHasConnection = b.cid === selectedTheoryItem.cid;
					if (aHasConnection && !bHasConnection) return -1;
					if (!aHasConnection && bHasConnection) return 1;
				}

				return 0;
			});
		}

		return filtered;
	}, [caseBaseFilteredList, caseFilters.tag1, caseFilters.tag2, caseFilters.tag3, caseSortByConnection, selectedTheoryItem, selectedCaseItem]);

	// Get all unique tag5 values from all items (not filtered by selectedTag5)
	useEffect(() => {
		const tag5Set = new Set();
		// Use original items, but filter by selectedProgram if needed
		let allItems = [...newsItems, ...caseTrainingItems, ...longFormItems];

		// Filter by selectedProgram if needed (but NOT by selectedTag5)
		if (selectedProgram && selectedProgram !== 'all') {
			allItems = allItems.filter(item => {
				if (!Array.isArray(item.tag4)) return false;
				if (Array.isArray(selectedProgram)) {
					return selectedProgram.some(prog => item.tag4.includes(prog));
				}
				return item.tag4.includes(selectedProgram);
			});
		}

		// Only include published items
		allItems = allItems.filter(item => item.status === 'published');

		allItems.forEach(item => {
			if (item.tag5) {
				if (Array.isArray(item.tag5)) {
					item.tag5.forEach(tag => tag5Set.add(tag));
				} else {
					tag5Set.add(item.tag5);
				}
			}
		});
		setAllTag5Options(Array.from(tag5Set).sort());
	}, [newsItems, caseTrainingItems, longFormItems, selectedProgram]);

	// Calculate visible tags based on 2 rows limit
	useEffect(() => {
		if (allTag5Options.length === 0) {
			setVisibleTagCount(Infinity);
			return;
		}

		if (!tagListRef.current) {
			setVisibleTagCount(Infinity);
			return;
		}

		const calculateVisibleCount = () => {
			const container = tagListRef.current;
			const hiddenContainer = hiddenTagListRef.current;

			if (!container || !hiddenContainer) return;

			// Update hidden container width to match visible container
			hiddenContainer.style.width = `${container.offsetWidth}px`;

			// Get all items from hidden container
			const allItems = Array.from(hiddenContainer.children);

			if (allItems.length === 0) {
				setVisibleTagCount(Infinity);
				return;
			}

			const containerWidth = container.offsetWidth;
			const gap = 8;
			let rows = [];
			let currentRow = [];
			let currentRowWidth = 0;

			allItems.forEach((item, index) => {
				const itemWidth = item.offsetWidth;

				if (currentRowWidth + itemWidth > containerWidth && currentRow.length > 0) {
					rows.push(currentRow);
					currentRow = [index];
					currentRowWidth = itemWidth + gap;
				} else {
					currentRow.push(index);
					currentRowWidth += itemWidth + gap;
				}
			});
			if (currentRow.length > 0) {
				rows.push(currentRow);
			}

			// Count items in first 2 rows
			const itemsIn2Rows = rows.slice(0, 2).reduce((sum, row) => sum + row.length, 0);

			if (rows.length <= 2) {
				setVisibleTagCount(Infinity);
			} else {
				setVisibleTagCount(itemsIn2Rows);
			}
		};

		const timeoutId = setTimeout(calculateVisibleCount, 100);

		const resizeObserver = new ResizeObserver(() => {
			clearTimeout(timeoutId);
			setTimeout(calculateVisibleCount, 100);
		});

		if (tagListRef.current) {
			resizeObserver.observe(tagListRef.current);
		}

		return () => {
			clearTimeout(timeoutId);
			resizeObserver.disconnect();
		};
	}, [allTag5Options.length, tag5Progress]);

	// Combined items for connection lines
	const allPanel1Items = useMemo(() => {
		return [...filteredTheoryItems, ...filteredCaseItems];
	}, [filteredTheoryItems, filteredCaseItems]);

	// Update combined refs for connection lines
	useEffect(() => {
		panel1ItemRefs.current = {
			...theoryItemRefs.current,
			...caseItemRefs.current,
		};
	}, [filteredTheoryItems, filteredCaseItems]);

	// Panel 2: Reset renderedCount when filters change
	useEffect(() => {
		setRenderedCount(20);
	}, [selectedProgram, searchText, selectedTag5]);

	// Panel 2: Update visible items based on rendered count
	useEffect(() => {
		if (filteredLongFormItems.length > 0) {
			setVisibleItems(filteredLongFormItems.slice(0, renderedCount));
		} else {
			setVisibleItems([]);
		}
	}, [renderedCount, filteredLongFormItems.length]);

	// Panel 2: Load more items when scrolling to bottom
	const loadMoreItems = () => {
		if (renderedCount < filteredLongFormItems.length) {
			setRenderedCount(prev => Math.min(prev + 20, filteredLongFormItems.length));
		}
	};

	// Panel 2: Intersection Observer for infinite scroll
	useEffect(() => {
		if (!lastItemRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && renderedCount < filteredLongFormItems.length) {
					loadMoreItems();
				}
			},
			{
				threshold: 0.1,
				rootMargin: '100px',
			},
		);

		observer.observe(lastItemRef.current);

		return () => {
			observer.disconnect();
		};
	}, [visibleItems.length, renderedCount, filteredLongFormItems.length]);

	// Handle item click - open modal
	const handleLongFormItemClick = async (item) => {
		setModalLoading(true);
		setIsModalVisible(true);
		try {
			const itemData = await getK9ByIdPublic(item.id);
			if (itemData) {
				setSelectedLongFormItem(itemData);
				if (itemData.cid) {
					await fetchRelatedCaseTrainingItems(itemData.cid);
				}
			} else {
				setSelectedLongFormItem(item);
			}
		} catch (error) {
			console.error('Error fetching item:', error);
			setSelectedLongFormItem(item);
		} finally {
			setModalLoading(false);
		}
	};

	// Handle Theory item icon click - open modal (same view as wiki)
	const handleTheoryItemIconClick = async (item, e) => {
		if (e) {
			e.stopPropagation();
		}
		setTheoryModalLoading(true);
		setTheoryModalVisible(true);
		try {
			const itemData = await getK9ByIdPublic(item.id);
			if (itemData) {
				setTheoryModalItem(itemData);
				if (itemData.cid) {
					await fetchRelatedCaseTrainingItems(itemData.cid);
				}
			} else {
				setTheoryModalItem(item);
			}
		} catch (error) {
			console.error('Error fetching theory item:', error);
			setTheoryModalItem(item);
		} finally {
			setTheoryModalLoading(false);
		}
	};

	// Fetch CID source info
	const fetchCidSourceInfo = async (cid) => {
		if (!cid) return;
		try {
			const data = await getK9ByCidTypePublic(cid, 'news');
			if (data) {
				setCidSourceInfo(data);
			} else {
				setCidSourceInfo(null);
			}
		} catch (error) {
			console.error('Error fetching CID source info:', error);
			setCidSourceInfo(null);
		}
	};

	// Handle CID source info click
	const handleCidSourceInfoClick = (data) => {
		if (data && data.length > 0) {
			const url = `${window.location.origin}/home?tab=stream&item=${data[0]?.id}`;
			window.open(url, '_blank');
		}
	};

	// Helper function to get file icon based on extension
	const getFileIcon = (extension) => {
		const iconMap = {
			pdf: '📄',
			doc: '📝',
			docx: '📝',
			xls: '📊',
			xlsx: '📊',
			ppt: '📽️',
			pptx: '📽️',
			txt: '📄',
			jpg: '🖼️',
			jpeg: '🖼️',
			png: '🖼️',
			gif: '🖼️',
			mp4: '🎥',
			avi: '🎥',
			mov: '🎥',
			mp3: '🎵',
			wav: '🎵',
			zip: '📦',
			rar: '📦',
			'7z': '📦',
		};
		return iconMap[extension] || '📄';
	};

	// Helper function to open file preview
	const openFilePreview = (fileUrl, fileName) => {
		const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
		setPreviewFile({
			url: fileUrl,
			name: fileName,
			extension: fileExtension,
		});
		setPreviewModalVisible(true);
	};

	// Handle Case item click - open modal with full content
	const handleCaseItemClick = async (item) => {
		setCaseModalLoading(true);
		setCaseModalVisible(true);
		setSelectedCaseItem(item);
		setSelectedTheoryItem(null); // Clear theory selection when clicking case
		setShowSummaryDetail(false); // Reset summary detail
		try {
			const fullItem = await getK9ByIdPublic(item.id);
			setCaseModalItem(fullItem);
			if (fullItem?.cid) {
				await fetchCidSourceInfo(fullItem.cid);
				await fetchRelatedCaseTrainingItems(fullItem.cid);
			}
		} catch (error) {
			console.error('Error fetching case item:', error);
			setCaseModalItem(item);
		} finally {
			setCaseModalLoading(false);
		}
	};

	// Preprocess and postprocess LaTeX (same as NewsTab)
	const preprocessLatex = (text) => {
		if (!text) return { processedText: '', latexBlocks: [] };
		let processedText = text;
		const latexBlocks = [];
		processedText = processedText.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
			const placeholder = `LATEX_DISPLAY_${latexBlocks.length}`;
			latexBlocks.push({ placeholder, formula, display: true });
			return placeholder;
		});
		processedText = processedText.replace(/\$([^$]+)\$/g, (match, formula) => {
			const placeholder = `LATEX_INLINE_${latexBlocks.length}`;
			latexBlocks.push({ placeholder, formula, display: false });
			return placeholder;
		});
		return { processedText, latexBlocks };
	};

	const postprocessLatex = (html, latexBlocks) => {
		if (!latexBlocks || latexBlocks.length === 0) return html;
		let result = html;
		latexBlocks.forEach(({ placeholder, formula, display }) => {
			try {
				const renderedLatex = katex.renderToString(formula, {
					throwOnError: false,
					displayMode: display,
					strict: false,
					trust: true,
				});
				result = result.replace(new RegExp(placeholder, 'g'), renderedLatex);
			} catch (error) {
				console.warn('LaTeX rendering error:', error);
			}
		});
		return result;
	};



	// Scroll to heading by index
	const scrollToHeading = (headingIndex, markdownRef = null) => {
		setActiveHeadingIndex(headingIndex);
		const markdownContent = markdownRef || markdownContentRef.current || caseMarkdownContentRef.current;
		if (!markdownContent) return;
		const headings = markdownContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
		const element = headings[headingIndex];
		if (element) {
			headings.forEach(h => h.classList.remove(newsTabStyles.headingHighlight));
			element.classList.add(newsTabStyles.headingHighlight);
			element.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
				inline: 'nearest',
			});
		}
	};

	// Highlight text in content
	const highlightTextInContent = (text, searchTerm) => {
		if (!searchTerm || !text) return text;
		const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
		return text.replace(regex, '<mark>$1</mark>');
	};

	// Search and highlight functions
	const performSearch = (text, item) => {
		if (!text || !item || !item.detail) {
			setSearchResults([]);
			return;
		}
		const { processedText, latexBlocks } = preprocessLatex(item.detail || '');
		let html = marked.parse(processedText, {
			headerIds: true,
			mangle: false,
			headerPrefix: '',
			breaks: false,
			gfm: true,
		});
		const finalHtml = postprocessLatex(html, latexBlocks);
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = finalHtml;
		const plainText = tempDiv.textContent || tempDiv.innerText || '';
		const searchTerm = text.toLowerCase();
		const lowerPlainText = plainText.toLowerCase();
		const results = [];
		let index = 0;
		while ((index = lowerPlainText.indexOf(searchTerm, index)) !== -1) {
			const before = Math.max(0, index - 100);
			const after = Math.min(plainText.length, index + searchTerm.length + 100);
			const context = plainText.substring(before, after);
			results.push({
				index: results.length,
				position: index,
				context: context,
				match: plainText.substring(index, index + searchTerm.length),
				matchIndex: index,
			});
			index += searchTerm.length;
		}
		setSearchResults(results);
		if (results.length > 0) {
			setHighlightedIndex(0);
		}
	};

	// Search directly in rendered HTML content
	const performSearchInRenderedContent = (text) => {
		if (!text || !markdownContentRef.current) {
			setSearchResults([]);
			return;
		}
		const searchTerm = text.toLowerCase();
		const container = markdownContentRef.current;
		const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
		const textNodes = [];
		let node;
		while (node = walker.nextNode()) {
			textNodes.push(node);
		}
		let plainText = '';
		const nodeMap = [];
		textNodes.forEach(textNode => {
			const nodeText = textNode.textContent;
			const startPos = plainText.length;
			plainText += nodeText;
			nodeMap.push({
				node: textNode,
				startPos: startPos,
				endPos: plainText.length,
				text: nodeText,
			});
		});
		const lowerPlainText = plainText.toLowerCase();
		const results = [];
		let index = 0;
		while ((index = lowerPlainText.indexOf(searchTerm, index)) !== -1) {
			const before = Math.max(0, index - 100);
			const after = Math.min(plainText.length, index + searchTerm.length + 100);
			const context = plainText.substring(before, after);
			const nodeInfo = nodeMap.find(n => index >= n.startPos && index < n.endPos);
			results.push({
				index: results.length,
				position: index,
				context: context,
				match: plainText.substring(index, index + searchTerm.length),
				node: nodeInfo?.node || null,
				nodeOffset: nodeInfo ? index - nodeInfo.startPos : 0,
			});
			index += searchTerm.length;
		}
		setSearchResults(results);
		if (results.length > 0) {
			setHighlightedIndex(0);
		}
	};

	const handleEditClick = (item) => {
		if (item) {
			setEditingItem(item);
			setEditModalVisible(true);
		}
	};

	const closeEditModal = () => {
		setEditModalVisible(false);
		setEditingItem(null);
	};

	const handleDetailUpdate = (updatedItem) => {
		// Update the item in the local state/modals if it's the one currently open
		if (selectedLongFormItem && selectedLongFormItem.id === updatedItem.id) {
			setSelectedLongFormItem(updatedItem);
		}
		if (theoryModalItem && theoryModalItem.id === updatedItem.id) {
			setTheoryModalItem(updatedItem);
		}
		if (caseModalItem && caseModalItem.id === updatedItem.id) {
			setCaseModalItem(updatedItem);
		}
	};

	const scrollToSearchResult = (resultIndex) => {
		if (resultIndex < 0 || resultIndex >= searchResults.length) return;
		setHighlightedIndex(resultIndex);
		const result = searchResults[resultIndex];
		setTimeout(() => {
			if (!markdownContentRef.current) return;
			if (result.node) {
				try {
					const range = document.createRange();
					const offset = result.nodeOffset || 0;
					const matchLength = result.match.length;
					const maxOffset = result.node.textContent.length;
					const safeOffset = Math.min(Math.max(0, offset), maxOffset);
					const safeEnd = Math.min(safeOffset + matchLength, maxOffset);
					if (safeOffset >= maxOffset) return;
					range.setStart(result.node, safeOffset);
					range.setEnd(result.node, safeEnd);
					let elementToScroll = range.startContainer.parentElement;
					while (elementToScroll && elementToScroll !== markdownContentRef.current) {
						const tagName = elementToScroll.tagName?.toLowerCase();
						if (['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'].includes(tagName)) {
							if (tagName !== 'span' || elementToScroll.textContent.length > 50) {
								break;
							}
						}
						elementToScroll = elementToScroll.parentElement;
					}
					if (elementToScroll) {
						elementToScroll.scrollIntoView({
							behavior: 'smooth',
							block: 'center',
							inline: 'nearest',
						});
						const parent = range.startContainer.parentElement;
						if (parent) {
							markdownContentRef.current.querySelectorAll('.search-highlight-temp').forEach(el => {
								el.classList.remove('search-highlight-temp');
								el.style.backgroundColor = '';
								el.style.borderRadius = '';
								el.style.padding = '';
							});
							parent.classList.add('search-highlight-temp');
							parent.style.backgroundColor = '#ffd700';
							parent.style.transition = 'background-color 0.3s';
							parent.style.borderRadius = '4px';
							parent.style.padding = '2px 4px';
							setTimeout(() => {
								if (parent.classList) {
									parent.classList.remove('search-highlight-temp');
								}
								parent.style.backgroundColor = '';
								parent.style.borderRadius = '';
								parent.style.padding = '';
							}, 2000);
						}
					}
				} catch (e) {
					console.error('Error scrolling to search result:', e);
				}
			} else {
				if (markdownContentRef.current) {
					const walker = document.createTreeWalker(
						markdownContentRef.current,
						NodeFilter.SHOW_TEXT,
						null,
					);
					let node;
					let charCount = 0;
					while (node = walker.nextNode()) {
						const nodeText = node.textContent;
						const nodeLength = nodeText.length;
						if (charCount + nodeLength >= result.position) {
							const offset = result.position - charCount;
							try {
								const range = document.createRange();
								range.setStart(node, Math.min(offset, nodeLength));
								range.setEnd(node, Math.min(offset + result.match.length, nodeLength));
								node.parentElement?.scrollIntoView({
									behavior: 'smooth',
									block: 'center',
								});
							} catch (e) {
								node.parentElement?.scrollIntoView({
									behavior: 'smooth',
									block: 'center',
								});
							}
							break;
						}
						charCount += nodeLength;
					}
				}
			}
		}, 100);
	};

	const navigateSearchResult = (direction) => {
		if (searchResults.length === 0) return;
		let newIndex = highlightedIndex + direction;
		if (newIndex < 0) {
			newIndex = searchResults.length - 1;
		} else if (newIndex >= searchResults.length) {
			newIndex = 0;
		}
		scrollToSearchResult(newIndex);
	};

	// Drag handlers for search results panel
	const handleMouseDown = (e) => {
		if (!panelRef.current) return;
		const rect = panelRef.current.getBoundingClientRect();
		setDragOffset({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});
		setIsDragging(true);
		e.preventDefault();
		e.stopPropagation();
	};

	useEffect(() => {
		if (!isDragging) return;
		let animationFrameId = null;
		const maxX = window.innerWidth - 350;
		const maxY = window.innerHeight - 100;
		const handleMouseMove = (e) => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			animationFrameId = requestAnimationFrame(() => {
				const newX = e.clientX - dragOffset.x;
				const newY = e.clientY - dragOffset.y;
				setPanelPosition({
					x: Math.max(0, Math.min(newX, maxX)),
					y: Math.max(0, Math.min(newY, maxY)),
				});
			});
		};
		const handleMouseUp = () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			setIsDragging(false);
		};
		document.addEventListener('mousemove', handleMouseMove, { passive: true });
		document.addEventListener('mouseup', handleMouseUp);
		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isDragging, dragOffset]);

	// Render TOC Sidebar
	const renderTOCSidebar = (item) => {
		if (headings.length === 0) return null;
		return (
			<div className={`${newsTabStyles.tocSidebar} ${newsTabStyles.show}`}>
				<div className={newsTabStyles.tocSidebarHeader}>
					<h4>Mục lục</h4>
				</div>
				<div className={newsTabStyles.tocSidebarList}>
					{headings.map((heading, index) => (
						<div
							key={index}
							className={`${newsTabStyles.tocSidebarItem} ${newsTabStyles[`tocSidebarLevel${heading.level}`]} ${activeHeadingIndex === index ? newsTabStyles.tocSidebarItemActive : ''}`}
							onClick={() => scrollToHeading(index)}
							title={`Cuộn đến: ${heading.text}`}
						>
							{heading.text}
						</div>
					))}
				</div>
			</div>
		);
	};

	// Extract headings when modal item changes
	useEffect(() => {
		const currentItem = selectedLongFormItem || theoryModalItem || caseModalItem;
		if (currentItem && currentItem.detail) {
			const extractedHeadings = extractHeadings(currentItem.detail);
			setHeadings(extractedHeadings);
			setActiveHeadingIndex(-1);
		} else {
			setHeadings([]);
			setActiveHeadingIndex(-1);
		}
	}, [selectedLongFormItem?.id, theoryModalItem?.id, caseModalItem?.id]);

	// Handle search text change - search after content is rendered
	useEffect(() => {
		const currentItem = selectedLongFormItem || theoryModalItem;
		if (currentItem && currentItem.detail && modalSearchText.trim()) {
			setTimeout(() => {
				if (markdownContentRef.current) {
					performSearchInRenderedContent(modalSearchText);
				} else {
					performSearch(modalSearchText, currentItem);
				}
			}, 100);
		} else {
			setSearchResults([]);
			setHighlightedIndex(-1);
		}
	}, [modalSearchText, selectedLongFormItem?.id, theoryModalItem?.id]);

	// Auto show panel when search results appear
	useEffect(() => {
		if (searchResults.length > 0) {
			setShowSearchResultsPanel(true);
		}
	}, [searchResults.length]);

	// Case modal search functions
	const performCaseSearch = (text, item) => {
		if (!text || !item || !item.detail) {
			setCaseSearchResults([]);
			return;
		}
		const { processedText, latexBlocks } = preprocessLatex(item.detail || '');
		let html = marked.parse(processedText, {
			headerIds: true,
			mangle: false,
			headerPrefix: '',
			breaks: false,
			gfm: true,
		});
		const finalHtml = postprocessLatex(html, latexBlocks);
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = finalHtml;
		const plainText = tempDiv.textContent || tempDiv.innerText || '';
		const searchTerm = text.toLowerCase();
		const lowerPlainText = plainText.toLowerCase();
		const results = [];
		let index = 0;
		while ((index = lowerPlainText.indexOf(searchTerm, index)) !== -1) {
			const before = Math.max(0, index - 100);
			const after = Math.min(plainText.length, index + searchTerm.length + 100);
			const context = plainText.substring(before, after);
			results.push({
				index: results.length,
				position: index,
				context: context,
				match: plainText.substring(index, index + searchTerm.length),
				matchIndex: index,
			});
			index += searchTerm.length;
		}
		setCaseSearchResults(results);
		if (results.length > 0) {
			setCaseHighlightedIndex(0);
		}
	};

	const performCaseSearchInRenderedContent = (text) => {
		if (!text || !caseMarkdownContentRef.current) {
			setCaseSearchResults([]);
			return;
		}
		const searchTerm = text.toLowerCase();
		const container = caseMarkdownContentRef.current;
		const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
		const textNodes = [];
		let node;
		while (node = walker.nextNode()) {
			textNodes.push(node);
		}
		let plainText = '';
		const nodeMap = [];
		textNodes.forEach(textNode => {
			const nodeText = textNode.textContent;
			const startPos = plainText.length;
			plainText += nodeText;
			nodeMap.push({
				node: textNode,
				startPos: startPos,
				endPos: plainText.length,
				text: nodeText,
			});
		});
		const lowerPlainText = plainText.toLowerCase();
		const results = [];
		let index = 0;
		while ((index = lowerPlainText.indexOf(searchTerm, index)) !== -1) {
			const before = Math.max(0, index - 100);
			const after = Math.min(plainText.length, index + searchTerm.length + 100);
			const context = plainText.substring(before, after);
			const nodeInfo = nodeMap.find(n => index >= n.startPos && index < n.endPos);
			results.push({
				index: results.length,
				position: index,
				context: context,
				match: plainText.substring(index, index + searchTerm.length),
				node: nodeInfo?.node || null,
				nodeOffset: nodeInfo ? index - nodeInfo.startPos : 0,
			});
			index += searchTerm.length;
		}
		setCaseSearchResults(results);
		if (results.length > 0) {
			setCaseHighlightedIndex(0);
		}
	};

	const scrollToCaseSearchResult = (resultIndex) => {
		if (resultIndex < 0 || resultIndex >= caseSearchResults.length) return;
		setCaseHighlightedIndex(resultIndex);
		const result = caseSearchResults[resultIndex];
		setTimeout(() => {
			if (!caseMarkdownContentRef.current) return;
			if (result.node) {
				try {
					const range = document.createRange();
					const offset = result.nodeOffset || 0;
					const matchLength = result.match.length;
					const maxOffset = result.node.textContent.length;
					const safeOffset = Math.min(Math.max(0, offset), maxOffset);
					const safeEnd = Math.min(safeOffset + matchLength, maxOffset);
					if (safeOffset >= maxOffset) return;
					range.setStart(result.node, safeOffset);
					range.setEnd(result.node, safeEnd);
					let elementToScroll = range.startContainer.parentElement;
					while (elementToScroll && elementToScroll !== caseMarkdownContentRef.current) {
						const tagName = elementToScroll.tagName?.toLowerCase();
						if (['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'].includes(tagName)) {
							if (tagName !== 'span' || elementToScroll.textContent.length > 50) {
								break;
							}
						}
						elementToScroll = elementToScroll.parentElement;
					}
					if (elementToScroll) {
						elementToScroll.scrollIntoView({
							behavior: 'smooth',
							block: 'center',
							inline: 'nearest',
						});
						const parent = range.startContainer.parentElement;
						if (parent) {
							caseMarkdownContentRef.current.querySelectorAll('.search-highlight-temp').forEach(el => {
								el.classList.remove('search-highlight-temp');
								el.style.backgroundColor = '';
								el.style.borderRadius = '';
								el.style.padding = '';
							});
							parent.classList.add('search-highlight-temp');
							parent.style.backgroundColor = '#ffd700';
							parent.style.transition = 'background-color 0.3s';
							parent.style.borderRadius = '4px';
							parent.style.padding = '2px 4px';
							setTimeout(() => {
								if (parent.classList) {
									parent.classList.remove('search-highlight-temp');
								}
								parent.style.backgroundColor = '';
								parent.style.borderRadius = '';
								parent.style.padding = '';
							}, 2000);
						}
					}
				} catch (e) {
					console.error('Error scrolling to search result:', e);
				}
			} else {
				if (caseMarkdownContentRef.current) {
					const walker = document.createTreeWalker(
						caseMarkdownContentRef.current,
						NodeFilter.SHOW_TEXT,
						null,
					);
					let node;
					let charCount = 0;
					while (node = walker.nextNode()) {
						const nodeText = node.textContent;
						const nodeLength = nodeText.length;
						if (charCount + nodeLength >= result.position) {
							const offset = result.position - charCount;
							try {
								const range = document.createRange();
								range.setStart(node, Math.min(offset, nodeLength));
								range.setEnd(node, Math.min(offset + result.match.length, nodeLength));
								node.parentElement?.scrollIntoView({
									behavior: 'smooth',
									block: 'center',
								});
							} catch (e) {
								node.parentElement?.scrollIntoView({
									behavior: 'smooth',
									block: 'center',
								});
							}
							break;
						}
						charCount += nodeLength;
					}
				}
			}
		}, 100);
	};

	const navigateCaseSearchResult = (direction) => {
		if (caseSearchResults.length === 0) return;
		let newIndex = caseHighlightedIndex + direction;
		if (newIndex < 0) {
			newIndex = caseSearchResults.length - 1;
		} else if (newIndex >= caseSearchResults.length) {
			newIndex = 0;
		}
		scrollToCaseSearchResult(newIndex);
	};

	// Drag handlers for case search results panel
	const handleCaseMouseDown = (e) => {
		if (!casePanelRef.current) return;
		const rect = casePanelRef.current.getBoundingClientRect();
		setCaseDragOffset({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		});
		setCaseIsDragging(true);
		e.preventDefault();
		e.stopPropagation();
	};

	useEffect(() => {
		if (!caseIsDragging) return;
		let animationFrameId = null;
		const maxX = window.innerWidth - 350;
		const maxY = window.innerHeight - 100;
		const handleMouseMove = (e) => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			animationFrameId = requestAnimationFrame(() => {
				const newX = e.clientX - caseDragOffset.x;
				const newY = e.clientY - caseDragOffset.y;
				setCasePanelPosition({
					x: Math.max(0, Math.min(newX, maxX)),
					y: Math.max(0, Math.min(newY, maxY)),
				});
			});
		};
		const handleMouseUp = () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			setCaseIsDragging(false);
		};
		document.addEventListener('mousemove', handleMouseMove, { passive: true });
		document.addEventListener('mouseup', handleMouseUp);
		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [caseIsDragging, caseDragOffset]);

	// Render TOC Sidebar for case
	const renderCaseTOCSidebar = (item) => {
		if (headings.length === 0) return null;
		return (
			<div className={`${newsTabStyles.tocSidebar} ${newsTabStyles.show}`}>
				<div className={newsTabStyles.tocSidebarHeader}>
					<h4>Mục lục</h4>
				</div>
				<div className={newsTabStyles.tocSidebarList}>
					{headings.map((heading, index) => (
						<div
							key={index}
							className={`${newsTabStyles.tocSidebarItem} ${newsTabStyles[`tocSidebarLevel${heading.level}`]} ${activeHeadingIndex === index ? newsTabStyles.tocSidebarItemActive : ''}`}
							onClick={() => scrollToHeading(index, caseMarkdownContentRef.current)}
							title={`Cuộn đến: ${heading.text}`}
						>
							{heading.text}
						</div>
					))}
				</div>
			</div>
		);
	};



	// Handle case modal search text change
	useEffect(() => {
		if (caseModalItem && caseModalItem.detail && caseModalSearchText.trim()) {
			setTimeout(() => {
				if (caseMarkdownContentRef.current) {
					performCaseSearchInRenderedContent(caseModalSearchText);
				} else {
					performCaseSearch(caseModalSearchText, caseModalItem);
				}
			}, 100);
		} else {
			setCaseSearchResults([]);
			setCaseHighlightedIndex(-1);
		}
	}, [caseModalSearchText, caseModalItem?.id]);

	// Auto show panel when case search results appear
	useEffect(() => {
		if (caseSearchResults.length > 0) {
			setCaseShowSearchResultsPanel(true);
		}
	}, [caseSearchResults.length]);

	// Reset search when modal closes
	useEffect(() => {
		if (!isModalVisible && !theoryModalVisible && !caseModalVisible) {
			setModalSearchText('');
			setSearchResults([]);
			setHighlightedIndex(-1);
			setShowSearchResultsPanel(false);
			setPanelPosition({ x: 10, y: 50 });
			setShowSummaryDetail(false);
		}
		if (!caseModalVisible) {
			setCaseModalSearchText('');
			setCaseSearchResults([]);
			setCaseHighlightedIndex(-1);
			setCaseShowSearchResultsPanel(false);
			setCasePanelPosition({ x: 10, y: 50 });
		}
	}, [isModalVisible, theoryModalVisible, caseModalVisible]);

	// Modal resizer logic
	useEffect(() => {
		if (!modalIsDraggingResizer) return;

		const handleMouseMove = (e) => {
			const containerWidth = window.innerWidth;
			const newRatio = Math.max(0.1, Math.min(0.9, e.clientX / containerWidth));

			if (theoryModalVisible) {
				// Sidebar on left, min width 200px, Content on right, min width 500px
				const sidebarWidth = e.clientX;
				const contentWidth = containerWidth - e.clientX;
				if (sidebarWidth >= 200 && contentWidth >= 500) {
					setTheoryModalSplitRatio(newRatio);
				}
			} else if (isModalVisible) {
				// Same for Wiki
				const sidebarWidth = e.clientX;
				const contentWidth = containerWidth - e.clientX;
				if (sidebarWidth >= 200 && contentWidth >= 500) {
					setWikiModalSplitRatio(newRatio);
				}
			} else if (caseModalVisible) {
				// Lesson on left, Quiz on right. Lesson min 400px, Quiz min 350px
				const lessonWidth = e.clientX;
				const quizWidth = containerWidth - e.clientX;
				if (lessonWidth >= 400 && quizWidth >= 350) {
					setCaseModalSplitRatio(newRatio);
				}
			}
		};

		const handleMouseUp = () => {
			setModalIsDraggingResizer(false);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [modalIsDraggingResizer, theoryModalVisible, isModalVisible, caseModalVisible]);

	// Check if user has access to the item
	const hasAccess = (item) => {
		if (!item) return false;
		if (currentUser?.isAdmin) return true;
		if (item.isPublic === true) return true;
		if (item.isPublic === false) {
			const isTrialAccount = currentUser?.account_type === 'Dùng thử';
			if (isTrialAccount) return false;
			return true;
		}
		return false;
	};

	// Handle toggle read status
	const handleToggleRead = async (item) => {
		try {
			const itemId = item.id;
			const currentReadItems = readItems || [];
			const isCurrentlyRead = currentReadItems.includes(itemId);

			let newReadItems;
			if (isCurrentlyRead) {
				// Mark as unread
				newReadItems = currentReadItems.filter(id => id !== itemId);
			} else {
				// Mark as read
				newReadItems = [...currentReadItems, itemId];
			}

			setReadItems(newReadItems);

			// Update user info in database
			const user = (await getCurrentUserLogin()).data;

			if (user && user.id) {
				await updateUser(user.id, {
					info: {
						...user.info,
						read_items_stream: newReadItems,
					},
				});
			}
		} catch (error) {
			console.error('Error toggling read status:', error);
			// Revert state if update fails
			setReadItems(readItems || []);
		}
	};

	// Handle toggle bookmark status
	const handleToggleBookmark = async (item) => {
		try {
			const itemId = item.id;
			const isCurrentlyBookmarked = bookmarkedItems.includes(itemId);

			let newBookmarkedItems;
			if (isCurrentlyBookmarked) {
				// Remove from bookmarks
				newBookmarkedItems = bookmarkedItems.filter(id => id !== itemId);
			} else {
				// Add to bookmarks
				newBookmarkedItems = [...bookmarkedItems, itemId];
			}

			setBookmarkedItems(newBookmarkedItems);

			// Update user info in database
			const user = (await getCurrentUserLogin()).data;

			if (user && user.id) {
				await updateUser(user.id, {
					info: {
						...user.info,
						bookmarks_stream: newBookmarkedItems,
					},
				});
			}
		} catch (error) {
			console.error('Error toggling bookmark:', error);
			// Revert state if update fails
			setBookmarkedItems(bookmarkedItems);
		}
	};

	// Render Sidebar Content for PC Modal (similar to NewsTab)
	const renderArticleSidebarContent = (item) => {
		if (!item) return null;

		return (
			<div className={`${newsTabStyles.articleSidebar} ${newsTabStyles.sidebarPC}`}>
				{/* Row 1: ID, Share, Rating */}
				<div className={newsTabStyles.sidebarRow1}>
					<span>ID: {item.id}</span>
					<div
						onClick={() => onShare(item)}
						className={newsTabStyles.sidebarActionItem}
					>
						<ShareAltOutlined /> Chia sẻ
					</div>
					<div
						onClick={() => {
							setRatingPopupItem(item);
							setRatingPopupVisible(true);
						}}
						className={newsTabStyles.sidebarActionItem}
					>
						<StarOutlined style={{ color: '#faad14' }} /> {item.scoreFeedback != null ? (
							<span style={{ fontWeight: '500' }}>
								{Number(item.scoreFeedback || 0).toFixed(2)}
							</span>
						) : (
							"Đánh giá"
						)}
					</div>
				</div>

				{/* Summary Section */}
				{item.summary && (
					<div className={newsTabStyles.sidebarShortformSection}>
						<div
							className={newsTabStyles.sidebarSummaryText}
							dangerouslySetInnerHTML={{
								__html: (() => {
									const { processedText, latexBlocks = [] } = preprocessLatex(item.summary || '');
									let html = marked.parse(processedText);
									const finalHtml = postprocessLatex(html, latexBlocks);
									return DOMPurify.sanitize(finalHtml);
								})(),
							}}
						/>
					</div>
				)}

				{/* Metadata Line: Date & Module */}
				<div className={newsTabStyles.sidebarMetadataRow}>
					{(item.updatedAt || item.createdAt) && (
						<span className={newsTabStyles.sidebarMetadataDate}>
							<ClockCircleOutlined />
							{formatDateFromTimestamp(item.updatedAt || item.createdAt)}
						</span>
					)}
					{item.tag4 && Array.isArray(item.tag4) && item.tag4.length > 0 && (
						<div className={newsTabStyles.sidebarRelatedModuleWrapper}>
							<Tooltip title={`Related module: ${item.tag4.join(', ')}`} mouseEnterDelay={0.5}>
								<div className={newsTabStyles.sidebarRelatedModuleText}>
									Related module: {item.tag4.join(', ')}
								</div>
							</Tooltip>
						</div>
					)}
				</div>

				{/* Divider */}
				<div className={newsTabStyles.sidebarDividerLine} />

				{/* Quiz Section (Related Case Training) */}
				{relatedCaseTrainingItems.length > 0 && (
					<div style={{ marginTop: '20px' }}>
						<div className={newsTabStyles.quizSectionHeader}>
							Các bài kiểm tra liên quan ({relatedCaseTrainingItems.length})
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
							{relatedCaseTrainingItems.map((quizItem) => {
								const quizScore = relatedQuizScores[quizItem.id];
								const hasScore = quizScore !== undefined && quizScore !== null;
								const pass = hasScore && Number(quizScore) >= 70;

								return (
									<div
										key={quizItem.id}
										className={newsTabStyles.quizItemCard}
										onClick={() => {
											const url = new URL(`${window.location.origin}/home`);
											url.searchParams.set('tab', 'caseTraining');
											url.searchParams.set('item', quizItem.id);
											window.open(url.toString(), '_blank');
										}}
									>
										{(quizItem.avatarUrl || quizItem.image || quizItem.coverImage) && (
											<div className={newsTabStyles.quizItemThumbnail}>
												<Image
													src={quizItem.avatarUrl || quizItem.image || quizItem.coverImage}
													alt={quizItem.title}
													width={95}
													height={70}
													className={newsTabStyles.quizItemImage}
													preview={false}
												/>
											</div>
										)}
										<div className={newsTabStyles.quizItemContent}>
											<div className={newsTabStyles.quizItemTitle}>{quizItem.title}</div>
											{quizItem.summary && (
												<div className={newsTabStyles.quizItemSummaryText}>
													{quizItem.summary}
												</div>
											)}
											<div className={newsTabStyles.quizItemMetaRow}>
												<span className={newsTabStyles.quizItemID}>ID: {quizItem.id}</span>
												{hasScore ? (
													<span className={`${newsTabStyles.quizStatusBadge} ${pass ? newsTabStyles.quizStatusPass : newsTabStyles.quizStatusOther}`}>
														{quizScore}/100
													</span>
												) : (
													<span className={`${newsTabStyles.quizStatusBadge} ${newsTabStyles.quizStatusFail}`}>
														Chưa làm
													</span>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>
		);
	};

	// Render skeleton
	const renderSkeleton = () => (
		<div className={`${k9Styles.contentPanel} ${newsTabStyles.contentPanel}`}>
			<div className={`${k9Styles.contentHeader} ${newsTabStyles.contentHeader}`}>
				<div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`}
					style={{ width: '70%' }}></div>
				<div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`}
					style={{ width: '20%' }}></div>
			</div>
			<div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonImage}`}></div>
			<div className={`${k9Styles.contentBody} ${newsTabStyles.contentBody}`}>
				<div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`}></div>
				<div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`}></div>
				<div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`}
					style={{ width: '80%' }}></div>
			</div>
		</div>
	);

	// Render content panel using ContentPanel component
	const renderContentPanel = (item) => {
		if (!item) return null;

		const contentPanelProps = {
			item,
			currentUser,
			isMobile: false,
			isAnimating,
			showSummaryDetail,
			selectedDetailImageIndex: selectedDetailImageIndex[item?.id] || 0,
			searchText: modalSearchText,
			activeTab: selectedLongFormItem ? 'longForm' : 'stream',
			viewMode: 'list',
			quizPopoverVisible: false,
			contentPanelRef,
			markdownContentRef,
			hasAccess,
			renderSkeleton,
			highlightTextInContent,
			getFileIcon,
			openFilePreview,
			handleEditClick: () => handleEditClick(item),
			relatedCaseTrainingItems: relatedCaseTrainingItems,
			relatedQuizScores: relatedQuizScores,
			onShare: onShare,
			setShowSummaryDetail,
			setSelectedDetailImageIndex: (index) => setSelectedDetailImageIndex(prev => ({
				...prev,
				[item.id]: index,
			})),
			setShowFeedbackModal,
			setQuizPopoverVisible: () => {
			},
			setIsPackageModalOpen,
			setQuestionScoreMap: (qid, score) => setQuizScores(prev => ({ ...prev, [qid]: score })),
			preprocessLatex,
			postprocessLatex,
			isRead: (readItems || []).includes(item?.id),
			onToggleRead: handleToggleRead,
			hideHeaderMeta: true,
		};

		return <ContentPanel {...contentPanelProps} />;
	};

	// Render Case content panel using CaseTrainingContentPanel component
	const renderCaseContentPanel = (item,) => {
		if (!item) return null;

		const caseTrainingContentPanelProps = {
			item,
			currentUser,
			isMobile: false,
			isAnimating,
			showSummaryDetail,
			selectedDetailImageIndex: selectedDetailImageIndex[item?.id] || 0,
			searchText: caseModalSearchText,
			cidSourceInfo,
			selectedItem: selectedCaseItem,
			contentPanelRef,
			markdownContentRef: caseMarkdownContentRef,
			hasAccess,
			renderSkeleton,
			highlightTextInContent,
			getFileIcon,
			openFilePreview,
			handleEditClick: () => handleEditClick(item),
			handleCidSourceInfoClick,
			onShare: onShare,
			setShowSummaryDetail,
			setSelectedDetailImageIndex: (index) => setSelectedDetailImageIndex(prev => ({
				...prev,
				[item.id]: index,
			})),
			setShowFeedbackModal,
			setIsPackageModalOpen,
			setQuizScores: (qid, score) => setQuizScores(prev => ({ ...prev, [qid]: score })),
			preprocessLatex,
			postprocessLatex,
			activeTab: 'caseTraining',
			hideHeaderMeta: true,
			hideEdit: true,
			hideQuiz: true,
		};

		return <CaseTrainingContentPanel {...caseTrainingContentPanelProps} />;
	};

	return (
		<div className={styles.mapViewContainer}>
			{/* Top Bar Section with Tag5 Filter and Progress */}
			<div className={styles.mapViewContent}>
				<div className={styles.progressSection}>
					{/* Top Row: Program Name, Stats and Progress Bar */}
					<div className={styles.progressHeader}>
						<div className={styles.programName}>{programName}</div>
						<div className={styles.progressStats}>
							<span>{headerStats.completedQuizzes}/{headerStats.totalQuizzes} bài đã làm</span>
							<span className={styles.completionRate}>{completionRate}% hoàn thành</span>
						</div>
						<div className={styles.progressBarContainer}>
							<div
								className={styles.progressBar}
								style={{
									width: `${completionRate}%`,
									backgroundColor: completionRate === 100 ? '#52c41a' :
										completionRate >= 50 ? '#1890ff' :
											completionRate > 0 ? '#faad14' : '#d9d9d9',
								}}
							/>
						</div>
					</div>

					{/* Bottom Row: Tag5 Filter */}
					{allTag5Options.length > 0 && (
						<div className={styles.tag5FilterSection}>
							<div className={styles.tag5FilterHeader}>
								<span className={styles.tag5FilterTitle}>Tags</span>
								{selectedTag5.length > 0 && (
									<Button
										type='default'
										size='small'
										onClick={() => setSelectedTag5([])}
										className={styles.tag5FilterClearBtn}
										icon={<ClearOutlined />}
									>
										Bỏ lọc
									</Button>
								)}
							</div>
							{/* Hidden container to measure all items */}
							<div
								className={styles.tag5FilterListHidden}
								ref={hiddenTagListRef}
								style={{
									position: 'absolute',
									visibility: 'hidden',
									width: tagListRef.current?.offsetWidth || '100%',
								}}
							>
								{allTag5Options.map(tag5Value => {
									const progress = tag5Progress[tag5Value] || {
										total: 0,
										completed: 0,
										completionRate: 0,
									};
									const isSelected = selectedTag5.includes(tag5Value);
									const getProgressColor = () => {
										if (progress.completionRate === 100) return '#52c41a';
										if (progress.completionRate >= 50) return '#1890ff';
										if (progress.completionRate > 0) return '#faad14';
										return '#d9d9d9';
									};
									return (
										<div
											key={tag5Value}
											className={`${styles.tag5FilterItem} ${isSelected ? styles.tag5FilterItemActive : ''}`}
										>
											<Tag color={isSelected ? 'processing' : 'default'}
												className={styles.tag5FilterTag}>
												{tag5Value}
											</Tag>
											<div className={styles.tag5FilterProgressWrapper}>
												<div className={styles.tag5FilterProgressBar}>
													<div
														className={styles.tag5FilterProgressFill}
														style={{
															width: `${progress.completionRate}%`,
															backgroundColor: getProgressColor(),
														}}
													/>
												</div>
												<span
													className={styles.tag5FilterPercent}>{progress.completionRate}%</span>
											</div>
										</div>
									);
								})}
							</div>
							<div className={styles.tag5FilterList} ref={tagListRef}>
								{allTag5Options.slice(0, visibleTagCount).map(tag5Value => {
									const progress = tag5Progress[tag5Value] || {
										total: 0,
										completed: 0,
										completionRate: 0,
									};
									const isSelected = selectedTag5.includes(tag5Value);
									const getProgressColor = () => {
										if (progress.completionRate === 100) return '#52c41a';
										if (progress.completionRate >= 50) return '#1890ff';
										if (progress.completionRate > 0) return '#faad14';
										return '#d9d9d9';
									};
									return (
										<div
											key={tag5Value}
											className={`${styles.tag5FilterItem} ${isSelected ? styles.tag5FilterItemActive : ''}`}
											onClick={() => setSelectedTag5(isSelected ? [] : [tag5Value])}
											title={`${tag5Value}: ${progress.completed}/${progress.total} bài (${progress.completionRate}%)`}
										>
											<Tag color={isSelected ? 'processing' : 'default'}
												className={styles.tag5FilterTag}>
												{tag5Value}
											</Tag>
											<div className={styles.tag5FilterProgressWrapper}>
												<div className={styles.tag5FilterProgressBar}>
													<div
														className={styles.tag5FilterProgressFill}
														style={{
															width: `${progress.completionRate}%`,
															backgroundColor: getProgressColor(),
														}}
													/>
												</div>
												<span
													className={styles.tag5FilterPercent}>{progress.completionRate}%</span>
											</div>
										</div>
									);
								})}
								{visibleTagCount < allTag5Options.length && (() => {
									const remainingTags = allTag5Options.slice(visibleTagCount);
									const menuItems = remainingTags.map(tag5Value => {
										const progress = tag5Progress[tag5Value] || {
											total: 0,
											completed: 0,
											completionRate: 0,
										};
										const isSelected = selectedTag5.includes(tag5Value);
										const getProgressColor = () => {
											if (progress.completionRate === 100) return '#52c41a';
											if (progress.completionRate >= 50) return '#1890ff';
											if (progress.completionRate > 0) return '#faad14';
											return '#d9d9d9';
										};
										return {
											key: tag5Value,
											label: (
												<div
													className={`${styles.tag5FilterDropdownItem} ${isSelected ? styles.tag5FilterDropdownItemActive : ''}`}
													onClick={(e) => {
														e.stopPropagation();
														setSelectedTag5(isSelected ? [] : [tag5Value]);
													}}
												>
													<Tag color={isSelected ? 'processing' : 'default'}
														className={styles.tag5FilterTag}>
														{tag5Value}
													</Tag>
													<div className={styles.tag5FilterProgressWrapper}>
														<div className={styles.tag5FilterProgressBar}>
															<div
																className={styles.tag5FilterProgressFill}
																style={{
																	width: `${progress.completionRate}%`,
																	backgroundColor: getProgressColor(),
																}}
															/>
														</div>
														<span
															className={styles.tag5FilterPercent}>{progress.completionRate}%</span>
													</div>
												</div>
											),
										};
									});
									return (
										<Dropdown
											menu={{ items: menuItems }}
											trigger={['click']}
											placement='bottomLeft'
										>
											<Button
												type='default'
												icon={<MoreOutlined />}
												className={styles.tag5FilterMoreBtn}
												onClick={(e) => e.stopPropagation()}
											>
												+{allTag5Options.length - visibleTagCount}
											</Button>
										</Dropdown>
									);
								})()}
							</div>
						</div>
					)}
				</div>

				{/* Two Panel Layout */}
				<div className={styles.panelsContainer}>
					{/* Left Panel - 70% */}
					<div className={styles.leftPanel} ref={panel1ContainerRef} style={{ position: 'relative' }}>
						<div className={styles.panel1Columns}>
							{/* Theory Column */}
							<div className={styles.panel1Column} ref={theoryContainerRef}>
								<div className={styles.rightPanelHeader}>
									<div className={styles.rightPanelTitle}>
										Lý thuyết ({filteredTheoryItems.length})
									</div>
									<div style={{ display: 'flex', alignItems: 'center' }}>
										<Input
											placeholder='Tìm kiếm...'
											prefix={<SearchOutlined />}
											value={theorySearchText}
											onChange={(e) => setTheorySearchText(e.target.value)}
											allowClear
											size='small'
											className={styles.rightPanelSearch}
										/>
										{renderFilterPopover(theoryFilters, setTheoryFilters, theoryBaseFilteredList, 'theory')}
									</div>
								</div>
								<div className={styles.panelContent}>
									<div className={styles.itemsList}>
										{filteredTheoryItems.length === 0 ? (
											<div className={styles.emptyState}>
												Không có dữ liệu
											</div>
										) : (
											filteredTheoryItems.map((item) => (
												<div
													key={item.id}
													ref={(el) => {
														theoryItemRefs.current[item.id] = el;
														panel1ItemRefs.current[item.id] = el;
													}}
													onClick={async () => {
														setSelectedTheoryItem(item);
														setSelectedCaseItem(null);
														setRelatedCaseTrainingItems([]);
														setRelatedQuizScores({});
														await fetchRelatedCaseTrainingItems(item.cid);

													}}
													className={`${styles.itemCard} ${selectedTheoryItem?.id === item.id ? styles.itemCardSelected : ''}`}
													data-item-id={item.id}
												>
													{item.avatarUrl && (
														<Image
															src={item.avatarUrl}
															alt={item.title}
															width={80}
															height={80}
															className={styles.itemCardAvatar}
															preview={false}
														/>
													)}
													<div className={styles.itemCardContent}>
														<div style={{
															display: 'flex',
															alignItems: 'flex-start',
															justifyContent: 'space-between',
															gap: '8px',
														}}>
															<div className={styles.itemCardTitleFlexWrap}
																style={{ flex: 1 }}>
																{currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
																	<span style={{
																		marginRight: '6px',
																		fontSize: '14px',
																		verticalAlign: 'middle',
																	}}>🔒</span>
																)}
																{item.title}
															</div>
															<Button
																type='text'
																icon={<Icon_View_Modal width={16} height={16} />}
																size='small'
																onClick={
																	(e) => {
																		e.stopPropagation();
																		handleTheoryItemIconClick(item, e);
																	}
																}
																style={{
																	flexShrink: 0,
																	color: '#1890ff',
																	padding: '4px',
																}}
																title='Xem chi tiết'
															/>
														</div>
														{/* Row 2: ID, Lesson Number, CID, Tag5 and Quiz Status Row */}
														<div className={styles.itemCardMeta}>
															<div style={{
																display: 'flex',
																alignItems: 'center',
																gap: '8px',
																flexWrap: 'wrap',
															}}>
																{item.lessonNumber && (
																	<span className={styles.itemCardId}
																		style={{ color: '#1890ff' }}>
																		{item.lessonNumber}
																	</span>
																)}
																{item.lessonNumber && item.cid &&
																	<span style={{ color: '#8c8c8c' }}>|</span>}
																{item.cid && (
																	<span className={styles.itemCardId}>
																		CID: {item.cid}
																	</span>
																)}
																{(item.lessonNumber || item.cid) && item.id &&
																	<span style={{ color: '#8c8c8c' }}>|</span>}
																<span className={styles.itemCardId}>
																	ID: {item.id}
																</span>
																{renderQuizStatusBadge(item)}

																{item.tag5 && (
																	<Tag color='green'>
																		{Array.isArray(item.tag5) ? item.tag5.join(', ') : item.tag5}
																	</Tag>
																)}
															</div>
														</div>
														{/* Row 3: Action Icons (Read/Bookmark only) */}
														<div style={{ display: 'flex', marginTop: '8px', gap: '4px', justifyContent: 'flex-end' }}>
															<Button
																type='text'
																icon={readItems.includes(item.id) ? <DoneRead_Icon width={16} height={16} /> : <NotDoneRead_Icon width={16} height={16} />}
																size='small'
																onClick={(e) => {
																	e.stopPropagation();
																	handleToggleRead(item);
																}}
																title={readItems.includes(item.id) ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
																style={{ flexShrink: 0, padding: '4px' }}
															/>
															<Button
																type='text'
																icon={bookmarkedItems.includes(item.id) ? <BookMark_Icon_On width={16} height={16} /> : <BookMark_Icon_Off width={16} height={16} />}
																size='small'
																onClick={(e) => {
																	e.stopPropagation();
																	handleToggleBookmark(item);
																}}
																title={bookmarkedItems.includes(item.id) ? 'Bỏ bookmark' : 'Thêm bookmark'}
																style={{ flexShrink: 0, padding: '4px' }}
															/>
														</div>
													</div>
												</div>
											))
										)}
									</div>
								</div>
							</div>

							{/* Case Column */}
							<div className={styles.panel1Column} ref={caseContainerRef}>
								<div className={styles.rightPanelHeader}>
									<div className={styles.rightPanelTitle}>
										Case Study ({filteredCaseItems.length})
									</div>
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										<Input
											placeholder='Tìm kiếm...'
											prefix={<SearchOutlined />}
											value={caseSearchText}
											onChange={(e) => setCaseSearchText(e.target.value)}
											allowClear
											size='small'
											className={styles.rightPanelSearch}
										/>
										{renderFilterPopover(caseFilters, setCaseFilters, caseBaseFilteredList, 'case')}
										<div style={{
											display: 'flex',
											alignItems: 'center',
											gap: '4px',
											fontSize: '12px',
											whiteSpace: 'nowrap',
										}}>
											<span>Auto-Arrange</span>
											<Switch
												size='small'
												checked={caseSortByConnection}
												onChange={setCaseSortByConnection}
											/>
										</div>
									</div>
								</div>
								<div className={styles.panelContent}>
									<div className={styles.itemsList}>
										{filteredCaseItems.length === 0 ? (
											<div className={styles.emptyState}>
												Không có dữ liệu
											</div>
										) : (
											filteredCaseItems.map((item) => {
												// Check if this case item should be highlighted (has same CID as selected theory item)
												const isHighlighted = selectedTheoryItem?.cid && item.cid === selectedTheoryItem.cid && selectedCaseItem?.id !== item.id;

												return (
													<div
														key={item.id}
														ref={(el) => {
															caseItemRefs.current[item.id] = el;
															panel1ItemRefs.current[item.id] = el;
														}}
														onClick={() => handleCaseItemClick(item)}
														className={`${styles.itemCard} ${selectedCaseItem?.id === item.id ? styles.itemCardSelected : ''} ${isHighlighted ? styles.itemCardHighlighted : ''}`}
														data-item-id={item.id}
													>
														{item.avatarUrl && (
															<Image
																src={item.avatarUrl}
																alt={item.title}
																width={80}
																height={80}
																className={styles.itemCardAvatar}
																preview={false}
															/>
														)}
														<div className={styles.itemCardContent}>
															<div style={{
																display: 'flex',
																alignItems: 'flex-start',
																justifyContent: 'space-between',
																gap: '8px',
															}}>
																<div className={styles.itemCardTitleFlexWrap}
																	style={{ flex: 1 }}>
																	{currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
																		<span style={{
																			marginRight: '6px',
																			fontSize: '14px',
																			verticalAlign: 'middle',
																		}}>🔒</span>
																	)}
																	{item.title}
																</div>

															</div>
															{/* Row 2: ID, Lesson Number, CID, Tag5 and Quiz Status Row */}
															<div className={styles.itemCardMeta}>
																<div style={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: '8px',
																	flexWrap: 'wrap',
																}}>
																	{item.lessonNumber && (
																		<span className={styles.itemCardId}
																			style={{ color: '#1890ff' }}>
																			{item.lessonNumber}
																		</span>
																	)}
																	{item.lessonNumber && item.cid &&
																		<span style={{ color: '#8c8c8c' }}>|</span>}
																	{item.cid && (
																		<span className={styles.itemCardId}>
																			CID: {item.cid}
																		</span>
																	)}
																	{(item.lessonNumber || item.cid) && item.id &&
																		<span style={{ color: '#8c8c8c' }}>|</span>}
																	<span className={styles.itemCardId}>
																		ID: {item.id}
																	</span>
																	{renderQuizStatusBadge(item)}
																	{item.tag5 && (
																		<Tag color='green'>
																			{Array.isArray(item.tag5) ? item.tag5.join(', ') : item.tag5}
																		</Tag>
																	)}
																</div>
															</div>
														</div>
													</div>
												);
											})
										)}
									</div>
								</div>
							</div>
						</div>
						{/* Connection Lines - Only from Theory to Case */}
						{selectedTheoryItem && selectedTheoryItem.cid && (
							<MapViewConnectionLines
								selectedItemId={selectedTheoryItem.id}
								allItems={allPanel1Items} // Pass all items for refs
								containerRef={panel1ContainerRef}
								itemRefs={panel1ItemRefs}
								visibleItemIds={[...filteredTheoryItems.map(item => item.id), ...filteredCaseItems.map(item => item.id)]}
								sourceType='theory'
								targetType='case'
								theoryItems={filteredTheoryItems}
								caseItems={filteredCaseItems}
							/>
						)}
					</div>

					{/* Right Panel - 30% */}
					<div className={styles.rightPanel}>
						<div className={styles.rightPanelHeader}>
							<div className={styles.rightPanelTitle}>
								Business Wiki ({filteredLongFormItems.length})
							</div>
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<Input
									placeholder='Tìm kiếm...'
									prefix={<SearchOutlined />}
									value={searchText}
									onChange={(e) => setSearchText(e.target.value)}
									allowClear
									size='small'
									className={styles.rightPanelSearch}
								/>
								{renderFilterPopover(wikiFilters, setWikiFilters, wikiBaseFilteredList, 'wiki')}
							</div>
						</div>
						<div className={styles.panelContent}>
							<div className={styles.itemsList}>
								{visibleItems.length === 0 ? (
									<div className={styles.emptyState}>
										Không có dữ liệu
									</div>
								) : (
									visibleItems.map((item, index) => (
										<div
											key={item.id}
											ref={index === visibleItems.length - 1 ? lastItemRef : null}
											onClick={() => handleLongFormItemClick(item)}
											className={styles.itemCard}
										>
											{item.avatarUrl && (
												<Image
													src={item.avatarUrl}
													alt={item.title}
													width={80}
													height={80}
													className={styles.itemCardAvatar}
													preview={false}
												/>
											)}
											<div className={styles.itemCardContent}>
												<div className={styles.itemCardTitleFlexWrap}>
													{currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
														<span style={{
															marginRight: '6px',
															fontSize: '14px',
															verticalAlign: 'middle',
														}}>🔒</span>
													)}
													{item.title}
												</div>
												{item.summary && (
													<div className={styles.itemCardSummary}>
														{item.summary}
													</div>
												)}
												{/* Row 2: Metadata and Action Icons on the same line */}
												<div className={styles.itemCardMeta} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
													<div style={{
														display: 'flex',
														alignItems: 'center',
														gap: '8px',
														flexWrap: 'wrap',
													}}>
														<span className={styles.itemCardId}>
															ID: {item.id}
														</span>
														{item.id && (item.tag5 || item.category || item.questionContent !== undefined) &&
															<span style={{ color: '#8c8c8c' }}>|</span>}
														{renderQuizStatusBadge(item)}

														{item.tag5 && (
															<Tag color='green'>
																{Array.isArray(item.tag5) ? item.tag5.join(', ') : item.tag5}
															</Tag>
														)}
													</div>
													<div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
														<Button
															type='text'
															icon={readItems.includes(item.id) ? <DoneRead_Icon width={16} height={16} /> : <NotDoneRead_Icon width={16} height={16} />}
															size='small'
															onClick={(e) => {
																e.stopPropagation();
																handleToggleRead(item);
															}}
															title={readItems.includes(item.id) ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
															style={{ flexShrink: 0, padding: '4px' }}
														/>
														<Button
															type='text'
															icon={bookmarkedItems.includes(item.id) ? <BookMark_Icon_On width={16} height={16} /> : <BookMark_Icon_Off width={16} height={16} />}
															size='small'
															onClick={(e) => {
																e.stopPropagation();
																handleToggleBookmark(item);
															}}
															title={bookmarkedItems.includes(item.id) ? 'Bỏ bookmark' : 'Thêm bookmark'}
															style={{ flexShrink: 0, padding: '4px' }}
														/>
													</div>
												</div>
											</div>
										</div>
									))
								)}
								{/* Loading indicator when loading more */}
								{renderedCount < filteredLongFormItems.length && (
									<div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
										Đang tải thêm...
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Modal for Long Form Item Details */}
			<Modal
				title={
					selectedLongFormItem && (
						<div className={newsTabStyles.modalTitleContainer}>
							<div className={newsTabStyles.modalTitleMain}>
								<span className={newsTabStyles.modalTitleTabName}>Wiki</span>
								<span>/</span>
								<span className={newsTabStyles.modalTitleItemName}>
									{selectedLongFormItem.title}
								</span>
							</div>

							<div className={newsTabStyles.modalTitleActions}>
								{/* Search input in title bar */}
								<Input
									placeholder="Tìm kiếm trong nội d..."
									prefix={<SearchOutlined />}
									value={modalSearchText}
									onChange={(e) => setModalSearchText(e.target.value)}
									allowClear
									style={{ width: '200px' }}
									onPressEnter={() => {
										if (searchResults.length > 0) {
											scrollToSearchResult(highlightedIndex >= 0 ? highlightedIndex : 0);
										}
									}}
								/>

								{/* Search navigation */}
								{searchResults.length > 0 && (
									<Space size={4}>
										<Button
											size="small"
											icon={<span>↑</span>}
											onClick={() => navigateSearchResult(-1)}
											disabled={searchResults.length === 0}
										/>
										<span style={{ fontSize: '12px', color: '#666', minWidth: '45px', textAlign: 'center' }}>
											{highlightedIndex + 1}/{searchResults.length}
										</span>
										<Button
											size="small"
											icon={<span>↓</span>}
											onClick={() => navigateSearchResult(1)}
											disabled={searchResults.length === 0}
										/>
									</Space>
								)}

								{/* Read Status Checkbox */}
								<Checkbox
									checked={readItems.includes(selectedLongFormItem?.id)}
									onChange={() => handleToggleRead(selectedLongFormItem)}
									style={{ color: '#595959', fontWeight: '500' }}
								>
									Đã đọc
								</Checkbox>

								{/* Bookmark button */}
								<Tooltip title={bookmarkedItems.includes(selectedLongFormItem?.id) ? 'Bỏ bookmark' : 'Lưu vào mục quan tâm'}>
									<Button
										type="text"
										icon={bookmarkedItems.includes(selectedLongFormItem?.id) ? <BookMark_Icon_On width={18} height={18} /> : <BookMark_Icon_Off width={18} height={18} />}
										onClick={() => handleToggleBookmark(selectedLongFormItem)}
										className={newsTabStyles.modalTitleBookmark}
									>
										Bookmark
									</Button>
								</Tooltip>

								{/* Edit button in title bar */}
								{currentUser?.isAdmin && (
									<Button
										type="text"
										size="small"
										onClick={() => handleEditClick(selectedLongFormItem)}
										className={newsTabStyles.modalTitleEdit}
									>
										Edit
									</Button>
								)}
							</div>
						</div>
					)
				}
				open={isModalVisible}
				onCancel={() => {
					setIsModalVisible(false);
					setSelectedLongFormItem(null);
				}}
				footer={null}
				width={selectedLongFormItem ? 1400 : 1000}
				style={{
					top: '0px',
					paddingBottom: '0px',
				}}
				destroyOnClose={true}
				maskClosable={true}
				closable={true}
				className={newsTabStyles.modalContent}
			>
				<div className={newsTabStyles.resizablePanel}>
					{/* Left panel: Sidebar Information */}
					<div
						className={newsTabStyles.modalSidebarPanel}
						style={{
							width: selectedLongFormItem && hasAccess(selectedLongFormItem) ? `${wikiModalSplitRatio * 100}%` : '0%',
							minWidth: selectedLongFormItem && hasAccess(selectedLongFormItem) ? '200px' : '0',
							padding: '24px',
							overflowY: 'auto',
							backgroundColor: '#fff',
							display: selectedLongFormItem && hasAccess(selectedLongFormItem) ? 'block' : 'none',
						}}
					>
						{renderArticleSidebarContent(selectedLongFormItem)}
						{/* TOC Section */}
						{selectedLongFormItem && hasAccess(selectedLongFormItem) && (
							<div style={{ height: 'auto' }}>
								{renderTOCSidebar(selectedLongFormItem)}
							</div>
						)}
					</div>

					{/* Resizer */}
					{selectedLongFormItem && hasAccess(selectedLongFormItem) && (
						<div
							className={`${newsTabStyles.resizer} ${modalIsDraggingResizer ? newsTabStyles.resizerActive : ''}`}
							onMouseDown={(e) => {
								setModalIsDraggingResizer(true);
								setModalResizeStartRatio(wikiModalSplitRatio);
								e.preventDefault();
							}}
							style={{ marginLeft: '10px' }}
						/>
					)}

					{/* Right panel: Article Content */}
					<div
						className={newsTabStyles.modalContentPanel}
						style={{
							width: selectedLongFormItem && hasAccess(selectedLongFormItem) ? `${(1 - wikiModalSplitRatio) * 100}%` : '100%',
							minWidth: selectedLongFormItem && hasAccess(selectedLongFormItem) ? '500px' : 'none',
							padding: '24px',
						}}
					>
						{modalLoading ? (
							<div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
						) : (
							renderContentPanel(selectedLongFormItem ? { ...selectedLongFormItem, hideHeaderMeta: true } : null)
						)}
					</div>
				</div>

				{/* Floating Search Results Panel */}
				{searchResults.length > 0 && showSearchResultsPanel && (
					<div
						className={newsTabStyles.searchResultsPanel}
						ref={panelRef}
						style={{
							top: `${panelPosition.y}px`,
							left: `${panelPosition.x}px`,
							cursor: isDragging ? 'grabbing' : 'default'
						}}
					>
						<div
							className={newsTabStyles.searchResultsHeader}
							onMouseDown={handleMouseDown}
						>
							<div className={newsTabStyles.searchResultsTitle}>
								Kết quả tìm kiếm ({searchResults.length})
							</div>
							<Button
								type="text"
								size="small"
								icon={<CloseOutlined />}
								onClick={() => setShowSearchResultsPanel(false)}
								style={{ minWidth: 'auto', padding: '0 4px' }}
								onMouseDown={(e) => e.stopPropagation()}
							/>
						</div>
						<div className={newsTabStyles.searchResultsList}>
							<div className={newsTabStyles.searchResultsContainer}>
								{searchResults.map((result, index) => (
									<div
										key={index}
										onClick={() => scrollToSearchResult(index)}
										className={`${newsTabStyles.searchResultItem} ${highlightedIndex === index ? newsTabStyles.searchResultItemActive : ''}`}
									>
										<div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>
											Kết quả {index + 1}
										</div>
										<div
											style={{ fontSize: '13px', lineHeight: '1.4', color: '#595959' }}
											dangerouslySetInnerHTML={{
												__html: `...${result.context.replace(
													new RegExp(`(${result.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
													'<mark style="background-color: #fff3cd; padding: 2px 0; border-radius: 2px;">$1</mark>'
												)}...`
											}}
										/>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</Modal>

			{/* Theory Item Modal */}
			<Modal
				title={
					theoryModalItem && (
						<div className={newsTabStyles.modalTitleContainer}>
							<div className={newsTabStyles.modalTitleMain} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<span className={newsTabStyles.modalTitleTabName}>Lý thuyết</span>
								<span>/</span>
								<span className={newsTabStyles.modalTitleItemName}>
									{theoryModalItem.title}
								</span>
							</div>

							<div className={newsTabStyles.modalTitleActions}>
								{/* Search input in title bar */}
								<Input
									placeholder="Tìm kiếm trong nội d..."
									prefix={<SearchOutlined />}
									value={modalSearchText}
									onChange={(e) => setModalSearchText(e.target.value)}
									allowClear
									style={{ width: '200px' }}
									onPressEnter={() => {
										if (searchResults.length > 0) {
											scrollToSearchResult(highlightedIndex >= 0 ? highlightedIndex : 0);
										}
									}}
								/>

								{/* Search navigation */}
								{searchResults.length > 0 && (
									<Space size={4}>
										<Button
											size="small"
											icon={<span>↑</span>}
											onClick={() => navigateSearchResult(-1)}
											disabled={searchResults.length === 0}
										/>
										<span style={{ fontSize: '12px', color: '#666', minWidth: '45px', textAlign: 'center' }}>
											{highlightedIndex + 1}/{searchResults.length}
										</span>
										<Button
											size="small"
											icon={<span>↓</span>}
											onClick={() => navigateSearchResult(1)}
											disabled={searchResults.length === 0}
										/>
									</Space>
								)}

								{/* Read Status Checkbox */}
								<Checkbox
									checked={readItems.includes(theoryModalItem?.id)}
									onChange={() => handleToggleRead(theoryModalItem)}
									style={{ color: '#595959', fontWeight: '500' }}
								>
									Đã đọc
								</Checkbox>

								{/* Bookmark button */}
								<Tooltip title={bookmarkedItems.includes(theoryModalItem?.id) ? 'Bỏ bookmark' : 'Lưu vào mục quan tâm'}>
									<Button
										type="text"
										icon={bookmarkedItems.includes(theoryModalItem?.id) ? <BookMark_Icon_On width={18} height={18} /> : <BookMark_Icon_Off width={18} height={18} />}
										onClick={() => handleToggleBookmark(theoryModalItem)}
										className={newsTabStyles.modalTitleBookmark}
									>
										Bookmark
									</Button>
								</Tooltip>



								{/* Edit button in title bar */}
								{currentUser?.isAdmin && (
									<Button
										type="text"
										size="small"
										onClick={() => handleEditClick(theoryModalItem)}
										className={newsTabStyles.modalTitleEdit}
									>
										Edit
									</Button>
								)}
							</div>
						</div>
					)
				}
				open={theoryModalVisible}
				onCancel={() => {
					setTheoryModalVisible(false);
					setTheoryModalItem(null);
				}}
				footer={null}
				width={theoryModalItem ? 1400 : 1000}
				style={{
					top: '0px',
					paddingBottom: '0px',
				}}
				destroyOnClose={true}
				maskClosable={true}
				closable={true}
				className={newsTabStyles.modalContent}
			>
				<div className={newsTabStyles.resizablePanel}>
					{/* Left panel: Sidebar Information */}
					<div
						className={newsTabStyles.modalSidebarPanel}
						style={{
							width: theoryModalItem && hasAccess(theoryModalItem) ? `${theoryModalSplitRatio * 100}%` : '0%',
							minWidth: theoryModalItem && hasAccess(theoryModalItem) ? '200px' : '0',
							padding: '24px',
							overflowY: 'auto',
							backgroundColor: '#fff',
							display: theoryModalItem && hasAccess(theoryModalItem) ? 'block' : 'none',
						}}
					>
						{renderArticleSidebarContent(theoryModalItem)}
						{/* TOC Section */}
						{theoryModalItem && hasAccess(theoryModalItem) && (
							<div style={{ height: 'auto' }}>
								{renderTOCSidebar(theoryModalItem)}
							</div>
						)}
					</div>

					{/* Resizer */}
					{theoryModalItem && hasAccess(theoryModalItem) && (
						<div
							className={`${newsTabStyles.resizer} ${modalIsDraggingResizer ? newsTabStyles.resizerActive : ''}`}
							onMouseDown={(e) => {
								setModalIsDraggingResizer(true);
								setModalResizeStartRatio(theoryModalSplitRatio);
								e.preventDefault();
							}}
							style={{ marginLeft: '10px' }}
						/>
					)}

					{/* Right panel: Article Content */}
					<div
						className={newsTabStyles.modalContentPanel}
						style={{
							width: theoryModalItem && hasAccess(theoryModalItem) ? `${(1 - theoryModalSplitRatio) * 100}%` : '100%',
							minWidth: theoryModalItem && hasAccess(theoryModalItem) ? '500px' : 'none',
							padding: '24px',
						}}
					>
						{theoryModalLoading ? (
							<div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
						) : (
							renderContentPanel(theoryModalItem ? { ...theoryModalItem, hideHeaderMeta: true } : null)
						)}
					</div>
				</div>

				{/* Floating Search Results Panel */}
				{searchResults.length > 0 && showSearchResultsPanel && (
					<div
						className={newsTabStyles.searchResultsPanel}
						ref={panelRef}
						style={{
							top: `${panelPosition.y}px`,
							left: `${panelPosition.x}px`,
							cursor: isDragging ? 'grabbing' : 'default'
						}}
					>
						<div
							className={newsTabStyles.searchResultsHeader}
							onMouseDown={handleMouseDown}
						>
							<div className={newsTabStyles.searchResultsTitle}>
								Kết quả tìm kiếm ({searchResults.length})
							</div>
							<Button
								type="text"
								size="small"
								icon={<CloseOutlined />}
								onClick={() => setShowSearchResultsPanel(false)}
								style={{ minWidth: 'auto', padding: '0 4px' }}
								onMouseDown={(e) => e.stopPropagation()}
							/>
						</div>
						<div className={newsTabStyles.searchResultsList}>
							<div className={newsTabStyles.searchResultsContainer}>
								{searchResults.map((result, index) => (
									<div
										key={index}
										onClick={() => scrollToSearchResult(index)}
										className={`${newsTabStyles.searchResultItem} ${highlightedIndex === index ? newsTabStyles.searchResultItemActive : ''}`}
									>
										<div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>
											Kết quả {index + 1}
										</div>
										<div
											style={{ fontSize: '13px', lineHeight: '1.4', color: '#595959' }}
											dangerouslySetInnerHTML={{
												__html: `...${result.context.replace(
													new RegExp(`(${result.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
													'<mark style="background-color: #fff3cd; padding: 2px 0; border-radius: 2px;">$1</mark>'
												)}...`
											}}
										/>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</Modal>

			{/* Case Item Modal */}
			<Modal
				title={
					caseModalItem && (
						<div className={newsTabStyles.modalTitleContainer}>
							<div className={newsTabStyles.modalTitleMain}>
								<span className={newsTabStyles.modalTitleTabName}>Case Study</span>
								<span>/</span>
								<span className={newsTabStyles.modalTitleItemName}>
									{caseModalItem.title}
								</span>
							</div>

							<div className={newsTabStyles.modalTitleActions}>
								{/* Search input in title bar */}
								<Input
									placeholder="Tìm kiếm trong nội d..."
									prefix={<SearchOutlined />}
									value={caseModalSearchText}
									onChange={(e) => setCaseModalSearchText(e.target.value)}
									allowClear
									style={{ width: '190px' }}
									onPressEnter={() => {
										if (caseSearchResults.length > 0) {
											scrollToCaseSearchResult(caseHighlightedIndex >= 0 ? caseHighlightedIndex : 0);
										}
									}}
								/>

								{/* Search navigation */}
								{caseSearchResults.length > 0 && (
									<Space size={4}>
										<Button
											size="small"
											icon={<span>↑</span>}
											onClick={() => navigateCaseSearchResult(-1)}
											disabled={caseSearchResults.length === 0}
										/>
										<span style={{ fontSize: '12px', color: '#666', minWidth: '45px', textAlign: 'center' }}>
											{caseHighlightedIndex + 1}/{caseSearchResults.length}
										</span>
										<Button
											size="small"
											icon={<span>↓</span>}
											onClick={() => navigateCaseSearchResult(1)}
											disabled={caseSearchResults.length === 0}
										/>
									</Space>
								)}

							

								{/* Rating button in title bar - Matching CaseTrainingTab */}
								{currentUser?.id && (
									<Button
										type="text"
										size="small"
										icon={<StarOutlined style={{ color: '#faad14' }} />}
										onClick={() => {
											setRatingPopupItem(caseModalItem);
											setRatingPopupVisible(true);
										}}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '4px',
											color: '#faad14',
											border: 'none',
											boxShadow: 'none',
											flexShrink: 0
										}}
										title="Đánh giá bài viết"
									>
										{caseModalItem.scoreFeedback != null ? (
											<span style={{ fontSize: '13px' }}>
												{Number(caseModalItem.scoreFeedback || 0).toFixed(2)}
											</span>
										) : (
											<span style={{ fontSize: '13px' }}>Đánh giá</span>
										)}
									</Button>
								)}


								{/* Edit button in title bar */}
								{currentUser?.isAdmin && (
									<Button
										type="text"
										size="small"
										onClick={() => handleEditClick(caseModalItem)}
										className={newsTabStyles.modalTitleEdit}
									>
										Edit
									</Button>
								)}
							</div>
						</div>
					)
				}
				open={caseModalVisible}
				onCancel={() => {
					setCaseModalVisible(false);
					setCaseModalItem(null);
					setSelectedCaseItem(null);
				}}
				footer={null}
				width={caseModalItem ? 1400 : 1000}
				style={{
					top: '0px',
					paddingBottom: '0px',
				}}
				destroyOnClose={true}
				maskClosable={true}
				closable={true}
				className={newsTabStyles.modalContent}
			>
				<div className={newsTabStyles.resizablePanel}>
					{/* Main area: Lesson and Quiz */}
					<div style={{
						flex: 1,
						display: 'flex',
						flexDirection: 'row',
						overflow: 'hidden'
					}}>
						{/* Lesson Content Panel */}
						<div
							className={newsTabStyles.modalSidebarPanel}
							style={{
								height: '100%',
								width: caseModalItem?.questionContent && hasAccess(caseModalItem) ? `${caseModalSplitRatio * 100}%` : '100%',
								minWidth: caseModalItem?.questionContent && hasAccess(caseModalItem) ? '400px' : 'none',
								padding: '24px',
								overflowY: 'auto',
								backgroundColor: '#fff',
								borderRight: 'none'
							}}
						>
							{caseModalLoading ? (
								<div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
							) : (
								renderCaseContentPanel(caseModalItem)
							)}
						</div>

						{/* Resizer - for Quiz split */}
						{caseModalItem?.questionContent && hasAccess(caseModalItem) && (
							<div
								className={`${newsTabStyles.resizer} ${modalIsDraggingResizer ? newsTabStyles.resizerActive : ''}`}
								onMouseDown={(e) => {
									setModalIsDraggingResizer(true);
									setModalResizeStartRatio(caseModalSplitRatio);
									e.preventDefault();
								}}
								style={{ marginLeft: '10px' }}
							/>
						)}

						{/* Quiz Panel */}
						{caseModalItem?.questionContent && hasAccess(caseModalItem) && (
							<div
								className={newsTabStyles.modalContentPanel}
								style={{
									width: `${(1 - caseModalSplitRatio) * 100}%`,
									minWidth: '350px',
									padding: '16px',
									backgroundColor: '#f9f9f9'
								}}
							>
								<div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%', overflowY: 'auto' }}>
									<QuizComponent
										allowRetake={caseModalItem.allow_retake}
										quizData={caseModalItem.questionContent}
										questionId={caseModalItem.id}
										onScoreUpdate={(qid, score) => setQuizScores(prev => ({ ...prev, [qid]: score }))}
									/>
								</div>
							</div>
						)}
					</div>

					{/* Far Right Panel: TOC (Fixed 20% like CaseTrainingTab) */}
					{caseModalItem?.hasTitle && hasAccess(caseModalItem) && (
						<div
							style={{
								width: '20%',
								borderLeft: '1px solid #f0f0f0',
								backgroundColor: '#fff',
								overflowY: 'auto',
								height: '100%'
							}}
						>
							<div style={{ padding: '24px 16px' }}>
								<div style={{ marginBottom: '16px', fontWeight: 'bold', fontSize: '16px', color: '#262626' }}>
									Mục lục
								</div>
								{renderCaseTOCSidebar(caseModalItem)}
							</div>
						</div>
					)}
				</div>

				{/* Floating Case Search Results Panel */}
				{caseSearchResults.length > 0 && caseShowSearchResultsPanel && (
					<div
						className={newsTabStyles.searchResultsPanel}
						ref={casePanelRef}
						style={{
							top: `${casePanelPosition.y}px`,
							left: `${casePanelPosition.x}px`,
							cursor: caseIsDragging ? 'grabbing' : 'default',
						}}
					>
						<div
							className={newsTabStyles.searchResultsHeader}
							onMouseDown={handleCaseMouseDown}
						>
							<div className={newsTabStyles.searchResultsTitle}>
								Kết quả tìm kiếm ({caseSearchResults.length})
							</div>
							<Button
								type="text"
								size="small"
								icon={<CloseOutlined />}
								onClick={() => setCaseShowSearchResultsPanel(false)}
								style={{ minWidth: 'auto', padding: '0 4px' }}
								onMouseDown={(e) => e.stopPropagation()}
							/>
						</div>
						<div className={newsTabStyles.searchResultsList}>
							<div className={newsTabStyles.searchResultsContainer}>
								{caseSearchResults.map((result, index) => (
									<div
										key={index}
										onClick={() => scrollToCaseSearchResult(index)}
										className={`${newsTabStyles.searchResultItem} ${caseHighlightedIndex === index ? newsTabStyles.searchResultItemActive : ''}`}
									>
										<div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>
											Kết quả {index + 1}
										</div>
										<div
											style={{ fontSize: '13px', lineHeight: '1.4', color: '#595959' }}
											dangerouslySetInnerHTML={{
												__html: `...${result.context.replace(
													new RegExp(`(${result.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
													'<mark style="background-color: #fff3cd; padding: 2px 0; border-radius: 2px;">$1</mark>',
												)}...`,
											}}
										/>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</Modal>

			{/* Preview File Modal */}
			< PreviewFileModal
				open={previewModalVisible}
				onClose={() => setPreviewModalVisible(false)}
				fileUrl={previewFile?.url}
				fileName={previewFile?.name}
				title={previewFile ? `${getFileIcon(previewFile.extension)} ${previewFile.name}` : 'Preview File'}
			/>

			{/* Feedback Modal */}
			{
				showFeedbackModal && (
					<FeedbackModal
						visible={showFeedbackModal}
						onClose={() => setShowFeedbackModal(false)}
						item={selectedLongFormItem || theoryModalItem || caseModalItem}
						currentUser={currentUser}
						activeTab={selectedLongFormItem ? 'longForm' : (theoryModalItem ? 'stream' : 'caseTraining')}
					/>
				)
			}

			{/* Package Purchase Modal */}
			<PaymentModal
				open={isPackageModalOpen}
				onCancel={() => setIsPackageModalOpen(false)}
				currentUser={currentUser}
				isMobile={false}
				onTrialActivated={() => {
					window.location.reload();
				}}
			/>

			{/* Edit Detail Modal */}
			{
				editModalVisible && (
					<EditDetailModal
						visible={editModalVisible}
						onClose={closeEditModal}
						item={editingItem}
						onUpdate={handleDetailUpdate}
					/>
				)
			}

			<RatingPopup
				fetchItem={async (id) => {
					const updated = await getK9ByIdPublic(id);
					handleDetailUpdate(updated);
				}}
				visible={ratingPopupVisible}
				onCancel={() => setRatingPopupVisible(false)}
				contentId={ratingPopupItem?.id}
				contentTitle={ratingPopupItem?.title}
				currentUser={currentUser}
				currentAverageRating={Number(ratingPopupItem?.scoreFeedback || 0)}
				currentRatingCount={ratingPopupItem?.feedbackCount || 0}
				activeTab={selectedLongFormItem ? 'longForm' : (theoryModalItem ? 'stream' : 'caseTraining')}
			/>
		</div >
	);
};

export default MapView;
