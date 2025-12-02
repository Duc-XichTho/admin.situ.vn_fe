import React, {useContext, useEffect, useState} from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import MainArea from './components/MainArea/MainArea';
import AnswerPanel from './components/AnswerPanel/AnswerPanel';
import {getAllQuestion} from '../../apis/questionService';
import {createNewQuestionHistory, getQuestionHistoryByUser} from '../../apis/questionHistoryService';
import {getAllCategory} from '../../apis/categoryService';
import {MyContext} from '../../MyContext';
import styles from './Visao.module.css';
import {aiGen} from "../../apis/aiGen/botService.jsx";
import {createTimestamp} from "../../generalFunction/format.js";

const Visao = () => {
    const {currentUser} = useContext(MyContext);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [currentAnswer, setCurrentAnswer] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentLevel, setCurrentLevel] = useState('elementary');
    const [inputValue, setInputValue] = useState('');
    const [questions, setQuestions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [history, setHistory] = useState([]);
    const [reflectionQuestion, setReflectionQuestion] = useState('');
    const [currentQuestionHistoryId, setCurrentQuestionHistoryId] = useState(null);
    const [pendingQuestions, setPendingQuestions] = useState(new Map()); // Quản lý câu hỏi đang xử lý

    // Hàm kiểm tra quyền người dùng
    const getUserPermissions = () => {
        if (!currentUser) return {
            canCustomQuestion: false,
            canUseVoice: false,
            canUseReflection: false,
            canUseAIEvaluation: false
        };

        // Admin có tất cả quyền
        if (currentUser.isAdmin) {
            return {canCustomQuestion: true, canUseVoice: true, canUseReflection: true, canUseAIEvaluation: true};
        }

        // VIP có tất cả quyền
        try {
            if (currentUser.info) {
                const userInfo = typeof currentUser.info === 'string' ? JSON.parse(currentUser.info) : currentUser.info;
                if (userInfo.userGroup === 'vip') {
                    return {
                        canCustomQuestion: true,
                        canUseVoice: true,
                        canUseReflection: true,
                        canUseAIEvaluation: true
                    };
                }
                // Premium có quyền hỏi câu hỏi tùy chỉnh và làm bài suy ngẫm nhưng không có AI đánh giá
                if (userInfo.userGroup === 'premium') {
                    return {
                        canCustomQuestion: true,
                        canUseVoice: false,
                        canUseReflection: true,
                        canUseAIEvaluation: false
                    };
                }
            }
        } catch (error) {
            console.warn('Error parsing user info:', error);
        }

        // Normal user chỉ được chọn câu hỏi có sẵn
        return {canCustomQuestion: false, canUseVoice: false, canUseReflection: false, canUseAIEvaluation: false};
    };

    const userPermissions = getUserPermissions();

    // Load data từ BE khi component mount
    useEffect(() => {
        loadData();
    }, []);

    // Load history khi user thay đổi
    useEffect(() => {
        if (currentUser?.email) {
            loadHistory();
        } else {
            setHistory([]);
        }
    }, [currentUser]);

    // Load history khi pendingQuestions thay đổi
    useEffect(() => {
        if (currentUser?.email) {
            loadHistory();
        }
    }, [pendingQuestions, currentUser]);

    const loadData = async () => {
        try {
            const [questionsRes, categoriesRes] = await Promise.all([
                getAllQuestion(),
                getAllCategory()
            ]);

            // Sort questions by index
            const sortedQuestions = (questionsRes || []).sort((a, b) => {
                if (a.index === null && b.index === null) return 0;
                if (a.index === null) return 1;
                if (b.index === null) return -1;
                return a.index - b.index;
            });

            setQuestions(sortedQuestions);
            setCategories(categoriesRes || []);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const loadHistory = async () => {
        try {
            const data = await getQuestionHistoryByUser(currentUser.email);
            const sortedData = (data || []).sort((a, b) => b.id - a.id);

            // Kết hợp với pending questions
            const combinedHistory = [...sortedData];

            // Thêm các câu hỏi đang pending vào đầu danh sách
            pendingQuestions.forEach((pendingItem, question) => {
                // Luôn thêm pending questions vào đầu danh sách
                combinedHistory.unshift(pendingItem);
            });

            console.log('📝 LoadHistory - Server data:', sortedData.length, 'Pending:', pendingQuestions.size, 'Combined:', combinedHistory.length);
            setHistory(combinedHistory);
        } catch (error) {
            console.error('Error loading history:', error);
            // Nếu lỗi từ server, vẫn hiển thị pending questions
            const pendingOnly = Array.from(pendingQuestions.values());
            console.log('📝 LoadHistory - Error, showing pending only:', pendingOnly.length);
            setHistory(pendingOnly);
        }
    };

    // Debug: Theo dõi state changes
    useEffect(() => {
        console.log('State changed:', {currentAnswer, isProcessing, reflectionQuestion, currentQuestionHistoryId});
    }, [currentAnswer, isProcessing, reflectionQuestion, currentQuestionHistoryId]);

    const handleSubmitQuestion = async (question) => {
        if (!question.trim()) return;

        // Kiểm tra quyền nếu không phải câu hỏi từ danh sách có sẵn
        const isFromSampleQuestions = questions.some(q =>
            q.question.toLowerCase().includes(question.toLowerCase()) &&
            q.show === true
        );

        if (!isFromSampleQuestions && !userPermissions.canCustomQuestion) {
            alert('Bạn không có quyền hỏi câu hỏi tùy chỉnh. Vui lòng chọn câu hỏi từ danh sách có sẵn hoặc nâng cấp lên Premium/VIP để sử dụng tính năng này!');
            return;
        }

        console.log('Submitting question:', question);
        setIsProcessing(true);
        setCurrentQuestion(question);
        setReflectionQuestion(''); // Reset reflection question
        setCurrentQuestionHistoryId(null); // Reset question history ID

        // Thêm câu hỏi vào pending questions
        const tempId = `temp_${Date.now()}`;
        const processingItem = {
            id: tempId,
            question: question,
            status: 'processing',
            user_email: currentUser?.email,
            level: currentLevel,
            created_at: new Date().toISOString()
        };

        setPendingQuestions(prev => {
            const newMap = new Map(prev.set(question, processingItem));
            console.log('🔄 Added to pending questions:', question, 'Total pending:', newMap.size);
            return newMap;
        });

        // Gọi loadHistory ngay lập tức để cập nhật sidebar
        setTimeout(() => {
            loadHistory();
        }, 0);

        try {
            // Tìm câu hỏi và câu trả lời từ dữ liệu có sẵn
            const questionData = questions.find(q =>
                q.question.toLowerCase().includes(question.toLowerCase()) &&
                q.show === true
            );

            let answerId = null;
            let currentAnswerData = null;
            let currentReflectionQuestion = '';

            if (questionData && questionData.answer) {
                // Nếu tìm thấy câu hỏi trong danh sách mẫu
                console.log('Found real answer from sample questions:', questionData.answer);
                answerId = questionData.answer.id;
                currentAnswerData = {
                    title: questionData.question || questionData.answer.title,
                    name: questionData.answer.title || questionData.question,
                    content: questionData.answer.content, // Text thuần cho AI
                    image: null,
                    html: questionData.answer.html || questionData.answer.content, // HTML cho hiển thị
                    audioUrl: questionData.answer.audioUrl || '' // Lấy audioUrl từ câu trả lời mẫu nếu có
                };
                setCurrentAnswer(currentAnswerData);

                // Tạo câu hỏi suy ngẫm bằng AI dựa trên câu trả lời có sẵn (sử dụng content - text thuần)
                try {
                    const systemMessage = `Bạn là Visao, một giáo viên AI thông minh. Nhiệm vụ của bạn là tạo một câu hỏi suy ngẫm chất lượng để kiểm tra hiểu biết của học sinh.

Yêu cầu:
- Câu hỏi suy ngẫm phải liên quan TRỰC TIẾP đến nội dung câu trả lời đã cho
- Câu hỏi nên kiểm tra hiểu biết sâu về các khái niệm, nguyên lý, hoặc ứng dụng thực tế
- Không phải câu hỏi gốc, mà là câu hỏi mở rộng từ nội dung câu trả lời
- Phù hợp với cấp độ: ${currentLevel === 'elementary' ? 'cơ bản' : currentLevel === 'intermediate' ? 'trung bình' : 'nâng cao'}

Trả về JSON format:
{
  "reflection_question": "Câu hỏi suy ngẫm chất lượng"
}`;

                    const prompt = `Câu hỏi gốc: ${question}

Câu trả lời của Visao: ${questionData.answer.content}

Hãy tạo một câu hỏi suy ngẫm chất lượng để kiểm tra hiểu biết sâu của học sinh về nội dung câu trả lời này. Câu hỏi phải liên quan trực tiếp đến các khái niệm, nguyên lý, hoặc ứng dụng được đề cập trong câu trả lời.`;

                    const aiResult = await aiGen(prompt, systemMessage, 'gpt-4.1-2025-04-14', 'text');
                    console.log('AI Reflection Question Result:', aiResult);

                    let parsedData;
                    try {
                        if (aiResult && aiResult.result) {
                            parsedData = JSON.parse(aiResult.result);
                        } else if (typeof aiResult === 'string') {
                            parsedData = JSON.parse(aiResult);
                        } else {
                            parsedData = aiResult;
                        }

                        if (parsedData && parsedData.reflection_question) {
                            currentReflectionQuestion = parsedData.reflection_question;
                            console.log('✅ AI generated reflection question:', currentReflectionQuestion);
                        } else {
                            throw new Error('Invalid AI response format');
                        }
                    } catch (parseError) {
                        console.error('Error parsing AI reflection question response:', parseError);
                        // Fallback: tạo câu hỏi suy ngẫm đơn giản
                        currentReflectionQuestion = `Dựa trên nội dung câu trả lời về ${questionData.question.toLowerCase()}, bạn có thể giải thích thêm về những điểm quan trọng nào trong câu trả lời này?`;
                    }
                } catch (aiError) {
                    console.error('Error generating AI reflection question:', aiError);
                    // Fallback: tạo câu hỏi suy ngẫm đơn giản
                    currentReflectionQuestion = `Dựa trên nội dung câu trả lời về ${questionData.question.toLowerCase()}, bạn có thể giải thích thêm về những điểm quan trọng nào trong câu trả lời này?`;
                }

                setReflectionQuestion(currentReflectionQuestion);

                // Chuẩn bị dữ liệu câu trả lời để lưu
                const answerData = {
                    title: currentAnswerData.title,
                    content: currentAnswerData.content, // Lưu content (text thuần)
                    html: currentAnswerData.html, // Lưu html (cho hiển thị)
                    reflection_question: currentReflectionQuestion
                };

                // Lưu lịch sử câu hỏi ngay lập tức cho câu hỏi có sẵn
                if (currentUser?.id) {
                    try {
                        const savedHistory = await createNewQuestionHistory({
                            user_id: currentUser.id,
                            created_at: createTimestamp(),
                            user_email: currentUser.email,
                            question: question,
                            answer: answerData,
                            answer_id: answerId,
                            level: currentLevel,
                            show: true,
                            audioUrl: questionData.answer.audioUrl || '' // Lưu audioUrl từ câu trả lời mẫu
                        });

                        // Lưu question history ID để sử dụng cho reflection
                        if (savedHistory && savedHistory.id) {
                            setCurrentQuestionHistoryId(savedHistory.id);
                        }

                        // Xóa khỏi pending questions sau khi lưu thành công
                        setPendingQuestions(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(question);
                            return newMap;
                        });

                        // Cập nhật lại history với dữ liệu thật từ server
                        await loadHistory();
                        return; // Thoát sớm vì đã xử lý xong
                    } catch (historyError) {
                        console.error('Error saving question history:', historyError);
                        // Nếu lưu thất bại, xóa khỏi pending questions
                        setPendingQuestions(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(question);
                            return newMap;
                        });

                        // Cập nhật lại history sau khi xóa pending
                        await loadHistory();
                    }
                }
            } else {
                // Nếu không tìm thấy trong danh sách mẫu, gửi qua AI
                console.log('Question not found in sample, generating via AI...');

                try {
                    // Sử dụng aiGen từ botService

                    const systemMessage = `Bạn là Visao, một trợ lý AI thông minh và thân thiện. Nhiệm vụ của bạn là:

1. Tạo câu trả lời chi tiết, dễ hiểu cho câu hỏi được đưa ra
2. Tạo một câu hỏi suy ngẫm để kiểm tra hiểu biết của người dùng

Yêu cầu:
- Câu trả lời phải rõ ràng, có cấu trúc tốt với HTML tags (sử dụng <br>, <strong>, <em>, <ul>, <li>)
- Câu hỏi suy ngẫm phải liên quan TRỰC TIẾP đến nội dung câu trả lời, không phải câu hỏi gốc
- Câu hỏi suy ngẫm nên kiểm tra hiểu biết sâu về các khái niệm trong câu trả lời
- Phù hợp với cấp độ: ${currentLevel === 'elementary' ? 'cơ bản' : currentLevel === 'intermediate' ? 'trung bình' : 'nâng cao'}

Trả về JSON format:
{
  "answer": {
    "title": "Tiêu đề câu trả lời",
    "content": "Nội dung câu trả lời với HTML tags"
  },
  "reflection_question": "Câu hỏi suy ngẫm liên quan đến nội dung câu trả lời"
}`;

                    const prompt = `Câu hỏi: ${question}

Hãy tạo câu trả lời chi tiết và một câu hỏi suy ngẫm phù hợp. Câu hỏi suy ngẫm phải liên quan trực tiếp đến nội dung câu trả lời, không phải câu hỏi gốc.`;

                    const aiResult = await aiGen(prompt, systemMessage, 'gpt-4.1-2025-04-14', 'text');
                    console.log('AI Response:', aiResult);

                    let parsedData;
                    try {
                        // AI trả về object với key 'result' chứa JSON string
                        if (aiResult && aiResult.result) {
                            parsedData = JSON.parse(aiResult.result);
                        } else if (typeof aiResult === 'string') {
                            parsedData = JSON.parse(aiResult);
                        } else {
                            parsedData = aiResult;
                        }
                    } catch (parseError) {
                        console.error('Error parsing AI response:', parseError);

                        // Thử tạo câu trả lời từ response thô
                        let fallbackContent = '';
                        if (aiResult && aiResult.result) {
                            fallbackContent = aiResult.result.replace(/\n/g, '<br>');
                        } else if (typeof aiResult === 'string') {
                            fallbackContent = aiResult.replace(/\n/g, '<br>');
                        } else {
                            fallbackContent = 'Đây là câu trả lời được tạo bởi AI.';
                        }

                        parsedData = {
                            answer: {
                                title: `🤔 ${question}`,
                                content: `Chào bạn! Visao sẽ giải thích ${question.toLowerCase()} nhé! 🌟<br><br>${fallbackContent}`
                            },
                            reflection_question: `Dựa trên nội dung câu trả lời về ${question.toLowerCase()}, bạn có thể giải thích thêm về những điểm quan trọng nào?`
                        };
                    }

                    if (parsedData.answer && parsedData.reflection_question) {
                        currentAnswerData = {
                            title: `🤔 ${question}` || parsedData.answer.title,
                            content: parsedData.answer.content, // Text thuần cho AI
                            image: null,
                            html: parsedData.answer.content, // HTML = content (cùng nội dung)
                            audioUrl: '' // Khởi tạo audioUrl rỗng cho AI-generated answers
                        };
                        setCurrentAnswer(currentAnswerData);

                        currentReflectionQuestion = parsedData.reflection_question;
                        setReflectionQuestion(currentReflectionQuestion);

                        console.log('✅ AI generated answer successfully');
                    } else {
                        console.error('❌ AI response format invalid:', parsedData);

                        // Fallback: tạo câu trả lời từ dữ liệu có sẵn
                        let fallbackContent = '';
                        if (parsedData.answer && typeof parsedData.answer === 'string') {
                            fallbackContent = parsedData.answer;
                        } else if (parsedData.content) {
                            fallbackContent = parsedData.content;
                        } else if (aiResult && aiResult.result) {
                            fallbackContent = aiResult.result.replace(/\n/g, '<br>');
                        } else if (typeof aiResult === 'string') {
                            fallbackContent = aiResult.replace(/\n/g, '<br>');
                        } else {
                            fallbackContent = 'Đây là câu trả lời được tạo bởi AI.';
                        }

                        currentAnswerData = {
                            title: `🤔 ${question}`,
                            content: `Chào bạn! Visao sẽ giải thích ${question.toLowerCase()} nhé! 🌟<br><br>${fallbackContent}`,
                            image: null,
                            html: `Chào bạn! Visao sẽ giải thích ${question.toLowerCase()} nhé! 🌟<br><br>${fallbackContent}`, // HTML = content
                            audioUrl: '' // Khởi tạo audioUrl rỗng cho AI-generated answers
                        };
                        setCurrentAnswer(currentAnswerData);

                        currentReflectionQuestion = parsedData.reflection_question || `Bạn hiểu gì về ${question.toLowerCase()}? Hãy giải thích theo cách hiểu của mình.`;
                        setReflectionQuestion(currentReflectionQuestion);
                    }
                } catch (aiError) {
                    console.error('❌ AI Error:', aiError.message);
                    // Fallback nếu AI không hoạt động
                    currentAnswerData = {
                        title: `🤔 ${question}`,
                        content: `Chào bạn! Visao sẽ giải thích ${question.toLowerCase()} nhé! 🌟<br><br><strong>Lưu ý:</strong> Đây là câu trả lời demo. Trong phiên bản đầy đủ, Visao sẽ có câu trả lời chi tiết hơn!`,
                        image: null,
                        html: `Chào bạn! Visao sẽ giải thích ${question.toLowerCase()} nhé! 🌟<br><br><strong>Lưu ý:</strong> Đây là câu trả lời demo. Trong phiên bản đầy đủ, Visao sẽ có câu trả lời chi tiết hơn!`,
                        audioUrl: '' // Khởi tạo audioUrl rỗng cho trường hợp lỗi
                    };
                    setCurrentAnswer(currentAnswerData);

                    currentReflectionQuestion = `Bạn hiểu gì về ${question.toLowerCase()}? Hãy giải thích theo cách hiểu của mình.`;
                    setReflectionQuestion(currentReflectionQuestion);
                }
            }

            // Lưu lịch sử câu hỏi nếu user đã đăng nhập (chỉ cho câu hỏi AI)
            if (currentUser?.id && currentAnswerData) {
                try {
                    // Chuẩn bị dữ liệu câu trả lời để lưu
                    const answerData = {
                        title: currentAnswerData.title,
                        content: currentAnswerData.content, // Lưu content (text thuần)
                        html: currentAnswerData.html, // Lưu html (cho hiển thị)
                        reflection_question: currentReflectionQuestion
                    };

                    const savedHistory = await createNewQuestionHistory({
                        user_id: currentUser.id,
                        created_at: createTimestamp(),
                        user_email: currentUser.email,
                        question: question,
                        answer: answerData, // Lưu câu trả lời vào trường answer
                        answer_id: answerId,
                        level: currentLevel,
                        show: true,
                        audioUrl: currentAnswerData.audioUrl || '' // Lấy audioUrl từ currentAnswerData
                    });

                    // Lưu question history ID để sử dụng cho reflection
                    if (savedHistory && savedHistory.id) {
                        setCurrentQuestionHistoryId(savedHistory.id);
                    }

                    // Xóa khỏi pending questions sau khi lưu thành công
                    setPendingQuestions(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(question);
                        return newMap;
                    });

                    // Cập nhật lại history với dữ liệu thật từ server
                    await loadHistory();
                } catch (historyError) {
                    console.error('Error saving question history:', historyError);
                    // Nếu lưu thất bại, xóa khỏi pending questions
                    setPendingQuestions(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(question);
                        return newMap;
                    });

                    // Cập nhật lại history sau khi xóa pending
                    await loadHistory();
                }
            }
        } catch (error) {
            console.error('Error processing question:', error);
            setCurrentAnswer({
                title: `❌ Lỗi`,
                content: `Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.`,
                image: null,
                html: `Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.`,
                audioUrl: '' // Khởi tạo audioUrl rỗng cho trường hợp lỗi
            });
            // Xóa khỏi pending questions nếu có lỗi
            setPendingQuestions(prev => {
                const newMap = new Map(prev);
                newMap.delete(question);
                return newMap;
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleQuestionSelect = (question) => {
        // Khi chọn câu hỏi từ sidebar, chỉ điền vào input
        setInputValue(question);
    };

    const handleHistoryItemClick = async (historyItem) => {
        // Xử lý khi click vào item trong history
        if (historyItem.status === 'processing') {
            // Nếu đang processing, chỉ điền vào input
            setInputValue(historyItem.question);
            return;
        }

        // Reset reflection state khi chọn câu hỏi khác
        setReflectionQuestion('');
        setCurrentQuestionHistoryId(null);

        // Nếu là câu hỏi đã hoàn thành, hiển thị lại câu trả lời và reflection question
        setCurrentQuestion(historyItem.question);
        setInputValue(historyItem.question);

        // Kiểm tra xem có câu trả lời được lưu trong trường answer không
        if (historyItem.answer) {
            try {
                // Với JSONB, dữ liệu đã là object, không cần parse
                const savedAnswer = typeof historyItem.answer === 'string'
                    ? JSON.parse(historyItem.answer)
                    : historyItem.answer;

                setCurrentAnswer({
                    title: `🤔 ${historyItem.question}` || savedAnswer.title,
                    content: savedAnswer.content, // Text thuần cho AI
                    image: null,
                    html: savedAnswer.html || savedAnswer.content, // HTML cho hiển thị, fallback về content
                    audioUrl: historyItem.audioUrl || '' // Thêm audioUrl từ history item
                });

                if (savedAnswer.reflection_question) {
                    setReflectionQuestion(savedAnswer.reflection_question);
                } else {
                    // Fallback: tạo câu hỏi suy ngẫm mặc định
                    setReflectionQuestion(`Dựa trên nội dung câu trả lời về ${historyItem.question.toLowerCase()}, bạn có thể giải thích thêm về những điểm quan trọng nào?`);
                }

                console.log('✅ Loaded answer from database:', savedAnswer);

                // Set question history ID để sử dụng cho reflection
                if (historyItem.id && !historyItem.id.toString().startsWith('temp_')) {
                    setCurrentQuestionHistoryId(historyItem.id);
                }

                return; // Thoát sớm nếu đã load được câu trả lời từ database
            } catch (parseError) {
                console.error('Error parsing saved answer:', parseError);
                // Tiếp tục với logic fallback bên dưới
            }
        }

        // Fallback: Tìm câu trả lời từ dữ liệu có sẵn
        const questionData = questions.find(q =>
            q.question.toLowerCase().includes(historyItem.question.toLowerCase()) &&
            q.show === true
        );

        if (questionData && questionData.answer) {
            // Hiển thị câu trả lời có sẵn
            setCurrentAnswer({
                title: questionData.question || questionData.answer.title,
                content: questionData.answer.content, // Text thuần cho AI
                image: null,
                html: questionData.answer.html || questionData.answer.content, // HTML cho hiển thị
                audioUrl: historyItem.audioUrl || '' // Thêm audioUrl từ history item
            });

            // Tạo câu hỏi suy ngẫm bằng AI dựa trên câu trả lời có sẵn (sử dụng content - text thuần)
            try {
                const systemMessage = `Bạn là Visao, một giáo viên AI thông minh. Nhiệm vụ của bạn là tạo một câu hỏi suy ngẫm chất lượng để kiểm tra hiểu biết của học sinh.

Yêu cầu:
- Câu hỏi suy ngẫm phải liên quan TRỰC TIẾP đến nội dung câu trả lời đã cho
- Câu hỏi nên kiểm tra hiểu biết sâu về các khái niệm, nguyên lý, hoặc ứng dụng thực tế
- Không phải câu hỏi gốc, mà là câu hỏi mở rộng từ nội dung câu trả lời
- Phù hợp với cấp độ: ${currentLevel === 'elementary' ? 'cơ bản' : currentLevel === 'intermediate' ? 'trung bình' : 'nâng cao'}

Trả về JSON format:
{
  "reflection_question": "Câu hỏi suy ngẫm chất lượng"
}`;

                const prompt = `Câu hỏi gốc: ${historyItem.question}

Câu trả lời của Visao: ${questionData.answer.content}

Hãy tạo một câu hỏi suy ngẫm chất lượng để kiểm tra hiểu biết sâu của học sinh về nội dung câu trả lời này. Câu hỏi phải liên quan trực tiếp đến các khái niệm, nguyên lý, hoặc ứng dụng được đề cập trong câu trả lời.`;

                const aiResult = await aiGen(prompt, systemMessage, 'gpt-4.1-2025-04-14', 'text');
                console.log('AI Reflection Question Result (History):', aiResult);

                let parsedData;
                try {
                    if (aiResult && aiResult.result) {
                        parsedData = JSON.parse(aiResult.result);
                    } else if (typeof aiResult === 'string') {
                        parsedData = JSON.parse(aiResult);
                    } else {
                        parsedData = aiResult;
                    }

                    if (parsedData && parsedData.reflection_question) {
                        setReflectionQuestion(parsedData.reflection_question);
                        console.log('✅ AI generated reflection question (History):', parsedData.reflection_question);
                    } else {
                        throw new Error('Invalid AI response format');
                    }
                } catch (parseError) {
                    console.error('Error parsing AI reflection question response (History):', parseError);
                    // Fallback: tạo câu hỏi suy ngẫm đơn giản
                    setReflectionQuestion(`Dựa trên nội dung câu trả lời về ${questionData.question.toLowerCase()}, bạn có thể giải thích thêm về những điểm quan trọng nào trong câu trả lời này?`);
                }
            } catch (aiError) {
                console.error('Error generating AI reflection question (History):', aiError);
                // Fallback: tạo câu hỏi suy ngẫm đơn giản
                setReflectionQuestion(`Dựa trên nội dung câu trả lời về ${questionData.question.toLowerCase()}, bạn có thể giải thích thêm về những điểm quan trọng nào trong câu trả lời này?`);
            }
        } else {
            // Nếu không có câu trả lời có sẵn, tạo lại qua AI
            try {
                const systemMessage = `Bạn là Visao, một trợ lý AI thông minh và thân thiện. Nhiệm vụ của bạn là:

1. Tạo câu trả lời chi tiết, dễ hiểu cho câu hỏi được đưa ra
2. Tạo một câu hỏi suy ngẫm để kiểm tra hiểu biết của người dùng

Yêu cầu:
- Câu trả lời phải rõ ràng, có cấu trúc tốt với HTML tags (sử dụng <br>, <strong>, <em>, <ul>, <li>)
- Câu hỏi suy ngẫm phải liên quan TRỰC TIẾP đến nội dung câu trả lời, không phải câu hỏi gốc
- Câu hỏi suy ngẫm nên kiểm tra hiểu biết sâu về các khái niệm trong câu trả lời
- Phù hợp với cấp độ: ${currentLevel === 'elementary' ? 'cơ bản' : currentLevel === 'intermediate' ? 'trung bình' : 'nâng cao'}

Trả về JSON format:
{
  "answer": {
    "title": "Tiêu đề câu trả lời",
    "content": "Nội dung câu trả lời với HTML tags"
  },
  "reflection_question": "Câu hỏi suy ngẫm liên quan đến nội dung câu trả lời"
}`;

                const prompt = `Câu hỏi: ${historyItem.question}

Hãy tạo câu trả lời chi tiết và một câu hỏi suy ngẫm phù hợp. Câu hỏi suy ngẫm phải liên quan trực tiếp đến nội dung câu trả lời, không phải câu hỏi gốc.`;

                const aiResult = await aiGen(prompt, systemMessage, 'gpt-4.1-2025-04-14', 'text');

                let parsedData;
                try {
                    if (aiResult && aiResult.result) {
                        parsedData = JSON.parse(aiResult.result);
                    } else if (typeof aiResult === 'string') {
                        parsedData = JSON.parse(aiResult);
                    } else {
                        parsedData = aiResult;
                    }
                } catch (parseError) {
                    console.error('Error parsing AI response:', parseError);
                    parsedData = {
                        answer: {
                            title: `🤔 ${historyItem.question}`,
                            content: `Chào bạn! Visao sẽ giải thích ${historyItem.question.toLowerCase()} nhé! 🌟<br><br>Đây là câu trả lời được tạo bởi AI.`
                        },
                        reflection_question: `Dựa trên nội dung câu trả lời về ${historyItem.question.toLowerCase()}, bạn có thể giải thích thêm về những điểm quan trọng nào?`
                    };
                }

                if (parsedData.answer && parsedData.reflection_question) {
                    const currentAnswerData = {
                        title: `🤔 ${historyItem.question}` || parsedData.answer.title,
                        content: parsedData.answer.content, // Text thuần cho AI
                        image: null,
                        html: parsedData.answer.content, // HTML = content (cùng nội dung)
                        audioUrl: historyItem.audioUrl || '' // Thêm audioUrl từ history item
                    };

                    setCurrentAnswer(currentAnswerData);

                    setReflectionQuestion(parsedData.reflection_question);
                }
            } catch (aiError) {
                console.error('Error generating AI response for history item:', aiError);
                setCurrentAnswer({
                    title: `🤔 ${historyItem.question}`,
                    content: `Chào bạn! Visao sẽ giải thích ${historyItem.question.toLowerCase()} nhé! 🌟<br><br><strong>Lưu ý:</strong> Đây là câu trả lời demo.`,
                    image: null,
                    html: `Chào bạn! Visao sẽ giải thích ${historyItem.question.toLowerCase()} nhé! 🌟<br><br><strong>Lưu ý:</strong> Đây là câu trả lời demo.`, // HTML = content
                    audioUrl: historyItem.audioUrl || '' // Thêm audioUrl từ history item
                });

                // Tạo câu hỏi suy ngẫm đơn giản cho fallback
                setReflectionQuestion(`Bạn hiểu gì về ${historyItem.question.toLowerCase()}? Hãy giải thích theo cách hiểu của mình.`);
            }
        }

        // Set question history ID nếu có
        if (historyItem.id && !historyItem.id.toString().startsWith('temp_')) {
            setCurrentQuestionHistoryId(historyItem.id);
        }
    };

    const handleLevelChange = (level) => {
        setCurrentLevel(level);
    };

    return (
        <div className={styles.container}>
            <Header/>

            <div className={styles.mainContent}>
                <Sidebar
                    onQuestionSelect={handleQuestionSelect}
                    onHistoryItemClick={handleHistoryItemClick}
                    currentQuestion={currentQuestion}
                    questions={questions.filter(q => q.show === true)}
                    history={history}
                    setCurrentQuestion={setCurrentQuestion}
                />

                <MainArea
                    onSubmitQuestion={handleSubmitQuestion}
                    currentQuestion={currentQuestion}
                    isProcessing={isProcessing}
                    currentLevel={currentLevel}
                    onLevelChange={handleLevelChange}
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    currentAnswer={currentAnswer}
                    questions={questions.filter(q => q.show === true)}
                    userPermissions={userPermissions}
                />

                <AnswerPanel
                    answer={currentAnswer}
                    isProcessing={isProcessing}
                    reflectionQuestion={reflectionQuestion}
                    questionHistoryId={currentQuestionHistoryId}
                    onHistoryUpdate={loadHistory}
                    userPermissions={userPermissions}
                />
            </div>
        </div>
    );
};

export default Visao; 