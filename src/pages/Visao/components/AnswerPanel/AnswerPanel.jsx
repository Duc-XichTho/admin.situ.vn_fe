import React, { useState, useRef, useEffect } from 'react';
import { message } from 'antd';
import ReflectionPanel from './ReflectionPanel/ReflectionPanel';
import styles from './AnswerPanel.module.css';
import { aiGen2 } from '../../../../apis/aiGen/botService';
import { uploadFiles } from '../../../../apis/aiGen/uploadImageWikiNoteService';
import { updateQuestionHistory } from '../../../../apis/questionHistoryService';

const AnswerPanel = ({ answer, isProcessing, reflectionQuestion, questionHistoryId, onHistoryUpdate, userPermissions = { canCustomQuestion: false, canUseVoice: false, canUseReflection: false } }) => {
  const [reflectionVisible, setReflectionVisible] = useState(false);
  const [isCreatingVoice, setIsCreatingVoice] = useState(false);
  const [localAudioUrl, setLocalAudioUrl] = useState(null); // Lưu audioUrl local

  // Audio state cho câu hỏi hiện tại
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: false
  });

  const audioRef = useRef(null);
  const previousQuestionIdRef = useRef(null);

  // Key cho sessionStorage
  const getStorageKey = (questionId) => `audio_state_${questionId}`;

  // Lưu trạng thái audio vào sessionStorage
  const saveAudioState = (questionId, state) => {
    try {
      const storageKey = getStorageKey(questionId);
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Không thể lưu trạng thái audio:', error);
    }
  };

  // Load trạng thái audio từ sessionStorage
  const loadAudioState = (questionId) => {
    try {
      const storageKey = getStorageKey(questionId);
      const savedState = sessionStorage.getItem(storageKey);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.warn('Không thể load trạng thái audio:', error);
    }
    return null;
  };

  // Format thời gian
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Khởi tạo audio element
  const initializeAudio = (audioUrl) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();

      // Event listeners
      audioRef.current.addEventListener('loadedmetadata', () => {
        setAudioState(prev => {
          const newState = {
            ...prev,
            duration: audioRef.current.duration,
            isLoading: false
          };
          // Lưu trạng thái vào sessionStorage
          if (questionHistoryId) {
            saveAudioState(questionHistoryId, newState);
          }
          return newState;
        });
      });

      audioRef.current.addEventListener('timeupdate', () => {
        setAudioState(prev => {
          const newState = {
            ...prev,
            currentTime: audioRef.current.currentTime
          };
          // Lưu trạng thái vào sessionStorage
          if (questionHistoryId) {
            saveAudioState(questionHistoryId, newState);
          }
          return newState;
        });
      });

      audioRef.current.addEventListener('ended', () => {
        setAudioState(prev => {
          const newState = {
            ...prev,
            isPlaying: false,
            currentTime: 0
          };
          // Lưu trạng thái vào sessionStorage
          if (questionHistoryId) {
            saveAudioState(questionHistoryId, newState);
          }
          return newState;
        });
      });

      audioRef.current.addEventListener('error', () => {
        message.error('Có lỗi khi phát audio!');
        setAudioState(prev => {
          const newState = {
            ...prev,
            isPlaying: false,
            isLoading: false
          };
          // Lưu trạng thái vào sessionStorage
          if (questionHistoryId) {
            saveAudioState(questionHistoryId, newState);
          }
          return newState;
        });
      });
    }

    if (audioUrl && audioRef.current.src !== audioUrl) {
      audioRef.current.src = audioUrl;
    }
  };

  // Theo dõi thay đổi questionHistoryId
  useEffect(() => {
    if (previousQuestionIdRef.current !== questionHistoryId) {
      // Lưu trạng thái của câu hỏi trước
      if (previousQuestionIdRef.current && audioRef.current) {
        const currentState = {
          isPlaying: false, // Luôn dừng khi chuyển câu hỏi
          currentTime: audioRef.current.currentTime,
          duration: audioRef.current.duration,
          isLoading: false
        };
        saveAudioState(previousQuestionIdRef.current, currentState);

        // Dừng audio nếu đang phát
        if (!audioRef.current.paused) {
          audioRef.current.pause();
        }
      }

      // Load trạng thái của câu hỏi mới
      let newState = {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isLoading: false
      };

      if (questionHistoryId) {
        const savedState = loadAudioState(questionHistoryId);
        if (savedState) {
          newState = {
            ...savedState,
            isPlaying: false // Luôn bắt đầu ở trạng thái dừng
          };
        }
      }

      setAudioState(newState);
      previousQuestionIdRef.current = questionHistoryId;
    }
  }, [questionHistoryId]);

  // Reset trạng thái tạo voice khi questionHistoryId thay đổi
  useEffect(() => {
    setIsCreatingVoice(false);
    setLocalAudioUrl(null);
  }, [questionHistoryId]);

  // Theo dõi thay đổi answer.audioUrl
  useEffect(() => {
    if (answer?.audioUrl) {
      setLocalAudioUrl(answer.audioUrl);
      initializeAudio(answer.audioUrl);

      // Set currentTime từ state đã lưu
      if (audioRef.current) {
        setAudioState(prev => {
          if (prev.currentTime > 0) {
            audioRef.current.currentTime = prev.currentTime;
          }
          return prev;
        });
      }
    }
  }, [answer?.audioUrl]);

  // Cleanup
  useEffect(() => {
    return () => {
      // Lưu trạng thái trước khi unmount
      if (questionHistoryId && audioRef.current) {
        const finalState = {
          isPlaying: false,
          currentTime: audioRef.current.currentTime,
          duration: audioRef.current.duration,
          isLoading: false
        };
        saveAudioState(questionHistoryId, finalState);
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [questionHistoryId]);

  const toggleReflection = () => {
    if (!userPermissions.canUseReflection) {
      message.warning('🤔 Tính năng suy ngẫm không khả dụng cho tài khoản của bạn. Nâng cấp lên VIP để sử dụng!');
      return;
    }
    setReflectionVisible(!reflectionVisible);
  };

  // Tiện ích chuyển base64 sang Uint8Array
  const base64ToUint8Array = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Tiện ích làm sạch base64
  const cleanBase64 = (str) => {
    return str.replace(/^"+|"+$/g, '');
  };

  // Tiện ích lấy extension từ mime
  const getExtensionFromMimeType = (mimeType) => {
    const map = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/wave': 'wav',
      'audio/x-pn-wav': 'wav',
    };
    return map[mimeType] || '';
  };

  const ensureFileNameWithExtension = (fileName, mimeType) => {
    if (/\.[a-z0-9]+$/i.test(fileName)) return fileName;
    const ext = getExtensionFromMimeType(mimeType);
    return ext ? `${fileName}.${ext}` : fileName;
  };

  // Điều khiển audio
  const toggleAudio = async () => {
    if (!audioRef.current || !localAudioUrl) {
      message.warning('Không có audio để phát!');
      return;
    }

    try {
      if (audioRef.current.paused) {
        setAudioState(prev => {
          const newState = { ...prev, isLoading: true };
          saveAudioState(questionHistoryId, newState);
          return newState;
        });

        if (audioRef.current.readyState < 2) {
          audioRef.current.load();
        }

        await audioRef.current.play();
        setAudioState(prev => {
          const playState = { ...prev, isPlaying: true, isLoading: false };
          saveAudioState(questionHistoryId, playState);
          return playState;
        });
      } else {
        audioRef.current.pause();
        setAudioState(prev => {
          const pauseState = { ...prev, isPlaying: false };
          saveAudioState(questionHistoryId, pauseState);
          return pauseState;
        });
      }
    } catch (error) {
      message.error(`Có lỗi khi điều khiển audio: ${error.message}`);
      setAudioState(prev => {
        const errorState = { ...prev, isLoading: false };
        saveAudioState(questionHistoryId, errorState);
        return errorState;
      });
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioState(prev => {
        const stopState = {
          ...prev,
          isPlaying: false,
          currentTime: 0
        };
        saveAudioState(questionHistoryId, stopState);
        return stopState;
      });
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !audioRef.current.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekTime = (clickX / width) * audioRef.current.duration;

    const clampedSeekTime = Math.max(0, Math.min(seekTime, audioRef.current.duration));

    audioRef.current.currentTime = clampedSeekTime;
    setAudioState(prev => {
      const seekState = { ...prev, currentTime: clampedSeekTime };
      saveAudioState(questionHistoryId, seekState);
      return seekState;
    });
  };

  const handleVoiceClick = async () => {
    if (!userPermissions.canUseVoice) {
      message.warning('🔊 Tính năng voice không khả dụng cho tài khoản của bạn. Nâng cấp lên VIP để sử dụng!');
      return;
    }

    // Nếu đã có audioUrl thì phát luôn
    if (localAudioUrl) {
      initializeAudio(localAudioUrl);
      await toggleAudio();
      return;
    }

    // Nếu đang tạo voice thì không làm gì
    if (isCreatingVoice) {
      return;
    }

    // Nếu chưa có audioUrl thì tạo mới
    if (!answer || !answer.content) {
      message.warning('Không có nội dung để tạo voice!');
      return;
    }

    // Set trạng thái đang tạo voice cho questionHistoryId hiện tại
    if (questionHistoryId) {
      setIsCreatingVoice(true);
    }

    try {
      // Gọi API để tạo voice
      const response = await aiGen2(
        answer.content,
        'Tạo voice tiếng Việt cho nội dung nhận được',
        'gemini-2.5-pro-preview-tts',
        'audio'
      );

      const aiResult = response.result || response.answer || response.content || response;

      if (aiResult && aiResult.audio_base64) {
        // Xử lý upload audio base64 lên cloud
        const contentType = aiResult.audio_format === 'mp3' ? 'audio/mpeg' : 'application/octet-stream';
        const base64 = cleanBase64(aiResult.audio_base64);
        const bytes = base64ToUint8Array(base64);
        const blob = new Blob([bytes], { type: contentType });
        const finalFileName = ensureFileNameWithExtension(Date.now().toString(), contentType);
        const fileObj = new File([blob], finalFileName, { type: contentType });

        try {
          const res = await uploadFiles([fileObj]);
          const url = res.files?.[0]?.fileUrl || res.files?.[0]?.url || '';

          // Lưu audioUrl vào QuestionHistory nếu có questionHistoryId
          if (questionHistoryId) {
            await updateQuestionHistory({
              id: questionHistoryId,
              audioUrl: url
            });

            // Cập nhật lại history nếu có callback
            if (onHistoryUpdate) {
              onHistoryUpdate();
            }
          }

          // Cập nhật currentAnswer với audioUrl mới
          if (answer) {
            answer.audioUrl = url;
          }

          // Set localAudioUrl để trigger re-render
          setLocalAudioUrl(url);

          // Khởi tạo lại audio element và trạng thái cho questionHistoryId hiện tại
          if (questionHistoryId) {
            // Reset audio state cho questionHistoryId hiện tại
            const newAudioState = {
              isPlaying: false,
              currentTime: 0,
              duration: 0,
              isLoading: false
            };
            setAudioState(newAudioState);
            saveAudioState(questionHistoryId, newAudioState);

            // Khởi tạo audio element với URL mới
            initializeAudio(url);
          }

          message.success('✅ Tạo voice thành công!');

        } catch (e) {
          message.error('Upload audio thất bại!');
        }
      } else {
        message.error('Không tạo được audio!');
      }
    } catch (error) {
      message.error('Có lỗi khi tạo voice!');
    } finally {
      // Reset trạng thái đang tạo voice cho questionHistoryId hiện tại
      if (questionHistoryId) {
        setIsCreatingVoice(false);
      }
    }
  };

  // Hàm kiểm tra xem content có phải là HTML hay không
  const isHtmlContent = (content) => {
    if (!content || typeof content !== 'string') return false;

    // Kiểm tra các tag HTML phổ biến
    const htmlTags = /<(br|p|div|span|h[1-6]|ul|ol|li|table|tr|td|th|a|img|video|iframe|strong|em|b|i|u|code|pre|blockquote)[^>]*>/i;
    const htmlEntities = /&[a-z]+;/i;

    return htmlTags.test(content) || htmlEntities.test(content);
  };

  // Hàm sanitize HTML để loại bỏ script và các element nguy hiểm
  const sanitizeHtml = (html) => {
    if (!html || typeof html !== 'string') return '';

    // Loại bỏ script tags và các event handlers
    let sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Loại bỏ script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Loại bỏ iframe
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Loại bỏ object
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Loại bỏ embed
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '') // Loại bỏ form
      .replace(/<input\b[^>]*>/gi, '') // Loại bỏ input
      .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '') // Loại bỏ textarea
      .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, '') // Loại bỏ select
      .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '') // Loại bỏ button
      .replace(/<link\b[^>]*>/gi, '') // Loại bỏ link
      .replace(/<meta\b[^>]*>/gi, '') // Loại bỏ meta
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Loại bỏ style
      .replace(/<title\b[^<]*(?:(?!<\/title>)<[^<]*)*<\/title>/gi, '') // Loại bỏ title
      .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '') // Loại bỏ head
      .replace(/<body\b[^<]*(?:(?!<\/body>)<[^<]*)*<\/body>/gi, '') // Loại bỏ body
      .replace(/<html\b[^<]*(?:(?!<\/html>)<[^<]*)*<\/html>/gi, '') // Loại bỏ html
      .replace(/<base\b[^>]*>/gi, '') // Loại bỏ base
      .replace(/<bgsound\b[^>]*>/gi, '') // Loại bỏ bgsound
      .replace(/<marquee\b[^<]*(?:(?!<\/marquee>)<[^<]*)*<\/marquee>/gi, '') // Loại bỏ marquee
      .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '') // Loại bỏ applet
      .replace(/<xmp\b[^<]*(?:(?!<\/xmp>)<[^<]*)*<\/xmp>/gi, '') // Loại bỏ xmp
      .replace(/<plaintext\b[^<]*(?:(?!<\/plaintext>)<[^<]*)*<\/plaintext>/gi, '') // Loại bỏ plaintext
      .replace(/<listing\b[^<]*(?:(?!<\/listing>)<[^<]*)*<\/listing>/gi, ''); // Loại bỏ listing

    // Loại bỏ các event handlers (onclick, onload, onerror, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Loại bỏ javascript: protocol trong href và src
    sanitized = sanitized.replace(/(href|src)\s*=\s*["']javascript:[^"']*["']/gi, '$1=""');

    // Loại bỏ data: protocol trong src (có thể chứa script)
    sanitized = sanitized.replace(/(src)\s*=\s*["']data:[^"']*["']/gi, '$1=""');

    // Loại bỏ vbscript: protocol
    sanitized = sanitized.replace(/(href|src)\s*=\s*["']vbscript:[^"']*["']/gi, '$1=""');

    return sanitized;
  };

  // Hàm format text thông thường thành HTML đẹp
  const formatTextToHtml = (text) => {
    if (!text) return '';

    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('');
  };

  if (isProcessing || !answer) {
    return (
      <div className={styles.answerPanel}>
        <div className={styles.emptyState}>
          {isProcessing ? '⏳ Đang xử lý...' : '🤔 Hãy đặt câu hỏi để nhận câu trả lời từ Visao!'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.answerPanel}>
      <div className={`${styles.answerContent} ${styles.show}`}>
        <div className={styles.answerTitle}>
          {answer.title}
        </div>
        <div className={styles.answerTextContainer}>
          <div
            className={styles.answerText}
            dangerouslySetInnerHTML={{
              __html: isHtmlContent(answer.html)
                ? answer.html
                : formatTextToHtml(answer.html)
            }}
          />
        </div>

        <div className={styles.answerActions}>
          {userPermissions.canUseVoice && (
            <div className={styles.audioControls}>
              {!localAudioUrl && (
                <button
                  className={styles.voiceBtn}
                  onClick={handleVoiceClick}
                  disabled={isCreatingVoice}
                >
                  {isCreatingVoice ? '⏳ Đang tạo voice...' : '🔊 Nghe trả lời'}
                </button>
              )}

              {localAudioUrl && (
                <div className={styles.audioPlayer}>
                  <div className={styles.audioHeader}>
                    <span className={styles.audioTitle}>🎵 Nghe đọc</span>
                    <div className={styles.audioStatus}>
                      {audioState.isLoading ? '⏳ Loading...' :
                       audioState.isPlaying ? '▶️ Đang phát' : '⏸️ Đã dừng'}
                    </div>
                  </div>

                  <div className={styles.audioButtons}>
                    <button
                      className={styles.audioControlBtn}
                      onClick={toggleAudio}
                      disabled={audioState.isLoading}
                      title={audioState.isPlaying ? 'Tạm dừng' : 'Phát'}
                    >
                      {audioState.isLoading ? '⏳' : audioState.isPlaying ? '⏸️' : '▶️'}
                    </button>
                    <button
                      className={styles.audioControlBtn}
                      onClick={stopAudio}
                      disabled={audioState.isLoading}
                      title="Dừng"
                    >
                      ⏹️
                    </button>
                  </div>

                  <div className={styles.audioProgress}>
                    <div className={styles.audioTime}>
                      {formatTime(audioState.currentTime)}
                    </div>
                    <div
                      className={styles.audioProgressBar}
                      onClick={handleSeek}
                      title="Click để tua"
                    >
                      <div
                        className={styles.audioProgressFill}
                        style={{
                          width: audioState.duration && audioState.duration > 0
                            ? `${Math.min((audioState.currentTime / audioState.duration) * 100, 100)}%`
                            : '0%'
                        }}
                      />
                    </div>
                    <div className={styles.audioTime}>
                      {formatTime(audioState.duration)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {userPermissions.canUseReflection && (
            <button
              className={styles.reflectionBtn}
              onClick={toggleReflection}
            >
              🤔 Thử thách kiến thức
            </button>
          )}

          {!userPermissions.canUseVoice && !userPermissions.canUseReflection && (
            <div className={styles.upgradeNotice}>
              <div className={styles.upgradeContent}>
                <div className={styles.upgradeTitle}>
                  ⭐ Nâng cấp lên VIP
                </div>
                <div className={styles.upgradeText}>
                  Để sử dụng tính năng voice và suy ngẫm!
                </div>
              </div>
            </div>
          )}
        </div>

        <ReflectionPanel
          isVisible={reflectionVisible}
          setReflectionVisible={setReflectionVisible}
          onToggle={toggleReflection}
          question={reflectionQuestion || answer.title}
          currentAnswer={answer}
          questionHistoryId={questionHistoryId}
          onHistoryUpdate={onHistoryUpdate}
          userPermissions={userPermissions}
        />
      </div>
    </div>
  );
};

export default AnswerPanel;
