import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, FileImageOutlined, FileTextOutlined, HomeOutlined, LoadingOutlined, PictureOutlined, SearchOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Empty, Image, Input, message, Modal, Popconfirm, Select, Space, Switch, Table, Tabs, Tag, Tooltip } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiGen, aiGen2 } from '../../apis/aiGen/botService.jsx';
import { uploadFiles } from '../../apis/aiGen/uploadImageWikiNoteService.jsx';
import { getK9ByType, updateK9, updateK9Bulk } from '../../apis/k9Service.jsx';
import { getSettingByType } from '../../apis/settingService.jsx';
import EditDetailModal from '../K9/components/EditDetailModal.jsx';
import EditSummaryDetailModal from '../K9/components/EditSummaryDetailModal.jsx';
import DiagramPreviewModal from '../K9Management/components/DiagramPreviewModal.jsx';
import PromptSettingsListModal from '../K9Management/components/PromptSettingsListModal.jsx';
import SelectPromptModal from '../K9Management/components/SelectPromptModal.jsx';
import { extractJsonFromMarkdown, normalizeExcalidrawJson, validateExcalidrawJson } from '../K9Management/utils/excalidrawHelpers.js';
import styles from './AISummaryDetailGeneration.module.css';
const { TextArea } = Input;
const { TabPane } = Tabs;

