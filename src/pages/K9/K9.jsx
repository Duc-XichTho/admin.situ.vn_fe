import DOMPurify from 'dompurify';
import { marked } from 'marked';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { MyContext } from '../../MyContext';
import { getK9ByType } from '../../apis/k9Service.jsx';
import { getK9ByTypePublic, getSettingByTypePublic } from '../../apis/public/publicService.jsx';

import { getSettingByType } from '../../apis/settingService.jsx';
import { logout } from '../../apis/userService.jsx';
import BookLoader from '../../components/BookLoader/BookLoader.jsx';
import FirstTimePopup from '../../components/FirstTimePopup.jsx';
import styles from './K9.module.css';
import AiChatTab from './components/AiChatTab.jsx';
import CaseTrainingTab from './components/CaseTrainingTab.jsx';
import CaseUser from './components/CaseUser.jsx';
import CompanyReportTab from './components/CompanyReportTab.jsx';
import CountdownTimer from './components/ExpiryModal/CountdownTimer.jsx';
import ExpiryModal from './components/ExpiryModal/ExpiryModal.jsx';
import FloatButtons from './components/FloatButtons.jsx';
import HomeTab from './components/HomeTab.jsx';
import K9Header from './components/K9Header.jsx';
import K9Tabs from './components/K9Tabs.jsx';
import LibraryTab from './components/LibraryTab.jsx';
import NewsTab from './components/NewsTab.jsx';
import ReportOverviewCharts from './components/ReportOverviewCharts.jsx';
import ReportTab from './components/ReportTab.jsx';
import StoryTab from './components/StoryTab.jsx';
import ThesisTab from './components/ThesisTab.jsx';

