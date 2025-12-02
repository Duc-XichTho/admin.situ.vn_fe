import { Download, Edit2, PlusCircle, Search, Trash2, Upload } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import css from './ContentExam.module.css';
import { v4 as uuidv4 } from 'uuid';
import { getAllQuiz, updateQuiz } from '../../../../../apis/quizService.jsx';
import { message, Modal } from 'antd';

export default function ContentExam({ currentEditItem, closeModal, quizModalVisible }) {
	const [questions, setQuestions] = useState([]);
	const [currentQuestion, setCurrentQuestion] = useState({
		type: 'multiple_choice',
		question: '',
		points: 1,
		options: [],
		correctAnswer: null,
	});
	const [editingQuestionId, setEditingQuestionId] = useState(null);
	const [quizData, setQuizData] = useState(null);
	const [users, setUsers] = useState([]);
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [selectedTeachers, setSelectedTeachers] = useState([]);
	const [showTeacherModal, setShowTeacherModal] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedNote, setSelectedNote] = useState(null);
	const [pointPass, setPointPass] = useState(0);

	useEffect(() => {
		if (currentEditItem) {
			loadQuizData(currentEditItem.id);
		}
	}, [currentEditItem]);

	useEffect(() => {
		const filtered = users.filter(user =>
			user.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
			(user.isAdmin || user.reg_status === 'approved'),
		);
		setFilteredUsers(filtered);
	}, [searchTerm, users]);

	const handleTeacherSelect = (email) => {
		setSelectedTeachers(prev => {
			const isSelected = prev.includes(email);
			if (isSelected) {
				return prev.filter(e => e !== email);
			} else {
				return [...prev, email];
			}
		});
	};

	const saveTeachers = async () => {

	};

	const loadQuizData = async (id) => {
		try {
			const quiz = await getAllQuiz(id);
			setQuizData(quiz);
			if (quiz?.quiz) {
				const formattedQuestions = quiz.quiz.map(q => ({
					id: q.id || uuidv4(),
					type: 'multiple_choice',
					question: q.question,
					points: q.points || 1,
					options: q.options,
					correctAnswer: q.correctAnswer,
				}));
				setQuestions(formattedQuestions);
			}
			if (quiz?.point_pass) {
				setPointPass(quiz.point_pass);
			}
		} catch (error) {
			console.error('Error loading quiz data:', error);
		}
	};

	const addNewQuestion = async () => {
		// Kiểm tra xem có lựa chọn nào đang rỗng không
		const hasEmptyOption = currentQuestion.options.some(opt => opt.trim() === '');
		if (hasEmptyOption) {
			alert('Tất cả các lựa chọn phải có nội dung!');
			return;
		}

		// Kiểm tra các lựa chọn trùng nhau (chỉ kiểm tra các lựa chọn có giá trị)
		const nonEmptyOptions = currentQuestion.options.filter(opt => opt.trim() !== '');
		const uniqueOptions = new Set(nonEmptyOptions);
		if (uniqueOptions.size !== nonEmptyOptions.length) {
			alert('Các lựa chọn không được trùng nhau!');
			return;
		}

		const newQuestion = {
			...currentQuestion,
			id: editingQuestionId || uuidv4(),
		};

		let updatedQuestions;
		if (editingQuestionId) {
			updatedQuestions = questions.map(q =>
				q.id === editingQuestionId ? newQuestion : q,
			);
		} else {
			updatedQuestions = [...questions, newQuestion];
		}

		setQuestions(updatedQuestions);

		try {
			const quizDataToSave = {
				quiz: updatedQuestions.map(q => ({
					id: q.id,
					type: 'multiple_choice',
					question: q.question,
					points: q.points,
					options: q.options,
					correctAnswer: q.correctAnswer,
				})),
			};

			if (quizData?.id) {
				await updateQuiz(quizData.id, quizDataToSave);
			}
		} catch (error) {
			console.error('Error saving quiz:', error);
		}

		setEditingQuestionId(null);
		setCurrentQuestion({
			type: 'multiple_choice',
			question: '',
			points: 1,
			options: [],
			correctAnswer: null,
		});
	};

	const addOption = () => {
		if (currentQuestion.options.length >= 6) {
			alert('Tối đa 6 lựa chọn!');
			return;
		}

		setCurrentQuestion(prev => ({
			...prev,
			options: [...prev.options, ''],
		}));
	};

	const updateOption = async (index, text) => {
		const oldOptionValue = currentQuestion.options[index];
		
		// Nếu text là rỗng thì cho phép cập nhật
		if (text.trim() === '') {
			setCurrentQuestion(prev => ({
				...prev,
				options: prev.options.map((opt, i) =>
					i === index ? text : opt,
				),
				// Nếu đáp án đúng là option đang sửa, reset về null
				correctAnswer: prev.correctAnswer === oldOptionValue ? null : prev.correctAnswer,
			}));
			return;
		}

		// Kiểm tra trùng lặp chỉ với các lựa chọn có giá trị
		const isDuplicate = currentQuestion.options.some((opt, i) =>
			i !== index && opt.trim() === text.trim() && opt.trim() !== ''
		);
		if (isDuplicate) {
			alert('Lựa chọn này đã tồn tại!');
			return;
		}

		setCurrentQuestion(prev => ({
			...prev,
			options: prev.options.map((opt, i) =>
				i === index ? text : opt,
			),
			// Nếu đáp án đúng là option đang sửa, cập nhật theo giá trị mới
			correctAnswer: prev.correctAnswer === oldOptionValue ? text : prev.correctAnswer,
		}));
	};

	const handleCorrectAnswerChange = (option, index) => {
		setCurrentQuestion(prev => ({
			...prev,
			correctAnswer: option
		}));
	};

	const removeOption = async (optionToRemove) => {
		const updatedQuestion = {
			...currentQuestion,
			options: currentQuestion.options.filter(opt => opt !== optionToRemove),
			correctAnswer: currentQuestion.correctAnswer === optionToRemove ? null : currentQuestion.correctAnswer,
		};
		setCurrentQuestion(updatedQuestion);

		if (editingQuestionId) {
			const updatedQuestions = questions.map(q =>
				q.id === editingQuestionId ? updatedQuestion : q,
			);
			setQuestions(updatedQuestions);

			try {
				const quizDataToSave = {
					quiz: updatedQuestions.map(q => ({
						id: q.id,
						type: 'multiple_choice',
						question: q.question,
						points: q.points,
						options: q.options,
						correctAnswer: q.correctAnswer,
					})),
				};

				if (quizData?.id) {
					await updateQuiz(quizData.id, quizDataToSave);
				}
			} catch (error) {
				console.error('Error saving quiz:', error);
			}
		}
	};

	const removeQuestion = async (questionId) => {
		if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) {
			const updatedQuestions = questions.filter(q => q.id !== questionId);
			setQuestions(updatedQuestions);

			try {
				const quizDataToSave = {
					quiz: updatedQuestions.map(q => ({
						id: q.id,
						type: 'multiple_choice',
						question: q.question,
						points: q.points,
						options: q.options,
						correctAnswer: q.correctAnswer,
					})),
				};

				if (quizData?.id) {
					await updateQuiz(quizData.id, quizDataToSave);
				}
			} catch (error) {
				console.error('Error saving quiz:', error);
			}

			if (editingQuestionId === questionId) {
				setEditingQuestionId(null);
				setCurrentQuestion({
					type: 'multiple_choice',
					question: '',
					points: 1,
					options: [],
					correctAnswer: null,
				});
			}
		}
	};

	const editQuestion = (question) => {
		setEditingQuestionId(question.id);
		setCurrentQuestion({
			...question,
		});
		document.querySelector(`.${css.questionForm}`).scrollIntoView({ behavior: 'smooth' });
	};

	const cancelEdit = () => {
		setEditingQuestionId(null);
		setCurrentQuestion({
			type: 'multiple_choice',
			question: '',
			points: 1,
			options: [],
			correctAnswer: null,
		});
	};

	const validateQuestionData = (data, index, rawJson) => {
		const errors = [];
		const warnings = [];
		const questionNumber = index + 1;

		// Tìm vị trí của câu hỏi trong file JSON gốc
		const questionStartIndex = rawJson.indexOf(JSON.stringify(data, null, 2));
		const lineNumber = rawJson.substring(0, questionStartIndex).split('\n').length;

		// Helper function để tạo JSON snippet
		const createJsonSnippet = (obj, path) => {
			const lines = JSON.stringify(obj, null, 2).split('\n');
			const relevantLines = [];
			let foundError = false;
			let errorLine = -1;

			lines.forEach((line, i) => {
				if (line.includes(path.split('.').pop())) {
					foundError = true;
					errorLine = i;
				}
				if (i >= Math.max(0, errorLine - 2) && i <= errorLine + 2) {
					relevantLines.push(line);
				}
			});

			return {
				code: relevantLines.join('\n'),
				errorLine: foundError ? Math.min(2, errorLine) + 1 : -1
			};
		};

		// Kiểm tra cấu trúc cơ bản
		if (!data || typeof data !== 'object') {
			const snippet = createJsonSnippet({ invalidQuestion: data }, 'invalidQuestion');
			errors.push({
				type: 'error',
				field: 'structure',
				message: 'Cấu trúc câu hỏi không hợp lệ, phải là một object',
				line: lineNumber,
				snippet,
				example: '{\n  "question": "Nội dung câu hỏi",\n  "options": ["A", "B"],\n  "correctAnswer": "A"\n}'
			});
			return { errors, warnings };
		}

		// Kiểm tra nội dung câu hỏi
		if (!data.question) {
			const snippet = createJsonSnippet(data, 'question');
			errors.push({
				type: 'error',
				field: 'question',
				message: 'Thiếu nội dung câu hỏi',
				line: lineNumber,
				path: `questions[${index}].question`,
				snippet,
				fix: 'Thêm trường "question" với nội dung câu hỏi'
			});
		} else if (typeof data.question !== 'string') {
			const snippet = createJsonSnippet(data, 'question');
			errors.push({
				type: 'error',
				field: 'question',
				message: `Nội dung câu hỏi phải là text (hiện tại là ${typeof data.question})`,
				line: lineNumber,
				path: `questions[${index}].question`,
				value: JSON.stringify(data.question),
				snippet,
				fix: 'Chuyển nội dung câu hỏi thành dạng text (đặt trong dấu ngoặc kép)'
			});
		} else if (data.question.trim() === '') {
			errors.push({
				type: 'error',
				field: 'question',
				message: 'Nội dung câu hỏi đang trống',
				line: lineNumber,
				path: `questions[${index}].question`,
				fix: 'Thêm nội dung cho câu hỏi'
			});
		} else if (data.question.length < 10) {
			warnings.push({
				type: 'warning',
				field: 'question',
				message: 'Nội dung câu hỏi quá ngắn',
				line: lineNumber,
				path: `questions[${index}].question`,
				value: data.question,
				suggestion: 'Nên viết câu hỏi chi tiết và rõ ràng hơn'
			});
		}

		// Kiểm tra options
		if (!data.options) {
			errors.push({
				type: 'error',
				field: 'options',
				message: 'Thiếu danh sách đáp án',
				line: lineNumber,
				path: `questions[${index}].options`,
				fix: 'Thêm mảng "options" chứa các đáp án',
				example: '"options": ["Đáp án A", "Đáp án B", ...]'
			});
		} else if (!Array.isArray(data.options)) {
			errors.push({
				type: 'error',
				field: 'options',
				message: `Danh sách đáp án phải là mảng (hiện tại là ${typeof data.options})`,
				line: lineNumber,
				path: `questions[${index}].options`,
				value: JSON.stringify(data.options),
				fix: 'Chuyển options thành mảng các đáp án'
			});
		} else {
			// Kiểm tra số lượng đáp án
			if (data.options.length < 2) {
				errors.push({
					type: 'error',
					field: 'options',
					message: `Cần ít nhất 2 đáp án (hiện tại có ${data.options.length})`,
					line: lineNumber,
					path: `questions[${index}].options`,
					fix: 'Thêm đáp án cho đủ ít nhất 2 lựa chọn'
				});
			} else if (data.options.length > 6) {
				warnings.push({
					type: 'warning',
					field: 'options',
					message: `Có quá nhiều đáp án (${data.options.length} đáp án)`,
					line: lineNumber,
					path: `questions[${index}].options`,
					suggestion: 'Nên giới hạn số đáp án từ 2-6 để tránh gây rối cho người học'
				});
			}

			// Kiểm tra đáp án trống hoặc trùng
			const emptyOptions = [];
			const duplicateOptions = new Map();
			data.options.forEach((opt, optIndex) => {
				if (typeof opt !== 'string') {
					errors.push({
						type: 'error',
						field: 'options',
						message: `Đáp án phải là text (đáp án ${optIndex + 1} là ${typeof opt})`,
						line: lineNumber,
						path: `questions[${index}].options[${optIndex}]`,
						value: JSON.stringify(opt),
						fix: 'Chuyển đáp án thành dạng text'
					});
				} else if (opt.trim() === '') {
					emptyOptions.push(optIndex + 1);
				} else {
					const normalizedOpt = opt.toLowerCase().trim();
					if (!duplicateOptions.has(normalizedOpt)) {
						duplicateOptions.set(normalizedOpt, [optIndex + 1]);
					} else {
						duplicateOptions.get(normalizedOpt).push(optIndex + 1);
					}
				}
			});

			if (emptyOptions.length > 0) {
				errors.push({
					type: 'error',
					field: 'options',
					message: `Có đáp án bị trống (đáp án ${emptyOptions.join(', ')})`,
					line: lineNumber,
					path: `questions[${index}].options`,
					fix: 'Điền nội dung cho các đáp án trống'
				});
			}

			// Báo lỗi các đáp án trùng nhau
			duplicateOptions.forEach((positions, opt) => {
				if (positions.length > 1) {
					errors.push({
						type: 'error',
						field: 'options',
						message: `Đáp án trùng lặp "${opt}" ở vị trí ${positions.join(', ')}`,
						line: lineNumber,
						path: `questions[${index}].options`,
						fix: 'Sửa các đáp án trùng lặp thành các đáp án khác nhau'
					});
				}
			});
		}

		// Kiểm tra đáp án đúng
		if (!data.correctAnswer) {
			errors.push({
				type: 'error',
				field: 'correctAnswer',
				message: 'Thiếu đáp án đúng',
				line: lineNumber,
				path: `questions[${index}].correctAnswer`,
				fix: 'Thêm trường "correctAnswer" với giá trị là một trong các đáp án'
			});
		} else if (typeof data.correctAnswer !== 'string') {
			errors.push({
				type: 'error',
				field: 'correctAnswer',
				message: `Đáp án đúng phải là text (hiện tại là ${typeof data.correctAnswer})`,
				line: lineNumber,
				path: `questions[${index}].correctAnswer`,
				value: JSON.stringify(data.correctAnswer),
				fix: 'Chuyển đáp án đúng thành dạng text'
			});
		} else if (Array.isArray(data.options) && !data.options.includes(data.correctAnswer)) {
			errors.push({
				type: 'error',
				field: 'correctAnswer',
				message: `Đáp án đúng "${data.correctAnswer}" không có trong danh sách đáp án`,
				line: lineNumber,
				path: `questions[${index}].correctAnswer`,
				value: data.correctAnswer,
				fix: 'Đáp án đúng phải là một trong các đáp án đã liệt kê',
				available: `Các đáp án hiện có: ${data.options.join(', ')}`
			});
		}

		// Kiểm tra điểm số
		if (data.points !== undefined) {
			if (typeof data.points !== 'number') {
				errors.push({
					type: 'error',
					field: 'points',
					message: `Điểm số phải là số (hiện tại là ${typeof data.points})`,
					line: lineNumber,
					path: `questions[${index}].points`,
					value: JSON.stringify(data.points),
					fix: 'Chuyển điểm số thành dạng số'
				});
			} else if (data.points <= 0) {
				errors.push({
					type: 'error',
					field: 'points',
					message: 'Điểm số phải lớn hơn 0',
					line: lineNumber,
					path: `questions[${index}].points`,
					value: data.points,
					fix: 'Đặt điểm số lớn hơn 0'
				});
			}
			// else if (data.points > 10) {
			// 	warnings.push({
			// 		type: 'warning',
			// 		field: 'points',
			// 		message: 'Điểm số có vẻ cao bất thường',
			// 		line: lineNumber,
			// 		path: `questions[${index}].points`,
			// 		value: data.points,
			// 		suggestion: 'Nên đặt điểm số từ 1-10'
			// 	});
			// }
		}

		return { errors, warnings };
	};

	const handleFileUpload = async (event) => {
		const file = event.target.files[0];
		if (!file) return;

		try {
			const reader = new FileReader();
			reader.onload = async (e) => {
				const rawJson = e.target.result; // Lưu lại nội dung JSON gốc
				try {
					let jsonData;
					try {
						jsonData = JSON.parse(rawJson);
					} catch (parseError) {
						// Khởi tạo các biến cần thiết
						let unexpectedToken = '';
						let position = -1;

						// Xử lý các dạng message lỗi khác nhau
						const patterns = [
							// Pattern 1: "Unexpected token } in JSON at position 31"
							/Unexpected token (.*?) in JSON at position (\d+)/,
							// Pattern 2: "Unexpected token ']', ...n 1", ], "co"... is not valid JSON"
							/Unexpected token ['"]?(.*?)['"]?,.*?"(.*?)".*? is not valid JSON/,
							// Pattern 3: "Expected property name or '}' in JSON at position 31"
							/Expected (.*?) in JSON at position (\d+)/,
							// Pattern 4: Unexpected token ']', ..."n 5", ], "co"... is not valid JSON
							/Unexpected token ['"]?(.*?)['"]?,\s*\.{3}"([^"]+)",\s*\[(.*?)\].*? is not valid JSON/
						];

						for (const pattern of patterns) {
							const match = parseError.message.match(pattern);
							if (match) {
								if (match[2] && !isNaN(match[2])) {
									// Pattern 1 & 3: Có position trong message
									unexpectedToken = match[1];
									position = parseInt(match[2]);
								} else if (match[1] && match[2]) {
									// Pattern 2 & 4: Cần tìm position từ context
									unexpectedToken = match[1];
									const context = match[2];
									position = rawJson.indexOf(context);
									if (position !== -1) {
										// Tìm vị trí token trong đoạn context
										const beforeContext = rawJson.substring(0, position);
										position += beforeContext.length;
									}
								}
								break;
							}
						}

						// Nếu không match được pattern nào, thử tìm position từ message
						if (position === -1) {
							const posMatch = parseError.message.match(/position (\d+)/);
							if (posMatch) {
								position = parseInt(posMatch[1]);
							} else {
								// Thử tìm vị trí từ context trong message
								const contextMatch = parseError.message.match(/\.{3}"([^"]+)"/);
								if (contextMatch) {
									const context = contextMatch[1];
									position = rawJson.indexOf(context);
								}
							}
						}

						// Tìm vị trí của lỗi trong file
						let errorLine = 1;
						let errorColumn = 0;
						let errorContext = '';
						let errorSnippet = '';
						let errorToken = unexpectedToken.replace(/['"]/g, '') || 'token không hợp lệ';
						let questionIndex = -1;

						if (position !== -1) {
							const beforeError = rawJson.substring(0, position);
							const lines = beforeError.split('\n');
							errorLine = lines.length;
							errorColumn = lines[lines.length - 1].length + 1;

							// Tìm câu hỏi chứa lỗi bằng cách đếm số object
							const matches = beforeError.match(/\{(?:[^{}]|{[^{}]*})*\}/g) || [];
							questionIndex = matches.length;

							// Lấy context xung quanh lỗi
							const allLines = rawJson.split('\n');
							const startLine = Math.max(0, errorLine - 3);
							const endLine = Math.min(allLines.length, errorLine + 2);

							// Tạo snippet với highlight dòng lỗi
							errorContext = allLines.slice(startLine, endLine).map((line, i) => {
								const currentLineNumber = startLine + i + 1;
								const isErrorLine = currentLineNumber === errorLine;
								const linePrefix = `${currentLineNumber}| `;
								
								if (isErrorLine) {
									// Tạo dấu ^ chỉ vị trí lỗi chính xác
									const pointer = ' '.repeat(linePrefix.length + errorColumn - 1) + '^';
									// Highlight token gây lỗi và context xung quanh
									const beforeToken = line.substring(0, errorColumn - 1);
									const problematicPart = line.substring(errorColumn - 1, errorColumn + 5);
									const afterToken = line.substring(errorColumn + 5);
									
									return [
										`${linePrefix}${beforeToken}`,
										`<span style="color: #ff4d4f; font-weight: bold">${problematicPart}</span>`,
										afterToken,
										`\n${pointer} <span style="color: #ff4d4f">← Dấu phẩy thừa</span>`
									].join('');
								}
								return `${linePrefix}${line}`;
							}).join('\n');

							// Phân tích lỗi và đưa ra gợi ý sửa
							let errorAnalysis = '';
							if (errorToken.includes(']')) {
								const line = allLines[errorLine - 1] || '';
								if (line.match(/,\s*\]/)) {
									errorAnalysis = 'Xóa dấu phẩy trước dấu đóng mảng ]';
								} else {
									errorAnalysis = 'Có thể bạn đang thiếu dấu phẩy giữa các phần tử trong mảng hoặc đóng mảng quá sớm';
								}
							} else if (errorToken.includes('}')) {
								errorAnalysis = 'Có thể bạn đang thiếu dấu phẩy giữa các thuộc tính hoặc đóng object quá sớm';
							} else if (errorToken.includes(',')) {
								errorAnalysis = 'Có dấu phẩy thừa hoặc thiếu giá trị sau dấu phẩy';
							} else if (errorToken.includes(':')) {
								errorAnalysis = 'Thiếu giá trị sau dấu hai chấm hoặc sai format key-value';
							} else {
								// Phân tích thêm các trường hợp lỗi phổ biến
								const line = allLines[errorLine - 1] || '';
								if (line.includes('""')) {
									errorAnalysis = 'Có chuỗi rỗng hoặc dấu ngoặc kép thừa';
								} else if (line.match(/,\s*[}\]]/) || line.match(/[{\[]\s*,/)) {
									errorAnalysis = 'Dấu phẩy không được đặt trước đóng mảng/object hoặc sau mở mảng/object';
								} else if (line.match(/:\s*$/)) {
									errorAnalysis = 'Thiếu giá trị sau dấu hai chấm';
								} else if (line.match(/[^,{}\[\]"'\d\s]/)) {
									errorAnalysis = 'Có ký tự không hợp lệ trong JSON. Các giá trị chuỗi phải được đặt trong dấu ngoặc kép';
								}
							}

							message.error({
								content: (
									<div>
										<div style={{ marginBottom: '10px' }}>
											<div><strong>File JSON không hợp lệ!</strong></div>
											<div style={{ color: '#ff4d4f', marginBottom: '5px' }}>
												{questionIndex > 0 ? 
													`Lỗi ở câu hỏi thứ ${questionIndex}` :
													'Lỗi ở cấu trúc JSON'
												}
											</div>
											<div style={{ color: '#666' }}>
												Tại dòng {errorLine}, cột {errorColumn}
											</div>
											{errorAnalysis && (
												<div style={{ color: '#1890ff', marginTop: '5px' }}>
													💡 Gợi ý: {errorAnalysis}
												</div>
											)}
										</div>
										<pre style={{ 
											background: '#f5f5f5',
											padding: '10px',
											borderRadius: '4px',
											whiteSpace: 'pre-wrap',
											fontSize: '14px',
											lineHeight: '1.5'
										}} dangerouslySetInnerHTML={{ __html: errorContext }} />
									</div>
								),
								// duration: 10,
								// style: {
								// 	width: '600px',
								// 	marginLeft: '-300px',
								// 	left: '50%'
								// },
								// className: css.errorMessage
							});
						} else {
							// Fallback cho các lỗi khác
							message.error({
								content: (
									<div>
										<div><strong>File JSON không hợp lệ!</strong></div>
										<div>{parseError.message}</div>
									</div>
								),
								duration: 10
							});
						}
						return;
					}

					// Validate JSON structure
					if (!Array.isArray(jsonData)) {
						const snippet = JSON.stringify(jsonData, null, 2).split('\n').slice(0, 5).join('\n') + 
							(JSON.stringify(jsonData, null, 2).split('\n').length > 5 ? '\n...' : '');
						message.error({
							content: (
								<div>
									<div><strong>Cấu trúc file không hợp lệ!</strong></div>
									<div>- Yêu cầu: Mảng các câu hỏi</div>
									<div>- Hiện tại: {typeof jsonData}</div>
									<pre style={{ 
										background: '#f5f5f5', 
										padding: '10px', 
										borderRadius: '4px',
										marginTop: '10px',
										color: '#ff4d4f'
									}}>
										{snippet}
									</pre>
									<div>- Ví dụ cấu trúc đúng:</div>
									<pre style={{ 
										background: '#f5f5f5', 
										padding: '10px', 
										borderRadius: '4px',
										marginTop: '10px',
										color: '#52c41a'
									}}>
										{`[
  {
    "question": "...",
    "options": [...],
    "correctAnswer": "..."
  }
]`}
									</pre>
								</div>
							),
							duration: 0
						});
						return;
					}

					// Validate each question
					const allErrors = [];
					const allWarnings = [];

					jsonData.forEach((question, index) => {
						const { errors, warnings } = validateQuestionData(question, index, rawJson);
						allErrors.push(...errors);
						allWarnings.push(...warnings);
					});

					if (allErrors.length > 0 || allWarnings.length > 0) {
						const errorsByField = new Map();
						allErrors.forEach(error => {
							if (!errorsByField.has(error.field)) {
								errorsByField.set(error.field, []);
							}
							errorsByField.get(error.field).push(error);
						});

						message.error({
							content: (
								<div style={{ maxHeight: '400px', overflow: 'auto' }}>
									<div style={{ marginBottom: '10px' }}>
										<strong>Phát hiện {allErrors.length} lỗi và {allWarnings.length} cảnh báo:</strong>
									</div>
									
									{Array.from(errorsByField.entries()).map(([field, errors]) => (
										<div key={field} style={{ marginBottom: '15px' }}>
											<div style={{ fontWeight: 'bold', color: '#ff4d4f' }}>
												{field.charAt(0).toUpperCase() + field.slice(1)}:
											</div>
											{errors.map((error, i) => (
												<div key={i} style={{ marginLeft: '20px', marginBottom: '10px' }}>
													<div>⚠️ {error.message}</div>
													<div style={{ color: '#666', marginLeft: '20px' }}>
														{error.line && <div>- Dòng: {error.line}</div>}
														{error.path && <div>- Vị trí: {error.path}</div>}
														{error.value && <div>- Giá trị hiện tại: {error.value}</div>}
														{error.snippet && (
															<div>
																<div>- Đoạn code lỗi:</div>
																<pre style={{ 
																	background: '#f5f5f5', 
																	padding: '10px', 
																	borderRadius: '4px',
																	marginTop: '5px',
																	color: error.snippet.errorLine > 0 ? '#ff4d4f' : undefined
																}}>
																	{error.snippet.code}
																</pre>
															</div>
														)}
														{error.fix && <div>- Cách sửa: {error.fix}</div>}
														{error.example && (
															<div>
																<div>- Ví dụ cấu trúc đúng:</div>
																<pre style={{ 
																	background: '#f5f5f5', 
																	padding: '10px', 
																	borderRadius: '4px',
																	marginTop: '5px',
																	color: '#52c41a'
																}}>
																	{error.example}
																</pre>
															</div>
														)}
													</div>
												</div>
											))}
										</div>
									))}

									{allWarnings.length > 0 && (
										<div style={{ marginTop: '15px', color: '#faad14' }}>
											<div style={{ fontWeight: 'bold' }}>Cảnh báo:</div>
											{allWarnings.map((warning, i) => (
												<div key={i} style={{ marginLeft: '20px', marginBottom: '10px' }}>
													<div>⚠️ {warning.message}</div>
													<div style={{ color: '#666', marginLeft: '20px' }}>
														{warning.line && <div>- Dòng: {warning.line}</div>}
														{warning.path && <div>- Vị trí: {warning.path}</div>}
														{warning.value && <div>- Giá trị hiện tại: {warning.value}</div>}
														{warning.suggestion && <div>- Gợi ý: {warning.suggestion}</div>}
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							),
							duration: 10
							// style: { width: '600px' }
						});
						return;
					}

					// Nếu không có lỗi, tiến hành format và lưu
					const formattedQuestions = jsonData.map(q => ({
						id: q.id || uuidv4(),
						type: 'multiple_choice',
						question: q.question,
						points: q.points || 1,
						options: q.options,
						correctAnswer: q.correctAnswer,
					}));

					// Update questions state
					setQuestions(formattedQuestions);

					// Save to backend if quizData exists
					if (quizData?.id) {
						try {
							const quizDataToSave = {
								quiz: formattedQuestions,
							};
							await updateQuiz(quizData.id, quizDataToSave);
							message.success({
								content: (
									<div>
										<div><strong>Upload thành công!</strong></div>
										<div>- Số câu hỏi: {formattedQuestions.length}</div>
										<div>- Tổng điểm: {formattedQuestions.reduce((sum, q) => sum + (q.points || 1), 0)}</div>
									</div>
								)
							});
						} catch (saveError) {
							message.error({
								content: (
									<div>
										<div><strong>Lỗi khi lưu dữ liệu!</strong></div>
										<div>{saveError.message}</div>
										<div>Vui lòng thử lại hoặc liên hệ admin</div>
									</div>
								)
							});
						}
					}
				} catch (error) {
					message.error({
						content: (
							<div>
								<div><strong>Lỗi xử lý file!</strong></div>
								<div>{error.message}</div>
								<div>Vui lòng kiểm tra lại file và thử lại</div>
							</div>
						)
					});
				}
			};

			reader.readAsText(file);
		} catch (error) {
			message.error({
				content: (
					<div>
						<div><strong>Lỗi đọc file!</strong></div>
						<div>{error.message}</div>
						<div>Vui lòng thử lại với file khác</div>
					</div>
				)
			});
		}
		event.target.value = '';
	};

	const handleDownloadTemplate = () => {
		const templateData = [
			{
				id: uuidv4(),
				type: "multiple_choice",
				question: "Đây là câu hỏi mẫu 1?",
				points: 1,
				options: [
					"Đáp án A",
					"Đáp án B",
					"Đáp án C",
					"Đáp án D"
				],
				correctAnswer: "Đáp án A"
			},
			{
				id: uuidv4(),
				type: "multiple_choice",
				question: "Đây là câu hỏi mẫu 2?",
				points: 2,
				options: [
					"Lựa chọn 1",
					"Lựa chọn 2",
					"Lựa chọn 3"
				],
				correctAnswer: "Lựa chọn 2"
			}
		];

		const jsonString = JSON.stringify(templateData, null, 2);
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'quiz_template.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	// Modify handler for select
	const handlePointPassChange = async (e) => {
		setPointPass(Number(e.target.value));
		await updateQuiz(quizData.id, {point_pass : Number(e.target.value)});
	};

	return (
		<Modal open={quizModalVisible} onCancel={closeModal} width={1200}>
			<div className={css.examContainer}>
				<div className={css.header}>
					<h2>Quản lý câu hỏi</h2>
					<div className={css.headerActions}>
						<div className={css.pointPassContainer}>
							<label>Tỉ lệ điểm đạt:</label>
							<div className={css.percentageInputWrapper}>
								<select
									value={pointPass}
									onChange={handlePointPassChange}
									className={css.pointPassSelect}
								>
									<option value="0">0%</option>
									<option value="50">50%</option>
									<option value="60">60%</option>
									<option value="70">70%</option>
									<option value="80">80%</option>
									<option value="90">90%</option>
									<option value="100">100%</option>
								</select>
							</div>
						</div>
						<input
							type="file"
							accept=".json"
							onChange={handleFileUpload}
							style={{ display: 'none' }}
							id="jsonFileInput"
						/>
						<button
							className={css.uploadButton}
							onClick={() => document.getElementById('jsonFileInput').click()}
						>
							<Upload size={20} color="#fff" />
							Upload JSONB
						</button>
						<button
							className={css.downloadButton}
							onClick={handleDownloadTemplate}
						>
							<Download size={20} color="#fff" />
							Tải file mẫu JSONB
						</button>
						{selectedTeachers.length > 0 && (
							<div className={css.selectedTeachers}>
								Giảng viên đã chọn: {selectedTeachers.length}
							</div>
						)}
						{/* <button
							className={css.teacherButton}
							onClick={() => setShowTeacherModal(true)}
						>
							<UserPlus size={20} color="#fff" />
							Quản lý giảng viên
						</button> */}
					</div>
				</div>

				{showTeacherModal && (
					<div className={css.modalOverlay}>
						<div className={css.modal}>
							<h3>Chọn giảng viên</h3>
							<div className={css.searchBox}>
								<Search size={20} />
								<input
									type="text"
									placeholder="Tìm kiếm giảng viên..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
							<div className={css.teacherList}>
								{filteredUsers.map(user => (
									<div key={user.email} className={css.teacherItem}>
										<input
											type="checkbox"
											id={user.email}
											checked={selectedTeachers.includes(user.email)}
											onChange={() => handleTeacherSelect(user.email)}
										/>
										<label htmlFor={user.email}>
											<div className={css.teacherInfo}>
												<span className={css.teacherEmail}>{user.email}</span>
												{user.isAdmin && <span className={css.adminBadge}>Admin</span>}
												{user.reg_status === 'approved' &&
													<span className={css.approvedBadge}>Verified</span>}
											</div>
										</label>
									</div>
								))}
								{filteredUsers.length === 0 && (
									<div className={css.noResults}>
										Không tìm thấy giảng viên phù hợp
									</div>
								)}
							</div>
							<div className={css.modalActions}>
								<button
									className={css.saveButton}
									onClick={saveTeachers}
								>
									Lưu thay đổi ({selectedTeachers.length})
								</button>
								<button
									className={css.cancelButton}
									onClick={() => setShowTeacherModal(false)}
								>
									Hủy
								</button>
							</div>
						</div>
					</div>
				)}

				<div className={css.contentWrapper}>
					<div className={css.questionForm}>
						<h3>{editingQuestionId ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}</h3>

						<div className={css.formGroup}>
							<label>Câu hỏi:</label>
							<textarea
								value={currentQuestion.question}
								onChange={(e) => setCurrentQuestion(prev => ({
									...prev,
									question: e.target.value,
								}))}
								placeholder="Nhập nội dung câu hỏi..."
							/>
						</div>

						<div className={css.formGroup}>
							<label>Điểm số:</label>
							<input
								type="number"
								min="1"
								value={currentQuestion.points}
								onChange={(e) => setCurrentQuestion(prev => ({
									...prev,
									points: parseInt(e.target.value),
								}))}
							/>
						</div>

						<div className={css.optionsSection}>
							<div className={css.optionsHeader}>
								<label>Các lựa chọn:</label>
								<button
									className={css.addOptionButton}
									onClick={addOption}
								>
									<PlusCircle size={20} />
									Thêm lựa chọn
								</button>
							</div>
							{currentQuestion.options.map((option, index) => (
								<div key={index} className={css.optionItem}>
									<input
										type="radio"
										name="correctAnswer"
										checked={currentQuestion.correctAnswer === option}
										onChange={() => handleCorrectAnswerChange(option, index)}
									/>
									<input
										type="text"
										value={option}
										onChange={(e) => updateOption(index, e.target.value)}
										placeholder="Nhập đáp án..."
									/>
									<button
										className={css.removeButton}
										onClick={() => removeOption(option)}
									>
										<Trash2 size={16} />
									</button>
								</div>
							))}
						</div>

						<div className={css.formActions}>
							<button
								className={css.addQuestionButton}
								onClick={addNewQuestion}
								disabled={
									!currentQuestion.question ||
									currentQuestion.options.length < 2 ||
									!currentQuestion.correctAnswer
								}
							>
								<PlusCircle size={20} />
								{editingQuestionId ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}
							</button>
							{editingQuestionId && (
								<button
									className={css.cancelButton}
									onClick={cancelEdit}
								>
									Hủy
								</button>
							)}
						</div>
					</div>

					<div className={css.questionsList}>
						<h3>Danh sách câu hỏi ({questions.length})</h3>
						{questions.map((question, index) => (
							<div key={question.id} className={css.questionItem}>
								<div className={css.questionHeader}>
									<h4>Câu {index + 1}</h4>
									<div className={css.questionActions}>
										<span className={css.points}>{question.points} điểm</span>
										<button
											className={css.editButton}
											onClick={() => editQuestion(question)}
										>
											<Edit2 size={16} />
										</button>
										<button
											className={css.removeButton}
											onClick={() => removeQuestion(question.id)}
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
								<p className={css.questionText}>{question.question}</p>
								<div className={css.optionsList}>
									{question.options.map((option, optIndex) => (
										<div
											key={optIndex}
											className={`${css.optionItem} ${question.correctAnswer === option ? css.correctAnswer : ''}`}
										>
											{option}
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</Modal>
	);
}