const AISummaryDetailGeneration = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('news');
    const [searchText, setSearchText] = useState('');
    const [selectedDetailRecord, setSelectedDetailRecord] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedSummaryDetailRecord, setSelectedSummaryDetailRecord] = useState(null);
    const [summaryDetailModalVisible, setSummaryDetailModalVisible] = useState(false);
    // Prompt settings list modal
    const [promptSettingsListModalVisible, setPromptSettingsListModalVisible] = useState(false);
    const [processingRecordId, setProcessingRecordId] = useState(null);
    const [processingHtmlRecordId, setProcessingHtmlRecordId] = useState(null);
    const [processingExcalidrawRecordId, setProcessingExcalidrawRecordId] = useState(null);
    const [deletingSummaryDetail, setDeletingSummaryDetail] = useState(false);
    const [deletingHtml, setDeletingHtml] = useState(false);
    const [deletingExcalidraw, setDeletingExcalidraw] = useState(false);
    const [deletingImgUrls, setDeletingImgUrls] = useState(false);
    const shouldStopRef = useRef(false);

    // Queue states for HTML and Excalidraw
    const [htmlQueue, setHtmlQueue] = useState([]);
    const [excalidrawQueue, setExcalidrawQueue] = useState([]);
    const [processingHtmlQueue, setProcessingHtmlQueue] = useState(false);
    const [processingExcalidrawQueue, setProcessingExcalidrawQueue] = useState(false);
    const [currentHtmlProcessing, setCurrentHtmlProcessing] = useState(null);
    const [currentExcalidrawProcessing, setCurrentExcalidrawProcessing] = useState(null);
    const [htmlQueueModalVisible, setHtmlQueueModalVisible] = useState(false);
    const [excalidrawQueueModalVisible, setExcalidrawQueueModalVisible] = useState(false);
    const [htmlQueueResults, setHtmlQueueResults] = useState([]); // Track HTML results with success/error
    const [excalidrawQueueResults, setExcalidrawQueueResults] = useState([]); // Track Excalidraw results with success/error

    // Prompt selection states for HTML and Excalidraw from SummaryDetail
    const [selectHtmlPromptModalVisible, setSelectHtmlPromptModalVisible] = useState(false);
    const [selectExcalidrawPromptModalVisible, setSelectExcalidrawPromptModalVisible] = useState(false);
    const [pendingHtmlRecord, setPendingHtmlRecord] = useState(null);
    const [pendingExcalidrawRecord, setPendingExcalidrawRecord] = useState(null);
    const [pendingHtmlRecords, setPendingHtmlRecords] = useState([]);
    const [pendingExcalidrawRecords, setPendingExcalidrawRecords] = useState([]);

    // Preview modal states
    const [diagramPreviewModalVisible, setDiagramPreviewModalVisible] = useState(false);
    const [selectedDiagramData, setSelectedDiagramData] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(1000);
    const [summaryDetailFilter, setSummaryDetailFilter] = useState('all'); // 'all', 'has', 'none'
    const [diagramHtmlFilter, setDiagramHtmlFilter] = useState('all'); // 'all', 'has', 'none'
    const [diagramExcalidrawFilter, setDiagramExcalidrawFilter] = useState('all'); // 'all', 'has', 'none'
    const [imgUrlsFilter, setImgUrlsFilter] = useState('all'); // 'all', 'has', 'none'

    // Queue states for SummaryDetail
    const [summaryDetailQueue, setSummaryDetailQueue] = useState([]);
    const [processingSummaryDetailQueue, setProcessingSummaryDetailQueue] = useState(false);
    const [currentSummaryDetailProcessing, setCurrentSummaryDetailProcessing] = useState(null);
    const [summaryDetailQueueModalVisible, setSummaryDetailQueueModalVisible] = useState(false);
    const [summaryDetailQueueResults, setSummaryDetailQueueResults] = useState([]);

    const [togglingShowHtml, setTogglingShowHtml] = useState(false);
    const [togglingShowExcalidraw, setTogglingShowExcalidraw] = useState(false);
    const [togglingShowImgUrls, setTogglingShowImgUrls] = useState(false);
    // Preview imgUrls modal
    const [imgUrlsPreviewModalVisible, setImgUrlsPreviewModalVisible] = useState(false);
    const [previewingRecord, setPreviewingRecord] = useState(null);
    const [editingDescriptions, setEditingDescriptions] = useState({}); // { index: description }
    const [savingDescription, setSavingDescription] = useState(false);

    // Queue states for Image generation from SummaryDetail (tạo imageUrl JSON)
    const [imageGenerationQueue, setImageGenerationQueue] = useState([]);
    const [processingImageQueue, setProcessingImageQueue] = useState(false);
    const [currentImageProcessing, setCurrentImageProcessing] = useState(null);
    const [imageQueueModalVisible, setImageQueueModalVisible] = useState(false);
    const [imageQueueResults, setImageQueueResults] = useState([]);
    const [selectImagePromptModalVisible, setSelectImagePromptModalVisible] = useState(false);
    const [pendingImageRecord, setPendingImageRecord] = useState(null);
    const [pendingImageRecords, setPendingImageRecords] = useState([]);

    // K9 data for each tab
    const [k9Data, setK9Data] = useState({
        news: [],
        caseTraining: [],
        longForm: [],
        home: [],
    });

    // Load K9 data for all tabs
    const loadK9Data = async () => {
        setLoading(true);
        try {
            const [newsData, caseTrainingData, longFormData, homeData] = await Promise.all([
                getK9ByType('news', { data_type: 'global', }),
                getK9ByType('caseTraining', { data_type: 'global' }),
                getK9ByType('longForm', { data_type: 'global' }),
                getK9ByType('home', { data_type: 'global' }),
            ]);

            const newK9Data = {
                news: newsData?.data || newsData || [],
                caseTraining: caseTrainingData?.data || caseTrainingData || [],
                longForm: longFormData?.data || longFormData || [],
                home: homeData?.data || homeData || [],
            };
            setK9Data(newK9Data);
        } catch (error) {
            console.error('Error loading K9 data:', error);
            message.error('Lỗi khi tải dữ liệu K9');
        } finally {
            setLoading(false);
        }
    };

    // Load Summary Detail AI Setting (load từ SUMMARY_DETAIL_CONFIG)
    const loadSummaryDetailAiSetting = async () => {
        try {
            const settings = await getSettingByType('SUMMARY_DETAIL_CONFIG');
            if (settings?.setting) {
                return settings.setting;
            }
            return { aiModel: '', aiPrompt: '' };
        } catch (error) {
            console.log('No summary detail AI setting found or error loading:', error);
            return { aiModel: '', aiPrompt: '' };
        }
    };


    // Handle AI summary detail generation for single record
    const generateSummaryDetailForRecord = async (record) => {
        // Lấy tất cả các thông tin cần thiết
        const id = record.id || '';
        const cid = record.cid || '';
        const title = record.title || '';
        const summary = record.summary || '';
        const detail = record.detail || '';

        // Kiểm tra có detail không
        if (!detail || detail.trim() === '') {
            throw new Error('Không có nội dung detail để tạo summaryDetail');
        }

        // Tạo prompt với tất cả thông tin
        const promptData = {
            ID: id,
            CID: cid,
            Title: title,
            Summary: summary,
            Details: detail
        };

        // Chuyển thành JSON string để gửi cho AI
        const prompt = JSON.stringify(promptData, null, 2);

        // Load setting mới nhất trước khi gọi AI
        const currentSetting = await loadSummaryDetailAiSetting();
        if (!currentSetting.aiModel || !currentSetting.aiPrompt) {
            throw new Error('Vui lòng cài đặt AI tóm tắt detail trong "Cài đặt Prompt" trước!');
        }

        // Gọi AI
        const aiResponse = await aiGen(
            prompt,
            currentSetting.aiPrompt,
            currentSetting.aiModel
        );

        if (!aiResponse || !aiResponse.result) {
            throw new Error('AI không trả về kết quả hợp lệ');
        }

        const summaryDetailText = aiResponse.result || aiResponse.answer || aiResponse.content || '';

        // Lưu vào summaryDetail - API trả về record đầy đủ
        const updateResponse = await updateK9({
            id: record.id,
            summaryDetail: summaryDetailText,
        });

        // Update local data với record đầy đủ từ response
        const updatedRecord = updateResponse?.data || updateResponse;
        const updater = (list) => list.map(item =>
            item.id === record.id
                ? { ...item, ...updatedRecord }
                : item
        );

        setK9Data(prev => ({
            news: updater(prev.news || []),
            caseTraining: updater(prev.caseTraining || []),
            longForm: updater(prev.longForm || []),
            home: updater(prev.home || []),
        }));

        return { success: true, recordId: record.id };
    };

    // Add SummaryDetail to queue
    const addSummaryDetailToQueue = (recordId, title) => {
        const task = {
            id: `summary_${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recordId,
            title: title.length > 50 ? title.substring(0, 50) + '...' : title,
            createdAt: new Date().toISOString()
        };
        setSummaryDetailQueue(prev => [...prev, task]);
        message.success(`📝 Đã thêm "${task.title}" vào hàng đợi tạo SummaryDetail!`);
        return task;
    };

    // Process SummaryDetail queue
    const processSummaryDetailQueue = async () => {
        if (summaryDetailQueue.length === 0 || processingSummaryDetailQueue) {
            return;
        }

        setProcessingSummaryDetailQueue(true);
        setSummaryDetailQueueResults([]);
        const queue = [...summaryDetailQueue];

        for (let i = 0; i < queue.length; i++) {
            if (shouldStopRef.current) {
                message.info('Đã dừng quá trình tạo SummaryDetail');
                setProcessingSummaryDetailQueue(false);
                setCurrentSummaryDetailProcessing(null);
                setSummaryDetailQueue([]);
                break;
            }

            const task = queue[i];
            setCurrentSummaryDetailProcessing(task);
            setSummaryDetailQueue(prev => prev.filter(item => item.id !== task.id));

            try {
                // Find record from all tabs
                let record = null;
                for (const tab of ['news', 'caseTraining', 'longForm', 'home']) {
                    const found = k9Data[tab]?.find(item => item.id === task.recordId);
                    if (found) {
                        record = found;
                        break;
                    }
                }
                if (!record) {
                    throw new Error('Không tìm thấy record');
                }

                await generateSummaryDetailForRecord(record);

                setSummaryDetailQueueResults(prev => [...prev, {
                    task,
                    status: 'success',
                    message: 'Tạo SummaryDetail thành công'
                }]);
            } catch (error) {
                console.error(`Error processing SummaryDetail for ${task.recordId}:`, error);
                setSummaryDetailQueueResults(prev => [...prev, {
                    task,
                    status: 'error',
                    message: error.message || 'Lỗi không xác định'
                }]);
            }

            setCurrentSummaryDetailProcessing(null);
        }

        setProcessingSummaryDetailQueue(false);
        if (queue.length > 0) {
            message.success(`Hoàn thành xử lý ${queue.length} task SummaryDetail`);
        }
    };

    // Auto process SummaryDetail queue
    useEffect(() => {
        if (summaryDetailQueue.length > 0 && !processingSummaryDetailQueue) {
            processSummaryDetailQueue();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [summaryDetailQueue.length, processingSummaryDetailQueue]);

    // Handle AI summary detail generation for multiple records (now uses queue)
    const handleAIGeneration = async () => {
        const currentSetting = await loadSummaryDetailAiSetting();
        if (!currentSetting.aiModel || !currentSetting.aiPrompt) {
            message.warning('Vui lòng cài đặt AI tóm tắt detail trong "Cài đặt Prompt" trước!');
            setPromptSettingsListModalVisible(true);
            return;
        }

        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để tạo summaryDetail');
            return;
        }

        const selectedRecords = filteredData.filter(item =>
            selectedRowKeys.includes(item.id) &&
            !item.summaryDetail &&
            item.detail &&
            !summaryDetailQueue.find(task => task.recordId === item.id) &&
            currentSummaryDetailProcessing?.recordId !== item.id
        );

        if (selectedRecords.length === 0) {
            message.warning('Tất cả bản ghi đã có SummaryDetail hoặc đang trong hàng đợi!');
            return;
        }

        selectedRecords.forEach(record => {
            addSummaryDetailToQueue(record.id, record.title);
        });

        setSummaryDetailQueueModalVisible(true);
        setSelectedRowKeys([]);
    };

    // Convert Excalidraw JSON to Image and upload (từ K9Management)
    const convertExcalidrawToImage = async (jsonStringArray) => {
        if (!jsonStringArray || !Array.isArray(jsonStringArray) || jsonStringArray.length === 0) {
            return [];
        }

        try {
            // Load Excalidraw export functions
            const excalidrawModule = await import('@excalidraw/excalidraw');
            const { exportToCanvas, exportToSvg } = excalidrawModule;

            if (!exportToCanvas && !exportToSvg) {
                console.warn('Excalidraw export functions not available');
                return [];
            }

            const imageUrls = [];

            for (const jsonString of jsonStringArray) {
                try {
                    const excalidrawData = JSON.parse(jsonString);
                    const elements = excalidrawData.elements || [];
                    const appState = excalidrawData.appState || { viewBackgroundColor: '#ffffff' };

                    if (!elements || elements.length === 0) {
                        continue;
                    }

                    // Try to export to Canvas first
                    let canvas = null;
                    if (exportToCanvas) {
                        let canvasResult = exportToCanvas({
                            elements,
                            appState,
                            files: excalidrawData.files || {}
                        });

                        if (canvasResult instanceof Promise) {
                            canvasResult = await canvasResult;
                        }

                        if (canvasResult instanceof HTMLCanvasElement) {
                            canvas = canvasResult;
                        }
                    }

                    // Fallback to SVG if canvas not available
                    if (!canvas && exportToSvg) {
                        let svgResult = exportToSvg({
                            elements,
                            appState,
                            files: excalidrawData.files || {}
                        });

                        if (svgResult instanceof Promise) {
                            svgResult = await svgResult;
                        }

                        if (svgResult instanceof SVGElement) {
                            const svgString = new XMLSerializer().serializeToString(svgResult);
                            const img = new Image();
                            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                            const url = URL.createObjectURL(svgBlob);

                            canvas = await new Promise((resolve, reject) => {
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.width || 800;
                                    canvas.height = img.height || 600;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0);
                                    URL.revokeObjectURL(url);
                                    resolve(canvas);
                                };
                                img.onerror = reject;
                                img.src = url;
                            });
                        }
                    }

                    if (!canvas) {
                        console.warn('Could not convert Excalidraw to canvas');
                        continue;
                    }

                    // Convert Canvas to Blob (PNG)
                    const blob = await new Promise((resolve) => {
                        canvas.toBlob((blob) => {
                            resolve(blob);
                        }, 'image/png', 1.0);
                    });

                    if (!blob) {
                        continue;
                    }

                    // Convert Blob to File
                    const file = new File([blob], `excalidraw-${Date.now()}.png`, { type: 'image/png' });

                    // Upload to server
                    const response = await uploadFiles([file]);
                    const url = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';

                    if (url) {
                        imageUrls.push(url);
                    }
                } catch (error) {
                    console.error('Error converting Excalidraw to image:', error);
                }
            }

            return imageUrls;
        } catch (error) {
            console.error('Error in convertExcalidrawToImage:', error);
            return [];
        }
    };

    // Add HTML to queue with prompt config
    const addHtmlToQueue = (recordId, title, promptConfig = null) => {
        const task = {
            id: `html_${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recordId,
            title: title.length > 50 ? title.substring(0, 50) + '...' : title,
            promptConfig: promptConfig,
            createdAt: new Date().toISOString()
        };
        setHtmlQueue(prev => [...prev, task]);
        message.success(`📝 Đã thêm "${task.title}" vào hàng đợi tạo HTML!`);
        return task;
    };

    // Add Excalidraw to queue with prompt config
    const addExcalidrawToQueue = (recordId, title, promptConfig = null) => {
        const task = {
            id: `excalidraw_${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recordId,
            title: title.length > 50 ? title.substring(0, 50) + '...' : title,
            promptConfig: promptConfig,
            createdAt: new Date().toISOString()
        };
        setExcalidrawQueue(prev => [...prev, task]);
        message.success(`🎨 Đã thêm "${task.title}" vào hàng đợi tạo Excalidraw!`);
        return task;
    };


    // Process HTML queue
    const processHtmlQueue = async () => {
        if (htmlQueue.length === 0 || processingHtmlQueue) {
            return;
        }

        setProcessingHtmlQueue(true);
        setHtmlQueueResults([]);
        const queue = [...htmlQueue];

        for (let i = 0; i < queue.length; i++) {
            if (shouldStopRef.current) {
                message.info('Đã dừng quá trình tạo HTML');
                setProcessingHtmlQueue(false);
                setCurrentHtmlProcessing(null);
                setHtmlQueue([]);
                break;
            }

            const task = queue[i];
            setCurrentHtmlProcessing(task);
            setHtmlQueue(prev => prev.filter(item => item.id !== task.id));

            try {
                // Find record from all tabs
                let record = null;
                for (const tab of ['news', 'caseTraining', 'longForm', 'home']) {
                    const found = k9Data[tab]?.find(item => item.id === task.recordId);
                    if (found) {
                        record = found;
                        break;
                    }
                }
                if (!record) {
                    throw new Error('Không tìm thấy record');
                }

                await generateHtmlFromSummaryDetailForRecord(record, task.promptConfig);

                setHtmlQueueResults(prev => [...prev, {
                    task,
                    status: 'success',
                    message: 'Tạo HTML thành công'
                }]);
            } catch (error) {
                console.error(`Error processing HTML for ${task.recordId}:`, error);
                setHtmlQueueResults(prev => [...prev, {
                    task,
                    status: 'error',
                    message: error.message || 'Lỗi không xác định'
                }]);
            }

            setCurrentHtmlProcessing(null);
        }

        setProcessingHtmlQueue(false);
        if (htmlQueue.length > 0) {
            message.success(`Hoàn thành xử lý ${queue.length} task HTML`);
        }
    };

    // Process Excalidraw queue
    const processExcalidrawQueue = async () => {
        if (excalidrawQueue.length === 0 || processingExcalidrawQueue) {
            return;
        }

        setProcessingExcalidrawQueue(true);
        setExcalidrawQueueResults([]);
        const queue = [...excalidrawQueue];

        for (let i = 0; i < queue.length; i++) {
            if (shouldStopRef.current) {
                message.info('Đã dừng quá trình tạo Excalidraw');
                setProcessingExcalidrawQueue(false);
                setCurrentExcalidrawProcessing(null);
                setExcalidrawQueue([]);
                break;
            }

            const task = queue[i];
            setCurrentExcalidrawProcessing(task);
            setExcalidrawQueue(prev => prev.filter(item => item.id !== task.id));

            try {
                // Find record from all tabs
                let record = null;
                for (const tab of ['news', 'caseTraining', 'longForm', 'home']) {
                    const found = k9Data[tab]?.find(item => item.id === task.recordId);
                    if (found) {
                        record = found;
                        break;
                    }
                }
                if (!record) {
                    throw new Error('Không tìm thấy record');
                }

                await generateExcalidrawFromSummaryDetailForRecord(record, task.promptConfig);

                setExcalidrawQueueResults(prev => [...prev, {
                    task,
                    status: 'success',
                    message: 'Tạo Excalidraw thành công'
                }]);
            } catch (error) {
                console.error(`Error processing Excalidraw for ${task.recordId}:`, error);
                setExcalidrawQueueResults(prev => [...prev, {
                    task,
                    status: 'error',
                    message: error.message || 'Lỗi không xác định'
                }]);
            }

            setCurrentExcalidrawProcessing(null);
        }

        setProcessingExcalidrawQueue(false);
        if (excalidrawQueue.length > 0) {
            message.success(`Hoàn thành xử lý ${queue.length} task Excalidraw`);
        }
    };

    // Auto process queues
    useEffect(() => {
        if (htmlQueue.length > 0 && !processingHtmlQueue) {
            processHtmlQueue();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [htmlQueue.length, processingHtmlQueue]);

    useEffect(() => {
        if (excalidrawQueue.length > 0 && !processingExcalidrawQueue) {
            processExcalidrawQueue();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [excalidrawQueue.length, processingExcalidrawQueue]);


    // Generate HTML from summaryDetail for single record (extracted from handleCreateHtmlFromSummaryDetail)
    const generateHtmlFromSummaryDetailForRecord = async (record, promptConfig = null) => {
        if (!record.summaryDetail || record.summaryDetail.trim() === '') {
            throw new Error('Không có summaryDetail để tạo HTML!');
        }

        if (record.diagramHtmlCodeFromSummaryDetail && record.diagramHtmlCodeFromSummaryDetail.length > 0) {
            throw new Error('Record này đã có HTML code từ summaryDetail');
        }

        // Use prompt from task
        const aiPrompt = promptConfig?.aiPrompt;
        const aiModel = promptConfig?.aiModel;

        if (!aiModel || !aiPrompt) {
            throw new Error('Vui lòng chọn cài đặt prompt trước!');
        }

        message.info(`🔄 Đang tạo HTML code từ summaryDetail cho: ${record.title}${promptConfig ? ` (Cài đặt: ${promptConfig.name})` : ''}`);

        const aiResult = await aiGen(
            record.summaryDetail,
            aiPrompt,
            aiModel
        );

        if (!aiResult || !aiResult.result || aiResult.result.trim() === '') {
            throw new Error('AI không tạo được HTML code');
        }

        const htmlCode = aiResult.result;

        const updateData = {
            id: record.id,
            diagramHtmlCodeFromSummaryDetail: htmlCode,
            showHtml: true // Mặc định bật hiển thị khi tạo mới
        };

        // API trả về record đầy đủ
        const updateResponse = await updateK9(updateData);

        // Update local data với record đầy đủ từ response
        const updatedRecord = updateResponse?.data || updateResponse;
        const updater = (list) => list.map(item =>
            item.id === record.id ? { ...item, ...updatedRecord } : item
        );

        setK9Data(prev => ({
            news: updater(prev.news || []),
            caseTraining: updater(prev.caseTraining || []),
            longForm: updater(prev.longForm || []),
            home: updater(prev.home || []),
        }));

        message.success(`✅ Tạo HTML code từ summaryDetail thành công cho "${record.title}"!`);
    };

    // Generate Excalidraw from summaryDetail for single record (extracted from handleCreateExcalidrawFromSummaryDetail)
    const generateExcalidrawFromSummaryDetailForRecord = async (record, promptConfig = null) => {
        if (!record.summaryDetail || record.summaryDetail.trim() === '') {
            throw new Error('Không có summaryDetail để tạo Excalidraw diagram!');
        }

        if (record.diagramExcalidrawJson && record.diagramExcalidrawJson.length > 0) {
            throw new Error('Record này đã có Excalidraw diagram');
        }

        // Use prompt from task
        const aiPrompt = promptConfig?.aiPrompt;
        const aiModel = promptConfig?.aiModel;
        const notePrompt = promptConfig?.notePrompt;
        const noteModel = promptConfig?.noteModel;

        if (!aiModel || !aiPrompt) {
            throw new Error('Vui lòng chọn cài đặt prompt trước!');
        }

        const quantity = promptConfig?.quantity || 1;
        message.info(`🔄 Đang tạo ${quantity} Excalidraw diagram từ summaryDetail cho: ${record.title}${promptConfig ? ` (Cài đặt: ${promptConfig.name})` : ''}`);

        const allDiagramResults = [];
        const allDiagramNotes = [];
        let allDiagramImageUrls = [];

        for (let j = 0; j < quantity; j++) {
            message.info(`🔄 Đang tạo Excalidraw diagram ${j + 1}/${quantity} cho: ${record.title}`);

            const aiResult = await aiGen(
                `Nội dung cần tạo diagram:\n${record.summaryDetail}`,
                aiPrompt,
                aiModel
            );

            let excalidrawJson;
            try {
                excalidrawJson = JSON.parse(aiResult.result);
            } catch (parseError) {
                excalidrawJson = extractJsonFromMarkdown(aiResult.result);
                if (!excalidrawJson) {
                    throw new Error(`AI không tạo được Excalidraw JSON hợp lệ. Lỗi parse: ${parseError.message}`);
                }
            }

            if (!validateExcalidrawJson(excalidrawJson)) {
                throw new Error(`Excalidraw JSON không hợp lệ cho diagram ${j + 1}`);
            }

            const normalizedJson = normalizeExcalidrawJson(excalidrawJson);
            allDiagramResults.push(JSON.stringify(normalizedJson));

            if (notePrompt && noteModel) {
                try {
                    const noteResult = await aiGen(
                        record.summaryDetail,
                        notePrompt,
                        noteModel
                    );
                    if (noteResult && noteResult.result) {
                        allDiagramNotes.push(noteResult.result);
                    }
                } catch (noteError) {
                    console.warn('Error creating note:', noteError);
                }
            }

            if (j < quantity - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (allDiagramResults.length > 0) {
            try {
                message.loading('Đang tạo ảnh từ Excalidraw...');
                const imageUrls = await convertExcalidrawToImage(allDiagramResults);
                if (imageUrls && imageUrls.length > 0) {
                    allDiagramImageUrls = imageUrls;
                    message.success(`Đã tạo và upload ${imageUrls.length} ảnh từ Excalidraw!`);
                }
            } catch (imageError) {
                console.error('Error converting Excalidraw to images:', imageError);
                message.warning('Không thể tạo ảnh từ Excalidraw, nhưng đã lưu JSON');
            }
        }

        // Đảm bảo số lượng note khớp với số lượng diagram
        // Nếu thiếu note thì thêm chuỗi rỗng
        while (allDiagramNotes.length < allDiagramResults.length) {
            allDiagramNotes.push('');
        }

        const updateData = {
            id: record.id,
            diagramExcalidrawJson: allDiagramResults,
            diagramExcalidrawNote: allDiagramNotes, // Lưu thành mảng
            diagramExcalidrawImageUrls: allDiagramImageUrls.length > 0 ? allDiagramImageUrls : null,
            showExcalidraw: true // Mặc định bật hiển thị khi tạo mới
        };

        // API trả về record đầy đủ
        const updateResponse = await updateK9(updateData);

        // Update local data với record đầy đủ từ response
        const updatedRecord = updateResponse?.data || updateResponse;
        const updater = (list) => list.map(item =>
            item.id === record.id ? { ...item, ...updatedRecord } : item
        );

        setK9Data(prev => ({
            news: updater(prev.news || []),
            caseTraining: updater(prev.caseTraining || []),
            longForm: updater(prev.longForm || []),
            home: updater(prev.home || []),
        }));

        message.success(`✅ Tạo Excalidraw diagram từ summaryDetail thành công cho "${record.title}"!`);
    };


    // Add Image to queue (tạo imageUrl từ summaryDetail) với prompt config
    const addImageToQueue = (recordId, title, promptConfig = null) => {
        const task = {
            id: `image_${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recordId,
            title: title.length > 50 ? title.substring(0, 50) + '...' : title,
            promptConfig: promptConfig,
            createdAt: new Date().toISOString()
        };
        setImageGenerationQueue(prev => [...prev, task]);
        message.success(`📸 Đã thêm "${task.title}" vào hàng đợi tạo ảnh!`);
        return task;
    };

    // Process Image queue (tạo imageUrl từ summaryDetail)
    const processImageQueue = async () => {
        if (imageGenerationQueue.length === 0 || processingImageQueue) {
            return;
        }

        setProcessingImageQueue(true);
        setImageQueueResults([]);
        const queue = [...imageGenerationQueue];

        for (let i = 0; i < queue.length; i++) {
            if (shouldStopRef.current) {
                message.info('Đã dừng quá trình tạo ảnh');
                setProcessingImageQueue(false);
                setCurrentImageProcessing(null);
                setImageGenerationQueue([]);
                break;
            }

            const task = queue[i];
            setCurrentImageProcessing(task);
            setImageGenerationQueue(prev => prev.filter(item => item.id !== task.id));

            try {
                // Find record from all tabs
                let record = null;
                for (const tab of ['news', 'caseTraining', 'longForm', 'home']) {
                    const found = k9Data[tab]?.find(item => item.id === task.recordId);
                    if (found) {
                        record = found;
                        break;
                    }
                }
                if (!record) {
                    throw new Error('Không tìm thấy record');
                }

                await generateImageFromSummaryDetailForRecord(record, task.promptConfig);

                setImageQueueResults(prev => [...prev, {
                    task,
                    status: 'success',
                    message: 'Tạo ảnh thành công'
                }]);
            } catch (error) {
                console.error(`Error processing image for ${task.recordId}:`, error);
                setImageQueueResults(prev => [...prev, {
                    task,
                    status: 'error',
                    message: error.message || 'Lỗi không xác định'
                }]);
            }

            setCurrentImageProcessing(null);
        }

        setProcessingImageQueue(false);
        if (queue.length > 0) {
            message.success(`Hoàn thành xử lý ${queue.length} task tạo ảnh`);
        }
    };

    // Auto process Image queue
    useEffect(() => {
        if (imageGenerationQueue.length > 0 && !processingImageQueue) {
            processImageQueue();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageGenerationQueue.length, processingImageQueue]);

    // Generate Image from summaryDetail for single record (tạo imageUrl JSON)
    // Sử dụng prompt từ IMAGEURL_FROM_SUMMARYDETAIL_PROMPTS (mỗi lần chọn 1 config từ list)
    const generateImageFromSummaryDetailForRecord = async (record, promptConfig = null) => {
        if (!record.summaryDetail || record.summaryDetail.trim() === '') {
            throw new Error('Không có summaryDetail để tạo ảnh!');
        }

        if (record.imgUrls && Array.isArray(record.imgUrls) && record.imgUrls.length > 0) {
            throw new Error('Record này đã có imgUrls');
        }

        // Validate prompt config từ IMAGEURL_FROM_SUMMARYDETAIL_PROMPTS
        if (!promptConfig) {
            throw new Error('Vui lòng chọn cài đặt prompt từ "ImageUrl từ SummaryDetail" trước!');
        }

        const descriptionPrompt = promptConfig.descriptionPrompt;
        const descriptionModel = promptConfig.descriptionModel;
        const imagePrompt = promptConfig.imagePrompt;
        const imageModel = promptConfig.imageModel;

        if (!descriptionPrompt || !descriptionModel || !imageModel) {
            throw new Error('Cài đặt prompt chưa đầy đủ! Vui lòng kiểm tra lại cấu hình trong "ImageUrl từ SummaryDetail".');
        }

        message.info(`🔄 Đang tạo ảnh từ summaryDetail cho: ${record.title}${promptConfig ? ` (Cài đặt: ${promptConfig.name})` : ''}`);

        // Step 1: Create English description from summaryDetail (giống K9Management)
        // Input: record.summaryDetail (thay vì record.summary)
        const englishPrompt = `${record.title}: ${record.summaryDetail}\n\n` + `\n\n⚠️ CRITICAL FORMAT REQUIREMENT - MUST BE FOLLOWED EXACTLY:

You MUST return ONLY the numbered description in the exact format. Do NOT include any headers, explanations, or additional content. Failure to follow this format will cause system parsing errors and break the image generation process.

⚠️ WARNING: Any deviation from the numbered format will result in parsing failure and system errors. Your response must start immediately with "1." and contain only the numbered description.`;

        const englishResponse = await aiGen(
            englishPrompt,
            descriptionPrompt,
            descriptionModel,
            'text'
        );

        const englishResult = englishResponse.result || englishResponse.answer || englishResponse.content || englishResponse;

        // Parse English description
        const englishLines = englishResult.split('\n');
        let englishDescription = '';

        // Find the line starting with "1."
        const startLineIndex = englishLines.findIndex(l => l.trim().startsWith('1.'));
        if (startLineIndex !== -1) {
            // Find end line index (next numbered item or end of text)
            let endLineIndex = englishLines.findIndex(l => l.trim().startsWith('2.'));
            if (endLineIndex === -1) {
                endLineIndex = englishLines.length;
            }

            // Extract all lines for this description
            const descriptionLines = englishLines.slice(startLineIndex, endLineIndex);

            // Clean and join lines
            englishDescription = descriptionLines
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .join(' ')
                .replace(/^\d+\.\s*/, '')
                .trim();
        } else {
            // Fallback: use the entire result if parsing fails
            englishDescription = englishResult;
        }

        if (!englishDescription) {
            throw new Error('Failed to parse English description');
        }

        const finalPrompt = englishDescription;

        // Step 2: Generate image using aiGen2 (dùng imagePrompt và imageModel từ config)
        message.info(`🎨 Đang tạo ảnh từ mô tả...`);
        const imageResponse = await aiGen2(
            finalPrompt,
            imagePrompt || '',
            imageModel,
            'img'
        );

        const imageResult = imageResponse.result || imageResponse.answer || imageResponse.content || imageResponse;

        if (imageResult && imageResult.image_url) {
            // Lưu trực tiếp URL ảnh vào imgUrls (mảng các object JSON)
            const imageUrlData = {
                url: imageResult.image_url,
                description: englishDescription,
            };

            // Update the record with the generated imgUrls (mảng)
            const updateData = {
                id: record.id,
                imgUrls: [imageUrlData], // Lưu dưới dạng mảng
                showImgUrls: true // Mặc định bật hiển thị khi tạo mới
            };

            // API trả về record đầy đủ
            const updateResponse = await updateK9(updateData);

            // Update local data với record đầy đủ từ response
            const updatedRecord = updateResponse?.data || updateResponse;
            const updater = (list) => list.map(item =>
                item.id === record.id ? { ...item, ...updatedRecord } : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`✅ Tạo imgUrls từ summaryDetail thành công cho "${record.title}"!`);
        } else {
            throw new Error('AI không tạo được ảnh');
        }
    };



    // Handle create Image from summaryDetail (single record - now uses queue)
    const handleCreateImageFromSummaryDetail = async (record) => {
        if (!record.summaryDetail || record.summaryDetail.trim() === '') {
            message.warning('Không có summaryDetail để tạo ảnh!');
            return;
        }

        if (record.imgUrls && Array.isArray(record.imgUrls) && record.imgUrls.length > 0) {
            message.warning('Record này đã có imgUrls. Vui lòng xóa imgUrls cũ trước khi tạo mới.');
            return;
        }

        if (imageGenerationQueue.find(task => task.recordId === record.id) || currentImageProcessing?.recordId === record.id) {
            message.warning('Record này đã có trong hàng đợi hoặc đang được xử lý!');
            return;
        }

        // Show prompt selection modal
        setPendingImageRecord(record);
        setSelectImagePromptModalVisible(true);
    };

    const handleImagePromptSelected = (prompt) => {
        setSelectImagePromptModalVisible(false);
        if (pendingImageRecord) {
            addImageToQueue(pendingImageRecord.id, pendingImageRecord.title, prompt);
        }
        setPendingImageRecord(null);
    };

    // Handle bulk create Image from summaryDetail
    const handleBulkCreateImageFromSummaryDetail = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để tạo ảnh!');
            return;
        }

        const selectedRecords = filteredData.filter(item =>
            selectedRowKeys.includes(item.id) &&
            item.summaryDetail &&
            !(item.imgUrls && Array.isArray(item.imgUrls) && item.imgUrls.length > 0) &&
            !imageGenerationQueue.find(task => task.recordId === item.id) &&
            currentImageProcessing?.recordId !== item.id
        );

           if (selectedRecords.length === 0) {
               message.warning('Tất cả bản ghi đã có imgUrls hoặc đang trong hàng đợi!');
               return;
           }

        // Show prompt selection modal
        setPendingImageRecords(selectedRecords);
        setSelectImagePromptModalVisible(true);
    };

    const handleBulkImagePromptSelected = (prompt) => {
        setSelectImagePromptModalVisible(false);
        const records = pendingImageRecords;
        records.forEach(record => {
            addImageToQueue(record.id, record.title, prompt);
        });
        setImageQueueModalVisible(true);
        setSelectedRowKeys([]);
        setPendingImageRecords([]);
        message.success(`📸 Đã thêm ${records.length} bản ghi vào hàng đợi tạo ảnh!`);
    };

    // Handle create HTML from summaryDetail (single record - now uses queue)
    const handleCreateHtmlFromSummaryDetail = async (record) => {
        if (!record.summaryDetail || record.summaryDetail.trim() === '') {
            message.warning('Không có summaryDetail để tạo HTML!');
            return;
        }

        if (record.diagramHtmlCodeFromSummaryDetail && record.diagramHtmlCodeFromSummaryDetail.length > 0) {
            message.warning('Record này đã có HTML code từ summaryDetail. Vui lòng xóa HTML cũ trước khi tạo mới.');
            return;
        }

        if (htmlQueue.find(task => task.recordId === record.id) || currentHtmlProcessing?.recordId === record.id) {
            message.warning('Record này đã có trong hàng đợi hoặc đang được xử lý!');
            return;
        }

        // Show prompt selection modal
        setPendingHtmlRecord(record);
        setSelectHtmlPromptModalVisible(true);
    };

    const handleHtmlPromptSelected = (prompt) => {
        setSelectHtmlPromptModalVisible(false);
        if (pendingHtmlRecord) {
            addHtmlToQueue(pendingHtmlRecord.id, pendingHtmlRecord.title, prompt);
        }
        setPendingHtmlRecord(null);
    };

    // Handle bulk create HTML from summaryDetail
    const handleBulkCreateHtmlFromSummaryDetail = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để tạo HTML!');
            return;
        }

        const selectedRecords = filteredData.filter(item =>
            selectedRowKeys.includes(item.id) &&
            item.summaryDetail &&
            !item.diagramHtmlCodeFromSummaryDetail &&
            !htmlQueue.find(task => task.recordId === item.id) &&
            currentHtmlProcessing?.recordId !== item.id
        );

        if (selectedRecords.length === 0) {
            message.warning('Tất cả bản ghi đã có HTML hoặc đang trong hàng đợi!');
            return;
        }

        // Show prompt selection modal
        setPendingHtmlRecords(selectedRecords);
        setSelectHtmlPromptModalVisible(true);
    };

    const handleBulkHtmlPromptSelected = (prompt) => {
        setSelectHtmlPromptModalVisible(false);
        const records = pendingHtmlRecords;
        records.forEach(record => {
            addHtmlToQueue(record.id, record.title, prompt);
        });
        setHtmlQueueModalVisible(true);
        setSelectedRowKeys([]);
        setPendingHtmlRecords([]);
        message.success(`📝 Đã thêm ${records.length} bản ghi vào hàng đợi tạo HTML!`);
    };

    // Handle create Excalidraw from summaryDetail (single record - now uses queue)
    const handleCreateExcalidrawFromSummaryDetail = async (record) => {
        if (!record.summaryDetail || record.summaryDetail.trim() === '') {
            message.warning('Không có summaryDetail để tạo Excalidraw diagram!');
            return;
        }

        if (record.diagramExcalidrawJson && record.diagramExcalidrawJson.length > 0) {
            message.warning('Record này đã có Excalidraw diagram. Vui lòng xóa diagram cũ trước khi tạo mới.');
            return;
        }

        if (excalidrawQueue.find(task => task.recordId === record.id) || currentExcalidrawProcessing?.recordId === record.id) {
            message.warning('Record này đã có trong hàng đợi hoặc đang được xử lý!');
            return;
        }

        // Show prompt selection modal
        setPendingExcalidrawRecord(record);
        setSelectExcalidrawPromptModalVisible(true);
    };

    const handleExcalidrawPromptSelected = (prompt) => {
        setSelectExcalidrawPromptModalVisible(false);
        if (pendingExcalidrawRecord) {
            addExcalidrawToQueue(pendingExcalidrawRecord.id, pendingExcalidrawRecord.title, prompt);
        }
        setPendingExcalidrawRecord(null);
    };

    // Handle bulk create Excalidraw from summaryDetail
    const handleBulkCreateExcalidrawFromSummaryDetail = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để tạo Excalidraw!');
            return;
        }

        const selectedRecords = filteredData.filter(item =>
            selectedRowKeys.includes(item.id) &&
            item.summaryDetail &&
            !item.diagramExcalidrawJson &&
            !excalidrawQueue.find(task => task.recordId === item.id) &&
            currentExcalidrawProcessing?.recordId !== item.id
        );

        if (selectedRecords.length === 0) {
            message.warning('Tất cả bản ghi đã có Excalidraw hoặc đang trong hàng đợi!');
            return;
        }

        // Show prompt selection modal
        setPendingExcalidrawRecords(selectedRecords);
        setSelectExcalidrawPromptModalVisible(true);
    };

    const handleBulkExcalidrawPromptSelected = (prompt) => {
        setSelectExcalidrawPromptModalVisible(false);
        const records = pendingExcalidrawRecords;
        records.forEach(record => {
            addExcalidrawToQueue(record.id, record.title, prompt);
        });
        setExcalidrawQueueModalVisible(true);
        setSelectedRowKeys([]);
        setPendingExcalidrawRecords([]);
        message.success(`🎨 Đã thêm ${records.length} bản ghi vào hàng đợi tạo Excalidraw!`);
    };


    // Handle diagram preview
    const handleDiagramPreview = (record, diagramType) => {
        if (diagramType === 'html') {
            // Kiểm tra HTML từ SummaryDetail (có thể là string hoặc array)
            const hasHtmlFromSummaryDetail = record.diagramHtmlCodeFromSummaryDetail &&
                (Array.isArray(record.diagramHtmlCodeFromSummaryDetail)
                    ? record.diagramHtmlCodeFromSummaryDetail.length > 0
                    : String(record.diagramHtmlCodeFromSummaryDetail).trim() !== '');

            if (!hasHtmlFromSummaryDetail) {
                message.info('Record này chưa có HTML diagram từ SummaryDetail để xem');
                return;
            }

            const htmlData = Array.isArray(record.diagramHtmlCodeFromSummaryDetail)
                ? record.diagramHtmlCodeFromSummaryDetail
                : [record.diagramHtmlCodeFromSummaryDetail];

            setSelectedDiagramData({
                type: 'html',
                title: record.title,
                data: htmlData,
                note: '',
                recordId: record.id
            });
            setDiagramPreviewModalVisible(true);
        } else if (diagramType === 'excalidraw') {
            if (!record.diagramExcalidrawJson || record.diagramExcalidrawJson.length === 0) {
                message.info('Record này chưa có Excalidraw diagram từ SummaryDetail để xem');
                return;
            }

            // diagramExcalidrawNote là mảng, cần xử lý để truyền vào preview modal
            // Preview modal expect note là string hoặc array
            const notes = Array.isArray(record.diagramExcalidrawNote)
                ? record.diagramExcalidrawNote
                : (record.diagramExcalidrawNote ? [record.diagramExcalidrawNote] : []);

            setSelectedDiagramData({
                type: 'excalidraw-react',
                title: record.title,
                data: record.diagramExcalidrawJson,
                note: notes, // Truyền mảng note
                imageUrls: record.diagramExcalidrawImageUrls || null,
                recordId: record.id
            });
            setDiagramPreviewModalVisible(true);
        }
    };

    // Handle diagram save from preview modal
    const handleDiagramSave = async (updatedData) => {
        try {
            const updateData = { id: updatedData.recordId };

            if (updatedData.type === 'html') {
                updateData.diagramHtmlCodeFromSummaryDetail = updatedData.data;
            } else if (updatedData.type === 'excalidraw-react') {
                updateData.diagramExcalidrawJson = updatedData.data;
                // Đảm bảo note là mảng
                updateData.diagramExcalidrawNote = Array.isArray(updatedData.note)
                    ? updatedData.note
                    : (updatedData.note ? [updatedData.note] : []);
                updateData.diagramExcalidrawImageUrls = updatedData.imageUrls || null;
            }

            // API trả về record đầy đủ
            const updateResponse = await updateK9(updateData);

            // Update local data với record đầy đủ từ response
            const updatedRecord = updateResponse?.data || updateResponse;
            const updater = (list) => list.map(item =>
                item.id === updatedData.recordId
                    ? { ...item, ...updatedRecord }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success('Đã lưu diagram thành công!');
        } catch (error) {
            console.error('Error saving diagram:', error);
            message.error('Lỗi khi lưu diagram!');
        }
    };

    // Handle bulk delete SummaryDetail
    const handleBulkDeleteSummaryDetail = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để xóa SummaryDetail!');
            return;
        }

        try {
            setDeletingSummaryDetail(true);
            
            // Sử dụng updateK9Bulk API
            const updateData = {
                ids: selectedRowKeys,
                fieldToUpdate: 'summaryDetail',
                value: null
            };

            await updateK9Bulk(updateData);

            // Update local data
            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? { ...item, summaryDetail: null }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã xóa SummaryDetail cho ${selectedRowKeys.length} bản ghi!`);
            setSelectedRowKeys([]);
        } catch (error) {
            console.error('Error deleting SummaryDetail:', error);
            message.error('Xóa SummaryDetail thất bại!');
        } finally {
            setDeletingSummaryDetail(false);
        }
    };

    // Handle bulk delete HTML from SummaryDetail
    const handleBulkDeleteHtmlFromSummaryDetail = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để xóa HTML từ SummaryDetail!');
            return;
        }

        try {
            setDeletingHtml(true);
            
            // Sử dụng updateK9Bulk API
            const updateData = {
                ids: selectedRowKeys,
                fieldToUpdate: 'diagramHtmlCodeFromSummaryDetail',
                value: null
            };

            await updateK9Bulk(updateData);

            // Update local data
            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? { ...item, diagramHtmlCodeFromSummaryDetail: null }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã xóa HTML từ SummaryDetail cho ${selectedRowKeys.length} bản ghi!`);
            setSelectedRowKeys([]);
        } catch (error) {
            console.error('Error deleting HTML from SummaryDetail:', error);
            message.error('Xóa HTML từ SummaryDetail thất bại!');
        } finally {
            setDeletingHtml(false);
        }
    };

    // Handle bulk delete Excalidraw from SummaryDetail
    const handleBulkDeleteExcalidrawFromSummaryDetail = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để xóa Excalidraw từ SummaryDetail!');
            return;
        }

        try {
            setDeletingExcalidraw(true);
            
            // Sử dụng updateK9Bulk API - cần xóa 3 field, gọi 3 lần
            await Promise.all([
                updateK9Bulk({
                    ids: selectedRowKeys,
                    fieldToUpdate: 'diagramExcalidrawJson',
                    value: null
                }),
                updateK9Bulk({
                    ids: selectedRowKeys,
                    fieldToUpdate: 'diagramExcalidrawNote',
                    value: null
                }),
                updateK9Bulk({
                    ids: selectedRowKeys,
                    fieldToUpdate: 'diagramExcalidrawImageUrls',
                    value: null
                })
            ]);

            // Update local data
            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? {
                        ...item,
                        diagramExcalidrawJson: null,
                        diagramExcalidrawNote: null,
                        diagramExcalidrawImageUrls: null
                    }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã xóa Excalidraw từ SummaryDetail cho ${selectedRowKeys.length} bản ghi!`);
            setSelectedRowKeys([]);
        } catch (error) {
            console.error('Error deleting Excalidraw from SummaryDetail:', error);
            message.error('Xóa Excalidraw từ SummaryDetail thất bại!');
        } finally {
            setDeletingExcalidraw(false);
        }
    };

    // Handle bulk delete ImgUrls from SummaryDetail
    const handleBulkDeleteImgUrls = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để xóa imgUrls!');
            return;
        }

        try {
            setDeletingImgUrls(true);
            
            // Sử dụng updateK9Bulk API
            const updateData = {
                ids: selectedRowKeys,
                fieldToUpdate: 'imgUrls',
                value: null
            };

            await updateK9Bulk(updateData);

            // Update local data
            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? { ...item, imgUrls: null }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã xóa imgUrls cho ${selectedRowKeys.length} bản ghi!`);
            setSelectedRowKeys([]);
        } catch (error) {
            console.error('Error deleting imgUrls:', error);
            message.error('Xóa imgUrls thất bại!');
        } finally {
            setDeletingImgUrls(false);
        }
    };


    // Handle bulk toggle showHtml
    const handleBulkToggleShowHtml = async (toggleTo) => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để cập nhật!');
            return;
        }

        try {
            setTogglingShowHtml(true);
            
            // Sử dụng updateK9Bulk API
            const updateData = {
                ids: selectedRowKeys,
                fieldToUpdate: 'showHtml',
                value: toggleTo
            };

            await updateK9Bulk(updateData);

            // Update local data
            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? { ...item, showHtml: toggleTo }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã ${toggleTo ? 'bật' : 'tắt'} hiển thị HTML cho ${selectedRowKeys.length} bản ghi!`);
        } catch (error) {
            console.error('Error toggling showHtml:', error);
            message.error('Cập nhật thất bại!');
        } finally {
            setTogglingShowHtml(false);
        }
    };

    // Handle bulk toggle showExcalidraw
    const handleBulkToggleShowExcalidraw = async (toggleTo) => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để cập nhật!');
            return;
        }

        try {
            setTogglingShowExcalidraw(true);
            
            // Sử dụng updateK9Bulk API
            const updateData = {
                ids: selectedRowKeys,
                fieldToUpdate: 'showExcalidraw',
                value: toggleTo
            };

            await updateK9Bulk(updateData);

            // Update local data
            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? { ...item, showExcalidraw: toggleTo }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã ${toggleTo ? 'bật' : 'tắt'} hiển thị Excalidraw cho ${selectedRowKeys.length} bản ghi!`);
        } catch (error) {
            console.error('Error toggling showExcalidraw:', error);
            message.error('Cập nhật thất bại!');
        } finally {
            setTogglingShowExcalidraw(false);
        }
    };

    // Handle bulk toggle showImgUrls
    const handleBulkToggleShowImgUrls = async (toggleTo) => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để cập nhật!');
            return;
        }

        try {
            setTogglingShowImgUrls(true);
            
            // Sử dụng updateK9Bulk API
            const updateData = {
                ids: selectedRowKeys,
                fieldToUpdate: 'showImgUrls',
                value: toggleTo
            };

            await updateK9Bulk(updateData);

            // Update local data
            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? { ...item, showImgUrls: toggleTo }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã ${toggleTo ? 'bật' : 'tắt'} hiển thị imgUrls cho ${selectedRowKeys.length} bản ghi!`);
        } catch (error) {
            console.error('Error toggling showImgUrls:', error);
            message.error('Cập nhật thất bại!');
        } finally {
            setTogglingShowImgUrls(false);
        }
    };

    useEffect(() => {
        loadK9Data();
    }, []);

    // Memoize current tab data to avoid unnecessary recalculations
    const currentTabData = useMemo(() => {
        if (activeTab && k9Data[activeTab] && Array.isArray(k9Data[activeTab])) {
            return k9Data[activeTab];
        }
        return [];
    }, [activeTab, k9Data.news, k9Data.caseTraining, k9Data.longForm, k9Data.home]);

    // Reset to page 1 when tab, search, or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchText, summaryDetailFilter, diagramHtmlFilter, diagramExcalidrawFilter, imgUrlsFilter]);

    // Optimize filter with useMemo
    const filteredData = useMemo(() => {
        let data = [...currentTabData];

        // Filter by summaryDetail status (has/none)
        if (summaryDetailFilter === 'has') {
            data = data.filter(item => item.summaryDetail && item.summaryDetail.trim());
        } else if (summaryDetailFilter === 'none') {
            data = data.filter(item => !item.summaryDetail || !item.summaryDetail.trim());
        }

        // Filter by diagramHtml status (has/none)
        if (diagramHtmlFilter === 'has') {
            data = data.filter(item => {
                const hasHtml = item.diagramHtmlCodeFromSummaryDetail &&
                    (Array.isArray(item.diagramHtmlCodeFromSummaryDetail)
                        ? item.diagramHtmlCodeFromSummaryDetail.length > 0
                        : String(item.diagramHtmlCodeFromSummaryDetail).trim() !== '');
                return hasHtml;
            });
        } else if (diagramHtmlFilter === 'none') {
            data = data.filter(item => {
                const hasHtml = item.diagramHtmlCodeFromSummaryDetail &&
                    (Array.isArray(item.diagramHtmlCodeFromSummaryDetail)
                        ? item.diagramHtmlCodeFromSummaryDetail.length > 0
                        : String(item.diagramHtmlCodeFromSummaryDetail).trim() !== '');
                return !hasHtml;
            });
        }

        // Filter by diagramExcalidraw status (has/none)
        if (diagramExcalidrawFilter === 'has') {
            data = data.filter(item => item.diagramExcalidrawJson && item.diagramExcalidrawJson.length > 0);
        } else if (diagramExcalidrawFilter === 'none') {
            data = data.filter(item => !item.diagramExcalidrawJson || item.diagramExcalidrawJson.length === 0);
        }

        // Filter by imgUrls status (has/none)
        if (imgUrlsFilter === 'has') {
            data = data.filter(item => item.imgUrls && Array.isArray(item.imgUrls) && item.imgUrls.length > 0);
        } else if (imgUrlsFilter === 'none') {
            data = data.filter(item => !item.imgUrls || !Array.isArray(item.imgUrls) || item.imgUrls.length === 0);
        }

        // Filter by general search text
        if (searchText.trim()) {
            const searchLower = searchText.toLowerCase();
            data = data.filter(item => {
                const id = String(item.id || '').toLowerCase();
                const cid = String(item.cid || '').toLowerCase();
                const title = String(item.title || '').toLowerCase();
                const summary = String(item.summary || '').toLowerCase();
                const detail = String(item.detail || '').toLowerCase();

                return id.includes(searchLower) ||
                    cid.includes(searchLower) ||
                    title.includes(searchLower) ||
                    summary.includes(searchLower) ||
                    detail.includes(searchLower);
            });
        }

        return data;
    }, [searchText, summaryDetailFilter, diagramHtmlFilter, diagramExcalidrawFilter, imgUrlsFilter, currentTabData]);

    const renderDetail = useCallback((text, record) => {
        if (!text) return '-';
        const detailText = String(text);
        const tooltipText = detailText.length > 200 ? detailText.substring(0, 200) + '...' : detailText;
        return (
            <Tooltip placement="topLeft" title={tooltipText} mouseEnterDelay={0.5}>
                <div

                    style={{
                        whiteSpace: 'pre-wrap',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        wordBreak: 'break-word',
                        cursor: 'pointer',
                        color: '#c41a16'
                    }}
                    onClick={() => {
                        setSelectedDetailRecord(record);
                        setDetailModalVisible(true);
                    }}
                >
                    {detailText}
                </div>
            </Tooltip>
        );
    }, []);

    const renderSummaryDetail = useCallback((text, record) => {
        if (!text) return '-';
        const summaryDetailText = String(text);
        const tooltipText = summaryDetailText.length > 200 ? summaryDetailText.substring(0, 200) + '...' : summaryDetailText;
        return (
            <Tooltip placement="topLeft" title={tooltipText} mouseEnterDelay={0.5}>
                <div
                    style={{
                        whiteSpace: 'pre-wrap',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        wordBreak: 'break-word',
                        color: 'orange',
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        setSelectedSummaryDetailRecord(record);
                        setSummaryDetailModalVisible(true);
                    }}
                >
                    {summaryDetailText}
                </div>
            </Tooltip>
        );
    }, []);

    const renderAction = useCallback((_, record) => {
        const isHtmlInQueue = htmlQueue.find(task => task.recordId === record.id);
        const isExcalidrawInQueue = excalidrawQueue.find(task => task.recordId === record.id);
        const isImageInQueue = imageGenerationQueue.find(task => task.recordId === record.id);
        const isHtmlProcessing = currentHtmlProcessing?.recordId === record.id;
        const isExcalidrawProcessing = currentExcalidrawProcessing?.recordId === record.id;
        const isImageProcessing = currentImageProcessing?.recordId === record.id;
        const hasHtml = record.diagramHtmlCodeFromSummaryDetail;
        const hasExcalidraw = record.diagramExcalidrawJson && record.diagramExcalidrawJson.length > 0;
        const hasImageUrl = record.imgUrls && Array.isArray(record.imgUrls) && record.imgUrls.length > 0;

        return (
            <Space>
                {record.detail && (
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            setSelectedDetailRecord(record);
                            setDetailModalVisible(true);
                        }}
                        style={{ color: '#c41a16' }}
                    >
                        Detail
                    </Button>
                )}
                {record.summaryDetail && (
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            setSelectedSummaryDetailRecord(record);
                            setSummaryDetailModalVisible(true);
                        }}
                        style={{ color: 'orange' }}
                    >
                        SummaryDetail
                    </Button>
                )}

                <Tooltip title={
                    hasHtml ? 'Đã có HTML từ summaryDetail' :
                        isHtmlProcessing ? 'Đang tạo HTML' :
                            isHtmlInQueue ? 'Đang trong hàng đợi' :
                                'Tạo HTML từ SummaryDetail'
                }>
                    <Button
                        type="link"
                        size="small"
                        icon={<FileTextOutlined />}
                        onClick={() => handleCreateHtmlFromSummaryDetail(record)}
                        loading={isHtmlProcessing}
                        disabled={!!hasHtml || isHtmlProcessing || !!isHtmlInQueue}
                        style={{
                            color: hasHtml ? '#52c41a' :
                                isHtmlProcessing || isHtmlInQueue ? '#1890ff' : '#1890ff'
                        }}
                    >
                        HTML
                    </Button>
                </Tooltip>
                <Tooltip title={
                    hasExcalidraw ? 'Đã có Excalidraw' :
                    isExcalidrawProcessing ? 'Đang tạo Excalidraw' :
                    isExcalidrawInQueue ? 'Đang trong hàng đợi' :
                    'Tạo Excalidraw từ SummaryDetail'
                }>
                    <Button
                        type="link"
                        size="small"
                        icon={<PictureOutlined />}
                        onClick={() => handleCreateExcalidrawFromSummaryDetail(record)}
                        loading={isExcalidrawProcessing}
                        disabled={!!hasExcalidraw || isExcalidrawProcessing || !!isExcalidrawInQueue}
                        style={{
                            color: hasExcalidraw ? '#52c41a' :
                                isExcalidrawProcessing || isExcalidrawInQueue ? '#1890ff' : '#1890ff'
                        }}
                    >
                        Excalidraw
                    </Button>
                </Tooltip>
                <Tooltip title={
                    hasImageUrl ? 'Đã có ảnh từ summaryDetail' :
                    isImageProcessing ? 'Đang tạo ảnh' :
                    isImageInQueue ? 'Đang trong hàng đợi' :
                    'Tạo ảnh từ SummaryDetail'
                }>
                    <Button
                        type="link"
                        size="small"
                        icon={<FileImageOutlined />}
                        onClick={() => handleCreateImageFromSummaryDetail(record)}
                        loading={isImageProcessing}
                        disabled={!!hasImageUrl || isImageProcessing || !!isImageInQueue}
                        style={{
                            color: hasImageUrl ? '#52c41a' :
                                isImageProcessing || isImageInQueue ? '#1890ff' : '#1890ff'
                        }}
                    >
                        Ảnh
                    </Button>
                </Tooltip>
            </Space>
        );
    }, [htmlQueue, excalidrawQueue, imageGenerationQueue, currentHtmlProcessing, currentExcalidrawProcessing, currentImageProcessing, handleCreateImageFromSummaryDetail, handleDiagramPreview]);

    // Memoize columns to prevent table re-render on every component update
    const columns = useMemo(() => [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            fixed: 'left',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'CID',
            dataIndex: 'cid',
            key: 'cid',
            width: 100,
            render: (cid) => cid ? <Tag color="blue">{cid}</Tag> : '-',
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: 300,
            ellipsis: {
                showTitle: false,
            },
        },
        {
            title: 'Summary',
            dataIndex: 'summary',
            key: 'summary',
            width: 300,
            ellipsis: {
                showTitle: false,
            },
            render: (text) => text ? String(text).substring(0, 100) + (String(text).length > 100 ? '...' : '') : '-',
        },
        {
            title: 'Detail',
            dataIndex: 'detail',
            key: 'detail',
            width: 400,
            ellipsis: {
                showTitle: false,
            },
            render: (text, record) => renderDetail(text, record),
        },
        {
            title: 'SummaryDetail',
            dataIndex: 'summaryDetail',
            key: 'summaryDetail',
            width: 400,
            ellipsis: {
                showTitle: false,
            },
            render: (text, record) => renderSummaryDetail(text, record),
        },
        {
            title: <span style={{ color: 'green', fontWeight: 'bold' }}>Diagram HTML</span>,
            key: 'diagramHtml',
            width: 90,
            render: (_, record) => {
                // Kiểm tra diagramHtmlCodeFromSummaryDetail (có thể là string hoặc array)
                const hasHtml = record.diagramHtmlCodeFromSummaryDetail &&
                    (Array.isArray(record.diagramHtmlCodeFromSummaryDetail)
                        ? record.diagramHtmlCodeFromSummaryDetail.length > 0
                        : record.diagramHtmlCodeFromSummaryDetail.trim() !== '');

                if (hasHtml) {
                    return (
                        <div
                            onClick={() => handleDiagramPreview(record, 'html')}
                            style={{
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f6ffed',
                                borderRadius: '4px',
                                border: '1px solid #b7eb8f',
                                cursor: 'pointer'
                            }}
                            title="Diagram HTML từ SummaryDetail"
                        >
                            <FileTextOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                        </div>
                    );
                }

                // Hiển thị icon trống nếu không có
                return (
                    <div style={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px'
                    }}
                        title="Chưa tạo diagram HTML từ SummaryDetail"
                    >
                        <FileTextOutlined style={{ fontSize: '16px', color: '#999' }} />
                    </div>
                );
            }
        },
        {
            title: <span style={{ color: '#722ed1', fontWeight: 'bold' }}>Diagram Excalidraw</span>,
            key: 'diagramExcalidraw',
            width: 110,
            render: (_, record) => {
                // Hiển thị icon Excalidraw React nếu có diagramExcalidrawJson
                if (record.diagramExcalidrawJson && record.diagramExcalidrawJson.length > 0) {
                    return (
                        <div
                            onClick={() => handleDiagramPreview(record, 'excalidraw')}
                            style={{
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f9f0ff',
                                borderRadius: '4px',
                                border: '1px solid #d3adf7',
                                cursor: 'pointer'
                            }}
                            title="Diagram Excalidraw React từ SummaryDetail"
                        >
                            <PictureOutlined style={{ fontSize: '16px', color: '#722ed1' }} />
                        </div>
                    );
                }
                return (
                    <div style={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px'
                    }}
                        title="Chưa tạo diagram Excalidraw từ SummaryDetail"
                    >
                        <PictureOutlined style={{ fontSize: '16px', color: '#999' }} />
                    </div>
                );
            }
        },
        {
            title: <span style={{ color: '#1890ff', fontWeight: 'bold' }}>imgUrls</span>,
            key: 'imgUrls',
            width: 100,
            render: (_, record) => {
                // Kiểm tra imgUrls (là mảng các object JSON)
                const hasImageUrl = record.imgUrls && Array.isArray(record.imgUrls) && record.imgUrls.length > 0;

                if (hasImageUrl) {
                    // Lấy ảnh đầu tiên để hiển thị thumbnail
                    const firstImage = record.imgUrls[0];
                    const thumbnailUrl = typeof firstImage === 'string' ? firstImage : (firstImage?.url || firstImage?.image_url || '');
                    
                    return (
                        <div
                            onClick={() => {
                                setPreviewingRecord(record);
                                setImgUrlsPreviewModalVisible(true);
                            }}
                            style={{
                                width: 50,
                                height: 50,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#e6f7ff',
                                borderRadius: '8px',
                                border: '2px solid #91d5ff',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                position: 'relative',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                            title={`imgUrls từ SummaryDetail (${record.imgUrls.length} ảnh) - Click để xem`}
                        >
                            {thumbnailUrl ? (
                                <img
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '6px'
                                    }}
                                />
                            ) : (
                                <FileImageOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                            )}
                            {record.imgUrls.length > 1 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    backgroundColor: '#ff4d4f',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    border: '2px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    {record.imgUrls.length}
                                </div>
                            )}
                        </div>
                    );
                }
                return (
                    <div style={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px'
                    }}
                        title="Chưa tạo imgUrls từ SummaryDetail"
                    >
                        <FileImageOutlined style={{ fontSize: '16px', color: '#999' }} />
                    </div>
                );
            }
        },
        {
            title: <span style={{ fontSize: '12px' }}>Hiển thị HTML</span>,
            key: 'showHtml',
            width: 110,
            render: (_, record) => {
                // Check cả diagramHtmlCode và diagramHtmlCodeFromSummaryDetail
                const hasHtml = (record.diagramHtmlCode && Array.isArray(record.diagramHtmlCode) && record.diagramHtmlCode.length > 0) ||
                    (record.diagramHtmlCodeFromSummaryDetail &&
                        (Array.isArray(record.diagramHtmlCodeFromSummaryDetail)
                            ? record.diagramHtmlCodeFromSummaryDetail.length > 0
                            : String(record.diagramHtmlCodeFromSummaryDetail).trim() !== ''));
                
                return (
                    <Switch
                        checked={record.showHtml !== false} // Default true nếu không có giá trị
                        disabled={!hasHtml}
                        onChange={async (checked) => {
                            try {
                                const updateData = {
                                    id: record.id,
                                    showHtml: checked
                                };
                                const updateResponse = await updateK9(updateData);
                                const updatedRecord = updateResponse?.data || updateResponse;
                                const updater = (list) => list.map(item =>
                                    item.id === record.id ? { ...item, ...updatedRecord } : item
                                );
                                setK9Data(prev => ({
                                    news: updater(prev.news || []),
                                    caseTraining: updater(prev.caseTraining || []),
                                    longForm: updater(prev.longForm || []),
                                    home: updater(prev.home || []),
                                }));
                                message.success(`Đã ${checked ? 'bật' : 'tắt'} hiển thị HTML`);
                            } catch (error) {
                                console.error('Error updating showHtml:', error);
                                message.error('Cập nhật thất bại!');
                            }
                        }}
                        size="small"
                    />
                );
            }
        },
        {
            title: <span style={{ fontSize: '12px' }}>Hiển thị Excalidraw</span>,
            key: 'showExcalidraw',
            width: 130,
            render: (_, record) => {
                const hasExcalidraw = record.diagramExcalidrawJson && record.diagramExcalidrawJson.length > 0;
                
                return (
                    <Switch
                        checked={record.showExcalidraw !== false} // Default true nếu không có giá trị
                        disabled={!hasExcalidraw}
                        onChange={async (checked) => {
                            try {
                                const updateData = {
                                    id: record.id,
                                    showExcalidraw: checked
                                };
                                const updateResponse = await updateK9(updateData);
                                const updatedRecord = updateResponse?.data || updateResponse;
                                const updater = (list) => list.map(item =>
                                    item.id === record.id ? { ...item, ...updatedRecord } : item
                                );
                                setK9Data(prev => ({
                                    news: updater(prev.news || []),
                                    caseTraining: updater(prev.caseTraining || []),
                                    longForm: updater(prev.longForm || []),
                                    home: updater(prev.home || []),
                                }));
                                message.success(`Đã ${checked ? 'bật' : 'tắt'} hiển thị Excalidraw`);
                            } catch (error) {
                                console.error('Error updating showExcalidraw:', error);
                                message.error('Cập nhật thất bại!');
                            }
                        }}
                        size="small"
                    />
                );
            }
        },
        {
            title: <span style={{ fontSize: '12px' }}>Hiển thị imgUrls</span>,
            key: 'showImgUrls',
            width: 120,
            render: (_, record) => {
                const hasImgUrls = record.imgUrls && Array.isArray(record.imgUrls) && record.imgUrls.length > 0;
                
                return (
                    <Switch
                        checked={record.showImgUrls !== false} // Default true nếu không có giá trị
                        disabled={!hasImgUrls}
                        onChange={async (checked) => {
                            try {
                                const updateData = {
                                    id: record.id,
                                    showImgUrls: checked
                                };
                                const updateResponse = await updateK9(updateData);
                                const updatedRecord = updateResponse?.data || updateResponse;
                                const updater = (list) => list.map(item =>
                                    item.id === record.id ? { ...item, ...updatedRecord } : item
                                );
                                setK9Data(prev => ({
                                    news: updater(prev.news || []),
                                    caseTraining: updater(prev.caseTraining || []),
                                    longForm: updater(prev.longForm || []),
                                    home: updater(prev.home || []),
                                }));
                                message.success(`Đã ${checked ? 'bật' : 'tắt'} hiển thị imgUrls`);
                            } catch (error) {
                                console.error('Error updating showImgUrls:', error);
                                message.error('Cập nhật thất bại!');
                            }
                        }}
                        size="small"
                    />
                );
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 520,
            fixed: 'right',
            render: renderAction,
        },
    ], [renderDetail, renderSummaryDetail, renderAction]);

    return (
        <div style={{ padding: '24px', maxWidth: '100%', margin: '0 auto', }}>
            <Card>
                {/* Row 1: Title, Search, Settings */}
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Button
                            type="default"
                            icon={<HomeOutlined />}
                            onClick={() => navigate('/home')}
                            size="small"
                        >
                            Về trang chủ
                        </Button>
                        <h2 style={{ marginBottom: 0, margin: 0, fontSize: '18px' }}>AI Tạo SummaryDetail</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Input
                            placeholder="Tìm kiếm ID, CID, Title, Summary, Detail..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: '260px' }}
                            allowClear
                            size="small"
                        />
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>Lọc SummaryDetail:</span>
                        <Select
                            value={summaryDetailFilter}
                            onChange={setSummaryDetailFilter}
                            style={{ width: 140 }}
                            size="small"
                        >
                            <Select.Option value="all">Tất cả</Select.Option>
                            <Select.Option value="has">Đã có</Select.Option>
                            <Select.Option value="none">Chưa có</Select.Option>
                        </Select>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>Lọc DiagramHtml:</span>
                        <Select
                            value={diagramHtmlFilter}
                            onChange={setDiagramHtmlFilter}
                            style={{ width: 140 }}
                            size="small"
                        >
                            <Select.Option value="all">Tất cả</Select.Option>
                            <Select.Option value="has">Đã có</Select.Option>
                            <Select.Option value="none">Chưa có</Select.Option>
                        </Select>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>Lọc DiagramExcalidraw:</span>
                        <Select
                            value={diagramExcalidrawFilter}
                            onChange={setDiagramExcalidrawFilter}
                            style={{ width: 140 }}
                            size="small"
                        >
                            <Select.Option value="all">Tất cả</Select.Option>
                            <Select.Option value="has">Đã có</Select.Option>
                            <Select.Option value="none">Chưa có</Select.Option>
                        </Select>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>Lọc ImgUrls:</span>
                        <Select
                            value={imgUrlsFilter}
                            onChange={setImgUrlsFilter}
                            style={{ width: 140 }}
                            size="small"
                        >
                            <Select.Option value="all">Tất cả</Select.Option>
                            <Select.Option value="has">Đã có</Select.Option>
                            <Select.Option value="none">Chưa có</Select.Option>
                        </Select>
                        <Tooltip title="Cài đặt Prompt AI (Danh sách)">
                            <Button
                                type="text"
                                icon={<SettingOutlined />}
                                onClick={() => setPromptSettingsListModalVisible(true)}
                                style={{ color: '#fa8c16' }}
                                size="small"
                            >
                                Cài đặt Prompt
                            </Button>
                        </Tooltip>
                    </div>
                </div>

                {/* Row 3: Generation Buttons */}
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        loading={processingSummaryDetailQueue}
                        onClick={handleAIGeneration}
                        disabled={selectedRowKeys.length === 0}
                        size="small"
                    >
                        Tạo SummaryDetail ({selectedRowKeys.length})
                    </Button>
                    <Button
                        type="default"
                        icon={<FileTextOutlined />}
                        onClick={handleBulkCreateHtmlFromSummaryDetail}
                        disabled={selectedRowKeys.length === 0 || processingHtmlQueue}
                        loading={processingHtmlQueue}
                        size="small"
                    >
                        Tạo HTML ({selectedRowKeys.length})
                    </Button>
                    <Button
                        type="default"
                        icon={<PictureOutlined />}
                        onClick={handleBulkCreateExcalidrawFromSummaryDetail}
                        disabled={selectedRowKeys.length === 0 || processingExcalidrawQueue}
                        loading={processingExcalidrawQueue}
                        size="small"
                    >
                        Tạo Excalidraw ({selectedRowKeys.length})
                    </Button>
                    <Button
                        type="default"
                        icon={<PictureOutlined />}
                        onClick={handleBulkCreateImageFromSummaryDetail}
                        disabled={selectedRowKeys.length === 0 || processingImageQueue}
                        loading={processingImageQueue}
                        size="small"
                    >
                        Tạo ImgUrls ({selectedRowKeys.length})
                    </Button>
                </div>

                {/* Row 4: Queue Buttons */}
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {(summaryDetailQueue.length > 0 || currentSummaryDetailProcessing) && (
                        <Button
                            type="default"
                            icon={<ThunderboltOutlined />}
                            onClick={() => setSummaryDetailQueueModalVisible(true)}
                            size="small"
                        >
                            Queue SummaryDetail ({summaryDetailQueue.length + (currentSummaryDetailProcessing ? 1 : 0)})
                        </Button>
                    )}
                    {(htmlQueue.length > 0 || currentHtmlProcessing) && (
                        <Button
                            type="default"
                            icon={<FileTextOutlined />}
                            onClick={() => setHtmlQueueModalVisible(true)}
                            size="small"
                        >
                            Queue HTML ({htmlQueue.length + (currentHtmlProcessing ? 1 : 0)})
                        </Button>
                    )}
                    {(excalidrawQueue.length > 0 || currentExcalidrawProcessing) && (
                        <Button
                            type="default"
                            icon={<PictureOutlined />}
                            onClick={() => setExcalidrawQueueModalVisible(true)}
                            size="small"
                        >
                            Queue Excalidraw ({excalidrawQueue.length + (currentExcalidrawProcessing ? 1 : 0)})
                        </Button>
                    )}
                    {(imageGenerationQueue.length > 0 || currentImageProcessing) && (
                        <Button
                            type="default"
                            icon={<PictureOutlined />}
                            onClick={() => setImageQueueModalVisible(true)}
                            size="small"
                        >
                            Queue ImgUrls ({imageGenerationQueue.length + (currentImageProcessing ? 1 : 0)})
                        </Button>
                    )}
                </div>

                {/* Row 5: Selection Actions */}
                {selectedRowKeys.length > 0 && (
                    <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            type="link"
                            onClick={() => setSelectedRowKeys([])}
                            size="small"
                        >
                            Bỏ chọn ({selectedRowKeys.length})
                        </Button>

                        <Popconfirm
                            title="Xác nhận xóa SummaryDetail"
                            description={`Bạn có chắc chắn muốn xóa SummaryDetail cho ${selectedRowKeys.length} bản ghi đã chọn?`}
                            onConfirm={handleBulkDeleteSummaryDetail}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                loading={deletingSummaryDetail}
                                disabled={loading || deletingSummaryDetail || deletingHtml || deletingExcalidraw || deletingImgUrls}
                                size="small"
                            >
                                Xóa SummaryDetail
                            </Button>
                        </Popconfirm>

                        <Popconfirm
                            title="Xác nhận xóa HTML từ SummaryDetail"
                            description={`Bạn có chắc chắn muốn xóa HTML từ SummaryDetail cho ${selectedRowKeys.length} bản ghi đã chọn?`}
                            onConfirm={handleBulkDeleteHtmlFromSummaryDetail}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<FileTextOutlined />}
                                loading={deletingHtml}
                                disabled={loading || deletingSummaryDetail || deletingHtml || deletingExcalidraw || deletingImgUrls}
                                size="small"
                            >
                                Xóa HTML
                            </Button>
                        </Popconfirm>

                        <Popconfirm
                            title="Xác nhận xóa Excalidraw từ SummaryDetail"
                            description={`Bạn có chắc chắn muốn xóa Excalidraw từ SummaryDetail cho ${selectedRowKeys.length} bản ghi đã chọn?`}
                            onConfirm={handleBulkDeleteExcalidrawFromSummaryDetail}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<PictureOutlined />}
                                loading={deletingExcalidraw}
                                disabled={loading || deletingSummaryDetail || deletingHtml || deletingExcalidraw || deletingImgUrls}
                                size="small"
                            >
                                Xóa Excalidraw
                            </Button>
                        </Popconfirm>

                        <Popconfirm
                            title="Xác nhận xóa imgUrls"
                            description={`Bạn có chắc chắn muốn xóa imgUrls cho ${selectedRowKeys.length} bản ghi đã chọn?`}
                            onConfirm={handleBulkDeleteImgUrls}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<FileImageOutlined />}
                                loading={deletingImgUrls}
                                disabled={loading || deletingSummaryDetail || deletingHtml || deletingExcalidraw || deletingImgUrls}
                                size="small"
                            >
                                Xóa ImgUrls
                            </Button>
                        </Popconfirm>

                        <div style={{ width: '100%', height: '1px', backgroundColor: '#f0f0f0', margin: '8px 0' }} />

                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#666' }}>Bật/Tắt hiển thị:</span>

                        <Button
                            type="default"
                            icon={<FileTextOutlined />}
                            onClick={() => handleBulkToggleShowHtml(true)}
                            loading={togglingShowHtml}
                            disabled={selectedRowKeys.length === 0 || togglingShowHtml}
                            size="small"
                        >
                            Bật HTML
                        </Button>
                        <Button
                            type="default"
                            icon={<FileTextOutlined />}
                            onClick={() => handleBulkToggleShowHtml(false)}
                            loading={togglingShowHtml}
                            disabled={selectedRowKeys.length === 0 || togglingShowHtml}
                            size="small"
                        >
                            Tắt HTML
                        </Button>

                        <Button
                            type="default"
                            icon={<PictureOutlined />}
                            onClick={() => handleBulkToggleShowExcalidraw(true)}
                            loading={togglingShowExcalidraw}
                            disabled={selectedRowKeys.length === 0 || togglingShowExcalidraw}
                            size="small"
                        >
                            Bật Excalidraw
                        </Button>
                        <Button
                            type="default"
                            icon={<PictureOutlined />}
                            onClick={() => handleBulkToggleShowExcalidraw(false)}
                            loading={togglingShowExcalidraw}
                            disabled={selectedRowKeys.length === 0 || togglingShowExcalidraw}
                            size="small"
                        >
                            Tắt Excalidraw
                        </Button>

                        <Button
                            type="default"
                            icon={<FileImageOutlined />}
                            onClick={() => handleBulkToggleShowImgUrls(true)}
                            loading={togglingShowImgUrls}
                            disabled={selectedRowKeys.length === 0 || togglingShowImgUrls}
                            size="small"
                        >
                            Bật imgUrls
                        </Button>
                        <Button
                            type="default"
                            icon={<FileImageOutlined />}
                            onClick={() => handleBulkToggleShowImgUrls(false)}
                            loading={togglingShowImgUrls}
                            disabled={selectedRowKeys.length === 0 || togglingShowImgUrls}
                            size="small"
                        >
                            Tắt imgUrls
                        </Button>
                    </div>
                )}

                {/* Tabs */}
                <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
                    <TabPane
                        tab={<span>Lý thuyết <Badge count={k9Data.news?.length || 0} size="small" /></span>}
                        key="news"
                    />
                    <TabPane
                        tab={<span>Case Training <Badge count={k9Data.caseTraining?.length || 0} size="small" /></span>}
                        key="caseTraining"
                    />
                    <TabPane
                        tab={<span>Kho tài nguyên <Badge count={k9Data.longForm?.length || 0} size="small" /></span>}
                        key="longForm"
                    />
                    <TabPane
                        tab={<span>Về AiMBA <Badge count={k9Data.home?.length || 0} size="small" /></span>}
                        key="home"
                    />
                </Tabs>

                {/* Table */}
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1500, y: 600 }}
                    rowSelection={{
                        type: 'checkbox',
                        columnWidth: 60,
                        fixed: true,
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['1000', '2000', '3000', '4000'],
                        showTotal: (total) => `Tổng ${total} bản ghi (Tab: ${activeTab})`,
                        onShowSizeChange: (current, size) => {
                            const newPage = Math.ceil((currentPage - 1) * pageSize / size) + 1;
                            setPageSize(size);
                            setCurrentPage(newPage);
                        },
                        onChange: (page) => {
                            setCurrentPage(page);
                        },
                    }}
                    virtual
                    locale={{
                        emptyText: <Empty description="Không có dữ liệu nào" />,
                    }}
                />
            </Card>

            {/* Detail Modal */}
            <EditDetailModal
                visible={detailModalVisible}
                onClose={() => {
                    setDetailModalVisible(false);
                    setSelectedDetailRecord(null);
                }}
                item={selectedDetailRecord}
                onUpdate={(updatedItem) => {
                    // Update local data
                    const updater = (list) => list.map(item =>
                        item.id === updatedItem.id
                            ? { ...item, detail: updatedItem.detail }
                            : item
                    );

                    setK9Data(prev => ({
                        news: updater(prev.news || []),
                        caseTraining: updater(prev.caseTraining || []),
                        longForm: updater(prev.longForm || []),
                        home: updater(prev.home || []),
                    }));
                }}
            />

            {/* SummaryDetail Modal */}
            <EditSummaryDetailModal
                visible={summaryDetailModalVisible}
                onClose={() => {
                    setSummaryDetailModalVisible(false);
                    setSelectedSummaryDetailRecord(null);
                }}
                item={selectedSummaryDetailRecord}
                onUpdate={(updatedItem) => {
                    // Update local data
                    const updater = (list) => list.map(item =>
                        item.id === updatedItem.id
                            ? { ...item, summaryDetail: updatedItem.summaryDetail }
                            : item
                    );

                    setK9Data(prev => ({
                        news: updater(prev.news || []),
                        caseTraining: updater(prev.caseTraining || []),
                        longForm: updater(prev.longForm || []),
                        home: updater(prev.home || []),
                    }));
                }}
            />

            {/* Prompt Settings List Modal */}
            <PromptSettingsListModal
                visible={promptSettingsListModalVisible}
                onCancel={() => setPromptSettingsListModalVisible(false)}
                onSuccess={() => {
                    message.success('Cài đặt prompt danh sách đã được cập nhật!');
                }}
            />

            {/* SummaryDetail Queue Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ThunderboltOutlined />
                        <span>SummaryDetail Generation Queue</span>
                    </div>
                }
                open={summaryDetailQueueModalVisible}
                onCancel={() => setSummaryDetailQueueModalVisible(false)}
                width={900}
                footer={[
                    <Button key="close" onClick={() => setSummaryDetailQueueModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
            >
                {currentSummaryDetailProcessing && (
                    <div style={{ marginBottom: '24px' }}>
                        <h5>🔄 Đang xử lý</h5>
                        <div style={{
                            padding: '16px',
                            border: '2px solid #1890ff',
                            borderRadius: '8px',
                            backgroundColor: '#e6f7ff'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LoadingOutlined spin style={{ fontSize: '24px', color: '#1890ff' }} />
                                <div>
                                    <div><strong>{currentSummaryDetailProcessing.title}</strong></div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Record ID: {currentSummaryDetailProcessing.recordId}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {summaryDetailQueue.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <h5>📝 Hàng đợi ({summaryDetailQueue.length})</h5>
                        {summaryDetailQueue.map((task, index) => (
                            <div key={task.id} style={{
                                padding: '12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                backgroundColor: '#fafafa'
                            }}>
                                <div>#{index + 1} {task.title}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    Record ID: {task.recordId}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {summaryDetailQueueResults.length > 0 && (
                    <div>
                        <h5>📊 Kết quả ({summaryDetailQueueResults.length})</h5>
                        {summaryDetailQueueResults.map((result, index) => (
                            <div key={index} style={{
                                padding: '12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                backgroundColor: result.status === 'success' ? '#f6ffed' : '#fff2f0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {result.status === 'success' ? (
                                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    ) : (
                                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                    )}
                                    <div>
                                        <div><strong>{result.task.title}</strong></div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            {result.message}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* HTML Queue Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileTextOutlined />
                        <span>HTML Generation Queue</span>
                    </div>
                }
                open={htmlQueueModalVisible}
                onCancel={() => setHtmlQueueModalVisible(false)}
                width={900}
                footer={[
                    <Button key="close" onClick={() => setHtmlQueueModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
            >
                {currentHtmlProcessing && (
                    <div style={{ marginBottom: '24px' }}>
                        <h5>🔄 Đang xử lý</h5>
                        <div style={{
                            padding: '16px',
                            border: '2px solid #1890ff',
                            borderRadius: '8px',
                            backgroundColor: '#e6f7ff'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LoadingOutlined spin style={{ fontSize: '24px', color: '#1890ff' }} />
                                <div>
                                    <div><strong>{currentHtmlProcessing.title}</strong></div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Record ID: {currentHtmlProcessing.recordId}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {htmlQueue.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <h5>📝 Hàng đợi ({htmlQueue.length})</h5>
                        {htmlQueue.map((task, index) => (
                            <div key={task.id} style={{
                                padding: '12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                backgroundColor: '#fafafa'
                            }}>
                                <div>#{index + 1} {task.title}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    Record ID: {task.recordId}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {htmlQueueResults.length > 0 && (
                    <div>
                        <h5>📊 Kết quả ({htmlQueueResults.length})</h5>
                        {htmlQueueResults.map((result, index) => (
                            <div key={index} style={{
                                padding: '12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                backgroundColor: result.status === 'success' ? '#f6ffed' : '#fff2f0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {result.status === 'success' ? (
                                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    ) : (
                                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                    )}
                                    <div>
                                        <div><strong>{result.task.title}</strong></div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            {result.message}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Excalidraw Queue Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PictureOutlined />
                        <span>Excalidraw Generation Queue</span>
                    </div>
                }
                open={excalidrawQueueModalVisible}
                onCancel={() => setExcalidrawQueueModalVisible(false)}
                width={900}
                footer={[
                    <Button key="close" onClick={() => setExcalidrawQueueModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
            >
                {currentExcalidrawProcessing && (
                    <div style={{ marginBottom: '24px' }}>
                        <h5>🔄 Đang xử lý</h5>
                        <div style={{
                            padding: '16px',
                            border: '2px solid #1890ff',
                            borderRadius: '8px',
                            backgroundColor: '#e6f7ff'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LoadingOutlined spin style={{ fontSize: '24px', color: '#1890ff' }} />
                                <div>
                                    <div><strong>{currentExcalidrawProcessing.title}</strong></div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Record ID: {currentExcalidrawProcessing.recordId}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {excalidrawQueue.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <h5>📝 Hàng đợi ({excalidrawQueue.length})</h5>
                        {excalidrawQueue.map((task, index) => (
                            <div key={task.id} style={{
                                padding: '12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                backgroundColor: '#fafafa'
                            }}>
                                <div>#{index + 1} {task.title}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    Record ID: {task.recordId}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {excalidrawQueueResults.length > 0 && (
                    <div>
                        <h5>📊 Kết quả ({excalidrawQueueResults.length})</h5>
                        {excalidrawQueueResults.map((result, index) => (
                            <div key={index} style={{
                                padding: '12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                backgroundColor: result.status === 'success' ? '#f6ffed' : '#fff2f0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {result.status === 'success' ? (
                                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    ) : (
                                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                    )}
                                    <div>
                                        <div><strong>{result.task.title}</strong></div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            {result.message}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Diagram Preview Modal */}
            <DiagramPreviewModal
                visible={diagramPreviewModalVisible}
                onClose={() => {
                    setDiagramPreviewModalVisible(false);
                    setSelectedDiagramData(null);
                }}
                diagramData={selectedDiagramData}
                onSave={handleDiagramSave}
            />

            <SelectPromptModal
                visible={selectHtmlPromptModalVisible}
                onCancel={() => {
                    setSelectHtmlPromptModalVisible(false);
                    setPendingHtmlRecord(null);
                    setPendingHtmlRecords([]);
                }}
                onSelect={(prompt) => {
                    if (pendingHtmlRecord) {
                        handleHtmlPromptSelected(prompt);
                    } else if (pendingHtmlRecords.length > 0) {
                        handleBulkHtmlPromptSelected(prompt);
                    }
                }}
                promptType="HTML_FROM_SUMMARYDETAIL_PROMPTS"
                title="Chọn cài đặt Prompt - HTML từ SummaryDetail"
            />

            <SelectPromptModal
                visible={selectExcalidrawPromptModalVisible}
                onCancel={() => {
                    setSelectExcalidrawPromptModalVisible(false);
                    setPendingExcalidrawRecord(null);
                    setPendingExcalidrawRecords([]);
                }}
                onSelect={(prompt) => {
                    if (pendingExcalidrawRecord) {
                        handleExcalidrawPromptSelected(prompt);
                    } else if (pendingExcalidrawRecords.length > 0) {
                        handleBulkExcalidrawPromptSelected(prompt);
                    }
                }}
                promptType="EXCALIDRAW_REACT_PROMPTS"
                title="Chọn cài đặt Prompt - Excalidraw từ SummaryDetail"
            />


            <SelectPromptModal
                visible={selectImagePromptModalVisible}
                onCancel={() => {
                    setSelectImagePromptModalVisible(false);
                    setPendingImageRecord(null);
                    setPendingImageRecords([]);
                }}
                onSelect={(prompt) => {
                    if (pendingImageRecord) {
                        handleImagePromptSelected(prompt);
                    } else if (pendingImageRecords.length > 0) {
                        handleBulkImagePromptSelected(prompt);
                    }
                }}
                promptType="IMAGEURL_FROM_SUMMARYDETAIL_PROMPTS"
                title="Chọn cài đặt Prompt - Tạo ảnh từ SummaryDetail (ImageUrl)"
            />

            {/* Image Generation Queue Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PictureOutlined />
                        <span>Image Generation Queue</span>
                    </div>
                }
                open={imageQueueModalVisible}
                onCancel={() => setImageQueueModalVisible(false)}
                width={900}
                footer={[
                    <Button key="close" onClick={() => setImageQueueModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
            >
                {currentImageProcessing && (
                    <div style={{ marginBottom: '24px' }}>
                        <h5>🔄 Đang xử lý</h5>
                        <div style={{
                            padding: '16px',
                            border: '2px solid #1890ff',
                            borderRadius: '8px',
                            backgroundColor: '#e6f7ff'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LoadingOutlined spin style={{ fontSize: '24px', color: '#1890ff' }} />
                                <div>
                                    <div><strong>{currentImageProcessing.title}</strong></div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Record ID: {currentImageProcessing.recordId}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {imageGenerationQueue.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <h5>📝 Hàng đợi ({imageGenerationQueue.length})</h5>
                        {imageGenerationQueue.map((task, index) => (
                            <div key={task.id} style={{
                                padding: '12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                backgroundColor: '#fafafa'
                            }}>
                                <div>#{index + 1} {task.title}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    Record ID: {task.recordId}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {imageQueueResults.length > 0 && (
                    <div>
                        <h5>📊 Kết quả ({imageQueueResults.length})</h5>
                        {imageQueueResults.map((result, index) => (
                            <div key={index} style={{
                                padding: '12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                backgroundColor: result.status === 'success' ? '#f6ffed' : '#fff2f0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {result.status === 'success' ? (
                                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    ) : (
                                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                    )}
                                    <div>
                                        <div><strong>{result.task.title}</strong></div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            {result.message}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            
            {/* Preview imgUrls Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileImageOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
                        <span style={{ fontSize: '18px', fontWeight: 600 }}>
                            {previewingRecord?.title || 'Preview imgUrls'}
                        </span>
                        {previewingRecord?.imgUrls && Array.isArray(previewingRecord.imgUrls) && (
                            <Tag color="blue" style={{ fontSize: '13px', padding: '4px 12px' }}>
                                {previewingRecord.imgUrls.length} ảnh
                            </Tag>
                        )}
                    </div>
                }
                open={imgUrlsPreviewModalVisible}
                onCancel={() => {
                    setImgUrlsPreviewModalVisible(false);
                    setPreviewingRecord(null);
                    setEditingDescriptions({});
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setImgUrlsPreviewModalVisible(false);
                        setPreviewingRecord(null);
                        setEditingDescriptions({});
                    }}>
                        Đóng
                    </Button>
                ]}
                width={1400}
                className={styles.modalContent}
            >

                {previewingRecord?.imgUrls && Array.isArray(previewingRecord.imgUrls) && previewingRecord.imgUrls.length > 0 ? (
                    <div style={{              
                        height : '100%',
                        width: '100%',
                        overflow: 'auto', 
                        position: 'relative'    ,
                        marginTop: '16px'                   
                    }}>
                        {previewingRecord.imgUrls.map((imgItem, index) => {
                            const imageUrl = typeof imgItem === 'string' ? imgItem : (imgItem?.url || imgItem?.image_url || '');
                            const description = typeof imgItem === 'object' ? imgItem?.description : '';
                            if (!imageUrl) return null;
                            
                            return (
                                <Card
                                    key={index}
                                    hoverable={false}
                                    style={{
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                        border: '1px solid #e8e8e8',
                                        width: '100%',
                                        marginBottom: '0'
                                    }}
                                    bodyStyle={{ padding: 0 }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                        {/* Image Section */}
                                        <div style={{ 
                                            position: 'relative',
                                            width: '100%',
                                            backgroundColor: '#fafafa',
                                            minHeight: '200px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            borderBottom: '1px solid #f0f0f0',
                                            padding: '16px'
                                        }}>
                                            <Image
                                                src={imageUrl}
                                                alt={`Ảnh ${index + 1}`}
                                                style={{
                                                    width: 'auto',
                                                    height: 'auto',
                                                    maxWidth: '100%',
                                                    maxHeight: '400px',
                                                    objectFit: 'contain'
                                                }}
                                                preview={{
                                                    mask: (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            fontSize: '13px',
                                                            fontWeight: 500,
                                                            color: 'white'
                                                        }}>
                                                            <span>🔍</span>
                                                            <span>Xem</span>
                                                        </div>
                                                    )
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                backgroundColor: 'rgba(24, 144, 255, 0.85)',
                                                color: 'white',
                                                padding: '2px 10px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                backdropFilter: 'blur(4px)'
                                            }}>
                                                #{index + 1}
                                            </div>
                                        </div>
                                        
                                        {/* Description Section */}
                                        <div style={{ 
                                            padding: '16px',
                                            backgroundColor: '#fff'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: '10px'
                                            }}>
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: '#595959',
                                                    fontWeight: 500
                                                }}>
                                                    Mô tả
                                                </span>
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    onClick={() => {
                                                        const currentDescription = description || '';
                                                        setEditingDescriptions(prev => ({
                                                            ...prev,
                                                            [index]: currentDescription
                                                        }));
                                                    }}
                                                    style={{ 
                                                        padding: '0 4px',
                                                        height: '20px',
                                                        fontSize: '11px',
                                                        color: '#1890ff'
                                                    }}
                                                >
                                                    {editingDescriptions[index] !== undefined ? 'Hủy' : '✏️ Sửa'}
                                                </Button>
                                            </div>
                                            
                                            {editingDescriptions[index] !== undefined ? (
                                                <div>
                                                    <TextArea
                                                        value={editingDescriptions[index]}
                                                        onChange={(e) => {
                                                            setEditingDescriptions(prev => ({
                                                                ...prev,
                                                                [index]: e.target.value
                                                            }));
                                                        }}
                                                        rows={3}
                                                        placeholder="Nhập mô tả..."
                                                        style={{
                                                            marginBottom: '10px',
                                                            fontSize: '13px'
                                                        }}
                                                    />
                                                    <Space size="small">
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            loading={savingDescription}
                                                            onClick={async () => {
                                                                try {
                                                                    setSavingDescription(true);
                                                                    const newDescription = editingDescriptions[index];
                                                                    const updatedImgUrls = [...previewingRecord.imgUrls];
                                                                    updatedImgUrls[index] = {
                                                                        ...updatedImgUrls[index],
                                                                        description: newDescription
                                                                    };
                                                                    
                                                                    const updateData = {
                                                                        id: previewingRecord.id,
                                                                        imgUrls: updatedImgUrls
                                                                    };
                                                                    
                                                                    const updateResponse = await updateK9(updateData);
                                                                    const updatedRecord = updateResponse?.data || updateResponse;
                                                                    
                                                                    // Update local state
                                                                    const updater = (list) => list.map(item =>
                                                                        item.id === previewingRecord.id 
                                                                            ? { ...item, ...updatedRecord }
                                                                            : item
                                                                    );
                                                                    
                                                                    setK9Data(prev => ({
                                                                        news: updater(prev.news || []),
                                                                        caseTraining: updater(prev.caseTraining || []),
                                                                        longForm: updater(prev.longForm || []),
                                                                        home: updater(prev.home || []),
                                                                    }));
                                                                    
                                                                    // Update previewing record
                                                                    setPreviewingRecord(prev => ({
                                                                        ...prev,
                                                                        imgUrls: updatedImgUrls
                                                                    }));
                                                                    
                                                                    // Clear editing state
                                                                    setEditingDescriptions(prev => {
                                                                        const newState = { ...prev };
                                                                        delete newState[index];
                                                                        return newState;
                                                                    });
                                                                    
                                                                    message.success('Đã cập nhật mô tả thành công!');
                                                                } catch (error) {
                                                                    console.error('Error updating description:', error);
                                                                    message.error('Cập nhật mô tả thất bại!');
                                                                } finally {
                                                                    setSavingDescription(false);
                                                                }
                                                            }}
                                                        >
                                                            Lưu
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            onClick={() => {
                                                                setEditingDescriptions(prev => {
                                                                    const newState = { ...prev };
                                                                    delete newState[index];
                                                                    return newState;
                                                                });
                                                            }}
                                                        >
                                                            Hủy
                                                        </Button>
                                                    </Space>
                                                </div>
                                            ) : (
                                                description ? (
                                                    <div style={{
                                                        fontSize: '13px',
                                                        color: '#434343',
                                                        lineHeight: '1.6',
                                                        wordBreak: 'break-word',
                                                        fontWeight: 400
                                                    }}>
                                                        {description}
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        color: '#bfbfbf',
                                                        fontSize: '12px',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        Chưa có mô tả
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        color: '#8c8c8c'
                    }}>
                        <FileImageOutlined style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.2 }} />
                        <div style={{ fontSize: '18px', fontWeight: 500 }}>Không có imgUrls</div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AISummaryDetailGeneration;

