import React, { useState, useEffect, useContext } from 'react';
import { Card, Radio, Button, Input, Space, Divider, message, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, BookOutlined, RobotOutlined } from '@ant-design/icons';
import styles from './QuizCaseCreateComponent.module.css';
import k9Styles from '../K9.module.css';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { aiGen } from '../../../apis/aiGen/botService.jsx';
import { MyContext } from '../../../MyContext.jsx';
import { createTimestamp } from '../../../generalFunction/format.js';
import { getCasePublicHistoryByUserAndIdQuestion, createNewCasePublicHistory, updateCasePublicHistory } from '../../../apis/casePublicHistoryService.jsx';

const { TextArea } = Input;

// Configure marked with katex extension
marked.use(markedKatex({
  throwOnError: false,
  strict: false,
  trust: true
}));

const QuizCaseCreateComponent = ({ quizData, questionId, onScoreUpdate }) => {
	const { currentUser, loadQuiz, setLoadQuiz } = useContext(MyContext);
	const [selectedAnswers, setSelectedAnswers] = useState({});
	const [essayAnswers, setEssayAnswers] = useState({});
	const [showResults, setShowResults] = useState(false);
	const [showExplanations, setShowExplanations] = useState({});

	// AI grading states
	const [aiGrading, setAiGrading] = useState({});
	const [isGrading, setIsGrading] = useState(false);
	const [showAiGrades, setShowAiGrades] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [historyId, setHistoryId] = useState(null);

	// LaTeX preprocessing function
	const preprocessLatex = (text) => {
		if (!text) return { processedText: text, latexBlocks: [] };

		let processedText = text;
		const latexBlocks = [];

		// Find and replace display math ($$...$$)
		processedText = processedText.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
			const placeholder = `LATEX_DISPLAY_${latexBlocks.length}`;
			latexBlocks.push({ placeholder, formula, display: true });
			return placeholder;
		});

		// Find and replace inline math ($...$)
		processedText = processedText.replace(/\$([^$]+)\$/g, (match, formula) => {
			const placeholder = `LATEX_INLINE_${latexBlocks.length}`;
			latexBlocks.push({ placeholder, formula, display: false });
			return placeholder;
		});

		return { processedText, latexBlocks };
	};

	// LaTeX postprocessing function
	const postprocessLatex = (html, latexBlocks) => {
		if (!latexBlocks || latexBlocks.length === 0) return html;

		let result = html;

		// Replace placeholders with rendered LaTeX
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

	// Reset all states when quizData changes (when switching items)

	useEffect(() => {
		setSelectedAnswers({});
		setEssayAnswers({});
		setShowResults(false);
		setShowExplanations({});
		setAiGrading({});
		setShowAiGrades({});
		setIsGrading(false);
		setIsSubmitting(false);
		setHistoryId(null);
	}, [quizData]);

	// Load user history for this quiz/article if available
	const loadHistory = async () => {
		try {
			if (!currentUser?.id) return;
			if (!questionId) return;
			setLoadingHistory(true);
			const result = await getCasePublicHistoryByUserAndIdQuestion(currentUser.id, questionId);
			if (result) {
				// Preserve id for future updates
				if (result.id) setHistoryId(result.id);
				// Restore previous session if exists
				if (result.selectedAnswers && typeof result.selectedAnswers === 'object') {
					setSelectedAnswers(result.selectedAnswers);
				}
				if (result.essayAnswers && typeof result.essayAnswers === 'object') {
					setEssayAnswers(result.essayAnswers);
				}
				if (result.aiGrading && typeof result.aiGrading === 'object') {
					setAiGrading(result.aiGrading);
				}
				if (result.status === 'complete') {
					setShowResults(true);
					if (typeof result.score !== 'undefined' && onScoreUpdate) {
						onScoreUpdate(questionId, Number(result.score));
					}
				}
			}
		} catch (e) {
			// Non-blocking if history not found
			console.warn('No history found or failed to load history:', e?.message || e);
		} finally {
			setLoadingHistory(false);
		}
	};

	useEffect(() => {
		loadHistory();
	}, [currentUser, questionId]);

	// Check if quizData exists and has valid structure
	if (!quizData) {
		return null;
	}

	// Check if quizData has at least one valid question type
	const hasQuizQuestions = quizData.questionQuiz && Array.isArray(quizData.questionQuiz) && quizData.questionQuiz.length > 0;
	const hasEssayQuestions = quizData.questionEssay && Array.isArray(quizData.questionEssay) && quizData.questionEssay.length > 0;

	if (!hasQuizQuestions && !hasEssayQuestions) {
		return null;
	}

	const handleQuizAnswerChange = (questionIndex, value) => {
		setSelectedAnswers(prev => ({
			...prev,
			[questionIndex]: value,
		}));
	};

	const handleEssayAnswerChange = (questionIndex, value) => {
		setEssayAnswers(prev => ({
			...prev,
			[questionIndex]: value,
		}));
	};

	const handleSubmitQuiz = async () => {
		if (quizData.questionQuiz && quizData.questionQuiz.length > 0) {
			const answeredCount = Object.keys(selectedAnswers).length;
			const totalQuestions = quizData.questionQuiz.length;

			if (answeredCount < totalQuestions) {
				message.warning(`Vui lòng trả lời tất cả ${totalQuestions} câu hỏi trắc nghiệm!`);
				return;
			}
		}

		// Auto-grade essay questions with AI when submitting
		let latestAiGrading = { ...aiGrading }; // Start with current state
		if (quizData.questionEssay && quizData.questionEssay.length > 0) {
			setIsSubmitting(true);
			message.info('Đang chấm điểm câu tự luận bằng AI...');

			try {
				// Grade essay questions sequentially to avoid timing issues
				for (let index = 0; index < quizData.questionEssay.length; index++) {
					const answer = essayAnswers[index];
					if (answer && answer.trim() !== '') {
						const aiResult = await gradeEssayWithAI(index, true); // returns aiResult string

						if (aiResult && typeof aiResult === 'string' && aiResult.trim() !== '') {
							latestAiGrading[index] = aiResult;
						} else {
							console.warn(`Essay ${index} grading failed during submit:`, aiResult);
						}
					}
				}

				// Update state with all results
				setAiGrading(latestAiGrading);
				message.success('Đã chấm điểm tất cả câu tự luận thành công!');
			} catch (error) {
				console.error('Lỗi khi chấm điểm AI:', error);
				message.warning('Có lỗi khi chấm điểm câu tự luận, nhưng vẫn hiển thị kết quả trắc nghiệm.');
			} finally {
				setIsSubmitting(false);
			}
		}

		setShowResults(true);
		message.success('Đã nộp bài! Xem kết quả bên dưới.');

		// Persist history
		try {
			if (currentUser?.email && questionId) {
				// compute score with latestAiGrading snapshot
				const scoreSaved = (() => {
					let total = 0;
					const totalQuestions = (quizData.questionQuiz?.length || 0) + (quizData.questionEssay?.length || 0);
					const per = totalQuestions > 0 ? 100 / totalQuestions : 0;
					if (quizData.questionQuiz && quizData.questionQuiz.length > 0) {
						quizData.questionQuiz.forEach((q, idx) => {
							if (selectedAnswers[idx] === q?.correct_answer) total += per;
						});
					}
					if (quizData.questionEssay && quizData.questionEssay.length > 0) {
						quizData.questionEssay.forEach((q, idx) => {
							const ans = essayAnswers[idx];
							const res = latestAiGrading[idx];
							if (ans && ans.trim() !== '' && res) {
								// Try multiple regex patterns to extract score
								let m = String(res).match(/ĐIỂM:\s*(\d+(?:\.\d+)?)\/10/i);
								if (!m) {
									// Fallback: try to find any number before /10
									m = String(res).match(/(\d+(?:\.\d+)?)\/10/i);
								}

								if (m) {
									const score = parseFloat(m[1]);
									const essayScore = (score / 10) * per;
									total += essayScore;
								} else {
									console.warn(`Essay ${idx + 1}: Could not extract score from AI result:`, res);
									console.warn(`Full AI result:`, res);
								}
							}
						});
					}
					return Math.round(total);
				})();

				// Validate and clean aiGrading data before saving
				const aiGradingToSave = validateAiGrading(latestAiGrading);



				const payload = {
					id: historyId || undefined,
					user_email: currentUser.email,
					user_id: currentUser.id,
					case_id: questionId,
					selectedAnswers,
					essayAnswers,
					aiGrading: aiGradingToSave, // Use the processed aiGradingToSave
					score: scoreSaved,
					status: 'complete',
					updated_at: createTimestamp(),
				};


				let saved;
				if (historyId) {
					saved = await updateCasePublicHistory(payload);
					setLoadQuiz(!loadQuiz);
				} else {
					saved = await createNewCasePublicHistory(payload);
					setLoadQuiz(!loadQuiz);
				}

				const savedId = saved?.data?.id || saved?.id;
				if (savedId) setHistoryId(savedId);

				// Update local state to match what was saved
				setAiGrading(aiGradingToSave);

				if (onScoreUpdate) {
					onScoreUpdate(questionId, Number(scoreSaved));
				}
			}
		} catch (e) {
			console.error('Lỗi lưu lịch sử quiz:', e);
		}
	};

	const handleResetQuiz = () => {
		setSelectedAnswers({});
		setEssayAnswers({});
		setShowResults(false);
		setShowExplanations({});
		setAiGrading({});
		setShowAiGrades({});
		setIsSubmitting(false);
		message.info('Đã làm lại bài quiz!');
	};

	const toggleExplanation = (questionIndex) => {
		setShowExplanations(prev => ({
			...prev,
			[questionIndex]: !prev[questionIndex],
		}));
	};

	// AI grading function for essay questions
	const gradeEssayWithAI = async (questionIndex, silent = false) => {
		const question = quizData.questionEssay[questionIndex];
		const answer = essayAnswers[questionIndex];

		if (!answer || answer.trim() === '') {
			if (!silent) {
				message.warning('Vui lòng nhập câu trả lời trước khi chấm điểm!');
			}
			return null; // Return null instead of undefined
		}

		if (!silent) {
			setIsGrading(true);
		}

		try {
			const systemMessage = `
       Vai trò: Bạn là một AI chuyên chấm điểm bài luận, đóng vai trò như một giáo viên giàu kinh nghiệm.
Nhiệm vụ: Chấm điểm câu trả lời của học sinh dựa trên câu hỏi được cung cấp. Phản hồi của bạn phải có tính phê bình xây dựng, súc tích và đi thẳng vào vấn đề, đồng thời cung cấp một bài luận mẫu để tham khảo.
Yêu cầu bắt buộc
Thang điểm: Chấm trên thang điểm 10.
Phong cách: Trực diện, chuyên nghiệp và mang tính xây dựng. Luôn bắt đầu phần nhận xét bằng một lời khen cụ thể, sau đó cân bằng giữa các điểm mạnh và các điểm cần cải thiện một cách khách quan.
Nội dung đầu ra:
Phần nhận xét: Súc tích, không quá 500 ký tự.
Phần trả lời tham khảo: Cung cấp một bài luận mẫu, toàn diện, dài khoảng 300-500 từ. Bài luận phải có cấu trúc rõ ràng:
Mở bài: Giới thiệu vấn đề và các luận điểm chính.
Thân bài: Phát triển từng luận điểm trong các đoạn văn riêng biệt. Sử dụng in đậm hoặc các tiêu đề nhỏ để làm nổi bật các ý chính.
Kết bài: Tóm tắt lại các luận điểm và đưa ra kết luận.
Sử dụng bảng biểu nếu cần thiết (ví dụ: với các câu hỏi liên quan đến dữ liệu tài chính).

YÊU CẦU BẮT BUỘC:
- Phải bắt đầu bằng "**ĐIỂM:** [số]/10" (chỉ dùng số nguyên, không dùng số thập phân)
- Sau đó là "**NHẬN XÉT:**" với các điểm chính

VÍ DỤ ĐỊNH DẠNG:
**ĐIỂM:** [điểm]/10
**NHẬN XÉT:**
* **Ghi nhận:** [Khen ngợi 1 điểm mạnh cụ thể và nổi bật nhất của bài viết. Ví dụ: "Lập luận sắc bén", "Cấu trúc rõ ràng", "Ví dụ thực tế tốt".]
* **Nội dung:** [Nhận xét ngắn gọn về ý tưởng, lập luận, và sự liên quan đến câu hỏi.]
* **Trình bày:** [Nhận xét ngắn gọn về cấu trúc, logic, và cách diễn đạt.]
* **Cải thiện:** [Đưa ra 1-2 gợi ý cụ thể, có tính hành động để cải thiện bài viết.]
---
**TRẢ LỜI THAM KHẢO:**
[Một bài luận mẫu, được trình bày rõ ràng, trả lời toàn diện câu hỏi đã cho. Độ dài khoảng 300-500 từ và có cấu trúc rõ ràng.]

LƯU Ý: Chỉ dùng số nguyên từ 1-10, không dùng 7.5, 8.3, v.v.`;

			const prompt = `Câu hỏi: ${question.question}
       
       Câu trả lời của học sinh: ${answer}
       
       Hãy chấm điểm và đưa ra nhận xét chi tiết.`;

			const response = await aiGen(prompt, systemMessage, 'google/gemini-2.5-flash', 'text');

			// Extract the actual result text from AI response
			let aiResult = '';
			if (response && typeof response === 'object') {
				// Check for the result field first (based on the log structure)
				if (response.result && typeof response.result === 'string') {
					aiResult = response.result;
				} else if (response.data && typeof response.data === 'string') {
					aiResult = response.data;
				} else if (response.message && typeof response.message === 'string') {
					// Fallback to message if result is not available
					aiResult = response.message;
				} else {
					// Fallback: convert object to string
					aiResult = JSON.stringify(response, null, 2);
				}
			} else if (typeof response === 'string') {
				aiResult = response;
			} else {
				aiResult = 'Không thể xử lý kết quả từ AI';
			}

			// Ensure aiResult is a string
			if (typeof aiResult !== 'string') {
				aiResult = String(aiResult);
			}


			// Validate that we have a proper grading result
			if (!aiResult.includes('ĐIỂM:')) {
				console.warn(`Essay ${questionIndex}: AI result does not contain expected grading format:`, aiResult);
			}

			// Only update state if not silent (for individual grading)
			if (!silent) {
				setAiGrading(prev => {
					const newGrading = { ...prev, [questionIndex]: aiResult };
					return newGrading;
				});
				message.success('Đã chấm điểm câu tự luận thành công!');
			}

			// Always return the result for both silent and non-silent calls
			return aiResult;
		} catch (error) {
			console.error(`Lỗi khi chấm điểm AI cho essay ${questionIndex}:`, error);
			if (!silent) {
				message.error('Không thể chấm điểm câu tự luận. Vui lòng thử lại!');
			}
			return null; // Return null on error
		} finally {
			if (!silent) {
				setIsGrading(false);
			}
		}
	};

	// Toggle AI grades display
	const toggleAiGrades = () => {
		setShowAiGrades(prev => !prev);
	};

	// Helper function to validate and clean aiGrading data
	const validateAiGrading = (aiGradingData) => {
		const cleaned = {};
		let validCount = 0;

		if (aiGradingData && typeof aiGradingData === 'object') {
			Object.keys(aiGradingData).forEach(index => {
				const aiResult = aiGradingData[index];
				const answer = essayAnswers[index];

				// Check if we have both answer and AI grading
				if (answer && answer.trim() !== '' && aiResult && typeof aiResult === 'string') {
					// Validate that AI result contains expected format
					if (aiResult.includes('ĐIỂM:') || aiResult.match(/\d+\/10/)) {
						cleaned[index] = aiResult;
						validCount++;
					} else {
					}
				} else {
					console.warn(`Missing answer or AI grading for essay ${index}:`, {
						answer: answer?.trim(),
						aiResult: aiResult,
					});
				}
			});
		}

		return cleaned;
	};

	// Test function to verify AI grading before submit
	const testAiGradingBeforeSubmit = async () => {
		const testResults = {};

		for (let index = 0; index < (quizData.questionEssay?.length || 0); index++) {
			const answer = essayAnswers[index];
			if (answer && answer.trim() !== '') {
				const result = await gradeEssayWithAI(index, true);
				testResults[index] = result;
			}
		}
		return testResults;
	};

	const calculateScore = () => {
		let totalScore = 0;
		const totalQuestions = (quizData.questionQuiz?.length || 0) + (quizData.questionEssay?.length || 0);

		if (totalQuestions === 0) return 0;

		const pointsPerQuestion = 100 / totalQuestions; // Chia đều điểm cho mỗi câu

		// Calculate quiz score
		if (quizData.questionQuiz && quizData.questionQuiz.length > 0) {
			let quizScore = 0;
			quizData.questionQuiz.forEach((question, index) => {
				if (selectedAnswers[index] === question?.correct_answer) {
					quizScore += pointsPerQuestion;
				}
			});
			totalScore += quizScore;
		}

		// Calculate essay score using AI grading
		if (quizData.questionEssay && quizData.questionEssay.length > 0) {
			let essayScore = 0;
			quizData.questionEssay.forEach((question, index) => {
				const answer = essayAnswers[index];
				const aiResult = aiGrading[index];

			

				if (answer && answer.trim() !== '' && aiGrading[index]) {
					// Try multiple regex patterns to extract score
					let scoreMatch = aiResult.match(/ĐIỂM:\s*(\d+(?:\.\d+)?)\/10/i);

					if (!scoreMatch) {
						// Fallback: try to find any number before /10
						scoreMatch = aiResult.match(/(\d+(?:\.\d+)?)\/10/i);
					}

					if (scoreMatch) {
						const score = parseFloat(scoreMatch[1]);
						// Convert from 0-10 scale to 0-pointsPerQuestion scale
						const essayPoints = (score / 10) * pointsPerQuestion;
						essayScore += essayPoints;
					} else {
						console.warn(`Could not extract score from AI result for essay ${index}:`, aiResult);
						console.warn(`Full AI result:`, aiResult);
					}
				}
			});
			totalScore += essayScore;
		}



		return Math.round(totalScore);
	};

	const getScoreColor = (score) => {
		if (score >= 80) return '#52c41a';
		if (score >= 60) return '#faad14';
		return '#ff4d4f';
	};

	const getScoreMessage = (score) => {
		if (score >= 80) return 'Xuất sắc!';
		if (score >= 60) return 'Khá tốt!';
		return 'Cần cải thiện!';
	};

	return (
		<div className={styles.quizContainer}>
			<div className={styles.quizWrapper}>
				<div className={styles.quizHeader}>
					<BookOutlined className={styles.quizHeaderIcon} />
					<span>Bài Quiz</span>
				</div>
				{/* Quiz Questions */}
				{hasQuizQuestions && (
					<div className={styles.quizSection}>
						<h4 className={styles.quizSectionTitle}>
							📝 Câu hỏi trắc nghiệm ({quizData.questionQuiz.length} câu)
						</h4>

						{quizData.questionQuiz.map((question, index) => (
							<div key={index} className={styles.questionContainer}>
								<div style={{
									fontWeight: '500',
									marginBottom: '12px',
									fontSize: '15px',
									color: '#262626',
									display: 'flex',
									alignItems: 'flex-start',
									gap: '8px'
								}}>
									<span style={{ color: '#1890ff', flexShrink: 0 }}>
										Câu {index + 1}:
									</span>
									<div
										className={`${k9Styles.markdownContent} ${k9Styles.markdownInline}`}
										style={{ flex: 1 }}
										dangerouslySetInnerHTML={{
											__html: (() => {
												const { processedText, latexBlocks } = preprocessLatex(question.question || '');
												const html = marked.parse(processedText, {
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

								<Radio.Group
									value={selectedAnswers[index]}
									onChange={(e) => handleQuizAnswerChange(index, e.target.value)}
									disabled={showResults}
								>
									<Space direction='vertical' style={{ width: '100%' }}>
										{Object.entries(question.options).map(([key, value]) => (
											<Radio
												key={key}
												value={key}
												className={`${styles.radioOption} ${showResults
														? (key === question?.correct_answer
															? styles.radioOptionCorrect
															: (selectedAnswers[index] === key && key !== question?.correct_answer
																? styles.radioOptionIncorrect
																: styles.radioOptionDisabled))
														: ''
													}`}
											>
												<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
													<div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', flex: 1 }}>
														<span style={{ flexShrink: 0 }}>{key}.</span>
														<div
															className={`${k9Styles.markdownContent} ${k9Styles.markdownInline}`}
															style={{ flex: 1 }}
															dangerouslySetInnerHTML={{
																__html: (() => {
																	const { processedText, latexBlocks } = preprocessLatex(value || '');
																	const html = marked.parse(processedText, {
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
													{showResults && (
														<span style={{ flexShrink: 0 }}>
															{key === question?.correct_answer ? (
																<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
															) : (selectedAnswers[index] === key && key !== question?.correct_answer) ? (
																<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
															) : null}
														</span>
													)}
												</div>
											</Radio>
										))}
									</Space>
								</Radio.Group>

								{/* Explanation */}
								{showResults && question.explanation && (
									<div style={{ marginTop: '12px' }}>
										<Button
											type='text'
											size='small'
											onClick={() => toggleExplanation(index)}
											className={styles.explanationButton}
										>
											{showExplanations[index] ? 'Ẩn giải thích' : 'Xem giải thích'}
										</Button>
										{showExplanations[index] && (
											<div className={styles.explanationContent}>
												<strong className={styles.explanationTitle}>💡 Giải thích:</strong>
												<div
													className={k9Styles.markdownContent}
													dangerouslySetInnerHTML={{
														__html: (() => {
															const { processedText, latexBlocks } = preprocessLatex(question.explanation || '');
															const html = marked.parse(processedText, {
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
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{/* Essay Questions */}
				{hasEssayQuestions && (
					<div>
						<Divider />
						<h4 className={styles.essaySectionTitle}>
							✍️ Câu hỏi tự luận ({quizData.questionEssay.length} câu)
						</h4>

						{quizData.questionEssay.map((question, index) => (
							<div key={index} className={styles.questionContainer}>
								<div style={{
									fontWeight: '500',
									marginBottom: '12px',
									fontSize: '15px',
									color: '#262626',
									display: 'flex',
									alignItems: 'flex-start',
									gap: '8px'
								}}>
									<span style={{ color: '#722ed1', flexShrink: 0 }}>
										Câu {index + 1}:
									</span>
									<div
										className={`${k9Styles.markdownContent} ${k9Styles.markdownInline}`}
										style={{ flex: 1 }}
										dangerouslySetInnerHTML={{
											__html: (() => {
												const { processedText, latexBlocks } = preprocessLatex(question.question || '');
												const html = marked.parse(processedText, {
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

								<TextArea
									rows={4}
									placeholder='Nhập câu trả lời của bạn...'
									value={essayAnswers[index] || ''}
									onChange={(e) => handleEssayAnswerChange(index, e.target.value)}
									disabled={showResults}
									className={styles.essayTextArea}
								/>

								{/* AI Grade Display - Show whenever AI grading is available */}
								{aiGrading[index] && (
									<div className={styles.aiGradingContainer}>
										<div className={styles.aiGradingHeader}>
											<RobotOutlined />
											<span>Đánh giá của AI</span>
											<span className={styles.aiGradingStatus}>
												✅ Đã chấm điểm
											</span>
										</div>
										<div className={k9Styles.markdownContent} dangerouslySetInnerHTML={{
											__html: (() => {
												const { processedText, latexBlocks } = preprocessLatex(aiGrading[index] || 'Lỗi hiển thị kết quả từ AI');
												const html = marked.parse(processedText, {
													headerIds: true,
													mangle: false,
													headerPrefix: '',
													breaks: false,
													gfm: true
												});
												const finalHtml = postprocessLatex(html, latexBlocks);
												return DOMPurify.sanitize(finalHtml);
											})(),
										}} />
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{/* Results */}
				{showResults && (hasQuizQuestions || hasEssayQuestions) && (
					<div className={styles.resultsContainer}>
						<h3 className={styles.resultsTitle}>
							🎯 Kết quả bài quiz
						</h3>

						{/* Quiz Results */}
						{hasQuizQuestions && (
							<>
								<div className={styles.totalScore}>
									Điểm tổng: <span style={{ color: getScoreColor(calculateScore()) }}>
										{calculateScore()}/100
									</span>
								</div>

								<div className={styles.scoreMessage} style={{ color: getScoreColor(calculateScore()) }}>
									{getScoreMessage(calculateScore())}
								</div>

								{/* Detailed Score Breakdown */}
								<div className={styles.scoreBreakdown}>
									{/* Quiz Score */}
									{hasQuizQuestions && (
										<div className={styles.scoreSection}>
											<div className={styles.scoreSectionTitle}>
												📝 Trắc nghiệm
											</div>
											<div className={styles.scoreSectionCount}>
												{Object.keys(selectedAnswers).filter(index =>
													selectedAnswers[index] === quizData.questionQuiz[index]?.correct_answer,
												).length} / {quizData.questionQuiz.length} câu đúng
											</div>
											<div className={styles.scoreSectionPoints}>
												{Math.round((Object.keys(selectedAnswers).filter(index =>
													selectedAnswers[index] === quizData.questionQuiz[index]?.correct_answer,
												).length * (100 / ((quizData.questionQuiz?.length || 0) + (quizData.questionEssay?.length || 0)))))}/{Math.round((quizData.questionQuiz?.length || 0) * (100 / ((quizData.questionQuiz?.length || 0) + (quizData.questionEssay?.length || 0))))} điểm
											</div>
										</div>
									)}

									{/* Essay Score */}
									{hasEssayQuestions && (
										<div className={styles.scoreSection}>
											<div className={styles.essayScoreSectionTitle}>
												✍️ Tự luận
											</div>
											<div className={styles.scoreSectionCount}>
												{Object.keys(aiGrading).length} câu đã chấm
											</div>
											<div className={styles.essayScoreSectionPoints}>
												{(() => {
													let essayTotalScore = 0;
													let essayCount = 0;
													const pointsPerQuestion = 100 / ((quizData.questionQuiz?.length || 0) + (quizData.questionEssay?.length || 0));

													quizData.questionEssay.forEach((question, index) => {
														const answer = essayAnswers[index];
														const aiResult = aiGrading[index];


														if (answer && answer.trim() !== '' && aiGrading[index]) {
															essayCount++;
															// Try multiple regex patterns to extract score
															let scoreMatch = aiResult.match(/ĐIỂM:\s*(\d+(?:\.\d+)?)\/10/i);

															if (!scoreMatch) {
																// Fallback: try to find any number before /10
																scoreMatch = aiResult.match(/(\d+(?:\.\d+)?)\/10/i);
															}

															if (scoreMatch) {
																const score = parseFloat(scoreMatch[1]);
																const essayScore = (score / 10) * pointsPerQuestion;
																essayTotalScore += essayScore;
															} else {
																console.warn(`Could not extract score from AI result for essay ${index}:`, aiResult);
																console.warn(`Full AI result:`, aiResult);
															}
														}
													});

													return Math.round(essayTotalScore);
												})()}/{Math.round((quizData.questionEssay?.length || 0) * (100 / ((quizData.questionQuiz?.length || 0) + (quizData.questionEssay?.length || 0))))} điểm
											</div>
										</div>
									)}
								</div>
							</>
						)}

						{/* Essay Results Summary */}
						{hasEssayQuestions && (
							<div className={styles.essayResultsSummary}>
								<h4 className={styles.essayResultsTitle}>
									✍️ Kết quả câu tự luận
								</h4>
								<div className={styles.essayResultsText}>
									{Object.keys(aiGrading).length > 0
										? `AI đã chấm điểm ${Object.keys(aiGrading).length}/${quizData.questionEssay.length} câu tự luận. Xem chi tiết bên trên.`
										: 'Không có câu tự luận nào được chấm điểm.'
									}
								</div>

							</div>
						)}
					</div>
				)}

				{/* Instructions */}
				{!showResults && (hasQuizQuestions || hasEssayQuestions) && (
					<div className={styles.instructionsContainer}>
						<div className={styles.instructionsTitle}>📋 Hướng dẫn:</div>
						<ul className={styles.instructionsList}>
							<li>Trả lời tất cả câu hỏi trắc nghiệm để có thể nộp bài</li>
							<li>Bài tự luận không bắt buộc phải trả lời</li>
							<li>AI sẽ tự động chấm điểm câu tự luận khi nộp bài</li>
							<li>Điểm tổng = Tổng điểm tất cả câu (mỗi câu được chia đều điểm từ 100)</li>
							<li>Nhấn "Nộp bài" để xem kết quả</li>
							<li>Nhấn "Làm lại" để làm lại từ đầu</li>
						</ul>
					</div>
				)}

				<Space className={styles.actionButtons}>
					{!showResults && (hasQuizQuestions || hasEssayQuestions) && (
						<Button type='primary' onClick={handleSubmitQuiz} loading={isSubmitting}>
							{isSubmitting ? 'Đang nộp bài...' : 'Nộp bài'}
						</Button>
					)}
					{/* {(hasQuizQuestions || hasEssayQuestions) && (
						<Button onClick={handleResetQuiz}>
							Làm lại
						</Button>
					)} */}
				</Space>
			</div>
		</div>
	);
};

export default QuizCaseCreateComponent;
