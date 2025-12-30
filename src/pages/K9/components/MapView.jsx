import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Modal, Image, Input, Switch, Button, Typography, Space, Tag, Dropdown } from 'antd';
import { SearchOutlined, CloseOutlined, ClearOutlined, MoreOutlined } from '@ant-design/icons';
import { getK9ByIdPublic, getK9ByCidTypePublic } from '../../../apis/public/publicService.jsx';
import { getListQuestionHistoryByUser } from '../../../apis/questionHistoryService';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import styles from './MapView.module.css';
import newsTabStyles from './NewsTab.module.css';
import k9Styles from '../K9.module.css';
import MapViewConnectionLines from './MapViewConnectionLines';
import AudioPlayer from '../../../components/AudioPlayer/AudioPlayer.jsx';
import QuizComponent from './QuizComponent.jsx';
import ExcalidrawViewer from '../../K9Management/components/ExcalidrawViewer';
import PreviewFileModal from '../../../components/PreviewFile/PreviewFileModal';
import FeedbackModal from './FeedbackModal.jsx';
import ShareButton from './ShareButton.jsx';
import { Customize_Icon, Document_Icon, FeedBack_Icon, Expand_Icon, Close_Icon, Icon_View_Modal, Clock_Icon } from '../../../icon/IconSvg.jsx';
import { IconButton } from '@mui/material';
import caseTrainingStyles from './CaseTrainingTab.module.css';
import { formatDateFromTimestamp } from '../../../generalFunction/format.js';
import AccessDenied from './AccessDenied.jsx';
import PaymentModal from '../../../components/PaymentModal/PaymentModal';

const { Text } = Typography;

