import React, { useState, useContext, useEffect } from 'react';
import { createNewReflectionHistory, updateReflectionHistory, getReflectionHistoryByQuestionHistory } from '../../../../../apis/reflectionHistoryService';
import { updateQuestionHistory } from '../../../../../apis/questionHistoryService';
import { MyContext } from '../../../../../MyContext';
import styles from './ReflectionPanel.module.css';
import { aiGen } from '../../../../../apis/aiGen/botService';
import {sendRequestEmail} from "../../../../../apis/emailService.jsx";

const ReflectionPanel = ({ isVisible, setReflectionVisible , onToggle, question, currentAnswer, questionHistoryId, onHistoryUpdate, userPermissions = { canCustomQuestion: false, canUseVoice: false, canUseReflection: false } }) => {
  const { currentUser } = useContext(MyContext);
  const [reflectionText, setReflectionText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [reflectionHistoryId, setReflectionHistoryId] = useState(null);
  const [existingReflection, setExistingReflection] = useState(null);

  // Kiểm tra quyền sử dụng reflection
  if (!userPermissions.canUseReflection) {
    return null;
  }


  // Kiểm tra xem đã có reflection history cho câu hỏi này chưa
  useEffect(() => {
    const checkExistingReflection = async () => {
      if (questionHistoryId && currentUser?.email) {
        try {
          const existingData = await getReflectionHistoryByQuestionHistory(questionHistoryId);
          // API có thể trả về object hoặc array
          let reflectionData = null;
          if (Array.isArray(existingData)) {
            // Nếu là array, lấy item đầu tiên
            reflectionData = existingData.length > 0 ? existingData[0] : null;
          } else if (existingData && existingData.id) {
            // Nếu là object có id
            reflectionData = existingData;
          }
          
          if (reflectionData) {
            setExistingReflection(reflectionData);
            setReflectionHistoryId(reflectionData.id);
            
            // Nếu đã có đánh giá, hiển thị kết quả
            if (reflectionData.status && reflectionData.status !== 'processing' && reflectionData.score) {
              setEvaluationResult({
                score: reflectionData.score,
                score_text: reflectionData.score_text || 'Đã đánh giá',
                feedback: reflectionData.feedback,
                accuracy_score: reflectionData.accuracy_score,
                understanding_score: reflectionData.understanding_score,
                expression_score: reflectionData.expression_score
              });
              setShowResult(true);
              setReflectionVisible(true)
            }
            
            // Hiển thị câu trả lời cũ nếu có
            if (reflectionData.user_answer) {
              setReflectionText(reflectionData.user_answer);
              updateWordCount(reflectionData.user_answer);
            }
          } else {
            // Reset state nếu không có reflection cũ
            setExistingReflection(null);
            setReflectionHistoryId(null);
            setEvaluationResult(null);
            setShowResult(false);
            setReflectionVisible(false)

            setReflectionText('');
            setWordCount(0);
          }
        } catch (error) {
          console.error('Error checking existing reflection:', error);
        }
      }
    };

    if (questionHistoryId) {
      checkExistingReflection();
    }
  }, [questionHistoryId, currentUser,]);

  const updateWordCount = (text) => {
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    setWordCount(words);
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setReflectionText(text);
    updateWordCount(text);
  };

  const handleSubmit = async () => {
    if (wordCount === 0) {
      alert('Hãy viết suy nghĩ của bạn trước khi gửi nhé! 😊');
      return;
    }
    
    if (wordCount > 300) {
      alert('Bạn viết hơi dài rồi! Hãy viết ngắn gọn dưới 300 từ nhé! 📝');
      return;
    }

    if (!currentUser?.id) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }

    setIsProcessing(true);
    setShowResult(false);
    setEvaluationResult(null);

    try {
      let reflectionData;
      
      // Nếu đã có reflection history, cập nhật; nếu không thì tạo mới
      let currentReflectionHistoryId = reflectionHistoryId; // Lưu ID hiện tại
      
      if (existingReflection && reflectionHistoryId) {
        // Cập nhật reflection hiện có
        reflectionData = await updateReflectionHistory({
          id: reflectionHistoryId,
          user_answer: reflectionText,
          word_count: wordCount,
          status: 'processing' // Reset về processing để đánh giá lại
        });
      } else {
        // Tạo reflection mới
        reflectionData = await createNewReflectionHistory({
          user_email: currentUser.email,
          question_history_id: questionHistoryId,
          reflection_question: question,
          user_answer: reflectionText,
          word_count: wordCount,
          status: 'processing',
          show: true
        });
        
        // Lưu reflection history ID để cập nhật sau
        if (reflectionData && reflectionData.id) {
          currentReflectionHistoryId = reflectionData.id; // Cập nhật ID hiện tại
          setReflectionHistoryId(reflectionData.id);
          setExistingReflection(reflectionData);
        }
      }

      // Kiểm tra quyền AI đánh giá
      if (userPermissions.canUseAIEvaluation) {
        // Đánh giá câu trả lời bằng AI (chỉ cho VIP và Admin)
        try {
          const systemMessage = `Bạn là Visao, một giáo viên AI thông minh. Nhiệm vụ của bạn là đánh giá câu trả lời suy ngẫm của học sinh.

Yêu cầu đánh giá:
1. Độ chính xác về nội dung (0-100%)
2. Độ sâu hiểu biết (0-100%)
3. Khả năng diễn đạt (0-100%)
4. Trạng thái tổng thể: 'excellent' (90-100%), 'good' (70-89%), 'needsWork' (dưới 70%)

Trả về JSON format:
{
  "score": "excellent|good|needsWork",
  "score_text": "Mô tả ngắn gọn về kết quả",
  "feedback": "Phản hồi chi tiết và gợi ý cải thiện",
  "accuracy_score": 85,
  "understanding_score": 90,
  "expression_score": 80
}`;

          const prompt = `Câu hỏi suy ngẫm: ${question}

Câu trả lời gốc của Visao: ${currentAnswer.content}

Câu trả lời của học sinh: ${reflectionText}

Hãy đánh giá câu trả lời của học sinh dựa trên:
- Độ chính xác so với nội dung câu trả lời gốc
- Độ sâu hiểu biết về chủ đề
- Khả năng diễn đạt và trình bày ý tưởng

Đưa ra phản hồi tích cực và gợi ý cải thiện cụ thể.`;

          const aiResult = await aiGen(prompt, systemMessage, 'gpt-4.1-2025-04-14', 'text');
          
          if (!aiResult) {
            throw new Error('AI service returned null or undefined');
          }

          let parsedData;
          try {
            // Xử lý format response từ AI
            if (aiResult && aiResult.result) {
              parsedData = JSON.parse(aiResult.result);
            } else if (typeof aiResult === 'string') {
              parsedData = JSON.parse(aiResult);
            } else {
              parsedData = aiResult;
            }
          } catch (parseError) {
            console.error('Error parsing AI evaluation response:', parseError);
            parsedData = {
              score: 'good',
              score_text: 'Tốt - Cần cải thiện thêm',
              feedback: 'Cảm ơn bạn đã chia sẻ suy nghĩ! Hãy tiếp tục học tập và cải thiện nhé.',
              accuracy_score: 75,
              understanding_score: 80,
              expression_score: 70
            };
          }

          setEvaluationResult(parsedData);

          // Đợi một chút để đảm bảo state đã được cập nhật
          await new Promise(resolve => setTimeout(resolve, 100));

          // Cập nhật trạng thái trong question history
          if (questionHistoryId) {
            try {
              await updateQuestionHistory({
                id: questionHistoryId,
                status: parsedData.score,
                score: parsedData.score,
                score_text: parsedData.score_text
              });
            } catch (questionError) {
              console.error('Error updating question history:', questionError);
            }
          }

          // Cập nhật trạng thái trong reflection history
          if (currentReflectionHistoryId) {
            try {
              const reflectionUpdateData = {
                id: currentReflectionHistoryId,
                status: parsedData.score,
                score: parsedData.score,
                score_text: parsedData.score_text,
                feedback: parsedData.feedback,
                accuracy_score: parsedData.accuracy_score,
                understanding_score: parsedData.understanding_score,
                expression_score: parsedData.expression_score
              };
              
              await updateReflectionHistory(reflectionUpdateData);
            } catch (reflectionError) {
              console.error('Error updating reflection history:', reflectionError);
              alert('Đánh giá đã hoàn thành nhưng có lỗi khi lưu kết quả. Vui lòng thử lại!');
            }
          }

        } catch (aiError) {
          console.error('Error evaluating with AI:', aiError);
          
          // Fallback nếu AI không hoạt động
          const fallbackResult = {
            score: 'good',
            score_text: 'Tốt - Đã gửi bài làm',
            feedback: 'Cảm ơn bạn đã chia sẻ suy nghĩ! Visao sẽ sớm chấm điểm và đưa ra phản hồi chi tiết cho bạn.',
            accuracy_score: 75,
            understanding_score: 80,
            expression_score: 70
          };
          
          setEvaluationResult(fallbackResult);

          // Cập nhật trạng thái fallback
          if (questionHistoryId) {
            try {
              await updateQuestionHistory({
                id: questionHistoryId,
                status: fallbackResult.score,
                score: fallbackResult.score,
                score_text: fallbackResult.score_text
              });
            } catch (questionError) {
              console.error('Error updating question history (fallback):', questionError);
            }
          }

          if (currentReflectionHistoryId) {
            try {
              const reflectionUpdateData = {
                id: currentReflectionHistoryId,
                status: fallbackResult.score,
                score: fallbackResult.score,
                score_text: fallbackResult.score_text,
                feedback: fallbackResult.feedback,
                accuracy_score: fallbackResult.accuracy_score,
                understanding_score: fallbackResult.understanding_score,
                expression_score: fallbackResult.expression_score
              };
              
              await updateReflectionHistory(reflectionUpdateData);
            } catch (reflectionError) {
              console.error('Error updating reflection history (fallback):', reflectionError);
            }
          }
        }
      } else {
        // Premium users: Không có AI đánh giá, chỉ cập nhật trạng thái thành "submitted"
        const submittedResult = {
          score: 'submitted',
          score_text: 'Đã nộp bài',
          feedback: 'Cảm ơn bạn đã chia sẻ suy nghĩ! Bài làm của bạn đã được lưu lại.',
          accuracy_score: null,
          understanding_score: null,
          expression_score: null
        };
        
        setEvaluationResult(submittedResult);

        // Cập nhật trạng thái trong question history
        if (questionHistoryId) {
          try {
            await updateQuestionHistory({
              id: questionHistoryId,
              status: 'submitted',
              score: 'submitted',
              score_text: 'Đã nộp bài'
            });
          } catch (questionError) {
            console.error('Error updating question history (Premium):', questionError);
          }
        }

        // Cập nhật trạng thái trong reflection history
        if (currentReflectionHistoryId) {
          try {
            const reflectionUpdateData = {
              id: currentReflectionHistoryId,
              status: 'submitted',
              score: 'submitted',
              score_text: 'Đã nộp bài',
              feedback: 'Cảm ơn bạn đã chia sẻ suy nghĩ! Bài làm của bạn đã được lưu lại.',
              accuracy_score: null,
              understanding_score: null,
              expression_score: null
            };
            
            await updateReflectionHistory(reflectionUpdateData);
          } catch (reflectionError) {
            console.error('Error updating reflection history (Premium):', reflectionError);
          }
        }
      }

      // Cập nhật lại history trong sidebar
      if (onHistoryUpdate) {
        onHistoryUpdate();
      }

      setShowResult(true);

      try {
        if (currentReflectionHistoryId) {
          await sendRequestEmail({
            reflectionId: currentReflectionHistoryId
          });
          console.log("📨 Đã gửi email xác nhận nộp bài cho người dùng");
        }
      } catch (emailError) {
        console.error("❌ Lỗi khi gửi email xác nhận:", emailError);
      }

    } catch (error) {
      console.error('Error saving reflection:', error);
      alert('Có lỗi xảy ra khi lưu bài làm. Vui lòng thử lại!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggle = () => {
    if (isVisible) {
      // Reset state khi đóng panel
      setReflectionText('');
      setWordCount(0);
      setIsProcessing(false);
      setShowResult(false);
      setEvaluationResult(null);
      setReflectionHistoryId(null);
      setExistingReflection(null);
    }
    onToggle();
  };

  if (!isVisible) return null;

  return (
    <div className={`${styles.reflectionPanel} ${styles.show}`}>
      <div className={styles.reflectionTitle}>
        💭 Hãy suy nghĩ thêm!
      </div>
      
      <div className={styles.reflectionPrompt}>
        <strong>🎯 Câu hỏi kiểm tra hiểu biết:</strong>
        <div className={styles.reflectionQuestionText}>
          {question}
        </div>
      </div>
      
      <textarea 
        className={styles.reflectionTextarea}
        placeholder="Hãy giải thích hiểu biết của bạn về kiến thức này... (dưới 300 từ)"
        value={reflectionText}
        onChange={handleTextChange}
      />
      
      <div className={`${styles.wordCounter} ${
        wordCount > 300 ? styles.error : 
        wordCount > 250 ? styles.warning : ''
      }`}>
        {wordCount}/300 từ
      </div>
      
      <button 
        className={styles.reflectionSubmit}
        onClick={handleSubmit}
        disabled={isProcessing}
      >
        {isProcessing ? 'Đang gửi...' : 'Gửi bài làm 📝'}
      </button>
      
      {isProcessing && (
        <div className={`${styles.reflectionProcessing} ${styles.show}`}>
          <div className={styles.spinner}></div>
          Visao đang chấm bài làm của bạn...
        </div>
      )}

      {showResult && evaluationResult && (
        <div className={`${styles.reflectionResult} ${styles.show}`}>
          <div className={styles.evaluationHeader}>
            <strong>🌟 Kết quả đánh giá:</strong>
            <span className={`${styles.scoreBadge} ${styles[evaluationResult.score]}`}>
              {evaluationResult.score_text}
            </span>
          </div>
          
          {evaluationResult.score !== 'submitted' && (
            <>
              <div className={styles.evaluationDetails}>
                <div className={styles.scoreItem}>
                  <span>Độ chính xác:</span>
                  <span>{evaluationResult.accuracy_score || 75}%</span>
                </div>
                <div className={styles.scoreItem}>
                  <span>Hiểu biết:</span>
                  <span>{evaluationResult.understanding_score || 80}%</span>
                </div>
                <div className={styles.scoreItem}>
                  <span>Diễn đạt:</span>
                  <span>{evaluationResult.expression_score || 70}%</span>
                </div>
              </div>
            </>
          )}
          
          <div className={styles.feedback}>
            <strong>💡 Phản hồi từ Visao:</strong>
            <div>{evaluationResult.feedback}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReflectionPanel; 