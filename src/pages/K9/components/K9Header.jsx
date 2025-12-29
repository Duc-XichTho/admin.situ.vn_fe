import { BookOutlined, DeleteOutlined, DownOutlined, HistoryOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Checkbox, Col, Divider, Dropdown, Empty, Form, Input, message, Modal, Radio, Row, Select, Spin, Statistic, Table, Tag, Tooltip, Typography, Upload } from 'antd';
import confetti from 'canvas-confetti';
import React, { useContext, useEffect, useState } from 'react';
import { getSettingByTypePublic } from '../../../apis/public/publicService.jsx';
import { getListQuestionHistoryByUser } from '../../../apis/questionHistoryService';
import { createOrUpdateSetting } from '../../../apis/settingService';
import { formatDateToDDMMYYYY } from '../../../generalFunction/format';
import { GridView_Icon, InfoScore_Icon, ListView_Icon, Program_Icon } from '../../../icon/IconSvg';
import { MyContext } from '../../../MyContext';
import styles from '../K9.module.css';

import { loginWithUsername, registerAccountPublic } from '../../../apis/public/publicService.jsx';
import { uploadFiles } from '../../../apis/uploadImageWikiNoteService';
import { updateUser } from '../../../apis/userService';
import PaymentModal from '../../../components/PaymentModal/PaymentModal.jsx';
import TermsModal from '../../../components/TermsModal/TermsModal.jsx';
import CertificateModal from './CertificateModal.jsx';
import homepageStyles from '../../Homepage/Homepage.module.css';
import newsTabStyles from './NewsTab.module.css';
const { Option } = Select;

