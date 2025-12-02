import { Modal, Switch, Upload, Progress, Slider, Button, message } from 'antd';
import { SoundOutlined } from '@ant-design/icons';

export default function BackgroundAudio({
  visible,
  onCancel,
  onOk,
  bgAudioSettings,
  setBgAudioSettings,
  bgAudioFile,
  bgAudioUploading,
  handleBackgroundAudioUpload
}) {
  return (
    <Modal
      title="Cài đặt nhạc nền"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      width={450}
      centered={true}
      okText="Lưu"
      cancelText="Hủy"
    >
      <div style={{ padding: '20px 0' }}>
        {/* Enable/Disable Switch */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Bật nhạc nền</span>
          <Switch
            checked={bgAudioSettings.enabled}
            onChange={(checked) => setBgAudioSettings(prev => ({ ...prev, enabled: checked }))}
          />
        </div>

        {/* Audio Upload */}
        <div style={{ marginBottom: '20px' }}>
          <Upload.Dragger
            fileList={bgAudioFile ? [bgAudioFile] : []}
            beforeUpload={() => false}
            onChange={({ fileList }) => {
              if (fileList.length === 0) {
                handleBackgroundAudioUpload(null);
              } else {
                const file = fileList[fileList.length - 1];
                handleBackgroundAudioUpload(file);
              }
            }}
            onRemove={() => {
              handleBackgroundAudioUpload(null);
              return false;
            }}
            accept="audio/*"
            maxCount={1}
            showUploadList={{
              showPreviewIcon: false,
              showRemoveIcon: true,
            }}
            disabled={bgAudioUploading}
            style={{ marginBottom: '16px' }}
          >
            <p className="ant-upload-drag-icon">
              <SoundOutlined />
            </p>
            <p className="ant-upload-text">
              {bgAudioUploading ? 'Đang upload...' : 'Upload file nhạc nền'}
            </p>
            <p className="ant-upload-hint">
              MP3, WAV, AAC, M4A
            </p>
          </Upload.Dragger>
          {bgAudioUploading && (
            <Progress
              percent={100}
              status="active"
              size="small"
            />
          )}
        </div>

        {/* Volume Control */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#262626' }}>
            Âm lượng nhạc nền
          </h4>
          <div style={{ padding: '0 8px' }}>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={bgAudioSettings.volume}
              onChange={(value) => setBgAudioSettings(prev => ({ ...prev, volume: value }))}
              marks={{
                0: '0%',
                0.25: '25%',
                0.5: '50%',
                0.75: '75%',
                1: '100%'
              }}
              tooltip={{
                formatter: (value) => `${Math.round(value * 100)}%`
              }}
              disabled={!bgAudioSettings.enabled || !bgAudioSettings.audioUrl}
            />
          </div>
          <div style={{
            textAlign: 'center',
            marginTop: '8px',
            fontSize: '12px',
            color: '#8c8c8c'
          }}>
            Âm lượng hiện tại: {Math.round(bgAudioSettings.volume * 100)}%
          </div>
        </div>

        {/* Test Play Button */}
        {bgAudioSettings.enabled && bgAudioSettings.audioUrl && (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Button
              type="dashed"
              icon={<SoundOutlined />}
              onClick={() => {
                // Simple test play with current volume
                const testAudio = new Audio(bgAudioSettings.audioUrl);
                testAudio.volume = bgAudioSettings.volume;
                testAudio.play().then(() => {
                  message.success(`✅ Test thành công với âm lượng ${Math.round(bgAudioSettings.volume * 100)}%!`);
                  setTimeout(() => testAudio.pause(), 30000); // Play for 30 seconds
                }).catch(error => {
                  console.error('Test play error:', error);
                  message.error('❌ Không thể phát nhạc nền');
                });
              }}
            >
              Test nhạc nền 30s
            </Button>
          </div>
        )}

        {/* Simple Status */}
        <div style={{
          backgroundColor: '#f6f8fa',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#586069'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Trạng thái:</strong> {bgAudioSettings.enabled ? '✅ Bật' : '❌ Tắt'}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>File nhạc:</strong> {bgAudioSettings.audioUrl ? '✅ Đã có' : '❌ Chưa có'}
          </div>
          <div>
            <strong>Âm lượng:</strong> {Math.round(bgAudioSettings.volume * 100)}%
          </div>
        </div>
      </div>
    </Modal>
  );
}