import css from './WikiExam.module.css';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAllQuiz } from '../../../../apis/quizService';
import { v4 as uuidv4 } from 'uuid';
import { AlertTriangle, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { getAllQuizUser, updateQuizUser } from '../../../../apis/quizUserService';
import { createTimestamp } from '../../../../generalFunction/format.js';
import { message, Modal } from 'antd';
import { MyContext } from '../../../../MyContext';

const ModalCustome = ({ isOpen, onClose, title, children, confirmText, onConfirm, cancelText, type = 'warning' }) => {
	if (!isOpen) return null;

	return (
		<div className={css.modalOverlay} onClick={onClose}>
			<div className={css.modal} onClick={e => e.stopPropagation()}>
				<div className={css.modalHeader}>
					{type === 'warning' ? (
						<AlertTriangle size={24} className={css.warningIcon} />
					) : (
						<CheckCircle size={24} className={css.successIcon} />
					)}
					<h3 className={css.modalTitle}>{title}</h3>
				</div>
				<div className={css.modalContent}>
					{children}
				</div>
				<div className={css.modalActions}>
					{cancelText && (
						<button className={`${css.modalButton} ${css.cancelButton}`} onClick={onClose}>
							{cancelText}
						</button>
					)}
					{confirmText && (
						<button className={`${css.modalButton} ${css.confirmButton}`} onClick={onConfirm}>
							{confirmText}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

const WikiExam = ({ open, handleCloseDoQuiz }) => {
	const { itemID } = useParams();
	const [questions, setQuestions] = useState([]);
	const [quizData, setQuizData] = useState(null);
	const [studentAnswers, setStudentAnswers] = useState({});
	const [timeSpent, setTimeSpent] = useState(0);
	const [submissionTime, setSubmissionTime] = useState(0);
	const [hasStarted, setHasStarted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [quizUser, setQuizUser] = useState(null);
	const { currentUser , loadData, setLoadData } = React.useContext(MyContext);

	// Modal states
	const [showStartModal, setShowStartModal] = useState(false);
	const [showSubmitModal, setShowSubmitModal] = useState(false);
	const [showSubmitSuccessModal, setShowSubmitSuccessModal] = useState(false);
	const [showFailModal, setShowFailModal] = useState(false);
	const [unansweredCount, setUnansweredCount] = useState(0);

	const loadQuizData = async () => {
		try {
			const quiz = await getAllQuiz(itemID);
			setQuizData(quiz);
			
			// Kiểm tra xem người dùng đã làm bài này chưa
			if (currentUser?.email) {
				const userQuizData = await getAllQuizUser(currentUser.email, quiz.id);
				if (userQuizData) {
					setQuizUser(userQuizData);
				}
			}

			if (quiz?.quiz) {
				const formattedQuestions = quiz.quiz
					.filter(q => q.type === 'multiple_choice')
					.map(q => ({
						id: q.id || uuidv4(),
						type: 'multiple_choice',
						question: q.question,
						points: q.points || 1,
						options: q.options,
						correctAnswer: q.correctAnswer,
					}));
				setQuestions(formattedQuestions);
			}
		} catch (error) {
			console.error('Error loading quiz data:', error);
			message.error('Có lỗi khi tải dữ liệu bài kiểm tra');
		}
	};

	useEffect(() => {
		if (itemID && currentUser) {
			loadQuizData();
		}
	}, [itemID , currentUser]);

	// Timer effect
	useEffect(() => {
		if (!hasStarted || isSubmitting) return;

		const timer = setInterval(() => {
			setTimeSpent(prev => prev + 1);
		}, 1000);
		return () => clearInterval(timer);
	}, [hasStarted, isSubmitting]);

	const handleAnswerChange = (questionId, answer) => {
		setStudentAnswers(prev => ({
			...prev,
			[questionId]: answer,
		}));
	};

	const getProgressPercentage = () => {
		const totalQuestions = questions.length;
		const answeredQuestions = Object.keys(studentAnswers).length;
		return (answeredQuestions / totalQuestions) * 100;
	};

	const formatTime = (seconds) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	const handleStartExam = () => {
		if (!currentUser?.email) {
			message.error('Vui lòng đăng nhập để làm bài kiểm tra');
			return;
		}
		setShowStartModal(true);
	};

	const confirmStartExam = async () => {
		try {
			// Tạo bản ghi mới cho người dùng bắt đầu làm bài
			const initialData = {
				user_id: currentUser.email,
				quiz_id: quizData.id,
				date: createTimestamp(),
				timeSpent: 0,
				answer: {},
				status: 'onGoing',
				point: 0
			};

			const newQuizUser = await updateQuizUser(quizUser.id,  initialData);
			setQuizUser(newQuizUser);
			setHasStarted(true);
			setTimeSpent(0);
			setStudentAnswers({});
			setIsSubmitting(false);
			setShowStartModal(false);
		} catch (error) {
			console.error('Error starting exam:', error);
			message.error('Có lỗi khi bắt đầu bài kiểm tra');
		}
	};

	const handleSubmitExam = () => {
		const unansweredQuestions = questions.filter(q => !studentAnswers[q.id]);
		setUnansweredCount(unansweredQuestions.length);
		setShowSubmitModal(true);
	};

	const calculatePoints = () => {
		let totalPoints = 0;
		questions.forEach(question => {
			if (studentAnswers[question.id] === question.correctAnswer) {
				totalPoints += question.points;
			}
		});
		return totalPoints;
	};

	const calculatePercentage = (points) => {
		const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
		return (points / totalPoints) * 100;
	};

	const confirmSubmitExam = async () => {
		try {
			setIsSubmitting(true);
			const points = calculatePoints();
			const percentage = calculatePercentage(points);
			
			const data = {
				user_id: currentUser.email,
				quiz_id: quizData.id,
				date: createTimestamp(),
				timeSpent: timeSpent,
				answer: studentAnswers,
				status: 'complete',
				point: points,
			};

			// Check if user passed based on point_pass percentage
			if (percentage >= quizData.point_pass) {
				// User passed - update database and show success modal
				await updateQuizUser(quizUser.id, data);
				setQuizUser(data);
				setSubmissionTime(timeSpent);
				setHasStarted(false);
				setShowSubmitModal(false);
				setShowSubmitSuccessModal(true);
				setLoadData(!loadData)
				message.success('Nộp bài thành công!');
			} else {
				// User failed - show fail modal
				setShowSubmitModal(false);
				setShowFailModal(true);
				setIsSubmitting(false);
			}
		} catch (error) {
			console.error('Error submitting exam:', error);
			message.error('Có lỗi khi nộp bài');
			setIsSubmitting(false);
		}
	};

	const handleSubmitSuccess = () => {
		setHasStarted(false);
		setTimeSpent(0);
		setSubmissionTime(0);
		setStudentAnswers({});
		setIsSubmitting(false);
		setShowSubmitSuccessModal(false);
		handleCloseDoQuiz();
	};

	const handleFailModalClose = () => {
		setShowFailModal(false);
		// Reset answers and continue exam
		setStudentAnswers({});
		setTimeSpent(0);
	};

	const renderCompletedExam = () => {
		const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
		return (
			<div className={css.completedExam}>
				<h2>Bài kiểm tra đã hoàn thành</h2>
				<div className={css.scoreInfo}>
					<h3>Điểm số của bạn: {quizUser.point}/{totalPoints}</h3>
				</div>
				<div className={css.examContent}>
					<div className={css.questionSection}>
						{questions.map((question, index) => (
							<div key={question.id} className={css.questionItem}>
								<div className={css.questionHeader}>
									<h4>Câu {index + 1}</h4>
									<span className={css.points}>{question.points} điểm</span>
								</div>
								<p className={css.questionText}>{question.question}</p>
								<div className={css.optionsList}>
									{question.options.map((option, optIndex) => (
										<div
											key={optIndex}
											className={`${css.optionItem} 
												${quizUser.answer[question.id] === option ? css.selected : ''}
												${option === question.correctAnswer ? css.correctAnswer : ''}`}
										>
											{option}
											{option === question.correctAnswer && (
												<span className={css.correctBadge}>Đáp án đúng</span>
											)}
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	};

	const renderExamIntro = () => (
		<div className={css.examIntro}>
			<h2>Bài kiểm tra trắc nghiệm</h2>
			<div className={css.examInfo}>
				<div className={css.infoItem}>
					<strong>Tổng số câu hỏi:</strong> {questions.length}
				</div>
				<div className={css.infoItem}>
					<strong>Tổng điểm:</strong> {questions.reduce((sum, q) => sum + q.points, 0)} điểm
				</div>
			</div>
			<button className={css.startButton} onClick={handleStartExam}>
				<PlayCircle size={20} color='#fff' />
				Bắt đầu làm bài
			</button>
		</div>
	);

	const renderExam = () => (
		<>
			<h2>Bài kiểm tra</h2>
			<div className={css.examHeaderProcess}>
				<div className={css.examInfoProcess}>
					<div className={css.timer}>
						<Clock size={16} />
						<span>Thời gian làm bài: {formatTime(timeSpent)}</span>
					</div>
					<div className={css.progress}>
						<span>Tiến độ: {Math.round(getProgressPercentage())}%</span>
						<div className={css.progressBar}>
							<div
								className={css.progressFill}
								style={{ width: `${getProgressPercentage()}%` }}
							/>
						</div>
					</div>
				</div>
			</div>

			<div className={css.examContent}>
				<div className={css.questionSection}>
					{questions.map((question, index) => (
						<div key={question.id} className={css.questionItem}>
							<div className={css.questionHeader}>
								<h4>Câu {index + 1}</h4>
								<span className={css.points}>{question.points} điểm</span>
							</div>
							<p className={css.questionText}>{question.question}</p>
							<div className={css.optionsList}>
								{question.options.map((option, optIndex) => (
									<div
										key={optIndex}
										className={`${css.optionItem} ${studentAnswers[question.id] === option ? css.selected : ''}`}
										onClick={() => handleAnswerChange(question.id, option)}
									>
										<input
											type='radio'
											name={`question-${question.id}`}
											value={option}
											checked={studentAnswers[question.id] === option}
											onChange={() => {}}
										/>
										<label>{option}</label>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
			<div className={css.submitButtonContainer}>
				<button className={css.submitButton} onClick={handleSubmitExam}>
					Nộp bài
				</button>
			</div>
		</>
	);

	return (
		<Modal 
			open={open}
			onCancel={handleCloseDoQuiz}
			footer={null}
			width={800}
		>
			<div className={css.main}>
				<div className={css.content}>
					{!hasStarted ? (
						quizUser?.status === 'complete' ? (
							renderCompletedExam()
						) : (
							renderExamIntro()
						)
					) : (
						renderExam()
					)}

					{/* Start Exam Modal */}
					<ModalCustome
						isOpen={showStartModal}
						onClose={() => setShowStartModal(false)}
						title='Bắt đầu làm bài'
						confirmText='Bắt đầu'
						cancelText='Hủy'
						onConfirm={confirmStartExam}
						type='warning'
					>
						<p>Bạn có chắc chắn muốn bắt đầu làm bài?</p>
						<p>Thời gian sẽ được tính ngay khi bạn bắt đầu.</p>
						<ul style={{ marginLeft: '20px' }}>
							<li>Tổng số câu hỏi: {questions.length}</li>
							<li>Thời gian: Không giới hạn</li>
							<li>Điểm yêu cầu: {quizData?.point_pass}%</li>
							<li>Lưu ý: Hãy đảm bảo bạn có đủ thời gian để hoàn thành bài thi</li>
						</ul>
					</ModalCustome>

					{/* Submit Exam Modal */}
					<ModalCustome
						isOpen={showSubmitModal}
						onClose={() => setShowSubmitModal(false)}
						title='Xác nhận nộp bài'
						confirmText='Nộp bài'
						cancelText='Kiểm tra lại'
						onConfirm={confirmSubmitExam}
						type='warning'
					>
						{unansweredCount > 0 ? (
							<>
								<p>Bạn còn {unansweredCount} câu hỏi chưa trả lời.</p>
								<p>Bạn có chắc chắn muốn nộp bài?</p>
							</>
						) : (
							<p>Bạn đã trả lời tất cả các câu hỏi. Bạn có chắc chắn muốn nộp bài?</p>
						)}
						<p>Thời gian làm bài: {formatTime(timeSpent)}</p>
					</ModalCustome>

					{/* Submit Success Modal */}
					<ModalCustome
						isOpen={showSubmitSuccessModal}
						onClose={handleSubmitSuccess}
						title='Nộp bài thành công'
						confirmText='Đóng'
						onConfirm={handleSubmitSuccess}
						type='success'
					>
						<p>Chúc mừng! Bạn đã hoàn thành bài kiểm tra!</p>
						<p>Thời gian làm bài: {formatTime(submissionTime)}</p>
						<p>Số câu đã trả lời: {Object.keys(studentAnswers).length}/{questions.length}</p>
						<p>Điểm số của bạn: {quizUser?.point}/{questions.reduce((sum, q) => sum + q.points, 0)} ({calculatePercentage(quizUser?.point).toFixed(1)}%)</p>
						<p>Điểm yêu cầu: {quizData?.point_pass}%</p>
						<p style={{ color: '#52c41a', fontWeight: 'bold' }}>Kết quả: Đạt</p>
					</ModalCustome>

					{/* Fail Modal */}
					<ModalCustome
						isOpen={showFailModal}
						onClose={handleFailModalClose}
						title='Kết quả bài kiểm tra'
						confirmText='Làm lại'
						onConfirm={handleFailModalClose}
						type='warning'
					>
						<p>Rất tiếc! Bạn chưa đạt điểm yêu cầu.</p>
						<p>Thời gian làm bài: {formatTime(timeSpent)}</p>
						<p>Số câu đã trả lời: {Object.keys(studentAnswers).length}/{questions.length}</p>
						<p>Điểm số của bạn: {calculatePoints()}/{questions.reduce((sum, q) => sum + q.points, 0)} ({calculatePercentage(calculatePoints()).toFixed(1)}%)</p>
						<p>Điểm yêu cầu: {quizData?.point_pass}%</p>
						<p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>Kết quả: Chưa đạt</p>
						<p>Bạn có thể làm lại bài kiểm tra để cải thiện điểm số.</p>
					</ModalCustome>
				</div>
			</div>
		</Modal>
	);
};

export default WikiExam;