// Cấu hình marked với KaTeX extension
marked.use(markedKatex({
	throwOnError: false,
	strict: false,
	trust: true
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
	tag4Options
}) => {
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
	const caseItemRefs = useRef({}); // Refs for case items
	const caseContainerRef = useRef(null); // Container ref for case column

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
							})
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
		const pass = !isNaN(numeric) && numeric >= 60; // Pass threshold is 60, not 70

		return {
			type: 'done',
			numeric,
			pass
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

	const filteredLongFormItems = useMemo(() => {
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

		// Filter by tag5
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
	}, [longFormItems, selectedProgram, selectedTag5, searchText]);

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
				item.questionContent !== undefined && item.questionContent !== null
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
				completionRate
			};
		});
		return progress;
	}, [allTag5Options, newsItems, caseTrainingItems, longFormItems, selectedProgram, quizScores]);

	// Panel 1: Theory column - Filter and sort items
	const filteredTheoryItems = useMemo(() => {
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

		// Filter by tag5
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

		// No sorting for theory column
		return filtered;
	}, [newsItems, selectedProgram, selectedTag5, theorySearchText]);

	// Panel 1: Case column - Filter and sort items
	const filteredCaseItems = useMemo(() => {
		let filtered = (caseTrainingItems || []).filter(item => item.status === 'published');

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

		// Filter by tag5
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

		// Sort by connection if enabled - only check selectedTheoryItem (lines only go from Theory to Case)
		if (caseSortByConnection && selectedTheoryItem && selectedTheoryItem.cid) {
			filtered = [...filtered].sort((a, b) => {
				const aHasConnection = a.cid === selectedTheoryItem.cid;
				const bHasConnection = b.cid === selectedTheoryItem.cid;
				if (aHasConnection && !bHasConnection) return -1;
				if (!aHasConnection && bHasConnection) return 1;
				return 0;
			});
		}

		return filtered;
	}, [caseTrainingItems, selectedProgram, selectedTag5, caseSearchText, caseSortByConnection, selectedTheoryItem]);

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
			...caseItemRefs.current
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
				rootMargin: '100px'
			}
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
			'7z': '📦'
		};
		return iconMap[extension] || '📄';
	};

	// Helper function to open file preview
	const openFilePreview = (fileUrl, fileName) => {
		const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
		setPreviewFile({
			url: fileUrl,
			name: fileName,
			extension: fileExtension
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
					trust: true
				});
				result = result.replace(new RegExp(placeholder, 'g'), renderedLatex);
			} catch (error) {
				console.warn('LaTeX rendering error:', error);
			}
		});
		return result;
	};

	// Extract headings from markdown content
	const extractHeadings = (content) => {
		if (!content) return [];
		const headingRegex = /^(#{1,6})\s+(.+)$/gm;
		const extractedHeadings = [];
		let match;
		while ((match = headingRegex.exec(content)) !== null) {
			const level = match[1].length;
			const text = match[2].trim();
			extractedHeadings.push({ level, text });
		}
		return extractedHeadings;
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
				inline: 'nearest'
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
			gfm: true
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
				matchIndex: index
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
				text: nodeText
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
				nodeOffset: nodeInfo ? index - nodeInfo.startPos : 0
			});
			index += searchTerm.length;
		}
		setSearchResults(results);
		if (results.length > 0) {
			setHighlightedIndex(0);
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
							inline: 'nearest'
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
						null
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
									block: 'center'
								});
							} catch (e) {
								node.parentElement?.scrollIntoView({
									behavior: 'smooth',
									block: 'center'
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
			y: e.clientY - rect.top
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
					y: Math.max(0, Math.min(newY, maxY))
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
			<div className={`${newsTabStyles.tocSidebar} ${showTOCSidebar ? newsTabStyles.show : ''}`}>
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
		const currentItem = selectedLongFormItem || theoryModalItem;
		if (currentItem && currentItem.detail) {
			const extractedHeadings = extractHeadings(currentItem.detail);
			setHeadings(extractedHeadings);
			setActiveHeadingIndex(-1);
		} else {
			setHeadings([]);
			setActiveHeadingIndex(-1);
		}
	}, [selectedLongFormItem?.id, theoryModalItem?.id]);

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
			gfm: true
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
				matchIndex: index
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
				text: nodeText
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
				nodeOffset: nodeInfo ? index - nodeInfo.startPos : 0
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
							inline: 'nearest'
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
						null
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
									block: 'center'
								});
							} catch (e) {
								node.parentElement?.scrollIntoView({
									behavior: 'smooth',
									block: 'center'
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
			y: e.clientY - rect.top
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
					y: Math.max(0, Math.min(newY, maxY))
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
			<div className={`${newsTabStyles.tocSidebar} ${showTOCSidebar ? newsTabStyles.show : ''}`}>
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

	// Extract headings when case modal item changes
	useEffect(() => {
		if (caseModalItem && caseModalItem.detail) {
			const extractedHeadings = extractHeadings(caseModalItem.detail);
			setHeadings(extractedHeadings);
			setActiveHeadingIndex(-1);
		} else if (!caseModalVisible) {
			setHeadings([]);
			setActiveHeadingIndex(-1);
		}
	}, [caseModalItem?.id, caseModalVisible]);

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

	// Render content panel (full version like NewsTab)
	const renderContentPanel = (item) => {
		if (!item) return null;

		// Check access permission
		if (!hasAccess(item)) {
			const isTrialAccount = currentUser?.account_type === 'Dùng thử';
			return (
				<div className={`${k9Styles.contentPanel} ${newsTabStyles.contentPanel}`}>
					<AccessDenied 
						isTrialAccount={isTrialAccount}
						onUpgradeClick={() => setIsPackageModalOpen(true)}
					/>
				</div>
			);
		}

		return (
			<div className={`${k9Styles.contentPanel} ${newsTabStyles.contentPanel}`}>
				<div className={`${k9Styles.contentHeader} ${newsTabStyles.contentHeader}`}
					style={{
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						width: '100%',
						gap: '0'
					}}>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						marginTop: '10px',
						marginLeft: '10px',
						width: '90%',
						flexWrap: 'nowrap'
					}}>
						<span style={{
							fontSize: '13px',
							color: '#9F9F9F',
							marginLeft: '40px',
							width: 'max-content',
							flexShrink: 0
						}}>ID: {item.id}</span>

						<ShareButton onShare={() => { }} />

						{item.updatedAt && (
							<Button
								type="text"
								icon={<Clock_Icon width={13} height={13} />}
								size={'small'}
								style={{ color: '#9F9F9F', fontSize: '13px' }}
							>
								{formatDateFromTimestamp(item.updatedAt)}
							</Button>
						)}
						{item.tag4 && Array.isArray(item.tag4) && item.tag4.length > 0 && (
							<div style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								fontSize: '13px',
								color: '#9F9F9F',
								whiteSpace: 'nowrap',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								maxWidth: '100%',
								width: 'auto',
								flexWrap: 'nowrap'
							}}>
								<span style={{ whiteSpace: 'nowrap' }}>Related module:  <span style={{
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									flex: '0 1 auto'
								}}>
									{(item.tag4.length > 3
										? item.tag4.slice(0, 3).join(', ') + '...'
										: item.tag4.join(', '))
									}
								</span></span>
							</div>
						)}
					</div>
					{/* <div style={{
						width: '5%',
						display: 'flex',
						justifyContent: 'flex-end'
					}}>
						{currentUser?.isAdmin && (
							<Button
								type="text"
								size="small"
								style={{
									color: '#9F9F9F',
									border: 'none',
									boxShadow: 'none'
								}}
							>
								Edit
							</Button>
						)}
					</div> */}
				</div>

				<div className={newsTabStyles.contentMain} style={{ padding: '0 100px' }}>
					<div className={k9Styles.contentTitleContainer}>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<span className={`${k9Styles.contentTitle} ${newsTabStyles.contentTitle}`}>{item.title}</span>
							</div>
						</div>
						{item.summary && (
							<div className={`${k9Styles.contentDetail} ${newsTabStyles.contentDetail}`} style={{ marginTop: '12px', marginBottom: '12px' }}>
								<div
									className={k9Styles.markdownContent}
									style={{ fontSize: '16px' }}
									dangerouslySetInnerHTML={{
										__html: (() => {
											const { processedText, latexBlocks } = preprocessLatex(item.summary || '');
											let html = marked.parse(processedText, {
												headerIds: true,
												mangle: false,
												headerPrefix: '',
												breaks: false,
												gfm: true
											});
											const finalHtml = postprocessLatex(html, latexBlocks);
											return DOMPurify.sanitize(finalHtml);
										})(),
									}}
								/>
							</div>
						)}
						{item.summaryDetail && showSummaryDetail && (
							<div className={`${k9Styles.contentDetail} ${newsTabStyles.contentDetail}`} style={{ marginTop: '12px', marginBottom: '12px' }}>
								<div
									className={k9Styles.markdownContent}
									style={{ fontSize: '16px' }}
									dangerouslySetInnerHTML={{
										__html: (() => {
											const { processedText, latexBlocks } = preprocessLatex(item.summaryDetail || '');
											let html = marked.parse(processedText, {
												headerIds: true,
												mangle: false,
												headerPrefix: '',
												breaks: false,
												gfm: true
											});
											const finalHtml = postprocessLatex(html, latexBlocks);
											return DOMPurify.sanitize(finalHtml);
										})(),
									}}
								/>
							</div>
						)}
						<div style={{
							display: 'flex',
							gap: '16px',
							fontSize: '15px',
							color: '#9F9F9F',
							marginTop: '10px',
							flexDirection: 'row',
							alignItems: 'center'
						}}>
							{item.summaryDetail && (
								<Button
									type="text"
									size="small"
									onClick={() => setShowSummaryDetail(!showSummaryDetail)}
									title={showSummaryDetail ? 'Ẩn Shortform' : 'Hiện Shortform'}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '4px',
										padding: '2px 8px',
										color: '#595959',
										backgroundColor: '#f5f5f5',
										borderRadius: '8px',
										border: 'none',
										boxShadow: 'none'
									}}
									icon={showSummaryDetail ? <Close_Icon width={12} height={12} /> : <Expand_Icon width={12} height={12} />}
								>
									Shortform
								</Button>
							)}

							<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
								{item.info?.filedLabel_1 && (
									<span style={{ display: 'flex', alignItems: 'center' }}>
										{item.info?.filedLabel_1}
									</span>
								)}
								{item.info?.filedLabel_1 && item.info?.filedLabel_2 && (
									<span style={{ color: '#C4C4C4' }}>|</span>
								)}
								{item.info?.filedLabel_2 && (
									<span style={{ display: 'flex', alignItems: 'center' }}>
										{item.info?.filedLabel_2}
									</span>
								)}
							</div>
							{currentUser?.id && (
								<span onClick={() => setShowFeedbackModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title="Góp ý/Feedback cho nội dung">
									<FeedBack_Icon width={17} height={17} /> Góp ý, feedback cho nội dung
								</span>
							)}
						</div>
						{/* Audio Player Section */}
						<div className={k9Styles.audioPlayerContainer}>
							<AudioPlayer audioUrl={item.audioUrl} />
						</div>
					</div>

					{item.fileUrls && item.fileUrls.length > 0 && (
						<div className={`${k9Styles.fileTagsContainer} ${newsTabStyles.fileTagsContainer}`}>
							{item.fileUrls.map((fileUrl, index) => {
								const fileName = fileUrl.split('/').pop() || `file-${index + 1}`;
								const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
								return (
									<div
										key={index}
										className={`${k9Styles.fileTag} ${newsTabStyles.fileTag}`}
										onClick={() => openFilePreview(fileUrl, fileName)}
										title={fileName}
									>
										<span className={`${k9Styles.fileTagIcon} ${newsTabStyles.fileTagIcon}`}>
											{getFileIcon(fileExtension)}
										</span>
										<span className={`${k9Styles.fileTagName} ${newsTabStyles.fileTagName}`}>
											{fileName}
										</span>
										<span className={`${k9Styles.fileTagExtension} ${newsTabStyles.fileTagExtension}`}>
											{fileExtension.toUpperCase()}
										</span>
									</div>
								);
							})}
						</div>
					)}

					{/* Diagram Section */}
					{(item.diagramUrl || ((item.diagramHtmlCode || item.diagramHtmlCodeFromSummaryDetail) && item.showHtml !== false) || (item.diagramExcalidrawJson && item.showExcalidraw !== false) || item.diagramNote || item.diagramExcalidrawNote || (item.imgUrls && item.showImgUrls !== false)) && (
						<div className={`${k9Styles.valueSection} ${newsTabStyles.valueSection}`}>
							<div className={`${k9Styles.diagramSectionContent} ${newsTabStyles.diagramSectionContent}`}>
								{/* Handle Excalidraw React Diagrams */}
								{item.diagramExcalidrawJson && Array.isArray(item.diagramExcalidrawJson) && item.showExcalidraw !== false && (
									item.diagramExcalidrawJson.map((jsonString, index) => {
										const imageUrl = item.diagramExcalidrawImageUrls && Array.isArray(item.diagramExcalidrawImageUrls)
											? item.diagramExcalidrawImageUrls[index]
											: null;
										return (
											<div key={`excalidraw-${index}`} style={{ marginBottom: '20px' }}>
												<div style={{
													border: '1px solid #e1e4e8',
													borderRadius: '8px',
													padding: '16px',
													backgroundColor: '#fff'
												}}>
													<ExcalidrawViewer
														jsonString={jsonString}
														readOnly={true}
														height="500px"
														imageUrl={imageUrl}
													/>
												</div>
												{(Array.isArray(item.diagramExcalidrawNote) && item.diagramExcalidrawNote[index]) && (
													<div className={`${k9Styles.diagramNote} ${newsTabStyles.diagramNote}`}>
														<div
															className={k9Styles.markdownContent}
															dangerouslySetInnerHTML={{
																__html: (() => {
																	const { processedText, latexBlocks } = preprocessLatex(item.diagramExcalidrawNote[index] || '');
																	const html = marked.parse(processedText);
																	const finalHtml = postprocessLatex(html, latexBlocks);
																	return DOMPurify.sanitize(finalHtml);
																})(),
															}}
														/>
													</div>
												)}
											</div>
										);
									})
								)}

								{/* Handle imgUrls from SummaryDetail */}
								{item.imgUrls && Array.isArray(item.imgUrls) && item.imgUrls.length > 0 && item.showImgUrls !== false && (
									item.imgUrls.map((imgItem, index) => {
										const imageUrl = typeof imgItem === 'string' ? imgItem : (imgItem?.url || imgItem?.image_url || '');
										const description = typeof imgItem === 'object' ? imgItem?.description : '';
										if (!imageUrl) return null;
										return (
											<div key={`imgurls-${index}`} style={{ marginBottom: '20px' }}>
												<div className={`${k9Styles.diagramImage} ${newsTabStyles.diagramImage}`}>
													<Image
														src={imageUrl}
														alt={description || `Ảnh ${index + 1}`}
														className={`${k9Styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
														preview={{
															mask: 'Xem ảnh',
															maskClassName: 'custom-mask'
														}}
													/>
												</div>
											</div>
										);
									})
								)}

								{/* Handle HTML Code Diagrams */}
								{item.diagramHtmlCode && Array.isArray(item.diagramHtmlCode) && item.showHtml !== false && (
									item.diagramHtmlCode.map((htmlCode, index) => (
										<div key={`html-${index}`}>
											<div className={`${k9Styles.diagramHtmlCode} ${newsTabStyles.diagramHtmlCode}`}>
												<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlCode || '') }} />
											</div>
										</div>
									))
								)}

								{/* Handle HTML Code Diagrams from SummaryDetail */}
								{item.diagramHtmlCodeFromSummaryDetail && item.showHtml !== false && (
									(Array.isArray(item.diagramHtmlCodeFromSummaryDetail) ? item.diagramHtmlCodeFromSummaryDetail : [item.diagramHtmlCodeFromSummaryDetail]).map((htmlCode, index) => (
										<div key={`html-summary-${index}`}>
											<div className={`${k9Styles.diagramHtmlCode} ${newsTabStyles.diagramHtmlCode}`}>
												<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlCode || '') }} />
											</div>
										</div>
									))
								)}

								{/* Handle Kroki Image Diagrams */}
								{item.diagramUrl && (
									Array.isArray(item.diagramUrl) ? (
										item.diagramUrl.map((diagramUrl, index) => (
											<div key={`kroki-${index}`} style={{ marginBottom: '20px' }}>
												<div className={`${k9Styles.diagramImage} ${newsTabStyles.diagramImage}`}>
													<Image
														src={diagramUrl}
														alt={`Diagram ${index + 1}`}
														className={`${k9Styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
														preview={{
															mask: 'Xem ảnh',
															maskClassName: 'custom-mask'
														}}
													/>
												</div>
												{Array.isArray(item.diagramNote) && item.diagramNote[index] && (
													<div className={`${k9Styles.diagramNote} ${newsTabStyles.diagramNote}`}>
														<div
															className={k9Styles.markdownContent}
															dangerouslySetInnerHTML={{
																__html: (() => {
																	const { processedText, latexBlocks } = preprocessLatex(item.diagramNote[index] || '');
																	const html = marked.parse(processedText);
																	const finalHtml = postprocessLatex(html, latexBlocks);
																	return DOMPurify.sanitize(finalHtml);
																})(),
															}}
														/>
													</div>
												)}
											</div>
										))
									) : (
										<>
											<div className={`${k9Styles.diagramImage} ${newsTabStyles.diagramImage}`}>
												<Image
													src={item.diagramUrl}
													alt="Diagram"
													className={`${k9Styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
													preview={{
														mask: 'Xem ảnh',
														maskClassName: 'custom-mask'
													}}
												/>
											</div>
											{item.diagramNote && (
												<div className={`${k9Styles.diagramNote} ${newsTabStyles.diagramNote}`}>
													<div
														className={k9Styles.markdownContent}
														dangerouslySetInnerHTML={{
															__html: (() => {
																const { processedText, latexBlocks } = preprocessLatex(
																	Array.isArray(item.diagramNote)
																		? item.diagramNote[0] || ''
																		: item.diagramNote || ''
																);
																const html = marked.parse(processedText);
																const finalHtml = postprocessLatex(html, latexBlocks);
																return DOMPurify.sanitize(finalHtml);
															})(),
														}}
													/>
												</div>
											)}
										</>
									)
								)}
							</div>
						</div>
					)}

					<div className={`${k9Styles.contentBody} ${newsTabStyles.contentBody}`}>
						{item.detail && item.showDetail !== false && (
							<div className={`${k9Styles.contentDetail} ${newsTabStyles.contentDetail}`}>
								<div
									ref={markdownContentRef}
									className={k9Styles.markdownContent}
									dangerouslySetInnerHTML={{
										__html: (() => {
											const { processedText, latexBlocks } = preprocessLatex(item.detail || '');
											let html = marked.parse(processedText, {
												headerIds: true,
												mangle: false,
												headerPrefix: '',
												breaks: false,
												gfm: true
											});
											// Apply search highlight if modalSearchText exists
											if (modalSearchText && modalSearchText.trim()) {
												html = highlightTextInContent(html, modalSearchText);
											}
											const finalHtml = postprocessLatex(html, latexBlocks);
											return DOMPurify.sanitize(finalHtml);
										})(),
									}}
								/>
							</div>
						)}

						{/* Quiz Component */}
						{item.questionContent && (
							<QuizComponent
								allowRetake={item.allow_retake}
								quizData={item.questionContent}
								questionId={item.id}
								onScoreUpdate={(qid, score) => setQuizScores(prev => ({ ...prev, [qid]: score }))}
							/>
						)}
					</div>
				</div>
			</div>
		);
	};

	// Render Case content panel (full version like CaseTrainingTab)
	const renderCaseContentPanel = (item) => {
		if (!item) return null;

		// Check access permission
		if (!hasAccess(item)) {
			const isTrialAccount = currentUser?.account_type === 'Dùng thử';
			return (
				<div className={`${caseTrainingStyles.contentPanel} ${newsTabStyles.contentPanel}`}>
					<AccessDenied 
						isTrialAccount={isTrialAccount}
						onUpgradeClick={() => setIsPackageModalOpen(true)}
					/>
				</div>
			);
		}

		return (
			<div className={`${caseTrainingStyles.contentPanel} ${newsTabStyles.contentPanel}`}>
				<div className={`${caseTrainingStyles.contentHeader} ${newsTabStyles.contentHeader}`}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
						<span className={`${caseTrainingStyles.contentTitle} ${newsTabStyles.contentTitle}`}>
							{currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
								<span style={{ marginRight: '6px', fontSize: '14px', verticalAlign: 'middle' }}>🔒</span>
							)}
							{item.title}
						</span>
				
					</div>
					{item.summaryDetail && showSummaryDetail && (
						<div className={`${caseTrainingStyles.contentDetail} ${newsTabStyles.contentDetail}`} style={{ marginTop: '12px', marginBottom: '12px' }}>
							<div
								className={caseTrainingStyles.markdownContent}
								style={{ fontSize: '16px' }}
								dangerouslySetInnerHTML={{
									__html: (() => {
										const { processedText, latexBlocks } = preprocessLatex(item.summaryDetail || '');
										let html = marked.parse(processedText, {
											headerIds: true,
											mangle: false,
											headerPrefix: '',
											breaks: false,
											gfm: true
										});
										const finalHtml = postprocessLatex(html, latexBlocks);
										return DOMPurify.sanitize(finalHtml);
									})(),
								}}
							/>
						</div>
					)}
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', marginTop: '20px' }}>
						<span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>ID: {item.id}</span>
						{cidSourceInfo && cidSourceInfo.length > 0 && (
							cidSourceInfo.map((cidItem, idx) => (
								<span
									key={idx}
									style={{
										fontSize: '13px',
										color: '#1890ff',
										fontWeight: '500',
										backgroundColor: '#f0f8ff',
										padding: '4px 8px',
										borderRadius: '4px',
										border: '1px solid #d6e4ff',
										marginLeft: '8px',
										cursor: 'pointer'
									}}
									onClick={() => handleCidSourceInfoClick(cidSourceInfo)}
								>
									{cidItem.title} - CID {cidItem.cid} - {cidItem.id}
								</span>
							))
						)}
						<ShareButton onShare={() => { }} />
					</div>
				</div>

				{/* Audio Player Section */}
				<div style={{
					display: 'flex',
					gap: '16px',
					fontSize: '15px',
					color: '#9F9F9F',
					marginTop: '10px',
					flexDirection: 'row',
					alignItems: 'center'
				}}>
					{item.summaryDetail && (
						<Button
							type="text"
							size="small"
							onClick={() => setShowSummaryDetail(!showSummaryDetail)}
							title={showSummaryDetail ? 'Ẩn Shortform' : 'Hiện Shortform'}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
								padding: '2px 8px',
								color: '#595959',
								backgroundColor: '#f5f5f5',
								borderRadius: '8px',
								border: 'none',
								boxShadow: 'none'
							}}
							icon={showSummaryDetail ? <Close_Icon width={12} height={12} /> : <Expand_Icon width={12} height={12} />}
						>
							Shortform
						</Button>
					)}
					<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
						{item.info?.filedLabel_1 && (
							<span style={{ display: 'flex', alignItems: 'center' }}>
								{item.info?.filedLabel_1}
							</span>
						)}
						{item.info?.filedLabel_1 && item.info?.filedLabel_2 && (
							<span style={{ color: '#C4C4C4' }}>|</span>
						)}
						{item.info?.filedLabel_2 && (
							<span style={{ display: 'flex', alignItems: 'center' }}>
								{item.info?.filedLabel_2}
							</span>
						)}
					</div>
					{currentUser?.id && (
						<span onClick={() => setShowFeedbackModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title="Góp ý/Feedback cho nội dung">
							<FeedBack_Icon width={17} height={17} /> Góp ý, feedback cho nội dung
						</span>
					)}
				</div>
				<div className={caseTrainingStyles.audioPlayerContainer}>
					<AudioPlayer audioUrl={item.audioUrl} />
				</div>
				<div className={newsTabStyles.contentMain}>
					{/* File URLs Section */}
					{item.fileUrls && item.fileUrls.length > 0 && (
						<div className={`${caseTrainingStyles.fileTagsContainer} ${newsTabStyles.fileTagsContainer}`}>
							{item.fileUrls.map((fileUrl, index) => {
								const fileName = fileUrl.split('/').pop() || `file-${index + 1}`;
								const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
								return (
									<div
										key={index}
										className={`${caseTrainingStyles.fileTag} ${newsTabStyles.fileTag}`}
										onClick={() => openFilePreview(fileUrl, fileName)}
										title={fileName}
									>
										<span className={`${caseTrainingStyles.fileTagIcon} ${newsTabStyles.fileTagIcon}`}>
											{getFileIcon(fileExtension)}
										</span>
										<span className={`${caseTrainingStyles.fileTagName} ${newsTabStyles.fileTagName}`}>
											{fileName}
										</span>
										<span className={`${caseTrainingStyles.fileTagExtension} ${newsTabStyles.fileTagExtension}`}>
											{fileExtension.toUpperCase()}
										</span>
									</div>
								);
							})}
						</div>
					)}

					{/* Diagram Section - Simplified, only show if exists */}
					{(item.diagramUrl || (item.diagramHtmlCode && item.showHtml !== false) || (item.diagramExcalidrawJson && item.showExcalidraw !== false) || item.imgUrls) && (
						<div className={`${caseTrainingStyles.valueSection} ${newsTabStyles.valueSection}`}>
							<div className={`${caseTrainingStyles.diagramSectionContent} ${newsTabStyles.diagramSectionContent}`}>
								{/* Excalidraw */}
								{item.diagramExcalidrawJson && Array.isArray(item.diagramExcalidrawJson) && item.showExcalidraw !== false && (
									item.diagramExcalidrawJson.map((jsonString, index) => {
										const imageUrl = item.diagramExcalidrawImageUrls && Array.isArray(item.diagramExcalidrawImageUrls)
											? item.diagramExcalidrawImageUrls[index]
											: null;
										return (
											<div key={`excalidraw-${index}`} style={{ marginBottom: '20px' }}>
												<div style={{
													border: '1px solid #e1e4e8',
													borderRadius: '8px',
													padding: '16px',
													backgroundColor: '#fff'
												}}>
													<ExcalidrawViewer
														jsonString={jsonString}
														readOnly={true}
														height="500px"
														imageUrl={imageUrl}
													/>
												</div>
											</div>
										);
									})
								)}
								{/* imgUrls */}
								{item.imgUrls && Array.isArray(item.imgUrls) && item.imgUrls.length > 0 && item.showImgUrls !== false && (
									item.imgUrls.map((imgItem, index) => {
										const imageUrl = typeof imgItem === 'string' ? imgItem : (imgItem?.url || imgItem?.image_url || '');
										if (!imageUrl) return null;
										return (
											<div key={`imgurls-${index}`} style={{ marginBottom: '20px' }}>
												<div className={`${caseTrainingStyles.diagramImage} ${newsTabStyles.diagramImage}`}>
													<Image
														src={imageUrl}
														alt={`Ảnh ${index + 1}`}
														className={`${caseTrainingStyles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
														preview={{ mask: 'Xem ảnh', maskClassName: 'custom-mask' }}
													/>
												</div>
											</div>
										);
									})
								)}
								{/* HTML Code */}
								{item.diagramHtmlCode && Array.isArray(item.diagramHtmlCode) && item.showHtml !== false && (
									item.diagramHtmlCode.map((htmlCode, index) => (
										<div key={`html-${index}`}>
											<div className={`${caseTrainingStyles.diagramHtmlCode} ${newsTabStyles.diagramHtmlCode}`}>
												<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlCode || '') }} />
											</div>
										</div>
									))
								)}
								{/* Kroki Image */}
								{item.diagramUrl && (
									Array.isArray(item.diagramUrl) ? (
										item.diagramUrl.map((diagramUrl, index) => (
											<div key={`kroki-${index}`} style={{ marginBottom: '20px' }}>
												<div className={`${caseTrainingStyles.diagramImage} ${newsTabStyles.diagramImage}`}>
													<Image
														src={diagramUrl}
														alt={`Diagram ${index + 1}`}
														className={`${caseTrainingStyles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
														preview={{ mask: 'Xem ảnh', maskClassName: 'custom-mask' }}
													/>
												</div>
											</div>
										))
									) : (
										<div className={`${caseTrainingStyles.diagramImage} ${newsTabStyles.diagramImage}`}>
											<Image
												src={item.diagramUrl}
												alt="Diagram"
												className={`${caseTrainingStyles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
												preview={{ mask: 'Xem ảnh', maskClassName: 'custom-mask' }}
											/>
										</div>
									)
								)}
							</div>
						</div>
					)}

					<div className={`${caseTrainingStyles.contentBody} ${newsTabStyles.contentBody}`}>
						{item.description && (
							<div className={caseTrainingStyles.contentDescription}>
								<Text strong>Description:</Text>
								<Text>{item.description}</Text>
							</div>
						)}
						{item.detail && item.showDetail !== false && (
							<div className={`${caseTrainingStyles.contentDetail} ${newsTabStyles.contentDetail}`}>
								<div
									ref={caseMarkdownContentRef}
									className={caseTrainingStyles.markdownContent}
									dangerouslySetInnerHTML={{
										__html: (() => {
											const { processedText, latexBlocks } = preprocessLatex(item.detail || '');
											let html = marked.parse(processedText, {
												headerIds: true,
												mangle: false,
												headerPrefix: '',
												breaks: false,
												gfm: true
											});
											// Apply search highlight if caseModalSearchText exists
											if (caseModalSearchText && caseModalSearchText.trim()) {
												html = highlightTextInContent(html, caseModalSearchText);
											}
											const finalHtml = postprocessLatex(html, latexBlocks);
											return DOMPurify.sanitize(finalHtml);
										})(),
									}}
								/>
							</div>
						)}
						{/* Quiz Component */}
						{item.questionContent && (
							<QuizComponent
								allowRetake={item.allow_retake}
								quizData={item.questionContent}
								questionId={item.id}
								onScoreUpdate={(qid, score) => setQuizScores(prev => ({ ...prev, [qid]: score }))}
							/>
						)}
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className={styles.mapViewContainer}>
			{/* Top Bar Section with Tag5 Filter and Progress */}
			<div className={styles.mapViewContent}>
				<div className={styles.progressSection}>
					<div className={styles.progressHeader}>
						{/* Left: Progress Info */}
						<div className={styles.progressLeft}>
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
						
						{/* Right: Tag5 Filter */}
						{allTag5Options.length > 0 && (
							<div className={styles.tag5FilterRight}>
								<div className={styles.tag5FilterHeader}>
									<span className={styles.tag5FilterTitle}>Tags</span>
									{selectedTag5.length > 0 && (
										<Button
											type="default"
											size="small"
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
									style={{ position: 'absolute', visibility: 'hidden', width: tagListRef.current?.offsetWidth || '100%' }}
								>
									{allTag5Options.map(tag5Value => {
										const progress = tag5Progress[tag5Value] || { total: 0, completed: 0, completionRate: 0 };
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
												<Tag color={isSelected ? 'processing' : 'default'} className={styles.tag5FilterTag}>
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
													<span className={styles.tag5FilterPercent}>{progress.completionRate}%</span>
												</div>
											</div>
										);
									})}
								</div>
								<div className={styles.tag5FilterList} ref={tagListRef}>
									{allTag5Options.slice(0, visibleTagCount).map(tag5Value => {
										const progress = tag5Progress[tag5Value] || { total: 0, completed: 0, completionRate: 0 };
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
												<Tag color={isSelected ? 'processing' : 'default'} className={styles.tag5FilterTag}>
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
													<span className={styles.tag5FilterPercent}>{progress.completionRate}%</span>
												</div>
											</div>
										);
									})}
									{visibleTagCount < allTag5Options.length && (() => {
										const remainingTags = allTag5Options.slice(visibleTagCount);
										const menuItems = remainingTags.map(tag5Value => {
											const progress = tag5Progress[tag5Value] || { total: 0, completed: 0, completionRate: 0 };
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
														<Tag color={isSelected ? 'processing' : 'default'} className={styles.tag5FilterTag}>
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
															<span className={styles.tag5FilterPercent}>{progress.completionRate}%</span>
														</div>
													</div>
												),
											};
										});
										return (
											<Dropdown 
												menu={{ items: menuItems }} 
												trigger={['click']} 
												placement="bottomLeft"
											>
												<Button
													type="default"
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
									<Input
										placeholder="Tìm kiếm..."
										prefix={<SearchOutlined />}
										value={theorySearchText}
										onChange={(e) => setTheorySearchText(e.target.value)}
										allowClear
										size="small"
										className={styles.rightPanelSearch}
									/>
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
													onClick={() => {
														setSelectedTheoryItem(item);
														setSelectedCaseItem(null);
													}}
													className={`${styles.itemCard} ${selectedTheoryItem?.id === item.id ? styles.itemCardSelected : ''}`}
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
														<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
															<div className={styles.itemCardTitleFlexWrap} style={{ flex: 1 }}>
																{item.title}
															</div>
															<Button
																type="text"
																icon={<Icon_View_Modal width={16} height={16} />}
																size="small"
																onClick={
																(e) => {
																	e.stopPropagation();
																	handleTheoryItemIconClick(item, e)
																}
																}
																style={{
																	flexShrink: 0,
																	color: '#1890ff',
																	padding: '4px 8px'
																}}
																title="Xem chi tiết"
															/>
														</div>
														{/* ID, CID, Tag5 and Quiz Status Row */}
														<div className={styles.itemCardMeta}>
															<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
																{item.cid && (
																	<span className={styles.itemCardId}>
																		CID: {item.cid}
																	</span>
																)}
																{item.cid && item.id && <span style={{ color: '#8c8c8c' }}>|</span>}
																<span className={styles.itemCardId}>
																	ID: {item.id}
																</span>
																{renderQuizStatusBadge(item)}
																{item.tag5 && (
																	<Tag color="green">
																		{Array.isArray(item.tag5) ? item.tag5.join(', ') : item.tag5}
																	</Tag>
																)}
															</div>
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
										Case Study({filteredCaseItems.length})
									</div>
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										<Input
											placeholder="Tìm kiếm..."
											prefix={<SearchOutlined />}
											value={caseSearchText}
											onChange={(e) => setCaseSearchText(e.target.value)}
											allowClear
											size="small"
											className={styles.rightPanelSearch}
										/>
										<div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}>
											<span>Auto-Arrange</span>
											<Switch
												size="small"
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
											filteredCaseItems.map((item) => (
												<div
													key={item.id}
													ref={(el) => {
														caseItemRefs.current[item.id] = el;
														panel1ItemRefs.current[item.id] = el;
													}}
													onClick={() => handleCaseItemClick(item)}
													className={`${styles.itemCard} ${selectedCaseItem?.id === item.id ? styles.itemCardSelected : ''}`}
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
															{item.title}
														</div>
														{/* ID, CID, Tag5 and Quiz Status Row */}
														<div className={styles.itemCardMeta}>
															<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
																{item.cid && (
																	<span className={styles.itemCardId}>
																		CID: {item.cid}
																	</span>
																)}
																{item.cid && item.id && <span style={{ color: '#8c8c8c' }}>|</span>}
																<span className={styles.itemCardId}>
																	ID: {item.id}
																</span>
																{renderQuizStatusBadge(item)}
																{item.tag5 && (
																	<Tag color="green">
																		{Array.isArray(item.tag5) ? item.tag5.join(', ') : item.tag5}
																	</Tag>
																)}
															</div>
														</div>
													</div>
												</div>
											))
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
								sourceType="theory"
								targetType="case"
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
							<Input
								placeholder="Tìm kiếm..."
								prefix={<SearchOutlined />}
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								allowClear
								size="small"
								className={styles.rightPanelSearch}
							/>
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
												<div className={styles.itemCardTitle}>
													{item.title}
												</div>
												{item.summary && (
													<div className={styles.itemCardSummary}>
														{item.summary}
													</div>
												)}
												{/* ID, Tag5 and Quiz Status Row */}
												<div className={styles.itemCardMeta}>
													<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
														<span className={styles.itemCardId}>
															ID: {item.id}
														</span>
														{renderQuizStatusBadge(item)}
														{item.tag5 && (
															<Tag color="green">
																{Array.isArray(item.tag5) ? item.tag5.join(', ') : item.tag5}
															</Tag>
														)}
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
						<div style={{ display: 'flex', gap: '12px' }}>
							<div style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								fontWeight: '600',
								color: '#262626'
							}}>
								<span style={{ fontSize: '18px' }}>Business Wiki</span>
								<span>{'>'}</span>
								<span style={{
									fontSize: '16px',
									maxWidth: '600px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap'
								}}>
									{selectedLongFormItem.title}
								</span>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<Input
									placeholder="Tìm kiếm trong nội dung..."
									prefix={<SearchOutlined />}
									value={modalSearchText}
									onChange={(e) => setModalSearchText(e.target.value)}
									allowClear
									style={{ flex: 1, maxWidth: '400px' }}
									onPressEnter={() => {
										if (searchResults.length > 0) {
											scrollToSearchResult(highlightedIndex >= 0 ? highlightedIndex : 0);
										}
									}}
								/>
								{searchResults.length > 0 && (
									<>
										<Button
											size="small"
											onClick={() => navigateSearchResult(-1)}
											disabled={searchResults.length === 0}
											style={{ minWidth: '32px', padding: '0 8px' }}
										>
											↑
										</Button>
										<span
											style={{
												fontSize: '12px',
												color: '#666',
												minWidth: '50px',
												textAlign: 'center',
												cursor: 'pointer'
											}}
											onClick={() => setShowSearchResultsPanel(!showSearchResultsPanel)}
											title="Xem danh sách kết quả"
										>
											{highlightedIndex + 1} / {searchResults.length}
										</span>
										<Button
											size="small"
											onClick={() => navigateSearchResult(1)}
											disabled={searchResults.length === 0}
											style={{ minWidth: '32px', padding: '0 8px' }}
										>
											↓
										</Button>
									</>
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
				width={selectedLongFormItem?.hasTitle ? 1400 : 1000}
				style={{
					top: '0px',
					paddingBottom: '0px'
				}}
				destroyOnClose={true}
				maskClosable={true}
				closable={true}
				className={newsTabStyles.modalContent}
			>
				<div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'auto', position: 'relative' }}>
					<div style={selectedLongFormItem?.hasTitle ? { flex: 1, padding: '20px' } : { padding: '20px', width: '100%' }}>
						{modalLoading ? (
							<div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
						) : (
							renderContentPanel(selectedLongFormItem)
						)}
					</div>
					{selectedLongFormItem?.hasTitle && (
						<div style={{ width: '25%', borderLeft: '1px solid #f0f0f0', overflowY: 'auto' }}>
							{renderTOCSidebar(selectedLongFormItem)}
						</div>
					)}

					{/* Floating Search Results Panel */}
					{searchResults.length > 0 && showSearchResultsPanel && (
						<div
							ref={panelRef}
							style={{
								position: 'fixed',
								top: `${panelPosition.y}px`,
								left: `${panelPosition.x}px`,
								width: '350px',
								maxHeight: '70vh',
								backgroundColor: '#fff',
								border: '1px solid #d9d9d9',
								borderRadius: '8px',
								boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
								zIndex: 1000,
								display: 'flex',
								flexDirection: 'column',
								overflow: 'hidden',
								cursor: isDragging ? 'grabbing' : 'default',
								userSelect: 'none'
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '12px 16px',
									borderBottom: '1px solid #f0f0f0',
									backgroundColor: '#fafafa',
									cursor: 'move',
									userSelect: 'none'
								}}
								onMouseDown={handleMouseDown}
							>
								<div style={{
									fontSize: '14px',
									fontWeight: '600',
									color: '#262626',
									flex: 1
								}}>
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
							<div style={{
								overflowY: 'auto',
								padding: '12px',
								flex: 1
							}}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
									{searchResults.map((result, index) => (
										<div
											key={index}
											onClick={() => {
												scrollToSearchResult(index);
											}}
											style={{
												padding: '8px 12px',
												cursor: 'pointer',
												borderRadius: '4px',
												backgroundColor: highlightedIndex === index ? '#e6f7ff' : '#fff',
												border: highlightedIndex === index ? '1px solid #1890ff' : '1px solid #f0f0f0',
												fontSize: '12px',
												lineHeight: '1.5',
												transition: 'all 0.2s'
											}}
											onMouseEnter={(e) => {
												if (highlightedIndex !== index) {
													e.currentTarget.style.backgroundColor = '#f5f5f5';
												}
											}}
											onMouseLeave={(e) => {
												if (highlightedIndex !== index) {
													e.currentTarget.style.backgroundColor = '#fff';
												}
											}}
										>
											<div style={{
												color: '#666',
												marginBottom: '4px',
												fontSize: '11px'
											}}>
												Kết quả {index + 1}
											</div>
											<div
												style={{
													color: '#262626',
													lineHeight: '1.6'
												}}
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
				</div>
			</Modal>

			{/* Theory Item Modal */}
			<Modal
				title={
					theoryModalItem && (
						<div style={{ display: 'flex', gap: '12px' }}>
							<div style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								fontWeight: '600',
								color: '#262626'
							}}>
								<span style={{ fontSize: '18px' }}>Lý thuyết</span>
								<span>{'>'}</span>
								<span style={{
									fontSize: '16px',
									maxWidth: '600px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap'
								}}>
									{theoryModalItem.title}
								</span>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<Input
									placeholder="Tìm kiếm trong nội dung..."
									prefix={<SearchOutlined />}
									value={modalSearchText}
									onChange={(e) => setModalSearchText(e.target.value)}
									allowClear
									style={{ flex: 1, maxWidth: '400px' }}
									onPressEnter={() => {
										if (searchResults.length > 0) {
											scrollToSearchResult(highlightedIndex >= 0 ? highlightedIndex : 0);
										}
									}}
								/>
								{searchResults.length > 0 && (
									<>
										<Button
											size="small"
											onClick={() => navigateSearchResult(-1)}
											disabled={searchResults.length === 0}
											style={{ minWidth: '32px', padding: '0 8px' }}
										>
											↑
										</Button>
										<span
											style={{
												fontSize: '12px',
												color: '#666',
												minWidth: '50px',
												textAlign: 'center',
												cursor: 'pointer'
											}}
											onClick={() => setShowSearchResultsPanel(!showSearchResultsPanel)}
											title="Xem danh sách kết quả"
										>
											{highlightedIndex + 1} / {searchResults.length}
										</span>
										<Button
											size="small"
											onClick={() => navigateSearchResult(1)}
											disabled={searchResults.length === 0}
											style={{ minWidth: '32px', padding: '0 8px' }}
										>
											↓
										</Button>
									</>
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
				width={theoryModalItem?.hasTitle ? 1400 : 1000}
				style={{
					top: '0px',
					paddingBottom: '0px'
				}}
				destroyOnClose={true}
				maskClosable={true}
				closable={true}
				className={newsTabStyles.modalContent}
			>
				<div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'auto', position: 'relative' }}>
					<div style={theoryModalItem?.hasTitle ? { flex: 1, padding: '20px' } : { padding: '20px', width: '100%' }}>
						{theoryModalLoading ? (
							<div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
						) : (
							renderContentPanel(theoryModalItem)
						)}
					</div>
					{theoryModalItem?.hasTitle && (
						<div style={{ width: '25%', borderLeft: '1px solid #f0f0f0', overflowY: 'auto' }}>
							{renderTOCSidebar(theoryModalItem)}
						</div>
					)}

					{/* Floating Search Results Panel */}
					{searchResults.length > 0 && showSearchResultsPanel && (
						<div
							ref={panelRef}
							style={{
								position: 'fixed',
								top: `${panelPosition.y}px`,
								left: `${panelPosition.x}px`,
								width: '350px',
								maxHeight: '70vh',
								backgroundColor: '#fff',
								border: '1px solid #d9d9d9',
								borderRadius: '8px',
								boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
								zIndex: 1000,
								display: 'flex',
								flexDirection: 'column',
								overflow: 'hidden',
								cursor: isDragging ? 'grabbing' : 'default',
								userSelect: 'none'
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '12px 16px',
									borderBottom: '1px solid #f0f0f0',
									backgroundColor: '#fafafa',
									cursor: 'move',
									userSelect: 'none'
								}}
								onMouseDown={handleMouseDown}
							>
								<div style={{
									fontSize: '14px',
									fontWeight: '600',
									color: '#262626',
									flex: 1
								}}>
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
							<div style={{
								overflowY: 'auto',
								padding: '12px',
								flex: 1
							}}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
									{searchResults.map((result, index) => (
										<div
											key={index}
											onClick={() => {
												scrollToSearchResult(index);
											}}
											style={{
												padding: '8px 12px',
												cursor: 'pointer',
												borderRadius: '4px',
												backgroundColor: highlightedIndex === index ? '#e6f7ff' : '#fff',
												border: highlightedIndex === index ? '1px solid #1890ff' : '1px solid #f0f0f0',
												fontSize: '12px',
												lineHeight: '1.5',
												transition: 'all 0.2s'
											}}
											onMouseEnter={(e) => {
												if (highlightedIndex !== index) {
													e.currentTarget.style.backgroundColor = '#f5f5f5';
												}
											}}
											onMouseLeave={(e) => {
												if (highlightedIndex !== index) {
													e.currentTarget.style.backgroundColor = '#fff';
												}
											}}
										>
											<div style={{
												color: '#666',
												marginBottom: '4px',
												fontSize: '11px'
											}}>
												Kết quả {index + 1}
											</div>
											<div
												style={{
													color: '#262626',
													lineHeight: '1.6'
												}}
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
				</div>
			</Modal>

			{/* Case Item Modal */}
			<Modal
				title={
					caseModalItem && (
						<div style={{ display: 'flex', gap: '12px' }}>
							<div style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								fontWeight: '600',
								color: '#262626'
							}}>
								<span style={{ fontSize: '18px' }}>Case Study</span>
								<span>{'>'}</span>
								<span style={{
									fontSize: '16px',
									maxWidth: '600px',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap'
								}}>
									{caseModalItem.title}
								</span>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<Input
									placeholder="Tìm kiếm trong nội dung..."
									prefix={<SearchOutlined />}
									value={caseModalSearchText}
									onChange={(e) => setCaseModalSearchText(e.target.value)}
									allowClear
									style={{ flex: 1, maxWidth: '400px' }}
									onPressEnter={() => {
										if (caseSearchResults.length > 0) {
											scrollToCaseSearchResult(caseHighlightedIndex >= 0 ? caseHighlightedIndex : 0);
										}
									}}
								/>
								{caseSearchResults.length > 0 && (
									<>
										<Button
											size="small"
											onClick={() => navigateCaseSearchResult(-1)}
											disabled={caseSearchResults.length === 0}
											style={{ minWidth: '32px', padding: '0 8px' }}
										>
											↑
										</Button>
										<span
											style={{
												fontSize: '12px',
												color: '#666',
												minWidth: '50px',
												textAlign: 'center',
												cursor: 'pointer'
											}}
											onClick={() => setCaseShowSearchResultsPanel(!caseShowSearchResultsPanel)}
											title="Xem danh sách kết quả"
										>
											{caseHighlightedIndex + 1} / {caseSearchResults.length}
										</span>
										<Button
											size="small"
											onClick={() => navigateCaseSearchResult(1)}
											disabled={caseSearchResults.length === 0}
											style={{ minWidth: '32px', padding: '0 8px' }}
										>
											↓
										</Button>
									</>
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
				width={caseModalItem?.hasTitle ? 1500 : 1000}
				style={{
					top: '0px',
					paddingBottom: '0px'
				}}
				destroyOnClose={true}
				maskClosable={true}
				closable={true}
				className={newsTabStyles.modalContent}
			>
				<div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'auto', position: 'relative' }}>
					<div style={{ flex: 1, padding: '20px' }}>
						{caseModalLoading ? (
							<div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
						) : (
							renderCaseContentPanel(caseModalItem)
						)}
					</div>
					{caseModalItem?.hasTitle && (
						<div style={{ width: '25%', borderLeft: '1px solid #f0f0f0', overflowY: 'auto' }}>
							{renderCaseTOCSidebar(caseModalItem)}
						</div>
					)}

					{/* Floating Search Results Panel */}
					{caseSearchResults.length > 0 && caseShowSearchResultsPanel && (
						<div
							ref={casePanelRef}
							style={{
								position: 'fixed',
								top: `${casePanelPosition.y}px`,
								left: `${casePanelPosition.x}px`,
								width: '350px',
								maxHeight: '70vh',
								backgroundColor: '#fff',
								border: '1px solid #d9d9d9',
								borderRadius: '8px',
								boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
								zIndex: 1000,
								display: 'flex',
								flexDirection: 'column',
								overflow: 'hidden',
								cursor: caseIsDragging ? 'grabbing' : 'default',
								userSelect: 'none',
								willChange: caseIsDragging ? 'transform' : 'auto',
								transition: caseIsDragging ? 'none' : 'box-shadow 0.2s'
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '12px 16px',
									borderBottom: '1px solid #f0f0f0',
									backgroundColor: '#fafafa',
									cursor: 'move',
									userSelect: 'none'
								}}
								onMouseDown={handleCaseMouseDown}
							>
								<div style={{
									fontSize: '14px',
									fontWeight: '600',
									color: '#262626',
									flex: 1
								}}>
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
							<div style={{
								overflowY: 'auto',
								padding: '12px',
								flex: 1
							}}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
									{caseSearchResults.map((result, index) => (
										<div
											key={index}
											onClick={() => {
												scrollToCaseSearchResult(index);
											}}
											style={{
												padding: '8px 12px',
												cursor: 'pointer',
												borderRadius: '4px',
												backgroundColor: caseHighlightedIndex === index ? '#e6f7ff' : '#fff',
												border: caseHighlightedIndex === index ? '1px solid #1890ff' : '1px solid #f0f0f0',
												fontSize: '12px',
												lineHeight: '1.5',
												transition: 'all 0.2s'
											}}
											onMouseEnter={(e) => {
												if (caseHighlightedIndex !== index) {
													e.currentTarget.style.backgroundColor = '#f5f5f5';
												}
											}}
											onMouseLeave={(e) => {
												if (caseHighlightedIndex !== index) {
													e.currentTarget.style.backgroundColor = '#fff';
												}
											}}
										>
											<div style={{
												color: '#666',
												marginBottom: '4px',
												fontSize: '11px'
											}}>
												Kết quả {index + 1}
											</div>
											<div
												style={{
													color: '#262626',
													lineHeight: '1.6'
												}}
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
				</div>
			</Modal>

			{/* Preview File Modal */}
			<PreviewFileModal
				open={previewModalVisible}
				onClose={() => setPreviewModalVisible(false)}
				fileUrl={previewFile?.url}
				fileName={previewFile?.name}
				title={previewFile ? `${getFileIcon(previewFile.extension)} ${previewFile.name}` : 'Preview File'}
			/>

			{/* Feedback Modal */}
			{showFeedbackModal && (
				<FeedbackModal
					visible={showFeedbackModal}
					onClose={() => setShowFeedbackModal(false)}
					item={selectedLongFormItem || theoryModalItem || caseModalItem}
					currentUser={currentUser}
					activeTab={selectedLongFormItem ? 'longForm' : (theoryModalItem ? 'stream' : 'caseTraining')}
				/>
			)}

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
		</div>
	);
};

export default MapView;