const K9Header = ({
	headerStats,
	setHeaderStats,
	updateURL,
	newsItems,
	caseTrainingItems,
	longFormItems,
	tag4Filter,
	setTag4Filter,
	getMenuItems,
	handleMenuClick,
	currentUser,
	dropdownVisible,
	setDropdownVisible,
	tag4Options,
	coursesOptions,
	activeTab,
	streamFilters,
	longFormFilters,
	caseTrainingFilters,
	onStreamFilterChange,
	onLongFormFilterChange,
	onCaseTrainingFilterChange,
	selectedProgram,
	setSelectedProgram,
	showSearchSection,
	toggleSearchSection,
	viewMode,
	toggleViewMode,

}) => {
	const { loadQuiz, setLoadQuiz, fetchCurrentUser } = useContext(MyContext)
	const [isMobile, setIsMobile] = useState(false);
	const [programNameMaxWidth, setProgramNameMaxWidth] = useState('200px');
	const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

	useEffect(() => {
		// Auto open history modal if share param present and not expired
		try {
			const params = new URLSearchParams(window.location.search);
			const sharedUserId = params.get('history_user');
			const sharedExp = params.get('exp');
			const sharedProgram = params.get('history_program');
			if (sharedUserId) {
				let allowByExp = true;
				if (sharedExp) {
					const expMs = Number(sharedExp);
					if (!isNaN(expMs)) allowByExp = Date.now() <= expMs;
				}
				if (allowByExp) {
					if (sharedProgram) {
						setHistoryProgramFilter(sharedProgram);
					}
					setIsHistoryModalOpen(true);
					setLoading(true);
					getListQuestionHistoryByUser({ where: { user_id: sharedUserId } })
						.then((resp) => {
							const historyDataResponse = resp || [];
							setHistoryData(historyDataResponse);
							checkForCompletion(historyDataResponse);
						})
						.catch(() => { })
						.finally(() => setLoading(false));
				}
			}
		} catch { }
	}, []);

	// Handle payment success callback
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const paymentSuccess = params.get('payment_success');
		const orderCode = params.get('orderCode');
		const packageName = params.get('package');

		if (paymentSuccess === 'true' && orderCode) {
			message.success('Thanh toán thành công! Gói của bạn đang được kích hoạt...');
			// Refresh user data to get updated account_type
			if (fetchCurrentUser) {
				setTimeout(() => {
					fetchCurrentUser();
					// Clean URL params
					const newUrl = window.location.pathname;
					window.history.replaceState({}, '', newUrl);
				}, 1000);
			}
		} else if (params.get('payment_cancel') === 'true') {
			message.info('Bạn đã hủy thanh toán.');
			// Clean URL params
			const newUrl = window.location.pathname;
			window.history.replaceState({}, '', newUrl);
		}
	}, [fetchCurrentUser]);

	const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
	const [historyData, setHistoryData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [historyProgramFilter, setHistoryProgramFilter] = useState('all');
	const [isProgramModalForced, setIsProgramModalForced] = useState(false);
	const [portfolioView, setPortfolioView] = useState('overview'); // 'overview' or 'detail'
	const [selectedPortfolioProgram, setSelectedPortfolioProgram] = useState(null);
	const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);

	const [showFireworks, setShowFireworks] = useState(false);
	const [headerBackgroundImage, setHeaderBackgroundImage] = useState(null);
	const [tempImageUrl, setTempImageUrl] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [isHeaderBackgroundModalOpen, setIsHeaderBackgroundModalOpen] = useState(false);
	const [programSearchText, setProgramSearchText] = useState('');
	const [selectedCourseFilter, setSelectedCourseFilter] = useState('all'); // Single select

	// Update profile modal states
	const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] = useState(false);
	const [profileForm] = Form.useForm();
	const [profileUploading, setProfileUploading] = useState(false);
	const [profileTempImageUrl, setProfileTempImageUrl] = useState(null);
	const [profileImageFile, setProfileImageFile] = useState(null);

	// Login/Register modal states
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
	const [registerType, setRegisterType] = useState('gmail');
	const [registerForm] = Form.useForm();
	const [loginForm] = Form.useForm();
	const [registerLoading, setRegisterLoading] = useState(false);
	const [termsAccepted, setTermsAccepted] = useState(false);

	// Payment modal states
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

	// Terms modal state
	const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

	// Login handlers
	const handleLogin = async (values) => {
		try {
			const response = await loginWithUsername(values.username, values.password);

			if (response.success) {
				message.success('Đăng nhập thành công');
				setTimeout(() => {
					window.location.reload();
					setIsLoginModalOpen(false);
					loginForm.resetFields();
				}, 1000);
			} else {
				message.error(response.message || 'Đăng nhập thất bại');
			}
		} catch (error) {
			console.error('Lỗi đăng nhập:', error);
			message.error('Đăng nhập thất bại!');
		}
	};

	const handleGmailLogin = () => {
		const currentPath = window.location.pathname;
		window.open(`${import.meta.env.VITE_API_URL}/login?redirect=${encodeURIComponent(currentPath)}`, '_self');
	};

	const handleSubmitRegister = async (values) => {
		if (!termsAccepted) {
			message.error('Vui lòng đồng ý với Điều khoản & Dịch vụ!');
			return;
		}

		setRegisterLoading(true);

		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const startDate = today.toISOString();
			const durationDays = 3;
			const expiryDate = new Date(today);
			expiryDate.setDate(today.getDate() + durationDays - 1);
			expiryDate.setHours(23, 59, 59, 999);

			const formattedData = {
				name: values.name,
				phone: values.phone,
				...(registerType === 'gmail' && {
					email: values.gmail,
				}),
				...(registerType === 'username' && {
					username: values.username,
					password: values.password,
				}),
				info: {
					startDate: startDate,
					durationDays: durationDays,
					expiryDate: expiryDate.toISOString(),
					termsAccepted: termsAccepted || false,
					termsAcceptedDate: termsAccepted ? new Date().toISOString() : null,
				},
				account_type: 'Dùng thử',
			};

			const res = await registerAccountPublic(formattedData);
			if (res.code === 'USER_EXIST') {
				message.error(res.message);
			} else {
				message.success('Tài khoản đã được tạo thành công! Bạn có thể sử dụng ngay từ hôm nay. Đăng nhập để sử dụng');
				setTimeout(() => {
					setIsRegisterModalOpen(false);
					registerForm.resetFields();
					setRegisterType('username');
					setTermsAccepted(false);
				}, 1000);
			}
		} catch (error) {
			message.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
		} finally {
			setRegisterLoading(false);
		}
	};

	useEffect(() => {
		if (currentUser?.id && newsItems && caseTrainingItems) {
			loadHeaderStats();
		}
	}, [currentUser?.id, newsItems, caseTrainingItems, loadQuiz, selectedProgram]);

	// Reload historyData when loadQuiz changes (quiz completed) to sync progress bar
	useEffect(() => {
		if (currentUser?.id && loadQuiz !== undefined) {
			// Reload historyData to sync progress bar in program selection modal
			getListQuestionHistoryByUser({ where: { user_id: currentUser.id } })
				.then((response) => {
					const historyDataResponse = response || [];
					setHistoryData(historyDataResponse);
				})
				.catch((error) => {
					console.error('Error reloading history data after quiz completion:', error);
				});
		}
	}, [loadQuiz, currentUser?.id]);

	// Load historyData when program modal opens (for progress bar display)
	useEffect(() => {
		if (isProgramModalOpen && currentUser?.id && (!historyData?.data || historyData.data.length === 0)) {
			// Load historyData if not already loaded
			getListQuestionHistoryByUser({ where: { user_id: currentUser.id } })
				.then((response) => {
					const historyDataResponse = response || [];
					setHistoryData(historyDataResponse);
				})
				.catch((error) => {
					console.error('Error loading history data for progress bar:', error);
				});
		}
	}, [isProgramModalOpen, currentUser?.id]);

	// Load header background setting
	useEffect(() => {
		loadHeaderBackgroundSetting();
	}, []);

	// Load header background setting from database
	const loadHeaderBackgroundSetting = async () => {
		try {
			const setting = await getSettingByTypePublic('header_background');
			if (setting && setting.setting) {
				setHeaderBackgroundImage(setting.setting.value);
			}
		} catch (error) {
			console.error('Error loading header background setting:', error);
		}
	};

	// Handle image upload - only upload to get URL, don't save to database yet
	const handleImageUpload = async (file) => {
		setUploading(true);
		try {
			// Upload file to get online URL
			const response = await uploadFiles([file]);

			if (response && response.files && response.files.length > 0) {
				const imageUrl = response.files[0].fileUrl;

				// Encode URL to handle spaces and special characters
				const encodedImageUrl = encodeURI(imageUrl);

				// Set temp image URL directly - let the img tag handle loading
				setTempImageUrl(encodedImageUrl);
				message.success('Ảnh đã được tải lên thành công! Nhấn "Lưu" để áp dụng.');
			} else {
				console.error('Invalid response structure:', response);
				message.error('Không thể tải ảnh lên!');
			}
		} catch (error) {
			console.error('Error uploading image:', error);
			message.error('Có lỗi xảy ra khi tải ảnh lên!');
		} finally {
			setUploading(false);
		}
		return false; // Prevent default upload behavior
	};

	// Save image to database
	const handleSaveImage = async () => {
		if (!tempImageUrl) {
			message.warning('Vui lòng chọn ảnh trước!');
			return;
		}

		try {
			await createOrUpdateSetting({
				type: 'header_background',
				setting: {
					value: tempImageUrl,
				},
			});

			setHeaderBackgroundImage(tempImageUrl);
			setTempImageUrl(null);
			message.success('Ảnh nền đã được lưu thành công!');
		} catch (error) {
			console.error('Error saving image:', error);
			message.error('Có lỗi xảy ra khi lưu ảnh nền!');
		}
	};

	// Handle remove background image
	const handleRemoveBackground = async () => {
		try {
			await createOrUpdateSetting({
				type: 'header_background',
				setting: {
					value: null,
				},
			});

			setHeaderBackgroundImage(null);
			setTempImageUrl(null);
			message.success('Ảnh nền đã được xóa!');
		} catch (error) {
			console.error('Error removing background:', error);
			message.error('Có lỗi xảy ra khi xóa ảnh nền!');
		}
	};

	// Handle profile avatar selection (only save file, don't upload yet)
	const handleProfileImageUpload = (file) => {
		// Save file for later upload
		setProfileImageFile(file);
		// Create preview URL from file
		const previewUrl = URL.createObjectURL(file);
		setProfileTempImageUrl(previewUrl);
		return false; // Prevent default upload behavior
	};

	// Handle profile update
	const handleProfileUpdate = async (values) => {
		setProfileUploading(true);
		try {
			const updateData = {
				name: values.name,
			};

			// Upload image first if there's a new file
			if (profileImageFile) {
				const response = await uploadFiles([profileImageFile]);
				if (response && response.files && response.files.length > 0) {
					const imageUrl = response.files[0].fileUrl;
					const encodedImageUrl = encodeURI(imageUrl);
					updateData.picture = encodedImageUrl;
				} else {
					message.error('Không thể tải ảnh lên!');
					setProfileUploading(false);
					return;
				}
			} else if (!profileTempImageUrl && currentUser?.picture) {
				// User removed avatar
				updateData.picture = null;
			}
			// If profileTempImageUrl exists but no file, means user kept the same avatar

			await updateUser(currentUser?.id, updateData);
			message.success('Thông tin đã được cập nhật thành công!');

			// Refresh user data
			if (fetchCurrentUser) {
				await fetchCurrentUser();
			}

			setIsUpdateProfileModalOpen(false);
			setProfileTempImageUrl(null);
			setProfileImageFile(null);
			profileForm.resetFields();
		} catch (error) {
			console.error('Error updating profile:', error);
			message.error('Có lỗi xảy ra khi cập nhật thông tin!');
		} finally {
			setProfileUploading(false);
		}
	};

	// Helper function to check if a program is selected (supports both string and array)
	const isProgramSelected = (programValue) => {
		if (!selectedProgram) return false;
		if (Array.isArray(selectedProgram)) {
			return selectedProgram.includes(programValue);
		}
		return selectedProgram === programValue;
	};

	// Helper function to check if item matches selectedProgram (supports string and array)
	const matchesSelectedProgram = (itemTag4Array) => {
		if (!selectedProgram) return false; // Must have a program selected
		if (Array.isArray(selectedProgram)) {
			return selectedProgram.some(prog => itemTag4Array.includes(prog));
		}
		return itemTag4Array.includes(selectedProgram);
	};

	// Load header statistics
	const loadHeaderStats = async () => {
		try {
			// Support viewing history via URL param for sharing
			const params = new URLSearchParams(window.location.search);
			const sharedUserId = params.get('history_user');
			const sharedExp = params.get('exp');
			let allowByExp = true;
			if (sharedExp) {
				const expMs = Number(sharedExp);
				if (!isNaN(expMs)) {
					allowByExp = Date.now() <= expMs;
				}
			}
			const effectiveUserId = (sharedUserId && allowByExp) ? sharedUserId : currentUser?.id;
			const response = await getListQuestionHistoryByUser({ where: { user_id: effectiveUserId } });
			const historyData = response || [];

			// Create a set of current question IDs for fast lookup
			const currentQuestionIds = new Set();

			// Add news items with questions, filtered by selectedProgram
			newsItems.forEach(item => {
				if (item.questionContent != null && item.questionContent != undefined) {
					const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
					if (matchesSelectedProgram(itemTag4Array)) {
						currentQuestionIds.add(item.id);
					}
				}
			});

			// Add case training items with questions, filtered by selectedProgram
			caseTrainingItems.forEach(item => {
				if (item.questionContent != null && item.questionContent != undefined) {
					const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
					if (matchesSelectedProgram(itemTag4Array)) {
						currentQuestionIds.add(item.id);
					}
				}
			});

			// Filter history to only include current questions
			const validHistoryData = historyData.data?.filter(item =>
				currentQuestionIds.has(item.question_id)
			);

			// Calculate stats based on valid history data
			const completedQuizzes = validHistoryData.filter(item => item.score && parseFloat(item.score) >= 0).length;
			const totalQuizzes = currentQuestionIds.size;

			// Calculate average score from valid history
			const validScores = validHistoryData
				.map(item => {
					const score = parseFloat(item.score);
					return isNaN(score) ? null : score;
				})
				.filter(score => score !== null && score >= 0 && score <= 100);

			const averageScore = validScores.length > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : 0;

			// Calculate high score count from valid history
			const highScoreCount = validHistoryData.filter(item => (item.score || 0) >= 60).length;

			// Tính toán thống kê lý thuyết
			const totalTheory = newsItems.filter(item =>
				item.questionContent != null &&
				item.questionContent != undefined &&
				currentQuestionIds.has(item.id)
			).length;
			const completedTheory = validHistoryData.filter(item =>
				item.questionType === 'news' &&
				item.score &&
				parseFloat(item.score) >= 0
			).length;

			setHeaderStats({
				completedQuizzes,
				totalQuizzes,
				averageScore,
				highScoreCount,
				completedTheory,
				totalTheory
			});
		} catch (error) {
			console.error('Error loading header stats:', error);
		}
	};

	// Check program selection on component mount and when tag4Options change
	useEffect(() => {
		checkAndSetProgramSelection();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tag4Options]);

	// Check program selection logic - Force user to select a program if none selected
	const checkAndSetProgramSelection = () => {
		if (!tag4Options || tag4Options.length === 0) return;

		// Get saved program from localStorage
		const savedProgram = localStorage.getItem('selectedProgram');

		if (savedProgram) {
			try {
				// Try to parse as JSON (for array) or use as string
				let parsedProgram = savedProgram;
				if (savedProgram.startsWith('[')) {
					parsedProgram = JSON.parse(savedProgram);
				}

				// Check if saved program(s) still exist in current options
				let programExists = false;
				if (parsedProgram === 'all') {
					// 'all' is no longer valid, force user to select
					programExists = false;
				} else if (Array.isArray(parsedProgram)) {
					programExists = parsedProgram.length > 0 && parsedProgram.every(prog =>
						tag4Options.find(option => option.value === prog)
					);
				} else {
					programExists = tag4Options.find(option => option.value === parsedProgram);
				}

				if (programExists) {
					// Program(s) exist, set it and don't open modal
					setSelectedProgram(parsedProgram);
					setTag4Filter(parsedProgram);
					setIsProgramModalOpen(false);
					setIsProgramModalForced(false);
				} else {
					// Program doesn't exist or is 'all', force user to select
					setSelectedProgram(null);
					setTag4Filter(null);
					setIsProgramModalOpen(true);
					setIsProgramModalForced(true);
				}
			} catch (e) {
				// Invalid format, force user to select
				setSelectedProgram(null);
				setTag4Filter(null);
				setIsProgramModalOpen(true);
				setIsProgramModalForced(true);
			}
		} else {
			// No saved program, force user to select
			setSelectedProgram(null);
			setTag4Filter(null);
			setIsProgramModalOpen(true);
			setIsProgramModalForced(true);
		}
	};



	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		// Calculate maxWidth for program name based on screen size
		const calculateProgramNameMaxWidth = () => {
			const screenWidth = window.innerWidth;
			console.log('screenWidth', screenWidth);
			if (screenWidth >= 1800) {
				// Medium laptops
				return '650px';
			}
			else if (screenWidth >= 1700) {
				// Small laptops
				return '550px';
			}
			else if (screenWidth >= 1600) {
				// Small laptops
				return '450px';
			}
			else if (screenWidth >= 1500) {
				// Small laptops
				return '350px';
			}
			else if (screenWidth >= 1400) {
				// Small laptops
				return '200px';
			}
			else if (screenWidth >= 1000) {
				// Small laptops
				return '150px';
			}
			else {
				// Tablets, large phones
				return '200px';
			}

		};

		const handleResize = () => {
			checkMobile();
			setProgramNameMaxWidth(calculateProgramNameMaxWidth());
		};

		checkMobile();
		setProgramNameMaxWidth(calculateProgramNameMaxWidth());
		window.addEventListener('resize', handleResize);

		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleHistoryClick = async () => {
		if (!currentUser?.id) {
			message.error('Vui lòng đăng nhập để xem lịch sử quiz');
			return;
		}
		setIsHistoryModalOpen(true);
		setPortfolioView('overview'); // Reset to overview when opening
		setSelectedPortfolioProgram(null);
		setLoading(true);

		try {
			const response = await getListQuestionHistoryByUser({ where: { user_id: currentUser?.id } });
			const historyDataResponse = response || [];
			setHistoryData(historyDataResponse);

			// Check if all completed quizzes are passed with the fresh data
			checkForCompletion(historyDataResponse);
		} catch (error) {
			console.error('Error fetching history:', error);
			message.error('Có lỗi xảy ra khi tải lịch sử quiz');
		} finally {
			setLoading(false);
		}
	};

	// Check if all quizzes are completed and passed
	const checkForCompletion = (historyDataToCheck = historyData) => {
		// Create a set of current question IDs for fast lookup
		const currentQuestionIds = new Set();

		// Add news items with questions, filtered by selectedProgram
		newsItems.forEach(item => {
			if (item.questionContent != null && item.questionContent != undefined) {
				const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
				if (matchesSelectedProgram(itemTag4Array)) {
					currentQuestionIds.add(item.id);
				}
			}
		});

		// Add case training items with questions, filtered by selectedProgram
		caseTrainingItems.forEach(item => {
			if (item.questionContent != null && item.questionContent != undefined) {
				const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
				if (matchesSelectedProgram(itemTag4Array)) {
					currentQuestionIds.add(item.id);
				}
			}
		});

		// Filter history to only include current questions
		const validHistoryData = historyDataToCheck.data?.filter(item =>
			currentQuestionIds.has(item.question_id)
		);

		const totalQuizzes = currentQuestionIds.size;
		const completedQuizzes = validHistoryData.filter(item => item.score && parseFloat(item.score) >= 0);
		const passedQuizzes = completedQuizzes.filter(item => (item.score || 0) >= 60);


		// Only celebrate if ALL quizzes are completed AND ALL are passed
		if (totalQuizzes > 0 && completedQuizzes.length === totalQuizzes && passedQuizzes.length === totalQuizzes) {
			setShowFireworks(true);
			// Trigger confetti animation
			triggerConfetti();
			// Auto hide fireworks after 5 seconds
			setTimeout(() => setShowFireworks(false), 2000);
		}
	};

	// Trigger confetti animation
	const triggerConfetti = () => {
		// Multiple confetti bursts
		const duration = 3000;
		const animationEnd = Date.now() + duration;
		const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

		function randomInRange(min, max) {
			return Math.random() * (max - min) + min;
		}

		const interval = setInterval(function () {
			const timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				return clearInterval(interval);
			}

			const particleCount = 50 * (timeLeft / duration);

			// Create multiple confetti bursts
			confetti(Object.assign({}, defaults, {
				particleCount,
				origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
			}));
			confetti(Object.assign({}, defaults, {
				particleCount,
				origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
			}));
		}, 250);
	};

	// Calculate average score
	const calculateAverageScore = () => {
		const dataToUse = getFilteredHistoryData();
		if (!dataToUse || dataToUse.length === 0) return 0;

		// Filter out invalid scores and convert to numbers
		const validScores = dataToUse
			.map(item => {
				const score = parseFloat(item.score);
				return isNaN(score) ? null : score;
			})
			.filter(score => score !== null && score >= 0 && score <= 100);

		if (validScores.length === 0) return 0;

		const totalScore = validScores.reduce((sum, score) => sum + score, 0);
		return Math.round(totalScore / validScores.length);
	};

	// Filter history data by program and current questions
	const getFilteredHistoryData = () => {
		// Create a set of current question IDs for fast lookup
		const currentQuestionIds = new Set();

		// Use selectedPortfolioProgram if in detail view, otherwise use selectedProgram
		const programToFilter = portfolioView === 'detail' && selectedPortfolioProgram !== null
			? selectedPortfolioProgram
			: selectedProgram;

		// Add news items with questions, filtered by program
		newsItems.forEach(item => {
			if (item.questionContent != null && item.questionContent != undefined) {
				const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
				// Check if programToFilter matches (supports string and array)
				if (!programToFilter || programToFilter === 'all') {
					currentQuestionIds.add(item.id);
				} else if (Array.isArray(programToFilter)) {
					if (programToFilter.some(prog => itemTag4Array.includes(prog))) {
						currentQuestionIds.add(item.id);
					}
				} else {
					if (itemTag4Array.includes(programToFilter)) {
						currentQuestionIds.add(item.id);
					}
				}
			}
		});

		// Add case training items with questions, filtered by program
		caseTrainingItems.forEach(item => {
			if (item.questionContent != null && item.questionContent != undefined) {
				const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
				// Check if programToFilter matches (supports string and array)
				if (!programToFilter || programToFilter === 'all') {
					currentQuestionIds.add(item.id);
				} else if (Array.isArray(programToFilter)) {
					if (programToFilter.some(prog => itemTag4Array.includes(prog))) {
						currentQuestionIds.add(item.id);
					}
				} else {
					if (itemTag4Array.includes(programToFilter)) {
						currentQuestionIds.add(item.id);
					}
				}
			}
		});

		// Filter history to only include current questions
		const validHistoryData = historyData.data?.filter(item =>
			currentQuestionIds.has(item.question_id)
		) || [];

		// Apply program filter if needed
		let filteredData = validHistoryData;
		if (historyProgramFilter !== 'all') {
			// Filter by question type instead of tag4
			filteredData = validHistoryData.filter(item => {
				if (historyProgramFilter === 'news') {
					return item.questionType === 'news';
				} else if (historyProgramFilter === 'caseTraining') {
					return item.questionType === 'caseTraining';
				} else if (historyProgramFilter === 'longForm') {
					return item.questionType === 'longForm';
				} else if (historyProgramFilter === 'home') {
					return item.questionType === 'home';
				}
				return true;
			});
		}

		// Always sort: Learning Block (news) first, then others
		return filteredData.sort((a, b) => {
			if (a.questionType === 'news' && b.questionType !== 'news') {
				return -1;
			}
			if (a.questionType !== 'news' && b.questionType === 'news') {
				return 1;
			}
			return 0;
		});
	};

	// Calculate completed quizzes count
	const getCompletedQuizzesCount = () => {
		const filteredData = getFilteredHistoryData();
		return filteredData.filter(item => item.score && parseFloat(item.score) >= 0).length;
	};

	// Get type label based on questionType
	const getTypeLabel = (questionType) => {
		switch (questionType) {
			case 'news':
				return 'Learning Block';
			case 'caseTraining':
				return 'Case Training';
			case 'longForm':
				return 'Kho Tài Nguyên';
			case 'home':
				return 'Home';
			default:
				return 'Khác';
		}
	};

	const filteredHistoryData = getFilteredHistoryData();

	// Handle tag4 filter change
	const handleTag4Change = (value) => {
		setTag4Filter(value);
		setSelectedProgram(value);
		// Save to localStorage - convert array to JSON string if needed
		const valueToSave = Array.isArray(value) ? JSON.stringify(value) : value;
		localStorage.setItem('selectedProgram', valueToSave);
		setIsProgramModalOpen(false);
		setIsProgramModalForced(false);
		setProgramSearchText('');
		updateURL({ program: valueToSave });
	};

	// Handle select all programs for a course
	const handleSelectAllProgramsForCourse = (courseId) => {
		const programsInCourse = tag4Options
			.filter(option => option.courseId === courseId)
			.map(option => option.value);

		if (programsInCourse.length > 0) {
			handleTag4Change(programsInCourse);
		}
	};

	// Get current selected program name
	const getCurrentProgramName = () => {
		if (!selectedProgram || selectedProgram === 'all') return 'Chọn chương trình';
		if (Array.isArray(selectedProgram)) {
			if (selectedProgram.length === 0) return 'Chọn chương trình';
			if (selectedProgram.length === 1) {
				const option = tag4Options?.find(opt => opt.value === selectedProgram[0]);
				return option?.displayName || option?.label || 'Chương trình';
			}
			// Check if all programs belong to the same course
			const programOptions = selectedProgram
				.map(progValue => tag4Options?.find(opt => opt.value === progValue))
				.filter(Boolean);

			if (programOptions.length > 0) {
				// Get unique courseIds
				const courseIds = [...new Set(programOptions.map(opt => opt.courseId).filter(Boolean))];

				// If all programs belong to the same course, show course name
				if (courseIds.length === 1 && courseIds[0]) {
					const courseName = getCourseName(courseIds[0]);
					if (courseName) {
						return courseName;
					}
				}
			}

			// Fallback: show number of programs
			return `${selectedProgram.length} chương trình`;
		}
		const selectedProgramOption = tag4Options?.find(option => option.value === selectedProgram);
		return selectedProgramOption?.displayName || selectedProgramOption?.label || 'Chọn chương trình';
	};

	// Helper function to get course name by courseId
	const getCourseName = (courseId) => {
		if (!courseId) return null;
		const course = coursesOptions?.find(c => c.value === courseId);
		return course?.label || null;
	};

	// Render program card component
	const renderProgramCard = (option) => {
		const stats = getProgramStats(option.value);
		const portfolioStats = getProgramPortfolioStats(option.value);
		const isSelected = isProgramSelected(option.value);

		return (
			<Card
				key={option.value}
				hoverable
				onClick={() => handleTag4Change(option.value)}
				style={{
					cursor: 'pointer',
					border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
					borderRadius: '12px',
					transition: 'all 0.3s ease',
					overflow: 'visible',
					height: '100%',
					position: 'relative'
				}}
				bodyStyle={{ padding: isMobile ? '16px' : '20px', height: '100%' }}
			>
				{/* Course Badge - Top Right Corner on Card Edge */}
				{option.courseId && getCourseName(option.courseId) && (
					<div style={{
						position: 'absolute',
						top: '-8px',
						right: '12px',
						zIndex: 10
					}}>
						<Tag
							color="blue"
							style={{
								fontSize: isMobile ? '10px' : '11px',
								padding: '4px 8px',
								borderRadius: '6px',
								fontWeight: '500',
								margin: 0,
								boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
							}}
						>
							📖 {getCourseName(option.courseId)}
						</Tag>
					</div>
				)}

				{/* Selection Indicator */}
				{isSelected && (
					<div style={{
						width: isMobile ? 28 : 24,
						height: isMobile ? 28 : 24,
						borderRadius: '50%',
						background: '#1890ff',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexShrink: 0,
						boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
						position: 'absolute',
						top: '26px',
						right: '6px',
						zIndex: 25
					}}>
						<span style={{ color: 'white', fontSize: isMobile ? '14px' : '12px', fontWeight: 'bold' }}>✓</span>
					</div>
				)}

				<div style={{
					display: 'flex',
					flexDirection: 'column',
					gap: '12px',
					height: '100%',
					position: 'relative'
				}}>
					{/* Program Content */}
					<div style={{
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
						minWidth: 0
					}}>
						<Typography.Title
							level={5}
							style={{
								margin: 0,
								color: '#262626',
								marginBottom: '8px',
								fontSize: isMobile ? '16px' : '18px',
								lineHeight: '1.3',
								wordBreak: 'break-word'
							}}
						>
							{option.displayName || option.label}
						</Typography.Title>
						<Typography.Text
							type="secondary"
							style={{
								fontSize: isMobile ? '12px' : '13px',
								lineHeight: '1.5',
								color: '#868686',
								marginBottom: '12px',
								display: 'block',
								flex: 1,
								wordBreak: 'break-word',
								overflowWrap: 'break-word'
							}}
						>
							{option.description || 'Chương trình đào tạo chuyên nghiệp với các bài tập thực hành và tài liệu học tập chất lượng cao.'}
						</Typography.Text>

						{/* Progress Bar - Trước Program Statistics */}
						{portfolioStats.total > 0 && (
							<div style={{
								marginBottom: '12px',
								display: 'flex',
								flexDirection: 'column',
								gap: '4px'
							}}>
								<div style={{
									width: '100%',
									height: '10px',
									backgroundColor: '#f0f0f0',
									borderRadius: '5px',
									overflow: 'hidden',
									position: 'relative'
								}}>
									<div style={{
										width: `${portfolioStats.completionRate}%`,
										height: '100%',
										backgroundColor: portfolioStats.completionRate === 100 ? '#52c41a' :
											portfolioStats.completionRate >= 50 ? '#1890ff' :
												portfolioStats.completionRate > 0 ? '#faad14' : '#d9d9d9',
										borderRadius: '5px',
										transition: 'all 0.3s ease',
										boxShadow: portfolioStats.completionRate > 0 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
									}} />
								</div>
								<div style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									fontSize: '11px',
									color: '#8c8c8c',
									fontWeight: '500'
								}}>
									<span>{portfolioStats.completed}/{portfolioStats.total} bài đã làm</span>
									<span>{portfolioStats.completionRate}% hoàn thành</span>
								</div>
							</div>
						)}

						{/* Program Statistics */}
						<div className={styles.programStatsContainer}>
							<span className={styles.programStatTag}>
								{stats.theory} lý thuyết
							</span>
							<span className={styles.programStatTag}>
								{stats.practice} Case thực hành
							</span>
							<span className={styles.programStatTag}>
								Thời gian {formatTimeDisplay(stats.totalHours, stats.totalWeeks)}
							</span>
						</div>
					</div>
				</div>
			</Card>
		);
	};

	// Calculate program statistics
	const getProgramStats = (programValue) => {
		if (!programValue) return { theory: 0, practice: 0, totalHours: 0, totalWeeks: 0 };

		// Combine all items
		const allItems = [
			...caseTrainingItems,
			...newsItems
		];

		// Filter items by program
		let programItems;
		if (programValue === 'all') {
			// For 'all', include all items
			programItems = allItems;
		} else if (Array.isArray(programValue)) {
			// Filter items by multiple programs
			programItems = allItems.filter(item => {
				const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
				return programValue.some(prog => itemTag4Array.includes(prog));
			});
		} else {
			// Filter items by specific program
			programItems = allItems.filter(item => {
				const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
				return itemTag4Array.includes(programValue);
			});
		}

		// Count theory (news) vs practice (caseTraining)
		const theoryItems = programItems.filter(item =>
			item.type === 'news'
		);
		const practiceItems = programItems.filter(item =>
			item.type === 'caseTraining'
		);

		// Calculate time: 40 minutes per theory item, 20 minutes per practice item
		const theoryMinutes = theoryItems.length * 40; // 40 minutes per theory item
		const practiceMinutes = practiceItems.length * 20; // 20 minutes per practice item
		const totalMinutes = theoryMinutes + practiceMinutes;
		const totalHours = totalMinutes / 60; // Convert to hours
		const totalWeeks = totalHours / 3.5; // 3.5 hours per week

		return {
			theory: theoryItems.length,
			practice: practiceItems.length,
			totalHours,
			totalWeeks
		};
	};

	// Format time display
	const formatTimeDisplay = (totalHours, totalWeeks) => {
		if (totalWeeks === 0) {
			return '0 tuần';
		}

		const weeks = Math.ceil(totalWeeks); // Round up to nearest week

		if (weeks === 1) {
			return '1 tuần';
		} else {
			return `${weeks} tuần`;
		}
	};

	// Get certificate stats for a specific program (with theory and quiz completion)
	const getProgramCertificateStats = (programValue) => {
		if (!programValue || !historyData?.data) {
			return {
				averageScore: 0,
				theoryCompleted: 0,
				theoryTotal: 0,
				theoryPercent: 0,
				quizCompleted: 0,
				quizTotal: 0,
				quizPercent: 0
			};
		}

		// Get all items for this program
		const allItems = [...newsItems, ...caseTrainingItems];
		const theoryItems = [];
		const quizItems = [];

		allItems.forEach(item => {
			if (item.questionContent != null && item.questionContent != undefined) {
				if (programValue === 'all') {
					if (item.type === 'news') {
						theoryItems.push(item.id);
					} else if (item.type === 'caseTraining') {
						quizItems.push(item.id);
					}
				} else {
					const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
					if (itemTag4Array.includes(programValue)) {
						if (item.type === 'news') {
							theoryItems.push(item.id);
						} else if (item.type === 'caseTraining') {
							quizItems.push(item.id);
						}
					}
				}
			}
		});

		// Filter history for this program
		const theoryHistory = historyData.data.filter(item =>
			theoryItems.includes(item.question_id) && item.questionType === 'news'
		);
		const quizHistory = historyData.data.filter(item =>
			quizItems.includes(item.question_id) && item.questionType === 'caseTraining'
		);

		// Calculate theory completion
		const theoryCompleted = theoryHistory.filter(item => item.score && parseFloat(item.score) >= 0).length;
		const theoryTotal = theoryItems.length;
		const theoryPercent = theoryTotal > 0 ? Math.round((theoryCompleted / theoryTotal) * 100) : 0;

		// Calculate quiz completion
		const quizCompleted = quizHistory.filter(item => item.score && parseFloat(item.score) >= 0).length;
		const quizTotal = quizItems.length;
		const quizPercent = quizTotal > 0 ? Math.round((quizCompleted / quizTotal) * 100) : 0;

		// Calculate average score from all history
		const allHistory = [...theoryHistory, ...quizHistory];
		const validScores = allHistory
			.map(item => parseFloat(item.score))
			.filter(score => !isNaN(score) && score >= 0 && score <= 100);
		const averageScore = validScores.length > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : 0;

		return {
			averageScore,
			theoryCompleted,
			theoryTotal,
			theoryPercent,
			quizCompleted,
			quizTotal,
			quizPercent
		};
	};

	// Check if program passes certificate requirements
	const checkProgramPass = (programValue) => {
		const stats = getProgramCertificateStats(programValue);

		// Excellence: Điểm TB > 80% + Hoàn thành ≥ 75% lý thuyết và ≥ 75% quiz
		if (stats.averageScore > 80 && stats.theoryPercent >= 75 && stats.quizPercent >= 75) {
			return { passed: true, level: 'Excellence' };
		}

		// Qualified: Điểm TB > 60% + Hoàn thành ≥ 70% lý thuyết và ≥ 70% quiz
		if (stats.averageScore > 60 && stats.theoryPercent >= 70 && stats.quizPercent >= 70) {
			return { passed: true, level: 'Qualified' };
		}

		return { passed: false, level: null };
	};

	// Get portfolio stats for a specific program
	const getProgramPortfolioStats = (programValue) => {
		if (!programValue) {
			return {
				completed: 0,
				total: 0,
				averageScore: 0,
				highScoreCount: 0,
				completionRate: 0
			};
		}

		// Get all questions for this program - calculate total first (doesn't need historyData)
		const currentQuestionIds = new Set();
		const allItems = [...newsItems, ...caseTrainingItems];

		allItems.forEach(item => {
			if (item.questionContent != null && item.questionContent != undefined) {
				if (programValue === 'all') {
					currentQuestionIds.add(item.id);
				} else {
					const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
					if (itemTag4Array.includes(programValue)) {
						currentQuestionIds.add(item.id);
					}
				}
			}
		});

		const total = currentQuestionIds.size;

		// If no historyData, return with total but completed/completionRate = 0
		if (!historyData?.data) {
			return {
				completed: 0,
				total,
				averageScore: 0,
				highScoreCount: 0,
				completionRate: 0
			};
		}

		// Filter history for this program (only when historyData exists)
		const validHistoryData = historyData.data.filter(item =>
			currentQuestionIds.has(item.question_id)
		);

		const completed = validHistoryData.filter(item => item.score && parseFloat(item.score) >= 0).length;

		// Calculate average score
		const validScores = validHistoryData
			.map(item => parseFloat(item.score))
			.filter(score => !isNaN(score) && score >= 0 && score <= 100);
		const averageScore = validScores.length > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : 0;

		// High score count
		const highScoreCount = validHistoryData.filter(item => (item.score || 0) >= 60).length;

		// Completion rate
		const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

		return {
			completed,
			total,
			averageScore,
			highScoreCount,
			completionRate
		};
	};


	// Only show tag4 filter for specific tabs
	const shouldShowTag4Filter = ['stream', 'longForm', 'caseTraining', 'home', 'caseUser', 'ai'].includes(activeTab);

	// Helper function to render account type tag
	const renderAccountTypeTag = (accountType, isAdmin, size = 'normal') => {
		if (isAdmin) {
			return (
				<Tag
					style={{
						fontSize: size === 'small' ? '12px' : '14px',
						padding: size === 'small' ? '4px 10px' : '6px 14px',
						borderRadius: '6px',
						fontWeight: '700',
						border: '2px solid #ffd700',
						background: 'linear-gradient(135deg, #fff3cd 0%, #ffd700 100%)',
						color: '#8b6914',
						boxShadow: '0 2px 8px rgba(255, 193, 7, 0.4)',
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
						whiteSpace: 'nowrap'
					}}
				>
					👑Premium Admin
				</Tag>
			);
		}

		if (!accountType) return null;

		let tagStyle = {
			fontSize: size === 'small' ? '12px' : '14px',
			padding: size === 'small' ? '4px 10px' : '6px 14px',
			borderRadius: '6px',
			fontWeight: '700',
			whiteSpace: 'nowrap',
			display: 'flex',
			alignItems: 'center',
			gap: '4px',
			boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
		};

		if (accountType === 'Pro 90') {
			tagStyle = {
				...tagStyle,
				border: '1px solid #1890ff',
				background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
				color: '#0958d9',
				boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)'
			};
		} else if (accountType === 'Pro 365') {
			tagStyle = {
				...tagStyle,
				border: '1px solid #13c2c2',
				background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
				color: '#08979c',
				boxShadow: '0 2px 8px rgba(19, 194, 194, 0.3)'
			};
		} else if (accountType === 'Pro 730') {
			tagStyle = {
				...tagStyle,
				border: '1px solid #722ed1',
				background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
				color: '#531dab',
				boxShadow: '0 2px 8px rgba(114, 46, 209, 0.3)'
			};
		} else {
			// Dùng thử
			tagStyle = {
				...tagStyle,
				border: '1px solid #d9d9d9',
				background: 'linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)',
				color: '#595959',
				boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
				fontWeight: '600'
			};
		}

		return (
			<Tag style={tagStyle}>
				{accountType === 'Pro 90' ? '⭐ Pro 90' :
					accountType === 'Pro 365' ? '⭐ Pro 365' :
						accountType === 'Pro 730' ? '⭐ Pro 730' :
							accountType}
			</Tag>
		);
	};

	const columns = [
		{
			title: 'Tên nội dung',
			dataIndex: 'questionName',
			key: 'questionName',
			ellipsis: true,
			width: '30%',
			render: (text) => (
				<span style={{ fontWeight: 500, color: '#262626' }}>
					{text}
				</span>
			),
		},
		{
			title: 'Type',
			dataIndex: 'questionType',
			key: 'questionType',
			width: '15%',
			render: (questionType) => (
				<span style={{
					fontWeight: '500',
					fontSize: '13px',
					color: questionType === 'learning_block' ? '#1890ff' : '#722ed1',
					backgroundColor: questionType === 'learning_block' ? '#e6f7ff' : '#f9f0ff',
					padding: '4px 8px',
					borderRadius: '4px',
					border: `1px solid ${questionType === 'learning_block' ? '#91d5ff' : '#d3adf7'}`
				}}>
					{getTypeLabel(questionType)}
				</span>
			),
		},
		{
			title: 'Điểm',
			dataIndex: 'score',
			key: 'score',
			width: '15%',
			render: (score) => (
				<span style={{
					fontWeight: 'bold',
					fontSize: '14px',
					color: score >= 60 ? '#52c41a' : '#ff4d4f',
					backgroundColor: score >= 60 ? '#f6ffed' : '#fff2f0',
					padding: '4px 8px',
					borderRadius: '4px',
					border: `1px solid ${score >= 60 ? '#b7eb8f' : '#ffccc7'}`
				}}>
					{score}%
				</span>
			),
		},
		{
			title: 'Thời gian',
			dataIndex: 'updated_at',
			key: 'updated_at',
			width: '40%',
			render: (date) => {
				const formattedDate = formatDateToDDMMYYYY(date);
				return (
					<span style={{ color: '#666', fontSize: '13px' }}>
						{formattedDate}
					</span>
				);
			},
		},
	];

	return (
		<div
			className={styles.header}
			style={{
				backgroundImage: headerBackgroundImage ? `url("${headerBackgroundImage}")` : 'none',
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat'
			}}
		>
			<div className={styles.navContainer} style={{ padding: isMobile ? '0px' : '0px 12px' }}>
				<div className={styles.header_left} style={{ padding: isMobile ? '8px 0px' : '8px 12px' }}>
					<div className={styles.logo} style={{ padding: isMobile ? '0px' : '0px 4px' }}>
						<img style={{ width: isMobile ? '28px' : '38px', height: isMobile ? '26px' : '38px' }} src={isMobile ? '/Favicon.png' : '/Layer.png'} />
						{/* {
							!isMobile && (
								<div className={styles.desc}>
									<p>Expert-Grade Knowledge</p>
									<p>& Situation Training</p>
								</div>
							)
						} */}
						{shouldShowTag4Filter && (
							<>
								<Tooltip
									title={getCurrentProgramName()}
									placement="bottom"
									overlayStyle={{ maxWidth: '300px' }}
								>
									<Button
										icon={<Program_Icon width={16} height={16} />}
										type="text"
										onClick={() => setIsProgramModalOpen(true)}
										style={{
											fontWeight: '500',
											width: isMobile ? 'auto' : 'auto',
											flex: 1,
											...(isMobile
												&& {
												minWidth: '80px',
												maxWidth: programNameMaxWidth,
											}),
											marginLeft: isMobile ? 4 : 0,
											marginRight: isMobile ? 4 : 12,
											height: isMobile ? '28px' : '36px',
											boxShadow: 'none',
											transition: 'all 0.2s ease',
										}}
									>
										<span style={{
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
											fontSize: isMobile ? '13px' : '16px',
											color: 'white',
											display: 'block',
											maxWidth: programNameMaxWidth
										}}>
											{isMobile ? (selectedProgram ? getCurrentProgramName() : 'Chọn') : getCurrentProgramName()}
										</span>
									</Button>
								</Tooltip>
							</>
						)}
					</div>
				</div>

				<div className={styles.header_right}>
					<div className={styles.headerActions}>
						{/* Program Filter Button */}

						{/* Search Section Toggle Button */}
						{['stream', 'longForm', 'caseTraining'].includes(activeTab) && !isMobile && (
							<Button
								onClick={toggleSearchSection}
								size="middle"
								style={{
									background: 'none',
									border: 'none',
								}}
								title={showSearchSection ? 'Ẩn thanh chức năng' : 'Hiện thanh chức năng'}
							>
								<div style={{
									width: '18px',
									height: '18px',
									borderRadius: '50%',
									border: '2px solid white',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									background: 'none',
									transition: 'all 0.3s ease'
								}}>
									{showSearchSection && (
										<div style={{
											width: '8px',
											height: '8px',
											borderRadius: '50%',
											background: 'white'
										}} />
									)}
								</div>
								<span style={{ color: 'white' }}>
									Thanh chức năng
								</span>
							</Button>
						)}

						{/* Desktop - History Button */}
						{isMobile && (
							<Button
								type="primary"
								icon={<InfoScore_Icon width={14} height={14} />}
								onClick={handleHistoryClick}
								size={isMobile ? "small" : "middle"}
								style={{
									background: '#1890ff',
									borderColor: '#1890ff',
									fontSize: isMobile ? '11px' : '14px',
									height: isMobile ? '28px' : '36px',
									padding: isMobile ? '0 8px' : '0 12px',
									minWidth: isMobile ? 'auto' : 'auto'
								}}
							>
								{!isMobile && 'Thống kê cá nhân'}
							</Button>
						)}

						{/* Desktop - Statistics Cards */}
						{!isMobile && currentUser?.id && (
							<div className={styles.headerStatsContainer}>
								{/* Completed Quizzes */}
								<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
									<InfoScore_Icon width={20} height={20} />
								</div>

								<div onClick={handleHistoryClick}
								>
									<span style={{ color: 'white' }}>Đã làm </span>
									<span className={styles.statValue}>{headerStats.completedQuizzes}/{headerStats.totalQuizzes}</span>
								</div>
								{/* Average Score */}

								<div onClick={handleHistoryClick}
								>
									<span style={{ color: 'white' }}>Trung bình </span>
									<span className={styles.statValue}>{headerStats.averageScore}%</span>
								</div>


								{/* High Score Count */}
								<div onClick={handleHistoryClick}
								>
									<span style={{ color: 'white' }}>
										Bài ≥60%	</span>
									<span className={styles.statValue}>{headerStats.highScoreCount}%</span>
								</div>

							</div>
						)}
					</div>
				</div>
				{/* Account Type Display in Header - Desktop Only */}
				{currentUser && !isMobile && (
					<div style={{
						display: 'flex',
						alignItems: 'center',
						marginRight: '12px'
					}}>
						{renderAccountTypeTag(currentUser?.account_type, currentUser?.isAdmin)}
					</div>
				)}

				{currentUser ? (
					<Dropdown
						menu={{
							items: [
								// Account Type Display in Mobile Dropdown
								...(isMobile && currentUser ? [{
									key: 'accountType',
									label: (
										<Tooltip title="Gói tài khoản" placement="left">
											<div style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												padding: '4px 0',
												gap: `6px`,
												maxWidth: '200px',
												overflow: 'hidden'
											}}>
												<span style={{ fontSize: '14px', color: '#666' }}>Gói tài khoản: </span>
												{renderAccountTypeTag(currentUser?.account_type, currentUser?.isAdmin, 'small')}
											</div>
										</Tooltip>
									),
									disabled: true,
									style: { cursor: 'default' }
								}] : []),
								{
									key: 'purchasePackage',
									label: (
										<Tooltip title="💳 Mua gói" placement="left">
											<div style={{
												maxWidth: '200px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap'
											}}>
												💳 Mua gói
											</div>
										</Tooltip>
									),
									onClick: () => setIsPaymentModalOpen(true),
								},
								{
									key: 'updateProfile',
									label: (
										<Tooltip title="Cập nhật thông tin" placement="left">
											<div style={{
												maxWidth: '200px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap'
											}}>
												Cập nhật thông tin
											</div>
										</Tooltip>
									),
									onClick: () => {
										setIsUpdateProfileModalOpen(true);
										profileForm.setFieldsValue({
											name: currentUser?.name || currentUser?.email || ''
										});
										setProfileTempImageUrl(currentUser?.picture || null);
										setProfileImageFile(null);
									},
								},
								// View Mode Options - Only for specific tabs
								...(viewMode && toggleViewMode && !isMobile && shouldShowTag4Filter ? [
									{
										type: 'divider',
									},
									{
										key: 'viewModeGrid',
										label: (
											<Tooltip title="Grid view" placement="left">
												<div style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													maxWidth: '200px',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap'
												}}>
													<GridView_Icon width={14} height={14} />
													<span style={{
														color: viewMode === 'grid' ? '#1890ff' : '#666',
														fontWeight: viewMode === 'grid' ? '600' : '400'
													}}>
														Grid view
													</span>
													{viewMode === 'grid' && <span style={{ color: '#1890ff' }}>✓</span>}
												</div>
											</Tooltip>
										),
										onClick: () => {
											toggleViewMode('grid');
											setDropdownVisible(false);
										},
									},
									{
										key: 'viewModeList',
										label: (
											<Tooltip title="List view" placement="left">
												<div style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													maxWidth: '200px',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap'
												}}>
													<ListView_Icon width={14} height={14} />
													<span style={{
														color: viewMode === 'list' ? '#1890ff' : '#666',
														fontWeight: viewMode === 'list' ? '600' : '400'
													}}>
														List view
													</span>
													{viewMode === 'list' && <span style={{ color: '#1890ff' }}>✓</span>}
												</div>
											</Tooltip>
										),
										onClick: () => {
											toggleViewMode('list');
											setDropdownVisible(false);
										},
									},
									(!isMobile && {
										key: 'viewModeMap',
										label: (
											<Tooltip title="Map view" placement="left">
												<div style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													maxWidth: '200px',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap'
												}}>
													<span style={{ fontSize: '14px' }}>🗺️</span>
													<span style={{
														color: viewMode === 'map' ? '#1890ff' : '#666',
														fontWeight: viewMode === 'map' ? '600' : '400'
													}}>
														Map view
													</span>
													{viewMode === 'map' && <span style={{ color: '#1890ff' }}>✓</span>}
												</div>
											</Tooltip>
										),
										onClick: () => {
											toggleViewMode('map');
											setDropdownVisible(false);
										},
									})
								] : []),
								(currentUser?.isAdmin && {
									key: 'headerBackground',
									label: (
										<Tooltip title="Header Background" placement="left">
											<div style={{
												maxWidth: '200px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap'
											}}>
												Header Background
											</div>
										</Tooltip>
									),
									onClick: () => setIsHeaderBackgroundModalOpen(true),
								}),
								// Wrap menu items from getMenuItems() with tooltip and max-width
								...getMenuItems().map(item => {
									// Skip if it's a divider or already has a React component as label
									if (item.type === 'divider' || typeof item.label !== 'string') {
										return item;
									}
									return {
										...item,
										label: (
											<Tooltip title={item.label} placement="left">
												<div style={{
													maxWidth: '200px',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap'
												}}>
													{item.label}
												</div>
											</Tooltip>
										)
									};
								})
							],
							onClick: handleMenuClick,
						}}
						open={dropdownVisible}
						onOpenChange={setDropdownVisible}
						placement='bottomRight'
						trigger={['click']}
					>
						<div className={styles.userInfo} style={{
							padding: isMobile ? '4px 6px' : '8px 12px',
							minWidth: isMobile ? 'auto' : 'auto',
							marginRight: isMobile ? 0 : 10
						}}>
							<Avatar
								size={isMobile ? 24 : 24}
								icon={currentUser?.picture ? (
									<img
										src={currentUser.picture}
										alt='avatar'
										style={{
											width: isMobile ? 24 : 24,
											height: isMobile ? 24 : 24,
											borderRadius: '50%',
											objectFit: 'cover',
										}}
									/>
								) : (
									<UserOutlined />
								)}
								className={styles.userAvatar}
							/>
							{!isMobile && (
								<div className={styles.userDetails}>
									<span className={styles.userName}>
										{currentUser?.name || currentUser?.email || 'User'}
									</span>
								</div>
							)}
							<DownOutlined className={styles.dropdownIcon} style={{
								fontSize: isMobile ? '10px' : '12px',
								marginLeft: isMobile ? 2 : 8
							}} />
						</div>
					</Dropdown>
				) : (
					isMobile ? (
						<Dropdown
							menu={{
								items: [
									{
										key: 'login',
										label: 'Đăng nhập',
										onClick: () => setIsLoginModalOpen(true),
									},
									{
										key: 'register',
										label: 'Đăng ký',
										onClick: () => setIsRegisterModalOpen(true),
									},
								],
							}}
							placement="bottomRight"
							trigger={['click']}
						>
							<Button
								type="default"
								icon={<UserOutlined />}
								size="small"
								style={{
									width: '32px',
									height: '32px',
									padding: 0,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									marginRight: '8px'
								}}
							/>
						</Dropdown>
					) : (
						<div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '10px' }}>
							<Button
								type="default"
								size="middle"
								onClick={() => setIsLoginModalOpen(true)}
								style={{
									fontSize: '14px',
									padding: '0 12px',
									height: '32px'
								}}
							>
								Đăng nhập
							</Button>
							<Button
								type="primary"
								size="middle"
								onClick={() => setIsRegisterModalOpen(true)}
								style={{
									fontSize: '14px',
									padding: '0 12px',
									height: '32px'
								}}
							>
								Đăng ký
							</Button>
						</div>
					)
				)}
			</div>

			{/* Program Selection Modal */}
			<Modal
				title={
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: '8px',
						fontSize: '18px',
						fontWeight: '600',
						color: '#262626',
						width: '100%'
					}}>
						<span>📚 Chọn chương trình</span>
						{selectedCourseFilter === 'all' && (() => {
							const stats = getProgramStats('all');
							return (
								<div style={{
									display: 'flex',
									alignItems: 'center',
									gap: '12px',
									fontSize: '14px',
									fontWeight: '500',
									color: '#595959',
									flexWrap: 'wrap',
									justifyContent: 'flex-end'
								}}>
									<span>Tổng trữ lượng</span>
									<span>{stats.theory} lý thuyết</span>
									<span>{stats.practice} Case thực hành</span>
									<span>Thời gian {formatTimeDisplay(stats.totalHours, stats.totalWeeks)}</span>
								</div>
							);
						})()}
					</div>
				} 
				open={isProgramModalOpen}
				onCancel={isProgramModalForced ? undefined : () => {
					setIsProgramModalOpen(false);
					setProgramSearchText('');
				}}
				footer={null}
				width={isMobile ? '95%' : '1600px'}
				maskClosable={!isProgramModalForced}
				closable={!isProgramModalForced}
				style={{
					top: 20,
					paddingBottom: 0,
				}}
				className={newsTabStyles.modalContentMidHeight}
			>
				<div style={{ overflowY: 'scroll', height: '100%', paddingBottom: 60, overflowX: 'hidden' }}>


					{/* Filters Section */}
					<div style={{
						marginBottom: '24px',
						padding: '20px',
						backgroundColor: '#f8f9fa',
						borderRadius: '12px',
						border: '1px solid #e9ecef'
					}}>
						{/* Course Filter Badges and Search Input - Same Row */}
						<div style={{
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							flexWrap: 'wrap'
						}}>
							{/* Course Filter Badges */}
							{coursesOptions && coursesOptions.length > 0 && (
								<div style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: '8px',
									flex: 1,
									minWidth: '200px'
								}}>
									<Button
										type={selectedCourseFilter === 'all' ? 'primary' : 'default'}
										onClick={() => {
											setSelectedCourseFilter('all');
										}}
										className="course-filter-btn"
										style={{
											height: '36px',
											padding: '0 20px',
											fontSize: '14px',
											fontWeight: '500',
											borderRadius: '20px',
											overflow: 'hidden'
										}}
									>
										✨ Tất cả
									</Button>
									{coursesOptions.map(course => {
										const isSelected = selectedCourseFilter === course.value;
										return (
											<Button
												key={course.value}
												type={isSelected ? 'primary' : 'default'}
												onClick={() => {
													setSelectedCourseFilter(course.value);
												}}
												className="course-filter-btn"
												style={{
													height: '36px',
													padding: '0 20px',
													fontSize: '14px',
													fontWeight: '500',
													borderRadius: '20px',
													overflow: 'hidden'
												}}
											>
												📖 {course.label}
											</Button>
										);
									})}
								</div>
							)}

							{/* Search Input */}
							<div style={{ flex: '0 0 auto', minWidth: '250px' }}>
								<Input
									placeholder="Nhập tên chương trình để tìm kiếm..."
									value={programSearchText}
									onChange={(e) => setProgramSearchText(e.target.value)}
									allowClear
									size="large"
									style={{
										width: '100%',
										borderRadius: '8px',
										backgroundColor: '#ffffff'
									}}
									prefix={<span style={{ color: '#8c8c8c', fontSize: '16px' }}>🔍</span>}
								/>
							</div>
						</div>
					</div>


					{/* Individual Program Options - Grouped by Course */}
					{coursesOptions && coursesOptions.length > 0 && selectedCourseFilter !== 'all' ? (
						// Show programs grouped by selected course
						<div>
							{(() => {
								const course = coursesOptions.find(c => c.value === selectedCourseFilter);
								const programsInCourse = tag4Options?.filter(option => {
									if (!option.courseId || option.courseId !== selectedCourseFilter) return false;
									if (!programSearchText) return true;
									const searchLower = programSearchText.toLowerCase();
									const displayName = option.displayName || option.label || '';
									return (
										displayName.toLowerCase().includes(searchLower) ||
										option.label?.toLowerCase().includes(searchLower) ||
										option.description?.toLowerCase().includes(searchLower) ||
										option.displayName?.toLowerCase().includes(searchLower)
									);
								}) || [];

								if (programsInCourse.length === 0) return null;

								return (
									<div key={selectedCourseFilter} style={{ marginBottom: '24px' }}>
										{/* Course Header with Select All Button */}
										{/* <div style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											marginBottom: '16px',
											padding: '12px 16px',
											backgroundColor: '#f0f8ff',
											borderRadius: '8px',
											border: '1px solid #d6e4ff'
										}}>
											<Typography.Text strong style={{ fontSize: '16px', color: '#262626' }}>
												📖 {course?.label || 'Học phần'}
											</Typography.Text>
											<Button
												type="default"
												onClick={(e) => {
													e.stopPropagation();
													handleSelectAllProgramsForCourse(selectedCourseFilter);
												}}
												style={{
													height: '32px',
													padding: '0 16px',
													fontSize: '13px',
													borderRadius: '6px'
												}}
											>
												✓ Chọn tất cả ({programsInCourse.length})
											</Button>
										</div> */}

										{/* Programs Grid */}
										<div style={{
											display: 'grid',
											gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
											gap: '16px'
										}}>
											{programsInCourse.map(option => {
												return renderProgramCard(option);
											})}
										</div>
									</div>
								);
							})()}
						</div>
					) : (
						// Show all programs when "Tất cả học phần" is selected
						<div style={{
							display: 'grid',
							gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
							gap: '16px'
						}}>
							{tag4Options?.filter(option => {
								// Filter by search text only when showing all
								if (!programSearchText) return true;
								const searchLower = programSearchText.toLowerCase();
								const displayName = option.displayName || option.label || '';
								return (
									displayName.toLowerCase().includes(searchLower) ||
									option.label?.toLowerCase().includes(searchLower) ||
									option.description?.toLowerCase().includes(searchLower) ||
									option.displayName?.toLowerCase().includes(searchLower)
								);
							}).map(option => {
								return renderProgramCard(option);
							})}
						</div>
					)}
				</div>
			</Modal>

			<Modal
				title={
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: '16px',
						flexWrap: 'wrap'
					}}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
							{portfolioView === 'detail' && (
								<Button
									type="text"
									onClick={() => {
										setPortfolioView('overview');
										setSelectedPortfolioProgram(null);
									}}
									style={{ padding: '4px 8px', marginRight: '4px' }}
								>
									← Quay lại
								</Button>
							)}
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '600', color: '#262626' }}>
								<HistoryOutlined style={{ color: '#1890ff' }} />
								{portfolioView === 'overview' ? 'Learning Portfolio' : 'Chi tiết chương trình'}
							</div>
							{portfolioView === 'detail' && selectedPortfolioProgram && (
								<div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#1890ff' }}>
									<Program_Icon style={{ fontSize: '16px' }} />
									<Typography.Text style={{ fontSize: '14px', color: '#1890ff', fontWeight: '500' }}>
										{selectedPortfolioProgram === 'all' ? 'Tất cả chương trình' : (() => {
											const program = tag4Options?.find(opt => opt.value === selectedPortfolioProgram);
											return program?.displayName || program?.label || selectedPortfolioProgram;
										})()}
									</Typography.Text>
								</div>
							)}
						</div>
						{portfolioView === 'overview' && (
							<div style={{ display: 'flex', gap: '8px' }}>
								<Button
									style={{ backgroundColor: '#722ed1', color: 'white' }}
									onClick={() => setIsCertificateModalOpen(true)}
								>
									Xem chứng chỉ
								</Button>
							</div>
						)}
					</div>
				}
				open={isHistoryModalOpen}
				onCancel={() => {
					setIsHistoryModalOpen(false);
					setPortfolioView('overview');
					setSelectedPortfolioProgram(null);
				}}
				footer={null}
				width={isMobile ? '95%' : (portfolioView === 'overview' ? '1400px' : '90%')}
				style={{
					...(isMobile && { top: 10 }),
					maxHeight: '98vh'
				}}

			>
				{loading ? (
					<div style={{
						textAlign: 'center',
						padding: '60px 20px',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '16px'
					}}>
						<Spin size="large" />
						<Typography.Text style={{ color: '#666', fontSize: '16px' }}>
							Đang tải dữ liệu...
						</Typography.Text>
					</div>
				) : historyData.length === 0 ? (
					<div style={{
						textAlign: 'center',
						padding: '60px 20px',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '16px'
					}}>
						<Empty
							description={
								<Typography.Text style={{ color: '#666', fontSize: '16px' }}>
									Chưa có lịch sử quiz nào
								</Typography.Text>
							}
							style={{ padding: '40px 0' }}
						/>
					</div>
				) : portfolioView === 'overview' ? (
					/* OVERVIEW VIEW - Certificate Dashboard */
					<div style={{ height: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
						{/* User Info Display */}
						<Card
							size="small"
							style={{
								marginBottom: '20px',
								borderRadius: '12px',
								boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
								background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
							}}
							bodyStyle={{ padding: '20px' }}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
								<Avatar
									size={64}
									src={currentUser?.picture}
									icon={!currentUser?.picture && <UserOutlined />}
									style={{
										border: '3px solid #fff',
										boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
										flexShrink: 0
									}}
								/>
								<div style={{ flex: 1, minWidth: 0 }}>
									<Typography.Text strong style={{
										fontSize: '18px',
										color: '#262626',
										display: 'block',
										marginBottom: '6px'
									}}>
										{currentUser?.name || currentUser?.username || 'User'}
									</Typography.Text>
									<Typography.Text
										type="secondary"
										style={{
											fontSize: '14px',
											color: '#8c8c8c',
											display: 'block',
											marginBottom: '8px'
										}}
									>
										📧 {currentUser?.email || currentUser?.username || 'Chưa có email'}
									</Typography.Text>
									<Typography.Text
										type="secondary"
										style={{
											fontSize: '13px',
											color: '#8c8c8c',
											display: 'block',
											fontStyle: 'italic'
										}}
									>
										💡 Để cập nhật thông tin, hãy click vào avatar ở góc phải trên → chọn "Cập nhật thông tin"
									</Typography.Text>
								</div>
							</div>
						</Card>

						{/* Program List - Vertical */}
						<div style={{ marginBottom: '24px' }}>
							<Typography.Title level={4} style={{ marginBottom: '16px', color: '#262626' }}>
								Chương trình học
							</Typography.Title>
							<div style={{
								display: 'flex',
								flexDirection: 'column',
								background: '#fff',
								borderRadius: '8px',
								overflow: 'hidden'
							}}>
								{/* All Programs */}
								{(() => {
									const stats = getProgramPortfolioStats('all');
									const getStatusColor = (score) => {
										if (score >= 60) return '#52c41a'; // Xanh
										if (score >= 30) return '#722ed1'; // Tím
										return '#ff4d4f'; // Đỏ
									};
									const hasCompleted = stats.completed > 0;
									const statusColor = hasCompleted ? getStatusColor(stats.averageScore) : '#8c8c8c';
									return (
										<div
											onClick={() => {
												setSelectedPortfolioProgram('all');
												setHistoryProgramFilter('all');
												setPortfolioView('detail');
											}}
											style={{
												padding: isMobile ? '16px' : '20px',
												cursor: 'pointer',
												transition: 'background-color 0.2s ease',
												borderBottom: '1px solid #f0f0f0'
											}}
											onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
											onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
										>
											<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
												<div style={{ flex: 1 }}>
													<Typography.Title level={5} style={{ margin: 0, marginBottom: '4px', color: '#262626' }}>
														🌟 Tất cả chương trình
													</Typography.Title>
													<Typography.Text type="secondary" style={{ fontSize: '13px' }}>
														Xem tổng quan tất cả các bài học
													</Typography.Text>
												</div>
												<div style={{
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'flex-end',
													gap: '4px'
												}}>
													{hasCompleted ? (
														<>
															<div style={{
																fontSize: '18px',
																fontWeight: '600',
																color: statusColor
															}}>
																{stats.averageScore}%
															</div>
															<div style={{
																fontSize: '12px',
																color: '#8c8c8c'
															}}>
																{stats.completed}/{stats.total} bài
															</div>
														</>
													) : (
														<>
															<div style={{
																fontSize: '14px',
																fontWeight: '500',
																color: '#8c8c8c'
															}}>
																Chưa làm
															</div>
															<div style={{
																fontSize: '12px',
																color: '#8c8c8c'
															}}>
																{stats.completed}/{stats.total} bài
															</div>
														</>
													)}
												</div>
											</div>
										</div>
									);
								})()}

								{/* Individual Programs */}
								{tag4Options?.map((program, index) => {
									const stats = getProgramPortfolioStats(program.value);
									const getStatusColor = (score) => {
										if (score >= 60) return '#52c41a'; // Xanh
										if (score >= 30) return '#722ed1'; // Tím
										return '#ff4d4f'; // Đỏ
									};
									const hasCompleted = stats.completed > 0;
									const statusColor = hasCompleted ? getStatusColor(stats.averageScore) : '#8c8c8c';
									return (
										<div
											key={program.value}
											onClick={() => {
												setSelectedPortfolioProgram(program.value);
												setPortfolioView('detail');
											}}
											style={{
												padding: isMobile ? '16px' : '20px',
												cursor: 'pointer',
												transition: 'background-color 0.2s ease',
												borderBottom: index === tag4Options.length - 1 ? 'none' : '1px solid #f0f0f0'
											}}
											onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
											onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
										>
											<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
												<div style={{ flex: 1 }}>
													{/* Course Badge */}
													{program.courseId && getCourseName(program.courseId) && (
														<div style={{ marginBottom: '6px' }}>
															<Tag
																color="blue"
																style={{
																	fontSize: '11px',
																	padding: '2px 8px',
																	borderRadius: '4px',
																	fontWeight: '500',
																	margin: 0
																}}
															>
																📖 {getCourseName(program.courseId)}
															</Tag>
														</div>
													)}
													<Typography.Title level={5} style={{ margin: 0, marginBottom: '4px', color: '#262626' }}>
														{program.displayName || program.label}
													</Typography.Title>
													<Typography.Text type="secondary" style={{ fontSize: '13px' }}>
														{program.description || 'Chương trình đào tạo chuyên nghiệp'}
													</Typography.Text>
												</div>
												<div style={{
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'flex-end',
													gap: '4px'
												}}>
													{hasCompleted ? (
														<>
															<div style={{
																fontSize: '18px',
																fontWeight: '600',
																color: statusColor
															}}>
																{stats.averageScore}%
															</div>
															<div style={{
																fontSize: '12px',
																color: '#8c8c8c'
															}}>
																{stats.completed}/{stats.total} bài
															</div>
														</>
													) : (
														<>
															<div style={{
																fontSize: '14px',
																fontWeight: '500',
																color: '#8c8c8c'
															}}>
																Chưa làm
															</div>
															<div style={{
																fontSize: '12px',
																color: '#8c8c8c'
															}}>
																{stats.completed}/{stats.total} bài
															</div>
														</>
													)}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				) : (
					/* DETAIL VIEW - Original Table View */
					<div style={{ height: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>

						{/* History Display - Table for PC, Cards for Mobile */}
						<Card
							title={
								<Typography.Title level={5} style={{ margin: 0, color: '#262626' }}>
									Nội dung hoàn thành
								</Typography.Title>
							}
							style={{
								borderRadius: '8px',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
							}}
							bodyStyle={{ padding: '16px' }}
							extra={
								!isMobile && (
									<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
										<Button
											style={{ backgroundColor: '#5065C1', color: 'white' }}
											onClick={() => {
												try {
													const programToShare = selectedPortfolioProgram || selectedProgram || 'all';
													const url = `${window.location.origin}/k9?share_history=true&history_user=${currentUser?.id}&history_program=${programToShare}`;
													navigator.clipboard.writeText(url);
													message.success('Đã copy link chia sẻ vào clipboard');
												} catch { }
											}}
										>
											Tạo link chia sẻ public
										</Button>
										<Typography.Text strong style={{ fontSize: '14px', color: '#262626' }}>
											Lọc theo tài liệu:
										</Typography.Text>
										<Select
											value={historyProgramFilter}
											onChange={setHistoryProgramFilter}
											style={{ minWidth: '200px' }}
											size="middle"
										>
											<Option value="all">Tất cả nội dung</Option>
											<Option value="news">Learning Block</Option>
											<Option value="caseTraining">Case Training</Option>
											{/* <Option value="longForm">Kho Tài Nguyên</Option>
											<Option value="home">Home</Option> */}
										</Select>
									</div>
								)
							}
						>
							{/* Mobile - Filter */}
							{isMobile && (
								<div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
									<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
										<Button
											style={{ backgroundColor: '#5065C1', color: 'white', width: '100%' }}
											onClick={() => {
												try {
													const programToShare = selectedPortfolioProgram || selectedProgram || 'all';
													const url = `${window.location.origin}/k9?share_history=true&history_user=${currentUser?.id}&history_program=${programToShare}`;
													navigator.clipboard.writeText(url);
													message.success('Đã copy link chia sẻ vào clipboard');
												} catch { }
											}}
										>
											Tạo link chia sẻ public
										</Button>
										<Typography.Text strong style={{ fontSize: '14px', color: '#262626' }}>
											Lọc theo tài liệu:
										</Typography.Text>
										<Select
											value={historyProgramFilter}
											onChange={setHistoryProgramFilter}
											style={{ width: '100%' }}
											size="middle"
										>
											<Option value="all">Tất cả chương trình</Option>
											<Option value="news">Learning Block</Option>
											<Option value="caseTraining">Case Training</Option>
											<Option value="longForm">Kho Tài Nguyên</Option>
											<Option value="home">Home</Option>
										</Select>
									</div>
								</div>
							)}

							{/* PC - Table View */}
							{!isMobile && (
								<Table
									columns={columns}
									pagination={false}
									dataSource={filteredHistoryData}
									rowKey="id"
									size="middle"
									style={{
										borderRadius: '6px',
										overflow: 'hidden'
									}}
								/>
							)}

							{/* Mobile - Cards View */}
							{isMobile && (
								<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
									{filteredHistoryData.map((item, index) => (
										<Card
											key={item.id || index}
											size="small"
											style={{
												borderRadius: '8px',
												border: '1px solid #f0f0f0',
												boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
											}}
											bodyStyle={{ padding: '12px' }}
										>
											<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
												{/* Question Name */}
												<div>
													<Typography.Text strong style={{ fontSize: '13px', color: '#262626' }}>
														{item.questionName}
													</Typography.Text>
												</div>

												{/* Info Row */}
												<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
													{/* Type Badge */}
													<span style={{
														fontWeight: '500',
														fontSize: '10px',
														color: item.questionType === 'learning_block' ? '#1890ff' : '#722ed1',
														backgroundColor: item.questionType === 'learning_block' ? '#e6f7ff' : '#f9f0ff',
														padding: '2px 6px',
														borderRadius: '4px',
														border: `1px solid ${item.questionType === 'learning_block' ? '#91d5ff' : '#d3adf7'}`
													}}>
														{getTypeLabel(item.questionType)}
													</span>

													{/* Score Badge */}
													<span style={{
														fontWeight: 'bold',
														fontSize: '11px',
														color: (item.score || 0) >= 60 ? '#52c41a' : '#ff4d4f',
														backgroundColor: (item.score || 0) >= 60 ? '#f6ffed' : '#fff2f0',
														padding: '2px 6px',
														borderRadius: '4px',
														border: `1px solid ${(item.score || 0) >= 60 ? '#b7eb8f' : '#ffccc7'}`
													}}>
														{item.score || 0}%
													</span>

													{/* Date */}
													<Typography.Text type="secondary" style={{ fontSize: '10px' }}>
														{formatDateToDDMMYYYY(item.updated_at)}
													</Typography.Text>
												</div>
											</div>
										</Card>
									))}
								</div>
							)}
						</Card>
					</div>
				)}
			</Modal>

			{/* Celebration Modal */}
			<Modal
				title={null}
				open={showFireworks}
				onCancel={() => setShowFireworks(false)}
				footer={null}
				width={isMobile ? '95%' : '500px'}
				centered
				closable={false}
				maskClosable={false}
				style={{
					...(isMobile && { top: 10 }),
				}}
				bodyStyle={{
					padding: '0',
					background: 'linear-gradient(135deg, #91d5ff 0%, #69c0ff 100%)',
					borderRadius: '16px',
					overflow: 'hidden',
					position: 'relative'
				}}
				className={styles.modalComplete}
			>
				<div style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '40px 30px',
				}}>
					{/* Main Celebration Icon */}
					<div style={{
						fontSize: '60px',
						marginBottom: '16px',
						animation: 'float 3s ease-in-out infinite'
					}}>
						🎓
					</div>

					{/* Title */}
					<div style={{
						fontSize: '24px',
						fontWeight: '600',
						color: '#1f1f1f',
						marginBottom: '8px',
						textAlign: 'center'
					}}>
						Chúc mừng!
					</div>

					{/* Subtitle */}
					<div style={{
						fontSize: '16px',
						color: '#595959',
						marginBottom: '24px',
						textAlign: 'center',
						fontWeight: '400'
					}}>
						Bạn đã hoàn thành xuất sắc tất cả bài quiz
					</div>

					{/* Achievement Summary - Simplified */}
					<div style={{
						background: 'rgba(255,255,255,0.8)',
						borderRadius: '12px',
						padding: '20px',
						marginBottom: '24px',
						border: '1px solid rgba(24, 144, 255, 0.2)',
						width: '100%',
						maxWidth: '320px'
					}}>
						<div style={{
							fontSize: '14px',
							fontWeight: '500',
							color: '#1f1f1f',
							marginBottom: '12px',
							textAlign: 'center'
						}}>
							Thành tích
						</div>

						<div style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '12px'
						}}>
							<div style={{
								textAlign: 'center',
								padding: '8px',
								background: 'rgba(24, 144, 255, 0.08)',
								borderRadius: '8px'
							}}>
								<div style={{ color: '#595959', fontSize: '12px', marginBottom: '4px' }}>
									Tổng bài
								</div>
								<div style={{ color: '#1f1f1f', fontWeight: '600', fontSize: '16px' }}>
									{headerStats.totalQuizzes}
								</div>
							</div>

							<div style={{
								textAlign: 'center',
								padding: '8px',
								background: 'rgba(24, 144, 255, 0.08)',
								borderRadius: '8px'
							}}>
								<div style={{ color: '#595959', fontSize: '12px', marginBottom: '4px' }}>
									Đã làm
								</div>
								<div style={{ color: '#1f1f1f', fontWeight: '600', fontSize: '16px' }}>
									{headerStats.completedQuizzes}
								</div>
							</div>

							<div style={{
								textAlign: 'center',
								padding: '8px',
								background: 'rgba(24, 144, 255, 0.08)',
								borderRadius: '8px'
							}}>
								<div style={{ color: '#595959', fontSize: '12px', marginBottom: '4px' }}>
									Điểm TB
								</div>
								<div style={{
									color: '#1f1f1f',
									fontWeight: '600',
									fontSize: '16px',
									background: headerStats.averageScore >= 60 ? 'rgba(82, 196, 26, 0.15)' : 'rgba(255, 77, 79, 0.15)',
									borderRadius: '4px',
									padding: '2px 6px'
								}}>
									{headerStats.averageScore}%
								</div>
							</div>

							<div style={{
								textAlign: 'center',
								padding: '8px',
								background: 'rgba(24, 144, 255, 0.08)',
								borderRadius: '8px'
							}}>
								<div style={{ color: '#595959', fontSize: '12px', marginBottom: '4px' }}>
									Đạt ≥60%
								</div>
								<div style={{
									color: '#1f1f1f',
									fontWeight: '600',
									fontSize: '16px',
									background: 'rgba(82, 196, 26, 0.15)',
									borderRadius: '4px',
									padding: '2px 6px'
								}}>
									{headerStats.highScoreCount}
								</div>
							</div>
						</div>
					</div>

					{/* Success Message - Simplified */}
					<div style={{
						textAlign: 'center',
						padding: '16px',
						borderRadius: '8px',
						background: 'rgba(255,255,255,0.6)',
						border: '1px solid rgba(24, 144, 255, 0.15)'
					}}>
						<div style={{
							fontSize: '16px',
							fontWeight: '500',
							color: '#1f1f1f',
							marginBottom: '6px'
						}}>
							Xuất sắc!
						</div>
						<div style={{
							fontSize: '13px',
							color: '#595959',
							lineHeight: '1.4'
						}}>
							Bạn đã chứng minh khả năng học tập tuyệt vời!
						</div>
					</div>
				</div>

				{/* CSS Animations */}
				<style>{`
            		@keyframes float {
            			0%, 100% {
            				transform: translateY(0px);
            			}
            			50% {
            				transform: translateY(-8px);
            			}
            		}
            	`}</style>
			</Modal>

			{/* Header Background Settings Modal */}
			<Modal
				title={
					<div style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontSize: '18px',
						fontWeight: '600',
						color: '#262626'
					}}>
						🎨 Cài đặt ảnh nền header
					</div>
				}
				open={isHeaderBackgroundModalOpen}
				onCancel={() => {
					setIsHeaderBackgroundModalOpen(false);
					setTempImageUrl(null);
				}}
				footer={null}
				width={isMobile ? '95%' : '600px'}
				style={{
					...(isMobile && { top: 10 }),
				}}
			>
				<div style={{ padding: '20px 0' }}>
					{/* Current Background Preview */}
					{headerBackgroundImage && (
						<div style={{ marginBottom: '24px' }}>
							<Typography.Text strong style={{ marginBottom: '12px', display: 'block' }}>
								Ảnh nền hiện tại:
							</Typography.Text>
							<div style={{
								border: '1px solid #d9d9d9',
								borderRadius: '8px',
								overflow: 'hidden',
								height: '200px',
								backgroundImage: headerBackgroundImage ? `url("${headerBackgroundImage}")` : 'none',
								backgroundSize: 'cover',
								backgroundPosition: 'center',
								backgroundRepeat: 'no-repeat',
								position: 'relative'
							}}>
								<div style={{
									position: 'absolute',
									top: '8px',
									right: '8px'
								}}>
									<Button
										type="primary"
										danger
										size="small"
										icon={<DeleteOutlined />}
										onClick={handleRemoveBackground}
									>
										Xóa ảnh
									</Button>
								</div>
							</div>
						</div>
					)}

					{/* Temporary Image Preview */}
					{tempImageUrl && (
						<div style={{ marginBottom: '24px' }}>
							<Typography.Text strong style={{ marginBottom: '12px', display: 'block' }}>
								Ảnh mới (chưa lưu):
							</Typography.Text>
							<Typography.Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
								URL: {tempImageUrl}
							</Typography.Text>
							<div style={{
								border: '2px solid #1890ff',
								borderRadius: '8px',
								overflow: 'hidden',
								height: '200px',
								position: 'relative',
								backgroundColor: '#f5f5f5' // Fallback background
							}}>
								{/* Use img tag instead of backgroundImage for better debugging */}
								<img
									src={tempImageUrl}
									alt="Preview"
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'cover'
									}}
									onLoad={() => {
										console.log('Image loaded successfully in preview');
										// Remove loading indicator if needed
									}}
									onError={(e) => {
										console.error('Image failed to load in preview:', e);
										console.error('Image URL:', tempImageUrl);
										message.error('Không thể hiển thị ảnh. Vui lòng thử lại!');
									}}
								/>
								{/* Debug info */}
								<div style={{
									position: 'absolute',
									top: '8px',
									left: '8px',
									background: 'rgba(0,0,0,0.7)',
									color: 'white',
									padding: '4px 8px',
									borderRadius: '4px',
									fontSize: '12px'
								}}>
									Preview: {tempImageUrl ? 'Loading...' : 'No URL'}
								</div>
								<div style={{
									position: 'absolute',
									bottom: '8px',
									right: '8px',
									display: 'flex',
									gap: '8px'
								}}>
									<Button
										type="primary"
										size="small"
										onClick={handleSaveImage}
									>
										Lưu ảnh
									</Button>
									<Button
										size="small"
										onClick={() => setTempImageUrl(null)}
									>
										Hủy
									</Button>
								</div>
							</div>
						</div>
					)}

					{/* Upload Section - only show when no temp image */}
					{!tempImageUrl && (
						<div>
							<Typography.Text strong style={{ marginBottom: '12px', display: 'block' }}>
								{headerBackgroundImage ? 'Thay đổi ảnh nền:' : 'Chọn ảnh nền:'}
							</Typography.Text>
							<Upload
								beforeUpload={handleImageUpload}
								showUploadList={false}
								accept="image/*"
								disabled={uploading}
							>
								<Button
									type="primary"
									icon={<UploadOutlined />}
									loading={uploading}
									size="large"
									style={{ width: '100%', height: '50px' }}
								>
									{uploading ? 'Đang tải lên...' : 'Chọn ảnh từ máy tính'}
								</Button>
							</Upload>
						</div>
					)}

					{/* Instructions */}
					<div style={{
						marginTop: '20px',
						padding: '16px',
						background: '#f6f8fa',
						borderRadius: '8px',
						border: '1px solid #e1e4e8'
					}}>
						<Typography.Text type="secondary" style={{ fontSize: '13px' }}>
							💡 <strong>Hướng dẫn:</strong><br />
							• Chọn ảnh từ máy tính để tải lên server<br />
							• Xem preview ảnh trước khi lưu<br />
							• Nhấn "Lưu ảnh" để áp dụng làm ảnh nền header<br />
							• Khuyến nghị sử dụng ảnh có tỷ lệ 16:9 hoặc 21:9
						</Typography.Text>
					</div>
				</div>
			</Modal>

			{/* Update Profile Modal */}
			<Modal
				title={
					<div className={homepageStyles.modalTitle}>
						<div className={homepageStyles.modalTitleMain}>Cập nhật thông tin cá nhân</div>
						<div className={homepageStyles.modalTitleSub}>Chỉnh sửa ảnh đại diện và tên của bạn</div>
					</div>
				}
				open={isUpdateProfileModalOpen}
				onCancel={() => {
					setIsUpdateProfileModalOpen(false);
					setProfileTempImageUrl(currentUser?.picture || null);
					setProfileImageFile(null);
					// Clean up object URL if exists
					if (profileTempImageUrl && profileTempImageUrl.startsWith('blob:')) {
						URL.revokeObjectURL(profileTempImageUrl);
					}
					profileForm.resetFields();
				}}
				footer={null}
				width={isMobile ? '95%' : '520px'}
				className={homepageStyles.customModal}
				centered
			>
				<Form
					form={profileForm}
					layout='vertical'
					onFinish={handleProfileUpdate}
					className={homepageStyles.modalForm}
				>
					{/* Avatar Upload Section */}
					<div style={{
						marginBottom: '2rem',
						padding: '2rem',
						background: '#fafafa',
						borderRadius: '12px',
						border: '1px solid #e8e8e8'
					}}>
						<div style={{ textAlign: 'center' }}>
							<div style={{
								marginBottom: '1.5rem',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center'
							}}>
								{profileTempImageUrl ? (
									<div style={{ position: 'relative', display: 'inline-block' }}>
										<Avatar
											size={128}
											src={profileTempImageUrl}
											style={{
												border: '4px solid #fff',
												boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
												background: '#fff'
											}}
										/>
										<Button
											type="text"
											danger
											size="small"
											icon={<DeleteOutlined />}
											onClick={() => {
												// Clean up object URL if exists
												if (profileTempImageUrl && profileTempImageUrl.startsWith('blob:')) {
													URL.revokeObjectURL(profileTempImageUrl);
												}
												setProfileTempImageUrl(null);
												setProfileImageFile(null);
											}}
											style={{
												position: 'absolute',
												bottom: 0,
												right: 0,
												background: '#fff',
												border: '2px solid #ff4d4f',
												borderRadius: '50%',
												width: '32px',
												height: '32px',
												minWidth: '32px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												boxShadow: '0 2px 8px rgba(255,77,79,0.3)'
											}}
										/>
									</div>
								) : (
									<Avatar
										size={128}
										icon={<UserOutlined style={{ fontSize: '64px' }} />}
										style={{
											backgroundColor: '#f0f0f0',
											border: '4px dashed #d9d9d9',
											color: '#bfbfbf'
										}}
									/>
								)}
							</div>
							<Upload
								beforeUpload={handleProfileImageUpload}
								showUploadList={false}
								accept="image/*"
								disabled={profileUploading}
							>
								<Button
									type={profileTempImageUrl ? 'default' : 'primary'}
									icon={<UploadOutlined />}
									size="large"
									style={{
										height: '40px',
										paddingLeft: '20px',
										paddingRight: '20px',
										fontSize: '14px',
										borderRadius: '6px'
									}}
								>
									{profileTempImageUrl ? 'Thay đổi ảnh' : 'Chọn ảnh đại diện'}
								</Button>
							</Upload>
							<div style={{
								marginTop: '12px',
								fontSize: '12px',
								color: '#868686'
							}}>
								JPG, PNG hoặc GIF (tối đa 5MB)
							</div>
						</div>
					</div>

					{/* Name Input */}
					<Form.Item
						label="Họ và tên"
						name="name"
						className={homepageStyles.formItem}
						rules={[
							{ required: true, message: 'Vui lòng nhập họ và tên!' },
							{ min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự!' },
						]}
					>
						<Input size="large" placeholder="Nhập họ và tên của bạn" />
					</Form.Item>

					{/* Submit Button */}
					<Form.Item style={{ marginBottom: 0, marginTop: '0.5rem' }}>
						<Button
							type="primary"
							htmlType="submit"
							size="large"
							block
							loading={profileUploading}
							className={homepageStyles.modalSubmitBtn}
						>
							{profileUploading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
						</Button>
					</Form.Item>
				</Form>
			</Modal>

			{/* Login Modal */}
			<Modal
				title={
					<div className={homepageStyles.modalTitle}>
						<div className={homepageStyles.modalTitleMain}>Đăng nhập</div>
						<div className={homepageStyles.modalTitleSub}>Chọn cách đăng nhập phù hợp với bạn</div>
					</div>
				}
				open={isLoginModalOpen}
				onCancel={() => {
					setIsLoginModalOpen(false);
					loginForm.resetFields();
				}}
				footer={null}
				width={480}
				className={homepageStyles.customModal}
				centered
			>
				<div className={homepageStyles.loginOptions}>
					<Button
						size='large'
						className={homepageStyles.gmailLoginBtn}
						onClick={handleGmailLogin}
						block
					>
						<div className={homepageStyles.btnDescInBtn}>
							<span className={homepageStyles.btnDesc}>Đăng nhập với Gmail</span>
							<span className={homepageStyles.btnDescSmall}>Đăng nhập nhanh và bảo mật</span>
						</div>
					</Button>

					<Divider>Hoặc</Divider>

					<Form
						layout='vertical'
						className={homepageStyles.modalForm}
						form={loginForm}
						onFinish={handleLogin}
					>
						<Form.Item
							label='Tài khoản'
							name='username'
							className={homepageStyles.formItem}
							rules={[
								{ required: true, message: 'Vui lòng nhập username!' },
							]}
						>
							<Input size='large' placeholder='Nhập username' />
						</Form.Item>
						<Form.Item
							label='Mật khẩu'
							name='password'
							className={homepageStyles.formItem}
							rules={[
								{ required: true, message: 'Vui lòng nhập mật khẩu!' },
							]}
						>
							<Input.Password size='large' placeholder='Nhập mật khẩu' />
						</Form.Item>
						<Button
							type='primary'
							size='large'
							block
							htmlType='submit'
							className={homepageStyles.modalSubmitBtn}
						>
							Đăng nhập
						</Button>
					</Form>
				</div>
			</Modal>

			{/* Register Modal */}
			<Modal
				title={
					<div className={homepageStyles.modalTitle}>
						<div className={homepageStyles.modalTitleMain}>Đăng ký tài khoản mới</div>
						<div className={homepageStyles.modalTitleSub}>Chọn cách đăng ký phù hợp với bạn</div>
					</div>
				}
				open={isRegisterModalOpen}
				onCancel={() => {
					setIsRegisterModalOpen(false);
					registerForm.resetFields();
					setRegisterType('username');
					setTermsAccepted(false);
				}}
				footer={
					<div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: '5px' }}>
						<Checkbox
							checked={termsAccepted}
							onChange={(e) => setTermsAccepted(e.target.checked)}
						>
							<span className={homepageStyles.termsText}>
								Đồng ý với{' '}
								<span
									style={{ color: '#1890ff', cursor: 'pointer', textDecoration: 'underline' }}
									onClick={(e) => {
										e.preventDefault();
										setIsTermsModalOpen(true);
									}}
								>
									điều khoản và dịch vụ
								</span>
								{' '}của AiMBA
							</span>
						</Checkbox>
						<Button
							type='primary'
							size='large'
							block
							onClick={() => registerForm.submit()}
							loading={registerLoading}
							className={homepageStyles.modalSubmitBtn}
							style={{ marginTop: '12px' }}
						>
							{registerType === 'username' ? 'Đăng ký' : 'Đăng ký với Gmail'}
						</Button>
						<Typography.Text
							type="secondary"
							style={{
								fontSize: '14px',
								textAlign: 'center',
								display: 'block',
								marginTop: '8px',
								color: '#52c41a',
								fontStyle: 'italic'
							}}
						>
							✨ Sau khi đăng ký hoàn tất, bạn sẽ được kích hoạt dùng thử 3 ngày miễn phí toàn bộ tính năng
						</Typography.Text>
					</div>
				}
				width={480}
				className={homepageStyles.customModal}
				centered
			>
				<div className={homepageStyles.modalScrollContent}>
					<div className={homepageStyles.registerOptions}>
						<Radio.Group
							value={registerType}
							onChange={(e) => setRegisterType(e.target.value)}
							className={homepageStyles.radioGroup}
						>
							<Radio.Button value='gmail' className={homepageStyles.radioButton}>
								<div className={homepageStyles.radioContent}>
									<div className={homepageStyles.radioTitle}>Gmail</div>
									<div className={homepageStyles.radioDesc}>Đăng ký nhanh với Gmail</div>
								</div>
							</Radio.Button>
							<Radio.Button value='username' className={homepageStyles.radioButton}>
								<div className={homepageStyles.radioContent}>
									<div className={homepageStyles.radioTitle}>Tài khoản & Mật khẩu</div>
									<div className={homepageStyles.radioDesc}>Đăng ký bằng tài khoản mới</div>
								</div>
							</Radio.Button>
						</Radio.Group>
					</div>

					<Divider />

					{registerType === 'username' ? (
						<Form
							layout='vertical'
							className={homepageStyles.modalForm}
							form={registerForm}
							onFinish={handleSubmitRegister}
						>
							<Form.Item
								label='Họ tên'
								name='name'
								className={homepageStyles.formItem}
								rules={[
									{ required: true, message: 'Vui lòng nhập họ tên!' },
									{ min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' },
								]}
							>
								<Input size='large' placeholder='Nhập họ tên' />
							</Form.Item>
							<Form.Item
								label='Tài khoản'
								name='username'
								className={homepageStyles.formItem}
								rules={[
									{ required: true, message: 'Vui lòng nhập username!' },
									{ min: 3, message: 'Username phải có ít nhất 3 ký tự!' },
									{ max: 20, message: 'Username không được quá 20 ký tự!' },
								]}
							>
								<Input size='large' placeholder='Nhập username' />
							</Form.Item>
							<Form.Item
								label='Số điện thoại (thông tin đi kèm)'
								name='phone'
								className={homepageStyles.formItem}
								rules={[
									{ required: true, message: 'Vui lòng nhập số điện thoại!' },
									{ pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' },
								]}
								extra={
									<Typography.Text type="secondary" style={{ fontSize: '13px', color: '#8c8c8c', fontStyle: 'italic' }}>
										💡 SĐT chỉ được sử dụng để hỗ trợ khách hàng trong quá trình sử dụng
									</Typography.Text>
								}
							>
								<Input size='large' placeholder='Nhập số điện thoại' />
							</Form.Item>
							<Form.Item
								label='Mật khẩu'
								name='password'
								className={homepageStyles.formItem}
								rules={[
									{ required: true, message: 'Vui lòng nhập mật khẩu!' },
									{ min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
								]}
							>
								<Input.Password size='large' placeholder='Nhập mật khẩu' />
							</Form.Item>
							<Form.Item
								label='Nhập lại mật khẩu'
								name='confirmPassword'
								className={homepageStyles.formItem}
								dependencies={['password']}
								rules={[
									{ required: true, message: 'Vui lòng nhập lại mật khẩu!' },
									({ getFieldValue }) => ({
										validator(_, value) {
											if (!value || getFieldValue('password') === value) {
												return Promise.resolve();
											}
											return Promise.reject(new Error('Mật khẩu không khớp!'));
										},
									}),
								]}
							>
								<Input.Password size='large' placeholder='Nhập lại mật khẩu' />
							</Form.Item>
						</Form>
					) : (
						<div className={homepageStyles.gmailRegister}>
							<Form
								layout='vertical'
								className={homepageStyles.modalForm}
								form={registerForm}
								onFinish={handleSubmitRegister}
							>
								<Form.Item
									label='Họ tên'
									name='name'
									className={homepageStyles.formItem}
									rules={[
										{ required: true, message: 'Vui lòng nhập họ tên!' },
										{ min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' },
									]}
								>
									<Input size='large' placeholder='Nhập họ tên' />
								</Form.Item>
								<Form.Item
									label='Gmail'
									name='gmail'
									className={homepageStyles.formItem}
									rules={[
										{ required: true, message: 'Vui lòng nhập Gmail!' },
										{ type: 'email', message: 'Gmail không hợp lệ!' },
									]}
									extra={
										<Typography.Text type="secondary" style={{ fontSize: '13px', color: '#8c8c8c', fontStyle: 'italic' }}>
											🔐 Tài khoản Gmail sẽ được sử dụng để đăng nhập sau khi hoàn tất đăng ký
										</Typography.Text>
									}
								>
									<Input size='large' placeholder='Nhập Gmail' />
								</Form.Item>
								<Form.Item
									label='Số điện thoại (thông tin đi kèm)'
									name='phone'
									className={homepageStyles.formItem}
									rules={[
										{ required: true, message: 'Vui lòng nhập số điện thoại!' },
										{ pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' },
									]}
									extra={
										<Typography.Text type="secondary" style={{ fontSize: '13px', color: '#8c8c8c', fontStyle: 'italic' }}>
											💡 SĐT chỉ được sử dụng để hỗ trợ khách hàng trong quá trình sử dụng
										</Typography.Text>
									}
								>
									<Input size='large' placeholder='Nhập số điện thoại' />
								</Form.Item>
							</Form>
						</div>
					)}
				</div>
			</Modal>

			{/* Payment Package Selection Modal */}
			<PaymentModal
				open={isPaymentModalOpen}
				onCancel={() => setIsPaymentModalOpen(false)}
				currentUser={currentUser}
				isMobile={isMobile}
			/>

			{/* Terms & Conditions Modal */}
			<TermsModal
				open={isTermsModalOpen}
				onCancel={() => setIsTermsModalOpen(false)}
			/>

			{/* Certificate Modal */}
			<CertificateModal
				open={isCertificateModalOpen}
				onCancel={() => setIsCertificateModalOpen(false)}
				currentUser={currentUser}
				isMobile={isMobile}
				tag4Options={tag4Options}
				checkProgramPass={checkProgramPass}
				getProgramCertificateStats={getProgramCertificateStats}
			/>

			{/* Style for course filter buttons to ensure rounded corners */}
			<style>{`
				.course-filter-btn {
					border-radius: 20px !important;
				}
				.course-filter-btn.ant-btn-primary {
					border-radius: 20px !important;
				}
				.course-filter-btn.ant-btn-default {
					border-radius: 20px !important;
				}
			`}</style>
		</div>
	);
};

export default K9Header;
