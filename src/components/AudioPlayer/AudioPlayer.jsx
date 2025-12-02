import React, { useEffect, useState, useRef } from 'react';
import { Button, Slider, message } from 'antd';
import { SoundOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined } from '@ant-design/icons';
import './AudioPlayer.module.css';
import { getSettingByType } from '../../apis/settingService.jsx';
import { getSettingByTypePublic } from '../../apis/public/publicService.jsx';


const AudioPlayer = ({ audioUrl, onPlay, onPause, onStop, showLabel = true, compact = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bgAudioSettings, setBgAudioSettings] = useState({ enabled: false, audioUrl: '', volume: 0.5 });

  const audioRef = useRef(null);
  const bgAudioRef = useRef(null);

  // Load background audio settings
  useEffect(() => {
    const loadBackgroundAudioSettings = async () => {
      try {
        const settings = await getSettingByTypePublic('BACKGROUND_AUDIO');
        if (settings?.setting) {
          setBgAudioSettings(settings.setting);
        }
      } catch (error) {
        console.log('Error loading background audio settings:', error);
      }
    };
    loadBackgroundAudioSettings();
  }, []);

  // Play background audio
  const playBackgroundAudio = async () => {
    if (!bgAudioSettings.enabled || !bgAudioSettings.audioUrl) {
      return;
    }

    try {
      // If already playing, don't restart
      if (bgAudioRef.current && !bgAudioRef.current.paused) {
        return;
      }

      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }

      const bgAudio = new Audio(bgAudioSettings.audioUrl);
      bgAudioRef.current = bgAudio;
      bgAudio.volume = bgAudioSettings.volume || 0.5;
      bgAudio.loop = true;

      // Handle errors
      bgAudio.onerror = () => {
        console.error('Background audio error');
        bgAudioRef.current = null;
      };

      // Handle when audio ends (shouldn't happen with loop, but just in case)
      bgAudio.onended = () => {
        // Restart if ended unexpectedly
        if (bgAudioRef.current && audioRef.current && !audioRef.current.paused) {
          bgAudioRef.current.play();
        }
      };

      await bgAudio.play();
    } catch (error) {
      console.error('Error playing background audio:', error);
    }
  };

  const stopBackgroundAudio = () => {
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
      bgAudioRef.current = null;
    }
  };

  const pauseBackgroundAudio = () => {
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
    }
  };

  const resumeBackgroundAudio = async () => {
    if (bgAudioRef.current && bgAudioRef.current.paused) {
      try {
        await bgAudioRef.current.play();
      } catch (error) {
        console.error('Error resuming background audio:', error);
        // If resume fails, try to restart
        if (bgAudioSettings.enabled && bgAudioSettings.audioUrl) {
          await playBackgroundAudio();
        }
      }
    } else if (!bgAudioRef.current && bgAudioSettings.enabled && bgAudioSettings.audioUrl) {
      // If no background audio exists, start it
      await playBackgroundAudio();
    }
  };

  const handlePlayAudio = async () => {
    if (!audioUrl) {
      message.warning('Không có audio để phát!');
      return;
    }

    // If already playing, pause it
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      pauseBackgroundAudio();
      setIsPlaying(false);
      if (onPause) onPause();
      return;
    }

    // Resume if paused
    if (audioRef.current && audioRef.current.paused && !isPlaying) {
      audioRef.current.play();
      // Always resume background audio when resuming main audio
      if (bgAudioSettings.enabled && bgAudioSettings.audioUrl) {
        await resumeBackgroundAudio();
      }
      setIsPlaying(true);
      if (onPlay) onPlay();
      return;
    }

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    stopBackgroundAudio();

    // Start background audio
    await playBackgroundAudio();

    // Play main audio with better buffering
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    // Set preload and buffering options
    audio.preload = 'auto';
    
    // Set up event listeners
    audio.onloadstart = () => {
      setIsLoading(true);
      setLoadProgress(0);
      console.log('Audio loading started');
    };

    audio.onprogress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const duration = audio.duration;
        if (duration > 0) {
          const progress = (bufferedEnd / duration) * 100;
          setLoadProgress(progress);
          console.log(`Audio buffered: ${progress.toFixed(1)}%`);
        }
      }
    };

    audio.oncanplay = () => {
      console.log('Audio can play');
      setIsBuffering(false);
    };

    audio.oncanplaythrough = () => {
      console.log('Audio can play through');
      setIsLoading(false);
      setLoadProgress(100);
      setIsBuffering(false);
    };

    audio.onwaiting = () => {
      console.log('Audio waiting for data');
      setIsBuffering(true);
    };

    audio.onstalled = () => {
      console.log('Audio stalled');
      setIsBuffering(true);
    };

    audio.onplay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      if (onPlay) onPlay();
    };

    audio.onpause = () => {
      setIsPlaying(false);
      pauseBackgroundAudio();
      if (onPause) onPause();
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      stopBackgroundAudio();
      if (onStop) onStop();
    };

    audio.onerror = (e) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      setIsLoading(false);
      setIsBuffering(false);
      const errorMsg = audioRef.current?.error
        ? `Lỗi tải audio: ${audioRef.current.error.code}`
        : 'Không thể tải audio!';
      message.error(errorMsg);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Check if we're running out of buffer
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const currentTime = audio.currentTime;
        const timeUntilBufferEnd = bufferedEnd - currentTime;
        
        // If less than 2 seconds of buffer left, show buffering
        if (timeUntilBufferEnd < 2 && isPlaying) {
          setIsBuffering(true);
        }
      }
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      console.log(`Audio duration: ${audio.duration}s`);
    };

    // Play with better error handling
    try {
      // Wait a bit for initial buffer
      await new Promise(resolve => setTimeout(resolve, 100));
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setIsLoading(false);
      setIsBuffering(false);
      stopBackgroundAudio();
      
      // More specific error messages
      let errorMsg = 'Không thể phát audio!';
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Trình duyệt không cho phép phát audio tự động';
      } else if (error.name === 'NotSupportedError') {
        errorMsg = 'Định dạng audio không được hỗ trợ';
      } else if (error.message) {
        errorMsg = `Lỗi: ${error.message}`;
      }
      
      message.error(errorMsg);
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
    stopBackgroundAudio();
    if (onStop) onStop();
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      const oldTime = audioRef.current.currentTime;
      const seekDistance = Math.abs(value - oldTime);
      
      // If seeking more than 5 seconds, show buffering
      if (seekDistance > 5) {
        setIsBuffering(true);
        console.log(`Seeking from ${oldTime}s to ${value}s (${seekDistance}s jump)`);
      }
      
      audioRef.current.currentTime = value;
      setCurrentTime(value);
      
      // Sync background audio with main audio time
      if (bgAudioRef.current && !bgAudioRef.current.paused) {
        bgAudioRef.current.currentTime = value;
      }
    }
  };

  // Sync background audio with main audio time
  useEffect(() => {
    if (isPlaying && bgAudioRef.current && !bgAudioRef.current.paused) {
      // Sync background audio time with main audio time
      const timeDiff = Math.abs(bgAudioRef.current.currentTime - currentTime);
      if (timeDiff > 0.5) { // Only sync if difference is more than 0.5 seconds
        bgAudioRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime, isPlaying]);

  // Cleanup on unmount
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
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    };
  }, []);

  // Format time to MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) {
    return null;
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Button
          type="primary"
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={handlePlayAudio}
          disabled={isLoading}
          loading={isLoading || isBuffering}
          size="small"
          shape="circle"
          style={{ 
            width: '36px', 
            height: '36px',
            backgroundColor: isLoading || isBuffering ? '#52c41a' : '#1890ff',
            borderColor: isLoading || isBuffering ? '#52c41a' : '#1890ff'
          }}
        />

        {isPlaying && !isBuffering && (
          <Button
            icon={<StopOutlined />}
            onClick={handleStopAudio}
            size="small"
            shape="circle"
            style={{ 
              width: '36px', 
              height: '36px',
              backgroundColor: '#ffffff',
              borderColor: '#d9d9d9',
              color: '#595959'
            }}
          />
        )}

        {(isLoading || isBuffering) && (
          <span style={{ fontSize: '12px', color: '#666' }}>
            {isLoading ? 'Đang tải...' : 'Đang buffer...'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      marginBottom: '20px',
      padding: '16px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Play/Pause Button */}
        <Button
          type="default"
          icon={isPlaying ? <PauseCircleOutlined  style={{ color: '#ffffff' }}/> : <PlayCircleOutlined style={{ color: '#ffffff' }}/>}
          onClick={handlePlayAudio}
          disabled={isLoading}
          loading={isLoading || isBuffering}
          size="large"
          shape="circle"
          style={{
            width: '44px',
            height: '44px',
            backgroundColor: isLoading || isBuffering ? '#52c41a' : '#262626',
          }}
        />

        {/* Stop Button */}
        <Button
          icon={<StopOutlined />}
          onClick={handleStopAudio}
          disabled={!isPlaying}
          size="large"
          shape="circle"
          style={{
            width: '44px',
            height: '44px',
            backgroundColor: '#ffffff',
            borderColor: '#d9d9d9',
            color: '#595959'
          }}
        />

        {/* Time Display and Progress Bar */}
        <div style={{ flex: 1 }}>
          {/* Status Text */}
          {(isLoading || isBuffering) && (
            <div style={{ fontSize: '12px', color: '#52c41a', marginBottom: '4px' }}>
              {isLoading ? `Đang tải... ${loadProgress.toFixed(0)}%` : 'Đang buffer...'}
            </div>
          )}

          {/* Audio Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#666', minWidth: '40px', textAlign: 'right' }}>
              {formatTime(currentTime)}
            </span>
            <Slider
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              style={{ flex: 1 }}
              tooltip={{ formatter: null }}
              disabled={isLoading || isBuffering}
            />
            <span style={{ fontSize: '12px', color: '#666', minWidth: '40px' }}>
              {formatTime(duration)}
            </span>
          </div>

          {/* Buffer Progress Bar (if loading) */}
          {isLoading && loadProgress < 100 && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ 
                height: '2px', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '1px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  backgroundColor: '#52c41a',
                  width: `${loadProgress}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