const K9 = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [activeTab, setActiveTab] = useState('home');
	const [expandedItem, setExpandedItem] = useState(null);
	const [showDetailId, setShowDetailId] = useState(null);
	const [loading, setLoading] = useState(false);
	const [newsItems, setNewsItems] = useState([]);
	const [longFormItems, setLongFormItems] = useState([]);
	const [libraryItems, setLibraryItems] = useState([]);
	const [storyItems, setStoryItems] = useState([]);
	const [caseTrainingItems, setCaseTrainingItems] = useState([]);
	const [homeItems, setHomeItems] = useState([]);
	const [dropdownVisible, setDropdownVisible] = useState(false);
	const { currentUser, setCurrentUser } = useContext(MyContext);
	const [selectedProgram, setSelectedProgram] = useState(null);
	const [showFirstTimePopup, setShowFirstTimePopup] = useState(false);
	const [tabLoading, setTabLoading] = useState(false);

	// Search section toggle state
	const [showSearchSection, setShowSearchSection] = useState(true);

	// View mode state (list or grid) - only for desktop stream tab
	const [viewMode, setViewMode] = useState(() => {
		try {
			return localStorage.getItem('k9_view_mode') || 'grid';
		} catch {
			return 'grid';
		}
	});

	// Tag options for case training
	const [tag1Options, setTag1Options] = useState([]);
	const [tag2Options, setTag2Options] = useState([]);
	const [tag3Options, setTag3Options] = useState([]);
	const [tag4Options, setTag4Options] = useState([]);
	const [coursesOptions, setCoursesOptions] = useState([]);
	const [tag4Filter, setTag4Filter] = useState('all');

	// Home filters state
	const [homeFilters, setHomeFilters] = useState({
		time: 'all',
		category: 'all',
		filter: 'all',
		search: '',
	});


	// Audio player states
	const [currentPlayingId, setCurrentPlayingId] = useState(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const audioRef = useRef(null);

	// Background audio states
	const [bgAudioSettings, setBgAudioSettings] = useState({
		enabled: false,
		audioUrl: '',
		volume: 0.5,
	});
	const bgAudioRef = useRef(null);

	// 7start audio ref
	const startAudioRef = useRef(null);


	// Reset expanded item when changing tabs
	const handleTabChange = (tab) => {
		setTabLoading(true);
		setActiveTab(tab);
		setExpandedItem(null);
		setShowDetailId(null);

		// Stop any playing audio when changing tabs
		if (audioRef.current) {
			audioRef.current.pause();
			setIsPlaying(false);
			setCurrentPlayingId(null);
		}

		// Stop 7start audio when changing tabs
		if (startAudioRef.current) {
			startAudioRef.current.pause();
		}

		// Stop background audio when changing tabs
		stopBackgroundAudio();

		// Scroll to top when changing tabs for better UX
		window.scrollTo({ top: 0, behavior: 'smooth' });

		// Update URL
		updateURL({ tab, item: null });

		// Simulate loading time for better UX
		setTimeout(() => {
			setTabLoading(false);
		}, 800);
	};
	// Separate filter states for each tab
	const [streamFilters, setStreamFilters] = useState({
		time: 'all',
		category: 'all',
		filter: 'all',
		search: '',
	});

	const [longFormFilters, setLongFormFilters] = useState({
		time: 'all',
		category: 'all',
		filter: 'all',
		search: '',
	});

	const [libraryFilters, setLibraryFilters] = useState({
		category: 'all',
		search: '',
	});

	const [storyFilters, setStoryFilters] = useState({
		time: 'all',
		category: 'all',
		search: '',
	});

	const [caseTrainingFilters, setCaseTrainingFilters] = useState({
		tag1: [],
		tag2: [],
		tag3: [],
		search: '',
	});

	const [reportFilters, setReportFilters] = useState({
		search: '',
		category: 'all',
	});
	const [reportItems, setReportItems] = useState([]);
	const [filteredReports, setFilteredReports] = useState([]);
	const [reportLoading, setReportLoading] = useState(false);
	const [companyReportItems, setCompanyReportItems] = useState([]);
	const [companyReportLoading, setCompanyReportLoading] = useState(false);
	const [reportOverviewData, setReportOverviewData] = useState(null);

	// Modal Phân tích doanh nghiệp (Company Report) chỉ admin thấy qua header menu
	const [showCompanyReportModal, setShowCompanyReportModal] = useState(false);


	// Load data from API
	const loadData = async () => {
		setLoading(true);
		try {
			const [newsData, libraryData, storyData, caseTrainingData, longFormData, homeData] = await Promise.all([
				getK9ByTypePublic('news'),
				getK9ByTypePublic('library'),
				getK9ByTypePublic('story'),
				getK9ByTypePublic('caseTraining'),
				getK9ByTypePublic('longForm'),
				getK9ByTypePublic('home'),
			]);
			if (currentUser?.account_type === 'Dùng thử') {
				// Sort: isPublic = true lên trước, isPublic = false xuống sau
				// b.isPublic - a.isPublic: true (1) - false (0) = 1, nên true sẽ đứng trước
				newsData.sort((a, b) => (b.isPublic ? 1 : 0) - (a.isPublic ? 1 : 0));
				caseTrainingData.sort((a, b) => (b.isPublic ? 1 : 0) - (a.isPublic ? 1 : 0));
				longFormData.sort((a, b) => (b.isPublic ? 1 : 0) - (a.isPublic ? 1 : 0));
				homeData.sort((a, b) => (b.isPublic ? 1 : 0) - (a.isPublic ? 1 : 0));
			}
			setNewsItems(newsData || []);
			// setLibraryItems(libraryData || []);
			// setStoryItems(storyData || []);
			setCaseTrainingItems(caseTrainingData || []);
			setLongFormItems(longFormData || []);
			setHomeItems(homeData || []);
		} catch (error) {
			console.error('Error loading K9 data:', error);
			// Set empty arrays as fallback
			setNewsItems([]);
			setLibraryItems([]);
			setStoryItems([]);
			setCaseTrainingItems([]);
			setHomeItems([]);
		} finally {
			setLoading(false);
		}
	};

	// Load tag options for case training
	const loadTagOptions = async () => {
		try {
			// Load TAG1_OPTIONS (Categories)
			const tag1Setting = await getSettingByTypePublic('TAG1_OPTIONS');
			if (tag1Setting?.setting?.options) {
				setTag1Options(tag1Setting.setting.options);
			} else {
				// Set default options if none exist
				const defaultTag1Options = [
					{ value: 'beginner', label: 'Beginner' },
					{ value: 'intermediate', label: 'Intermediate' },
					{ value: 'advanced', label: 'Advanced' },
				];
				setTag1Options(defaultTag1Options);
			}

			// Load TAG2_OPTIONS (Levels)
			const tag2Setting = await getSettingByTypePublic('TAG2_OPTIONS');
			if (tag2Setting?.setting?.options) {
				setTag2Options(tag2Setting.setting.options);
			} else {
				// Set default options if none exist
				const defaultTag2Options = [
					{ value: 'basic', label: 'Basic' },
					{ value: 'intermediate', label: 'Intermediate' },
					{ value: 'expert', label: 'Expert' },
				];
				setTag2Options(defaultTag2Options);
			}

			// Load TAG3_OPTIONS (Series)
			const tag3Setting = await getSettingByTypePublic('TAG3_OPTIONS');
			if (tag3Setting?.setting?.options) {
				setTag3Options(tag3Setting.setting.options);
			} else {
				// Set default options if none exist
				const defaultTag3Options = [
					{ value: 'series1', label: 'Series 1' },
					{ value: 'series2', label: 'Series 2' },
					{ value: 'series3', label: 'Series 3' },
				];
				setTag3Options(defaultTag3Options);
			}

			// Load TAG4_OPTIONS (Programs)
			const tag4Setting = await getSettingByTypePublic('TAG4_OPTIONS');
			if (tag4Setting?.setting) {
				setTag4Options(tag4Setting.setting);
			}

			// Load COURSES_OPTIONS (Học phần)
			const coursesSetting = await getSettingByTypePublic('COURSES_OPTIONS');
			if (coursesSetting?.setting) {
				setCoursesOptions(coursesSetting.setting);
			}
		} catch (error) {
			console.error('Error loading tag options:', error);
			// Set default options on error
			setTag1Options([
				{ value: 'beginner', label: 'Beginner' },
				{ value: 'intermediate', label: 'Intermediate' },
				{ value: 'advanced', label: 'Advanced' },
			]);
			setTag2Options([
				{ value: 'basic', label: 'Basic' },
				{ value: 'intermediate', label: 'Intermediate' },
				{ value: 'expert', label: 'Expert' },
			]);
			setTag3Options([
				{ value: 'series1', label: 'Series 1' },
				{ value: 'series2', label: 'Series 2' },
				{ value: 'series3', label: 'Series 3' },
			]);
			setTag4Options([
				{ value: 'Program 1', label: 'Program 1' },
				{ value: 'Program 2', label: 'Program 2' },
				{ value: 'Program 3', label: 'Program 3' },
				{ value: 'Program 4', label: 'Program 4' },
				{ value: 'Program 5', label: 'Program 5' },
			]);
		}
	};

	// Load AI Summary data
	const loadReportData = async () => {
		setReportLoading(true);
		try {
			const { getAllAISummaries } = await import('../../apis/aiSummaryService');
			const data = await getAllAISummaries();

			// Filter out items with "draft" and "archived" status, only show "published" items
			const publishedData = (data || []).filter(item => item.status === 'published');

			setReportItems(publishedData);
			setFilteredReports(publishedData);
		} catch (error) {
			console.error('Error loading report data:', error);
			setReportItems([]);
			setFilteredReports([]);
		} finally {
			setReportLoading(false);
		}
	};

	// Load Company Report data
	const loadCompanyReportData = async () => {
		setCompanyReportLoading(true);
		try {
			const { getAllAISummaries } = await import('../../apis/aiSummaryService');
			const data = await getAllAISummaries();

			// Filter only company reports
			const companyReports = data?.filter(item => {
				try {
					const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
					return info?.sheetName === 'company_report';
				} catch (error) {
					return false;
				}
			}) || [];

			setCompanyReportItems(companyReports);
		} catch (error) {
			console.error('Error loading company report data:', error);
			setCompanyReportItems([]);
		} finally {
			setCompanyReportLoading(false);
		}
	};

	// Load background audio settings
	const loadBackgroundAudioSettings = async () => {
		try {
			const settings = await getSettingByTypePublic('BACKGROUND_AUDIO');
			if (settings?.setting) {
				setBgAudioSettings(settings.setting);
			} else {
				console.log('🎵 No background audio settings found');
			}
		} catch (error) {
			console.log('🎵 Error loading background audio settings:', error);
		}
	};

	// Load report overview settings
	const loadReportOverviewSettings = async () => {
		try {
			const settings = await getSettingByTypePublic('REPORT_OVERVIEW');
			if (settings?.setting) {
				setReportOverviewData(settings.setting);
			} else {
				console.log('📊 No report overview settings found');
			}
		} catch (error) {
			console.log('📊 Error loading report overview settings:', error);
		}
	};

	// Play background audio
	const playBackgroundAudio = async () => {

		if (!bgAudioSettings.enabled) {
			console.log('🎵 Background audio is disabled');
			return;
		}

		if (!bgAudioSettings.audioUrl) {
			console.log('🎵 No background audio URL');
			return;
		}

		try {
			// Stop existing background audio if playing
			if (bgAudioRef.current) {
				bgAudioRef.current.pause();
			}

			const bgAudio = new Audio(bgAudioSettings.audioUrl);
			bgAudioRef.current = bgAudio;
			bgAudio.volume = bgAudioSettings.volume || 0.5;
			bgAudio.loop = true;

			// Add error handling for the audio element
			bgAudio.onerror = (e) => {
				console.error('🎵 Background audio error:', e);
			};

			bgAudio.oncanplaythrough = () => {
			};

			await bgAudio.play();
		} catch (error) {
			console.error('🎵 Error playing background audio:', error);
		}
	};

	// Stop background audio
	const stopBackgroundAudio = () => {
		if (bgAudioRef.current) {
			bgAudioRef.current.pause();
		}
	};

	// Pause background audio
	const pauseBackgroundAudio = () => {
		if (bgAudioRef.current) {
			bgAudioRef.current.pause();
		}
	};

	// Resume background audio
	const resumeBackgroundAudio = async () => {
		if (bgAudioRef.current) {
			try {
				await bgAudioRef.current.play();
			} catch (error) {
				console.error('🎵 Error resuming background audio:', error);
			}
		}
	};

	// Play 7start.MP3 before story
	const play7StartAudio = () => {
		return new Promise((resolve, reject) => {
			try {
				// Stop existing 7start audio if playing
				if (startAudioRef.current) {
					startAudioRef.current.pause();
				}

				const startAudio = new Audio('/7sstart.MP3');
				startAudioRef.current = startAudio;
				startAudio.volume = 0.8; // Slightly louder for intro effect

				startAudio.onended = () => {
					resolve();
				};

				startAudio.onerror = (e) => {
					reject(e);
				};

				startAudio.play();
			} catch (error) {
				console.error('🎵 Error playing 7start audio:', error);
				reject(error);
			}
		});
	};

	// Filter functions
	const getFilteredItems = (items, currentFilters, tag4Filter) => {
		return items.filter(item => {
			// Chỉ hiển thị news đã xuất bản và impact khác 'skip'
			if (item.status !== 'published' || item.impact === 'skip') {
				return false;
			}

			// Tag4 filter (for news, longForm, caseTraining)
			if (tag4Filter && tag4Filter !== 'all') {
				if (!Array.isArray(item.tag4)) return false; // bỏ qua nếu không phải mảng

				// Support both string and array for tag4Filter
				if (Array.isArray(tag4Filter)) {
					if (!tag4Filter.some(prog => item.tag4.includes(prog))) {
						return false;
					}
				} else {
					if (!item.tag4.includes(tag4Filter)) {
						return false;
					}
				}
			}

			// Time filter dựa vào createdAt
			if (currentFilters.time && currentFilters.time !== 'all' && item.createdAt) {
				const itemDate = new Date(item.createdAt);
				const now = new Date();
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				const yesterday = new Date(today);
				yesterday.setDate(today.getDate() - 1);
				const weekAgo = new Date(today);
				weekAgo.setDate(today.getDate() - 7);

				switch (currentFilters.time) {
					case 'today':
						if (itemDate < today) return false;
						break;
					case 'yesterday':
						if (itemDate < yesterday || itemDate >= today) return false;
						break;
					case 'week':
						if (itemDate < weekAgo) return false;
						break;
				}
			}

			// Category filter
			if (currentFilters.category !== 'all' && item.category !== currentFilters.category) {
				return false;
			}

			// Sentiment/Impact filter (for news)
			if (currentFilters.filter !== 'all') {
				switch (currentFilters.filter) {
					case 'positive':
						if (item.sentiment !== 'positive') return false;
						break;
					case 'negative':
						if (item.sentiment !== 'negative') return false;
						break;
					case 'important':
						if (item.impact !== 'important') return false;
						break;
				}
			}

			// Tag1 filter (for case training)
			if (currentFilters.tag1 && currentFilters.tag1 !== 'all' && item.tag1 !== currentFilters.tag1) {
				return false;
			}

			// Tag2 filter (for case training)
			if (currentFilters.tag2 && currentFilters.tag2 !== 'all' && item.tag2 !== currentFilters.tag2) {
				return false;
			}

			// Tag3 filter (for case training)
			if (currentFilters.tag3 && currentFilters.tag3 !== 'all' && item.tag3 !== currentFilters.tag3) {
				return false;
			}


			// Search filter
			if (currentFilters.search) {
				const searchTerm = currentFilters.search.toLowerCase();

				const id = (item.id || '');   // ép id sang string để tránh lỗi
				const title = item.title || '';
				const summary = item.summary || '';
				const description = item.description || '';
				const detail = item.detail || '';

				const searchableText = `${id} ${title} ${summary} ${description} ${detail}`.toLowerCase();

				if (!searchableText.includes(searchTerm)) {
					return false;
				}
			}

			return true;
		});
	};

	// Filter handlers for each tab
	const handleStreamFilterChange = (filterType, value) => {
		setStreamFilters(prev => ({
			...prev,
			[filterType]: value,
		}));
	};

	const handleLongFormFilterChange = (filterType, value) => {
		setLongFormFilters(prev => ({
			...prev,
			[filterType]: value,
		}));
	};


	const handleStreamSearchChange = (e) => {
		setStreamFilters(prev => ({
			...prev,
			search: e.target.value,
		}));
	};

	const handleLongFormSearchChange = (e) => {
		setLongFormFilters(prev => ({
			...prev,
			search: e.target.value,
		}));
	};

	const handleLibraryFilterChange = (filterType, value) => {
		setLibraryFilters(prev => ({
			...prev,
			[filterType]: value,
		}));
	};

	const handleLibrarySearchChange = (e) => {
		setLibraryFilters(prev => ({
			...prev,
			search: e.target.value,
		}));
	};

	const handleStoryFilterChange = (filterType, value) => {
		setStoryFilters(prev => ({
			...prev,
			[filterType]: value,
		}));
	};

	const handleStorySearchChange = (e) => {
		setStoryFilters(prev => ({
			...prev,
			search: e.target.value,
		}));
	};

	const handleCaseTrainingFilterChange = (filterType, value) => {
		setCaseTrainingFilters(prev => ({
			...prev,
			[filterType]: value,
		}));
	};

	const handleCaseTrainingSearchChange = (e) => {
		setCaseTrainingFilters(prev => ({
			...prev,
			search: e.target.value,
		}));
	};

	const handleReportFilterChange = (filterType, value) => {
		const newFilters = {
			...reportFilters,
			[filterType]: value,
		};
		setReportFilters(newFilters);
		applyReportFilters(reportItems, newFilters);
	};

	const handleReportSearchChange = (e) => {
		const searchTerm = e.target.value;
		setReportFilters(prev => ({
			...prev,
			search: searchTerm,
		}));

		applyReportFilters(reportItems, { ...reportFilters, search: searchTerm });
	};

	const applyReportFilters = (items, filters) => {
		let filtered = items;

		// Search filter
		if (filters.search && filters.search.trim()) {
			const searchTerm = filters.search.toLowerCase();
			filtered = filtered.filter(item => {
				try {
					const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
					const title = info?.title || '';
					const summary = item.summary1 || '';
					const detail = item.summary2 || '';

					const searchableText = `${title} ${summary} ${detail}`.toLowerCase();
					return searchableText.includes(searchTerm);
				} catch (error) {
					return false;
				}
			});
		}

		// Category filter
		if (filters.category && filters.category !== 'all') {
			filtered = filtered.filter(item => {
				return item.category === filters.category;
			});
		}

		setFilteredReports(filtered);
	};

	// Home filter handlers
	const handleHomeFilterChange = (filterType, value) => {
		setHomeFilters(prev => ({
			...prev,
			[filterType]: value,
		}));
	};

	const handleHomeSearchChange = (e) => {
		setHomeFilters(prev => ({
			...prev,
			search: e.target.value,
		}));
	};

	const handleItemClick = (item) => {

		const newExpandedItem = item?.id;
		setExpandedItem(newExpandedItem);

		// Reset detail view when collapsing or switching to another item
		if (newExpandedItem !== item?.id) {
			setShowDetailId(null);
		}

		// Update URL with expanded item
		updateURL({ item: newExpandedItem });
	};

	const showDetail = (item, e) => {
		e.stopPropagation();
		setShowDetailId(showDetailId === item.id ? null : item.id);
	};

	const openSource = (item, e) => {
		e.stopPropagation();
		if (item.source) {
			window.open(item.source, '_blank', 'noopener,noreferrer');
		}
	};

	const learnMore = (item, e) => {
		e.stopPropagation();
		alert(`Tìm hiểu thêm: ${item.title.substring(0, 50)}...`);
	};

	const handleOpenFile = (item, e) => {
		e.stopPropagation();
		try {
			const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
			if (info?.URLReport) {
				window.open(info.URLReport, '_blank', 'noopener,noreferrer');
			}
		} catch (error) {
			console.error('Error opening file:', error);
		}
	};

	const playStory = async (item, e) => {
		e.stopPropagation();

		// Nếu đang phát cùng một audio thì pause/resume
		if (currentPlayingId === item.id) {
			if (isPlaying) {
				audioRef.current?.pause();
				setIsPlaying(false);
				// Pause nhạc nền khi pause story
				pauseBackgroundAudio();
			} else {
				try {
					await audioRef.current?.play();
					setIsPlaying(true);
					// Resume nhạc nền khi resume story
					await resumeBackgroundAudio();
				} catch (error) {
					console.error('Error resuming audio:', error);
					alert('Không thể phát audio!');
				}
			}
			return;
		}

		// Nếu đang phát audio khác thì dừng và phát audio mới
		if (audioRef.current) {
			audioRef.current.pause();
		}

		// Stop 7start audio if playing
		if (startAudioRef.current) {
			startAudioRef.current.pause();
		}

		// Stop existing background audio
		stopBackgroundAudio();

		setIsLoading(true);
		setCurrentPlayingId(item.id);

		try {
			await playBackgroundAudio();
			await play7StartAudio();
			const audio = new Audio(item.audioUrl);
			audioRef.current = audio;

			// Xử lý events
			audio.onloadstart = () => setIsLoading(true);
			audio.oncanplay = () => setIsLoading(false);
			audio.onplay = () => {
				setIsPlaying(true);
			};
			audio.onpause = () => {
				setIsPlaying(false);
				pauseBackgroundAudio();
			};
			audio.onended = () => {
				setIsPlaying(false);
				setCurrentPlayingId(null);
				stopBackgroundAudio();
			};
			audio.onerror = () => {
				setIsLoading(false);
				setIsPlaying(false);
				setCurrentPlayingId(null);
				stopBackgroundAudio();
				alert('Không thể tải audio!');
			};

			// Phát audio của story
			await audio.play();

		} catch (error) {
			console.error('Error playing audio:', error);
			setIsLoading(false);
			setCurrentPlayingId(null);
			stopBackgroundAudio();

			// If 7start failed, try playing story directly
			if (error.message && error.message.includes('7start')) {
				try {
					const audio = new Audio(item.audioUrl);
					audioRef.current = audio;
					await audio.play();
					setIsPlaying(true);
					// Start background audio even if 7start failed
					await playBackgroundAudio();
				} catch (storyError) {
					console.error('Story audio also failed:', storyError);
					alert('Không thể phát audio!');
				}
			} else {
				alert('Không thể phát audio!');
			}
		}
	};

	const stopStory = (e) => {
		e.stopPropagation();

		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0; // Reset về đầu
		}

		// Stop 7start audio if playing
		if (startAudioRef.current) {
			startAudioRef.current.pause();
		}

		// Stop nhạc nền khi stop story
		stopBackgroundAudio();

		setIsPlaying(false);
		setCurrentPlayingId(null);
		setIsLoading(false);
	};

	useEffect(() => {
		loadData();
	}, [currentUser]);

	useEffect(() => {
		loadReportData();
		// loadCompanyReportData();
		loadBackgroundAudioSettings();
		loadReportOverviewSettings();
		loadTagOptions(); // Call loadTagOptions here

		// Apply URL state on initial load
		const urlParams = parseURLParams(window.location);
		if (urlParams.tab || urlParams.item || urlParams.program) {
			applyURLState(urlParams);
		}
	}, []);

	// Listen for AI summaries updates
	useEffect(() => {
		const handleAISummariesUpdate = (event) => {
			const { summaries } = event.detail;
			if (summaries) {
				// Update reportItems with new summaries
				const publishedData = (summaries || []).filter(item => item.status === 'published');
				setReportItems(publishedData);
				setFilteredReports(publishedData);

				// Update company report items
				const companyReports = summaries?.filter(item => {
					try {
						const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
						return info?.sheetName === 'company_report';
					} catch (error) {
						return false;
					}
				}) || [];
				setCompanyReportItems(companyReports);
			}
		};

		window.addEventListener('aiSummariesUpdated', handleAISummariesUpdate);

		return () => {
			window.removeEventListener('aiSummariesUpdated', handleAISummariesUpdate);
		};
	}, []);

	// Reload background audio settings when coming back to the page
	useEffect(() => {
		const handleFocus = () => {
			loadBackgroundAudioSettings();
		};

		window.addEventListener('focus', handleFocus);

		return () => {
			window.removeEventListener('focus', handleFocus);
		};
	}, []);

	// Listen for URL changes
	// useEffect(() => {
	// 	const handlePopState = () => {
	// 		const urlParams = parseURLParams();
	// 		applyURLState(urlParams);
	// 	};

	// 	window.addEventListener('popstate', handlePopState);
	// 	return () => {
	// 		window.removeEventListener('popstate', handlePopState);
	// 	};
	// }, [activeTab, selectedProgram]);

	// Cleanup audio when component unmounts
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
			if (bgAudioRef.current) {
				bgAudioRef.current.pause();
				bgAudioRef.current = null;
			}
			if (startAudioRef.current) {
				startAudioRef.current.pause();
				startAudioRef.current = null;
			}
		};
	}, []);

	// Check if first time popup should be shown
	useEffect(() => {
		console.log('🔍 K9: Checking if first time popup should be shown...');
		const hasSeenPopup = localStorage.getItem('firstTimeHomePopup');
		console.log('📦 K9: localStorage value for firstTimeHomePopup:', hasSeenPopup);

		if (!hasSeenPopup) {
			console.log('✅ K9: User has not seen popup before, will show it');
			// Show popup after a short delay to ensure page is loaded
			const timer = setTimeout(() => {
				console.log('⏰ K9: Timer finished, setting showFirstTimePopup to true');
				setShowFirstTimePopup(true);
			}, 1000);
			return () => clearTimeout(timer);
		} else {
			console.log('❌ K9: User has already seen the popup, not showing');
		}
	}, []);

	const filteredNews = getFilteredItems(newsItems, streamFilters, tag4Filter);
	const filteredLongForm = getFilteredItems(longFormItems, longFormFilters, tag4Filter);
	const filteredLibrary = getFilteredItems(libraryItems, libraryFilters);
	const filteredStories = getFilteredItems(storyItems, storyFilters);
	const filteredCaseTraining = getFilteredItems(caseTrainingItems, caseTrainingFilters, tag4Filter);
	const filteredHome = getFilteredItems(homeItems, homeFilters, tag4Filter);

	// Tab options (đã tách tab Phân tích doanh nghiệp ra khỏi đây, chỉ còn trong header menu)
	const tabOptions = [
		{ key: 'stream', label: 'Lý thuyết' },
		{ key: 'caseTraining', label: 'Case Study' },
		{ key: 'longForm', label: 'Business Wiki' },
		{ key: 'home', label: 'Về AiMBA' },
	];

	if (currentUser?.email) {
		tabOptions.splice(3, 0,
			{ key: 'caseUser', label: 'Case Builder' },
			{ key: 'ai', label: 'Deep Research' }
		);
	}

	// Helper function to get tab display name
	const getTabDisplayName = (tabKey) => {
		const tab = tabOptions.find(option => option.key === tabKey);
		return tab ? tab.label : tabKey;
	};


	// User actions
	const handleAdminNavigation = () => {
		navigate('/home-management');
	};

	const handleLogout = async () => {
		navigate('/');
		await logout();
		setCurrentUser(null);
	};

	const handleMenuClick = ({ key }) => {
		setDropdownVisible(false);
		if (key === 'logout') {
			handleLogout();
		} else if (key === 'user') {
			navigate('/user-management');
		} else if (key === 'management') {
			handleAdminNavigation();
		}
	};

	// Toggle search section
	const toggleSearchSection = () => {
		setShowSearchSection(!showSearchSection);
	};

	// Toggle view mode
	const toggleViewMode = () => {
		const newMode = viewMode === 'list' ? 'grid' : 'list';
		setViewMode(newMode);
		try {
			localStorage.setItem('k9_view_mode', newMode);
		} catch (e) {
			console.error('Error saving view mode:', e);
		}
	};

	// Create menu items based on user role
	const getMenuItems = () => {
		const items = [];

		if (currentUser?.isAdmin) {
			items.push({
				key: 'management',
				label: 'Content Management',
			});
			items.push({
				key: 'feedback',
				label: 'Feedback Management',
				onClick: () => {
					navigate('/feedback-management');
				},
			});
			items.push({
				key: 'user',
				label: 'User Management',
			});
			items.push({
				type: 'divider',
			});
			items.push({
				key: 'aiQuestionEvaluation',
				label: 'AI Đánh giá Câu hỏi',
				onClick: () => {
					navigate('/ai-question-evaluation');
				},
			});
			items.push({
				key: 'aiSummaryDetailGeneration',
				label: 'AI Tạo SummaryDetail',
				onClick: () => {
					navigate('/ai-summary-detail-generation');
				},
			});
			items.push({
				type: 'divider',
			});
			items.push({
				key: 'companyReportModal',
				label: 'Phân tích doanh nghiệp',
				onClick: () => {
					setShowCompanyReportModal(true);
				},
			});
			items.push({
				type: 'divider',
			});
		}
		const timerItem = {
			key: 'timer',
			label: <CountdownTimer />,
			disabled: true, // Không cho click
			style: { cursor: 'default' },
		};
		items.push(timerItem);

		items.push({
			key: 'logout',
			label: 'Logout',
		});

		return items;
	};

	const [showFullOverview, setShowFullOverview] = useState(false);

	// URL State Management Functions
	const updateURL = (newState) => {
		const url = new URL(window.location);
		if (newState.item !== undefined) {
			if (newState.item) url.searchParams.set('item', newState.item);
			else url.searchParams.delete('item');
		}
		// Update URL parameters
		if (newState.tab) url.searchParams.set('tab', newState.tab);
		if (newState.item) url.searchParams.set('item', newState.item);
		if (newState.program) url.searchParams.set('program', newState.program);

		// Remove empty parameters
		Array.from(url.searchParams.entries()).forEach(([key, value]) => {
			if (!value || value === 'all' || value === '') {
				url.searchParams.delete(key);
			}
		});

		// Update URL without reloading the page
		window.history.replaceState({}, '', url.toString());
	};

	const parseURLParams = (urlLocation) => {
		const url = new URL(urlLocation);
		const params = {};

		// Parse basic parameters
		params.tab = url.searchParams.get('tab') || 'home';
		params.item = url.searchParams.get('item');
		params.program = url.searchParams.get('program');

		return params;
	};

	const applyURLState = (params) => {
		if (params.tab && params.tab !== activeTab) {
			handleTabChange(params.tab);
		}

		if (params.program && params.program !== selectedProgram) {
			setSelectedProgram(params.program);
			localStorage.setItem('selectedProgram', params.program);

		}

		if (params.item) {
			setExpandedItem(params.item);
		}
	};


	const generateShareableLink = (item = null) => {
		const url = new URL(window.location);
		// Add current state
		url.searchParams.set('tab', activeTab);
		if (selectedProgram) url.searchParams.set('program', selectedProgram);
		if (item) url.searchParams.set('item', item.id);

		return url.toString();
	};

	const copyShareableLink = async (item = null) => {
		try {
			const link = generateShareableLink(item);
			await navigator.clipboard.writeText(link);
			alert('Đã copy link chia sẻ vào clipboard!');
		} catch (error) {
			console.error('Error copying link:', error);
			alert('Không thể copy link!');
		}
	};

	// Xử lý tách tiêu đề và nội dung cho overview
	let overviewTitle = null;
	let overviewRest = reportOverviewData && reportOverviewData.overview ? reportOverviewData.overview : '';

	if (overviewRest) {
		// Lấy dòng đầu tiên
		const firstLineEnd = overviewRest.indexOf('\n');
		const firstLine = firstLineEnd !== -1 ? overviewRest.slice(0, firstLineEnd) : overviewRest;
		const restContent = firstLineEnd !== -1 ? overviewRest.slice(firstLineEnd + 1) : '';

		// Regex: ### <TIÊU ĐỀ> - ... hoặc ## <TIÊU ĐỀ> - ...
		const match = firstLine.match(/^#+\s*<([^>]+)>\s*-\s*(.*)$/);
		if (match) {
			overviewTitle = match[1].trim();
			// Phần còn lại: "- ..." + các dòng sau
			overviewRest = (match[2] ? '- ' + match[2] : '') + (restContent ? '\n' + restContent : '');
		}
	}

	const isLong = overviewRest.length > 800;
	const displayedContent = !showFullOverview && isLong
		? overviewRest.slice(0, 800) + '...'
		: overviewRest;


	useEffect(() => {
		setTabLoading(true);
		setTimeout(() => {
			setTabLoading(false);
		}, 800);
	}, [selectedProgram]);

	return (
		<div className={styles.container}>
			{/* {
				showFirstTimePopup && (
					<FirstTimePopup
						visible={showFirstTimePopup}
						onClose={() => setShowFirstTimePopup(false)}
					/>
				)
			} */}
			<K9Header
				updateURL={updateURL}
				selectedProgram={selectedProgram}
				setSelectedProgram={setSelectedProgram}
				newsItems={newsItems}
				caseTrainingItems={caseTrainingItems}
				longFormItems={longFormItems}
				tag4Filter={tag4Filter}
				setTag4Filter={setTag4Filter}
				getMenuItems={getMenuItems}
				handleMenuClick={handleMenuClick}
				currentUser={currentUser}
				dropdownVisible={dropdownVisible}
				setDropdownVisible={setDropdownVisible}
				tag4Options={tag4Options}
				coursesOptions={coursesOptions}
				activeTab={activeTab}
				streamFilters={streamFilters}
				longFormFilters={longFormFilters}
				caseTrainingFilters={caseTrainingFilters}
				onStreamFilterChange={handleStreamFilterChange}
				onLongFormFilterChange={handleLongFormFilterChange}
				onCaseTrainingFilterChange={handleCaseTrainingFilterChange}
				showSearchSection={showSearchSection}
				toggleSearchSection={toggleSearchSection}
				viewMode={viewMode}
				toggleViewMode={toggleViewMode}
			/>

			<K9Tabs
				activeTab={activeTab}
				onTabChange={handleTabChange}
				tabOptions={tabOptions}
				newsItems={newsItems}
				caseTrainingItems={caseTrainingItems}
				longFormItems={longFormItems}
				selectedProgram={selectedProgram}
			/>

			{/* Tab Loading Overlay */}
			{tabLoading && (
				<div className={styles.tabLoadingOverlay}>
					<div className={styles.tabLoadingContent}>
						<BookLoader text="Đang tải dữ liệu..." />
					</div>
				</div>
			)}

			{/* Home Tab */}
			{activeTab === 'home' && (
				<HomeTab
					loading={loading}
					filteredNews={filteredHome}
					filters={homeFilters}
					expandedItem={expandedItem}
					showDetailId={showDetailId}
					onFilterChange={handleHomeFilterChange}
					onSearchChange={handleHomeSearchChange}
					onItemClick={handleItemClick}
					onShowDetail={showDetail}
					onOpenSource={openSource}
					onShare={copyShareableLink}
					activeTab={activeTab}
					totalCount={homeItems.filter(item => item.status === 'published').length}
					newsItems={homeItems}
					isHome={true}
					viewMode={viewMode}
					updateURL={updateURL}
					getTabDisplayName={getTabDisplayName}
				/>
			)}

			{/* Story Tab */}
			{activeTab === 'story' && (
				<StoryTab
					loading={loading}
					filteredStories={filteredStories}
					filters={storyFilters}
					expandedItem={expandedItem}
					showDetailId={showDetailId}
					currentPlayingId={currentPlayingId}
					isPlaying={isPlaying}
					isLoading={isLoading}
					onFilterChange={handleStoryFilterChange}
					onSearchChange={handleStorySearchChange}
					onItemClick={handleItemClick}
					onShowDetail={showDetail}
					onPlayStory={playStory}
					onStopStory={stopStory}
					totalCount={storyItems.filter(item => item.status === 'published').length}
					storyItems={storyItems}
				/>
			)}

			{/* Stream News Tab */}
			{activeTab === 'stream' && (
				<NewsTab
					currentTab={activeTab}
					setExpandedItem={setExpandedItem}
					updateURL={updateURL}
					selectedProgram={selectedProgram}
					loading={loading}
					filteredNews={filteredNews}
					filters={streamFilters}
					expandedItem={expandedItem}
					showDetailId={showDetailId}
					onFilterChange={handleStreamFilterChange}
					onSearchChange={handleStreamSearchChange}
					onItemClick={handleItemClick}
					onShowDetail={showDetail}
					onOpenSource={openSource}
					onShare={copyShareableLink}
					activeTab={activeTab}
					totalCount={newsItems.filter(item => item.status === 'published').length}
					newsItems={newsItems}
					showSearchSection={showSearchSection}
					viewMode={viewMode}
					getTabDisplayName={getTabDisplayName}
				/>
			)}

			{activeTab === 'longForm' && (
				<NewsTab
					currentTab={activeTab}
					setExpandedItem={setExpandedItem}
					updateURL={updateURL}
					selectedProgram={selectedProgram}
					loading={loading}
					filteredNews={filteredLongForm}
					filters={longFormFilters}
					expandedItem={expandedItem}
					showDetailId={showDetailId}
					onFilterChange={handleLongFormFilterChange}
					onSearchChange={handleLongFormSearchChange}
					onItemClick={handleItemClick}
					onShowDetail={showDetail}
					onOpenSource={openSource}
					onShare={copyShareableLink}
					activeTab={activeTab}
					totalCount={longFormItems.filter(item => item.status === 'published').length}
					newsItems={longFormItems}
					showSearchSection={showSearchSection}
					viewMode={viewMode}
					getTabDisplayName={getTabDisplayName}
				/>
			)}
			{/* Case Training Tab */}
			{activeTab === 'caseTraining' && (
				<CaseTrainingTab
					setExpandedItem={setExpandedItem}
					updateURL={updateURL}
					selectedProgram={selectedProgram}
					tag4Filter={tag4Filter}
					loading={loading}
					filteredCaseTraining={filteredCaseTraining}
					filters={caseTrainingFilters}
					expandedItem={expandedItem}
					showDetailId={showDetailId}
					onFilterChange={handleCaseTrainingFilterChange}
					onSearchChange={handleCaseTrainingSearchChange}
					onItemClick={handleItemClick}
					onShowDetail={showDetail}
					onOpenSource={openSource}
					activeTab={activeTab}
					totalCount={caseTrainingItems.filter(item => item.status === 'published').length}
					caseTrainingItems={caseTrainingItems}
					tag1Options={tag1Options}
					tag2Options={tag2Options}
					tag3Options={tag3Options}
					onShare={copyShareableLink}
					showSearchSection={showSearchSection}
					viewMode={viewMode}
					getTabDisplayName={getTabDisplayName}
				/>
			)}

			{activeTab === 'caseUser' && (
				<CaseUser
					loading={loading}
					filteredNews={filteredLongForm}
					filters={longFormFilters}
					showDetailId={showDetailId}
					onFilterChange={handleLongFormFilterChange}
					onSearchChange={handleLongFormSearchChange}
					onItemClick={handleItemClick}
					onShowDetail={showDetail}
					onOpenSource={openSource}
					activeTab={activeTab}
					totalCount={longFormItems.filter(item => item.status === 'published').length}
					newsItems={longFormItems}
				/>
			)}


			{/* Library Tab */}
			{activeTab === 'library' && (
				<LibraryTab
					loading={loading}
					filteredLibrary={filteredLibrary}
					filters={libraryFilters}
					onFilterChange={handleLibraryFilterChange}
					onSearchChange={handleLibrarySearchChange}
					onItemClick={handleItemClick}
					totalCount={libraryItems.filter(item => item.status === 'published').length}
					libraryItems={libraryItems}
				/>
			)}

			{/* Report Tab */}
			{activeTab === 'report' && (
				<div>
					{/* Report Overview Section */}
					{reportOverviewData && (
						<div style={{
							borderBottom: '1px solid #e8e8e8',
							marginBottom: '10px',
						}}>
							<div style={{
								maxWidth: '1200px',
								margin: '0 auto',
							}}>
								{/* Overview Text */}
								{reportOverviewData.overview && (
									<div style={{
										marginBottom: '10px',
										padding: '16px',
										backgroundColor: '#fff',
										borderRadius: '8px',
										border: '1px solid #e8e8e8',
									}}>
										{overviewTitle && (
											<div style={{
												fontSize: 20,
												fontWeight: 700,
												color: '#454545',
												padding: '5px 10px',
												background: 'rgba(189,196,189,0.3)',
												marginLeft: '10px',
												border: '1px solid #e8e8e8',
												display: 'inline-block',
												borderRadius: '5px',
											}}>
												{overviewTitle}
											</div>
										)}
										<div style={{ padding: '8px 48px' }}>
											<div
												className={styles.markdownContent}
												dangerouslySetInnerHTML={{
													__html: DOMPurify.sanitize(marked.parse(displayedContent)),
												}}
											/>
											{isLong && !showFullOverview && (
												<button
													style={{
														marginTop: 8,
														background: 'none',
														border: 'none',
														color: '#1890ff',
														cursor: 'pointer',
														padding: 0,
														fontSize: 14,
													}}
													onClick={() => setShowFullOverview(true)}
												>
													Xem thêm
												</button>
											)}
											{isLong && showFullOverview && (
												<button
													style={{
														marginTop: 8,
														background: 'none',
														border: 'none',
														color: '#1890ff',
														cursor: 'pointer',
														padding: 0,
														fontSize: 14,
													}}
													onClick={() => setShowFullOverview(false)}
												>
													Thu gọn
												</button>
											)}
										</div>
									</div>
								)}
								{/* Overview Charts */}
								<ReportOverviewCharts overviewData={reportOverviewData} />
							</div>
						</div>
					)}
					{/* Report List */}
					<ReportTab
						loading={reportLoading}
						filteredReports={filteredReports}
						filters={reportFilters}
						expandedItem={expandedItem}
						showDetailId={showDetailId}
						onFilterChange={handleReportFilterChange}
						onSearchChange={handleReportSearchChange}
						onItemClick={handleItemClick}
						onShowDetail={showDetail}
						onOpenFile={handleOpenFile}
						activeTab={activeTab}
						totalCount={reportItems.length}
						reportItems={reportItems}
					/>
				</div>
			)}

			{/* Thesis Tab */}
			{activeTab === 'thesis' && (
				<ThesisTab />
			)}

			{/* AI Chat Tab */}
			{activeTab === 'ai' && (
				<AiChatTab />
			)}

			{/* Expiry Modal */}
			<ExpiryModal />

			{/* Float Buttons */}
			<FloatButtons
				onShowGuideline={() => {
					localStorage.removeItem('firstTimeHomePopup');
					setShowFirstTimePopup(true);
				}}
			/>

			{/* Modal Phân tích doanh nghiệp - chỉ admin thấy trong header menu */}
			{currentUser?.isAdmin && (
				<Modal
					title="Phân tích doanh nghiệp"
					open={showCompanyReportModal}
					onCancel={() => setShowCompanyReportModal(false)}
					footer={null}
					width={1600}
					centered
					destroyOnClose
				>
					<CompanyReportTab
						loading={companyReportLoading}
						aiSummaries={reportItems}
						onOpenFile={handleOpenFile}
					/>
				</Modal>
			)}

			{/* First Time Popup */}


			{/* Debug info */}
		</div>
	);
};

export default K9;
