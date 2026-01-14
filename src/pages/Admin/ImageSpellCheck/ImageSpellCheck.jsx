import {
    ArrowLeftOutlined,
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    FileImageOutlined,
    FileTextOutlined,
    ReloadOutlined,
    SettingOutlined,
    UnorderedListOutlined
} from '@ant-design/icons';
import { Button, Card, Empty, Image, Input, message, Modal, Popconfirm, Progress, Select, Space, Spin, Switch, Table, Tag, Tabs, Tooltip, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiGen, ocrFileInstruction } from '../../../apis/aiGen/botService';
import { getAllImages, updateK9, getK9ById } from '../../../apis/k9Service';
import { createOrUpdateSetting, getSettingByType } from '../../../apis/settingService';
import { MODEL_AI_LIST } from '../AIGen/AI_CONST';
import ImageSpellCheckSettings from './ImageSpellCheckSettings';

const { Text, Title } = Typography;
const { TextArea } = Input;

const ImageSpellCheck = () => {
    const [loading, setLoading] = useState(false);
    const [imageData, setImageData] = useState([]);
    const [filteredImageData, setFilteredImageData] = useState([]);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [scoringPrompt, setScoringPrompt] = useState('');
    const [scoringModel, setScoringModel] = useState('');
    const [ocrModel, setOcrModel] = useState('');
    const [ocrInstructions, setOcrInstructions] = useState('');
    const [ocrSystemMessage, setOcrSystemMessage] = useState('');
    const [processingImages, setProcessingImages] = useState(new Set());
    const [ocrProcessingImages, setOcrProcessingImages] = useState(new Set());
    const [scoringProcessingImages, setScoringProcessingImages] = useState(new Set());
    const [bulkOcrLoading, setBulkOcrLoading] = useState(false);
    const [bulkScoringLoading, setBulkScoringLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('news');
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(1000);
    const [approvedFilter, setApprovedFilter] = useState('all'); // 'all', 'approved', 'notApproved'
    const [ocrFilter, setOcrFilter] = useState('all'); // 'all', 'hasOcr', 'noOcr'
    const [scoreFilter, setScoreFilter] = useState('all'); // 'all', 'hasScore', 'noScore'
    const [needsReviewFilter, setNeedsReviewFilter] = useState('all'); // 'all', 'needsReview', 'noReview'
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailContent, setDetailContent] = useState('');
    const [detailTitle, setDetailTitle] = useState('');
    const [logModalVisible, setLogModalVisible] = useState(false);
    const [processLogs, setProcessLogs] = useState([]);
    const [processProgress, setProcessProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
    const [lowConfidenceModalVisible, setLowConfidenceModalVisible] = useState(false);
    const [lowConfidenceWordsData, setLowConfidenceWordsData] = useState([]);

    // Load settings
    useEffect(() => {
        loadSettings();
        loadImageData();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await getSettingByType('IMAGE_SPELL_CHECK_CONFIG');
            if (settings?.setting) {
                // Scoring settings
                setScoringPrompt(settings.setting.scoringPrompt || '');
                setScoringModel(settings.setting.scoringModel || MODEL_AI_LIST[0]?.value || '');
                // OCR settings
                setOcrModel(settings.setting.ocrModel || MODEL_AI_LIST[0]?.value || '');
                setOcrInstructions(settings.setting.ocrInstructions || '');
                setOcrSystemMessage(settings.setting.ocrSystemMessage || '');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    // Load all images from K9 records using single API
    const loadImageData = async () => {
        setLoading(true);
        try {
            // Gọi 1 API chung, có thể truyền query params động
            // Ví dụ: { show: true, type: 'news' } hoặc {} để lấy tất cả
            const allImages = await getAllImages();
            setImageData(allImages);
        } catch (error) {
            console.error('Error loading image data:', error);
            message.error('Lỗi khi tải dữ liệu ảnh');
        } finally {
            setLoading(false);
        }
    };

    // Filter images
    useEffect(() => {
        let filtered = [...imageData];

        if (searchText) {
            filtered = filtered.filter(img =>
                img.title.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Filter by tab (type)
        const typeMap = {
            'news': 'news',
            'caseTraining': 'caseTraining',
            'longForm': 'longForm'
        };
        filtered = filtered.filter(img => img.type === typeMap[activeTab]);

        // Filter by approved status
        if (approvedFilter === 'approved') {
            filtered = filtered.filter(img => img.isOk === true);
        } else if (approvedFilter === 'notApproved') {
            filtered = filtered.filter(img => img.isOk !== true);
        }

        // Filter by OCR status
        if (ocrFilter === 'hasOcr') {
            filtered = filtered.filter(img =>
                img.ocrText &&
                typeof img.ocrText === 'string' &&
                img.ocrText.trim() &&
                img.ocrText !== 'Đang xử lý...' &&
                !img.ocrText.startsWith('Lỗi OCR')
            );
        } else if (ocrFilter === 'noOcr') {
            filtered = filtered.filter(img =>
                !img.ocrText ||
                (typeof img.ocrText === 'string' && (!img.ocrText.trim() || img.ocrText === 'Đang xử lý...' || img.ocrText.startsWith('Lỗi OCR')))
            );
        }

        // Filter by Score status
        if (scoreFilter === 'hasScore') {
            filtered = filtered.filter(img => img.score && img.scoreStatus !== 'failed');
        } else if (scoreFilter === 'noScore') {
            filtered = filtered.filter(img => !img.score || img.scoreStatus === 'failed');
        }

        // Filter by needsReview
        if (needsReviewFilter === 'needsReview') {
            filtered = filtered.filter(img => img.needsReview === true);
        } else if (needsReviewFilter === 'noReview') {
            filtered = filtered.filter(img => img.needsReview !== true);
        }

        setFilteredImageData(filtered);
        setCurrentPage(1); // Reset to first page when filter changes
    }, [searchText, activeTab, imageData, approvedFilter, ocrFilter, scoreFilter, needsReviewFilter]);

    // Helper function để cập nhật Score vào mảng image URLs (imgUrls hoặc detailImageUrls)
    const updateImageArrayWithScore = async (recordId, imageUrl, score, arrayFieldName) => {
        // Lấy record gốc từ API để có array đầy đủ
        const originalRecord = await getK9ById(recordId);

        if (!originalRecord || !originalRecord[arrayFieldName] || !Array.isArray(originalRecord[arrayFieldName])) {
            throw new Error(`Record không có ${arrayFieldName} hoặc ${arrayFieldName} không phải mảng`);
        }

        // Xử lý array: convert string thành object nếu cần và cập nhật item có URL khớp
        const updatedArray = originalRecord[arrayFieldName].map(arrayItem => {
            // arrayItem có thể là string hoặc object
            let itemUrl = '';
            let itemObj = {};

            if (typeof arrayItem === 'string') {
                // Nếu là string, convert thành object
                itemUrl = arrayItem;
                itemObj = { url: arrayItem };
            } else if (typeof arrayItem === 'object' && arrayItem !== null) {
                // Nếu là object, giữ nguyên và lấy URL
                itemUrl = arrayItem?.url || arrayItem?.image_url || '';
                itemObj = { ...arrayItem };
            } else {
                // Fallback
                return arrayItem;
            }

            // So sánh URL để tìm item cần cập nhật
            if (itemUrl === imageUrl) {
                // Cập nhật item này với Score (lưu toàn bộ kết quả vào score), giữ nguyên các trường khác
                return {
                    ...itemObj,
                    score: score,
                };
            }

            // Nếu không khớp nhưng là string, convert thành object để chuẩn hóa
            return typeof arrayItem === 'string' ? { url: arrayItem, isOk: false } : arrayItem;
        });

        // Gọi updateK9 trực tiếp với array đã được cập nhật
        await updateK9({
            id: recordId,
            [arrayFieldName]: updatedArray
        });

        return updatedArray;
    };

    // Helper function để xóa OCR và Score từ mảng image URLs
    const clearImageArrayData = async (recordId, imageUrl, arrayFieldName, clearOCR = true, clearScore = true) => {
        const originalRecord = await getK9ById(recordId);

        if (!originalRecord || !originalRecord[arrayFieldName] || !Array.isArray(originalRecord[arrayFieldName])) {
            throw new Error(`Record không có ${arrayFieldName} hoặc ${arrayFieldName} không phải mảng`);
        }

        const updatedArray = originalRecord[arrayFieldName].map(arrayItem => {
            let itemUrl = '';
            let itemObj = {};

            if (typeof arrayItem === 'string') {
                itemUrl = arrayItem;
                itemObj = { url: arrayItem };
            } else if (typeof arrayItem === 'object' && arrayItem !== null) {
                itemUrl = arrayItem?.url || arrayItem?.image_url || '';
                itemObj = { ...arrayItem };
            } else {
                return arrayItem;
            }

            if (itemUrl === imageUrl) {
                // Xóa ocrText và/hoặc score tùy theo tham số
                const { ocrText, score, ...rest } = itemObj;
                const result = { ...rest };
                if (!clearOCR && ocrText) result.ocrText = ocrText;
                if (!clearScore && score) result.score = score;
                return result;
            }

            return typeof arrayItem === 'string' ? { url: arrayItem, isOk: false } : arrayItem;
        });

        await updateK9({
            id: recordId,
            [arrayFieldName]: updatedArray
        });

        return updatedArray;
    };

    // Helper function để xóa OCR và Score từ avatarUrl
    const clearAvatarUrlData = async (recordId, clearOCR = true, clearScore = true) => {
        const originalRecord = await getK9ById(recordId);

        if (!originalRecord) {
            throw new Error('Không tìm thấy record');
        }

        const currentData = originalRecord.avatarUrlData || {};
        const { ocrText, score, ...rest } = currentData;
        const result = { ...rest };
        if (!clearOCR && ocrText) result.ocrText = ocrText;
        if (!clearScore && score) result.score = score;

        await updateK9({
            id: recordId,
            avatarUrlData: result
        });
    };

    // Helper function để cập nhật Score vào avatarUrl (trường JSONB)
    const updateAvatarUrlWithScore = async (recordId, score) => {
        // Lấy record gốc từ API
        const originalRecord = await getK9ById(recordId);

        if (!originalRecord) {
            throw new Error('Không tìm thấy record');
        }

        // Lấy dữ liệu hiện tại từ trường JSONB avatarUrlData, hoặc tạo mới
        const currentData = originalRecord.avatarUrlData || {};

        // Cập nhật trường JSONB với Score (lưu toàn bộ kết quả vào score) và giữ nguyên các trường khác
        await updateK9({
            id: recordId,
            avatarUrlData: {
                ...currentData,
                score: score
            }
        });
    };

    // Helper function để cập nhật OCR result vào mảng image URLs (imgUrls hoặc detailImageUrls)
    const updateImageArrayWithOCR = async (recordId, imageUrl, ocrText, arrayFieldName, needsReview, averageConfidence, lowConfidenceCount, lowConfidenceWords) => {
        // Lấy record gốc từ API để có array đầy đủ
        const originalRecord = await getK9ById(recordId);

        if (!originalRecord || !originalRecord[arrayFieldName] || !Array.isArray(originalRecord[arrayFieldName])) {
            throw new Error(`Record không có ${arrayFieldName} hoặc ${arrayFieldName} không phải mảng`);
        }

        // Xử lý array: convert string thành object nếu cần và cập nhật item có URL khớp
        const updatedArray = originalRecord[arrayFieldName].map(arrayItem => {
            // arrayItem có thể là string hoặc object
            let itemUrl = '';
            let itemObj = {};

            if (typeof arrayItem === 'string') {
                // Nếu là string, convert thành object
                itemUrl = arrayItem;
                itemObj = { url: arrayItem };
            } else if (typeof arrayItem === 'object' && arrayItem !== null) {
                // Nếu là object, giữ nguyên và lấy URL
                itemUrl = arrayItem?.url || arrayItem?.image_url || '';
                itemObj = { ...arrayItem };
            } else {
                // Fallback
                return arrayItem;
            }

            // So sánh URL để tìm item cần cập nhật
            if (itemUrl === imageUrl) {
                // Cập nhật item này với OCR result và metadata, giữ nguyên isOk nếu có
                return {
                    ...itemObj,
                    ocrText: ocrText,
                    needsReview: needsReview,
                    averageConfidence: averageConfidence,
                    lowConfidenceCount: lowConfidenceCount,
                    lowConfidenceWords: lowConfidenceWords,
                    isOk: itemObj.isOk !== undefined ? itemObj.isOk : false
                };
            }

            // Nếu không khớp nhưng là string, convert thành object để chuẩn hóa
            return typeof arrayItem === 'string' ? { url: arrayItem, isOk: false } : arrayItem;
        });

        // Gọi updateK9 trực tiếp với array đã được cập nhật
        await updateK9({
            id: recordId,
            [arrayFieldName]: updatedArray
        });

        return updatedArray;
    };

    // Helper function để cập nhật OCR result vào avatarUrl (trường JSONB)
    const updateAvatarUrlWithOCR = async (recordId, ocrText, needsReview, averageConfidence, lowConfidenceCount, lowConfidenceWords) => {
        // Lấy record gốc từ API
        const originalRecord = await getK9ById(recordId);

        if (!originalRecord) {
            throw new Error('Không tìm thấy record');
        }

        // Lấy dữ liệu hiện tại từ trường JSONB avatarUrlData, hoặc tạo mới
        const currentData = originalRecord.avatarUrlData || {};

        // Cập nhật trường JSONB với OCR result, metadata và giữ nguyên isOk nếu có
        await updateK9({
            id: recordId,
            avatarUrlData: {
                ...currentData,
                ocrText: ocrText,
                needsReview: needsReview,
                averageConfidence: averageConfidence,
                lowConfidenceCount: lowConfidenceCount,
                lowConfidenceWords: lowConfidenceWords,
                isOk: currentData.isOk !== undefined ? currentData.isOk : false
            }
        });
    };

    // Hàm để toggle trạng thái "ổn" cho image
    const toggleImageOkStatus = async (imageItem, checked) => {
        try {
            if (!imageItem.recordId) {
                message.warning('Không có recordId để cập nhật');
                return;
            }

            const imageTypeMap = {
                'imgUrls': 'imgUrls',
                'detailImageUrls': 'detailImageUrls',
                'avatarUrl': 'avatarUrl'
            };

            const fieldName = imageTypeMap[imageItem.imageType];

            if (imageItem.imageType === 'avatarUrl') {
                // Xử lý avatarUrl: cập nhật trường JSONB avatarUrlData
                const originalRecord = await getK9ById(imageItem.recordId);

                if (!originalRecord) {
                    throw new Error('Không tìm thấy record');
                }

                const currentData = originalRecord.avatarUrlData || {};

                await updateK9({
                    id: imageItem.recordId,
                    avatarUrlData: {
                        ...currentData,
                        isOk: checked
                    }
                });

                // Cập nhật local state
                setImageData(prev => prev.map(img =>
                    img.id === imageItem.id
                        ? { ...img, isOk: checked }
                        : img
                ));
            } else if (fieldName) {
                // Xử lý imgUrls hoặc detailImageUrls: cập nhật isOk trong mảng
                const originalRecord = await getK9ById(imageItem.recordId);

                if (!originalRecord || !originalRecord[fieldName] || !Array.isArray(originalRecord[fieldName])) {
                    throw new Error(`Record không có ${fieldName} hoặc ${fieldName} không phải mảng`);
                }

                const updatedArray = originalRecord[fieldName].map(arrayItem => {
                    let itemUrl = '';
                    let itemObj = {};

                    if (typeof arrayItem === 'string') {
                        itemUrl = arrayItem;
                        itemObj = { url: arrayItem };
                    } else if (typeof arrayItem === 'object' && arrayItem !== null) {
                        itemUrl = arrayItem?.url || arrayItem?.image_url || '';
                        itemObj = { ...arrayItem };
                    } else {
                        return arrayItem;
                    }

                    if (itemUrl === imageItem.url) {
                        return {
                            ...itemObj,
                            isOk: checked
                        };
                    }

                    return typeof arrayItem === 'string' ? { url: arrayItem, isOk: false } : arrayItem;
                });

                await updateK9({
                    id: imageItem.recordId,
                    [fieldName]: updatedArray
                });

                // Cập nhật local state
                setImageData(prev => prev.map(img =>
                    img.id === imageItem.id
                        ? { ...img, isOk: checked }
                        : img
                ));
            }

            message.success('Cập nhật trạng thái thành công');
        } catch (error) {
            console.error('Error updating image status:', error);
            message.error('Lỗi khi cập nhật trạng thái: ' + error.message);
        }
    };

    // Perform OCR on an image using ocrFile API
    const performOCR = async (imageItem) => {
        // Kiểm tra nếu đã được duyệt thì không cho phép OCR
        if (imageItem.isOk === true) {
            const error = new Error('Ảnh đã được duyệt, không thể thực hiện OCR. Vui lòng bỏ duyệt trước.');
            if (!bulkOcrLoading) {
                message.error(error.message);
            }
            throw error;
        }

        setProcessingImages(prev => new Set(prev).add(imageItem.id));
        setOcrProcessingImages(prev => new Set(prev).add(imageItem.id));

        try {
            // Update status to processing
            setImageData(prev => prev.map(img =>
                img.id === imageItem.id
                    ? { ...img, ocrStatus: 'processing', ocrText: 'Đang xử lý...' }
                    : img
            ));

            // Fetch image from URL and convert to File object
            let response;
            try {
                response = await fetch(imageItem.url, {
                    cache: 'no-cache',
                });
            } catch (fetchError) {
                if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
                    throw new Error(`Lỗi kết nối: Không thể tải ảnh từ URL. URL: ${imageItem.url}`);
                } else if (fetchError.name === 'TypeError' && fetchError.message.includes('network')) {
                    throw new Error(`Lỗi mạng: Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.`);
                } else {
                    throw new Error(`Lỗi khi tải ảnh: ${fetchError.message || 'Lỗi không xác định'}`);
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}. URL: ${imageItem.url}`);
            }

            let blob;
            try {
                blob = await response.blob();
            } catch (blobError) {
                throw new Error(`Không thể đọc dữ liệu ảnh: ${blobError.message}. Có thể file không phải là ảnh hợp lệ.`);
            }

            const fileName = imageItem.title || `image_${imageItem.id}.jpg`;
            const fileObj = new File([blob], fileName, {
                type: blob.type || 'image/jpeg'
            });

            // Kiểm tra OCR settings
            if (!ocrModel) {
                throw new Error('Vui lòng cấu hình OCR Model trong Settings trước khi thực hiện OCR');
            }

            // Call OCR API với preserve_original_text để không tự sửa chính tả
            const ocrOptions = {
                model: ocrModel,
                preserve_original_text: true, // QUAN TRỌNG: Giữ nguyên text gốc, không tự sửa chính tả
            };
            if (ocrInstructions) ocrOptions.instructions = ocrInstructions;
            if (ocrSystemMessage) ocrOptions.system_message = ocrSystemMessage;
            const ocrResult = await ocrFileInstruction(fileObj, ocrOptions);
            // Backend trả về kết quả từ analyze-ai endpoint
            const extractedText = ocrResult?.text || ocrResult?.result || ocrResult?.data || ocrResult?.content || '' || ocrResult?.analysis || '';
            const needsReview = ocrResult?.metadata?.needsReview;
            const averageConfidence = ocrResult?.metadata?.averageConfidence;
            const lowConfidenceCount = ocrResult?.metadata?.lowConfidenceCount;
            const lowConfidenceWords = ocrResult?.metadata?.lowConfidenceWords || [];
            if (!extractedText) {
                throw new Error('Không nhận được text từ OCR');
            }

            // Kiểm tra imageType để quyết định cách lưu kết quả
            const imageTypeMap = {
                'imgUrls': 'imgUrls',
                'detailImageUrls': 'detailImageUrls',
                'avatarUrl': 'avatarUrl'
            };

            const fieldName = imageTypeMap[imageItem.imageType];

            if (imageItem.imageType === 'avatarUrl' && imageItem.recordId) {
                // Xử lý avatarUrl: cập nhật vào trường avatarUrlOcrText
                try {
                    await updateAvatarUrlWithOCR(imageItem.recordId, extractedText, needsReview, averageConfidence, lowConfidenceCount, lowConfidenceWords);

                    // Cập nhật local state
                    setImageData(prev => prev.map(img =>
                        img.id === imageItem.id
                            ? {
                                ...img,
                                ocrText: extractedText,
                                needsReview: needsReview,
                                averageConfidence: averageConfidence,
                                lowConfidenceCount: lowConfidenceCount,
                                lowConfidenceWords: lowConfidenceWords,
                                ocrStatus: 'completed'
                            }
                            : img
                    ));

                    message.success('OCR thành công và đã lưu vào avatarUrlData');
                } catch (updateError) {
                    console.error('Error updating avatarUrl:', updateError);
                    // Fallback: vẫn cập nhật local state
                    setImageData(prev => prev.map(img =>
                        img.id === imageItem.id
                            ? {
                                ...img,
                                ocrText: extractedText,
                                needsReview: needsReview,
                                averageConfidence: averageConfidence,
                                lowConfidenceCount: lowConfidenceCount,
                                lowConfidenceWords: lowConfidenceWords,
                                ocrStatus: 'completed'
                            }
                            : img
                    ));
                    message.warning(`OCR thành công nhưng không thể lưu vào database. Lỗi: ${updateError.message}`);
                }
            } else if ((imageItem.imageType === 'imgUrls' || imageItem.imageType === 'detailImageUrls') && imageItem.recordId) {
                // Nếu là imgUrls hoặc detailImageUrls, cần cập nhật vào mảng tương ứng của record gốc
                try {
                    await updateImageArrayWithOCR(imageItem.recordId, imageItem.url, extractedText, fieldName, needsReview, averageConfidence, lowConfidenceCount, lowConfidenceWords);

                    // Cập nhật local state
                    setImageData(prev => prev.map(img =>
                        img.id === imageItem.id
                            ? {
                                ...img,
                                ocrText: extractedText,
                                needsReview: needsReview,
                                averageConfidence: averageConfidence,
                                lowConfidenceCount: lowConfidenceCount,
                                lowConfidenceWords: lowConfidenceWords,
                                ocrStatus: 'completed'
                            }
                            : img
                    ));

                    message.success(`OCR thành công và đã lưu vào ${fieldName}`);
                } catch (updateError) {
                    console.error(`Error updating ${fieldName}:`, updateError);
                    // Fallback: vẫn cập nhật local state
                    setImageData(prev => prev.map(img =>
                        img.id === imageItem.id
                            ? {
                                ...img,
                                ocrText: extractedText,
                                needsReview: needsReview,
                                averageConfidence: averageConfidence,
                                lowConfidenceCount: lowConfidenceCount,
                                lowConfidenceWords: lowConfidenceWords,
                                ocrStatus: 'completed'
                            }
                            : img
                    ));
                    message.warning(`OCR thành công nhưng không thể lưu vào database. Lỗi: ${updateError.message}`);
                }
            } else {
                // Nếu không phải các loại trên, cập nhật như bình thường
                setImageData(prev => prev.map(img =>
                    img.id === imageItem.id
                        ? { ...img, ocrText: extractedText, ocrStatus: 'completed' }
                        : img
                ));

                message.success('OCR thành công');
            }
        } catch (error) {
            console.error('OCR error:', error);
            const errorMessage = error.message || 'Lỗi không xác định';
            setImageData(prev => prev.map(img =>
                img.id === imageItem.id
                    ? { ...img, ocrStatus: 'failed', ocrText: `Lỗi OCR: ${errorMessage}` }
                    : img
            ));

            throw error;
        } finally {
            setProcessingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageItem.id);
                return newSet;
            });
            setOcrProcessingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageItem.id);
                return newSet;
            });
        }
    };

    // Bulk OCR for multiple images
    const handleBulkOCR = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một ảnh để OCR');
            return;
        }

        const selectedImages = filteredImageData.filter(img => selectedRowKeys.includes(img.id));

        if (selectedImages.length === 0) {
            message.warning('Không có ảnh nào được chọn');
            return;
        }

        // Filter out images that are already approved
        const validImages = selectedImages.filter(img => img.isOk !== true);
        if (validImages.length === 0) {
            message.warning('Tất cả ảnh đã được duyệt, không thể thực hiện OCR');
            return;
        }

        if (validImages.length < selectedImages.length) {
            message.warning(`${selectedImages.length - validImages.length} ảnh đã được duyệt sẽ bị bỏ qua`);
        }

        setBulkOcrLoading(true);

        // Initialize log
        setProcessLogs([]);
        setProcessProgress({ current: 0, total: validImages.length, success: 0, failed: 0 });
        setLogModalVisible(true);

        const successCount = { count: 0 };
        const failCount = { count: 0 };

        // Process images sequentially to avoid overwhelming the server
        for (let i = 0; i < validImages.length; i++) {
            const imageItem = validImages[i];
            const logEntry = {
                id: imageItem.id,
                title: imageItem.title || `Image ${imageItem.id}`,
                url: imageItem.url,
                recordId: imageItem.recordId,
                imageType: imageItem.imageType,
                operationType: 'OCR',
                status: 'processing',
                message: 'Đang xử lý OCR...'
            };

            setProcessLogs(prev => [...prev, logEntry]);
            setProcessProgress(prev => ({ ...prev, current: i + 1 }));

            try {
                await performOCR(imageItem);
                successCount.count++;
                setProcessLogs(prev => prev.map(log =>
                    log.id === imageItem.id
                        ? { ...log, status: 'success', message: 'OCR thành công' }
                        : log
                ));
                setProcessProgress(prev => ({ ...prev, success: prev.success + 1 }));
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Error OCR image ${imageItem.id}:`, error);
                failCount.count++;
                const errorMessage = error.message || 'Lỗi không xác định';
                setProcessLogs(prev => prev.map(log =>
                    log.id === imageItem.id
                        ? { ...log, status: 'error', message: `Lỗi: ${errorMessage}` }
                        : log
                ));
                setProcessProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
            }
        }

        setBulkOcrLoading(false);
        setSelectedRowKeys([]);

        if (successCount.count > 0) {
            message.success(`Đã OCR thành công ${successCount.count} ảnh${failCount.count > 0 ? `, thất bại ${failCount.count} ảnh` : ''}`);
        } else {
            message.error(`OCR thất bại cho tất cả ${validImages.length} ảnh`);
        }
    };

    // Xóa OCR text của một image
    const clearOCRText = async (imageItem) => {
        if (!imageItem.recordId) {
            throw new Error('Không có recordId để xóa');
        }

        const imageTypeMap = {
            'imgUrls': 'imgUrls',
            'detailImageUrls': 'detailImageUrls',
            'avatarUrl': 'avatarUrl'
        };

        const fieldName = imageTypeMap[imageItem.imageType];

        if (imageItem.imageType === 'avatarUrl') {
            await clearAvatarUrlData(imageItem.recordId, true, false);
        } else if (fieldName) {
            await clearImageArrayData(imageItem.recordId, imageItem.url, fieldName, true, false);
        }

        // Cập nhật local state
        setImageData(prev => prev.map(img =>
            img.id === imageItem.id
                ? { ...img, ocrText: null, ocrStatus: null }
                : img
        ));
    };

    // Xóa Score của một image
    const clearScore = async (imageItem) => {
        if (!imageItem.recordId) {
            throw new Error('Không có recordId để xóa');
        }

        const imageTypeMap = {
            'imgUrls': 'imgUrls',
            'detailImageUrls': 'detailImageUrls',
            'avatarUrl': 'avatarUrl'
        };

        const fieldName = imageTypeMap[imageItem.imageType];

        if (imageItem.imageType === 'avatarUrl') {
            await clearAvatarUrlData(imageItem.recordId, false, true);
        } else if (fieldName) {
            await clearImageArrayData(imageItem.recordId, imageItem.url, fieldName, false, true);
        }

        // Cập nhật local state
        setImageData(prev => prev.map(img =>
            img.id === imageItem.id
                ? { ...img, score: null, scoreStatus: null }
                : img
        ));
    };

    // Bulk clear OCR
    const handleBulkClearOCR = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một ảnh để xóa OCR');
            return;
        }

        const selectedImages = filteredImageData.filter(img => selectedRowKeys.includes(img.id));

        if (selectedImages.length === 0) {
            message.warning('Không có ảnh nào được chọn');
            return;
        }

        const validImages = selectedImages.filter(img => img.ocrText);
        if (validImages.length === 0) {
            message.warning('Không có ảnh nào có OCR text để xóa');
            return;
        }

        await executeBulkClearOCR(validImages);
    };

    const executeBulkClearOCR = async (validImages) => {

        // Initialize log
        setProcessLogs([]);
        setProcessProgress({ current: 0, total: validImages.length, success: 0, failed: 0 });
        setLogModalVisible(true);

        const successCount = { count: 0 };
        const failCount = { count: 0 };

        for (let i = 0; i < validImages.length; i++) {
            const imageItem = validImages[i];
            const logEntry = {
                id: imageItem.id,
                title: imageItem.title || `Image ${imageItem.id}`,
                url: imageItem.url,
                recordId: imageItem.recordId,
                imageType: imageItem.imageType,
                operationType: 'Xóa OCR',
                status: 'processing',
                message: 'Đang xóa OCR...'
            };

            setProcessLogs(prev => [...prev, logEntry]);
            setProcessProgress(prev => ({ ...prev, current: i + 1 }));

            try {
                await clearOCRText(imageItem);
                successCount.count++;
                setProcessLogs(prev => prev.map(log =>
                    log.id === imageItem.id
                        ? { ...log, status: 'success', message: 'Đã xóa OCR thành công' }
                        : log
                ));
                setProcessProgress(prev => ({ ...prev, success: prev.success + 1 }));
            } catch (error) {
                failCount.count++;
                const errorMessage = error.message || 'Lỗi không xác định';
                setProcessLogs(prev => prev.map(log =>
                    log.id === imageItem.id
                        ? { ...log, status: 'error', message: `Lỗi: ${errorMessage}` }
                        : log
                ));
                setProcessProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
            }
        }

        setSelectedRowKeys([]);

        if (successCount.count > 0) {
            message.success(`Đã xóa OCR thành công ${successCount.count} ảnh${failCount.count > 0 ? `, thất bại ${failCount.count} ảnh` : ''}`);
        } else {
            message.error(`Xóa OCR thất bại cho tất cả ${validImages.length} ảnh`);
        }
    };

    // Bulk clear Score
    const handleBulkClearScore = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một ảnh để xóa kết quả chấm điểm');
            return;
        }

        const selectedImages = filteredImageData.filter(img => selectedRowKeys.includes(img.id));

        if (selectedImages.length === 0) {
            message.warning('Không có ảnh nào được chọn');
            return;
        }

        const validImages = selectedImages.filter(img => img.score);
        if (validImages.length === 0) {
            message.warning('Không có ảnh nào có kết quả chấm điểm để xóa');
            return;
        }

        await executeBulkClearScore(validImages);
    };

    const executeBulkClearScore = async (validImages) => {

        // Initialize log
        setProcessLogs([]);
        setProcessProgress({ current: 0, total: validImages.length, success: 0, failed: 0 });
        setLogModalVisible(true);

        const successCount = { count: 0 };
        const failCount = { count: 0 };

        for (let i = 0; i < validImages.length; i++) {
            const imageItem = validImages[i];
            const logEntry = {
                id: imageItem.id,
                title: imageItem.title || `Image ${imageItem.id}`,
                url: imageItem.url,
                recordId: imageItem.recordId,
                imageType: imageItem.imageType,
                operationType: 'Xóa Score',
                status: 'processing',
                message: 'Đang xóa kết quả chấm điểm...'
            };

            setProcessLogs(prev => [...prev, logEntry]);
            setProcessProgress(prev => ({ ...prev, current: i + 1 }));

            try {
                await clearScore(imageItem);
                successCount.count++;
                setProcessLogs(prev => prev.map(log =>
                    log.id === imageItem.id
                        ? { ...log, status: 'success', message: 'Đã xóa kết quả chấm điểm thành công' }
                        : log
                ));
                setProcessProgress(prev => ({ ...prev, success: prev.success + 1 }));
            } catch (error) {
                failCount.count++;
                const errorMessage = error.message || 'Lỗi không xác định';
                setProcessLogs(prev => prev.map(log =>
                    log.id === imageItem.id
                        ? { ...log, status: 'error', message: `Lỗi: ${errorMessage}` }
                        : log
                ));
                setProcessProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
            }
        }

        setSelectedRowKeys([]);

        if (successCount.count > 0) {
            message.success(`Đã xóa kết quả chấm điểm thành công ${successCount.count} ảnh${failCount.count > 0 ? `, thất bại ${failCount.count} ảnh` : ''}`);
        } else {
            message.error(`Xóa kết quả chấm điểm thất bại cho tất cả ${validImages.length} ảnh`);
        }
    };

    // Bulk Scoring for multiple images
    const handleBulkScoring = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất một ảnh để chấm điểm');
            return;
        }

        if (!scoringPrompt || !scoringModel) {
            message.warning('Vui lòng cấu hình Scoring prompt và model trong Settings');
            return;
        }

        const selectedImages = filteredImageData.filter(img => selectedRowKeys.includes(img.id));

        if (selectedImages.length === 0) {
            message.warning('Không có ảnh nào được chọn');
            return;
        }

        // Filter out images that don't have OCR text or are already approved
        const validImages = selectedImages.filter(img =>
            img.isOk !== true &&
            img.ocrText &&
            typeof img.ocrText === 'string' &&
            img.ocrText.trim() &&
            img.ocrText !== 'Đang xử lý...' &&
            !img.ocrText.startsWith('Lỗi OCR')
        );

        if (validImages.length === 0) {
            message.warning('Không có ảnh nào hợp lệ để chấm điểm (cần có OCR Text và chưa được duyệt)');
            return;
        }

        // Initialize log
        setProcessLogs([]);
        setProcessProgress({ current: 0, total: validImages.length, success: 0, failed: 0 });
        setLogModalVisible(true);
        setBulkScoringLoading(true);

        const successCount = { count: 0 };
        const failCount = { count: 0 };

        // Process images sequentially to avoid overwhelming the server
        for (let i = 0; i < validImages.length; i++) {
            const imageItem = validImages[i];
            const logEntry = {
                id: imageItem.id,
                title: imageItem.title || `Image ${imageItem.id}`,
                url: imageItem.url,
                recordId: imageItem.recordId,
                imageType: imageItem.imageType,
                operationType: 'Chấm điểm',
                status: 'processing',
                message: 'Đang chấm điểm...'
            };

            setProcessLogs(prev => [...prev, logEntry]);
            setProcessProgress(prev => ({ ...prev, current: i + 1 }));

            try {
                await scoreOCRText(imageItem);
                successCount.count++;
                setProcessLogs(prev => prev.map(log =>
                    log.id === imageItem.id
                        ? { ...log, status: 'success', message: 'Chấm điểm thành công' }
                        : log
                ));
                setProcessProgress(prev => ({ ...prev, success: prev.success + 1 }));
            } catch (error) {
                console.error(`Error scoring image ${imageItem.id}:`, error);
                failCount.count++;
                const errorMessage = error.message || 'Lỗi không xác định';
                setProcessLogs(prev => prev.map(log =>
                    log.id === imageItem.id
                        ? { ...log, status: 'error', message: `Lỗi: ${errorMessage}` }
                        : log
                ));
                setProcessProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setBulkScoringLoading(false);
        setSelectedRowKeys([]);

        if (successCount.count > 0) {
            message.success(`Đã chấm điểm thành công ${successCount.count} ảnh${failCount.count > 0 ? `, thất bại ${failCount.count} ảnh` : ''}`);
        } else {
            message.error(`Chấm điểm thất bại cho tất cả ${validImages.length} ảnh`);
        }
    };

    // Score OCR text
    const scoreOCRText = async (imageItem) => {
        if (!scoringPrompt || !scoringModel) {
            message.warning('Vui lòng cấu hình Scoring prompt và model trong Settings');
            return;
        }

        if (!imageItem.ocrText || (typeof imageItem.ocrText === 'string' && (!imageItem.ocrText.trim() || imageItem.ocrText === 'Đang xử lý...' || imageItem.ocrText.startsWith('Lỗi OCR')))) {
            message.warning('Vui lòng thực hiện OCR trước khi chấm điểm');
            return;
        }

        setProcessingImages(prev => new Set(prev).add(imageItem.id));
        setScoringProcessingImages(prev => new Set(prev).add(imageItem.id));

        try {
            // Update status to processing
            setImageData(prev => prev.map(img =>
                img.id === imageItem.id
                    ? { ...img, scoreStatus: 'processing' }
                    : img
            ));

            const prompt = `${scoringPrompt}\n\nOCR Text:\n${imageItem.ocrText}`;

            const response = await aiGen(prompt, null, scoringModel, 'text');
            const scoreResult = response.result || response.answer || response.content || response || '';

            // Lưu toàn bộ kết quả AI trả về vào trường score
            const score = scoreResult;
            const scoreStatus = 'completed';

            // Kiểm tra imageType để quyết định cách lưu kết quả
            const imageTypeMap = {
                'imgUrls': 'imgUrls',
                'detailImageUrls': 'detailImageUrls',
                'avatarUrl': 'avatarUrl'
            };

            const fieldName = imageTypeMap[imageItem.imageType];

            // Lưu score (toàn bộ kết quả) vào database
            if (imageItem.imageType === 'avatarUrl' && imageItem.recordId) {
                // Xử lý avatarUrl: cập nhật vào trường JSONB avatarUrlData
                try {
                    await updateAvatarUrlWithScore(imageItem.recordId, score);
                } catch (updateError) {
                    console.error('Error updating avatarUrl score:', updateError);
                    message.warning('Chấm điểm thành công nhưng không thể lưu vào database. Lỗi: ' + updateError.message);
                }
            } else if ((imageItem.imageType === 'imgUrls' || imageItem.imageType === 'detailImageUrls') && imageItem.recordId) {
                // Nếu là imgUrls hoặc detailImageUrls, cần cập nhật vào mảng tương ứng của record gốc
                try {
                    await updateImageArrayWithScore(imageItem.recordId, imageItem.url, score, fieldName);
                } catch (updateError) {
                    console.error(`Error updating ${fieldName} score:`, updateError);
                    message.warning('Chấm điểm thành công nhưng không thể lưu vào database. Lỗi: ' + updateError.message);
                }
            }

            // Update local state với toàn bộ kết quả
            setImageData(prev => prev.map(img =>
                img.id === imageItem.id
                    ? { ...img, score: score, scoreStatus }
                    : img
            ));

            message.success('Chấm điểm thành công');
        } catch (error) {
            console.error('Scoring error:', error);
            setImageData(prev => prev.map(img =>
                img.id === imageItem.id
                    ? { ...img, scoreStatus: 'failed' }
                    : img
            ));
            message.error('Lỗi khi chấm điểm');
        } finally {
            setProcessingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageItem.id);
                return newSet;
            });
            setScoringProcessingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageItem.id);
                return newSet;
            });
        }
    };

    const columns = [
        {
            title: 'Ảnh',
            key: 'image',
            width: 120,
            render: (_, record) => (
                <Image
                    src={record.url}
                    alt={record.title}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                    preview={{
                        mask: 'Xem ảnh'
                    }}
                />
            ),
        },
        {
            title: 'Related ID',
            key: 'recordId',
            width: 100,
            render: (_, record) => (
                <Tag color="blue">{record.recordId}</Tag>
            ),
        },

        {
            title: 'Image Type',
            key: 'imageType',
            width: 120,
            render: (_, record) => {
                if (record.imageType) {
                    return <Tag color="cyan">{record.imageType}</Tag>;
                }
                return <Text type="secondary">-</Text>;
            },
        },

        {
            title: 'OCR Text',
            key: 'ocrText',
            width: 300,
            render: (_, record) => {
                if (!record.ocrText) {
                    return <Text type="secondary" style={{ fontSize: '12px' }}>Chưa có OCR</Text>;
                }
                const hasError = typeof record.ocrText === 'string' && record.ocrText.startsWith('Lỗi OCR');
                const isOcrProcessing = ocrProcessingImages.has(record.id) || (record.ocrStatus === 'processing' && !record.ocrText.includes('Lỗi'));
                const textColor = hasError ? '#ff4d4f' : '#1890ff';
                const hoverColor = hasError ? '#ff7875' : '#40a9ff';

                return (
                    <Tooltip title="Click để xem chi tiết" placement="topLeft">
                        <div
                            style={{
                                fontSize: '12px',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: '1.5',
                                maxHeight: '4.5em',
                                cursor: 'pointer',
                                color: textColor,
                                transition: 'all 0.3s'
                            }}
                            onClick={() => {
                                setDetailTitle('OCR Text');
                                setDetailContent(record.ocrText);
                                setDetailModalVisible(true);
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = hoverColor;
                                e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = textColor;
                                e.currentTarget.style.textDecoration = 'none';
                            }}
                        >
                            {isOcrProcessing && <Spin size="small" style={{ marginRight: '4px' }} />}
                            {record.ocrText}
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Needs Review',
            key: 'needsReview',
            width: 120,
            render: (_, record) => {
                if (record.needsReview === undefined || record.needsReview === null) {
                    return <Text type="secondary">-</Text>;
                }
                return (
                    <Tag color={record.needsReview ? 'red' : 'green'}>
                        {record.needsReview ? 'Có' : 'Không'}
                    </Tag>
                );
            },
        },
        {
            title: 'Average Confidence',
            key: 'averageConfidence',
            width: 150,
            sorter: (a, b) => {
                const aVal = a.averageConfidence !== undefined && a.averageConfidence !== null
                    ? (typeof a.averageConfidence === 'number' ? a.averageConfidence : parseFloat(a.averageConfidence))
                    : -1;
                const bVal = b.averageConfidence !== undefined && b.averageConfidence !== null
                    ? (typeof b.averageConfidence === 'number' ? b.averageConfidence : parseFloat(b.averageConfidence))
                    : -1;
                return aVal - bVal;
            },
            render: (_, record) => {
                if (record.averageConfidence === undefined || record.averageConfidence === null) {
                    return <Text type="secondary">-</Text>;
                }
                const confidence = typeof record.averageConfidence === 'number'
                    ? record.averageConfidence
                    : parseFloat(record.averageConfidence);
                const color = confidence >= 0.8 ? 'green' : confidence >= 0.6 ? 'orange' : 'red';
                return (
                    <Tag color={color}>
                        {(confidence * 100).toFixed(1)}%
                    </Tag>
                );
            },
        },
        {
            title: 'Low Confidence Count',
            key: 'lowConfidenceCount',
            width: 150,
            render: (_, record) => {
                if (record.lowConfidenceCount === undefined || record.lowConfidenceCount === null) {
                    return <Text type="secondary">-</Text>;
                }
                const count = typeof record.lowConfidenceCount === 'number'
                    ? record.lowConfidenceCount
                    : parseInt(record.lowConfidenceCount);
                const hasLowConfidenceWords = record.lowConfidenceWords && Array.isArray(record.lowConfidenceWords) && record.lowConfidenceWords.length > 0;

                return (
                    <Tag
                        color={count > 0 ? 'red' : 'green'}
                        style={hasLowConfidenceWords ? { cursor: 'pointer' } : {}}
                        onClick={hasLowConfidenceWords ? () => {
                            setLowConfidenceWordsData(record.lowConfidenceWords);
                            setLowConfidenceModalVisible(true);
                        } : undefined}
                    >
                        {count}
                    </Tag>
                );
            },
        },
        {
            title: 'Score',
            key: 'score',
            width: 300,
            sorter: (a, b) => {
                const aHasScore = a.score && a.scoreStatus !== 'failed';
                const bHasScore = b.score && b.scoreStatus !== 'failed';
                if (aHasScore && !bHasScore) return 1;
                if (!aHasScore && bHasScore) return -1;
                if (!aHasScore && !bHasScore) return 0;
                // If both have score, compare by score text length or content
                const aScore = String(a.score || '');
                const bScore = String(b.score || '');
                return aScore.localeCompare(bScore);
            },
            render: (_, record) => {
                const isScoringProcessing = scoringProcessingImages.has(record.id) || record.scoreStatus === 'processing';
                if (isScoringProcessing) {
                    return <Spin size="small" />;
                }
                if (record.score) {
                    return (
                        <Tooltip title="Click để xem chi tiết" placement="topLeft">
                            <div
                                style={{
                                    fontSize: '12px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: '1.5',
                                    maxHeight: '4.5em',
                                    whiteSpace: 'pre-wrap',
                                    cursor: 'pointer',
                                    color: '#1890ff',
                                    transition: 'all 0.3s'
                                }}
                                onClick={() => {
                                    setDetailTitle('Score');
                                    setDetailContent(record.score);
                                    setDetailModalVisible(true);
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#40a9ff';
                                    e.currentTarget.style.textDecoration = 'underline';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#1890ff';
                                    e.currentTarget.style.textDecoration = 'none';
                                }}
                            >
                                {record.score}
                            </div>
                        </Tooltip>
                    );
                }
                return <Text type="secondary">-</Text>;
            },
        },
        {
            title: 'URL',
            key: 'url',
            width: 200,
            ellipsis: true,
            render: (_, record) => (
                <Text ellipsis copyable style={{ fontSize: '11px' }}>
                    {record.url}
                </Text>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 300,
            fixed: 'right',
            render: (_, record) => {
                const isProcessing = processingImages.has(record.id);
                return (
                    <Space>
                        <Tooltip title={record.isOk ? 'Đã được duyệt, không thể thực hiện OCR' : ''}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<FileImageOutlined />}
                                onClick={() => performOCR(record)}
                                loading={isProcessing && record.scoreStatus === 'processing' && !record.ocrText}
                                disabled={isProcessing || record.isOk === true}
                            >
                                OCR
                            </Button>
                        </Tooltip>
                        <Tooltip title={
                            record.isOk
                                ? 'Đã được duyệt, không thể chấm điểm'
                                : !record.ocrText || (typeof record.ocrText === 'string' && !record.ocrText.trim())
                                    ? 'Vui lòng thực hiện OCR trước khi chấm điểm'
                                    : record.ocrText === 'Đang xử lý...' || (typeof record.ocrText === 'string' && record.ocrText.startsWith('Lỗi OCR'))
                                        ? 'OCR chưa hoàn thành hoặc có lỗi'
                                        : ''
                        }>
                            <Button
                                type="default"
                                size="small"
                                onClick={() => scoreOCRText(record)}
                                loading={isProcessing && record.scoreStatus === 'processing' && record.ocrText}
                                disabled={isProcessing || record.isOk === true || !record.ocrText || (typeof record.ocrText === 'string' && !record.ocrText.trim()) || record.ocrText === 'Đang xử lý...' || (typeof record.ocrText === 'string' && record.ocrText.startsWith('Lỗi OCR'))}
                            >
                                Chấm điểm
                            </Button>
                        </Tooltip>
                        <Switch
                            checked={record.isOk === true}
                            onChange={(checked) => toggleImageOkStatus(record, checked)}
                            checkedChildren="Duyệt"
                            unCheckedChildren="Chưa duyệt"
                        />
                    </Space>
                );
            },
        },
    ];

    const navigate = useNavigate();

    return (
        <div style={{ padding: '24px', maxWidth: '100%', margin: '0 auto', }}>
            <Card>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Button
                            type="default"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/home')}
                            size="small"
                        >
                            Về trang chủ
                        </Button>
                        <Title level={3} style={{ margin: 0 }}>
                            <FileImageOutlined /> Kiểm tra lỗi chính tả ảnh
                        </Title>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Input
                            placeholder="Tìm kiếm theo tiêu đề, URL hoặc OCR text..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 300 }}
                            allowClear
                            size="small"
                        />
                        <Select
                            value={approvedFilter}
                            onChange={setApprovedFilter}
                            style={{ width: 150 }}
                            size="small"
                        >
                            <Select.Option value="all">Tất cả duyệt</Select.Option>
                            <Select.Option value="approved">Đã duyệt</Select.Option>
                            <Select.Option value="notApproved">Chưa duyệt</Select.Option>
                        </Select>
                        <Select
                            value={ocrFilter}
                            onChange={setOcrFilter}
                            style={{ width: 150 }}
                            size="small"
                        >
                            <Select.Option value="all">Tất cả OCR</Select.Option>
                            <Select.Option value="hasOcr">Đã OCR</Select.Option>
                            <Select.Option value="noOcr">Chưa OCR</Select.Option>
                        </Select>
                        <Select
                            value={scoreFilter}
                            onChange={setScoreFilter}
                            style={{ width: 150 }}
                            size="small"
                        >
                            <Select.Option value="all">Tất cả Score</Select.Option>
                            <Select.Option value="hasScore">Đã chấm điểm</Select.Option>
                            <Select.Option value="noScore">Chưa chấm điểm</Select.Option>
                        </Select>
                        <Select
                            value={needsReviewFilter}
                            onChange={setNeedsReviewFilter}
                            style={{ width: 150 }}
                            size="small"
                        >
                            <Select.Option value="all">Tất cả Review</Select.Option>
                            <Select.Option value="needsReview">Cần review</Select.Option>
                            <Select.Option value="noReview">Không cần review</Select.Option>
                        </Select>
                        {processLogs.length > 0 && (
                            <Button
                                icon={<FileTextOutlined />}
                                onClick={() => setLogModalVisible(true)}
                                size="small"
                                type="default"
                            >
                                Xem log ({processLogs.length})
                            </Button>
                        )}
                        <Button
                            icon={<SettingOutlined />}
                            onClick={() => setSettingsVisible(true)}
                            size="small"
                        >
                            Cài đặt
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={loadImageData}
                            loading={loading}
                            size="small"
                        >
                            Tải lại
                        </Button>
                    </div>
                </div>

                {/* Hướng dẫn sử dụng */}
                <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    background: '#e6f7ff',
                    borderRadius: '4px',
                    border: '1px solid #91d5ff'
                }}>
                    <Text strong style={{ color: '#1890ff' }}>Hướng dẫn sử dụng:</Text>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#595959' }}>
                        <li>Click vào <Text strong>OCR Text</Text> hoặc <Text strong>Score</Text> (màu xanh) để xem chi tiết</li>
                        <li>Chấm điểm cần có <Text strong>OCR Text</Text> trước (phải thực hiện OCR trước khi chấm điểm)</li>
                        <li>Khi đã <Text strong>Duyệt</Text>, không thể thực hiện OCR và chấm điểm nữa</li>
                        <li>Để thực hiện lại OCR/chấm điểm, cần bỏ duyệt trước</li>
                    </ul>
                </div>

                {/* Bulk Actions */}
                {selectedRowKeys.length > 0 && (
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            type="primary"
                            icon={<FileImageOutlined />}
                            onClick={handleBulkOCR}
                            loading={bulkOcrLoading}
                            disabled={bulkOcrLoading || bulkScoringLoading}
                            size="small"
                        >
                            OCR ({selectedRowKeys.length})
                        </Button>
                        <Button
                            type="default"
                            onClick={handleBulkScoring}
                            loading={bulkScoringLoading}
                            disabled={bulkOcrLoading || bulkScoringLoading}
                            size="small"
                        >
                            Chấm điểm ({selectedRowKeys.length})
                        </Button>
                        <Popconfirm
                            title="Xác nhận xóa OCR"
                            description={`Bạn có chắc chắn muốn xóa OCR text của các ảnh đã chọn? Hành động này không thể hoàn tác.`}
                            onConfirm={handleBulkClearOCR}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                disabled={bulkOcrLoading || bulkScoringLoading}
                                size="small"
                            >
                                Xóa OCR ({selectedRowKeys.length})
                            </Button>
                        </Popconfirm>
                        <Popconfirm
                            title="Xác nhận xóa Score"
                            description={`Bạn có chắc chắn muốn xóa kết quả chấm điểm của các ảnh đã chọn? Hành động này không thể hoàn tác.`}
                            onConfirm={handleBulkClearScore}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                disabled={bulkOcrLoading || bulkScoringLoading}
                                size="small"
                            >
                                Xóa Score ({selectedRowKeys.length})
                            </Button>
                        </Popconfirm>
                        <Button
                            type="link"
                            onClick={() => setSelectedRowKeys([])}
                            size="small"
                            disabled={bulkOcrLoading || bulkScoringLoading}
                        >
                            Bỏ chọn ({selectedRowKeys.length})
                        </Button>
                        {(bulkOcrLoading || bulkScoringLoading) && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {bulkOcrLoading ? 'Đang chạy OCR...' : 'Đang chấm điểm...'}
                            </Text>
                        )}
                    </div>
                )}

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    style={{ marginBottom: '16px' }}
                    items={[
                        {
                            key: 'news',
                            label: `Lý thuyết (${imageData.filter(img => img.type === 'news').length})`,
                        },
                        {
                            key: 'caseTraining',
                            label: `Case Training (${imageData.filter(img => img.type === 'caseTraining').length})`,
                        },
                        {
                            key: 'longForm',
                            label: `Kho tài nguyên (${imageData.filter(img => img.type === 'longForm').length})`,
                        },
                    ]}
                />

                <Table
                    columns={columns}
                    dataSource={filteredImageData}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1500, y: 550 }}
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
            <Modal
                title={detailTitle}
                open={detailModalVisible}
                onCancel={() => {
                    setDetailModalVisible(false);
                    setDetailContent('');
                    setDetailTitle('');
                }}
                footer={null}
                width={800}
            >
                <div style={{
                    padding: '16px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    maxHeight: '600px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontSize: '14px',
                    lineHeight: '1.6'
                }}>
                    <Text>{detailContent}</Text>
                </div>
            </Modal>

            {/* Process Log Modal */}
            <Modal
                title="Theo dõi tiến trình"
                open={logModalVisible}
                onCancel={() => {
                    setLogModalVisible(false);
                }}
                footer={null}
                width={900}
                closable={true}
                maskClosable={true}
            >
                <div style={{ marginBottom: '16px' }}>
                    <Progress
                        percent={processProgress.total > 0 ? Math.round((processProgress.current / processProgress.total) * 100) : 0}
                        status={bulkOcrLoading || bulkScoringLoading ? 'active' : 'success'}
                        format={() => `${processProgress.current}/${processProgress.total}`}
                    />
                    <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <Text>
                            <Text strong style={{ color: '#1890ff' }}>Tổng số: </Text>
                            {processProgress.total}
                        </Text>
                        <Text>
                            <Text strong style={{ color: '#52c41a' }}>Thành công: </Text>
                            {processProgress.success}
                        </Text>
                        <Text>
                            <Text strong style={{ color: '#ff4d4f' }}>Thất bại: </Text>
                            {processProgress.failed}
                        </Text>
                        <Text>
                            <Text strong>Đang xử lý: </Text>
                            {processProgress.current - processProgress.success - processProgress.failed}
                        </Text>
                    </div>
                </div>
                <div style={{
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    padding: '8px',
                    scrollBehavior: 'smooth'
                }}>
                    {processLogs.length === 0 ? (
                        <Empty description="Chưa có log nào" />
                    ) : (
                        <div>
                            {processLogs.map((log, index) => (
                                <div
                                    key={`${log.id}-${index}`}
                                    style={{
                                        padding: '12px',
                                        marginBottom: '8px',
                                        borderRadius: '6px',
                                        background: log.status === 'success' ? '#f6ffed' : log.status === 'error' ? '#fff2f0' : '#e6f7ff',
                                        border: `1px solid ${log.status === 'success' ? '#b7eb8f' : log.status === 'error' ? '#ffccc7' : '#91d5ff'}`
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        {/* Image Preview */}
                                        {log.url && (
                                            <div style={{ flexShrink: 0 }}>
                                                <Image
                                                    src={log.url}
                                                    alt="Preview"
                                                    width={80}
                                                    height={80}
                                                    style={{
                                                        objectFit: 'cover',
                                                        borderRadius: '4px',
                                                        border: '1px solid #d9d9d9'
                                                    }}
                                                    preview={{
                                                        mask: 'Xem ảnh'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {/* Operation Type and URL */}
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                {log.operationType && (
                                                    <Tag color="purple" style={{ margin: 0, fontWeight: 'bold' }}>
                                                        {log.operationType}
                                                    </Tag>
                                                )}
                                                {log.url && (
                                                    <Text
                                                        strong
                                                        style={{
                                                            fontSize: '12px',
                                                            color: '#1890ff',
                                                            wordBreak: 'break-all',
                                                            flex: 1,
                                                            minWidth: 0
                                                        }}
                                                        copyable={{ text: log.url }}
                                                    >
                                                        {log.url}
                                                    </Text>
                                                )}
                                            </div>

                                            {/* Image Type and Related ID */}
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                {log.imageType && (
                                                    <Tag color="blue" style={{ margin: 0 }}>
                                                        {log.imageType === 'imgUrls' ? 'imgUrls' :
                                                            log.imageType === 'detailImageUrls' ? 'detailImageUrls' :
                                                                log.imageType === 'avatarUrl' ? 'avatarUrl' : log.imageType}
                                                    </Tag>
                                                )}
                                                {log.recordId && (
                                                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                                        Related ID: <Text strong style={{ color: '#595959' }}>{log.recordId}</Text>
                                                    </Text>
                                                )}
                                            </div>

                                            {/* Status and Message */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                {log.status === 'processing' && <Spin size="small" />}
                                                {log.status === 'success' && <Tag color="success" style={{ margin: 0 }}>✓ Thành công</Tag>}
                                                {log.status === 'error' && <Tag color="error" style={{ margin: 0 }}>✗ Thất bại</Tag>}
                                                <Text style={{ fontSize: '12px', color: '#595959' }}>{log.message}</Text>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Settings Modal */}
            <ImageSpellCheckSettings
                visible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
                onSave={async (settings) => {
                    await createOrUpdateSetting({
                        type: 'IMAGE_SPELL_CHECK_CONFIG',
                        setting: settings
                    });
                    await loadSettings();
                    setSettingsVisible(false);
                    message.success('Cài đặt đã được lưu');
                }}
                initialSettings={{
                    scoringPrompt,
                    scoringModel,
                    ocrModel,
                    ocrInstructions,
                    ocrSystemMessage
                }}
            />

            {/* Low Confidence Words Modal */}
            <Modal
                title="Low Confidence Words"
                open={lowConfidenceModalVisible}
                onCancel={() => setLowConfidenceModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setLowConfidenceModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                {lowConfidenceWordsData && lowConfidenceWordsData.length > 0 ? (
                    <Table
                        dataSource={lowConfidenceWordsData}
                        rowKey={(record, index) => index}
                        pagination={{ pageSize: 10 }}
                        columns={[
                            {
                                title: 'Text',
                                dataIndex: 'text',
                                key: 'text',
                                width: '40%',
                                render: (text) => <Text>{text || '-'}</Text>
                            },
                            {
                                title: 'Confidence',
                                dataIndex: 'confidence',
                                key: 'confidence',
                                width: '30%',
                                render: (confidence) => {
                                    if (confidence === undefined || confidence === null) {
                                        return <Text type="secondary">-</Text>;
                                    }
                                    const conf = typeof confidence === 'number'
                                        ? confidence
                                        : parseFloat(confidence);
                                    const color = conf >= 0.8 ? 'green' : conf >= 0.6 ? 'orange' : 'red';
                                    return (
                                        <Tag color={color}>
                                            {(conf * 100).toFixed(1)}%
                                        </Tag>
                                    );
                                }
                            },
                            {
                                title: 'Page',
                                dataIndex: 'page',
                                key: 'page',
                                width: '30%',
                                render: (page) => (
                                    <Text>{page !== undefined && page !== null ? page : '-'}</Text>
                                )
                            }
                        ]}
                    />
                ) : (
                    <Empty description="Không có dữ liệu low confidence words" />
                )}
            </Modal>
        </div>
    );
};

export default ImageSpellCheck;

