import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, FileImageOutlined, FileTextOutlined, FilterOutlined, HomeOutlined, LoadingOutlined, PictureOutlined, SearchOutlined, SettingOutlined, ThunderboltOutlined, UploadOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Collapse, Dropdown, Empty, Image, Input, message, Modal, Popconfirm, Select, Space, Switch, Table, Tabs, Tag, Tooltip } from 'antd';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiGen, aiGen2 } from '../../apis/aiGen/botService.jsx';
import { uploadFiles } from '../../apis/aiGen/uploadImageWikiNoteService.jsx';
import { getK9ByType, updateK9, updateK9Bulk, getK9ByCidType } from '../../apis/k9Service.jsx';
import { getSettingByType } from '../../apis/settingService.jsx';
import { getSettingByTypePublic } from '../../apis/public/publicService.jsx';
import EditDetailModal from '../K9/components/EditDetailModal.jsx';
import EditSummaryDetailModal from '../K9/components/EditSummaryDetailModal.jsx';
import DiagramPreviewModal from '../K9Management/components/DiagramPreviewModal.jsx';
import PromptSettingsListModal from '../K9Management/components/PromptSettingsListModal.jsx';
import SelectPromptModal from '../K9Management/components/SelectPromptModal.jsx';
import RelatedCaseTrainingModal from '../K9/components/RelatedCaseTrainingModal.jsx';
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
    const [deletingMatplotlib, setDeletingMatplotlib] = useState(false);
    const [deletingImgUrls, setDeletingImgUrls] = useState(false);
    const [deletingDetailImageUrls, setDeletingDetailImageUrls] = useState(false);
    const shouldStopRef = useRef(false);

    // Queue states for HTML and Excalidraw
    const [htmlQueue, setHtmlQueue] = useState([]);
    const [excalidrawQueue, setExcalidrawQueue] = useState([]);
    const [matplotlibQueue, setMatplotlibQueue] = useState([]);
    const [processingHtmlQueue, setProcessingHtmlQueue] = useState(false);
    const [processingExcalidrawQueue, setProcessingExcalidrawQueue] = useState(false);
    const [processingMatplotlibQueue, setProcessingMatplotlibQueue] = useState(false);
    const [currentHtmlProcessing, setCurrentHtmlProcessing] = useState(null);
    const [currentExcalidrawProcessing, setCurrentExcalidrawProcessing] = useState(null);
    const [currentMatplotlibProcessing, setCurrentMatplotlibProcessing] = useState(null);
    const [htmlQueueModalVisible, setHtmlQueueModalVisible] = useState(false);
    const [excalidrawQueueModalVisible, setExcalidrawQueueModalVisible] = useState(false);
    const [matplotlibQueueModalVisible, setMatplotlibQueueModalVisible] = useState(false);
    const [htmlQueueResults, setHtmlQueueResults] = useState([]); // Track HTML results with success/error
    const [excalidrawQueueResults, setExcalidrawQueueResults] = useState([]); // Track Excalidraw results with success/error
    const [matplotlibQueueResults, setMatplotlibQueueResults] = useState([]); // Track Matplotlib results with success/error

    // Prompt selection states for HTML and Excalidraw from SummaryDetail
    const [selectHtmlPromptModalVisible, setSelectHtmlPromptModalVisible] = useState(false);
    const [selectExcalidrawPromptModalVisible, setSelectExcalidrawPromptModalVisible] = useState(false);
    const [selectMatplotlibPromptModalVisible, setSelectMatplotlibPromptModalVisible] = useState(false);
    const [pendingHtmlRecord, setPendingHtmlRecord] = useState(null);
    const [pendingExcalidrawRecord, setPendingExcalidrawRecord] = useState(null);
    const [pendingMatplotlibRecord, setPendingMatplotlibRecord] = useState(null);
    const [pendingHtmlRecords, setPendingHtmlRecords] = useState([]);
    const [pendingExcalidrawRecords, setPendingExcalidrawRecords] = useState([]);
    const [pendingMatplotlibRecords, setPendingMatplotlibRecords] = useState([]);

    // Preview modal states
    const [diagramPreviewModalVisible, setDiagramPreviewModalVisible] = useState(false);
    const [selectedDiagramData, setSelectedDiagramData] = useState(null);
    const [matplotlibPreviewVisible, setMatplotlibPreviewVisible] = useState(false);
    const [matplotlibPreviewLoading, setMatplotlibPreviewLoading] = useState(false);
    const [matplotlibImgSrcList, setMatplotlibImgSrcList] = useState([]);
    const [matplotlibPreviewTitle, setMatplotlibPreviewTitle] = useState('');
    const [matplotlibPreviewCode, setMatplotlibPreviewCode] = useState('');
    const [matplotlibPreviewDraftCode, setMatplotlibPreviewDraftCode] = useState('');
    const [matplotlibPreviewEditing, setMatplotlibPreviewEditing] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(1000);
    const [summaryDetailFilter, setSummaryDetailFilter] = useState('all'); // 'all', 'has', 'none'
    const [diagramHtmlFilter, setDiagramHtmlFilter] = useState('all'); // 'all', 'has', 'none'
    const [diagramExcalidrawFilter, setDiagramExcalidrawFilter] = useState('all'); // 'all', 'has', 'none'
    const [matplotlibFilter, setMatplotlibFilter] = useState('all'); // 'all', 'has', 'none'
    const [imgUrlsFilter, setImgUrlsFilter] = useState('all'); // 'all', 'has', 'none'
    const [detailImageUrlsFilter, setDetailImageUrlsFilter] = useState('all'); // 'all', 'has', 'none'
    const [showDetailFilter, setShowDetailFilter] = useState('all'); // 'all', 'has', 'none'
    const [lessonNumberFilter, setLessonNumberFilter] = useState(''); // Text search for lessonNumber
    const [relatedCaseFilter, setRelatedCaseFilter] = useState('all'); // 'all', '0', '1', '2', ..., '10'
    const [programFilter, setProgramFilter] = useState([]); // Array of selected program values
    const [datasetFilter, setDatasetFilter] = useState([]); // Multi-select Bộ dữ liệu (tag1), OR logic
    const [tag4Options, setTag4Options] = useState([]); // List of available programs
    const programTagsContainerRef = useRef(null); // Ref for tags container
    const [visibleTagsCount, setVisibleTagsCount] = useState(tag4Options.length); // Count of visible tags

    // Queue states for SummaryDetail
    const [summaryDetailQueue, setSummaryDetailQueue] = useState([]);
    const [processingSummaryDetailQueue, setProcessingSummaryDetailQueue] = useState(false);
    const [currentSummaryDetailProcessing, setCurrentSummaryDetailProcessing] = useState(null);
    const [summaryDetailQueueModalVisible, setSummaryDetailQueueModalVisible] = useState(false);
    const [summaryDetailQueueResults, setSummaryDetailQueueResults] = useState([]);

    const [togglingShowHtml, setTogglingShowHtml] = useState(false);
    const [togglingShowExcalidraw, setTogglingShowExcalidraw] = useState(false);
    const [togglingShowMatplotlib, setTogglingShowMatplotlib] = useState(false);
    const [togglingShowImgUrls, setTogglingShowImgUrls] = useState(false);
    const [togglingShowDetailImageUrls, setTogglingShowDetailImageUrls] = useState(false);
    const [togglingShowDetail, setTogglingShowDetail] = useState(false);
    // Preview imgUrls modal
    const [imgUrlsPreviewModalVisible, setImgUrlsPreviewModalVisible] = useState(false);
    const [previewingRecord, setPreviewingRecord] = useState(null);
    // Preview detailImageUrls modal
    const [detailImageUrlsPreviewModalVisible, setDetailImageUrlsPreviewModalVisible] = useState(false);
    const [previewingDetailImageUrlsRecord, setPreviewingDetailImageUrlsRecord] = useState(null);
    const [editingDescriptions, setEditingDescriptions] = useState({}); // { index: description }
    const [savingDescription, setSavingDescription] = useState(false);
    const [uploadingImageIndex, setUploadingImageIndex] = useState(null); // Track which image is being uploaded

    // Related Case Training Modal states
    const [relatedCaseTrainingModalVisible, setRelatedCaseTrainingModalVisible] = useState(false);
    const [selectedNewsItemForCaseTraining, setSelectedNewsItemForCaseTraining] = useState(null);
    const [relatedCaseTrainingList, setRelatedCaseTrainingList] = useState([]);
    const [loadingRelatedCaseTraining, setLoadingRelatedCaseTraining] = useState(false);

    // Queue states for Image generation from SummaryDetail (tạo imageUrl JSON)
    const [imageGenerationQueue, setImageGenerationQueue] = useState([]);
    const [processingImageQueue, setProcessingImageQueue] = useState(false);
    const [currentImageProcessing, setCurrentImageProcessing] = useState(null);
    const [imageQueueModalVisible, setImageQueueModalVisible] = useState(false);
    const [imageQueueResults, setImageQueueResults] = useState([]);
    const [selectImagePromptModalVisible, setSelectImagePromptModalVisible] = useState(false);
    const [pendingImageRecord, setPendingImageRecord] = useState(null);
    const [pendingImageRecords, setPendingImageRecords] = useState([]);

    // Queue states for Multi Image generation from Detail (tách detail -> nhiều ảnh)
    const [multiImageFromDetailQueue, setMultiImageFromDetailQueue] = useState([]);
    const [processingMultiImageFromDetailQueue, setProcessingMultiImageFromDetailQueue] = useState(false);
    const [currentMultiImageFromDetailProcessing, setCurrentMultiImageFromDetailProcessing] = useState(null);
    const [multiImageFromDetailQueueModalVisible, setMultiImageFromDetailQueueModalVisible] = useState(false);
    const [multiImageFromDetailQueueResults, setMultiImageFromDetailQueueResults] = useState([]);
    const [selectMultiImageFromDetailPromptModalVisible, setSelectMultiImageFromDetailPromptModalVisible] = useState(false);
    const [pendingMultiImageFromDetailRecord, setPendingMultiImageFromDetailRecord] = useState(null);
    const [pendingMultiImageFromDetailRecords, setPendingMultiImageFromDetailRecords] = useState([]);

    // K9 data for each tab
    const [k9Data, setK9Data] = useState({
        news: [],
        document: [],
        caseTraining: [],
        longForm: [],
        home: [],
    });

    // Load K9 data for all tabs
    const loadK9Data = async () => {
        setLoading(true);
        try {
            const [newsData, documentData, caseTrainingData, longFormData, homeData] = await Promise.all([
                getK9ByType('news', { data_type: 'global', }),
                getK9ByType('document', { data_type: 'global' }),
                getK9ByType('caseTraining', { data_type: 'global' }),
                getK9ByType('longForm', { data_type: 'global' }),
                getK9ByType('home', { data_type: 'global' }),
            ]);

            const newK9Data = {
                news: newsData?.data || newsData || [],
                document: documentData?.data || documentData || [],
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
            document: updater(prev.document || []),
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
                for (const tab of ['news', 'document', 'caseTraining', 'longForm', 'home']) {
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

    // Add Matplotlib code to queue with prompt config
    const addMatplotlibToQueue = (recordId, title, promptConfig = null) => {
        const task = {
            id: `matplotlib_${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recordId,
            title: title.length > 50 ? title.substring(0, 50) + '...' : title,
            promptConfig: promptConfig,
            createdAt: new Date().toISOString()
        };
        setMatplotlibQueue(prev => [...prev, task]);
        message.success(`📈 Đã thêm "${task.title}" vào hàng đợi tạo Matplotlib code!`);
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
                for (const tab of ['news', 'document', 'caseTraining', 'longForm', 'home']) {
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
                for (const tab of ['news', 'document', 'caseTraining', 'longForm', 'home']) {
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

    // Process Matplotlib queue
    const processMatplotlibQueue = async () => {
        if (matplotlibQueue.length === 0 || processingMatplotlibQueue) {
            return;
        }

        setProcessingMatplotlibQueue(true);
        setMatplotlibQueueResults([]);
        const queue = [...matplotlibQueue];

        for (let i = 0; i < queue.length; i++) {
            if (shouldStopRef.current) {
                message.info('Đã dừng quá trình tạo Matplotlib');
                setProcessingMatplotlibQueue(false);
                setCurrentMatplotlibProcessing(null);
                setMatplotlibQueue([]);
                break;
            }

            const task = queue[i];
            setCurrentMatplotlibProcessing(task);
            setMatplotlibQueue(prev => prev.filter(item => item.id !== task.id));

            try {
                // Find record from all tabs
                let record = null;
                for (const tab of ['news', 'document', 'caseTraining', 'longForm', 'home']) {
                    const found = k9Data[tab]?.find(item => item.id === task.recordId);
                    if (found) {
                        record = found;
                        break;
                    }
                }
                if (!record) {
                    throw new Error('Không tìm thấy record');
                }

                await generateMatplotlibFromSummaryDetailForRecord(record, task.promptConfig);

                setMatplotlibQueueResults(prev => [...prev, {
                    task,
                    status: 'success',
                    message: 'Tạo Matplotlib code thành công'
                }]);
            } catch (error) {
                console.error(`Error processing Matplotlib for ${task.recordId}:`, error);
                setMatplotlibQueueResults(prev => [...prev, {
                    task,
                    status: 'error',
                    message: error.message || 'Lỗi không xác định'
                }]);
            }

            setCurrentMatplotlibProcessing(null);
        }

        setProcessingMatplotlibQueue(false);
        if (queue.length > 0) {
            message.success(`Hoàn thành xử lý ${queue.length} task Matplotlib`);
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

    useEffect(() => {
        if (matplotlibQueue.length > 0 && !processingMatplotlibQueue) {
            processMatplotlibQueue();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matplotlibQueue.length, processingMatplotlibQueue]);


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
            document: updater(prev.document || []),
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
            document: updater(prev.document || []),
            caseTraining: updater(prev.caseTraining || []),
            longForm: updater(prev.longForm || []),
            home: updater(prev.home || []),
        }));

        message.success(`✅ Tạo Excalidraw diagram từ summaryDetail thành công cho "${record.title}"!`);
    };

    // Generate Matplotlib code from summaryDetail for single record
    const generateMatplotlibFromSummaryDetailForRecord = async (record, promptConfig = null) => {
        if (!record.summaryDetail || record.summaryDetail.trim() === '') {
            throw new Error('Không có summaryDetail để tạo Matplotlib code!');
        }

        if (record.matplotlibCode && Array.isArray(record.matplotlibCode) && record.matplotlibCode.length > 0) {
            throw new Error('Record này đã có Matplotlib code từ summaryDetail');
        }

        const aiPrompt = promptConfig?.aiPrompt;
        const aiModel = promptConfig?.aiModel;
        if (!aiModel || !aiPrompt) {
            throw new Error('Vui lòng chọn cài đặt prompt trước!');
        }

        const codes = [];
        message.info(`🔄 Đang tạo Matplotlib code từ summaryDetail cho: ${record.title}${promptConfig ? ` (Cài đặt: ${promptConfig.name})` : ''}`);

        const aiResult = await aiGen(
            `${record.summaryDetail}`,
            aiPrompt,
            aiModel,
            'text',
            0.2
        );
        const aiText = (aiResult?.result || aiResult?.answer || aiResult?.content || '').trim();
        if (!aiText) {
            throw new Error('AI không tạo được Matplotlib code hợp lệ');
        }
        const extracted = extractPythonCode(aiText);
        if (!extracted) {
            throw new Error('AI trả về nội dung không phải Python/Matplotlib (ví dụ dạng DIAGRAM/IMG-01...), vui lòng chỉnh prompt để yêu cầu output Python code.');
        }
        codes.push(extracted);

        const updateData = {
            id: record.id,
            matplotlibCode: codes,
            showMatplotlib: true
        };

        const updateResponse = await updateK9(updateData);
        const updatedRecord = updateResponse?.data || updateResponse;
        const updater = (list) => list.map(item =>
            item.id === record.id ? { ...item, ...updatedRecord } : item
        );

        setK9Data(prev => ({
            news: updater(prev.news || []),
            document: updater(prev.document || []),
            caseTraining: updater(prev.caseTraining || []),
            longForm: updater(prev.longForm || []),
            home: updater(prev.home || []),
        }));

        message.success(`✅ Tạo Matplotlib code từ summaryDetail thành công cho "${record.title}"!`);
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
                for (const tab of ['news', 'document', 'caseTraining', 'longForm', 'home']) {
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
                document: updater(prev.document || []),
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

    // Add Multi Image from Detail to queue
    const addMultiImageFromDetailToQueue = (recordId, title, promptConfig = null) => {
        const task = {
            id: `multi_image_detail_${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recordId,
            title: title.length > 50 ? title.substring(0, 50) + '...' : title,
            promptConfig: promptConfig,
            createdAt: new Date().toISOString()
        };
        setMultiImageFromDetailQueue(prev => [...prev, task]);
        message.success(`📸 Đã thêm "${task.title}" vào hàng đợi tạo nhiều ảnh từ Detail!`);
        return task;
    };

    // Process Multi Image from Detail queue
    const processMultiImageFromDetailQueue = async () => {
        if (multiImageFromDetailQueue.length === 0 || processingMultiImageFromDetailQueue) {
            return;
        }

        setProcessingMultiImageFromDetailQueue(true);
        setMultiImageFromDetailQueueResults([]);
        const queue = [...multiImageFromDetailQueue];

        for (let i = 0; i < queue.length; i++) {
            if (shouldStopRef.current) {
                message.info('Đã dừng quá trình tạo nhiều ảnh từ Detail');
                setProcessingMultiImageFromDetailQueue(false);
                setCurrentMultiImageFromDetailProcessing(null);
                setMultiImageFromDetailQueue([]);
                break;
            }

            const task = queue[i];
            setCurrentMultiImageFromDetailProcessing(task);
            setMultiImageFromDetailQueue(prev => prev.filter(item => item.id !== task.id));

            try {
                // Find record from all tabs
                let record = null;
                for (const tab of ['news', 'document', 'caseTraining', 'longForm', 'home']) {
                    const found = k9Data[tab]?.find(item => item.id === task.recordId);
                    if (found) {
                        record = found;
                        break;
                    }
                }
                if (!record) {
                    throw new Error('Không tìm thấy record');
                }

                await generateMultiImageFromDetailForRecord(record, task.promptConfig);

                setMultiImageFromDetailQueueResults(prev => [...prev, {
                    task,
                    status: 'success',
                    message: 'Tạo nhiều ảnh từ Detail thành công'
                }]);
            } catch (error) {
                console.error(`Error processing multi image from detail for ${task.recordId}:`, error);
                setMultiImageFromDetailQueueResults(prev => [...prev, {
                    task,
                    status: 'error',
                    message: error.message || 'Lỗi không xác định'
                }]);
            }

            setCurrentMultiImageFromDetailProcessing(null);
        }

        setProcessingMultiImageFromDetailQueue(false);
        if (queue.length > 0) {
            message.success(`Hoàn thành xử lý ${queue.length} task tạo nhiều ảnh từ Detail`);
        }
    };

    // Auto process Multi Image from Detail queue
    useEffect(() => {
        if (multiImageFromDetailQueue.length > 0 && !processingMultiImageFromDetailQueue) {
            processMultiImageFromDetailQueue();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [multiImageFromDetailQueue.length, processingMultiImageFromDetailQueue]);

    // Generate Multi Image from Detail for single record
    // Luồng: Detail -> Tách thành nhiều phần -> Tạo description cho mỗi phần -> Tạo ảnh cho mỗi description -> Lưu vào detailImageUrls
    const generateMultiImageFromDetailForRecord = async (record, promptConfig = null) => {
        if (!record.detail || record.detail.trim() === '') {
            throw new Error('Không có detail để tạo ảnh!');
        }

        if (record.detailImageUrls && Array.isArray(record.detailImageUrls) && record.detailImageUrls.length > 0) {
            throw new Error('Record này đã có detailImageUrls');
        }

        // Validate prompt config
        if (!promptConfig) {
            throw new Error('Vui lòng chọn cài đặt prompt từ "Nhiều ảnh từ Detail" trước!');
        }

        let splitPrompt = promptConfig.splitPrompt;
        const splitModel = promptConfig.splitModel;
        const descriptionPrompt = promptConfig.descriptionPrompt;
        const descriptionModel = promptConfig.descriptionModel;
        const imagePrompt = promptConfig.imagePrompt;
        const imageModel = promptConfig.imageModel;
        let quantity = promptConfig.quantity;

        if (!splitPrompt || !splitModel || !descriptionPrompt || !descriptionModel || !imageModel) {
            throw new Error('Cài đặt prompt chưa đầy đủ! Vui lòng kiểm tra lại cấu hình trong "Nhiều ảnh từ Detail".');
        }

        message.info(`🔄 Đang tạo nhiều ảnh từ detail cho: ${record.title}${promptConfig ? ` (Cài đặt: ${promptConfig.name})` : ''}`);

        // Step 1: Tách detail thành nhiều phần
        message.info(`📝 Bước 1: Đang tách detail thành nhiều phần...`);
        let splitPromptText = `${record.detail}`;
        if (quantity) {
            splitPrompt += `\n\nYêu cầu: Tách nội dung detail thành ${quantity} phần, mỗi phần là một khái niệm hoặc bước riêng biệt.`;
        } else {
            splitPrompt += `\n\nYêu cầu: Tách nội dung detail thành các phần cần thiết.`;
        }
        splitPrompt += `\n\nTrả về dưới dạng JSON array với format:\n[\n  {\n    "partNumber": 1,\n    "content": "Nội dung phần 1"\n  },\n  {\n    "partNumber": 2,\n    "content": "Nội dung phần 2"\n  }\n]`;

        const splitResponse = await aiGen(
            splitPromptText,
            splitPrompt,
            splitModel
        );

        const splitResult = splitResponse.result || splitResponse.answer || splitResponse.content || splitResponse;

        // Parse JSON từ response (có thể có markdown code block)
        let parts = [];
        try {
            // Thử parse trực tiếp
            parts = JSON.parse(splitResult);
        } catch (parseError) {
            // Thử extract từ markdown code block
            const jsonMatch = splitResult.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                parts = JSON.parse(jsonMatch[1]);
            } else {
                // Thử tìm JSON trong text
                const jsonMatch2 = splitResult.match(/\[[\s\S]*\]/);
                if (jsonMatch2) {
                    parts = JSON.parse(jsonMatch2[0]);
                } else {
                    throw new Error('Không thể parse kết quả tách detail. Response: ' + splitResult.substring(0, 200));
                }
            }
        }

        if (!Array.isArray(parts) || parts.length === 0) {
            throw new Error('Kết quả tách detail không hợp lệ hoặc không có phần nào');
        }

        message.success(`✅ Đã tách detail thành ${parts.length} phần`);

        // Step 2 & 3: Với mỗi phần, tạo description và ảnh
        const allImageUrls = [];

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const partContent = part.content || part.text || '';

            if (!partContent || partContent.trim() === '') {
                console.warn(`Phần ${i + 1} không có nội dung, bỏ qua`);
                continue;
            }

            message.info(`🔄 Đang xử lý phần ${i + 1}/${parts.length}...`);

            // Step 2: Tạo description từ phần này
            const descriptionPromptText = `${record.title} - Phần ${i + 1}: ${partContent}\n\n⚠️ CRITICAL FORMAT REQUIREMENT - MUST BE FOLLOWED EXACTLY:\n\nYou MUST return ONLY the numbered description in the exact format. Do NOT include any headers, explanations, or additional content. Failure to follow this format will cause system parsing errors and break the image generation process.\n\n⚠️ WARNING: Any deviation from the numbered format will result in parsing failure and system errors. Your response must start immediately with "1." and contain only the numbered description.`;

            const descriptionResponse = await aiGen(
                descriptionPromptText,
                descriptionPrompt,
                descriptionModel,
                'text'
            );

            const descriptionResult = descriptionResponse.result || descriptionResponse.answer || descriptionResponse.content || descriptionResponse;

            // Parse English description
            const descriptionLines = descriptionResult.split('\n');
            let englishDescription = '';

            const startLineIndex = descriptionLines.findIndex(l => l.trim().startsWith('1.'));
            if (startLineIndex !== -1) {
                let endLineIndex = descriptionLines.findIndex(l => l.trim().startsWith('2.'));
                if (endLineIndex === -1) {
                    endLineIndex = descriptionLines.length;
                }

                const descriptionLinesForPart = descriptionLines.slice(startLineIndex, endLineIndex);
                englishDescription = descriptionLinesForPart
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join(' ')
                    .replace(/^\d+\.\s*/, '')
                    .trim();
            } else {
                englishDescription = descriptionResult;
            }

            if (!englishDescription) {
                console.warn(`Không tạo được description cho phần ${i + 1}, bỏ qua`);
                continue;
            }

            // Step 3: Tạo ảnh từ description
            message.info(`🎨 Đang tạo ảnh cho phần ${i + 1}...`);
            const imageResponse = await aiGen2(
                englishDescription,
                imagePrompt || '',
                imageModel,
                'img'
            );

            const imageResult = imageResponse.result || imageResponse.answer || imageResponse.content || imageResponse;

            if (imageResult && imageResult.image_url) {
                allImageUrls.push({
                    url: imageResult.image_url,
                    description: englishDescription,
                    partNumber: part.partNumber || (i + 1),
                    partContent: partContent
                });
            } else {
                console.warn(`Không tạo được ảnh cho phần ${i + 1}`);
            }

            // Delay giữa các request để tránh rate limit
            if (i < parts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (allImageUrls.length === 0) {
            throw new Error('Không tạo được ảnh nào từ detail');
        }

        // Lưu vào detailImageUrls
        const updateData = {
            id: record.id,
            detailImageUrls: allImageUrls,
            showDetailImageUrls: true // Mặc định bật hiển thị khi tạo mới
        };

        const updateResponse = await updateK9(updateData);
        const updatedRecord = updateResponse?.data || updateResponse;
        const updater = (list) => list.map(item =>
            item.id === record.id ? { ...item, ...updatedRecord } : item
        );

        setK9Data(prev => ({
            news: updater(prev.news || []),
            document: updater(prev.document || []),
            caseTraining: updater(prev.caseTraining || []),
            longForm: updater(prev.longForm || []),
            home: updater(prev.home || []),
        }));

        message.success(`✅ Tạo ${allImageUrls.length} ảnh từ detail thành công cho "${record.title}"!`);
    };

    // Handle create Multi Image from Detail (single record - now uses queue)
    const handleCreateMultiImageFromDetail = async (record) => {
        if (!record.detail || record.detail.trim() === '') {
            message.warning('Không có detail để tạo ảnh!');
            return;
        }

        if (record.detailImageUrls && Array.isArray(record.detailImageUrls) && record.detailImageUrls.length > 0) {
            message.warning('Record này đã có detailImageUrls. Vui lòng xóa detailImageUrls cũ trước khi tạo mới.');
            return;
        }

        if (multiImageFromDetailQueue.find(task => task.recordId === record.id) || currentMultiImageFromDetailProcessing?.recordId === record.id) {
            message.warning('Record này đã có trong hàng đợi hoặc đang được xử lý!');
            return;
        }

        // Show prompt selection modal
        setPendingMultiImageFromDetailRecord(record);
        setSelectMultiImageFromDetailPromptModalVisible(true);
    };

    const handleMultiImageFromDetailPromptSelected = (prompt) => {
        setSelectMultiImageFromDetailPromptModalVisible(false);
        if (pendingMultiImageFromDetailRecord) {
            addMultiImageFromDetailToQueue(pendingMultiImageFromDetailRecord.id, pendingMultiImageFromDetailRecord.title, prompt);
        }
        setPendingMultiImageFromDetailRecord(null);
    };

    // Handle bulk create Multi Image from Detail
    const handleBulkCreateMultiImageFromDetail = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để tạo nhiều ảnh từ Detail!');
            return;
        }

        const selectedRecords = filteredData.filter(item =>
            selectedRowKeys.includes(item.id) &&
            item.detail &&
            !(item.detailImageUrls && Array.isArray(item.detailImageUrls) && item.detailImageUrls.length > 0) &&
            !multiImageFromDetailQueue.find(task => task.recordId === item.id) &&
            currentMultiImageFromDetailProcessing?.recordId !== item.id
        );

        if (selectedRecords.length === 0) {
            message.warning('Tất cả bản ghi đã có detailImageUrls hoặc đang trong hàng đợi!');
            return;
        }

        // Show prompt selection modal
        setPendingMultiImageFromDetailRecords(selectedRecords);
        setSelectMultiImageFromDetailPromptModalVisible(true);
    };

    const handleBulkMultiImageFromDetailPromptSelected = (prompt) => {
        setSelectMultiImageFromDetailPromptModalVisible(false);
        const records = pendingMultiImageFromDetailRecords;
        records.forEach(record => {
            addMultiImageFromDetailToQueue(record.id, record.title, prompt);
        });
        setMultiImageFromDetailQueueModalVisible(true);
        setSelectedRowKeys([]);
        setPendingMultiImageFromDetailRecords([]);
        message.success(`📸 Đã thêm ${records.length} bản ghi vào hàng đợi tạo nhiều ảnh từ Detail!`);
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


    const handleMatplotlibPromptSelected = (prompt) => {
        setSelectMatplotlibPromptModalVisible(false);
        if (pendingMatplotlibRecord) {
            addMatplotlibToQueue(pendingMatplotlibRecord.id, pendingMatplotlibRecord.title, prompt);
        }
        setPendingMatplotlibRecord(null);
    };

    // Handle bulk create Matplotlib from summaryDetail
    const handleBulkCreateMatplotlibFromSummaryDetail = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để tạo Matplotlib code!');
            return;
        }

        const selectedItems = filteredData.filter(item => selectedRowKeys.includes(item.id));
        const noSummaryDetail = selectedItems.filter(item => !item.summaryDetail || String(item.summaryDetail).trim() === '');
        const alreadyHasMatplotlib = selectedItems.filter(item => item.matplotlibCode && Array.isArray(item.matplotlibCode) && item.matplotlibCode.length > 0);
        const inQueue = selectedItems.filter(item => matplotlibQueue.some(task => task.recordId === item.id));
        const beingProcessed = selectedItems.filter(item => currentMatplotlibProcessing?.recordId === item.id);

        const selectedRecords = selectedItems.filter(item =>
            item.summaryDetail &&
            String(item.summaryDetail).trim() !== '' &&
            !(item.matplotlibCode && Array.isArray(item.matplotlibCode) && item.matplotlibCode.length > 0) &&
            !matplotlibQueue.some(task => task.recordId === item.id) &&
            currentMatplotlibProcessing?.recordId !== item.id
        );

        if (selectedRecords.length === 0) {
            const parts = [];
            if (noSummaryDetail.length) parts.push(`${noSummaryDetail.length} chưa có SummaryDetail`);
            if (alreadyHasMatplotlib.length) parts.push(`${alreadyHasMatplotlib.length} đã có Matplotlib code`);
            if (inQueue.length) parts.push(`${inQueue.length} đang trong hàng đợi`);
            if (beingProcessed.length) parts.push(`${beingProcessed.length} đang được xử lý`);
            const detail = parts.length ? ` (${parts.join(', ')})` : '';
            message.warning(`Không có bản ghi nào có thể tạo Matplotlib${detail}`);
            return;
        }

        setPendingMatplotlibRecords(selectedRecords);
        setSelectMatplotlibPromptModalVisible(true);
    };

    const handleBulkMatplotlibPromptSelected = (prompt) => {
        setSelectMatplotlibPromptModalVisible(false);
        const records = pendingMatplotlibRecords;
        records.forEach(record => {
            addMatplotlibToQueue(record.id, record.title, prompt);
        });
        setMatplotlibQueueModalVisible(true);
        setSelectedRowKeys([]);
        setPendingMatplotlibRecords([]);
        message.success(`📈 Đã thêm ${records.length} bản ghi vào hàng đợi tạo Matplotlib!`);
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
                document: updater(prev.document || []),
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
                document: updater(prev.document || []),
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
                document: updater(prev.document || []),
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
                document: updater(prev.document || []),
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

    // Handle bulk delete Matplotlib code from SummaryDetail
    const handleBulkDeleteMatplotlibFromSummaryDetail = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để xóa Matplotlib code!');
            return;
        }

        try {
            setDeletingMatplotlib(true);

            await Promise.all([
                updateK9Bulk({
                    ids: selectedRowKeys,
                    fieldToUpdate: 'matplotlibCode',
                    value: null
                }),
                updateK9Bulk({
                    ids: selectedRowKeys,
                    fieldToUpdate: 'showMatplotlib',
                    value: true
                })
            ]);

            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? { ...item, matplotlibCode: null, showMatplotlib: true }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                document: updater(prev.document || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã xóa Matplotlib code cho ${selectedRowKeys.length} bản ghi!`);
            setSelectedRowKeys([]);
        } catch (error) {
            console.error('Error deleting Matplotlib code:', error);
            message.error('Xóa Matplotlib code thất bại!');
        } finally {
            setDeletingMatplotlib(false);
        }
    };

    const handleBulkDeleteDetailImageUrls = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để xóa detailImageUrls!');
            return;
        }

        try {
            setDeletingDetailImageUrls(true);

            // Sử dụng updateK9Bulk API
            const updateData = {
                ids: selectedRowKeys,
                fieldToUpdate: 'detailImageUrls',
                value: null
            };

            await updateK9Bulk(updateData);

            // Update local data
            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? { ...item, detailImageUrls: null }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                document: updater(prev.document || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã xóa detailImageUrls cho ${selectedRowKeys.length} bản ghi!`);
            setSelectedRowKeys([]);
        } catch (error) {
            console.error('Error deleting detailImageUrls:', error);
            message.error('Xóa detailImageUrls thất bại!');
        } finally {
            setDeletingDetailImageUrls(false);
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
                document: updater(prev.document || []),
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
                document: updater(prev.document || []),
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
                document: updater(prev.document || []),
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

    // Handle bulk toggle showMatplotlib
    const handleBulkToggleShowMatplotlib = async (toggleTo) => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để cập nhật!');
            return;
        }

        try {
            setTogglingShowMatplotlib(true);

            const updateData = {
                ids: selectedRowKeys,
                fieldToUpdate: 'showMatplotlib',
                value: toggleTo
            };

            await updateK9Bulk(updateData);

            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? { ...item, showMatplotlib: toggleTo }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                document: updater(prev.document || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã ${toggleTo ? 'bật' : 'tắt'} hiển thị Matplotlib cho ${selectedRowKeys.length} bản ghi!`);
        } catch (error) {
            console.error('Error toggling showMatplotlib:', error);
            message.error('Cập nhật thất bại!');
        } finally {
            setTogglingShowMatplotlib(false);
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
                document: updater(prev.document || []),
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

    // Handle bulk toggle showDetailImageUrls
    const handleBulkToggleShowDetailImageUrls = async (toggleTo) => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để cập nhật!');
            return;
        }

        try {
            setTogglingShowDetailImageUrls(true);

            // Sử dụng updateK9Bulk API
            const updateData = {
                ids: selectedRowKeys,
                fieldToUpdate: 'showDetailImageUrls',
                value: toggleTo
            };

            await updateK9Bulk(updateData);

            // Update local data
            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? { ...item, showDetailImageUrls: toggleTo }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                document: updater(prev.document || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã ${toggleTo ? 'bật' : 'tắt'} hiển thị detailImageUrls cho ${selectedRowKeys.length} bản ghi!`);
        } catch (error) {
            console.error('Error toggling showDetailImageUrls:', error);
            message.error('Cập nhật thất bại!');
        } finally {
            setTogglingShowDetailImageUrls(false);
        }
    };

    // Handle bulk toggle showDetail
    const handleBulkToggleShowDetail = async (toggleTo) => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một bản ghi để cập nhật!');
            return;
        }

        try {
            setTogglingShowDetail(true);

            // Sử dụng updateK9Bulk API
            const updateData = {
                ids: selectedRowKeys,
                fieldToUpdate: 'showDetail',
                value: toggleTo
            };

            await updateK9Bulk(updateData);

            // Update local data
            const updater = (list) => list.map(item =>
                selectedRowKeys.includes(item.id)
                    ? { ...item, showDetail: toggleTo }
                    : item
            );

            setK9Data(prev => ({
                news: updater(prev.news || []),
                document: updater(prev.document || []),
                caseTraining: updater(prev.caseTraining || []),
                longForm: updater(prev.longForm || []),
                home: updater(prev.home || []),
            }));

            message.success(`Đã ${toggleTo ? 'bật' : 'tắt'} hiển thị Detail cho ${selectedRowKeys.length} bản ghi!`);
        } catch (error) {
            console.error('Error toggling showDetail:', error);
            message.error('Cập nhật thất bại!');
        } finally {
            setTogglingShowDetail(false);
        }
    };

    // Load TAG4_OPTIONS (Programs)
    const loadTag4Options = async () => {
        try {
            const tag4Setting = await getSettingByTypePublic('TAG4_OPTIONS');
            if (tag4Setting?.setting) {
                // TAG4_OPTIONS can be an array or an object with options property
                const options = Array.isArray(tag4Setting.setting)
                    ? tag4Setting.setting
                    : (tag4Setting.setting.options || []);
                setTag4Options(options);
            }
        } catch (error) {
            console.error('Error loading TAG4_OPTIONS:', error);
        }
    };

    useEffect(() => {
        loadK9Data();
        loadTag4Options();
    }, []);

    // Get related case training count by cid
    const getRelatedCaseTrainingCount = useCallback((record) => {
        if (!record.cid || (activeTab !== 'news' && activeTab !== 'document')) return 0;
        const relatedCases = k9Data.caseTraining?.filter(item => item.cid === record.cid) || [];
        return relatedCases.length;
    }, [k9Data.caseTraining, activeTab]);

    // Handle open related case training modal
    const handleOpenRelatedCaseTrainingModal = async (record) => {
        if (!record.cid) {
            message.warning('Record này không có CID!');
            return;
        }

        setLoadingRelatedCaseTraining(true);
        setSelectedNewsItemForCaseTraining(record);

        try {
            const relatedCases = await getK9ByCidType(record.cid, 'caseTraining');
            const caseList = Array.isArray(relatedCases) ? relatedCases : (relatedCases?.data || []);
            setRelatedCaseTrainingList(caseList);
            setRelatedCaseTrainingModalVisible(true);
        } catch (error) {
            console.error('Error loading related case training:', error);
            message.error('Lỗi khi tải danh sách case training liên quan!');
        } finally {
            setLoadingRelatedCaseTraining(false);
        }
    };

    // Memoize current tab data to avoid unnecessary recalculations
    const currentTabData = useMemo(() => {
        if (activeTab && k9Data[activeTab] && Array.isArray(k9Data[activeTab])) {
            return k9Data[activeTab];
        }
        return [];
    }, [activeTab, k9Data.news, k9Data.document, k9Data.caseTraining, k9Data.longForm, k9Data.home]);

    // Get dataset (tag1) options from current tab data
    const datasetOptions = useMemo(() => {
        const tabData = currentTabData;
        if (!tabData || !Array.isArray(tabData)) return [];
        const flattenedTag1s = tabData.reduce((acc, item) => {
            if (!item.tag1) return acc;
            let tags = [];
            if (Array.isArray(item.tag1)) {
                tags = item.tag1;
            } else if (typeof item.tag1 === 'string') {
                try {
                    tags = JSON.parse(item.tag1);
                    if (!Array.isArray(tags)) tags = [item.tag1];
                } catch (e) {
                    tags = [item.tag1];
                }
            } else {
                tags = [String(item.tag1)];
            }
            tags = tags.flatMap(t => {
                if (typeof t === 'string' && t.trim().startsWith('[') && t.trim().endsWith(']')) {
                    try {
                        const parsed = JSON.parse(t);
                        if (Array.isArray(parsed)) return parsed;
                    } catch (e) { }
                }
                return [t];
            });
            if (tags.length === 0) return acc;
            acc.push(...tags);
            return acc;
        }, []);
        const tag1s = [...new Set(flattenedTag1s)];
        const hasEmpty = tabData.some(item => {
            if (!item.tag1) return true;
            if (Array.isArray(item.tag1) && item.tag1.length === 0) return true;
            if (item.tag1 === '[]') return true;
            return false;
        });
        const opts = tag1s.map(t => ({ value: t, label: t }));
        if (hasEmpty) opts.push({ value: '__empty__', label: 'Trống' });
        return opts;
    }, [currentTabData]);

    // Reset to page 1 when tab, search, or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchText, summaryDetailFilter, diagramHtmlFilter, diagramExcalidrawFilter, matplotlibFilter, imgUrlsFilter, detailImageUrlsFilter, showDetailFilter, lessonNumberFilter, relatedCaseFilter, programFilter, datasetFilter]);

    // Calculate how many tags can fit in the container
    useEffect(() => {
        if (!programTagsContainerRef.current || tag4Options.length === 0) {
            setVisibleTagsCount(tag4Options.length);
            return;
        }

        const checkVisibleCount = () => {
            const container = programTagsContainerRef.current;
            if (!container) return;

            // Get container width
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;

            // Get all tags (including hidden ones)
            const tags = container.querySelectorAll('.program-filter-tag:not(.ellipsis-tag)');

            if (tags.length === 0) {
                setVisibleTagsCount(tag4Options.length);
                return;
            }

            // Get parent container to check available width
            const parentContainer = container.parentElement;
            if (!parentContainer) {
                setVisibleTagsCount(tag4Options.length);
                return;
            }

            const parentRect = parentContainer.getBoundingClientRect();
            const label = parentContainer.querySelector('span');
            const clearButton = parentContainer.querySelector('button');

            const labelWidth = label ? label.offsetWidth + 8 : 0; // + gap
            const clearButtonWidth = (clearButton && programFilter.length > 0) ? clearButton.offsetWidth + 8 : 0; // + gap
            const gap = 8;
            const ellipsisTagWidth = 100; // Approximate width for "... (X)" tag

            // Available width for tags
            const availableWidth = parentRect.width - labelWidth - clearButtonWidth - gap;

            // Measure actual tag widths by creating a temporary measurement container
            const measureTag = (text) => {
                const measureEl = document.createElement('span');
                measureEl.style.position = 'absolute';
                measureEl.style.visibility = 'hidden';
                measureEl.style.whiteSpace = 'nowrap';
                measureEl.style.padding = '4px 12px';
                measureEl.style.fontSize = '13px';
                measureEl.textContent = text;
                document.body.appendChild(measureEl);
                const width = measureEl.offsetWidth;
                document.body.removeChild(measureEl);
                return width;
            };

            // First, try to fit all tags without ellipsis
            let totalWidth = 0;
            let count = 0;

            for (let i = 0; i < tag4Options.length; i++) {
                const option = tag4Options[i];
                const tagText = option.label || option.displayName || option.value;
                const tagWidth = measureTag(tagText) + gap;

                if (totalWidth + tagWidth <= availableWidth) {
                    totalWidth += tagWidth;
                    count++;
                } else {
                    break;
                }
            }

            // If we can't fit all tags, check if we can fit more with ellipsis
            if (count < tag4Options.length) {
                // Reserve space for ellipsis
                const availableWithEllipsis = availableWidth - ellipsisTagWidth - gap;
                totalWidth = 0;
                count = 0;

                for (let i = 0; i < tag4Options.length; i++) {
                    const option = tag4Options[i];
                    const tagText = option.label || option.displayName || option.value;
                    const tagWidth = measureTag(tagText) + gap;

                    if (totalWidth + tagWidth <= availableWithEllipsis) {
                        totalWidth += tagWidth;
                        count++;
                    } else {
                        break;
                    }
                }
            }

            // Ensure at least 1 tag is shown
            const finalCount = Math.max(1, Math.min(count, tag4Options.length));
            setVisibleTagsCount(finalCount);
        };

        // Use multiple strategies to ensure recalculation
        let timeoutId1 = setTimeout(checkVisibleCount, 50);
        let timeoutId2 = setTimeout(checkVisibleCount, 200);

        // Use ResizeObserver for container
        let resizeObserver;
        if (window.ResizeObserver && programTagsContainerRef.current) {
            resizeObserver = new ResizeObserver(() => {
                clearTimeout(timeoutId1);
                clearTimeout(timeoutId2);
                timeoutId1 = setTimeout(checkVisibleCount, 50);
                timeoutId2 = setTimeout(checkVisibleCount, 200);
            });
            resizeObserver.observe(programTagsContainerRef.current);

            // Also observe parent container
            const parent = programTagsContainerRef.current.parentElement;
            if (parent) {
                resizeObserver.observe(parent);
            }
        }

        // Listen to window resize and zoom
        const handleResize = () => {
            clearTimeout(timeoutId1);
            clearTimeout(timeoutId2);
            timeoutId1 = setTimeout(checkVisibleCount, 50);
            timeoutId2 = setTimeout(checkVisibleCount, 200);
        };

        window.addEventListener('resize', handleResize);
        // Also listen to zoom changes
        let lastZoom = window.devicePixelRatio;
        const checkZoom = () => {
            const currentZoom = window.devicePixelRatio;
            if (Math.abs(currentZoom - lastZoom) > 0.01) {
                lastZoom = currentZoom;
                handleResize();
            }
        };
        const zoomInterval = setInterval(checkZoom, 100);

        return () => {
            clearTimeout(timeoutId1);
            clearTimeout(timeoutId2);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener('resize', handleResize);
            clearInterval(zoomInterval);
        };
    }, [tag4Options.length, programFilter.length]);

    // Optimize filter with useMemo
    const filteredData = useMemo(() => {
        let data = [...currentTabData];

        // Filter by Bộ dữ liệu (tag1) - OR logic: item satisfies if it has at least one of the selected values
        if (datasetFilter && datasetFilter.length > 0) {
            data = data.filter(item => {
                let parsedTags = [];
                if (Array.isArray(item.tag1)) {
                    parsedTags = item.tag1;
                } else if (typeof item.tag1 === 'string') {
                    try {
                        parsedTags = JSON.parse(item.tag1);
                        if (!Array.isArray(parsedTags)) parsedTags = [item.tag1];
                    } catch (e) {
                        parsedTags = [item.tag1];
                    }
                } else if (item.tag1) {
                    parsedTags = [String(item.tag1)];
                }
                parsedTags = parsedTags.flatMap(t => {
                    if (typeof t === 'string' && t.trim().startsWith('[') && t.trim().endsWith(']')) {
                        try {
                            const p = JSON.parse(t);
                            if (Array.isArray(p)) return p;
                        } catch (e) { }
                    }
                    return [t];
                });
                return datasetFilter.some(selected => {
                    if (selected === '__empty__') return !parsedTags || parsedTags.length === 0;
                    return parsedTags.includes(selected);
                });
            });
        }

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

        // Filter by matplotlib code status (has/none)
        if (matplotlibFilter === 'has') {
            data = data.filter(item => item.matplotlibCode && Array.isArray(item.matplotlibCode) && item.matplotlibCode.length > 0);
        } else if (matplotlibFilter === 'none') {
            data = data.filter(item => !item.matplotlibCode || !Array.isArray(item.matplotlibCode) || item.matplotlibCode.length === 0);
        }

        // Filter by imgUrls status (has/none)
        if (imgUrlsFilter === 'has') {
            data = data.filter(item => item.imgUrls && Array.isArray(item.imgUrls) && item.imgUrls.length > 0);
        } else if (imgUrlsFilter === 'none') {
            data = data.filter(item => !item.imgUrls || !Array.isArray(item.imgUrls) || item.imgUrls.length === 0);
        }

        // Filter by showDetail status (has/none)
        if (showDetailFilter === 'has') {
            data = data.filter(item => item.detail && item.detail.trim() !== '');
        } else if (showDetailFilter === 'none') {
            data = data.filter(item => !item.detail || item.detail.trim() === '');
        }

        // Filter by lessonNumber (text search)
        if (lessonNumberFilter.trim()) {
            const lessonNumberLower = lessonNumberFilter.toLowerCase().trim();
            data = data.filter(item => {
                const lessonNumber = String(item.lessonNumber || '').toLowerCase();
                return lessonNumber.includes(lessonNumberLower);
            });
        }

        // Filter by program (tag4) - OR logic: record matches if it has ANY of the selected programs
        if (programFilter.length > 0) {
            data = data.filter(item => {
                const itemTag4 = item.tag4;
                if (!itemTag4) return false;

                // Handle both array and string formats for tag4
                const itemTag4Array = Array.isArray(itemTag4)
                    ? itemTag4
                    : (itemTag4 ? [itemTag4] : []);

                // Check if any of the selected programs match any of the item's programs
                return programFilter.some(selectedProgram =>
                    itemTag4Array.includes(selectedProgram)
                );
            });
        }

        // Filter by related case count (only for news & document tabs)
        if ((activeTab === 'news' || activeTab === 'document') && relatedCaseFilter !== 'all') {
            data = data.filter(item => {
                const caseCount = getRelatedCaseTrainingCount(item);
                if (relatedCaseFilter === '0') {
                    return caseCount === 0;
                } else {
                    const filterCount = parseInt(relatedCaseFilter, 10);
                    return caseCount === filterCount;
                }
            });
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
    }, [searchText, summaryDetailFilter, diagramHtmlFilter, diagramExcalidrawFilter, matplotlibFilter, imgUrlsFilter, detailImageUrlsFilter, showDetailFilter, lessonNumberFilter, relatedCaseFilter, programFilter, datasetFilter, activeTab, currentTabData, getRelatedCaseTrainingCount]);

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

    const extractPythonCode = (rawCode) => {
        const source = String(rawCode || '').trim();
        if (!source) return '';

        const looksLikeMatplotlib = (txt) => {
            const s = String(txt || '');
            return (
                /import\s+matplotlib/i.test(s) ||
                /import\s+matplotlib\.pyplot/i.test(s) ||
                /plt\./i.test(s) ||
                /savefig\s*\(/i.test(s)
            );
        };

        // Prefer explicit ```python ... ``` block
        const pythonBlockMatch = source.match(/```python\s*([\s\S]*?)```/i);
        if (pythonBlockMatch && pythonBlockMatch[1]) {
            const code = pythonBlockMatch[1].trim();
            return looksLikeMatplotlib(code) ? code : '';
        }

        // Fallback: pick the first fenced block that looks like matplotlib/python
        const allFenced = [];
        const reFenced = /```(?:[a-z]+\s*)?([\s\S]*?)```/gi;
        let m;
        while ((m = reFenced.exec(source)) !== null) {
            if (m[1]) allFenced.push(String(m[1]).trim());
        }
        const good = allFenced.find((blk) => looksLikeMatplotlib(blk));
        if (good) return good;

        // Last resort: strip everything before the first "import matplotlib" occurrence
        const idx = source.search(/import\s+matplotlib/i);
        if (idx >= 0) {
            const maybeCode = source.slice(idx).trim();
            return looksLikeMatplotlib(maybeCode) ? maybeCode : '';
        }

        // Some AI outputs may start with plain "python" line (without fences)
        const withoutLeadingLanguageLine = source.replace(/^\s*python\s*\r?\n/i, '');
        const maybeCode = withoutLeadingLanguageLine.trim();
        return looksLikeMatplotlib(maybeCode) ? maybeCode : '';
    };

    const findMatchingParenIndex = (src, openParenIndex) => {
        // Finds matching closing ')' for the '(' at openParenIndex.
        // Ignores parentheses inside strings and Python line comments (# ...).
        let depth = 0;
        let quote = null; // "'" | '"' | null

        for (let i = openParenIndex; i < src.length; i++) {
            const ch = src[i];

            // Python line comments
            if (!quote && ch === '#') {
                const newlineIdx = src.indexOf('\n', i);
                i = newlineIdx === -1 ? src.length - 1 : newlineIdx - 1;
                continue;
            }

            // Strings
            if (quote) {
                if (ch === '\\') {
                    i += 1; // skip escaped char
                    continue;
                }
                if (ch === quote) quote = null;
                continue;
            }

            if (ch === '"' || ch === "'") {
                quote = ch;
                continue;
            }

            if (ch === '(') depth += 1;
            if (ch === ')') depth -= 1;
            if (depth === 0) return i;
        }
        return -1;
    };

    const getCallStatementRanges = (src, callRegex) => {
        const ranges = [];
        const flags = callRegex.flags.includes('g') ? callRegex.flags : `${callRegex.flags}g`;
        const re = new RegExp(callRegex.source, flags);
        let match;

        while ((match = re.exec(src)) !== null) {
            const matchedText = match[0];
            const openParenIndex = match.index + matchedText.lastIndexOf('(');
            if (openParenIndex < 0) continue;

            const endParenIndex = findMatchingParenIndex(src, openParenIndex);
            if (endParenIndex < 0) continue;

            // Remove whole "statement line" (from line start to end of call line)
            const lineStart = src.lastIndexOf('\n', match.index - 1) + 1;
            let lineEnd = src.indexOf('\n', endParenIndex);
            if (lineEnd === -1) lineEnd = src.length;
            else lineEnd = lineEnd + 1; // include newline

            ranges.push({ start: lineStart, end: lineEnd });
        }

        return ranges;
    };

    const sanitizeCodeForRenderApi = (code) => {
        const text = String(code || '');
        if (!text.trim()) return '';

        // render API handles output image itself; local save/close can break sandbox
        const savefigRanges = getCallStatementRanges(
            text,
            /\b(?:[A-Za-z_]\w*\.)?savefig\s*\(/
        );
        const closeRanges = getCallStatementRanges(
            text,
            /\bplt\.close\s*\(/
        );

        const ranges = [...savefigRanges, ...closeRanges].sort((a, b) => b.start - a.start);
        let out = text;
        for (const r of ranges) {
            out = out.slice(0, r.start) + out.slice(r.end);
        }
        return out.trim();
    };

    const parseBlobErrorMessage = async (error) => {
        try {
            const blob = error?.response?.data;
            if (!blob) return null;
            if (typeof blob === 'string') return blob;
            const text = await blob.text();
            if (!text) return null;
            try {
                const json = JSON.parse(text);
                return json?.message || json?.error || text;
            } catch {
                return text;
            }
        } catch {
            return null;
        }
    };

    const renderMatplotlibPreviewFromCode = async (rawCode) => {
        try {
            const rawPythonCode = extractPythonCode(rawCode);
            if (!rawPythonCode) {
                message.warning('Matplotlib code không hợp lệ (AI trả về mô tả, không phải Python).');
                return;
            }
            setMatplotlibPreviewLoading(true);

            if (matplotlibImgSrcList.length > 0) {
                matplotlibImgSrcList.forEach((src) => URL.revokeObjectURL(src));
                setMatplotlibImgSrcList([]);
            }

            // If AI code contains multiple images (multiple savefig), split it into segments
            // so each render call returns a single image reliably.
            const savefigRanges = getCallStatementRanges(
                rawPythonCode,
                /\b(?:[A-Za-z_]\w*\.)?savefig\s*\(/
            );

            const firstSubplotsIndex = rawPythonCode.search(/plt\.subplots\s*\(/i);
            const firstSubplotsLineStart = firstSubplotsIndex >= 0
                ? rawPythonCode.lastIndexOf('\n', firstSubplotsIndex) + 1
                : 0;
            const prefix = rawPythonCode.slice(0, firstSubplotsLineStart);

            const segments = savefigRanges.length > 0
                ? savefigRanges.map((r) => {
                    const subplotsIndex = rawPythonCode.lastIndexOf('plt.subplots', r.start);
                    const imageStart = subplotsIndex >= 0
                        ? rawPythonCode.lastIndexOf('\n', subplotsIndex) + 1
                        : firstSubplotsLineStart;

                    const imageBlock = rawPythonCode.slice(imageStart, r.end);
                    return `${prefix}\n${imageBlock}`.trim();
                })
                : [rawPythonCode];

            const safeSegments = segments.slice(0, 10);
            if (segments.length !== safeSegments.length) {
                message.warning(`Code có nhiều ảnh hơn (${segments.length}). Chỉ hiển thị tối đa 10 ảnh.`);
            }

            const nextImageUrls = [];
            for (const seg of safeSegments) {
                const segmentCode = sanitizeCodeForRenderApi(seg);
                if (!segmentCode) continue;
                if (!/import\s+matplotlib/i.test(segmentCode) && !/plt\./i.test(segmentCode)) {
                    message.warning('AI trả về không phải Python/Matplotlib. Bỏ qua đoạn không hợp lệ.');
                    continue;
                }

                const { data } = await axios.post(
                    'https://pip.xichtho.vn/render/code',
                    { code: segmentCode },
                    { responseType: 'blob' }
                );
                nextImageUrls.push(URL.createObjectURL(data));
            }

            setMatplotlibImgSrcList(nextImageUrls);
        } catch (error) {
            console.error('Error rendering matplotlib code:', error);
            const apiMessage = await parseBlobErrorMessage(error);
            message.error(apiMessage || 'Không thể render Matplotlib code');
        } finally {
            setMatplotlibPreviewLoading(false);
        }
    };

    const handlePreviewMatplotlibImage = async (record) => {
        const codeList = Array.isArray(record?.matplotlibCode) ? record.matplotlibCode : [];
        const firstCodeRaw = String(codeList[0] || '');

        if (!firstCodeRaw.trim()) {
            message.warning('Không có Matplotlib code để xem');
            return;
        }

        setMatplotlibPreviewTitle(record?.title || `Record #${record?.id}`);
        // Giữ nguyên value gốc để dễ debug lỗi code AI, không format trước khi hiển thị
        setMatplotlibPreviewCode(firstCodeRaw);
        setMatplotlibPreviewDraftCode(firstCodeRaw);
        setMatplotlibPreviewEditing(false);
        setMatplotlibPreviewVisible(true);

        await renderMatplotlibPreviewFromCode(firstCodeRaw);
    };

    const handleRerunMatplotlibPreview = async () => {
        await renderMatplotlibPreviewFromCode(matplotlibPreviewDraftCode);
    };

    const closeMatplotlibPreview = () => {
        setMatplotlibPreviewVisible(false);
        setMatplotlibPreviewLoading(false);
        setMatplotlibPreviewTitle('');
        setMatplotlibPreviewCode('');
        setMatplotlibPreviewDraftCode('');
        setMatplotlibPreviewEditing(false);
        if (matplotlibImgSrcList.length > 0) {
            matplotlibImgSrcList.forEach((src) => URL.revokeObjectURL(src));
            setMatplotlibImgSrcList([]);
        }
    };

    const renderAction = useCallback((_, record) => {
        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 6,
                    alignItems: 'center'
                }}
            >
                <Button
                    type="link"
                    size="small"
                    onClick={() => {
                        setSelectedDetailRecord(record);
                        setDetailModalVisible(true);
                    }}
                    disabled={!record.detail}
                    style={{ color: record.detail ? '#c41a16' : '#999' }}
                >
                    Detail
                </Button>
                <Button
                    type="link"
                    size="small"
                    onClick={() => {
                        setSelectedSummaryDetailRecord(record);
                        setSummaryDetailModalVisible(true);
                    }}
                    disabled={!record.summaryDetail}
                    style={{ color: record.summaryDetail ? 'orange' : '#999' }}
                >
                    SummaryDetail
                </Button>
            </div>
        );
    }, []);

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
        // Related Case Training column - only show in news & document tabs
        ...((activeTab === 'news' || activeTab === 'document') ? [{
            title: 'Case liên quan',
            key: 'relatedCaseTraining',
            width: 120,
            render: (_, record) => {
                const count = getRelatedCaseTrainingCount(record);
                return (
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handleOpenRelatedCaseTrainingModal(record)}
                        loading={loadingRelatedCaseTraining && selectedNewsItemForCaseTraining?.id === record.id}
                        style={{
                            color: count > 0 ? '#1890ff' : '#999',
                            fontWeight: count > 0 ? '600' : 'normal'
                        }}
                    >
                        {count > 0 ? `${count} bài` : '0 bài'}
                    </Button>
                );
            },
        }] : []),
        {
            title: 'Lesson Number',
            dataIndex: 'lessonNumber',
            key: 'lessonNumber',
            width: 160,
            render: (lessonNumber) => {
                if (!lessonNumber) return '-';
                const lessonNumberStr = String(lessonNumber);
                return (
                    <Tooltip title={lessonNumberStr}>
                        <Tag
                            color="purple"
                            style={{
                                maxWidth: '140px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'inline-block'
                            }}
                        >
                            {lessonNumberStr}
                        </Tag>
                    </Tooltip>
                );
            },
            sorter: (a, b) => {
                const aVal = String(a.lessonNumber || '').toLowerCase();
                const bVal = String(b.lessonNumber || '').toLowerCase();
                return aVal.localeCompare(bVal);
            },
        },
        {
            title: 'Program',
            dataIndex: 'tag4',
            key: 'tag4',
            width: 400,
            render: (tag4) => {
                if (!tag4) return '-';
                const text = Array.isArray(tag4) ? tag4.join(', ') : String(tag4);
                return (
                    <div style={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        lineHeight: '1.5'
                    }}>
                        {text}
                    </div>
                );
            },
            sorter: (a, b) => {
                const aVal = Array.isArray(a.tag4) ? a.tag4.join(', ') : (a.tag4 || '');
                const bVal = Array.isArray(b.tag4) ? b.tag4.join(', ') : (b.tag4 || '');
                return aVal.localeCompare(bVal);
            },
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
            title: <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>Matplotlib Code</span>,
            key: 'diagramMatplotlibCode',
            width: 120,
            render: (_, record) => {
                const hasMatplotlib = record.matplotlibCode &&
                    Array.isArray(record.matplotlibCode) &&
                    record.matplotlibCode.length > 0;

                if (hasMatplotlib) {
                    return (
                        <div
                            onClick={() => handlePreviewMatplotlibImage(record)}
                            style={{
                                width: 40,
                                height: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fff7e6',
                                borderRadius: '4px',
                                border: '1px solid #ffd591',
                                cursor: 'pointer'
                            }}
                            title={`Matplotlib code (${record.matplotlibCode.length}) - Click để xem`}
                        >
                            <FileTextOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />
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
                        title="Chưa tạo Matplotlib code từ SummaryDetail"
                    >
                        <FileTextOutlined style={{ fontSize: '16px', color: '#999' }} />
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
            title: <span style={{ color: '#722ed1', fontWeight: 'bold' }}>detailImageUrls</span>,
            key: 'detailImageUrls',
            width: 120,
            render: (_, record) => {
                // Kiểm tra detailImageUrls (là mảng các object JSON)
                const hasDetailImageUrls = record.detailImageUrls && Array.isArray(record.detailImageUrls) && record.detailImageUrls.length > 0;

                if (hasDetailImageUrls) {
                    // Lấy ảnh đầu tiên để hiển thị thumbnail
                    const firstImage = record.detailImageUrls[0];
                    const thumbnailUrl = typeof firstImage === 'string' ? firstImage : (firstImage?.url || firstImage?.image_url || '');

                    return (
                        <div
                            onClick={() => {
                                setPreviewingDetailImageUrlsRecord(record);
                                setDetailImageUrlsPreviewModalVisible(true);
                            }}
                            style={{
                                width: 50,
                                height: 50,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f9f0ff',
                                borderRadius: '8px',
                                border: '2px solid #d3adf7',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                position: 'relative',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(114, 46, 209, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                            title={`detailImageUrls từ Detail (${record.detailImageUrls.length} ảnh) - Click để xem`}
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
                                <FileImageOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
                            )}
                            {record.detailImageUrls.length > 1 && (
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
                                    {record.detailImageUrls.length}
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
                        title="Chưa tạo detailImageUrls từ Detail"
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
                                    document: updater(prev.document || []),
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
                                    document: updater(prev.document || []),
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
            title: <span style={{ fontSize: '12px' }}>Hiển thị Matplotlib</span>,
            key: 'showMatplotlib',
            width: 135,
            render: (_, record) => {
                const hasMatplotlib = record.matplotlibCode && Array.isArray(record.matplotlibCode) && record.matplotlibCode.length > 0;

                return (
                    <Switch
                        checked={record.showMatplotlib !== false}
                        disabled={!hasMatplotlib}
                        onChange={async (checked) => {
                            try {
                                const updateData = {
                                    id: record.id,
                                    showMatplotlib: checked
                                };
                                const updateResponse = await updateK9(updateData);
                                const updatedRecord = updateResponse?.data || updateResponse;
                                const updater = (list) => list.map(item =>
                                    item.id === record.id ? { ...item, ...updatedRecord } : item
                                );
                                setK9Data(prev => ({
                                    news: updater(prev.news || []),
                                    document: updater(prev.document || []),
                                    caseTraining: updater(prev.caseTraining || []),
                                    longForm: updater(prev.longForm || []),
                                    home: updater(prev.home || []),
                                }));
                                message.success(`Đã ${checked ? 'bật' : 'tắt'} hiển thị Matplotlib`);
                            } catch (error) {
                                console.error('Error updating showMatplotlib:', error);
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
                                    document: updater(prev.document || []),
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
            title: <span style={{ fontSize: '12px' }}>Hiển thị detailImageUrls</span>,
            key: 'showDetailImageUrls',
            width: 150,
            render: (_, record) => {
                const hasDetailImageUrls = record.detailImageUrls && Array.isArray(record.detailImageUrls) && record.detailImageUrls.length > 0;

                return (
                    <Switch
                        checked={record.showDetailImageUrls !== false} // Default true nếu không có giá trị
                        disabled={!hasDetailImageUrls}
                        onChange={async (checked) => {
                            try {
                                const updateData = {
                                    id: record.id,
                                    showDetailImageUrls: checked
                                };
                                const updateResponse = await updateK9(updateData);
                                const updatedRecord = updateResponse?.data || updateResponse;
                                const updater = (list) => list.map(item =>
                                    item.id === record.id ? { ...item, ...updatedRecord } : item
                                );
                                setK9Data(prev => ({
                                    news: updater(prev.news || []),
                                    document: updater(prev.document || []),
                                    caseTraining: updater(prev.caseTraining || []),
                                    longForm: updater(prev.longForm || []),
                                    home: updater(prev.home || []),
                                }));
                                message.success(`Đã ${checked ? 'bật' : 'tắt'} hiển thị detailImageUrls`);
                            } catch (error) {
                                console.error('Error updating showDetailImageUrls:', error);
                                message.error('Cập nhật thất bại!');
                            }
                        }}
                        size="small"
                    />
                );
            }
        },
        {
            title: <span style={{ fontSize: '12px' }}>Hiển thị Detail</span>,
            key: 'showDetail',
            width: 120,
            render: (_, record) => {
                const hasDetail = record.detail && record.detail.trim() !== '';

                return (
                    <Switch
                        checked={record.showDetail !== false} // Default true nếu không có giá trị
                        disabled={!hasDetail}
                        onChange={async (checked) => {
                            try {
                                const updateData = {
                                    id: record.id,
                                    showDetail: checked
                                };
                                const updateResponse = await updateK9(updateData);
                                const updatedRecord = updateResponse?.data || updateResponse;
                                const updater = (list) => list.map(item =>
                                    item.id === record.id ? { ...item, ...updatedRecord } : item
                                );
                                setK9Data(prev => ({
                                    news: updater(prev.news || []),
                                    document: updater(prev.document || []),
                                    caseTraining: updater(prev.caseTraining || []),
                                    longForm: updater(prev.longForm || []),
                                    home: updater(prev.home || []),
                                }));
                                message.success(`Đã ${checked ? 'bật' : 'tắt'} hiển thị Detail`);
                            } catch (error) {
                                console.error('Error updating showDetail:', error);
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
            width: 250,
            fixed: 'right',
            render: renderAction,
        },
    ], [renderDetail, renderSummaryDetail, renderAction, activeTab, getRelatedCaseTrainingCount, handleOpenRelatedCaseTrainingModal, loadingRelatedCaseTraining, selectedNewsItemForCaseTraining]);

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
                        <Input
                            placeholder="Tìm kiếm ID, CID, Title, Summary, Detail..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: '260px' }}
                            allowClear
                            size="small"
                        />
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

                {/* Row 2: Bộ lọc - Collapsible */}
                <Collapse
                    ghost
                    size="small"
                    defaultActiveKey={['filters']}
                    style={{ marginBottom: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #f0f0f0' }}
                    items={[{
                        key: 'filters',
                        label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FilterOutlined />
                                <span style={{ fontWeight: 500 }}>Bộ lọc</span>
                            </span>
                        ),
                        children: (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '12px 24px',
                                padding: '4px 0'
                            }}>
                                {
                                    (activeTab === 'news' || activeTab === 'document') && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '90px' }}>Bộ dữ liệu:</span>
                                            <Select
                                                mode="multiple"
                                                value={datasetFilter}
                                                onChange={setDatasetFilter}
                                                style={{ flex: 1, minWidth: 160 }}
                                                placeholder="Chọn bộ dữ liệu (chỉ cần có 1)"
                                                showSearch
                                                filterOption={(input, option) =>
                                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                }
                                                maxTagCount="responsive"
                                                options={datasetOptions}
                                                size="small"
                                            />
                                        </div>
                                    )
                                }

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '90px' }}>SummaryDetail:</span>
                                    <Select
                                        value={summaryDetailFilter}
                                        onChange={setSummaryDetailFilter}
                                        style={{ width: 120 }}
                                        size="small"
                                    >
                                        <Select.Option value="all">Tất cả</Select.Option>
                                        <Select.Option value="has">Đã có</Select.Option>
                                        <Select.Option value="none">Chưa có</Select.Option>
                                    </Select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '90px' }}>DiagramHtml:</span>
                                    <Select
                                        value={diagramHtmlFilter}
                                        onChange={setDiagramHtmlFilter}
                                        style={{ width: 120 }}
                                        size="small"
                                    >
                                        <Select.Option value="all">Tất cả</Select.Option>
                                        <Select.Option value="has">Đã có</Select.Option>
                                        <Select.Option value="none">Chưa có</Select.Option>
                                    </Select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '90px' }}>DiagramExcalidraw:</span>
                                    <Select
                                        value={diagramExcalidrawFilter}
                                        onChange={setDiagramExcalidrawFilter}
                                        style={{ width: 120 }}
                                        size="small"
                                    >
                                        <Select.Option value="all">Tất cả</Select.Option>
                                        <Select.Option value="has">Đã có</Select.Option>
                                        <Select.Option value="none">Chưa có</Select.Option>
                                    </Select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '90px' }}>Matplotlib:</span>
                                    <Select
                                        value={matplotlibFilter}
                                        onChange={setMatplotlibFilter}
                                        style={{ width: 120 }}
                                        size="small"
                                    >
                                        <Select.Option value="all">Tất cả</Select.Option>
                                        <Select.Option value="has">Đã có</Select.Option>
                                        <Select.Option value="none">Chưa có</Select.Option>
                                    </Select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '90px' }}>ImgUrls:</span>
                                    <Select
                                        value={imgUrlsFilter}
                                        onChange={setImgUrlsFilter}
                                        style={{ width: 120 }}
                                        size="small"
                                    >
                                        <Select.Option value="all">Tất cả</Select.Option>
                                        <Select.Option value="has">Đã có</Select.Option>
                                        <Select.Option value="none">Chưa có</Select.Option>
                                    </Select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '90px' }}>detailImageUrls:</span>
                                    <Select
                                        value={detailImageUrlsFilter}
                                        onChange={setDetailImageUrlsFilter}
                                        style={{ width: 120 }}
                                        size="small"
                                    >
                                        <Select.Option value="all">Tất cả</Select.Option>
                                        <Select.Option value="has">Đã có</Select.Option>
                                        <Select.Option value="none">Chưa có</Select.Option>
                                    </Select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '90px' }}>ShowDetail:</span>
                                    <Select
                                        value={showDetailFilter}
                                        onChange={setShowDetailFilter}
                                        style={{ width: 120 }}
                                        size="small"
                                    >
                                        <Select.Option value="all">Tất cả</Select.Option>
                                        <Select.Option value="has">Đã có</Select.Option>
                                        <Select.Option value="none">Chưa có</Select.Option>
                                    </Select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '90px' }}>LessonNumber:</span>
                                    <Input
                                        placeholder="Tìm..."
                                        value={lessonNumberFilter}
                                        onChange={(e) => setLessonNumberFilter(e.target.value)}
                                        style={{ width: 120 }}
                                        allowClear
                                        size="small"
                                    />
                                </div>
                                {(activeTab === 'news' || activeTab === 'document') && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '90px' }}>Case liên quan:</span>
                                        <Select
                                            value={relatedCaseFilter}
                                            onChange={setRelatedCaseFilter}
                                            style={{ width: 120 }}
                                            size="small"
                                        >
                                            <Select.Option value="all">Tất cả</Select.Option>
                                            <Select.Option value="0">Không có</Select.Option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(num => (
                                                <Select.Option key={num} value={String(num)}>{num} case</Select.Option>
                                            ))}
                                        </Select>
                                    </div>
                                )}
                            </div>
                        ),
                    }]}
                />

                {/* Row 2: Program Filter Tags */}
                {tag4Options.length > 0 && (
                    <div
                        style={{
                            marginBottom: '12px',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            flexWrap: 'nowrap',
                            width: '100%',
                            overflow: 'hidden',
                            boxSizing: 'border-box'
                        }}
                    >
                        <span style={{ fontSize: '13px', fontWeight: 500, flexShrink: 0 }}>Lọc Program:</span>
                        <div
                            ref={programTagsContainerRef}
                            style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                                flexWrap: 'nowrap',
                                overflow: 'hidden',
                                flex: 1,
                                minWidth: 0,
                                boxSizing: 'border-box',
                                position: 'relative'
                            }}
                        >
                            {tag4Options.map((option, index) => {
                                const isSelected = programFilter.includes(option.value);
                                const isVisible = index < visibleTagsCount;

                                return (
                                    <Tag
                                        key={option.value}
                                        className="program-filter-tag"
                                        onClick={() => {
                                            if (isSelected) {
                                                setProgramFilter(prev => prev.filter(p => p !== option.value));
                                            } else {
                                                setProgramFilter(prev => [...prev, option.value]);
                                            }
                                        }}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '4px 12px',
                                            fontSize: '13px',
                                            border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                            backgroundColor: isSelected ? '#e6f7ff' : '#fafafa',
                                            color: isSelected ? '#1890ff' : '#595959',
                                            fontWeight: isSelected ? 600 : 400,
                                            transition: 'all 0.2s ease',
                                            userSelect: 'none',
                                            flexShrink: 0,
                                            whiteSpace: 'nowrap',
                                            display: isVisible ? 'inline-flex' : 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = '#f0f0f0';
                                                e.currentTarget.style.borderColor = '#40a9ff';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = '#fafafa';
                                                e.currentTarget.style.borderColor = '#d9d9d9';
                                            }
                                        }}
                                    >
                                        {option.label || option.displayName || option.value}
                                    </Tag>
                                );
                            })}
                            {visibleTagsCount < tag4Options.length && (
                                <Dropdown
                                    menu={{
                                        items: tag4Options.slice(visibleTagsCount).map(option => {
                                            const isSelected = programFilter.includes(option.value);
                                            return {
                                                key: option.value,
                                                label: (
                                                    <div
                                                        style={{
                                                            padding: '4px 8px',
                                                            backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                                                            borderRadius: '4px',
                                                            color: isSelected ? '#1890ff' : '#595959',
                                                            fontWeight: isSelected ? 600 : 400
                                                        }}
                                                    >
                                                        {isSelected && '✓ '}
                                                        {option.label || option.displayName || option.value}
                                                    </div>
                                                ),
                                                onClick: () => {
                                                    if (isSelected) {
                                                        setProgramFilter(prev => prev.filter(p => p !== option.value));
                                                    } else {
                                                        setProgramFilter(prev => [...prev, option.value]);
                                                    }
                                                }
                                            };
                                        })
                                    }}
                                    trigger={['click']}
                                >
                                    <Tag
                                        className="ellipsis-tag"
                                        style={{
                                            cursor: 'pointer',
                                            padding: '4px 12px',
                                            fontSize: '13px',
                                            border: '1px solid #d9d9d9',
                                            backgroundColor: '#fafafa',
                                            color: '#595959',
                                            flexShrink: 0,
                                            whiteSpace: 'nowrap'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                                            e.currentTarget.style.borderColor = '#40a9ff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#fafafa';
                                            e.currentTarget.style.borderColor = '#d9d9d9';
                                        }}
                                    >
                                        ... ({tag4Options.length - visibleTagsCount})
                                    </Tag>
                                </Dropdown>
                            )}
                        </div>
                        {programFilter.length > 0 && (
                            <Button
                                type="link"
                                size="small"
                                onClick={() => setProgramFilter([])}
                                style={{ fontSize: '12px', padding: '0 4px', height: 'auto', flexShrink: 0 }}
                            >
                                Xóa tất cả
                            </Button>
                        )}
                    </div>
                )}

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
                        icon={<FileTextOutlined />}
                        onClick={handleBulkCreateMatplotlibFromSummaryDetail}
                        disabled={selectedRowKeys.length === 0 || processingMatplotlibQueue}
                        loading={processingMatplotlibQueue}
                        size="small"
                    >
                        Tạo Matplotlib ({selectedRowKeys.length})
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
                    <Button
                        type="default"
                        icon={<FileImageOutlined />}
                        onClick={handleBulkCreateMultiImageFromDetail}
                        disabled={selectedRowKeys.length === 0 || processingMultiImageFromDetailQueue}
                        loading={processingMultiImageFromDetailQueue}
                        size="small"
                    >
                        Tạo Nhiều ảnh từ Detail ({selectedRowKeys.length})
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
                    {(matplotlibQueue.length > 0 || currentMatplotlibProcessing) && (
                        <Button
                            type="default"
                            icon={<FileTextOutlined />}
                            onClick={() => setMatplotlibQueueModalVisible(true)}
                            size="small"
                        >
                            Queue Matplotlib ({matplotlibQueue.length + (currentMatplotlibProcessing ? 1 : 0)})
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
                    {(multiImageFromDetailQueue.length > 0 || currentMultiImageFromDetailProcessing) && (
                        <Button
                            type="default"
                            icon={<FileImageOutlined />}
                            onClick={() => setMultiImageFromDetailQueueModalVisible(true)}
                            size="small"
                        >
                            Queue Nhiều ảnh từ Detail ({multiImageFromDetailQueue.length + (currentMultiImageFromDetailProcessing ? 1 : 0)})
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
                                disabled={loading || deletingSummaryDetail || deletingHtml || deletingExcalidraw || deletingMatplotlib || deletingImgUrls || deletingDetailImageUrls}
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
                                disabled={loading || deletingSummaryDetail || deletingHtml || deletingExcalidraw || deletingMatplotlib || deletingImgUrls || deletingDetailImageUrls}
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
                                disabled={loading || deletingSummaryDetail || deletingHtml || deletingExcalidraw || deletingMatplotlib || deletingImgUrls || deletingDetailImageUrls}
                                size="small"
                            >
                                Xóa Excalidraw
                            </Button>
                        </Popconfirm>

                        <Popconfirm
                            title="Xác nhận xóa Matplotlib code"
                            description={`Bạn có chắc chắn muốn xóa Matplotlib code cho ${selectedRowKeys.length} bản ghi đã chọn?`}
                            onConfirm={handleBulkDeleteMatplotlibFromSummaryDetail}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<FileTextOutlined />}
                                loading={deletingMatplotlib}
                                disabled={loading || deletingSummaryDetail || deletingHtml || deletingExcalidraw || deletingMatplotlib || deletingImgUrls || deletingDetailImageUrls}
                                size="small"
                            >
                                Xóa Matplotlib
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
                                disabled={loading || deletingSummaryDetail || deletingHtml || deletingExcalidraw || deletingMatplotlib || deletingImgUrls || deletingDetailImageUrls}
                                size="small"
                            >
                                Xóa ImgUrls
                            </Button>
                        </Popconfirm>

                        <Popconfirm
                            title="Xác nhận xóa detailImageUrls"
                            description={`Bạn có chắc chắn muốn xóa detailImageUrls cho ${selectedRowKeys.length} bản ghi đã chọn?`}
                            onConfirm={handleBulkDeleteDetailImageUrls}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<FileImageOutlined />}
                                loading={deletingDetailImageUrls}
                                disabled={loading || deletingSummaryDetail || deletingHtml || deletingExcalidraw || deletingMatplotlib || deletingImgUrls || deletingDetailImageUrls}
                                size="small"
                            >
                                Xóa DetailImageUrls
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
                            icon={<FileTextOutlined />}
                            onClick={() => handleBulkToggleShowMatplotlib(true)}
                            loading={togglingShowMatplotlib}
                            disabled={selectedRowKeys.length === 0 || togglingShowMatplotlib}
                            size="small"
                        >
                            Bật Matplotlib
                        </Button>
                        <Button
                            type="default"
                            icon={<FileTextOutlined />}
                            onClick={() => handleBulkToggleShowMatplotlib(false)}
                            loading={togglingShowMatplotlib}
                            disabled={selectedRowKeys.length === 0 || togglingShowMatplotlib}
                            size="small"
                        >
                            Tắt Matplotlib
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

                        <Button
                            type="default"
                            icon={<FileImageOutlined />}
                            onClick={() => handleBulkToggleShowDetailImageUrls(true)}
                            loading={togglingShowDetailImageUrls}
                            disabled={selectedRowKeys.length === 0 || togglingShowDetailImageUrls}
                            size="small"
                        >
                            Bật detailImageUrls
                        </Button>
                        <Button
                            type="default"
                            icon={<FileImageOutlined />}
                            onClick={() => handleBulkToggleShowDetailImageUrls(false)}
                            loading={togglingShowDetailImageUrls}
                            disabled={selectedRowKeys.length === 0 || togglingShowDetailImageUrls}
                            size="small"
                        >
                            Tắt detailImageUrls
                        </Button>

                        <Button
                            type="default"
                            icon={<FileTextOutlined />}
                            onClick={() => handleBulkToggleShowDetail(true)}
                            loading={togglingShowDetail}
                            disabled={selectedRowKeys.length === 0 || togglingShowDetail}
                            size="small"
                        >
                            Bật Detail
                        </Button>
                        <Button
                            type="default"
                            icon={<FileTextOutlined />}
                            onClick={() => handleBulkToggleShowDetail(false)}
                            loading={togglingShowDetail}
                            disabled={selectedRowKeys.length === 0 || togglingShowDetail}
                            size="small"
                        >
                            Tắt Detail
                        </Button>
                    </div>
                )}

                {/* Tabs */}
                <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
                    <TabPane
                        tab={<span>Lý thuyết <Badge count={k9Data.news?.length || 0} size="small" overflowCount={999999} /></span>}
                        key="news"
                    />
                    <TabPane
                        tab={<span>Tài liệu học tập <Badge count={k9Data.document?.length || 0} size="small" overflowCount={999999} /></span>}
                        key="document"
                    />
                    <TabPane
                        tab={<span>Case Training <Badge count={k9Data.caseTraining?.length || 0} size="small" overflowCount={999999} /></span>}
                        key="caseTraining"
                    />
                    <TabPane
                        tab={<span>Kho tài nguyên <Badge count={k9Data.longForm?.length || 0} size="small" overflowCount={999999} /></span>}
                        key="longForm"
                    />
                    <TabPane
                        tab={<span>Về AiMBA <Badge count={k9Data.home?.length || 0} size="small" overflowCount={999999} /></span>}
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
                        document: updater(prev.document || []),
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
                        document: updater(prev.document || []),
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
                <div style={{ height: '100', overflow: 'auto' }}>
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
                </div>
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
                <div style={{ height: '100', overflow: 'auto' }}>
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
                </div>

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
                <div style={{ height: '100%', overflow: 'auto' }}>
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
                </div>
            </Modal>

            {/* Matplotlib Queue Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileTextOutlined />
                        <span>Matplotlib Generation Queue</span>
                    </div>
                }
                open={matplotlibQueueModalVisible}
                onCancel={() => setMatplotlibQueueModalVisible(false)}
                width={900}
                footer={[
                    <Button key="close" onClick={() => setMatplotlibQueueModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
            >
                <div style={{ height: '100%', overflow: 'auto' }}>
                    {currentMatplotlibProcessing && (
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
                                        <div><strong>{currentMatplotlibProcessing.title}</strong></div>
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                            Record ID: {currentMatplotlibProcessing.recordId}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {matplotlibQueue.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h5>📝 Hàng đợi ({matplotlibQueue.length})</h5>
                            {matplotlibQueue.map((task, index) => (
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
                    {matplotlibQueueResults.length > 0 && (
                        <div>
                            <h5>📊 Kết quả ({matplotlibQueueResults.length})</h5>
                            {matplotlibQueueResults.map((result, index) => (
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
                </div>

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

            <Modal
                title={`Xem Matplotlib - ${matplotlibPreviewTitle || ''}`}
                open={matplotlibPreviewVisible}
                onCancel={closeMatplotlibPreview}
                footer={null}
                width={1700}
                className={styles.matplotlibPreviewModal}
                style={{
                    top : '10px',
                    paddingBottom : '0px'
                }}
            >
                <div style={{
                    display: 'flex',
                    gap: 16,
                    height: '100%',
                    overflow: 'hidden',
                    alignItems: 'stretch'
                }}>
                    <div style={{
                        flex: '0 0 48%',
                        maxWidth: '48%',
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                        overflow: 'auto',
                        background: '#fafafa',
                        padding: 10
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                            <Space size={8}>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setMatplotlibPreviewEditing(true);
                                    }}
                                    disabled={matplotlibPreviewEditing}
                                >
                                    Chỉnh sửa
                                </Button>
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={handleRerunMatplotlibPreview}
                                    loading={matplotlibPreviewLoading}
                                >
                                    Run lại
                                </Button>
                                {matplotlibPreviewEditing && (
                                    <Button
                                        type="primary"
                                        size="small"
                                        onClick={() => {
                                            setMatplotlibPreviewCode(matplotlibPreviewDraftCode);
                                            setMatplotlibPreviewEditing(false);
                                            message.success('Đã lưu thay đổi code');
                                        }}
                                    >
                                        Lưu
                                    </Button>
                                )}
                                {matplotlibPreviewEditing && (
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setMatplotlibPreviewDraftCode(matplotlibPreviewCode);
                                            setMatplotlibPreviewEditing(false);
                                        }}
                                    >
                                        Hủy sửa
                                    </Button>
                                )}
                            </Space>
                        </div>
                        {matplotlibPreviewEditing ? (
                            <TextArea
                                value={matplotlibPreviewDraftCode}
                                onChange={(e) => setMatplotlibPreviewDraftCode(e.target.value)}
                                autoSize={false}
                                spellCheck={false}
                                style={{
                                    height: '72vh',
                                    fontSize: 12,
                                    fontFamily: 'monospace',
                                    lineHeight: 1.35
                                }}
                                placeholder="// (Không có code để hiển thị)"
                            />
                        ) : (
                            <pre style={{
                                margin: 0,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontSize: 12,
                                fontFamily: 'monospace',
                                lineHeight: 1.35
                            }}>
                                {matplotlibPreviewCode || '// (Không có code để hiển thị)'}
                            </pre>
                        )}
                    </div>

                    <div style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'auto'
                    }}>
                        {matplotlibPreviewLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                                <LoadingOutlined spin style={{ fontSize: 32 }} />
                            </div>
                        ) : matplotlibImgSrcList.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                gap: 12
                            }}>
                                {matplotlibImgSrcList.map((src, idx) => (
                                    <div key={idx} style={{ textAlign: 'center' }}>
                                        <img
                                            src={src}
                                            alt={`Matplotlib render ${idx + 1}`}
                                            style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', border: '1px solid #f0f0f0' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty description="Chưa có dữ liệu ảnh để hiển thị" />
                        )}
                    </div>
                </div>
            </Modal>  

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
                visible={selectMatplotlibPromptModalVisible}
                onCancel={() => {
                    setSelectMatplotlibPromptModalVisible(false);
                    setPendingMatplotlibRecord(null);
                    setPendingMatplotlibRecords([]);
                }}
                onSelect={(prompt) => {
                    if (pendingMatplotlibRecord) {
                        handleMatplotlibPromptSelected(prompt);
                    } else if (pendingMatplotlibRecords.length > 0) {
                        handleBulkMatplotlibPromptSelected(prompt);
                    }
                }}
                promptType="MATPLOTLIB_FROM_SUMMARYDETAIL_PROMPTS"
                title="Chọn cài đặt Prompt - Matplotlib từ SummaryDetail"
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

            <SelectPromptModal
                visible={selectMultiImageFromDetailPromptModalVisible}
                onCancel={() => {
                    setSelectMultiImageFromDetailPromptModalVisible(false);
                    setPendingMultiImageFromDetailRecord(null);
                    setPendingMultiImageFromDetailRecords([]);
                }}
                onSelect={(prompt) => {
                    if (pendingMultiImageFromDetailRecord) {
                        handleMultiImageFromDetailPromptSelected(prompt);
                    } else if (pendingMultiImageFromDetailRecords.length > 0) {
                        handleBulkMultiImageFromDetailPromptSelected(prompt);
                    }
                }}
                promptType="MULTI_IMAGE_FROM_DETAIL_PROMPTS"
                title="Chọn cài đặt Prompt - Tạo nhiều ảnh từ Detail"
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

            {/* Multi Image from Detail Queue Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileImageOutlined />
                        <span>Multi Image from Detail Generation Queue</span>
                    </div>
                }
                open={multiImageFromDetailQueueModalVisible}
                onCancel={() => setMultiImageFromDetailQueueModalVisible(false)}
                width={900}
                footer={[
                    <Button key="close" onClick={() => setMultiImageFromDetailQueueModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
            >
                {currentMultiImageFromDetailProcessing && (
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
                                    <div><strong>{currentMultiImageFromDetailProcessing.title}</strong></div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Record ID: {currentMultiImageFromDetailProcessing.recordId}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {multiImageFromDetailQueue.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <h5>📝 Hàng đợi ({multiImageFromDetailQueue.length})</h5>
                        {multiImageFromDetailQueue.map((task, index) => (
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
                {multiImageFromDetailQueueResults.length > 0 && (
                    <div>
                        <h5>📊 Kết quả ({multiImageFromDetailQueueResults.length})</h5>
                        {multiImageFromDetailQueueResults.map((result, index) => (
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

            {/* Multi Image from Detail Queue Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileImageOutlined />
                        <span>Multi Image from Detail Generation Queue</span>
                    </div>
                }
                open={multiImageFromDetailQueueModalVisible}
                onCancel={() => setMultiImageFromDetailQueueModalVisible(false)}
                width={900}
                footer={[
                    <Button key="close" onClick={() => setMultiImageFromDetailQueueModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
            >
                {currentMultiImageFromDetailProcessing && (
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
                                    <div><strong>{currentMultiImageFromDetailProcessing.title}</strong></div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Record ID: {currentMultiImageFromDetailProcessing.recordId}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {multiImageFromDetailQueue.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <h5>📝 Hàng đợi ({multiImageFromDetailQueue.length})</h5>
                        {multiImageFromDetailQueue.map((task, index) => (
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
                {multiImageFromDetailQueueResults.length > 0 && (
                    <div>
                        <h5>📊 Kết quả ({multiImageFromDetailQueueResults.length})</h5>
                        {multiImageFromDetailQueueResults.map((result, index) => (
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
                        height: '100%',
                        width: '100%',
                        overflow: 'auto',
                        position: 'relative',
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
                                                                        document: updater(prev.document || []),
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

            {/* Preview detailImageUrls Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileImageOutlined style={{ color: '#722ed1', fontSize: '20px' }} />
                        <span style={{ fontSize: '18px', fontWeight: 600 }}>
                            {previewingDetailImageUrlsRecord?.title || 'Preview detailImageUrls'}
                        </span>
                        {previewingDetailImageUrlsRecord?.detailImageUrls && Array.isArray(previewingDetailImageUrlsRecord.detailImageUrls) && (
                            <Tag color="purple" style={{ fontSize: '13px', padding: '4px 12px' }}>
                                {previewingDetailImageUrlsRecord.detailImageUrls.length} ảnh
                            </Tag>
                        )}
                    </div>
                }
                open={detailImageUrlsPreviewModalVisible}
                onCancel={() => {
                    setDetailImageUrlsPreviewModalVisible(false);
                    setPreviewingDetailImageUrlsRecord(null);
                    setEditingDescriptions({});
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setDetailImageUrlsPreviewModalVisible(false);
                        setPreviewingDetailImageUrlsRecord(null);
                    }}>
                        Đóng
                    </Button>
                ]}
                width={1400}
                className={styles.modalContent}
            >

                {previewingDetailImageUrlsRecord?.detailImageUrls && Array.isArray(previewingDetailImageUrlsRecord.detailImageUrls) && previewingDetailImageUrlsRecord.detailImageUrls.length > 0 ? (
                    <div style={{
                        height: '100%',
                        width: '100%',
                        overflow: 'auto',
                        position: 'relative',
                        marginTop: '16px'
                    }}>
                        {previewingDetailImageUrlsRecord.detailImageUrls.map((imgItem, index) => {
                            const imageUrl = typeof imgItem === 'string' ? imgItem : (imgItem?.url || imgItem?.image_url || '');
                            const description = typeof imgItem === 'object' ? imgItem?.description : '';
                            const partNumber = typeof imgItem === 'object' ? imgItem?.partNumber : (index + 1);
                            const partContent = typeof imgItem === 'object' ? imgItem?.partContent : '';
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
                                        marginBottom: '16px'
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
                                                backgroundColor: 'rgba(114, 46, 209, 0.85)',
                                                color: 'white',
                                                padding: '2px 10px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                backdropFilter: 'blur(4px)'
                                            }}>
                                                Phần {partNumber}
                                            </div>
                                            {/* Upload Button */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                right: '8px',
                                                display: 'flex',
                                                gap: '8px'
                                            }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    id={`upload-detail-image-${index}`}
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        try {
                                                            setUploadingImageIndex(index);
                                                            message.loading('Đang upload ảnh...', 0);

                                                            // Upload file
                                                            const response = await uploadFiles([file]);
                                                            const newImageUrl = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';

                                                            if (!newImageUrl) {
                                                                throw new Error('Upload ảnh thất bại');
                                                            }

                                                            // Update detailImageUrls với URL mới, giữ nguyên partContent và description
                                                            const updatedDetailImageUrls = [...previewingDetailImageUrlsRecord.detailImageUrls];
                                                            updatedDetailImageUrls[index] = {
                                                                ...updatedDetailImageUrls[index],
                                                                url: newImageUrl
                                                            };

                                                            const updateData = {
                                                                id: previewingDetailImageUrlsRecord.id,
                                                                detailImageUrls: updatedDetailImageUrls
                                                            };

                                                            const updateResponse = await updateK9(updateData);
                                                            const updatedRecord = updateResponse?.data || updateResponse;

                                                            // Update local state
                                                            const updater = (list) => list.map(item =>
                                                                item.id === previewingDetailImageUrlsRecord.id
                                                                    ? { ...item, ...updatedRecord }
                                                                    : item
                                                            );

                                                            setK9Data(prev => ({
                                                                news: updater(prev.news || []),
                                                                document: updater(prev.document || []),
                                                                caseTraining: updater(prev.caseTraining || []),
                                                                longForm: updater(prev.longForm || []),
                                                                home: updater(prev.home || []),
                                                            }));

                                                            // Update previewing record
                                                            setPreviewingDetailImageUrlsRecord(prev => ({
                                                                ...prev,
                                                                detailImageUrls: updatedDetailImageUrls
                                                            }));

                                                            message.destroy();
                                                            message.success('Upload ảnh thành công!');
                                                        } catch (error) {
                                                            console.error('Error uploading image:', error);
                                                            message.destroy();
                                                            message.error('Upload ảnh thất bại!');
                                                        } finally {
                                                            setUploadingImageIndex(null);
                                                            // Reset input
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="primary"
                                                    icon={<UploadOutlined />}
                                                    size="small"
                                                    loading={uploadingImageIndex === index}
                                                    onClick={() => {
                                                        document.getElementById(`upload-detail-image-${index}`)?.click();
                                                    }}
                                                    style={{
                                                        backgroundColor: '#722ed1',
                                                        borderColor: '#722ed1',
                                                        boxShadow: '0 2px 4px rgba(114, 46, 209, 0.3)'
                                                    }}
                                                >
                                                    Upload lại ảnh
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Part Content Section */}
                                        {partContent && (
                                            <div style={{
                                                padding: '12px 16px',
                                                backgroundColor: '#f9f0ff',
                                                borderBottom: '1px solid #f0f0f0'
                                            }}>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#595959',
                                                    fontWeight: 500,
                                                    marginBottom: '6px'
                                                }}>
                                                    Nội dung phần {partNumber}:
                                                </div>
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: '#434343',
                                                    lineHeight: '1.6',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {partContent}
                                                </div>
                                            </div>
                                        )}

                                        {/* Description Section */}
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: '#fff'
                                        }}>
                                            <div style={{
                                                marginBottom: '10px'
                                            }}>
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: '#595959',
                                                    fontWeight: 500
                                                }}>
                                                    Mô tả
                                                </span>
                                            </div>

                                            {description ? (
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
                        <div style={{ fontSize: '18px', fontWeight: 500 }}>Không có detailImageUrls</div>
                    </div>
                )}
            </Modal>

            {/* Related Case Training Modal */}
            <RelatedCaseTrainingModal
                visible={relatedCaseTrainingModalVisible}
                onClose={() => {
                    setRelatedCaseTrainingModalVisible(false);
                    setSelectedNewsItemForCaseTraining(null);
                    setRelatedCaseTrainingList([]);
                }}
                selectedNewsItem={selectedNewsItemForCaseTraining}
                relatedCaseTrainingList={relatedCaseTrainingList}
                onRefresh={() => {
                    loadK9Data();
                }}
            />
        </div>
    );
};

export default AISummaryDetailGeneration;

