import React, { useState, useEffect } from 'react';
import { createNewCasePublic, getAllCasePublicByUser } from '../../../apis/casePublicService';
import { getCurrentUserLogin } from '../../../apis/userService';
import { getSettingByType } from '../../../apis/settingService';
import { aiGen } from '../../../apis/aiGen/botService';
import styles from './CaseUser.module.css';
import { Modal, Select, Button, message, Spin, Progress } from 'antd';
import { createTimestamp } from './../../../generalFunction/format.js';

const { Option } = Select;

const AddCaseModal = ({isMobile , currentUser, isOpen, onClose, onSubmit, existingCases = [], caseToCopy = null }) => {
	const [formData, setFormData] = useState({
		// Basic Information
		title: '', // Will be auto-generated
		description: '', // Will be left empty
		creator: '',

		// Classification
		industry: '',
		area: '',
		domain: '',

		// Game Settings
		difficulty: 'casual', // Default to casual
		duration: '15', // Default to 15 minutes
		playerRole: '',

		// Question Configuration
		questionTypes: ['mcq'], // Default to mcq
		mcqCount: 2, // Default based on duration
		essayCount: 1 // Default based on duration
	});

	const [autoTitle, setAutoTitle] = useState('');

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [aiGenerating, setAiGenerating] = useState(false);
	const [aiSettings, setAiSettings] = useState(null);
	const [aiProgress, setAiProgress] = useState(0);
	const [aiStep, setAiStep] = useState('');


	// Data for dropdowns
	const industries = [
		{ value: 'generic', label: 'Chung/Đa ngành (Generic/Cross-industry)' },
		{ value: 'food_beverage', label: 'Thực phẩm & Đồ uống (Food & Beverage)' },
		{ value: 'real_estate', label: 'Bất động sản (Real Estate)' },
		{ value: 'technology', label: 'Công nghệ (Technology)' },
		{ value: 'finance_banking', label: 'Tài chính & Ngân hàng (Finance & Banking)' },
		{ value: 'retail', label: 'Bán lẻ (Retail)' },
		{ value: 'manufacturing', label: 'Sản xuất (Manufacturing)' },
		{ value: 'healthcare', label: 'Y tế (Healthcare)' },
		{ value: 'education', label: 'Giáo dục (Education)' },
		{ value: 'consulting', label: 'Tư vấn (Consulting)' }
	];

	const areas = {
		strategy: { value: 'strategy', label: 'Chiến lược (Strategy)' },
		marketing: { value: 'marketing', label: 'Marketing (Marketing)' },
		finance: { value: 'finance', label: 'Tài chính (Finance)' },
		operations: { value: 'operations', label: 'Vận hành (Operations)' },
		hr: { value: 'hr', label: 'Nhân sự (Human Resources)' },
		sales: { value: 'sales', label: 'Bán hàng (Sales)' }
	};

	const domains = {
		strategy: [
			{ value: 'competitive_strategy', label: 'Chiến lược cạnh tranh (Competitive Strategy)' },
			{ value: 'blue_ocean', label: 'Chiến lược đại dương xanh (Blue Ocean Strategy)' },
			{ value: 'market_entry', label: 'Thâm nhập thị trường (Market Entry)' },
			{ value: 'diversification', label: 'Đa dạng hóa (Diversification)' }
		],
		marketing: [
			{ value: 'brand_positioning', label: 'Định vị thương hiệu (Brand Positioning)' },
			{ value: 'customer_acquisition', label: 'Thu hút khách hàng (Customer Acquisition)' },
			{ value: 'digital_marketing', label: 'Marketing số (Digital Marketing)' },
			{ value: 'pricing_strategy', label: 'Chiến lược giá (Pricing Strategy)' }
		],
		finance: [
			{ value: 'investment_analysis', label: 'Phân tích đầu tư (Investment Analysis)' },
			{ value: 'cost_management', label: 'Quản lý chi phí (Cost Management)' },
			{ value: 'financial_planning', label: 'Lập kế hoạch tài chính (Financial Planning)' },
			{ value: 'risk_management', label: 'Quản lý rủi ro (Risk Management)' }
		],
		operations: [
			{ value: 'supply_chain', label: 'Quản lý chuỗi cung ứng (Supply Chain Management)' },
			{ value: 'process_improvement', label: 'Cải tiến quy trình (Process Improvement)' },
			{ value: 'quality_management', label: 'Quản lý chất lượng (Quality Management)' },
			{ value: 'capacity_planning', label: 'Lập kế hoạch công suất (Capacity Planning)' }
		],
		hr: [
			{ value: 'talent_acquisition', label: 'Thu hút nhân tài (Talent Acquisition)' },
			{ value: 'performance_management', label: 'Quản lý hiệu suất (Performance Management)' },
			{ value: 'organizational_change', label: 'Thay đổi tổ chức (Organizational Change)' },
			{ value: 'employee_engagement', label: 'Gắn kết nhân viên (Employee Engagement)' }
		],
		sales: [
			{ value: 'sales_strategy', label: 'Chiến lược bán hàng (Sales Strategy)' },
			{ value: 'account_management', label: 'Quản lý tài khoản (Account Management)' },
			{ value: 'sales_forecasting', label: 'Dự báo bán hàng (Sales Forecasting)' },
			{ value: 'channel_development', label: 'Phát triển kênh (Channel Development)' }
		]
	};

	const difficulties = [
		{ value: 'casual', label: 'Cơ bản (Casual) - Dành cho người mới bắt đầu' },
		{ value: 'advanced', label: 'Nâng cao (Advanced) - Có kinh nghiệm cơ bản' },
		{ value: 'expert', label: 'Chuyên gia (Expert) - Có kinh nghiệm sâu' }
	];

	const durations = [
		{ value: '15', label: '15 phút - Nhanh (3 câu hỏi)' },
		{ value: '30', label: '30 phút - Trung bình (6 câu hỏi)' },
		{ value: '45', label: '45 phút - Chi tiết (10 câu hỏi)' }
	];

	const playerRoles = [
		{ value: 'ceo', label: 'Tổng Giám đốc (CEO)' },
		{ value: 'manager', label: 'Quản lý (Manager)' },
		{ value: 'consultant', label: 'Tư vấn viên (Consultant)' },
		{ value: 'analyst', label: 'Chuyên viên phân tích (Analyst)' },
		{ value: 'specialist', label: 'Chuyên gia (Specialist)' }
	];

	// Get current user for creator field and generate auto title
	useEffect(() => {
		const getCurrentUser = async () => {
			try {
				const user = (await getCurrentUserLogin()).data;
				if (user) {
					setFormData(prev => ({
						...prev,
						creator: user.name || user.email || ''
					}));
				}
			} catch (error) {
				console.error('Error getting current user:', error);
			}
		};

		const generateInitialTitle = async () => {
			try {
				const title = await generateAutoTitle();
				setAutoTitle(title);
				setFormData(prev => ({
					...prev,
					title: title
				}));
			} catch (error) {
				console.error('Error generating initial title:', error);
			}
		};

		if (isOpen) {
			getCurrentUser();
			generateInitialTitle();
		}
	}, [isOpen]);

	// Calculate question counts based on duration and question types
	const calculateQuestionCounts = (duration, questionTypes) => {
		let totalQuestions = 0;
		
		// Get total questions based on duration
		switch (duration) {
			case '15':
				totalQuestions = 3;
				break;
			case '30':
				totalQuestions = 6;
				break;
			case '45':
				totalQuestions = 10;
				break;
			default:
				totalQuestions = 3;
		}

		// Calculate distribution based on question types
		if (questionTypes.length === 1) {
			// Only one type selected
			if (questionTypes.includes('mcq')) {
				return { mcqCount: totalQuestions, essayCount: 0 };
			} else if (questionTypes.includes('essay')) {
				return { mcqCount: 0, essayCount: totalQuestions };
			}
		} else if (questionTypes.length === 2) {
			// Both types selected - use predefined ratios
			switch (duration) {
				case '15':
					return { mcqCount: 2, essayCount: 1 };
				case '30':
					return { mcqCount: 4, essayCount: 2 };
				case '45':
					return { mcqCount: 7, essayCount: 3 };
				default:
					return { mcqCount: 2, essayCount: 1 };
			}
		}

		return { mcqCount: totalQuestions, essayCount: 0 };
	};

	// Update question counts when duration or question types change
	useEffect(() => {
		const counts = calculateQuestionCounts(formData.duration, formData.questionTypes);
		setFormData(prev => ({
			...prev,
			mcqCount: counts.mcqCount,
			essayCount: counts.essayCount
		}));
	}, [formData.duration, formData.questionTypes]);

	// Load AI settings (only for model and prompt)
	useEffect(() => {
		const loadAiSettings = async () => {
			try {
				const settings = await getSettingByType('ai_settings_for_user');
				if (settings && settings.setting) {
					setAiSettings(settings.setting);
				}
			} catch (error) {
				console.error('Error loading AI settings:', error);
			}
		};

		loadAiSettings();
	}, [isOpen]);

	// Copy data from caseToCopy when modal opens
	useEffect(() => {
		if (isOpen && caseToCopy) {
			const info = caseToCopy.info || {};
			const questionContent = caseToCopy.questionContent || {};

			setFormData(prev => ({
				...prev,
				industry: info.industry || '',
				area: info.area || '',
				domain: info.domain || '',
				difficulty: info.difficulty || 'casual',
				duration: info.duration || '15',
				playerRole: info.playerRole || '',
				questionTypes: questionContent.questionTypes || ['mcq'],
				mcqCount: questionContent.mcqCount || 2,
				essayCount: questionContent.essayCount || 1
			}));

			message.success('Đã copy thông tin từ case cũ!');
		}
	}, [isOpen, caseToCopy]);



	// Helper function to generate automatic title with timestamp
	const generateAutoTitle = async () => {
		const now = new Date();
		const day = String(now.getDate()).padStart(2, '0');
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const year = now.getFullYear();

		try {
			// Get today's date in YYYY-MM-DD format for comparison
			const today = now.toISOString().split('T')[0];

			// Query all cases created by current user
			const userCases = await getAllCasePublicByUser({
				where: {
					user_id: currentUser.id,
					show: true
				}
			});

			// Filter cases created today
			const todayCases = userCases.filter(caseItem => {
				if (!caseItem.created_at) return false;
				const caseDate = new Date(caseItem.created_at).toISOString().split('T')[0];
				return caseDate === today;
			});

			// Get the next sequence number (count + 1)
			const sequence = todayCases.length + 1;

			return `Case Study Quiz ${day}${month}${year}.${sequence}`;
		} catch (error) {
			console.error('Error getting case count for title generation:', error);
			// Fallback to time-based sequence if query fails
			const timeInMinutes = now.getHours() * 60 + now.getMinutes();
			const seconds = now.getSeconds();
			const sequence = timeInMinutes + Math.floor(seconds / 10);
			return `Case Study Quiz ${day}${month}${year}.${sequence}`;
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));

		// Reset dependent fields when parent field changes
		if (name === 'industry') {
			setFormData(prev => ({
				...prev,
				area: '',
				domain: ''
			}));
		} else if (name === 'area') {
			setFormData(prev => ({
				...prev,
				domain: ''
			}));
		}
	};

	const handleCheckboxChange = (e) => {
		const { name, value, checked } = e.target;
		
		if (name === 'questionTypes') {
			if (checked) {
				setFormData(prev => ({
					...prev,
					[name]: [...prev[name], value]
				}));
			} else {
				// Allow unchecking any type, including the default mcq
				setFormData(prev => ({
					...prev,
					[name]: prev[name].filter(item => item !== value)
				}));
			}
		}
	};

	const handleNumberChange = (e) => {
		const { name, value } = e.target;
		const numValue = parseInt(value) || 0;
		setFormData(prev => ({
			...prev,
			[name]: numValue
		}));
	};

	const extractJsonFromResponse = (response) => {
		if (!response) return null;

		let text = '';
		if (typeof response === 'string') {
			text = response;
		} else if (response.result) {
			text = response.result;
		} else {
			return response;
		}


		// Try to extract JSON from markdown code blocks (```json ... ```)
		const jsonBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
		if (jsonBlockMatch) {
			try {
				return JSON.parse(jsonBlockMatch[1]);
			} catch (e) {
				console.error('Failed to parse JSON from code block:', e);
			}
		}

		// Try to find JSON object in the text
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			try {
				return JSON.parse(jsonMatch[0]);
			} catch (e) {
				console.error('Failed to parse JSON from text:', e);
			}
		}

		// If no JSON found, try parsing the entire text
		try {
			console.log('Trying to parse entire text as JSON');
			return JSON.parse(text);
		} catch (e) {
			console.error('Failed to parse response as JSON:', e);
			return null;
		}
	};


	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			// Check if AI settings are available
			if (!aiSettings || !aiSettings.selectedModel || !aiSettings.prompt) {
				setError('Cần cài đặt AI trước khi tạo case. Vui lòng liên hệ admin.');
				return;
			}

					// Generate AI questions first
		setAiGenerating(true);
		setAiProgress(0);
		setAiStep('Đang chuẩn bị dữ liệu...');
			
			// Prepare prompt data with question counts from form
			const promptData = {
				...formData,
				questionCounts: {
					mcqCount: formData.mcqCount,
					essayCount: formData.essayCount
				}
			};
			
			console.log('Sending to AI:', {
				prompt: JSON.stringify(promptData),
				system_message: aiSettings.prompt,
				model: aiSettings.selectedModel
			});

			// Simulate progress updates
			setAiProgress(30);
			setAiStep('Đang gửi yêu cầu đến AI...');
			await new Promise(resolve => setTimeout(resolve, 500));
			setAiProgress(60);
			setAiStep('Đang xử lý câu hỏi...');

			const aiResponse = await aiGen(
				JSON.stringify(promptData),
				aiSettings.prompt, // system_message from admin settings
				aiSettings.selectedModel, // model from admin settings
				'text'
			);

			setAiProgress(90);
			setAiStep('Đang hoàn thiện câu hỏi...');

			console.log('AI Response:', aiResponse);

			// Parse AI response using the same function as CreateQuizModal
			const parsedData = extractJsonFromResponse(aiResponse);
			if (!parsedData) {
				throw new Error('Invalid AI response format - could not parse JSON');
			}

			// Handle both old and new format like CreateQuizModal
			let quizQuestions = [];
			let essayQuestions = [];

			if (parsedData.questionQuiz && Array.isArray(parsedData.questionQuiz)) {
				// New format with questionQuiz and questionEssay
				quizQuestions = parsedData.questionQuiz;
				essayQuestions = parsedData.questionEssay || [];
			} else if (parsedData.questions && Array.isArray(parsedData.questions)) {
				// Old format with questions array - treat all as quiz questions
				quizQuestions = parsedData.questions;
			} else {
				throw new Error('Invalid AI response format - missing questions array');
			}

			// Convert quiz questions to expected format if needed
			const convertedQuizQuestions = quizQuestions.map(q => {
				if (q.options && typeof q.options === 'object') {
					// Already in correct format
					return q;
				} else if (Array.isArray(q.options)) {
					// Convert array to object format
					const optionsObj = {};
					q.options.forEach((opt, index) => {
						optionsObj[String.fromCharCode(65 + index)] = opt;
					});
					return {
						...q,
						options: optionsObj
					};
				}
				return q;
			});

			// Create questionContent object
			const questionContent = {
				questionQuiz: convertedQuizQuestions,
				questionEssay: essayQuestions
			};

			console.log('Question Content:', questionContent);

			setAiProgress(100);
			setAiStep('Hoàn thành!');
			setAiGenerating(false);

			// Prepare data for API
			const caseData = {
				title: formData.title, // Use the title from form (can be auto-generated or user-edited)
				user_id: currentUser.id,
				user_email: currentUser.email,
				description: '', // Left empty as requested
				info: {
					industry: formData.industry,
					area: formData.area,
					domain: formData.domain,
					difficulty: formData.difficulty,
					duration: formData.duration,
					playerRole: formData.playerRole,
				},

				questionContent: {
					questionContent: questionContent, // Store the questionContent object
					aiModel: aiSettings.selectedModel,
					// aiPrompt: aiSettings.prompt,
					questionTypes: formData.questionTypes,
					mcqCount: formData.mcqCount,
					essayCount: formData.essayCount
				},
				created_at: createTimestamp()
			};

			// Call API to create case
			const result = await createNewCasePublic(caseData);

			if (onSubmit) {
				onSubmit(result);
			}

			// Reset form
			setFormData({
				title: '', // Will be auto-generated
				description: '', // Will remain empty
				creator: '',
				industry: '',
				area: '',
				domain: '',
				difficulty: 'casual', // Keep default
				duration: '15', // Keep default
				playerRole: '',
				questionTypes: ['mcq'], // Keep default
				mcqCount: 2, // Default for 15 minutes
				essayCount: 1 // Default for 15 minutes
			});

			onClose();
		} catch (error) {
			console.error('Error creating case:', error);
			setError('Có lỗi xảy ra khi tạo case. Vui lòng thử lại.');
			setAiGenerating(false);
			setAiProgress(0);
			setAiStep('');
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		// Reset form
		setFormData({
			title: '', // Will remain empty
			description: '', // Will remain empty
			creator: '',
			industry: '',
			area: '',
			domain: '',
			difficulty: 'casual', // Keep default
			duration: '15', // Keep default
			playerRole: '',
			questionTypes: ['mcq'], // Keep default
			mcqCount: 2, // Default for 15 minutes
			essayCount: 1 // Default for 15 minutes
		});
		setError('');
		onClose();
	};

	if (!isOpen) return null;

	return (
		<>
			<Modal
				title={`Thêm Case Mới`}
				open={isOpen}
				onCancel={handleCancel}
				footer={null}
				width={isMobile ? '100%' : 800}
				style={{
					...(isMobile && { top: '30px' })
				}}
			>
				<div className={styles.modalCreateCase} onClick={(e) => e.stopPropagation()}>
					{aiGenerating && (
						<div style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: 'rgba(255, 255, 255, 0.9)',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							zIndex: 1000,
							borderRadius: '8px'
						}}>
							<Spin size="large" />
							<div style={{ marginTop: '16px', fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
								Đang tạo câu hỏi...
							</div>
							<div style={{ marginTop: '8px', fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '16px' }}>
								{aiStep || 'Vui lòng chờ trong giây lát'}
							</div>
							<div style={{ width: '80%', maxWidth: '300px' }}>
								<Progress 
									percent={aiProgress} 
									status="active"
									strokeColor={{
										'0%': '#108ee9',
										'100%': '#87d068',
									}}
								/>
							</div>
						</div>
					)}

					<form onSubmit={handleSubmit} style={{ opacity: aiGenerating ? 0.6 : 1, pointerEvents: aiGenerating ? 'none' : 'auto' }}>
						<div className={styles.modalBody}>
							{error && (
								<div className={styles.errorMessage}>
									{error}
								</div>
							)}

							{/* Basic Information */}
							<div className={styles.formSection}>
								<h4>0. Thông tin cơ bản</h4>
								<div className={styles.formGroup}>
									<label>Tiêu đề *</label>
									<input
										type="text"
										name="title"
										value={formData.title}
										onChange={handleInputChange}
										placeholder="Tiêu đề case"
										required
									/>
									<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
										* Tiêu đề được tạo tự động, có thể chỉnh sửa
									</div>
								</div>
							</div>

							{/* Classification */}
							<div className={styles.formSection}>
								<h4>1. Phân loại</h4>
								<div className={styles.formGroup}>
									<label>Ngành nghề *</label>
									<select
										name="industry"
										value={formData.industry}
										onChange={handleInputChange}
										required
									>
										<option value="">Chọn ngành nghề</option>
										{industries.map(industry => (
											<option key={industry.value} value={industry.value}>
												{industry.label}
											</option>
										))}
									</select>
								</div>
								<div className={styles.formGroup}>
									<label>Lĩnh vực *</label>
									<select
										name="area"
										value={formData.area}
										onChange={handleInputChange}
										required
										disabled={!formData.industry}
									>
										<option value="">Chọn lĩnh vực</option>
										{Object.values(areas).map(area => (
											<option key={area.value} value={area.value}>
												{area.label}
											</option>
										))}
									</select>
								</div>
								<div className={styles.formGroup}>
									<label>Chủ đề cụ thể *</label>
									<select
										name="domain"
										value={formData.domain}
										onChange={handleInputChange}
										required
										disabled={!formData.area}
									>
										<option value="">Chọn chủ đề</option>
										{formData.area && domains[formData.area]?.map(domain => (
											<option key={domain.value} value={domain.value}>
												{domain.label}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Game Settings */}
							<div className={styles.formSection}>
								<h4>2. Cài đặt game</h4>
								<div className={styles.formGroup}>
									<label>Mức độ khó *</label>
									<div className={styles.radioGroupHorizontal}>
										{difficulties.map(difficulty => (
											<div
												key={difficulty.value}
												className={styles.radioLabelHorizontal}
												data-difficulty={difficulty.value}
												onClick={() => {
													setFormData(prev => ({
														...prev,
														difficulty: difficulty.value
													}));
												}}
											>
												<input
													type="radio"
													name="difficulty"
													value={difficulty.value}
													checked={formData.difficulty === difficulty.value}
													onChange={handleInputChange}
													required
												/>
												<span>{difficulty.label}</span>
											</div>
										))}
									</div>
								</div>
								<div className={styles.formGroup}>
									<label>Thời gian hoàn thành *</label>
									<div className={styles.radioGroupHorizontal}>
										{durations.map(duration => (
											<div
												key={duration.value}
												className={styles.radioLabelHorizontal}
												onClick={() => {
													setFormData(prev => ({
														...prev,
														duration: duration.value
													}));
												}}
											>
												<input
													type="radio"
													name="duration"
													value={duration.value}
													checked={formData.duration === duration.value}
													onChange={handleInputChange}
													required
												/>
												<span>{duration.label}</span>
											</div>
										))}
									</div>
								</div>
								<div className={styles.formGroup}>
									<label>Vai trò người chơi *</label>
									<div className={styles.roleTagGroup}>
										{playerRoles.map(role => (
											<div
												key={role.value}
												className={`${styles.roleTag} ${formData.playerRole === role.value ? styles.roleTagSelected : ''}`}
												onClick={() => {
													setFormData(prev => ({
														...prev,
														playerRole: role.value
													}));
												}}
											>
												<input
													type="radio"
													name="playerRole"
													value={role.value}
													checked={formData.playerRole === role.value}
													onChange={handleInputChange}
													required
												/>
												<span>{role.label}</span>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Question Configuration */}
							<div className={styles.formSection}>
								<h4>3. Cấu hình câu hỏi</h4>
								<div className={styles.formGroup}>
									<label>Loại câu hỏi *</label>
									<div className={styles.checkboxGroup}>
										<div className={styles.checkboxLabel}>
											<input
												type="checkbox"
												name="questionTypes"
												value="mcq"
												checked={formData.questionTypes.includes('mcq')}
												onChange={handleCheckboxChange}
											/>
											<span>Trắc nghiệm (MCQ) - Câu hỏi nhiều lựa chọn</span>
										</div>
										<div className={styles.checkboxLabel}>
											<input
												type="checkbox"
												name="questionTypes"
												value="essay"
												checked={formData.questionTypes.includes('essay')}
												onChange={handleCheckboxChange}
											/>
											<span>Tự luận (Essay) - Câu hỏi mở</span>
										</div>
									</div>
									<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
										* Có thể chọn một hoặc nhiều loại câu hỏi
									</div>
								</div>
								
								{/* Question Count Configuration */}
								<div className={styles.formGroup}>
									<label>Số lượng câu hỏi (có thể điều chỉnh):</label>
									<div className={styles.formGroupRow}>
										{formData.questionTypes.includes('mcq') && (
											<div className={styles.formGroup}>
												<label>Trắc nghiệm (MCQ):</label>
												<input
													type="number"
													name="mcqCount"
													value={formData.mcqCount}
													onChange={handleNumberChange}
													min="0"
													max="20"
													style={{ width: '100px' }}
												/>
												<span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
													câu hỏi
												</span>
											</div>
										)}
										{formData.questionTypes.includes('essay') && (
											<div className={styles.formGroup}>
												<label>Tự luận (Essay):</label>
												<input
													type="number"
													name="essayCount"
													value={formData.essayCount}
													onChange={handleNumberChange}
													min="0"
													max="10"
													style={{ width: '100px' }}
												/>
												<span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
													câu hỏi
												</span>
											</div>
										)}
									</div>
									<div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
										* Số lượng mặc định dựa trên thời gian: 15p (3 câu), 30p (6 câu), 45p (10 câu)
									</div>
								</div>
							</div>
						</div>
						<div className={styles.modalFooter}>
							<button type="button" className={styles.btn} onClick={handleCancel}>
								Hủy
							</button>
							<button
								type="submit"
								className={`${styles.btn} ${styles.btnPrimary}`}
								disabled={loading || aiGenerating}
							>
								{aiGenerating ? (
									<>
										<Spin size="small" style={{ marginRight: '8px' }} />
										Đang tạo câu hỏi...
									</>
								) : loading ? (
									<>
										<Spin size="small" style={{ marginRight: '8px' }} />
										Đang tạo...
									</>
								) : (
									'Thêm Case'
								)}
							</button>
						</div>
					</form>
				</div>
			</Modal>


		</>
	);
};

export default AddCaseModal;
