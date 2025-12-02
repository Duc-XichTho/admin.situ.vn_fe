import React, {useEffect, useState} from 'react';
import {Button, Card, DatePicker, Form, Input, message, Modal, Space, Tag, Tooltip, Typography} from 'antd';
import {
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  EditOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  SaveOutlined,
  SettingOutlined
} from '@ant-design/icons';
import {calculateTimeRange, generateTimeRangeOptions, TIME_RANGE_TYPES} from '../../../../utils/timeRangeUtils';
import {getQuestionHistoryByEmailAndDateRange} from '../../../../apis/questionHistoryService';
import {aiGen} from '../../../../apis/aiGen/botService';
import {createOrUpdateSetting, getSettingByType} from '../../../../apis/settingService';
import { getSettingByTypePublic} from '../../../../apis/public/publicService.jsx';

import {createNewAnalysisHistory} from '../../../../apis/analysisHistoryService';
import styles from './TimeRangeSelector.module.css';
import dayjs from 'dayjs';
import {createTimestamp} from "../../../../generalFunction/format.js";
import {marked} from "marked";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const TimeRangeSelector = ({ onTimeRangeSelect, currentUser, className = '' }) => {
  const [selectedRange, setSelectedRange] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [customRange, setCustomRange] = useState(null);
  const [defaultRange, setDefaultRange] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [questionHistoryData, setQuestionHistoryData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [promptConfig, setPromptConfig] = useState(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editingPromptData, setEditingPromptData] = useState(null);
  const [promptForm] = Form.useForm();
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editingSystemMessage, setEditingSystemMessage] = useState('');
  const [hasLoadedDefault, setHasLoadedDefault] = useState(false);

  const timeRangeOptions = generateTimeRangeOptions();

  // Lấy dữ liệu question history theo email và khoảng thời gian
  const fetchQuestionHistoryData = async (email, startDate, endDate) => {
    if (!email || !startDate || !endDate) {
      message.error('Thiếu thông tin email hoặc khoảng thời gian');
      return null;
    }

    setIsLoading(true);
    try {
      const data = await getQuestionHistoryByEmailAndDateRange(email, startDate, endDate);
      console.log('Question History Data:', data);
      setQuestionHistoryData(data);
      return data;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu question history:', error);
      message.error('Không thể lấy dữ liệu. Vui lòng thử lại.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Lưu kết quả phân tích vào database
  const saveAnalysisToDatabase = async (timeRange, data, aiResult, processingTime) => {
    try {
      const analysisData = {
        user_email: currentUser.email,
        analysis_name: `Phân tích học tập - ${timeRange.label}`,
        time_range_type: timeRange.type || 'custom',
        start_date: timeRange.startDate,
        end_date: timeRange.endDate,
        time_range_label: timeRange.label,
        raw_data_summary: {
          total_records: data.length,
        },
        ai_analysis_result: {
          result: aiResult,
        },
        analysis_status: 'completed',
        ai_model_version: 'v1.0',
        processing_time_ms: processingTime.toString(),
        created_at: createTimestamp(),
        user_create: currentUser.email
      };

      const savedAnalysis = await createNewAnalysisHistory(analysisData);
      return savedAnalysis;
    } catch (error) {
      console.error('Lỗi khi lưu kết quả phân tích:', error);
      throw error;
    }
  };

  // Phân tích dữ liệu bằng AI
  const analyzeDataWithAI = async (data) => {
    if (!data || data.length === 0) {
      message.error('Không có dữ liệu để phân tích');
      return;
    }

    if (!promptConfig) {
      message.error('Chưa tải được cấu hình phân tích AI');
      return;
    }

    setIsAnalyzing(true);
    const startTime = Date.now();
    
    try {
      // Loại bỏ trường answer khỏi dữ liệu
      const filteredData = data.map(item => {
        const { answer, level, ...rest } = item;
        return rest;
      });

      // Tạo prompt đơn giản với dữ liệu gốc
      const simplePrompt = `${promptConfig.prompt_template || 'Dựa vào dữ liệu lịch sử câu hỏi học tập sau đây, hãy đánh giá tình hình học tập của học sinh:'}

DỮ LIỆU LỊCH SỬ CÂU HỎI:
${JSON.stringify(filteredData, null, 2)}

Trả lời bằng tiếng Việt, chi tiết và hữu ích.`;
      
      const aiResponse = await aiGen(
        simplePrompt, 
        promptConfig.system_message || 'Bạn là chuyên gia giáo dục, hãy phân tích dữ liệu học tập một cách khách quan và đưa ra đánh giá hữu ích.', 
         'gpt-4.1-2025-04-14'
      );
      
      // Đảm bảo response là string
      const aiResponseText = aiResponse?.result || 'Không thể phân tích dữ liệu';
      
      setAiAnalysis(aiResponseText);
      
      // Tính thời gian xử lý
      const processingTime = Date.now() - startTime;
      
      // Lưu kết quả vào database
      if (selectedRange) {
        await saveAnalysisToDatabase(selectedRange, data, aiResponseText, processingTime);
        message.success('Phân tích AI hoàn thành!');
      }
      
    } catch (error) {
      console.error('Lỗi khi phân tích bằng AI:', error);
      message.error('Không thể phân tích bằng AI. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Xử lý khi chọn khoảng thời gian
  const handleTimeRangeSelect = async (timeRange, customLabel = null) => {
    // Sử dụng custom label nếu có, nếu không thì dùng label từ timeRange
    const finalTimeRange = {
      ...timeRange,
      label: customLabel || timeRange.label,
      isAutoLoaded: timeRange.isAutoLoaded || false
    };
    
    setSelectedRange(finalTimeRange);
    
    // Reset hasLoadedDefault khi user chọn thủ công
    if (hasLoadedDefault && !timeRange.isAutoLoaded) {
      setHasLoadedDefault(false);
    }
    
    // Lấy dữ liệu question history
    const data = await fetchQuestionHistoryData(
      currentUser.email,
      finalTimeRange.startDate,
      finalTimeRange.endDate
    );

    if (data) {
      // Cập nhật selectedRange với dữ liệu đã lấy được
      const updatedTimeRange = {
        ...finalTimeRange,
        data: data
      };
      
      setSelectedRange(updatedTimeRange);
      message.success('Đã lấy dữ liệu thành công! Bắt đầu phân tích AI...');
      
      // Tự động chạy phân tích AI
      await analyzeDataWithAI(data);
    }
    
    // Gọi callback
    if (onTimeRangeSelect) {
      onTimeRangeSelect(finalTimeRange);
    }
  };

  // Khi mở modal, set defaultRange và customRange là 15 ngày gần nhất
  const handleOpenModal = () => {
    const now = dayjs();
    const fifteenDaysAgo = now.subtract(14, 'day');
    const range = [fifteenDaysAgo.startOf('day'), now.endOf('day')];
    setDefaultRange(range);
    setCustomRange({
      startDate: range[0].toDate(),
      endDate: range[1].toDate(),
      type: 'custom',
      label: `${fifteenDaysAgo.format('DD/MM/YYYY')} - ${now.format('DD/MM/YYYY')}`
    });
    setModalVisible(true);
  };

  // Xử lý khi chọn khoảng thời gian tùy chỉnh
  const handleCustomRangeChange = (dates) => {
    if (!dates || dates.length !== 2) {
      setCustomRange(null);
      setDefaultRange([]);
      return;
    }
    setDefaultRange(dates);
    const [start, end] = dates;
    setCustomRange({
      startDate: start.startOf('day').toDate(),
      endDate: end.endOf('day').toDate(),
      type: 'custom',
      label: `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`
    });
  };

  // Xử lý khi submit custom range
  const handleCustomRangeSubmit = async () => {
    if (!customRange) {
      message.error('Vui lòng chọn khoảng thời gian');
      return;
    }

    if (!currentUser?.email) {
      message.error('Không tìm thấy thông tin người dùng');
      return;
    }

    // Gọi handleTimeRangeSelect với custom range
    await handleTimeRangeSelect(customRange);
  };

  // Hiển thị trạng thái phân tích
  const renderAnalysisStatus = () => {
    if (isAnalyzing) {
      return <LoadingOutlined className={styles.statusIcon} />;
    }
    
    return null;
  };

  // Hiển thị label cho khoảng thời gian đã chọn
  const getDisplayLabel = () => {
    return 'Tổng kết';
  };

  // Lấy cấu hình prompt từ settings
  const fetchPromptConfig = async () => {
    setIsLoadingPrompt(true);
    try {
      const config = await getSettingByTypePublic('ai_analysis_prompt');
      
      // Nếu config có trường setting (JSONB), lấy từ đó
      if (config && config.setting) {
        setPromptConfig(config.setting);
      } else {
        // Fallback cho trường hợp cũ
        setPromptConfig(config);
      }
    } catch (error) {
      console.error('Lỗi khi lấy cấu hình prompt:', error);
      message.error('Không thể tải cấu hình phân tích AI. Vui lòng liên hệ admin.');
      setPromptConfig(null);
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  // Load prompt config khi component mount
  useEffect(() => {
    fetchPromptConfig();
  }, []);

  // Bắt đầu chỉnh sửa prompt (chỉ admin)
  const startEditingPrompt = () => {
    if (!promptConfig) return;
    
    setEditingPromptData({
      prompt_template: promptConfig.prompt_template,
      system_message: promptConfig.system_message
    });
    
    setEditingSystemMessage(promptConfig.system_message || '');
    
    promptForm.setFieldsValue({
      prompt_template: promptConfig.prompt_template,
      system_message: promptConfig.system_message
    });
    
    setIsEditingPrompt(true);
  };

  // Lưu prompt config (chỉ admin)
  const savePromptConfig = async (values) => {
    try {
      // Lưu prompt config vào database với cấu trúc đúng
      const settingData = {
        type: 'ai_analysis_prompt',
        setting: {
          prompt_template: values.prompt_template,
          system_message: values.system_message
        }
      };
      
      await createOrUpdateSetting(settingData);
      
      // Cập nhật local state
      setPromptConfig(values);
      setEditingPromptData(null);
      setIsEditingPrompt(false);
      
      message.success('Đã lưu cấu hình prompt thành công!');
    } catch (error) {
      console.error('Lỗi khi lưu prompt config:', error);
      message.error(`Không thể lưu cấu hình prompt: ${error.response?.data?.message || error.message}`);
    }
  };

  // Hủy chỉnh sửa prompt
  const cancelEditingPrompt = () => {
    setEditingPromptData(null);
    setIsEditingPrompt(false);
    promptForm.resetFields();
  };

  return (
    <>
      <div className={`${styles.timeRangeSelector} ${className}`}>
        <Button 
          type="default" 
          icon={<CalendarOutlined />}
          className={styles.selectorButton}
          onClick={handleOpenModal}
        >
          <Space>
            <span>{getDisplayLabel()}</span>
            {renderAnalysisStatus()}
          </Space>
        </Button>
      </div>

      <Modal
        title={
          <div className={styles.modalTitle}>
            <BarChartOutlined className={styles.titleIcon} />
            <div>
              <Title level={4} className={styles.titleText}>Tổng kết dữ liệu</Title>
              <Text className={styles.titleSubtext}>Chọn khoảng thời gian để phân tích</Text>
            </div>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1400}
        className={styles.timeRangeModal}
        closeIcon={<CloseOutlined className={styles.closeIcon} />}
      >
        <div className={styles.modalContent}>
          <div className={styles.contentLayout}>
            {/* Left Panel - Time Selection */}
            <div className={styles.leftPanel}>
              {/* Custom Selection */}
              <Card className={styles.selectionCard} title={
                <div className={styles.cardTitle}>
                  <span>Chọn khoảng thời gian</span>
                  {currentUser?.isAdmin && (
                    <Button
                      type="text"
                      icon={<SettingOutlined />}
                      onClick={() => setSettingsModalVisible(true)}
                      size="small"
                      className={styles.settingsButton}
                      title="Cấu hình AI"
                    />
                  )}
                </div>
              }>
                <div className={styles.customSection}>
                  <RangePicker
                    value={defaultRange}
                    onChange={handleCustomRangeChange}
                    format="DD/MM/YYYY"
                    placeholder={['Từ ngày', 'Đến ngày']}
                    className={styles.customPicker}
                    size="large"
                  />
                  <Button
                    type="primary"
                    onClick={handleCustomRangeSubmit}
                    disabled={!customRange || isLoading || isAnalyzing || isLoadingPrompt || !promptConfig}
                    className={styles.submitButton}
                    icon={isLoading || isAnalyzing ? <LoadingOutlined /> : <PlayCircleOutlined />}
                    size="large"
                    loading={isLoading || isAnalyzing}
                  >
                    {isLoading ? 'Đang tải dữ liệu...' : isAnalyzing ? 'Đang phân tích AI...' : isLoadingPrompt ? 'Đang tải cấu hình...' : !promptConfig ? 'Chưa có cấu hình AI' : 'Bắt đầu phân tích'}
                  </Button>
                </div>
                <div className={styles.analysisInfo}>
                  <Text className={styles.analysisInfoText}>
                    {!promptConfig ? 
                      'Cấu hình phân tích AI chưa được thiết lập. Vui lòng liên hệ admin.' : 
                      'Hệ thống sẽ tự động phân tích dữ liệu học tập và đưa ra đánh giá chi tiết bằng AI'
                    }
                  </Text>
                </div>
              </Card>
            </div>

            {/* Right Panel - Analysis Preview */}
            <div className={styles.rightPanel}>
              <Card className={styles.previewCard} title="Tổng kết phân tích">
                {selectedRange ? (
                  <div className={styles.analysisPreview}>
                    <div className={styles.selectedRangeInfo}>
                      <Tag color="blue" className={styles.rangeTag}>
                        {selectedRange.label}
                      </Tag>
                    </div>
                    
                    {/* AI Analysis Results */}
                    {aiAnalysis ? (
                      <div className={styles.aiAnalysisSection}>
                        <div className={styles.aiAnalysisContent}>
                          <div 
                            className={styles.aiAnalysisText}
                            dangerouslySetInnerHTML={{ 
                              __html: marked(aiAnalysis)
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className={styles.emptyPreview}>
                        <RobotOutlined className={styles.emptyIcon} />
                        <Text className={styles.emptyText}>
                          {isAnalyzing ? 'Đang phân tích AI...' : 'Chưa có kết quả phân tích AI'}
                        </Text>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyPreview}>
                    <BarChartOutlined className={styles.emptyIcon} />
                    <Text className={styles.emptyText}>
                      Chọn khoảng thời gian để xem kết quả phân tích
                    </Text>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        title="Cấu hình AI"
        open={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        footer={null}
        width={1000}
        className={styles.settingsModal}
      >
        {isEditingPrompt ? (
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <Form
                form={promptForm}
                layout="vertical"
                onFinish={savePromptConfig}
                style={{ display: 'flex', gap: '20px', width: '100%' }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: '10px' }}>Prompt Template</h4>
                  <Form.Item
                    name="prompt_template"
                    rules={[{ required: true, message: 'Vui lòng nhập prompt template!' }]}
                  >
                    <Input.TextArea
                      rows={20}
                      placeholder="Nhập prompt cho AI..."
                      style={{ fontSize: '14px' }}
                    />
                  </Form.Item>
                </div>
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: '10px' }}>System Message</h4>
                  <Form.Item
                    name="system_message"
                    rules={[{ required: true, message: 'Vui lòng nhập system message!' }]}
                  >
                    <Input.TextArea
                      rows={20}
                      placeholder="Nhập system message cho AI..."
                      style={{ fontSize: '14px' }}
                    />
                  </Form.Item>
                </div>
              </Form>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isLoadingPrompt}
                onClick={() => promptForm.submit()}
                size="large"
                style={{ marginRight: '10px' }}
              >
                Lưu
              </Button>
              <Button
                onClick={cancelEditingPrompt}
                size="large"
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom: '10px' }}>Prompt Template</h4>
                <div style={{ 
                  padding: '15px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px', 
                  backgroundColor: '#fafafa',
                  minHeight: '200px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <Text style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    {promptConfig?.prompt_template || 'Chưa có prompt template'}
                  </Text>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom: '10px' }}>System Message</h4>
                <div style={{ 
                  padding: '15px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px', 
                  backgroundColor: '#fafafa',
                  minHeight: '200px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <Text style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    {promptConfig?.system_message || 'Chưa có system message'}
                  </Text>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={startEditingPrompt}
                size="large"
              >
                Chỉnh sửa
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default TimeRangeSelector; 