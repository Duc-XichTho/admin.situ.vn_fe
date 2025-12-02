import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,

  EyeOutlined,

  FileExcelOutlined,

  FileTextOutlined,

  HistoryOutlined,

  InboxOutlined,

  LoadingOutlined,
  NodeIndexOutlined,
  PictureOutlined,
  PlusOutlined,
  QuestionCircleOutlined,

  ReloadOutlined,

  SettingOutlined,

  SoundOutlined,

  TagsOutlined,

  AppstoreOutlined,

  ThunderboltOutlined,

  UploadOutlined,
} from '@ant-design/icons';

import {
  AutoComplete,

  Badge,

  Button,

  Card,
  Dropdown,
  Form,

  Image,

  Input,

  InputNumber,

  message,

  Modal,

  Popconfirm,

  Progress,

  Select,

  Space,

  Spin,

  Switch,

  Table,

  Tag,

  Tooltip,
  Upload
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { aiGen, aiGen2, aiGenImageDiagram, generateAudio, generateText } from '../../apis/aiGen/botService.jsx';
import { uploadFiles } from '../../apis/aiGen/uploadImageWikiNoteService.jsx';
import { createAISummary, deleteAISummary, getAllAISummaries, updateAISummary } from '../../apis/aiSummaryService';
import { getAllCompanyInfos } from '../../apis/companyInfoService.jsx';
import { getAllCompanyReports } from '../../apis/companyReportService.jsx';
import {
  createEmbeddingWithAI,
  deleteEmbedingDataBySourceId,
  getEmbedingDataByTable,
} from '../../apis/embedingDataService';
import { getAllFinRatioBaohiems } from '../../apis/finRatioBaohiemService.jsx';
import { getAllFinRatioChungkhoans } from '../../apis/finRatioChungkhoanService.jsx';
import { getAllFinRatioNganhangs } from '../../apis/finRatioNganhangService.jsx';
import { getAllFinRatios } from '../../apis/finRatioService.jsx';
import { createK9, deleteK9, getK9ById, getK9ByType, searchK9ByTextToVector, updateK9, updateK9Bulk } from '../../apis/k9Service';
import { createOrUpdateSetting, getSettingByType } from '../../apis/settingService';
import { getAllUserClass } from '../../apis/userClassService';
import ReportOverviewModal from '../K9/components/ReportOverviewModal';
import BulkUpdateModal from './components/BulkUpdateModal.jsx';
import CreateQuizModal from './components/CreateQuizModal.jsx';
import UpdateQuizContentModal from './components/UpdateQuizContentModal.jsx';
import PromptSettingsModal from './components/PromptSettingsModal.jsx';
import PromptSettingsListModal from './components/PromptSettingsListModal.jsx';
import SelectPromptModal from './components/SelectPromptModal.jsx';
import DiagramPreviewModal from './components/DiagramPreviewModal.jsx';
import ImproveDetailModal from './components/ImproveDetailModal.jsx';
import QuestionContentModal from './components/QuestionContentModal.jsx';
import QuizEditorModal from './components/QuizEditorModal.jsx';
import TagManagementModal from './components/TagManagementModal.jsx';
import CategoriesManagementModal from './components/CategoriesManagementModal.jsx';
import TagProgramModal from './components/TagProgramModal.jsx';
import { validateExcalidrawJson, extractJsonFromMarkdown, normalizeExcalidrawJson } from './utils/excalidrawHelpers';
import styles from './K9Management.module.css';
import AISummaryDetailModal from './modal/AISummaryDetailModal.jsx';
import AISummaryEditModal from './modal/AISummaryEditModal.jsx';
import AISummaryTable from './modal/AISummaryTable.jsx';
import BackgroundAudio from './modal/BackgroudAudio.jsx';
import CreateCompanyOverview from './modal/CreateCompanyOverview.jsx';
import CreateConfigImage from './modal/CreateConfigImage.jsx';
import CreateConfigDiagram from './modal/CreateConfigDiagram.jsx';
import CreateConfigSummaryDetail from './modal/CreateConfigSummaryDetail.jsx';
import CreateEditModal from './modal/CreateEditModal.jsx';
import GuidelineSettingModal from './modal/GuidelineSettingModal.jsx';
import ImportDataExcel from './modal/ImportDataExcel.jsx';
import ImportDataJson from './modal/ImportDataJson.jsx';
import TableEditModal from './modal/TableEditModal.jsx';
import ViewDetailModal from './modal/ViewDetailModal.jsx';
import VoiceSettingsModal from './modal/VoiceSettingsModal.jsx';
import VoiceQueueModal from './modal/VoiceQueueModal.jsx';
import { createTimestamp, formatDateToDDMMYYYY } from '../../generalFunction/format.js';
import { log } from 'mathjs';
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;


const K9Management = () => {



  const navigate = useNavigate();

  const [form] = Form.useForm();

  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(false);

  const [pageSize, setPageSize] = useState(1000);

  const [loadingClassify, setLoadingClassify] = useState(false);

  const [loadingGetFeeds, setLoadingGetFeeds] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [viewModalVisible, setViewModalVisible] = useState(false);

  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'

  const [selectedRecord, setSelectedRecord] = useState(null);

  const [currentTab, setCurrentTab] = useState('home');

  const [tableKey, setTableKey] = useState(0);

  const [formKey, setFormKey] = useState(0);

  // Upload states for individual records

  const [uploadingImages, setUploadingImages] = useState(false);

  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [uploadingAudio, setUploadingAudio] = useState(false);

  const [uploadProgress, setUploadProgress] = useState({ images: 0, video: 0, files: 0, audio: 0 });

  const [selectedImages, setSelectedImages] = useState([]);

  const [selectedVideo, setSelectedVideo] = useState(null);

  const [selectedFiles, setSelectedFiles] = useState([]);

  const [selectedAudio, setSelectedAudio] = useState(null);

  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);

  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');

  const [uploadedFileUrls, setUploadedFileUrls] = useState([]);

  const [uploadedAudioUrl, setUploadedAudioUrl] = useState('');


  // Avatar and Diagram upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDiagram, setUploadingDiagram] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedDiagram, setSelectedDiagram] = useState(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState('');
  const [uploadedDiagramUrl, setUploadedDiagramUrl] = useState('');


  // AI Voice generation states

  const [customVoiceText, setCustomVoiceText] = useState('');

  // Voice Settings states - chỉ lưu 3 fields có thể edit

  const [voiceSettings, setVoiceSettings] = useState({

    systemMessage: '',
    textModel: '',
    audioModel: '',
    voiceType: 'nova',
    speed: 1.0,

  });

  const [voiceSettingsVisible, setVoiceSettingsVisible] = useState(false);

  const [voiceQueueModalVisible, setVoiceQueueModalVisible] = useState(false);

  const [quizContent, setQuizContent] = useState('');

  const [audioFileList, setAudioFileList] = useState([]);



  // Bulk import states

  const [importModalVisible, setImportModalVisible] = useState(false);

  const [uploadingImport, setUploadingImport] = useState(false);

  const [importPreviewData, setImportPreviewData] = useState(null);



  // JSON import states

  const [jsonImportModalVisible, setJsonImportModalVisible] = useState(false);

  const [jsonInput, setJsonInput] = useState('');

  const [jsonPreviewData, setJsonPreviewData] = useState(null);

  const [uploadingJson, setUploadingJson] = useState(false);



  // Audio player states for view modal

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const audioRef = useRef(null);



  // Background audio settings states

  const [bgAudioSettingsVisible, setBgAudioSettingsVisible] = useState(false);

  const [guidelineSettingsVisible, setGuidelineSettingsVisible] = useState(false);

  const [bgAudioSettings, setBgAudioSettings] = useState({

    enabled: false,

    audioUrl: '',

    volume: 0.5

  });

  const [bgAudioUploading, setBgAudioUploading] = useState(false);

  const [bgAudioFile, setBgAudioFile] = useState(null);



  // Guideline settings states

  const [guidelineSettings, setGuidelineSettings] = useState({

    imageUrl: '',

    markdownText: ''

  });

  const [guidelineImageFile, setGuidelineImageFile] = useState(null);

  const [guidelineImageUploading, setGuidelineImageUploading] = useState(false);



  // Bulk voice creation states

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);



  // Search states

  const [searchText, setSearchText] = useState('');



  // Search history persistence for each tab

  const [searchHistory, setSearchHistory] = useState({

    news: [],

    library: [],

    story: [],

    caseTraining: [],

    longForm: [],

    home: []

  });



  // Filter history persistence for each tab

  const [filterHistory, setFilterHistory] = useState({

    news: {

      categoryFilter: 'all',

      imageFilter: 'all',

      diagramFilter: 'all',
      quizFilter: 'all',

      tag4Filter: [],

      searchText: ''

    },

    library: {

      categoryFilter: 'all',

      imageFilter: 'all',

      diagramFilter: 'all',
      quizFilter: 'all',

      tag4Filter: [],

      searchText: ''

    },

    story: {

      categoryFilter: 'all',

      imageFilter: 'all',

      diagramFilter: 'all',
      quizFilter: 'all',

      tag4Filter: [],

      searchText: ''

    },

    caseTraining: {

      categoryFilter: 'all',

      imageFilter: 'all',

      diagramFilter: 'all',
      quizFilter: 'all',

      tag1Filter: 'all',

      tag2Filter: 'all',

      tag3Filter: 'all',

      tag4Filter: [],

      searchText: ''

    },

    longForm: {

      categoryFilter: 'all',

      imageFilter: 'all',

      diagramFilter: 'all',
      quizFilter: 'all',

      tag4Filter: [],

      searchText: ''

    },

    home: {

      categoryFilter: 'all',

      imageFilter: 'all',

      diagramFilter: 'all',
      quizFilter: 'all',

      tag4Filter: [],

      searchText: ''

    }

  });

  const [searchLoading, setSearchLoading] = useState(false);

  const [userClasses, setUserClasses] = useState([]);

  const [userClassModalVisible, setUserClassModalVisible] = useState(false);

  const [selectedUserClasses, setSelectedUserClasses] = useState([]);



  // Voice Queue System

  const [voiceQueue, setVoiceQueue] = useState([]);

  const [processingQueue, setProcessingQueue] = useState(false);

  const [currentProcessing, setCurrentProcessing] = useState(null);

  const queueProcessorRef = useRef(null);



  // Embedding states

  const [embeddingAllLoading, setEmbeddingAllLoading] = useState(false);

  const [embeddingLoadingIds, setEmbeddingLoadingIds] = useState(new Set());

  const [embeddingProgress, setEmbeddingProgress] = useState({ current: 0, total: 0 });

  const [embeddedItems, setEmbeddedItems] = useState(new Set());



  // AI Summary states

  const [aiSummaryModalVisible, setAiSummaryModalVisible] = useState(false);

  const [aiSummaryData, setAiSummaryData] = useState([]);

  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  const [aiSummarySelectedRowKeys, setAiSummarySelectedRowKeys] = useState([]);



  // Add state for reportDN data

  const [reportDNData, setReportDNData] = useState([]);

  const [reportDNLoading, setReportDNLoading] = useState(false);



  // Table management states

  const [tables, setTables] = useState([]);

  const [editingTable, setEditingTable] = useState(null);

  const [tableModalVisible, setTableModalVisible] = useState(false);



  // Report Overview states

  const [reportOverviewModalVisible, setReportOverviewModalVisible] = useState(false);

  const [reportOverviewData, setReportOverviewData] = useState(null);



  // Company Summary Modal states

  const [companySummaryModalVisible, setCompanySummaryModalVisible] = useState(false);

  const [companySummarySearchTerm, setCompanySummarySearchTerm] = useState('');

  const [companySummaryLoading, setCompanySummaryLoading] = useState(false);

  const [companySummaryData, setCompanySummaryData] = useState(null);

  const [isCreatingSummary, setIsCreatingSummary] = useState(false);



  // Company Summary Queue states

  const [companySummaryQueue, setCompanySummaryQueue] = useState([]);



  // Filter states for news tab

  const [categoryFilter, setCategoryFilter] = useState('all');

  const [imageFilter, setImageFilter] = useState('all');

  const [diagramFilter, setDiagramFilter] = useState('all');
  const [quizFilter, setQuizFilter] = useState('all');

  const [tag1Filter, setTag1Filter] = useState('all');

  const [tag2Filter, setTag2Filter] = useState('all');

  const [tag3Filter, setTag3Filter] = useState('all');

  const [processingCompanySummaryQueue, setProcessingCompanySummaryQueue] = useState(false);

  const [currentCompanySummaryProcessing, setCurrentCompanySummaryProcessing] = useState(null);



  // Image Generation states

  const [imageGenerationLoading, setImageGenerationLoading] = useState(false);

  const [imageGenerationQueue, setImageGenerationQueue] = useState([]);

  const [processingImageQueue, setProcessingImageQueue] = useState(false);

  const [currentImageProcessing, setCurrentImageProcessing] = useState(null);


  // Diagram Generation states
  const [diagramGenerationQueue, setDiagramGenerationQueue] = useState([]);
  const [processingDiagramQueue, setProcessingDiagramQueue] = useState(false);
  const [currentDiagramProcessing, setCurrentDiagramProcessing] = useState(null);

  // Summary Detail Generation states
  const [summaryDetailQueue, setSummaryDetailQueue] = useState([]);
  const [processingSummaryDetailQueue, setProcessingSummaryDetailQueue] = useState(false);
  const [currentSummaryDetailProcessing, setCurrentSummaryDetailProcessing] = useState(null);

  // Tạo Case Training từ Learning Block - Queue states
  const [caseFromLearningBlockQueue, setCaseFromLearningBlockQueue] = useState([]);
  const [processingCaseFromLearningBlockQueue, setProcessingCaseFromLearningBlockQueue] = useState(false);
  const [currentCaseFromLearningBlockProcessing, setCurrentCaseFromLearningBlockProcessing] = useState(null);

  // Diagram Generation tracking states
  const [diagramGenerationStats, setDiagramGenerationStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    type: null // 'kroki' or 'html'
  });
  const [diagramGenerationResults, setDiagramGenerationResults] = useState([]);
  const [diagramProgressModalVisible, setDiagramProgressModalVisible] = useState(false);

  // Case Training from Learning Block tracking states
  const [caseFromLearningStats, setCaseFromLearningStats] = useState({
    total: 0,
    success: 0,
    failed: 0
  });
  const [caseFromLearningResults, setCaseFromLearningResults] = useState([]);
  const [caseFromLearningProgressModalVisible, setCaseFromLearningProgressModalVisible] = useState(false);
  const shouldStopRef = useRef(false);
  const [showImproveDetail, setShowImproveDetail] = useState(false);

  const [improveDetailLoading, setImproveDetailLoading] = useState(false);

  const [createQuizzLoading, setCreateQuizzLoading] = useState(false);

  const [updateCategoryLoading, setUpdateCategoryLoading] = useState(false);

  const [showCreateQuiz, setShowCreateQuiz] = useState(false);

  const [showUpdateQuiz, setShowUpdateQuiz] = useState(false);

  const [promptSettingsModalVisible, setPromptSettingsModalVisible] = useState(false);
  const [promptSettingsListModalVisible, setPromptSettingsListModalVisible] = useState(false);
  
  // Diagram prompt selection states
  const [selectDiagramPromptModalVisible, setSelectDiagramPromptModalVisible] = useState(false);
  const [pendingDiagramMode, setPendingDiagramMode] = useState(null);
  const [pendingDiagramRecords, setPendingDiagramRecords] = useState([]);

  // Prompt chọn khi tạo Case Training từ Learning Block
  const [selectCaseFromLearningPromptModalVisible, setSelectCaseFromLearningPromptModalVisible] = useState(false);
  const [pendingCaseFromLearningRecords, setPendingCaseFromLearningRecords] = useState([]);

  const [quizEditorVisible, setQuizEditorVisible] = useState(false);

  const [quizEditorRecord, setQuizEditorRecord] = useState(null);

  const [savingQuiz, setSavingQuiz] = useState(false);



  // Image Generation Configuration Modal

  const [imageConfigModalVisible, setImageConfigModalVisible] = useState(false);

  const [imageConfig, setImageConfig] = useState({

    descriptionModel: 'gpt-4o-mini',

    descriptionSystemMessage: 'You are an expert at creating precise, technical descriptions for educational illustrations. Create clear, detailed descriptions suitable for AI image generation.',

    imageModel: 'imagen-3.0-generate-002',

    imageSystemMessage: 'Create a professional, educational illustration based on the description. Focus on clarity and educational value.',

    englishPromptTemplate: `Create a precise technical illustration description for educational purposes based on the content summary. The description must be extremely specific and clear to ensure accurate image generation.



Requirements:

- Create a professional, educational illustration that represents the main concept from the summary

- Focus on business concepts, frameworks, methodologies, or key ideas mentioned

- Use clear, descriptive language that captures the essence of the content

- Ensure the description is suitable for AI image generation

- Keep it concise but detailed enough for accurate visualization

- The image should help visualize and explain the concept described in the summary



Format your response as:

**Illustration Description:**
[Your detailed description here]

**Key Elements to Include:**
- [Element 1]
- [Element 2]
- [Element 3]

**Visual Style:**
[Describe the visual style, colors, layout, etc.]`
  });

  // Diagram Generation Configuration Modal - Tách thành các key riêng biệt
  const [diagramConfigModalVisible, setDiagramConfigModalVisible] = useState(false);
  const [diagramConfig, setDiagramConfig] = useState({
    kroki: {
      diagramType: 'excalidraw',
      aiModel: '',
      ai1Model: '',
      ai1Prompt: '',
      ai2Model: '',
      ai2Prompt: '',
      ai3Model: '',
      ai3Prompt: '',
      quantity: 1
    },
    html: {
      aiModel: '',
      ai4Model: '',
      ai4Prompt: ''
    },
    excalidrawReact: {
      aiModel: '',
      aiPrompt: 'Bạn là chuyên gia tạo Excalidraw diagram. Nhiệm vụ của bạn là phân tích nội dung và tạo ra JSON hợp lệ cho Excalidraw.\n\nYêu cầu:\n1. Tạo JSON theo format Excalidraw chuẩn\n2. JSON phải có cấu trúc:\n   {\n     "type": "excalidraw",\n     "version": 2,\n     "source": "https://excalidraw.com",\n     "elements": [...],\n     "appState": {...},\n     "files": {}\n   }\n3. Elements phải là mảng các object với các type: rectangle, ellipse, diamond, arrow, text, line, etc.\n4. Mỗi element phải có: id, type, x, y, width, height, angle, strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity, groupIds, frameId, roundness, seed, versionNonce, isDeleted, boundElements, updated, link, locked\n5. Chỉ trả về JSON, không có markdown, không có giải thích',
      noteModel: 'gpt-4o-mini',
      notePrompt: 'Tạo ghi chú ngắn gọn (1-2 câu) mô tả diagram này dựa trên nội dung bài viết. Ghi chú phải rõ ràng, dễ hiểu và liên quan trực tiếp đến diagram.',
      quantity: 1
    }
  });
  // Diagram Preview Modal
  const [diagramPreviewModalVisible, setDiagramPreviewModalVisible] = useState(false);
  const [selectedDiagramData, setSelectedDiagramData] = useState(null);

  // Summary Detail Config (for creating summaryDetail from detail)
  const [summaryDetailConfig, setSummaryDetailConfig] = useState({
    aiModel: '',
    aiPrompt: ''
  });
  const [summaryDetailConfigModalVisible, setSummaryDetailConfigModalVisible] = useState(false);
  // Tag options state
  const [tag1Options, setTag1Options] = useState([]);
  const [tag2Options, setTag2Options] = useState([]);
  const [tag3Options, setTag3Options] = useState([]);
  // Categories state
  const [categoriesOptions, setCategoriesOptions] = useState([]);

  const [tag4Options, setTag4Options] = useState([]);
  const [programOptions, setProgramOptions] = useState([]);

  // Filter states

  const [tag4Filter, setTag4Filter] = useState([]); // Changed to array for multiple selection

  const [chapterFilter, setChapterFilter] = useState('all'); // Filter for number of programs

  const [programFilter, setProgramFilter] = useState('all'); // Filter for program selection

  const [voiceFilter, setVoiceFilter] = useState('all'); // Filter for voice: 'all' | 'hasVoice' | 'noVoice'

  const [tagManagementModalVisible, setTagManagementModalVisible] = useState(false);

  const [categoriesManagementModalVisible, setCategoriesManagementModalVisible] = useState(false);

  const [programManagementModalVisible, setProgramManagementModalVisible] = useState(false);

  const [bulkUpdateModalVisible, setBulkUpdateModalVisible] = useState(false);

  const [fieldToUpdate, setFieldToUpdate] = useState('category');

  const [allData, setAllData] = useState({

    news: [],

    library: [],

    story: [],

    caseTraining: [],

    longForm: []

  });



  const [filteredData, setFilteredData] = useState({

    news: [],

    library: [],

    story: [],

    caseTraining: [],

    longForm: []

  });



  const [audioText, setAudioText] = useState('');



  const [selectedAISummary, setSelectedAISummary] = useState(null);

  const [aiSummaryDetailModalVisible, setAISummaryDetailModalVisible] = useState(false);

  const [aiSummaryEditModalVisible, setAISummaryEditModalVisible] = useState(false);

  const [aiSummaryEditForm] = Form.useForm();



  // QuestionContent Modal states

  const [questionContentModalVisible, setQuestionContentModalVisible] = useState(false);

  const [selectedQuestionContent, setSelectedQuestionContent] = useState(null);

  const [selectedQuestionContentTitle, setSelectedQuestionContentTitle] = useState('');

  const [selectedQuestionContentRecord, setSelectedQuestionContentRecord] = useState(null);



  useEffect(() => {

    setSelectedRowKeys([]);

  }, [currentTab]);



  // Load search history from localStorage

  const loadSearchHistory = () => {

    try {

      const savedHistory = localStorage.getItem('k9management_search_history');

      if (savedHistory) {

        const parsedHistory = JSON.parse(savedHistory);

        setSearchHistory(parsedHistory);

      }

    } catch (error) {

      console.error('Error loading search history:', error);

    }

  };



  // Save search history to localStorage

  const saveSearchHistory = (newHistory) => {

    try {

      localStorage.setItem('k9management_search_history', JSON.stringify(newHistory));

    } catch (error) {

      console.error('Error saving search history:', error);

    }

  };



  // Add search term to history

  const addToSearchHistory = (term) => {

    if (!term.trim()) return;



    const currentHistory = searchHistory[currentTab] || [];

    const newHistory = [term, ...currentHistory.filter(item => item !== term)].slice(0, 10); // Keep last 10 searches



    const updatedHistory = {

      ...searchHistory,

      [currentTab]: newHistory

    };



    setSearchHistory(updatedHistory);

    saveSearchHistory(updatedHistory);

  };



  // Load search text for current tab

  const loadSearchTextForTab = () => {

    try {

      const savedSearchText = localStorage.getItem(`k9management_search_${currentTab}`);

      if (savedSearchText) {

        setSearchText(savedSearchText);

      } else {

        setSearchText('');

      }

    } catch (error) {

      console.error('Error loading search text:', error);

      setSearchText('');

    }

  };



  // Save search text for current tab

  const saveSearchTextForTab = (text) => {

    try {

      localStorage.setItem(`k9management_search_${currentTab}`, text);

    } catch (error) {

      console.error('Error saving search text:', error);

    }

  };



  // Load filter history from localStorage

  const loadFilterHistory = () => {

    try {

      const savedFilterHistory = localStorage.getItem('k9management_filter_history');

      if (savedFilterHistory) {

        const parsedHistory = JSON.parse(savedFilterHistory);

        setFilterHistory(parsedHistory);

      }

    } catch (error) {

      console.error('Error loading filter history:', error);

    }

  };



  // Save filter history to localStorage

  const saveFilterHistory = (newHistory) => {

    try {

      localStorage.setItem('k9management_filter_history', JSON.stringify(newHistory));

    } catch (error) {

      console.error('Error saving filter history:', error);

    }

  };



  // Load filters for current tab

  const loadFiltersForTab = () => {

    const currentFilters = filterHistory[currentTab];

    if (currentFilters) {

      setCategoryFilter(currentFilters.categoryFilter || 'all');

      setImageFilter(currentFilters.imageFilter || 'all');

      setDiagramFilter(currentFilters.diagramFilter || 'all');
      setQuizFilter(currentFilters.quizFilter || 'all');

      setTag4Filter(currentFilters.tag4Filter || []);

      setChapterFilter(currentFilters.chapterFilter || 'all');

      setProgramFilter(currentFilters.programFilter || 'all');

      setVoiceFilter(currentFilters.voiceFilter || 'all');

      setSearchText(currentFilters.searchText || '');



      if (currentTab === 'caseTraining') {

        setTag1Filter(currentFilters.tag1Filter || 'all');

        setTag2Filter(currentFilters.tag2Filter || 'all');

        setTag3Filter(currentFilters.tag3Filter || 'all');

      }

    }

  };



  // Save current filters for current tab

  const saveFiltersForTab = () => {

    const currentFilters = {

      categoryFilter,

      imageFilter,

      diagramFilter,
      quizFilter,

      tag4Filter,

      chapterFilter,

      searchText

    };



    if (currentTab === 'caseTraining') {

      currentFilters.tag1Filter = tag1Filter;

      currentFilters.tag2Filter = tag2Filter;

      currentFilters.tag3Filter = tag3Filter;

    }



    const updatedHistory = {

      ...filterHistory,

      [currentTab]: currentFilters

    };



    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

  };


  // Filter change handlers with auto-save

  const handleCategoryFilterChange = (value) => {

    setCategoryFilter(value);

    // Save immediately with the new value

    const currentFilters = {

      ...filterHistory[currentTab],

      categoryFilter: value

    };

    const updatedHistory = {

      ...filterHistory,

      [currentTab]: currentFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

  };



  const handleImageFilterChange = (value) => {

    setImageFilter(value);

    const currentFilters = {

      ...filterHistory[currentTab],

      imageFilter: value

    };

    const updatedHistory = {

      ...filterHistory,

      [currentTab]: currentFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

  };


  const handleDiagramFilterChange = (value) => {
    setDiagramFilter(value);
    const currentFilters = {
      ...filterHistory[currentTab],
      diagramFilter: value
    };
    const updatedHistory = {
      ...filterHistory,
      [currentTab]: currentFilters
    };
    setFilterHistory(updatedHistory);
    saveFilterHistory(updatedHistory);
  };


  const handleQuizFilterChange = (value) => {

    setQuizFilter(value);

    const currentFilters = {

      ...filterHistory[currentTab],

      quizFilter: value

    };

    const updatedHistory = {

      ...filterHistory,

      [currentTab]: currentFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

  };


  const handleTag4FilterChange = (value) => {

    setTag4Filter(value);

    const currentFilters = {

      ...filterHistory[currentTab],

      tag4Filter: value

    };

    const updatedHistory = {

      ...filterHistory,

      [currentTab]: currentFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

  };



  const handleChapterFilterChange = (value) => {

    setChapterFilter(value);

    const currentFilters = {

      ...filterHistory[currentTab],

      chapterFilter: value

    };

    const updatedHistory = {

      ...filterHistory,

      [currentTab]: currentFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

  };

  const handleProgramFilterChange = (value) => {

    setProgramFilter(value);

    const currentFilters = {

      ...filterHistory[currentTab],

      programFilter: value

    };

    const updatedHistory = {

      ...filterHistory,

      [currentTab]: currentFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

    // Apply filters after changing program filter
    if (['home', 'news', 'caseTraining', 'longForm'].includes(currentTab)) {
      applyFilters();
    }

  };

  const handleVoiceFilterChange = (value) => {
    setVoiceFilter(value);

    const currentFilters = {
      ...filterHistory[currentTab],
      voiceFilter: value
    };

    const updatedHistory = {
      ...filterHistory,
      [currentTab]: currentFilters
    };

    setFilterHistory(updatedHistory);
    saveFilterHistory(updatedHistory);

    // Apply filters after changing voice filter
    if (['home', 'news', 'caseTraining', 'longForm'].includes(currentTab)) {
      applyFilters();
    }
  };



  const handleTag1FilterChange = (value) => {

    setTag1Filter(value);

    const currentFilters = {

      ...filterHistory[currentTab],

      tag1Filter: value

    };

    const updatedHistory = {

      ...filterHistory,

      [currentTab]: currentFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

  };



  const handleTag2FilterChange = (value) => {

    setTag2Filter(value);

    const currentFilters = {

      ...filterHistory[currentTab],

      tag2Filter: value

    };

    const updatedHistory = {

      ...filterHistory,

      [currentTab]: currentFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

  };



  const handleTag3FilterChange = (value) => {

    setTag3Filter(value);

    const currentFilters = {

      ...filterHistory[currentTab],

      tag3Filter: value

    };

    const updatedHistory = {

      ...filterHistory,

      [currentTab]: currentFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

  };



  useEffect(() => {

    loadVoiceSettings();

    loadBackgroundAudioSettings();

    loadGuidelineSettings();

    loadImageConfig();

    loadDiagramConfig();
    loadSummaryDetailConfig();
    loadTagOptions();
    loadCategoriesOptions();

    loadSearchHistory();

    loadFilterHistory();

  }, []);

  // Load embedded items for current tab

  const loadEmbeddedItems = async () => {

    try {



      let table = currentTab;

      if (currentTab === 'reportDN') {

        table = 'report';

      }

      const embeddedData = await getEmbedingDataByTable(table);

      const embeddedIds = new Set(embeddedData.map(item => item.sourceId));

      setEmbeddedItems(embeddedIds);

      console.log(`Loaded ${embeddedIds.size} embedded items for ${currentTab}`);

    } catch (error) {

      console.error('Error loading embedded items:', error);

      setEmbeddedItems(new Set());

    }

  };



  // Load data when tab changes

  // Load user classes on mount
  useEffect(() => {
    const loadUserClasses = async () => {
      try {
        const classes = await getAllUserClass();
        setUserClasses(classes);
      } catch (error) {
        console.error('Error loading user classes:', error);
      }
    };
    loadUserClasses();
  }, []);

  useEffect(() => {

    // Load filters for current tab

    loadFiltersForTab();



    // Load embedded items for current tab

    loadEmbeddedItems();

    if (currentTab === 'report' && aiSummaryData.length === 0 && !aiSummaryLoading) {

      setAiSummaryLoading(true);

      getAllAISummaries().then(data => {

        // Lọc bỏ những bản ghi có info.sheetName = 'CompanySummary'

        const filteredData = filterCompanySummaryRecords(data);

        setAiSummaryData(filteredData);

      }).finally(() => setAiSummaryLoading(false));

    } else if (currentTab === 'reportDN' && reportDNData.length === 0 && !reportDNLoading) {

      setReportDNLoading(true);

      getAllAISummaries().then(data => {

        // Lấy ra các bản ghi có info.sheetName = 'CompanySummary'

        const companySummaryData = (data || []).filter(item => {

          if (!item.info) return false;

          try {

            const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;

            return info.sheetName === 'CompanySummary';

          } catch (e) {

            return false;

          }

        });

        setReportDNData(companySummaryData);

      }).finally(() => setReportDNLoading(false));

    } else if (['home', 'news', 'caseTraining', 'longForm', 'library', 'story'].includes(currentTab) && (!allData[currentTab] || allData[currentTab].length === 0)) {

      loadAllData();

    }



  }, [currentTab]);



  useEffect(() => {

    if (['home', 'news', 'caseTraining', 'longForm', 'library', 'story'].includes(currentTab)) {

      setData(filteredData[currentTab] || allData[currentTab] || []);

    }

  }, [currentTab, allData, filteredData]);



  // Apply filters when filter states change

  useEffect(() => {

    if (currentTab === 'home' || currentTab === 'news' || currentTab === 'caseTraining' || currentTab === 'longForm') {

      applyFilters();

    }

  }, [categoryFilter, imageFilter, diagramFilter, quizFilter, tag4Filter, chapterFilter,
    currentTab === 'caseTraining' ? tag1Filter : null,

    currentTab === 'caseTraining' ? tag2Filter : null,

    currentTab === 'caseTraining' ? tag3Filter : null,

    searchText, currentTab, programFilter, voiceFilter]);



  // Apply filters when any filter changes

  useEffect(() => {

    if (['home', 'news', 'caseTraining', 'longForm'].includes(currentTab)) {

      applyFilters();

    }

  }, [categoryFilter, imageFilter, diagramFilter, quizFilter, tag4Filter, chapterFilter, tag1Filter, tag2Filter, tag3Filter, searchText, programFilter, voiceFilter, currentTab]);


  // Apply filters when tab changes (to ensure fresh data is displayed)

  useEffect(() => {

    if (['home', 'news', 'caseTraining', 'longForm'].includes(currentTab)) {

      applyFilters();

    }

  }, [currentTab, allData]);



  // Reset only table column filters when tab changes

  useEffect(() => {

    if (['home', 'news', 'caseTraining', 'longForm'].includes(currentTab)) {

      // Force re-render table to reset column filters

      setTableKey(prev => prev + 1);

    }

  }, [currentTab]);



  // Voice Queue Processor

  useEffect(() => {

    if (voiceQueue.length > 0 && !processingQueue) {

      processVoiceQueue();

    }

  }, [voiceQueue, processingQueue]);



  // Image Queue Processor

  useEffect(() => {

    if (imageGenerationQueue.length > 0 && !processingImageQueue) {

      processImageQueue();

    }

  }, [imageGenerationQueue, processingImageQueue]);


  // Diagram Queue Processor
  useEffect(() => {
    if (diagramGenerationQueue.length > 0 && !processingDiagramQueue) {
      processDiagramQueue();
    }
  }, [diagramGenerationQueue, processingDiagramQueue]);

  // Summary Detail Queue Processor
  useEffect(() => {
    if (summaryDetailQueue.length > 0 && !processingSummaryDetailQueue) {
      processSummaryDetailQueue();
    }
  }, [summaryDetailQueue, processingSummaryDetailQueue]);

  // Case Training from Learning Block Queue Processor
  useEffect(() => {
    if (caseFromLearningBlockQueue.length > 0 && !processingCaseFromLearningBlockQueue) {
      processCaseFromLearningBlockQueue();
    }
  }, [caseFromLearningBlockQueue, processingCaseFromLearningBlockQueue]);


  // Cleanup audio when component unmounts

  useEffect(() => {

    return () => {

      if (audioRef.current) {

        audioRef.current.pause();

        audioRef.current = null;

      }

      // Stop queue processor

      if (queueProcessorRef.current) {

        clearTimeout(queueProcessorRef.current);

      }

    };

  }, []);



  // Sync uploadedAudioUrl with form field

  useEffect(() => {

    if (modalVisible && form) {

      form.setFieldValue('audioUrl', uploadedAudioUrl);

    }

  }, [uploadedAudioUrl, modalVisible, form]);



  const loadAllData = async () => {

    setLoading(true);

    try {

      const homeData = await getK9ByType('home');

      const newsData = await getK9ByType('news');

      const caseTrainingData = await getK9ByType('caseTraining');

      const longFormData = await getK9ByType('longForm');

      const libraryData = []

      // await getK9ByType('library') ;

      const storyData = []

      // await getK9ByType('story');



      const newAllData = {

        home: homeData || [],

        news: newsData || [],

        caseTraining: caseTrainingData || [],

        longForm: longFormData || [],

        library: libraryData || [],

        story: storyData || []

      };



      setAllData(newAllData);

      setFilteredData(newAllData); // Reset filtered data when loading new data

    } catch (error) {

      console.error('Error loading data:', error);

      message.error('Lỗi khi tải dữ liệu: ' + error.message);

    } finally {

      setLoading(false);

    }

  };

  const loadVoiceSettings = async () => {

    try {

      const settings = await getSettingByType('VOICE_GENERATION_CONFIG');

      if (settings?.setting) {

        setVoiceSettings(settings.setting);

      }

    } catch (error) {

      console.log('No voice generation settings found or error loading:', error);

    }

  };

  const saveVoiceSettings = async (settings) => {

    try {

      await createOrUpdateSetting({

        type: 'VOICE_GENERATION_CONFIG',

        setting: settings

      });

      setVoiceSettingsVisible(false);

      message.success('Đã lưu cài đặt voice!');

    } catch (error) {

      console.error('Error saving voice settings:', error);

      message.error('Lỗi khi lưu cài đặt voice!');

    }

  };

  const loadBackgroundAudioSettings = async () => {

    try {

      const settings = await getSettingByType('BACKGROUND_AUDIO');

      if (settings?.setting) {

        setBgAudioSettings(settings.setting);

        // Tạo file object cho display nếu có audio URL

        if (settings.setting.audioUrl) {

          setBgAudioFile({

            uid: '-1',

            name: 'background-audio',

            status: 'done',

            url: settings.setting.audioUrl,

          });

        }

      }

    } catch (error) {

      console.log('No background audio settings found or error loading:', error);

    }

  };



  const loadGuidelineSettings = async () => {

    try {

      const settings = await getSettingByType('GUIDELINE_SETTING');



      if (settings?.setting) {

        setGuidelineSettings(settings.setting);



        // Create file object for display if there's an image URL

        if (settings.setting.imageUrl) {

          setGuidelineImageFile({

            uid: '-1',

            name: 'guideline-image',

            status: 'done',

            url: settings.setting.imageUrl,

          });

        }

      } else {

        console.log('ℹ️ K9Management: No existing guideline settings found');

      }

    } catch (error) {

      console.log('❌ K9Management: Error loading guideline settings:', error);

    }

  };



  const loadImageConfig = async () => {

    try {

      const settings = await getSettingByType('IMAGE_GENERATION_CONFIG');

      if (settings?.setting) {

        setImageConfig(prev => ({

          ...prev,

          ...settings.setting

        }));

      }

    } catch (error) {

      console.log('No image generation config found or error loading:', error);

    }

  };


  const loadDiagramConfig = async () => {
    try {
      const settings = await getSettingByType('DIAGRAM_GENERATION_CONFIG');
      if (settings?.setting) {
        // Load new format với các key riêng biệt
        const loadedConfig = settings.setting;
        setDiagramConfig(prev => ({
          kroki: {
            ...prev.kroki,
            ...(loadedConfig.kroki || {})
          },
          html: {
            ...prev.html,
            ...(loadedConfig.html || {})
          },
          excalidrawReact: {
            ...prev.excalidrawReact,
            ...(loadedConfig.excalidrawReact || {})
          }
        }));

        // Migration từ format cũ (backward compatibility)
        if (!loadedConfig.kroki && !loadedConfig.html && !loadedConfig.excalidrawReact) {
          // Old format - migrate to new format
          const oldConfig = loadedConfig;
          setDiagramConfig(prev => ({
            kroki: {
              ...prev.kroki,
              diagramType: oldConfig.diagramType || prev.kroki.diagramType,
              aiModel: oldConfig.aiModel || prev.kroki.aiModel,
              ai1Model: oldConfig.ai1Model || prev.kroki.ai1Model,
              ai1Prompt: oldConfig.ai1Prompt || prev.kroki.ai1Prompt,
              ai2Model: oldConfig.ai2Model || prev.kroki.ai2Model,
              ai2Prompt: oldConfig.ai2Prompt || prev.kroki.ai2Prompt,
              ai3Model: oldConfig.ai3Model || prev.kroki.ai3Model,
              ai3Prompt: oldConfig.ai3Prompt || prev.kroki.ai3Prompt,
              quantity: oldConfig.quantity || prev.kroki.quantity
            },
            html: {
              ...prev.html,
              aiModel: oldConfig.aiModel || prev.html.aiModel,
              ai4Model: oldConfig.ai4Model || prev.html.ai4Model,
              ai4Prompt: oldConfig.ai4Prompt || prev.html.ai4Prompt
            },
            excalidrawReact: {
              ...prev.excalidrawReact,
              ...(oldConfig.excalidrawReact || {})
            }
          }));
        }
      }
    } catch (error) {
      console.log('No diagram generation config found or error loading:', error);
    }
  };

  // Load Summary Detail Config
  const loadSummaryDetailConfig = async () => {
    try {
      const settings = await getSettingByType('SUMMARY_DETAIL_CONFIG');
      if (settings?.setting) {
        setSummaryDetailConfig(settings.setting);
      }
    } catch (error) {
      console.log('No summary detail config found or error loading:', error);
    }
  };

  // Save Summary Detail Config
  const saveSummaryDetailConfig = async () => {
    try {
      await createOrUpdateSetting({
        type: 'SUMMARY_DETAIL_CONFIG',
        setting: summaryDetailConfig
      });
      message.success('Đã lưu cấu hình tóm tắt detail!');
    } catch (error) {
      console.error('Error saving summary detail config:', error);
      message.error('Lỗi khi lưu cấu hình tóm tắt detail!');
    }
  };




  const loadCategoriesOptions = async () => {
    try {
      // Load categories options
      const categoriesSettings = await getSettingByType('CATEGORIES_OPTIONS');
      if (categoriesSettings?.setting) {
        setCategoriesOptions(categoriesSettings.setting);
      }
    } catch (error) {
      console.log('Error loading categories options:', error);
    }
  };

  const loadTagOptions = async () => {

    try {

      // Load tag1 options

      const tag1Settings = await getSettingByType('TAG1_OPTIONS');

      if (tag1Settings?.setting) {

        setTag1Options(tag1Settings.setting);

      } else {

        // Default tag1 options if no settings exist

        const defaultTag1Options = [

          { value: 'Business Strategy', label: 'Business Strategy' },

          { value: 'Marketing', label: 'Marketing' },

          { value: 'Finance', label: 'Finance' },

          { value: 'Operations', label: 'Operations' },

          { value: 'Technology', label: 'Technology' },

          { value: 'Leadership', label: 'Leadership' },

          { value: 'Innovation', label: 'Innovation' },

          { value: 'Customer Experience', label: 'Customer Experience' }

        ];

        setTag1Options(defaultTag1Options);

        // Save default options to settings

        await createOrUpdateSetting({

          type: 'TAG1_OPTIONS',

          setting: defaultTag1Options

        });

      }



      // Load tag2 options

      const tag2Settings = await getSettingByType('TAG2_OPTIONS');

      if (tag2Settings?.setting) {

        setTag2Options(tag2Settings.setting);

      } else {

        // Default tag2 options if no settings exist

        const defaultTag2Options = [

          { value: 'Beginner', label: 'Beginner' },

          { value: 'Intermediate', label: 'Intermediate' },

          { value: 'Advanced', label: 'Advanced' },

          { value: 'Expert', label: 'Expert' },

          { value: 'Case Study', label: 'Case Study' },

          { value: 'Theory', label: 'Theory' },

          { value: 'Practice', label: 'Practice' },

          { value: 'Tool', label: 'Tool' }

        ];

        setTag2Options(defaultTag2Options);

        // Save default options to settings

        await createOrUpdateSetting({

          type: 'TAG2_OPTIONS',

          setting: defaultTag2Options

        });

      }



      // Load tag3 options

      const tag3Settings = await getSettingByType('TAG3_OPTIONS');

      if (tag3Settings?.setting) {

        setTag3Options(tag3Settings.setting);

      } else {

        // Default tag3 options if no settings exist

        const defaultTag3Options = [

          { value: 'Industry', label: 'Industry' },

          { value: 'Startup', label: 'Startup' },

          { value: 'Enterprise', label: 'Enterprise' },

          { value: 'SME', label: 'SME' },

          { value: 'Global', label: 'Global' },

          { value: 'Local', label: 'Local' },

          { value: 'Digital', label: 'Digital' },

          { value: 'Traditional', label: 'Traditional' }

        ];

        setTag3Options(defaultTag3Options);

        // Save default options to settings

        await createOrUpdateSetting({

          type: 'TAG3_OPTIONS',

          setting: defaultTag3Options

        });

      }

      const tag4Settings = await getSettingByType('TAG4_OPTIONS');

      if (tag4Settings?.setting) {

        setTag4Options(tag4Settings.setting);

        setProgramOptions(tag4Settings.setting); // Cập nhật programOptions

      } else {

        // Default tag3 options if no settings exist

        const defaultTag4Options = [

          { value: 'Program 1', label: 'Program 1' },

          { value: 'Program 2', label: 'Program 2' },

          { value: 'Program 3', label: 'Program 3' },

          { value: 'Program 4', label: 'Program 4' },

          { value: 'Program 5', label: 'Program 5' },

        ];

        setTag4Options(defaultTag4Options);

        setProgramOptions(defaultTag4Options); // Cập nhật programOptions

        // Save default options to settings

        await createOrUpdateSetting({

          type: 'TAG4_OPTIONS',

          setting: defaultTag4Options

        });

      }

    } catch (error) {

      console.log('Error loading tag options:', error);

      // Set default options on error

      setTag1Options([

        { value: 'Business Strategy', label: 'Business Strategy' },

        { value: 'Marketing', label: 'Marketing' },

        { value: 'Finance', label: 'Finance' },

        { value: 'Operations', label: 'Operations' }

      ]);

      setTag2Options([

        { value: 'Beginner', label: 'Beginner' },

        { value: 'Intermediate', label: 'Intermediate' },

        { value: 'Advanced', label: 'Advanced' },

        { value: 'Expert', label: 'Expert' }

      ]);

      setTag3Options([

        { value: 'Industry', label: 'Industry' },

        { value: 'Startup', label: 'Startup' },

        { value: 'Enterprise', label: 'Enterprise' },

        { value: 'SME', label: 'SME' }

      ]);



    }

  };



  const saveCategoriesOptions = async (categoriesList) => {
    try {
      await createOrUpdateSetting({
        type: 'CATEGORIES_OPTIONS',
        setting: categoriesList
      });

      setCategoriesOptions(categoriesList);
      message.success('Đã lưu cấu hình categories thành công!');
    } catch (error) {
      console.error('Error saving categories options:', error);
      message.error('Lỗi khi lưu cấu hình categories!');
    }
  };

  const saveTagOptions = async (tag1List, tag2List, tag3List) => {

    try {

      await createOrUpdateSetting({

        type: 'TAG1_OPTIONS',

        setting: tag1List

      });

      await createOrUpdateSetting({

        type: 'TAG2_OPTIONS',

        setting: tag2List

      });

      await createOrUpdateSetting({

        type: 'TAG3_OPTIONS',

        setting: tag3List

      });

      setTag1Options(tag1List);

      setTag2Options(tag2List);

      setTag3Options(tag3List);

      message.success('Đã lưu cấu hình tag thành công!');

    } catch (error) {

      console.error('Error saving tag options:', error);

      message.error('Lỗi khi lưu cấu hình tag!');

    }

  };



  const handleSaveTags = async (tag4List) => {

    try {

      await createOrUpdateSetting({

        type: 'TAG4_OPTIONS',

        setting: tag4List

      });

      setTag4Options(tag4List);

      setProgramOptions(tag4List); // Cập nhật programOptions

      message.success('Đã lưu cấu hình tag thành công!');

    } catch (error) {

      console.error('Error saving tag options:', error);

      message.error('Lỗi khi lưu cấu hình tag!');

    }

  };



  const saveImageConfig = async () => {

    try {

      await createOrUpdateSetting({

        type: 'IMAGE_GENERATION_CONFIG',

        setting: imageConfig

      });

      setImageConfigModalVisible(false);

      message.success('Lưu cấu hình tạo ảnh thành công!');

    } catch (error) {

      console.error('Error saving image config:', error);

      message.error('Lỗi khi lưu cấu hình tạo ảnh!');

    }

  };



  const saveDiagramConfig = async () => {
    try {
      await createOrUpdateSetting({
        type: 'DIAGRAM_GENERATION_CONFIG',
        setting: diagramConfig
      });
      setDiagramConfigModalVisible(false);
      message.success('Lưu cấu hình tạo diagram thành công!');
    } catch (error) {
      console.error('Error saving diagram config:', error);
      message.error('Lỗi khi lưu cấu hình tạo diagram!');
    }
  };


  //Embeding

  const handleEmbedingAll = async () => {

    console.log('Embeding all for table:', currentTab);

    setEmbeddingAllLoading(true);



    // Filter items that haven't been embedded yet

    let allDataForTab = [];

    if (currentTab === 'report') {

      allDataForTab = aiSummaryData || [];

    } else if (currentTab === 'reportDN') {

      allDataForTab = reportDNData || [];

    } else {

      allDataForTab = allData[currentTab] || [];

    }



    // Nếu có selectedRowKeys, chỉ xử lý những item được chọn

    let itemsToProcess = allDataForTab;

    if (selectedRowKeys.length > 0) {

      itemsToProcess = allDataForTab.filter(item => selectedRowKeys.includes(item.id));

    }



    const unembeddedItems = itemsToProcess.filter(item => item.id && !embeddedItems.has(item.id));



    if (unembeddedItems.length === 0) {

      if (selectedRowKeys.length > 0) {

        message.info(`Tất cả items được chọn trong tab ${currentTab} đã được embedding!`);

      } else {

        message.info(`Tất cả items trong tab ${currentTab} đã được embedding!`);

      }

      return;

    }



    // Set loading state for unembedded items only

    const unembeddedIds = unembeddedItems.map(item => item.id);

    setEmbeddingLoadingIds(new Set(unembeddedIds));



    try {

      // Lấy tất cả dữ liệu của currentTab

      if (unembeddedItems.length === 0) {

        message.warning(`Không có dữ liệu để embedding cho tab ${currentTab}!`);

        return;

      }



      let successCount = 0;

      let errorCount = 0;



      // Xử lý từng item một cách tuần tự để tránh quá tải

      for (let i = 0; i < unembeddedItems.length; i++) {

        const item = unembeddedItems[i];

        if (!item.id) {

          console.warn('Item missing id:', item);

          continue;

        }



        // Update progress

        setEmbeddingProgress({ current: i + 1, total: unembeddedItems.length });



        try {

          // Xóa embedding cũ trước khi tạo mới

          try {

            await deleteEmbedingDataBySourceId(item.id, currentTab);

          } catch (error) {

            console.warn(`Failed to delete old embedding for ${currentTab} ID ${item.id}:`, error);

          }



          // Tạo embedding cho từng item sử dụng createEmbeddingWithAI

          let content = '';

          if (currentTab === 'report' || currentTab === 'reportDN') {

            // Cho tab report và reportDN, sử dụng summary2 và fileUrls

            let fileContent = '';

            if (item.fileUrls && Array.isArray(item.fileUrls) && item.fileUrls.length > 0) {

              fileContent = ` Files: ${item.fileUrls.join(', ')}`;

            }

            content = `${item.summary2 || ''}${fileContent}`.trim();

          } else {

            // Cho các tab khác, sử dụng detail

            content = `${item.title || ''} ${item.summary || ''} ${item.detail || ''}`.trim();

          }



          if (content) {

            await createEmbeddingWithAI(item.id, content, currentTab);

            successCount++;



            // Hiển thị tên item phù hợp

            let itemTitle = '';

            if (currentTab === 'report' || currentTab === 'reportDN') {

              try {

                const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;

                itemTitle = info?.title || `Report ID ${item.id}`;

              } catch {

                itemTitle = `Report ID ${item.id}`;

              }

            } else {

              itemTitle = item.title || `Item ID ${item.id}`;

            }



            console.log(`✅ Embedding completed for ${currentTab} ID ${item.id}: ${itemTitle}`);

          } else {

            console.warn(`⚠️ No content for embedding ${currentTab} ID ${item.id}: ${item.title || `Report ID ${item.id}`}`);

          }

        } catch (error) {

          errorCount++;

          console.error(`❌ Failed to embed ${currentTab} ID ${item.id}:`, error);

        }

      }



      console.log(`📊 Embedding summary: ${successCount} successful, ${errorCount} failed`);



      let successMessage = '';

      if (selectedRowKeys.length > 0) {

        successMessage = `Embedding cho ${selectedRowKeys.length} items được chọn trong tab ${currentTab} đã hoàn thành! (${successCount}/${unembeddedItems.length} items)`;

      } else {

        successMessage = `Embedding toàn bộ cho ${currentTab} đã hoàn thành! (${successCount}/${unembeddedItems.length} items)`;

      }

      message.success(successMessage);



      if (errorCount > 0) {

        message.warning(`${errorCount} items failed to embed. Check console for details.`);

      }



      // Reload embedded items to update UI

      await loadEmbeddedItems();

    } catch (error) {

      console.error('Embedding error:', error);

      message.error('Lỗi khi thực hiện embedding: ' + (error.message || error));

    } finally {

      setEmbeddingAllLoading(false);

      // Clear all loading states

      setEmbeddingLoadingIds(new Set());

      // Reset progress

      setEmbeddingProgress({ current: 0, total: 0 });

    }

  };



  // Helper function to check if an item is being embedded

  const isEmbedding = (id) => {

    return embeddingLoadingIds.has(id);

  };



  // Helper function to filter out CompanySummary records

  const filterCompanySummaryRecords = (data) => {

    return (data || []).filter(item => {

      if (!item.info) return true;

      try {

        const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;

        return info.sheetName !== 'CompanySummary';

      } catch (e) {

        // Nếu không parse được info, giữ lại bản ghi

        return true;

      }

    });

  };



  const handleEmbeding = async (id) => {

    console.log('Embeding', id, 'for table:', currentTab);



    // Set loading state for this specific item

    setEmbeddingLoadingIds(prev => new Set(prev).add(id));



    try {

      // Lấy dữ liệu của item

      let item = null;

      if (currentTab === 'report') {

        item = aiSummaryData?.find(item => item.id === id);

      } else if (currentTab === 'reportDN') {

        item = reportDNData?.find(item => item.id === id);

      } else {

        item = allData[currentTab]?.find(item => item.id === id);

      }

      if (!item) {

        message.error('Không tìm thấy dữ liệu!');

        return;

      }



      if (!item.id) {

        message.error('Item không có ID!');

        return;

      }



      // Xóa embedding cũ

      try {

        await deleteEmbedingDataBySourceId(id, currentTab);

      } catch (error) {

        console.warn(`Failed to delete old embedding for ${currentTab} ID ${id}:`, error);

      }

      let response = null;

      // Tạo embedding data mới

      let content = '';

      if (currentTab === 'report' || currentTab === 'reportDN') {

        // Cho tab report, sử dụng summary2 và fileUrls

        let fileContent = '';

        if (item.fileUrls && Array.isArray(item.fileUrls) && item.fileUrls.length > 0) {

          fileContent = ` Files: ${item.fileUrls.join(', ')}`;

        }

        content = `${item.summary2 || ''}${fileContent}`.trim();

        response = await createEmbeddingWithAI(id, content, 'report');

      } else {

        // Cho các tab khác, sử dụng detail

        content = `${item.title || ''} ${item.summary || ''} ${item.detail || ''}`.trim();

        response = await createEmbeddingWithAI(id, content, currentTab);

      }



      if (response) {





        console.log('Response', response);



        // Hiển thị tên item phù hợp

        let itemTitle = '';

        if (currentTab === 'report' || currentTab === 'reportDN') {

          try {

            const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;

            itemTitle = info?.title || `Report ID ${id}`;

          } catch {

            itemTitle = `Report ID ${id}`;

          }

        } else {

          itemTitle = item.title || `Item ID ${id}`;

        }



        // Hiển thị thông tin chi tiết về chunks được tạo

        const chunksCreated = response.data?.chunksCreated || 0;

        const totalTextLength = response.data?.totalTextLength || 0;



        message.success(`Embedding cho ${itemTitle} đã hoàn thành! (${chunksCreated} chunks từ ${totalTextLength} ký tự)`);



        // Reload embedded items to update UI

        await loadEmbeddedItems();

      } else {

        message.warning('Không có nội dung để embedding!');

      }

    } catch (error) {

      console.error('Embedding error:', error);

      message.error('Lỗi khi thực hiện embedding: ' + (error.message || error));

    } finally {

      // Clear loading state for this specific item

      setEmbeddingLoadingIds(prev => {

        const newSet = new Set(prev);

        newSet.delete(id);

        return newSet;

      });

    }

  };



  // Local search function

  const handleLocalSearch = (searchValue) => {

    setSearchText(searchValue);

    // Save immediately with the new search value

    const currentFilters = {

      ...filterHistory[currentTab],

      searchText: searchValue

    };

    const updatedHistory = {

      ...filterHistory,

      [currentTab]: currentFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);



    if (currentTab === 'home' || currentTab === 'news' || currentTab === 'caseTraining' || currentTab === 'longForm') {

      // For home, news, caseTraining, and longForm tabs, apply filters which will include search

      applyFilters();

    } else {

      // For other tabs, use the old logic

      if (!searchValue.trim()) {

        setFilteredData(allData);

        return;

      }



      const searchLower = searchValue.toLowerCase();

      const filtered = {

        home: allData.home.filter(item =>

          item.id?.toString().toLowerCase().includes(searchLower) ||

          item.cid?.toLowerCase().includes(searchLower) ||

          item.title?.toLowerCase().includes(searchLower) ||

          item.summary?.toLowerCase().includes(searchLower) ||

          item.detail?.toLowerCase().includes(searchLower) ||

          item.category?.toLowerCase().includes(searchLower) ||

          item.source?.toLowerCase().includes(searchLower)

        ),

        news: allData.news.filter(item =>

          item.id?.toString().toLowerCase().includes(searchLower) ||

          item.cid?.toLowerCase().includes(searchLower) ||

          item.title?.toLowerCase().includes(searchLower) ||

          item.summary?.toLowerCase().includes(searchLower) ||

          item.detail?.toLowerCase().includes(searchLower) ||

          item.category?.toLowerCase().includes(searchLower) ||

          item.source?.toLowerCase().includes(searchLower)

        ),

        caseTraining: allData.caseTraining.filter(item =>

          item.id?.toString().toLowerCase().includes(searchLower) ||

          item.cid?.toLowerCase().includes(searchLower) ||

          item.title?.toLowerCase().includes(searchLower) ||

          item.summary?.toLowerCase().includes(searchLower) ||

          item.detail?.toLowerCase().includes(searchLower) ||

          item.category?.toLowerCase().includes(searchLower) ||

          item.source?.toLowerCase().includes(searchLower) ||

          item.tag1?.toLowerCase().includes(searchLower) ||

          item.tag2?.toLowerCase().includes(searchLower) ||

          item.tag3?.toLowerCase().includes(searchLower)

        ),

        longForm: allData.longForm.filter(item =>

          item.id?.toString().toLowerCase().includes(searchLower) ||

          item.cid?.toLowerCase().includes(searchLower) ||

          item.title?.toLowerCase().includes(searchLower) ||

          item.summary?.toLowerCase().includes(searchLower) ||

          item.detail?.toLowerCase().includes(searchLower) ||

          item.category?.toLowerCase().includes(searchLower) ||

          item.source?.toLowerCase().includes(searchLower)

        ),

        library: allData.library.filter(item =>

          item.id?.toString().toLowerCase().includes(searchLower) ||

          item.cid?.toLowerCase().includes(searchLower) ||

          item.title?.toLowerCase().includes(searchLower) ||

          item.summary?.toLowerCase().includes(searchLower) ||

          item.detail?.toLowerCase().includes(searchLower) ||

          item.category?.toLowerCase().includes(searchLower)

        ),

        story: allData.story.filter(item =>

          item.id?.toString().toLowerCase().includes(searchLower) ||

          item.cid?.toLowerCase().includes(searchLower) ||

          item.title?.toLowerCase().includes(searchLower) ||

          item.summary?.toLowerCase().includes(searchLower) ||

          item.detail?.toLowerCase().includes(searchLower) ||

          item.category?.toLowerCase().includes(searchLower) ||

          item.audioText?.toLowerCase().includes(searchLower)

        )

      };



      setFilteredData(filtered);

    }

  };



  // Handle search submission (when user presses Enter or clicks search)

  const handleSearchSubmit = (searchValue) => {

    if (searchValue.trim()) {

      addToSearchHistory(searchValue);

    }

    handleLocalSearch(searchValue);

  };



  // Filter functions for home, news, caseTraining, and longForm tabs

  const applyFilters = () => {

    if (currentTab !== 'home' && currentTab !== 'news' && currentTab !== 'caseTraining' && currentTab !== 'longForm') {

      setFilteredData(allData);

      return;

    }



    let filteredData = [];

    if (currentTab === 'home') {

      filteredData = allData.home || [];

    } else if (currentTab === 'news') {

      filteredData = allData.news || [];

    } else if (currentTab === 'caseTraining') {

      filteredData = allData.caseTraining || [];

    } else if (currentTab === 'longForm') {

      filteredData = allData.longForm || [];

    }





    // Apply category filter

    if (categoryFilter !== 'all') {

      if (categoryFilter === '') {

        // Filter for empty/null categories

        filteredData = filteredData.filter(item => !item.category || item.category == '');

      } else {

        // Filter for specific category

        filteredData = filteredData.filter(item => item.category === categoryFilter);

      }

    }



    // Apply image filter

    if (imageFilter !== 'all') {

      if (imageFilter === 'has') {

        filteredData = filteredData.filter(item => item.avatarUrl);

      } else if (imageFilter === 'no') {

        filteredData = filteredData.filter(item => !item.avatarUrl);

      }

    }


    // Apply diagram filter
    if (diagramFilter !== 'all') {
      if (diagramFilter === 'not_created') {
        filteredData = filteredData.filter(item => !item.diagramHtmlCode && !item.diagramExcalidrawJson);
      } else if (diagramFilter === 'html') {
        filteredData = filteredData.filter(item => item.diagramHtmlCode && item.diagramHtmlCode.length > 0);
      } else if (diagramFilter === 'excalidraw') {
        filteredData = filteredData.filter(item => item.diagramExcalidrawJson && item.diagramExcalidrawJson.length > 0);
      }
    }


    // Apply quiz filter

    if (quizFilter !== 'all') {

      if (quizFilter === 'has') {

        filteredData = filteredData.filter(item => {

          const questionContent = item.questionContent || item.quizContent || item.quizzContent;

          return questionContent && (

            (questionContent.questionQuiz && questionContent.questionQuiz.length > 0) ||

            (questionContent.questionEssay && questionContent.questionEssay.length > 0)

          );

        });

      } else if (quizFilter === 'no') {

        filteredData = filteredData.filter(item => {

          const questionContent = item.questionContent || item.quizContent || item.quizzContent;

          return !questionContent || (

            (!questionContent.questionQuiz || questionContent.questionQuiz.length === 0) &&

            (!questionContent.questionEssay || questionContent.questionEssay.length === 0)

          );

        });

      }

    }



    // Apply tag4 filter (Program) for all tabs

    if (tag4Filter && tag4Filter.length > 0) {

      filteredData = filteredData.filter(item => {

        const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];

        // Exact match: item's tag4 array must exactly match the selected filter values
        return tag4Filter.length === itemTag4Array.length &&
          tag4Filter.every(program => itemTag4Array.includes(program));

      });

    }



    // Apply chapter filter for all tabs (filter by number of programs)

    if (chapterFilter !== 'all') {

      if (chapterFilter === 'has') {

        filteredData = filteredData.filter(item => item.tag4 && Array.isArray(item.tag4) && item.tag4.length > 0);

      } else if (chapterFilter === 'no') {

        filteredData = filteredData.filter(item => !item.tag4 || !Array.isArray(item.tag4) || item.tag4.length === 0);

      } else if (chapterFilter === '1') {

        filteredData = filteredData.filter(item => item.tag4 && Array.isArray(item.tag4) && item.tag4.length === 1);

      } else if (chapterFilter === '2') {

        filteredData = filteredData.filter(item => item.tag4 && Array.isArray(item.tag4) && item.tag4.length === 2);

      } else if (chapterFilter === '3') {

        filteredData = filteredData.filter(item => item.tag4 && Array.isArray(item.tag4) && item.tag4.length === 3);

      } else if (chapterFilter === '4') {

        filteredData = filteredData.filter(item => item.tag4 && Array.isArray(item.tag4) && item.tag4.length === 4);

      } else if (chapterFilter === '5') {

        filteredData = filteredData.filter(item => item.tag4 && Array.isArray(item.tag4) && item.tag4.length === 5);

      } else if (chapterFilter === '6') {

        filteredData = filteredData.filter(item => item.tag4 && Array.isArray(item.tag4) && item.tag4.length === 6);

      } else if (chapterFilter === '7') {

        filteredData = filteredData.filter(item => item.tag4 && Array.isArray(item.tag4) && item.tag4.length === 7);

      } else if (chapterFilter === '8') {

        filteredData = filteredData.filter(item => item.tag4 && Array.isArray(item.tag4) && item.tag4.length === 8);

      } else if (chapterFilter === '9') {

        filteredData = filteredData.filter(item => item.tag4 && Array.isArray(item.tag4) && item.tag4.length === 9);

      } else if (chapterFilter === '10+') {

        filteredData = filteredData.filter(item => item.tag4 && Array.isArray(item.tag4) && item.tag4.length >= 10);

      }

    }



    // Apply tag filters only for caseTraining

    if (currentTab === 'caseTraining') {

      // Apply tag1 filter

      if (tag1Filter !== 'all') {

        if (tag1Filter === null) {

          // Filter for empty/null tag1

          filteredData = filteredData.filter(item => !item.tag1 || item.tag1 === '');

        } else {

          // Filter for specific tag1

          filteredData = filteredData.filter(item => item.tag1 === tag1Filter);

        }

      }



      // Apply tag2 filter

      if (tag2Filter !== 'all') {

        if (tag2Filter === null) {

          // Filter for empty/null tag2

          filteredData = filteredData.filter(item => !item.tag2 || item.tag2 === '');

        } else {

          // Filter for specific tag2

          filteredData = filteredData.filter(item => item.tag2 === tag2Filter);

        }

      }



      // Apply tag3 filter

      if (tag3Filter !== 'all') {

        if (tag3Filter === null) {

          // Filter for empty/null tag3

          filteredData = filteredData.filter(item => !item.tag3 || item.tag3 === '');

        } else {

          // Filter for specific tag3

          filteredData = filteredData.filter(item => item.tag3 === tag3Filter);

        }

      }


    }



    // Apply program filter
    if (programFilter && programFilter !== 'all') {
      filteredData = filteredData.filter(item => item.tag4.includes(programFilter));
    }
    // Apply search filter if exists

    if (searchText.trim()) {

      const searchLower = searchText.toLowerCase();

      filteredData = filteredData.filter(item =>

        item.id?.toString().toLowerCase().includes(searchLower) ||

        item.cid?.toLowerCase().includes(searchLower) ||

        item.title?.toLowerCase().includes(searchLower) ||

        item.summary?.toLowerCase().includes(searchLower) ||

        item.detail?.toLowerCase().includes(searchLower) ||

        item.category?.toLowerCase().includes(searchLower) ||

        item.source?.toLowerCase().includes(searchLower) ||

        (currentTab === 'caseTraining' && (

          item.tag1?.toLowerCase().includes(searchLower) ||

          item.tag2?.toLowerCase().includes(searchLower) ||

          item.tag3?.toLowerCase().includes(searchLower)

        ))

      );

    }

    // Apply voice filter
    if (voiceFilter !== 'all') {
      if (voiceFilter === 'hasVoice') {
        // Filter for items that have voice
        filteredData = filteredData.filter(item => {
          const hasVoice = item.audioUrl && item.audioUrl.trim() !== '';
          return hasVoice;
        });
      } else if (voiceFilter === 'noVoice') {
        // Filter for items that don't have voice
        filteredData = filteredData.filter(item => {
          const hasVoice = !item.audioUrl || item.audioUrl.trim() === '';
          return hasVoice;
        });
      }
    }

    setFilteredData({

      ...allData,

      [currentTab]: filteredData

    });

  };


  // Generate category filters from actual data for current tab

  const generateCategoryFilters = (tabData) => {

    if (!tabData || !Array.isArray(tabData)) return [];



    // Get all categories including empty/null ones

    const allCategories = tabData.map(item => item.category);

    const categories = [...new Set(allCategories)];



    return categories.map(category => ({

      text: category || 'Trống',

      value: category || null

    }));

  };



  // Generate tag1 filters from actual data for current tab

  const generateTag1Filters = (tabData) => {

    if (!tabData || !Array.isArray(tabData)) return [];



    // Get all tag1 values including empty/null ones

    const allTag1s = tabData.map(item => item.tag1);

    const tag1s = [...new Set(allTag1s)];



    return tag1s.map(tag1 => ({

      text: tag1 || 'Trống',

      value: tag1 || null

    }));

  };



  // Generate tag2 filters from actual data for current tab

  const generateTag2Filters = (tabData) => {

    if (!tabData || !Array.isArray(tabData)) return [];



    // Get all tag2 values including empty/null ones

    const allTag2s = tabData.map(item => item.tag2);

    const tag2s = [...new Set(allTag2s)];



    return tag2s.map(tag2 => ({

      text: tag2 || 'Trống',

      value: tag2 || null

    }));

  };



  // Generate tag3 filters from actual data for current tab

  const generateTag3Filters = (tabData) => {

    if (!tabData || !Array.isArray(tabData)) return [];



    // Get all tag3 values including empty/null ones

    const allTag3s = tabData.map(item => item.tag3);

    const tag3s = [...new Set(allTag3s)];



    return tag3s.map(tag3 => ({

      text: tag3 || 'Trống',

      value: tag3 || null

    }));

  };



  // Get current tab's category filters

  const getCurrentTabCategoryFilters = () => {

    const currentTabData = allData[currentTab] || [];

    return generateCategoryFilters(currentTabData);

  };



  // Get current tab's tag1 filters

  const getCurrentTabTag1Filters = () => {

    const currentTabData = allData[currentTab] || [];

    return generateTag1Filters(currentTabData);

  };



  // Get current tab's tag2 filters

  const getCurrentTabTag2Filters = () => {

    const currentTabData = allData[currentTab] || [];

    return generateTag2Filters(currentTabData);

  };



  // Get current tab's tag3 filters

  const getCurrentTabTag3Filters = () => {

    const currentTabData = allData[currentTab] || [];

    return generateTag3Filters(currentTabData);

  };




  // Handle tab change

  const handleTabChange = (newTab) => {

    // Update current tab

    setCurrentTab(newTab);

  };



  // Reset all filters

  const resetFilters = () => {

    setCategoryFilter('all');

    setImageFilter('all');

    setDiagramFilter('all');
    setQuizFilter('all');

    setTag4Filter([]);

    setChapterFilter('all');

    setProgramFilter('all');

    if (currentTab === 'caseTraining') {

      setTag1Filter('all');

      setTag2Filter('all');

      setTag3Filter('all');

    }

    setSearchText('');



    // Save immediately with reset values

    const resetFilters = {

      categoryFilter: 'all',

      imageFilter: 'all',

      diagramFilter: 'all',
      quizFilter: 'all',

      tag4Filter: [],

      chapterFilter: 'all',

      searchText: '',

      ...(currentTab === 'caseTraining' && {

        tag1Filter: 'all',

        tag2Filter: 'all',

        tag3Filter: 'all'

      })

    };



    const updatedHistory = {

      ...filterHistory,

      [currentTab]: resetFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);



    setFilteredData(allData);

  };



  // Clear filter history for current tab

  const clearFilterHistory = () => {

    const updatedHistory = {

      ...filterHistory,

      [currentTab]: {

        categoryFilter: 'all',

        imageFilter: 'all',

        diagramFilter: 'all',
        quizFilter: 'all',

        tag4Filter: [],

        chapterFilter: 'all',

        searchText: '',

        ...(currentTab === 'caseTraining' && {

          tag1Filter: 'all',

          tag2Filter: 'all',

          tag3Filter: 'all'

        })

      }

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

  };



  // Handle bulk update

  const handleBulkUpdate = (fieldToUpdate) => {

    if (selectedRowKeys.length === 0) {

      message.warning('Vui lòng chọn ít nhất một bản ghi để cập nhật');

      return;

    }

    setBulkUpdateModalVisible(true);

    setFieldToUpdate(fieldToUpdate);

  };



  // Handle bulk update success

  const handleBulkUpdateSuccess = () => {

    // Reload data after successful bulk update

    loadAllData();

    setSelectedRowKeys([]);

  };

  // Handle bulk toggle hasTitle

  const handleBulkToggleHasTitle = async (toggleTo) => {

    if (selectedRowKeys.length === 0) {

      message.warning('Vui lòng chọn ít nhất một bản ghi để cập nhật');

      return;

    }

    try {

      setLoading(true);

      // Call API để cập nhật hasTitle cho tất cả records được chọn

      const updatePromises = selectedRowKeys.map(id =>

        updateK9({ id, hasTitle: toggleTo })

      );

      await Promise.all(updatePromises);

      // Cập nhật local state theo đúng pattern

      const updater = (list) => list.map(item =>

        selectedRowKeys.includes(item.id) ? { ...item, hasTitle: toggleTo } : item

      );

      setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));

      setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));

      setData(prev => updater(prev));

      message.success(`Đã ${toggleTo ? 'bật' : 'tắt'} trạng thái mục lục cho ${selectedRowKeys.length} bản ghi`);

      setSelectedRowKeys([]);

    } catch (error) {

      console.error('Error bulk updating hasTitle:', error);

      message.error('Cập nhật hàng loạt thất bại');

    } finally {

      setLoading(false);

    }

  };

  // Handle bulk toggle isPublic using updateK9Bulk API
  const handleBulkToggleIsPublic = async (toggleTo) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một bản ghi để cập nhật');
      return;
    }

    try {
      setLoading(true);

      // Sử dụng updateK9Bulk API thay vì gọi từng updateK9
      const updateData = {
        ids: selectedRowKeys,
        fieldToUpdate: 'isPublic',
        value: toggleTo
      };

      await updateK9Bulk(updateData);

      // Cập nhật local state theo đúng pattern
      const updater = (list) => list.map(item =>
        selectedRowKeys.includes(item.id) ? { ...item, isPublic: toggleTo } : item
      );

      setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
      setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
      setData(prev => updater(prev));

      message.success(`Đã ${toggleTo ? 'bật' : 'tắt'} trạng thái public cho ${selectedRowKeys.length} bản ghi`);
      setSelectedRowKeys([]);

    } catch (error) {
      console.error('Error bulk updating isPublic:', error);
      message.error('Cập nhật hàng loạt thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk toggle allow_retake using updateK9Bulk API
  const handleBulkToggleAllowRetake = async (toggleTo) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một bản ghi để cập nhật');
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        ids: selectedRowKeys,
        fieldToUpdate: 'allow_retake',
        value: toggleTo
      };

      await updateK9Bulk(updateData);

      const updater = (list) => list.map(item =>
        selectedRowKeys.includes(item.id) ? { ...item, allow_retake: toggleTo } : item
      );

      setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
      setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
      setData(prev => updater(prev));

      message.success(`Đã ${toggleTo ? 'bật' : 'tắt'} allow_retake cho ${selectedRowKeys.length} bản ghi`);
      setSelectedRowKeys([]);

    } catch (error) {
      console.error('Error bulk updating allow_retake:', error);
      message.error('Cập nhật hàng loạt thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk update user classes
  const handleBulkUpdateUserClasses = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một bản ghi để cập nhật');
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        ids: selectedRowKeys,
        fieldToUpdate: 'allowed_user_class',
        value: selectedUserClasses
      };

      await updateK9Bulk(updateData);

      // Cập nhật local state theo đúng pattern
      const updater = (list) => list.map(item =>
        selectedRowKeys.includes(item.id) ? { ...item, allowed_user_class: selectedUserClasses } : item
      );

      setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
      setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
      setData(prev => updater(prev));

      message.success(`Đã cập nhật user classes cho ${selectedRowKeys.length} bản ghi`);
      setSelectedRowKeys([]);
      setUserClassModalVisible(false);
      setSelectedUserClasses([]);

    } catch (error) {
      console.error('Error bulk updating user classes:', error);
      message.error('Cập nhật hàng loạt thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk clear user classes
  const handleBulkClearUserClasses = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một bản ghi để xóa');
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        ids: selectedRowKeys,
        fieldToUpdate: 'allowed_user_class',
        value: []
      };

      await updateK9Bulk(updateData);

      // Cập nhật local state theo đúng pattern
      const updater = (list) => list.map(item =>
        selectedRowKeys.includes(item.id) ? { ...item, allowed_user_class: [] } : item
      );

      setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
      setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
      setData(prev => updater(prev));

      message.success(`Đã xóa user classes cho ${selectedRowKeys.length} bản ghi`);
      setSelectedRowKeys([]);

    } catch (error) {
      console.error('Error bulk clearing user classes:', error);
      message.error('Xóa hàng loạt thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Reset only filter dropdowns (not search)

  const resetFilterDropdowns = () => {

    setCategoryFilter('all');

    setImageFilter('all');

    setDiagramFilter('all');
    setQuizFilter('all');

    setTag4Filter([]);

    if (currentTab === 'caseTraining') {

      setTag1Filter('all');

      setTag2Filter('all');

      setTag3Filter('all');

    }



    // Save immediately with reset values (keeping current searchText)

    const currentFilters = filterHistory[currentTab] || {};

    const resetFilters = {

      ...currentFilters,

      categoryFilter: 'all',

      imageFilter: 'all',

      diagramFilter: 'all',
      quizFilter: 'all',

      tag4Filter: [],

      ...(currentTab === 'caseTraining' && {

        tag1Filter: 'all',

        tag2Filter: 'all',

        tag3Filter: 'all'

      })

    };



    const updatedHistory = {

      ...filterHistory,

      [currentTab]: resetFilters

    };

    setFilterHistory(updatedHistory);

    saveFilterHistory(updatedHistory);

  };



  const handleSearchK9ByVector = async (e) => {

    const query = e.target.value;

    if (!query.trim()) return;



    try {

      console.log('🔍 Starting vector search for:', query);



      // Sử dụng function mới: convert text to vector trước khi search

      // Giảm threshold xuống 0.2 để tìm được nhiều kết quả hơn

      const response = await searchK9ByTextToVector(query, 10, 0.2);

      console.log('📊 Vector Search Response:', response);



      // Hiển thị thông tin debug chi tiết

      if (response.data) {

        console.log(`📈 Total records processed: ${response.data.totalProcessed}`);

        console.log(`🎯 Results found: ${response.data.totalFound}`);



        // Hiển thị top similarities

        if (response.data.topSimilarities) {

          console.log('🏆 Top 5 similarity scores:');

          response.data.topSimilarities.forEach((item, index) => {

            console.log(`   ${index + 1}. K9 ID: ${item.id}, Title: "${item.title}", Similarity: ${(item.similarity * 100).toFixed(2)}%`);

          });

        }



        // Hiển thị kết quả cuối cùng

        if (response.data.results && response.data.results.length > 0) {

          console.log('✅ Final results:');

          response.data.results.forEach((result, index) => {

            console.log(`   ${index + 1}. K9 ID: ${result.id}, Title: "${result.title}", Similarity: ${(result.similarity * 100).toFixed(2)}%`);

            console.log(`      Type: ${result.type}, Category: ${result.category}`);

            console.log(`      Detail preview: ${result.detail?.substring(0, 100)}...`);

          });

        } else {

          console.log('❌ No results found with current threshold');

          console.log('💡 Try lowering the threshold or check if embeddings exist');

        }

      }

    } catch (error) {

      console.error('❌ Vector search error:', error);

      console.error('Error details:', error.response?.data || error.message);

    }

  };



  const handleBackgroundAudioUpload = async (file) => {

    if (!file) {

      setBgAudioFile(null);

      setBgAudioSettings(prev => ({ ...prev, audioUrl: '' }));

      return;

    }



    if (file.url || file.status === 'done') {

      setBgAudioFile(file);

      setBgAudioSettings(prev => ({ ...prev, audioUrl: file.url || '' }));

      return;

    }



    if (!file.originFileObj) {

      console.warn('No originFileObj found for background audio file');

      return;

    }



    setBgAudioUploading(true);



    try {

      const response = await uploadFiles([file.originFileObj]);

      const url = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';



      const updatedFile = {

        ...file,

        status: 'done',

        url: url

      };



      setBgAudioFile(updatedFile);

      setBgAudioSettings(prev => ({ ...prev, audioUrl: url }));



      message.success('Upload nhạc nền thành công!');

    } catch (error) {

      console.error('Error uploading background audio:', error);

      message.error('Upload nhạc nền thất bại!');

      setBgAudioFile(null);

      setBgAudioSettings(prev => ({ ...prev, audioUrl: '' }));

    } finally {

      setBgAudioUploading(false);

    }

  };



  const saveBgAudioSettings = async () => {

    try {

      await createOrUpdateSetting({

        type: 'BACKGROUND_AUDIO',

        setting: bgAudioSettings

      });



      setBgAudioSettingsVisible(false);

      message.success('Lưu cài đặt nhạc nền thành công!');

    } catch (error) {

      console.error('Error saving background audio settings:', error);

      message.error('Lưu cài đặt thất bại!');

    }

  };



  // Guideline settings functions

  const handleGuidelineImageUpload = async (file) => {

    console.log('🔧 K9Management: handleGuidelineImageUpload called with file:', file);



    if (!file) {

      console.log('🗑️ K9Management: Clearing guideline image');

      setGuidelineImageFile(null);

      setGuidelineSettings(prev => ({ ...prev, imageUrl: '' }));

      return;

    }



    if (file.url || file.status === 'done') {

      console.log('✅ K9Management: Using existing file URL:', file.url);

      setGuidelineImageFile(file);

      setGuidelineSettings(prev => ({ ...prev, imageUrl: file.url || '' }));

      return;

    }



    if (!file.originFileObj) {

      console.warn('❌ K9Management: No originFileObj found for guideline image file');

      return;

    }



    console.log('📤 K9Management: Starting guideline image upload');

    setGuidelineImageUploading(true);



    try {

      const response = await uploadFiles([file.originFileObj]);

      console.log('📤 K9Management: Upload response:', response);



      const url = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';

      console.log('🔗 K9Management: Extracted URL:', url);



      const updatedFile = {

        ...file,

        status: 'done',

        url: url

      };



      setGuidelineImageFile(updatedFile);

      setGuidelineSettings(prev => ({ ...prev, imageUrl: url }));



      message.success('Upload hình ảnh guideline thành công!');

    } catch (error) {

      console.error('❌ K9Management: Error uploading guideline image:', error);

      message.error('Upload hình ảnh guideline thất bại!');

      setGuidelineImageFile(null);

      setGuidelineSettings(prev => ({ ...prev, imageUrl: '' }));

    } finally {

      setGuidelineImageUploading(false);

    }

  };



  const saveGuidelineSettings = async (settings) => {

    console.log('🔧 K9Management: saveGuidelineSettings called with settings:', settings);



    try {

      const settingData = {

        type: 'GUIDELINE_SETTING',

        setting: {

          imageUrl: settings.imageUrl,

          markdownText: settings.markdownText

        }

      };



      console.log('💾 K9Management: Saving to database:', settingData);

      await createOrUpdateSetting(settingData);



      console.log('✅ K9Management: Settings saved successfully');

      setGuidelineSettings(settings);

      setGuidelineSettingsVisible(false);



      message.success('Lưu cài đặt guideline thành công!');

    } catch (error) {

      console.error('❌ K9Management: Error saving guideline settings:', error);

      message.error('Lưu cài đặt guideline thất bại!');

      throw error;

    }

  };



  const handleBackToK9 = () => {

    navigate('/home');

  };



  // Helper function to replace variables in template

  const replaceTemplateVariables = (template, variables) => {

    let result = template;

    Object.keys(variables).forEach(key => {

      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');

      result = result.replace(regex, variables[key]);

    });

    return result;

  };

  // Image Generation Functions

  const handleCreateImage = async (record) => {

    if (!record.summary) {

      message.warning('Không có tóm tắt để tạo ảnh!');

      return;

    }



    // Check if already has avatarUrl

    if (record.avatarUrl) {

      message.info('News này đã có ảnh!');

      return;

    }



    // Check if already in queue

    const existingTask = imageGenerationQueue.find(task => task.recordId === record.id);

    if (existingTask) {

      message.warning(`"${record.title}" đã có trong hàng đợi tạo ảnh!`);

      return;

    }



    // Check if currently processing

    if (currentImageProcessing && currentImageProcessing.recordId === record.id) {

      message.warning(`"${record.title}" đang được tạo ảnh!`);

      return;

    }



    // Add to queue

    addImageToQueue(record.id, record.title);

  };


  // Diagram Preview Functions
  const handleDiagramPreview = (record) => {
    if (record.diagramUrl && record.diagramUrl.length > 0) {
      // Kroki mode - show images
      setSelectedDiagramData({
        type: 'kroki',
        title: record.title,
        data: record.diagramUrl,
        note: record.diagramNote,
        recordId: record.id // Thêm recordId để save
      });
    } else if (record.diagramHtmlCode && record.diagramHtmlCode.length > 0) {
      // HTML mode - show HTML code
      setSelectedDiagramData({
        type: 'html',
        title: record.title,
        data: record.diagramHtmlCode,
        note: record.diagramNote,
        recordId: record.id // Thêm recordId để save
      });
    } else if (record.diagramExcalidrawJson && record.diagramExcalidrawJson.length > 0) {
      // Excalidraw React mode - show Excalidraw JSON
      setSelectedDiagramData({
        type: 'excalidraw-react',
        title: record.title,
        data: record.diagramExcalidrawJson,
        note: record.diagramExcalidrawNote || record.diagramNote,
        imageUrls: record.diagramExcalidrawImageUrls || null, // Thêm imageUrls nếu có
        recordId: record.id // Thêm recordId để save
      });
    } else {
      message.info('Record này chưa có diagram để xem');
      return;
    }
    setDiagramPreviewModalVisible(true);
  };

  // Convert Excalidraw JSON to Image and upload
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

          // Try to export to Canvas first (better for image conversion)
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
              // Convert SVG to Canvas
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

  const handleDiagramSave = async (updatedData) => {
    try {
      const updateData = {};

      if (updatedData.type === 'kroki') {
        updateData.diagramUrl = updatedData.data;
        updateData.diagramNote = updatedData.note;
      } else if (updatedData.type === 'html') {
        updateData.diagramHtmlCode = updatedData.data;
        updateData.diagramNote = updatedData.note;
      } else if (updatedData.type === 'excalidraw-react') {
        updateData.diagramExcalidrawJson = updatedData.data;
        updateData.diagramExcalidrawNote = updatedData.note;
        
        // Convert Excalidraw JSON to images and upload
        if (updatedData.data && Array.isArray(updatedData.data) && updatedData.data.length > 0) {
          message.loading('Đang tạo ảnh từ Excalidraw...', 0);
          try {
            const imageUrls = await convertExcalidrawToImage(updatedData.data);
            if (imageUrls.length > 0) {
              updateData.diagramExcalidrawImageUrls = imageUrls;
              message.destroy();
              message.success(`Đã tạo và upload ${imageUrls.length} ảnh từ Excalidraw!`);
            } else {
              message.destroy();
              message.warning('Không thể tạo ảnh từ Excalidraw');
            }
          } catch (error) {
            message.destroy();
            console.error('Error converting Excalidraw to images:', error);
            message.warning('Có lỗi khi tạo ảnh từ Excalidraw, nhưng đã lưu JSON');
          }
        }
      }

      await updateK9({ id: updatedData.recordId, ...updateData });

      // Update local state instead of reloading all data
      const updater = (list) => list.map(item =>
        item.id === updatedData.recordId
          ? { ...item, ...updateData }
          : item
      );

      // Update allData
      setAllData(prev => ({
        ...prev,
        [currentTab]: updater(prev[currentTab] || [])
      }));

      // Update filteredData
      setFilteredData(prev => ({
        ...prev,
        [currentTab]: updater(prev[currentTab] || [])
      }));

      // Update current data
      setData(prev => updater(prev));

      message.success('Đã lưu thay đổi diagram!');
    } catch (error) {
      console.error('Error saving diagram:', error);
      message.error('Có lỗi khi lưu diagram!');
    }
  };

  const handleStopDiagramGeneration = () => {
    shouldStopRef.current = true;
    message.info('Đang dừng quá trình tạo diagram...');
  };

  // Simple wrapper to check stop flag before AI calls
  const callAIWithStopCheck = async (aiFunction, ...args) => {
    if (shouldStopRef.current) {
      throw new Error('User requested stop');
    }
    return await aiFunction(...args);
  };

  // Create Summary Detail from Detail - Queue version
  const handleCreateSummaryDetail = async (record) => {
    if (!record.detail) {
      message.warning('Không có nội dung detail để tóm tắt!');
      return;
    }

    if (record.summaryDetail) {
      message.info('Record này đã có summaryDetail!');
      return;
    }

    if (!summaryDetailConfig.aiModel || !summaryDetailConfig.aiPrompt) {
      message.warning('Vui lòng cấu hình prompt tóm tắt detail trước!');
      setSummaryDetailConfigModalVisible(true);
      return;
    }

    // Check if already in queue or processing
    const existingTask = summaryDetailQueue.find(task => task.recordId === record.id);
    const isProcessing = currentSummaryDetailProcessing && currentSummaryDetailProcessing.recordId === record.id;

    if (existingTask || isProcessing) {
      message.warning('Record này đang trong hàng đợi hoặc đang được xử lý!');
      return;
    }

    addSummaryDetailToQueue(record.id, record.title);
  };

  // Diagram Generation Functions
  const handleCreateDiagram = async (record, mode = 'kroki') => {
    if (mode === 'excalidraw-react' && !record.summaryDetail) {
      message.warning('Không có nội dung để tạo diagram!');
      return;
    } 
    if (mode === 'html' && !record.detail) {
      message.warning('Không có nội dung detail để tạo diagram!');
      return;
    }

    // Check if already has diagram data of same type (HTML and Excalidraw can coexist)
    const hasExistingHtmlCode = record.diagramHtmlCode && record.diagramHtmlCode.length > 0;
    const hasExistingExcalidrawJson = record.diagramExcalidrawJson && record.diagramExcalidrawJson.length > 0;

    if (mode === 'html' && hasExistingHtmlCode) {
      message.warning('Record này đã có HTML code diagram. Vui lòng xóa diagram HTML cũ trước khi tạo mới.');
      return;
    }

    if (mode === 'excalidraw-react' && hasExistingExcalidrawJson) {
      message.warning('Record này đã có Excalidraw diagram. Vui lòng xóa diagram Excalidraw cũ trước khi tạo mới.');
      return;
    }

    // Check if already in queue or processing
    if (diagramGenerationQueue.find(task => task.recordId === record.id) ||
      (currentDiagramProcessing && currentDiagramProcessing.recordId === record.id)) {
      const modeText = mode === 'html' ? 'HTML code' : mode === 'excalidraw-react' ? 'Excalidraw React' : 'diagram';
      message.warning(`"${record.title}" đang được tạo ${modeText}!`);
      return;
    }

    // For html and excalidraw-react modes, show prompt selection modal
    if (mode === 'html' || mode === 'excalidraw-react') {
      setPendingDiagramMode(mode);
      setPendingDiagramRecords([record]);
      setSelectDiagramPromptModalVisible(true);
    } else {
      // For kroki mode, use old config (not implemented prompt selection yet)
      addDiagramToQueue(record.id, record.title, mode);
    }
  };

  const handleSingleDiagramPromptSelected = (prompt) => {
    setSelectDiagramPromptModalVisible(false);
    const record = pendingDiagramRecords[0];
    const mode = pendingDiagramMode;
    if (record) {
      addDiagramToQueue(record.id, record.title, mode, prompt);
    }
    setPendingDiagramMode(null);
    setPendingDiagramRecords([]);
  };

  // Sau khi chọn prompt để tạo Case Training từ Learning Block
  const handleCaseFromLearningPromptSelected = (prompt) => {
    setSelectCaseFromLearningPromptModalVisible(false);

    const items = pendingCaseFromLearningRecords || [];
    if (!items.length) {
      return;
    }

    const quantity = prompt?.quantity && prompt.quantity > 0 ? prompt.quantity : 1;
    let addedCount = 0;

    items.forEach(item => {
      addCaseFromLearningBlockToQueue(item.id, item.title, prompt, quantity);
      addedCount++;
    });

    setPendingCaseFromLearningRecords([]);
    setSelectedRowKeys([]);

    if (addedCount > 0) {
      message.success(`🧩 Đã thêm ${addedCount} Learning Block vào hàng đợi tạo Case Training (${quantity} case mỗi block)!`);
    }
  };


  const addImageToQueue = (recordId, title) => {

    const task = {

      id: `image_${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

      recordId,

      title: title.length > 50 ? title.substring(0, 50) + '...' : title,

      createdAt: new Date().toISOString()

    };



    setImageGenerationQueue(prev => [...prev, task]);

    message.success(`📝 Đã thêm "${task.title}" vào hàng đợi tạo ảnh!`);



    return task;

  };


  const addDiagramToQueue = (recordId, title, mode = 'kroki', promptConfig = null) => {
    const task = {
      id: `diagram_${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recordId,
      title: title.length > 50 ? title.substring(0, 50) + '...' : title,
      mode: mode, // Add mode to task
      promptConfig: promptConfig, // Store prompt configuration
      createdAt: new Date().toISOString()
    };

    setDiagramGenerationQueue(prev => [...prev, task]);
    message.success(`📊 Đã thêm "${task.title}" vào hàng đợi tạo ${mode === 'html' ? 'HTML code' : 'diagram'}!`);

    return task;
  };

  const addSummaryDetailToQueue = (recordId, title) => {
    const task = {
      id: `summary_${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recordId,
      title: title.length > 50 ? title.substring(0, 50) + '...' : title,
      createdAt: new Date().toISOString()
    };

    setSummaryDetailQueue(prev => [...prev, task]);
    message.success(`📝 Đã thêm "${task.title}" vào hàng đợi tạo summaryDetail!`);

    return task;
  };

  // Thêm vào queue tạo Case Training từ Learning Block
  const addCaseFromLearningBlockToQueue = (recordId, title, promptConfig, quantity = 1) => {
    const task = {
      id: `case_from_lb_${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recordId,
      title: title.length > 50 ? title.substring(0, 50) + '...' : title,
      promptConfig,
      quantity,
      createdAt: new Date().toISOString()
    };

    setCaseFromLearningBlockQueue(prev => [...prev, task]);
    message.success(`🧩 Đã thêm "${task.title}" vào hàng đợi tạo Case Training (${quantity} case)!`);

    return task;
  };


  const processImageQueue = async () => {

    if (imageGenerationQueue.length === 0 || processingImageQueue) {

      return;

    }



    setProcessingImageQueue(true);



    const queue = [...imageGenerationQueue];



    for (let i = 0; i < queue.length; i++) {

      const task = queue[i];

      setCurrentImageProcessing(task);



      // Remove from queue immediately

      setImageGenerationQueue(prev => prev.filter(item => item.id !== task.id));



      try {

        // Get the current record

        const currentRecord = await getK9ById(task.recordId);

        console.log('currentRecord', currentRecord);

        if (!currentRecord) {

          console.error(`Record ${task.recordId} not found`);

          continue;

        }



        // Step 1: Create English description

        console.log(`Creating English description for "${currentRecord.title}"`);



        const englishPrompt = `${currentRecord.title}: ${currentRecord.summary}\n\n` + `\n\n⚠️ CRITICAL FORMAT REQUIREMENT - MUST BE FOLLOWED EXACTLY:

You MUST return ONLY the numbered description in the exact format. Do NOT include any headers, explanations, or additional content. Failure to follow this format will cause system parsing errors and break the image generation process.



⚠️ WARNING: Any deviation from the numbered format will result in parsing failure and system errors. Your response must start immediately with "1." and contain only the numbered description.`;



        const englishResponse = await aiGen(

          englishPrompt,

          imageConfig.descriptionSystemMessage,

          imageConfig.descriptionModel,

          'text'

        );



        const englishResult = englishResponse.result || englishResponse.answer || englishResponse.content || englishResponse;

        console.log('English description result:', englishResult);



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

        // Step 2: Generate image using AI4

        console.log(`Generating image for "${currentRecord.title}" using finalPrompt: ${finalPrompt}`);



        const imageResponse = await aiGen2(

          finalPrompt,

          imageConfig.imageSystemMessage || '',

          imageConfig.imageModel,

          'img'

        );



        const imageResult = imageResponse.result || imageResponse.answer || imageResponse.content || imageResponse;



        if (imageResult && imageResult.image_url) {

          // Update the record with the generated image URL

          const updatedRecord = {

            ...currentRecord,

            avatarUrl: imageResult.image_url

          };



          await updateK9(updatedRecord);

          // Update local state instead of reloading all data
          const updater = (list) => list.map(item => item.id === task.recordId ? updatedRecord : item);
          setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
          setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
          setData(prev => updater(prev));
          setTableKey(prev => prev + 1);

          message.success(`✅ Tạo ảnh thành công cho "${task.title}"!`);

        } else {

          throw new Error('No image URL received from AI');

        }



      } catch (error) {

        console.error(`Error generating image for task ${task.id}:`, error);

        message.error(`❌ Lỗi khi tạo ảnh cho "${task.title}": ${error.message}`);

      }



      // Delay between tasks

      if (i < queue.length - 1) {

        await new Promise(resolve => setTimeout(resolve, 1000));

      }

    }



    setCurrentImageProcessing(null);

    setProcessingImageQueue(false);

  };


  const processDiagramQueue = async () => {
    if (diagramGenerationQueue.length === 0 || processingDiagramQueue) {
      return;
    }

    setProcessingDiagramQueue(true);

    // Initialize tracking stats
    const queue = [...diagramGenerationQueue];
    const totalTasks = queue.length;
    const taskType = queue[0]?.mode || 'kroki'; // Get type from first task

    setDiagramGenerationStats({
      total: totalTasks,
      success: 0,
      failed: 0,
      type: taskType
    });
    setDiagramGenerationResults([]);

    for (let i = 0; i < queue.length; i++) {
      // Check if user wants to stop
      if (shouldStopRef.current) {
        message.info('Đã dừng quá trình tạo diagram');
        setProcessingDiagramQueue(false);
        setCurrentDiagramProcessing(null);
        setDiagramGenerationQueue([]);

        
        break;
      }

      const task = queue[i];
      setCurrentDiagramProcessing(task);

      // Remove from queue immediately
      setDiagramGenerationQueue(prev => prev.filter(item => item.id !== task.id));

      try {
        // Get the current record
        const currentRecord = await getK9ById(task.recordId);
        console.log('currentRecord for diagram', currentRecord);

        if (!currentRecord) {
          message.error(`Không tìm thấy record với ID: ${task.recordId}`);
          continue;
        }

        // Check if record has detail content
        if (!currentRecord.detail || currentRecord.detail.trim() === '') {
          message.error(`Record "${task.title}" không có nội dung detail để tạo diagram`);
          continue;
        }

        // For excalidraw-react mode, use summaryDetail if available, otherwise use detail
        // (No auto-creation of summaryDetail - user must create it manually first)

        // Check if diagram configuration is properly loaded
        const diagramMode = task.mode || 'kroki'; // Get mode from task
        const promptConfig = task.promptConfig; // Get prompt config from task

        // Validate prompt config based on mode
        if (diagramMode === 'excalidraw-react') {
          if (!promptConfig || !promptConfig.aiModel || !promptConfig.aiPrompt) {
            message.error(`Cấu hình Excalidraw React chưa được thiết lập đầy đủ. Vui lòng chọn cài đặt prompt trước khi tạo diagram.`);
            continue;
          }
        } else if (diagramMode === 'html') {
          if (!promptConfig || !promptConfig.ai4Model || !promptConfig.ai4Prompt) {
            message.error(`Cấu hình HTML chưa được thiết lập đầy đủ. Vui lòng chọn cài đặt prompt trước khi tạo HTML code.`);
            continue;
          }
        } else {
          // Kroki mode - still use diagramConfig for now
          if (!diagramConfig.kroki?.diagramType || !diagramConfig.kroki?.aiModel ||
            !diagramConfig.kroki?.ai1Model || !diagramConfig.kroki?.ai1Prompt ||
            !diagramConfig.kroki?.ai2Model || !diagramConfig.kroki?.ai2Prompt ||
            !diagramConfig.kroki?.ai3Model || !diagramConfig.kroki?.ai3Prompt) {
            message.error(`Cấu hình diagram chưa được thiết lập đầy đủ. Vui lòng cấu hình AI1, AI2, AI3 và diagram type trước khi tạo diagram.`);
            continue;
          }
        }

        // Get quantity from prompt config or diagram config
        const quantity = diagramMode === 'excalidraw-react' 
          ? (promptConfig?.quantity || 1)
          : diagramMode === 'kroki'
          ? (diagramConfig.kroki?.quantity || 1)
          : 1;
        const modeText = diagramMode === 'html' ? 'HTML code' : diagramMode === 'excalidraw-react' ? 'Excalidraw React diagram' : 'diagram';
        message.info(`🔄 Đang tạo ${quantity} ${modeText} cho: ${task.title}${diagramMode === 'kroki' ? ` - Loại: ${diagramConfig.kroki?.diagramType}` : ''}`);

        // Arrays to store multiple diagram results
        const allDiagramResults = [];
        const allDiagramNotes = [];
        let allDiagramImageUrls = []; // Initialize for Excalidraw image URLs

        try {
          if (diagramMode === 'html') {
            // Check stop flag before starting HTML mode
            if (shouldStopRef.current) {
              message.info('Đã dừng quá trình tạo diagram');
              break;
            }

            // HTML Mode: Single AI step
            for (let j = 0; j < quantity; j++) {
              // Check stop flag before each iteration
              if (shouldStopRef.current) {
                message.info('Đã dừng quá trình tạo diagram');
                break;
              }

              message.info(`🔄 Đang tạo HTML code ${j + 1}/${quantity} cho: ${task.title}`);

              // AI4: Tạo HTML code từ nội dung
              message.info(`🤖 AI4: Tạo HTML code ${j + 1}/${quantity} (Cài đặt: ${promptConfig?.name || 'N/A'})`);
              const aiResult = await callAIWithStopCheck(
                aiGen,
                currentRecord.detail, // Use record detail as prompt
                promptConfig.ai4Prompt, // Use ai4Prompt from selected prompt
                promptConfig.ai4Model // Use ai4Model from selected prompt
              );

              console.log(`AI4 Result (HTML Code ${j + 1}):`, aiResult);

              // Validate AI result
              if (!aiResult.result || aiResult.result.trim() === '') {
                throw new Error(`AI4 không tạo được HTML code cho diagram ${j + 1}`);
              }

              // Store HTML code directly
              allDiagramResults.push(aiResult.result);

              // Add delay between generations
              if (j < quantity - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          } else if (diagramMode === 'excalidraw-react') {
            // Check stop flag before starting Excalidraw React mode
            if (shouldStopRef.current) {
              message.info('Đã dừng quá trình tạo diagram');
              break;
            }

            // Excalidraw React Mode: Generate Excalidraw JSON
            for (let j = 0; j < quantity; j++) {
              // Check stop flag before each iteration
              if (shouldStopRef.current) {
                message.info('Đã dừng quá trình tạo diagram');
                break;
              }

              message.info(`🔄 Đang tạo Excalidraw React diagram ${j + 1}/${quantity} cho: ${task.title}`);

              // AI: Tạo Excalidraw JSON
              // Use summaryDetail if available, otherwise use detail
              const contentForDiagram = currentRecord.summaryDetail || currentRecord.detail;
              if (!contentForDiagram || contentForDiagram.trim() === '') {
                throw new Error('Không có summaryDetail hoặc detail để tạo diagram');
              }
              
              const contentSource = currentRecord.summaryDetail ? 'summaryDetail' : 'detail';
              message.info(`🤖 AI: Tạo Excalidraw JSON ${j + 1}/${quantity} (từ ${contentSource}, Cài đặt: ${promptConfig?.name || 'N/A'})`);
              
              // Tạo prompt với tất cả thông tin (giống AISummaryDetailGeneration)
              const promptData = {
                ID: currentRecord.id || '',
                CID: currentRecord.cid || '',
                Title: currentRecord.title || '',
                Summary: currentRecord.summary || '',
                Details: currentRecord.detail || '',
                SummaryDetail: currentRecord.summaryDetail || ''
              };
              
              // Chuyển thành JSON string để gửi cho AI
              const prompt = JSON.stringify(promptData, null, 2);
              
              const aiResult = await callAIWithStopCheck(
                aiGen,
                prompt,
                promptConfig.aiPrompt,  // System message from selected prompt
                promptConfig.aiModel   // Model from selected prompt
              );

              console.log(`AI Result (Excalidraw JSON ${j + 1}):`, aiResult);

              // Validate and parse JSON
              let excalidrawJson;
              try {
                // Try to parse as JSON directly
                excalidrawJson = JSON.parse(aiResult.result);
              } catch (parseError) {
                // Try to extract JSON from markdown code block
                excalidrawJson = extractJsonFromMarkdown(aiResult.result);
                if (!excalidrawJson) {
                  throw new Error(`AI không tạo được Excalidraw JSON hợp lệ. Lỗi parse: ${parseError.message}`);
                }
              }

              // Validate Excalidraw JSON structure
              if (!validateExcalidrawJson(excalidrawJson)) {
                throw new Error(`Excalidraw JSON không hợp lệ cho diagram ${j + 1}`);
              }

              // Normalize JSON to standard format
              const normalizedJson = normalizeExcalidrawJson(excalidrawJson);

              // AI: Tạo ghi chú
              // Use summaryDetail if available, otherwise use detail
              const contentForNote = currentRecord.summaryDetail || currentRecord.detail;
              const noteSource = currentRecord.summaryDetail ? 'summaryDetail' : 'detail';
              message.info(`📝 AI: Tạo ghi chú ${j + 1}/${quantity} (từ ${noteSource})`);
              
              // Use note prompt from selected config if available, otherwise use aiModel
              const notePrompt = promptConfig?.notePrompt || 'Tạo ghi chú ngắn gọn (1-2 câu) mô tả diagram này dựa trên nội dung bài viết.';
              const noteModel = promptConfig?.noteModel || promptConfig?.aiModel;
              
              if (noteModel) {
                const noteResult = await callAIWithStopCheck(
                  aiGen,
                  contentForNote,
                  notePrompt,
                  noteModel
                );

                console.log(`Note Result (Diagram Note ${j + 1}):`, noteResult);

                // Store results
                allDiagramResults.push(JSON.stringify(normalizedJson));
                allDiagramNotes.push(noteResult.result || `Diagram ${j + 1} từ: ${task.title}`);
              } else {
                // Store results without note
                allDiagramResults.push(JSON.stringify(normalizedJson));
                allDiagramNotes.push(`Diagram ${j + 1} từ: ${task.title}`);
              }

              // Add delay between generations
              if (j < quantity - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          } else {
            // Check stop flag before starting Kroki mode
            if (shouldStopRef.current) {
              message.info('Đã dừng quá trình tạo diagram');
              break;
            }

            // Kroki Mode: 3 AI steps
            // AI1: Phân tích nội dung và tạo yêu cầu diagram
            message.info(`🤖 AI1: Phân tích nội dung cho: ${task.title}`);
            const ai1Result = await callAIWithStopCheck(
              aiGen,
              `Nội dung cần phân tích: ${currentRecord.detail}\n\nLoại diagram cần tạo: ${diagramConfig.kroki.diagramType}`, // Include diagram type in prompt
              diagramConfig.kroki.ai1Prompt, // Use ai1Prompt as systemMessage
              diagramConfig.kroki.ai1Model // Use ai1Model
            );

            const prompts = {
              excalidraw: `Hãy xuất JSON hợp lệ cho Excalidraw dựa trên phân tích:\n${ai1Result.result}`,
              c4: `Tạo yêu cầu chi tiết để AI2 tạo PlantUML C4 diagram:\n${ai1Result.result}`,
              plantuml: `Tạo yêu cầu chi tiết để AI2 tạo PlantUML UML diagram:\n${ai1Result.result}`,
              blockdiag: `Tạo yêu cầu chi tiết để AI2 tạo BlockDiag diagram:\n${ai1Result.result}`
            };

            const promptAI1Format = prompts[diagramConfig?.diagramType.toLowerCase()] || prompts.excalidraw;
            console.log('AI1 Result Format:', promptAI1Format);

            // Validate AI1 result
            if (!ai1Result.result || ai1Result.result.trim() === '') {
              throw new Error('AI1 không tạo được yêu cầu diagram');
            }

            // Generate multiple diagrams based on quantity
            for (let j = 0; j < quantity; j++) {
              // Check stop flag before each iteration
              if (shouldStopRef.current) {
                message.info('Đã dừng quá trình tạo diagram');
                break;
              }

              message.info(`🔄 Đang tạo diagram ${j + 1}/${quantity} cho: ${task.title}`);

              // AI2: Tạo diagram code từ kết quả AI1 (để gửi cho Kroki API)
              message.info(`🤖 AI2: Tạo diagram code ${j + 1}/${quantity}`);
              const ai2Result = await callAIWithStopCheck(
                aiGen,
                promptAI1Format, // Use AI1 output as prompt
                diagramConfig.kroki.ai2Prompt, // Use ai2Prompt as systemMessage
                diagramConfig.kroki.ai2Model // Use ai2Model
              );

              console.log(`AI2 Result (Diagram Code ${j + 1}):`, ai2Result);

              // Validate AI2 result
              if (!ai2Result.result || ai2Result.result.trim() === '') {
                throw new Error(`AI2 không tạo được diagram code cho diagram ${j + 1}`);
              }

              // Tạo diagram từ code của AI2 (backend mới sẽ gửi trực tiếp cho Kroki)
              message.info(`🎨 Tạo diagram ${j + 1}/${quantity} từ diagram code`);
              const diagramResult = await callAIWithStopCheck(
                aiGenImageDiagram,
                ai2Result.result, // Use AI2 diagram code as request
                diagramConfig.kroki.diagramType, // Use configured diagram type
                diagramConfig.kroki.aiModel // Use configured model
              );

              console.log(`Diagram Generation Result ${j + 1}:`, diagramResult);

              // Validate diagram result
              if (!diagramResult.success || !diagramResult.data?.diagram_url) {
                throw new Error(`Tạo diagram ${j + 1} thất bại: ${diagramResult.error || 'Không có URL diagram'}`);
              }

              // AI3: Tạo ghi chú diagram từ nội dung gốc
              message.info(`🤖 AI3: Tạo ghi chú diagram ${j + 1}/${quantity}`);
              const ai3Result = await callAIWithStopCheck(
                aiGen,
                currentRecord.detail, // Use record detail as prompt
                diagramConfig.kroki.ai3Prompt, // Use ai3Prompt as systemMessage
                diagramConfig.kroki.ai3Model // Use ai3Model
              );

              console.log(`AI3 Result (Diagram Note ${j + 1}):`, ai3Result);

              // Store results
              allDiagramResults.push(diagramResult.data.diagram_url);
              if (ai3Result.result) {
                allDiagramNotes.push(ai3Result.result);
              } else {
                // Fallback note if AI3 fails
                allDiagramNotes.push(`Diagram được tạo từ: ${task.title}`);
              }

              // Add delay between diagram generations
              if (j < quantity - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }

        } catch (error) {
          console.error('Diagram Generation Error:', error);

          // Check if user requested stop
          if (error.message === 'User requested stop') {
            message.info('Đã dừng quá trình tạo diagram');
            break; // Exit the quantity loop
          }

          // Enhanced error handling with specific error types
          let errorMessage = 'Tạo diagram gặp lỗi';

          if (error.message.includes('AI1 không tạo được yêu cầu diagram')) {
            errorMessage = 'AI1 không thể tạo yêu cầu diagram. Vui lòng kiểm tra prompt và model.';
          } else if (error.message.includes('AI2 không tạo được diagram code')) {
            errorMessage = 'AI2 không thể tạo diagram code. Vui lòng kiểm tra prompt và model.';
          } else if (error.message.includes('Tạo diagram') && error.message.includes('thất bại')) {
            errorMessage = `Backend tạo diagram thất bại: ${error.message}`;
          } else if (error.message.includes('Network Error') || error.message.includes('timeout')) {
            errorMessage = 'Lỗi kết nối mạng hoặc timeout. Vui lòng thử lại.';
          } else if (error.message.includes('API')) {
            errorMessage = `Lỗi API: ${error.message}`;
          } else {
            errorMessage = `${errorMessage}: ${error.message}`;
          }

          throw new Error(errorMessage);
        }

        console.log('All Diagram Results:', allDiagramResults);
        console.log('All Diagram Notes:', allDiagramNotes);

        try {
          // Check if record already has diagram data of same type (HTML and Excalidraw can coexist)
          const hasExistingHtmlCode = currentRecord.diagramHtmlCode && currentRecord.diagramHtmlCode.length > 0;
          const hasExistingExcalidrawJson = currentRecord.diagramExcalidrawJson && currentRecord.diagramExcalidrawJson.length > 0;

          if (diagramMode === 'html' && hasExistingHtmlCode) {
            message.warning(`⚠️ Record "${task.title}" đã có HTML code diagram. Vui lòng xóa diagram HTML cũ trước khi tạo mới.`);
            continue;
          }

          if (diagramMode === 'excalidraw-react' && hasExistingExcalidrawJson) {
            message.warning(`⚠️ Record "${task.title}" đã có Excalidraw diagram. Vui lòng xóa diagram Excalidraw cũ trước khi tạo mới.`);
            continue;
          }

          const updateData = {
            id: task.recordId
          };

          // Only update fields for the current mode, don't overwrite other diagram types
          if (diagramMode === 'html') {
            updateData.diagramHtmlCode = allDiagramResults;
            updateData.diagramNote = allDiagramNotes;
          } else if (diagramMode === 'excalidraw-react') {
            updateData.diagramExcalidrawJson = allDiagramResults;
            updateData.diagramExcalidrawNote = allDiagramNotes;
            updateData.diagramExcalidrawImageUrls = allDiagramImageUrls;
          }
          
          updateData.timeCreateDiagram = createTimestamp();

          // Convert Excalidraw JSON to images and upload if Excalidraw mode
          if (diagramMode === 'excalidraw-react' && allDiagramResults && Array.isArray(allDiagramResults) && allDiagramResults.length > 0) {
            try {
              const imageUrls = await convertExcalidrawToImage(allDiagramResults);
              if (imageUrls.length > 0) {
                allDiagramImageUrls = imageUrls; // Update the variable
                updateData.diagramExcalidrawImageUrls = imageUrls;
              }
            } catch (error) {
              console.error('Error converting Excalidraw to images:', error);
              // Continue even if image conversion fails
            }
          }

          await updateK9(updateData);

          // Update local data
          const updater = (list) => list.map(item =>
            item.id === task.recordId
              ? {
                ...item,
                ...(diagramMode === 'html' ? {
                  diagramHtmlCode: allDiagramResults,
                  diagramNote: allDiagramNotes
                } : {}),
                ...(diagramMode === 'excalidraw-react' ? {
                  diagramExcalidrawJson: allDiagramResults,
                  diagramExcalidrawNote: allDiagramNotes,
                  diagramExcalidrawImageUrls: allDiagramImageUrls
                } : {})
              }
              : item
          );

          if (currentTab === 'report') {
            setAiSummaryData(prev => updater(prev));
          } else if (currentTab === 'reportDN') {
            setReportDNData(prev => updater(prev));
          } else {
            setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
            setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
            setData(prev => updater(prev));
          }

        } catch (error) {
          console.error('Error updating database:', error);

          // Enhanced error handling for database update
          let dbErrorMessage = `❌ Lỗi khi cập nhật database cho: ${task.title}`;

          if (error.message.includes('Network Error') || error.message.includes('timeout')) {
            dbErrorMessage = `❌ Lỗi kết nối database cho: ${task.title}. Vui lòng kiểm tra kết nối.`;
          } else if (error.message.includes('404') || error.message.includes('Not Found')) {
            dbErrorMessage = `❌ Không tìm thấy record trong database: ${task.title}. Record có thể đã bị xóa.`;
          } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
            dbErrorMessage = `❌ Lỗi server database cho: ${task.title}. Vui lòng thử lại sau.`;
          } else if (error.message.includes('validation') || error.message.includes('invalid')) {
            dbErrorMessage = `❌ Dữ liệu không hợp lệ cho: ${task.title}. Vui lòng kiểm tra format dữ liệu.`;
          }

          message.error(dbErrorMessage);
        }

        message.success(`✅ Hoàn thành tạo ${allDiagramResults.length} ${diagramMode === 'html' ? 'HTML code' : 'diagram'} cho: ${task.title}`);

        // Update tracking stats - success
        setDiagramGenerationStats(prev => ({
          ...prev,
          success: prev.success + 1
        }));

        setDiagramGenerationResults(prev => [...prev, {
          id: task.id,
          title: task.title,
          status: 'success',
          count: allDiagramResults.length,
          type: diagramMode
        }]);

        // Add delay between tasks
        if (i < queue.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Error processing diagram task:', error);

        // Enhanced error handling for different error scenarios
        let errorMessage = `❌ Lỗi khi tạo diagram cho: ${task.title}`;

        if (error.message.includes('AI1 không thể tạo yêu cầu diagram')) {
          errorMessage = `❌ AI1 không thể phân tích nội dung cho: ${task.title}. Vui lòng kiểm tra cấu hình AI1.`;
        } else if (error.message.includes('AI2 không thể tạo diagram code')) {
          errorMessage = `❌ AI2 không thể tạo diagram code cho: ${task.title}. Vui lòng kiểm tra cấu hình AI2.`;
        } else if (error.message.includes('AI4 không tạo được HTML code')) {
          errorMessage = `❌ AI4 không thể tạo HTML code cho: ${task.title}. Vui lòng kiểm tra cấu hình AI4.`;
        } else if (error.message.includes('Backend tạo diagram thất bại')) {
          errorMessage = `❌ Backend không thể tạo diagram cho: ${task.title}. Có thể do lỗi Kroki API hoặc format code không đúng.`;
        } else if (error.message.includes('Lỗi kết nối mạng')) {
          errorMessage = `❌ Lỗi kết nối mạng khi tạo ${diagramMode === 'html' ? 'HTML code' : 'diagram'} cho: ${task.title}. Vui lòng kiểm tra kết nối.`;
        } else if (error.message.includes('Lỗi API')) {
          errorMessage = `❌ Lỗi API khi tạo ${diagramMode === 'html' ? 'HTML code' : 'diagram'} cho: ${task.title}. Vui lòng thử lại sau.`;
        } else if (error.message.includes('timeout')) {
          errorMessage = `❌ Timeout khi tạo ${diagramMode === 'html' ? 'HTML code' : 'diagram'} cho: ${task.title}. Quá trình mất quá nhiều thời gian.`;
        } else if (error.message.includes('Không có nội dung detail')) {
          errorMessage = `❌ Record "${task.title}" không có nội dung detail để tạo ${diagramMode === 'html' ? 'HTML code' : 'diagram'}.`;
        } else if (error.message.includes('Cấu hình diagram chưa được thiết lập')) {
          errorMessage = `❌ Cấu hình diagram chưa đầy đủ cho: ${task.title}. Vui lòng cấu hình lại.`;
        }

        message.error(errorMessage);

        // Update tracking stats - failed
        setDiagramGenerationStats(prev => ({
          ...prev,
          failed: prev.failed + 1
        }));
        setDiagramGenerationResults(prev => [...prev, {
          id: task.id,
          title: task.title,
          status: 'failed',
          error: error.message,
          type: task.mode || 'kroki'
        }]);

        // Add delay before next task even on error
        if (i < queue.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    setCurrentDiagramProcessing(null);
    setProcessingDiagramQueue(false);
  };

  const processSummaryDetailQueue = async () => {
    if (summaryDetailQueue.length === 0 || processingSummaryDetailQueue) {
      return;
    }

    setProcessingSummaryDetailQueue(true);

    const queue = [...summaryDetailQueue];

    for (let i = 0; i < queue.length; i++) {
      const task = queue[i];
      setCurrentSummaryDetailProcessing(task);

      // Remove from queue immediately
      setSummaryDetailQueue(prev => prev.filter(item => item.id !== task.id));

      try {
        // Get the current record
        const currentRecord = await getK9ById(task.recordId);

        if (!currentRecord) {
          console.error(`Record ${task.recordId} not found`);
          continue;
        }

        if (!currentRecord.detail) {
          message.warning(`"${task.title}" không có detail để tóm tắt!`);
          continue;
        }

        if (currentRecord.summaryDetail) {
          message.info(`"${task.title}" đã có summaryDetail!`);
          continue;
        }

        console.log(`Creating summaryDetail for "${currentRecord.title}"`);

        const summaryResult = await aiGen(
          currentRecord.detail,
          summaryDetailConfig.aiPrompt,
          summaryDetailConfig.aiModel
        );

        if (summaryResult && summaryResult.result) {
          const updatedRecord = {
            ...currentRecord,
            summaryDetail: summaryResult.result
          };

          await updateK9(updatedRecord);

          // Update local state
          const updater = (list) => list.map(item => item.id === task.recordId ? updatedRecord : item);
          setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
          setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
          setData(prev => updater(prev));
          setTableKey(prev => prev + 1);

          message.success(`✅ Tạo summaryDetail thành công cho "${task.title}"!`);
        } else {
          message.error(`❌ Không thể tạo summaryDetail cho "${task.title}"!`);
        }
      } catch (error) {
        console.error(`Error processing summaryDetail for ${task.title}:`, error);
        message.error(`❌ Lỗi khi tạo summaryDetail cho "${task.title}": ${error.message}`);
      } finally {
        setCurrentSummaryDetailProcessing(null);
      }

      // Delay between requests to avoid rate limiting
      if (i < queue.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setProcessingSummaryDetailQueue(false);
  };

  // Xử lý queue tạo Case Training từ Learning Block
  const processCaseFromLearningBlockQueue = async () => {
    if (caseFromLearningBlockQueue.length === 0 || processingCaseFromLearningBlockQueue) {
      return;
    }

    setProcessingCaseFromLearningBlockQueue(true);

    const queue = [...caseFromLearningBlockQueue];

    // Khởi tạo thống kê & mở modal tiến trình
    setCaseFromLearningStats({
      total: queue.length,
      success: 0,
      failed: 0
    });
    setCaseFromLearningResults([]);
    setCaseFromLearningProgressModalVisible(true);

    for (let i = 0; i < queue.length; i++) {
      const task = queue[i];
      setCurrentCaseFromLearningBlockProcessing(task);

      // Bỏ khỏi queue ngay khi bắt đầu xử lý
      setCaseFromLearningBlockQueue(prev => prev.filter(item => item.id !== task.id));

      try {
        const currentRecord = await getK9ById(task.recordId);
        if (!currentRecord) {
          message.error(`Không tìm thấy Learning Block với ID: ${task.recordId}`);
          continue;
        }

        const promptConfig = task.promptConfig;
        if (!promptConfig || !promptConfig.aiPrompt || !promptConfig.aiModel) {
          message.error('Cấu hình Prompt tạo Case Training từ Learning Block chưa đầy đủ (thiếu model hoặc prompt)!');
          continue;
        }

        const countQuiz = Number(promptConfig.countQuiz) || 0;
        const countEssay = Number(promptConfig.countEssay) || 0;

        const quantity = task.quantity && task.quantity > 0 ? task.quantity : 1;

        for (let j = 0; j < quantity; j++) {
          message.info(`🤖 Đang tạo Case Training ${j + 1}/${quantity} từ Learning Block: ${task.title} (Cài đặt: ${promptConfig.name || 'N/A'})`);

          const promptData = {
            ID: currentRecord.id || '',
            CID: currentRecord.cid || '',
            Title: currentRecord.title || '',
            Summary: currentRecord.summary || '',
            Detail: currentRecord.detail || '',
            Tag4: currentRecord.tag4 || [],
            Category: currentRecord.category || '',
            Source: currentRecord.source || ''
          };

          const userContent = JSON.stringify(promptData, null, 2);

          // Ghép thêm yêu cầu số lượng câu hỏi vào system prompt (nếu có cấu hình)
          let systemMessage = promptConfig.aiPrompt;
          const extraConstraints = [];
          if (countQuiz > 0) {
            extraConstraints.push(`Mỗi case phải có CHÍNH XÁC ${countQuiz} câu hỏi trắc nghiệm trong field questionContent.questionQuiz.`);
          }
          if (countEssay > 0) {
            extraConstraints.push(`Mỗi case phải có CHÍNH XÁC ${countEssay} câu hỏi tự luận trong field questionContent.questionEssay.`);
          }
          if (extraConstraints.length > 0) {
            systemMessage = `${systemMessage}\n\nYÊU CẦU SỐ LƯỢNG CÂU HỎI (RẤT QUAN TRỌNG):\n- ${extraConstraints.join('\n- ')}`;
          }

          const aiResponse = await callAIWithStopCheck(
            aiGen,
            userContent,
            systemMessage,
            promptConfig.aiModel
          );

          const rawResult = aiResponse?.result || aiResponse?.answer || aiResponse?.content || aiResponse;

          let generatedCases = [];
          try {
            const parsed = JSON.parse(rawResult);
            if (Array.isArray(parsed)) {
              generatedCases = parsed;
            } else if (parsed) {
              generatedCases = [parsed];
            }
          } catch (e) {
            message.error(`AI không trả về JSON hợp lệ khi tạo Case Training cho "${task.title}": ${e.message}`);
            // Ghi nhận thất bại ở mức Learning Block
            setCaseFromLearningStats(prev => ({
              ...prev,
              failed: prev.failed + 1
            }));
            setCaseFromLearningResults(prev => [
              ...prev,
              {
                id: `lb_${task.recordId}_${j}`,
                recordId: task.recordId,
                title: task.title,
                status: 'failed',
                error: e.message || 'JSON parse error'
              }
            ]);
            continue;
          }

          for (const caseItem of generatedCases) {
            const payload = {
              type: 'caseTraining',
              title: caseItem.title || currentRecord.title || 'Case Training mới',
              summary: caseItem.summary || currentRecord.summary || '',
              detail: caseItem.detail || currentRecord.detail || '',
              source: caseItem.source || currentRecord.source || '',
            
              tag4: caseItem.tag4 || currentRecord.tag4 || null,
              cid: caseItem.cid || currentRecord.cid || null,
              questionContent: caseItem.questionContent || null,
              status: caseItem.status || 'published'
            };

           console.log('payload', payload);

            try {
              const created = await createK9(payload);
              const createdRecord = created?.data || created;

              // Cập nhật vào allData/filteredData cho caseTraining
              setAllData(prev => ({
                ...prev,
                caseTraining: [createdRecord , ...(prev.caseTraining || []) ]
              }));
              setFilteredData(prev => ({
                ...prev,
                caseTraining: [createdRecord , ...(prev.caseTraining || []) ]
              }));

              // Cập nhật thống kê & log
              setCaseFromLearningStats(prev => ({
                ...prev,
                success: prev.success + 1
              }));
              setCaseFromLearningResults(prev => [
                {
                  id: createdRecord.id,
                  recordId: createdRecord.id,
                  title: createdRecord.title,
                  status: 'success',
                  error: null
                },
                ...prev,
              
              ]);

              message.success(`✅ Đã tạo Case Training mới (ID: ${createdRecord.id}) từ "${task.title}"`);
            } catch (e) {
              console.error('Error creating Case Training from Learning Block:', e);
              message.error(`Lỗi tạo Case Training từ "${task.title}": ${e.message}`);

              setCaseFromLearningStats(prev => ({
                ...prev,
                failed: prev.failed + 1
              }));
              setCaseFromLearningResults(prev => [
                ...prev,
                {
                  id: `fail_${task.recordId}_${Date.now()}`,
                  recordId: task.recordId,
                  title: task.title,
                  status: 'failed',
                  error: e.message || 'Error creating record'
                }
              ]);
            }
          }
        }
      } catch (error) {
        console.error('Error in Case-from-LearningBlock queue:', error);
        message.error(`Lỗi khi xử lý hàng đợi tạo Case Training: ${error.message}`);
      } finally {
        setCurrentCaseFromLearningBlockProcessing(null);
      }

      // Delay giữa các task để tránh rate limit
      if (i < queue.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setProcessingCaseFromLearningBlockQueue(false);
  };


  // AI Summary handler

  const handleShowAISummary = async () => {

    setAiSummaryLoading(true);

    setAiSummaryModalVisible(true);

    try {

      const data = await getAllAISummaries();

      // Lọc bỏ những bản ghi có info.sheetName = 'CompanySummary'

      const filteredData = filterCompanySummaryRecords(data);

      setAiSummaryData(filteredData);

    } catch (error) {

      console.error('Lỗi khi lấy danh sách AI summaries:', error);

      message.error('Lỗi khi tải dữ liệu AI Summary: ' + error.message);

    } finally {

      setAiSummaryLoading(false);

    }

  };



  const handleEditAISummary = (record) => {

    setSelectedAISummary(record);

    // Parse the info field to get title and URLReport

    let title = '';

    let urlReport = '';

    if (record.info) {

      try {

        const parsed = typeof record.info === 'string' ? JSON.parse(record.info) : record.info;

        title = parsed.title || '';

        urlReport = parsed.URLReport || '';

      } catch (e) {

        console.error('Error parsing info field:', e);

      }

    }



    // Parse tables field

    let tablesData = [];

    if (record.tables) {

      try {

        tablesData = typeof record.tables === 'string' ? JSON.parse(record.tables) : record.tables;

        if (!Array.isArray(tablesData)) {

          tablesData = [];

        }

      } catch (e) {

        console.error('Error parsing tables field:', e);

        tablesData = [];

      }

    }

    setTables(tablesData);



    // Load existing files for AI Summary

    if (record.fileUrls && Array.isArray(record.fileUrls)) {

      setUploadedFileUrls(record.fileUrls);

      // Create file list for display

      const fileList = record.fileUrls.map((url, index) => {

        const fileName = url.split('/').pop() || `file-${index + 1}`;

        return {

          uid: `-${index}`,

          name: fileName,

          status: 'done',

          url: url,

        };

      });

      setSelectedFiles(fileList);

    } else {

      setUploadedFileUrls([]);

      setSelectedFiles([]);

    }



    aiSummaryEditForm.setFieldsValue({

      title: title,

      urlReport: urlReport,

      summary1: record.summary1 || '',

      summary2: record.summary2 || '',

      category: record.category || 'Doanh nghiệp',

      status: record.status || 'draft'

    });

    setAISummaryEditModalVisible(true);

  };



  const handleUpdateAISummary = async () => {

    try {

      const values = await aiSummaryEditForm.validateFields();



      // Get the existing info structure

      let existingInfo = {};

      if (selectedAISummary.info) {

        try {

          existingInfo = typeof selectedAISummary.info === 'string'

            ? JSON.parse(selectedAISummary.info)

            : selectedAISummary.info;

        } catch (e) {

          console.error('Error parsing existing info:', e);

          existingInfo = {};

        }

      }



      // Merge existing info with updated fields

      const updatedInfo = {

        ...existingInfo,

        title: values.title,

        URLReport: values.urlReport

      };



      const updateData = {

        info: updatedInfo,

        summary1: values.summary1,

        summary2: values.summary2,

        category: values.category,

        status: values.status,

        tables: tables, // Add tables data

        fileUrls: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined // Add fileUrls

      };



      await updateAISummary(selectedAISummary.id, updateData);

      const tableCount = tables.length;

      message.success(`Cập nhật AI Summary thành công! (${tableCount} bảng thông số)`);



      // Refresh the data

      const data = await getAllAISummaries();

      // Lọc bỏ những bản ghi có info.sheetName = 'CompanySummary'

      const filteredData = filterCompanySummaryRecords(data);

      setAiSummaryData(filteredData);



      setAISummaryEditModalVisible(false);

      setSelectedAISummary(null);

      aiSummaryEditForm.resetFields();

      setTables([]); // Reset tables state

      setUploadedFileUrls([]); // Reset file URLs

      setSelectedFiles([]); // Reset selected files

    } catch (error) {

      console.error('Lỗi khi cập nhật AI Summary:', error);

      message.error('Lỗi khi cập nhật AI Summary: ' + error.message);

    }

  };



  const handleDeleteAISummary = async (id) => {

    try {

      await deleteAISummary(id);

      message.success('Xóa AI Summary thành công!');



      // Refresh the data

      const data = await getAllAISummaries();

      // Lọc bỏ những bản ghi có info.sheetName = 'CompanySummary'

      const filteredData = filterCompanySummaryRecords(data);

      setAiSummaryData(filteredData);

    } catch (error) {

      console.error('Lỗi khi xóa AI Summary:', error);

      message.error('Lỗi khi xóa AI Summary: ' + error.message);

    }

  };



  // Table management functions

  const handleAddTable = () => {

    const newTable = {

      id: null, // Will be set when saved

      name: '',

      type: 'quarterly', // quarterly, monthly, yearly

      data: {}

    };

    setEditingTable(newTable);

    setTableModalVisible(true);

  };



  const handleEditTable = (table) => {

    setEditingTable({ ...table });

    setTableModalVisible(true);

  };



  const handleDeleteTable = (tableId) => {

    Modal.confirm({

      title: 'Xác nhận xóa bảng',

      content: 'Bạn có chắc chắn muốn xóa bảng này? Hành động này không thể hoàn tác.',

      okText: 'Xóa',

      okType: 'danger',

      cancelText: 'Hủy',

      onOk: () => {

        setTables(prev => prev.filter(table => table.id !== tableId));

        message.success('Xóa bảng thành công!');

      }

    });

  };



  const handleSaveTable = (tableData) => {

    if (editingTable.id) {

      // Update existing table

      setTables(prev => prev.map(table =>

        table.id === editingTable.id ? { ...tableData, id: editingTable.id } : table

      ));

      message.success('Cập nhật bảng thành công!');

    } else {

      // Add new table

      setTables(prev => [...prev, { ...tableData, id: Date.now() + Math.random() }]);

      message.success('Thêm bảng thành công!');

    }

    setTableModalVisible(false);

    setEditingTable(null);

  };



  const generateTableDataStructure = (type) => {

    switch (type) {

      case 'quarterly':

        return {

          'Q1': '',

          'Q2': '',

          'Q3': '',

          'Q4': ''

        };

      case 'monthly':

        return {

          'Tháng 1': '', 'Tháng 2': '', 'Tháng 3': '', 'Tháng 4': '',

          'Tháng 5': '', 'Tháng 6': '', 'Tháng 7': '', 'Tháng 8': '',

          'Tháng 9': '', 'Tháng 10': '', 'Tháng 11': '', 'Tháng 12': ''

        };

      case 'yearly':

        const currentYear = new Date().getFullYear();

        return {

          [`Năm ${currentYear - 2}`]: '',

          [`Năm ${currentYear - 1}`]: '',

          [`Năm ${currentYear}`]: ''

        };

      default:

        return {};

    }

  };



  const getAISummaryColumns = () => {

    const columns = [

      {

        title: 'ID',

        dataIndex: 'id',

        key: 'id',

        width: 80,

        sorter: (a, b) => a.id - b.id

      },

      {

        title: 'Title',

        dataIndex: 'info',

        key: 'title',

        width: 200,

        ellipsis: {

          showTitle: false,

        },

        render: (info) => {

          if (!info) return '-';

          try {

            const parsed = typeof info === 'string' ? JSON.parse(info) : info;

            return (

              <Tooltip placement="topLeft" title={parsed.title || '-'}>

                <span className={styles.titleCell}>{parsed.title || '-'}</span>

              </Tooltip>

            );

          } catch (e) {

            return '-';

          }

        },

      },

      {

        title: 'URLReport',

        dataIndex: 'info',

        key: 'URLReport',

        width: 220,

        ellipsis: {

          showTitle: false,

        },

        render: (info) => {

          if (!info) return '-';

          try {

            const parsed = typeof info === 'string' ? JSON.parse(info) : info;

            if (parsed.URLReport) {

              return (

                <Tooltip placement="topLeft" title={parsed.URLReport}>

                  <a href={parsed.URLReport} target="_blank" rel="noopener noreferrer" className={styles.urlCell}>

                    {parsed.URLReport}

                  </a>

                </Tooltip>

              );

            }

            return '-';

          } catch (e) {

            return '-';

          }

        },

      },

      // {

      //   title: 'Summary',

      //   dataIndex: 'summary1',

      //   key: 'summary1',

      //   width: 300,

      //   ellipsis: {

      //     showTitle: false,

      //   },

      //   render: (text) => {

      //     if (!text) return '-';

      //     try {

      //       const parsed = typeof text === 'string' ? JSON.parse(text) : text;

      //       const displayText = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed);

      //       return (

      //         <Tooltip placement="topLeft" title={displayText}>

      //           <span className={styles.summaryCell}>{displayText.substring(0, 100) + '...'}</span>

      //         </Tooltip>

      //       );

      //     } catch (e) {

      //       return (

      //         <Tooltip placement="topLeft" title={String(text)}>

      //           <span className={styles.summaryCell}>{String(text).substring(0, 100) + '...'}</span>

      //         </Tooltip>

      //       );

      //     }

      //   },

      // },

      // {

      //   title: 'Detail',

      //   dataIndex: 'summary2',

      //   key: 'summary2',

      //   width: 300,

      //   ellipsis: {

      //     showTitle: false,

      //   },

      //   render: (text) => {

      //     if (!text) return '-';

      //     try {

      //       const parsed = typeof text === 'string' ? JSON.parse(text) : text;

      //       const displayText = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed);

      //       return (

      //         <Tooltip placement="topLeft" title={displayText}>

      //           <span className={styles.detailCell}>{displayText.substring(0, 100) + '...'}</span>

      //         </Tooltip>

      //       );

      //     } catch (e) {

      //       return (

      //         <Tooltip placement="topLeft" title={String(text)}>

      //           <span className={styles.detailCell}>{String(text).substring(0, 100) + '...'}</span>

      //         </Tooltip>

      //       );

      //     }

      //   },

      // },

      {

        title: 'Danh mục',

        dataIndex: 'category',

        key: 'category',

        width: 120,

        render: (category) => {

          const categoryMap = {

            // 'Doanh nghiệp': { color: 'blue', text: 'Doanh nghiệp' },

            'Ngành': { color: 'green', text: 'Ngành' },

            'Vĩ mô': { color: 'orange', text: 'Vĩ mô' }

          };

          const cat = categoryMap[category] || { color: 'default', text: category || '-' };

          return <Tag color={cat.color}>{cat.text}</Tag>;

        },

        filters: [

          // { text: 'Doanh nghiệp', value: 'Doanh nghiệp' },

          { text: 'Ngành', value: 'Ngành' },

          { text: 'Vĩ mô', value: 'Vĩ mô' }

        ],

        onFilter: (value, record) => {

          if (value === '') {

            return !record.category || record.category === '';

          }

          return record.category === value;

        }

      },

      {

        title: 'Trạng thái',

        dataIndex: 'status',

        key: 'status',

        width: 120,

        render: (status) => {

          const statusMap = {

            'draft': { color: 'default', text: 'Nháp' },

            'published': { color: 'success', text: 'Đã xuất bản' },

            'archived': { color: 'warning', text: 'Lưu trữ' }

          };

          const stat = statusMap[status] || { color: 'default', text: status || '-' };

          return <Badge status={stat.color} text={stat.text} />;

        },

        filters: [

          { text: 'Nháp', value: 'draft' },

          { text: 'Đã xuất bản', value: 'published' },

          { text: 'Lưu trữ', value: 'archived' }

        ],

        onFilter: (value, record) => record.status === value

      },

      {

        title: 'Created At',

        dataIndex: 'created_at',

        key: 'created_at',

        width: 150,

        render: (text) => {

          if (!text) return '-';

          const date = new Date(text);

          if (isNaN(date.getTime())) return '-';



          const day = String(date.getDate()).padStart(2, '0');

          const month = String(date.getMonth() + 1).padStart(2, '0');

          const year = date.getFullYear();

          const hours = String(date.getHours()).padStart(2, '0');

          const minutes = String(date.getMinutes()).padStart(2, '0');



          return `${day}/${month}/${year} ${hours}:${minutes}`;

        },

        sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)

      },

      {

        title: 'Bảng thông số',

        dataIndex: 'tables',

        key: 'tables',

        width: 120,

        render: (tables) => {

          if (!tables) return <Tag color="default">0 bảng</Tag>;

          try {

            const tableData = typeof tables === 'string' ? JSON.parse(tables) : tables;

            const count = Array.isArray(tableData) ? tableData.length : 0;

            return (

              <Tag color={count > 0 ? 'blue' : 'default'}>

                📊 {count} bảng

              </Tag>

            );

          } catch (e) {

            return <Tag color="default">0 bảng</Tag>;

          }

        }

      },

      {

        title: 'File đính kèm',

        dataIndex: 'fileUrls',

        key: 'fileUrls',

        width: 120,

        render: (fileUrls) => {

          if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {

            return <Tag color="default">Không có</Tag>;

          }

          return (

            <Tag color="green">

              📎 {fileUrls.length} file

            </Tag>

          );

        }

      }

    ];

    // Add actions column at the end

    columns.push({

      title: 'Hành động',

      key: 'actions',

      width: 200,

      fixed: 'right',

      render: (_, record) => (

        <Space size="small">

          {/* Embedding button - show different buttons based on embedding status */}

          {embeddedItems.has(record.id) ? (

            // Item đã được embedding - hiển thị nút "Embed lại" với màu khác

            <Tooltip title="Embed lại">

              <Button

                type="link"

                onClick={(e) => {

                  e.stopPropagation();

                  handleEmbeding(record.id);

                }}

                size="small"

                loading={isEmbedding(record.id)}

                disabled={isEmbedding(record.id)}

                icon={isEmbedding(record.id) ? <LoadingOutlined /> : <ReloadOutlined />}

                style={{ color: '#1890ff' }} // Màu xanh cho nút embed lại

              >

                {isEmbedding(record.id) ? 'Đang Embedding...' : 'Embed lại'}

              </Button>

            </Tooltip>

          ) : (

            // Item chưa được embedding - hiển thị nút "Embedding" bình thường

            <Tooltip title="Embedding">

              <Button

                type="link"

                onClick={(e) => {

                  e.stopPropagation();

                  handleEmbeding(record.id);

                }}

                size="small"

                loading={isEmbedding(record.id)}

                disabled={isEmbedding(record.id)}

                icon={isEmbedding(record.id) ? <LoadingOutlined /> : null}

              >

                {isEmbedding(record.id) ? 'Đang Embedding...' : 'Embedding'}

              </Button>

            </Tooltip>

          )}

          <Tooltip title="Xem chi tiết">

            <Button

              type="link"

              icon={<EyeOutlined />}

              onClick={e => {

                e.stopPropagation();

                setSelectedAISummary(record);

                setAISummaryDetailModalVisible(true);

              }}

              size="small"

            />

          </Tooltip>

          <Tooltip title="Chỉnh sửa">

            <Button

              type="link"

              icon={<EditOutlined />}

              onClick={e => {

                e.stopPropagation();

                handleEditAISummary(record);

              }}

              size="small"

            />

          </Tooltip>

          <Popconfirm

            title="Bạn có chắc chắn muốn xóa AI Summary này?"

            onConfirm={() => handleDeleteAISummary(record.id)}

            okText="Có"

            cancelText="Không"

          >

            <Tooltip title="Xóa">

              <Button

                type="link"

                icon={<DeleteOutlined />}

                size="small"

                danger

              />

            </Tooltip>

          </Popconfirm>

        </Space>

      )

    });

    return columns;

  };

  const getColumns = () => {

    const baseColumns = [

      {

        title: '#',

        dataIndex: 'id',

        key: 'id',

        width: 100,

        fixed: 'left',

        sorter: (a, b) => a.id - b.id

      },
      {

        title: 'CID',

        dataIndex: 'cid',

        key: 'cid',

        width: 120,

        fixed: 'left',

        render: (cid) => cid || '-'

      },
      {
        title: 'Public',
        fixed: 'left',
        dataIndex: 'isPublic',
        key: 'isPublic',
        width: 120,
        render: (isPublic, record) => (
          <Switch
            checked={isPublic}
            onChange={async (checked) => {
              try {
                // Call API để cập nhật isPublic
                await updateK9({ id: record.id, isPublic: checked });

                // Cập nhật local state theo đúng pattern
                const updater = (list) => list.map(item =>
                  item.id === record.id ? { ...item, isPublic: checked } : item
                );

                setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
                setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
                setData(prev => updater(prev));

                message.success(`Đã ${checked ? 'bật' : 'tắt'} trạng thái public`);
              } catch (error) {
                console.error('Error updating isPublic:', error);
                message.error('Cập nhật thất bại');
              }
            }}
            checkedChildren="Công khai"
            unCheckedChildren="Riêng tư"
          />
        ),
        filters: [
          { text: 'Công khai', value: true },
          { text: 'Riêng tư', value: false },
        ],
        onFilter: (value, record) => Boolean(record.isPublic) === value,
      },
      {
        title: 'Cho phép làm lại',
        dataIndex: 'allow_retake',
        key: 'allow_retake',
        width: 150,
        render: (allowRetake, record) => (
          <Switch
            checked={Boolean(allowRetake)}
            onChange={async (checked) => {
              try {
                await updateK9({ id: record.id, allow_retake: checked });
                const updater = (list) => list.map(item =>
                  item.id === record.id ? { ...item, allow_retake: checked } : item
                );
                setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
                setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
                setData(prev => updater(prev));
                message.success(`Đã ${checked ? 'bật' : 'tắt'} cho phép làm lại`);
              } catch (error) {
                console.error('Error updating allow_retake:', error);
                message.error('Cập nhật thất bại');
              }
            }}
            checkedChildren="Cho phép"
            unCheckedChildren="Khoá"
          />
        ),
        filters: [
          { text: 'Cho phép', value: true },
          { text: 'Khoá', value: false },
        ],
        onFilter: (value, record) => Boolean(record.allow_retake) === value,
      },

      {

        title: 'Tiêu đề',

        dataIndex: 'title',

        key: 'title',

        width: 200,

        fixed: 'left',

        sorter: (a, b) => {

          const titleA = (a.title || '').toLowerCase();

          const titleB = (b.title || '').toLowerCase();

          return titleA.localeCompare(titleB);

        },

        ellipsis: {

          showTitle: false,

        },

        render: (title) => (

          <Tooltip placement="topLeft" title={title}>

            <span className={styles.titleCell}>{title}</span>

          </Tooltip>

        )

      },
      {

        title: 'Trạng thái mục lục',

        dataIndex: 'hasTitle',

        key: 'hasTitle',


        width: 120,

        render: (hasTitle, record) => (

          <Switch

            checked={hasTitle}

            onChange={async (checked) => {

              try {

                // Call API để cập nhật hasTitle

                await updateK9({ id: record.id, hasTitle: checked });



                // Cập nhật local state theo đúng pattern

                const updater = (list) => list.map(item =>

                  item.id === record.id ? { ...item, hasTitle: checked } : item

                );

                setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));

                setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));

                setData(prev => updater(prev));



                message.success(`Đã ${checked ? 'bật' : 'tắt'} trạng thái mục lục`);

              } catch (error) {

                console.error('Error updating hasTitle:', error);

                message.error('Cập nhật thất bại');

              }

            }}

            checkedChildren="Bật"

            unCheckedChildren="Tắt"

          />

        ),


      },
      {

        title: 'Improve',

        dataIndex: 'isImprove',

        key: 'isImprove',


        width: 100,

        render: (isImprove) => (

          <Tag color={isImprove ? 'blue' : 'default'}>

            {isImprove ? 'Đã Improve' : 'Chưa'}

          </Tag>

        ),

        filters: [

          { text: 'Đã Improve', value: true },

          { text: 'Chưa', value: false },

        ],

        onFilter: (value, record) => Boolean(record.isImprove) === value,

      },

      {

        title: 'Thời gian Improve',

        dataIndex: 'improveTime',

        key: 'improveTime',


        width: 150,

        render: (improveTime) => (

          <Tag color={improveTime ? 'blue' : 'default'}>

            {formatDateToDDMMYYYY(improveTime)}

          </Tag>

        ),

      },

      {

        title: 'Model Improve',

        dataIndex: 'modelImprove',

        key: 'modelImprove',


        width: 250,

        render: (modelImprove) => (

          <Tag color={modelImprove ? 'blue' : 'default'}>

            {modelImprove}

          </Tag>

        ),

      },
      {
        title: 'Số ký tự Detail',
        dataIndex: 'detail',
        key: 'detailCharCount',
        width: 120,
        render: (detail) => {
          const charCount = detail ? detail.length : 0;
          return (
            <Tag color={charCount > 0 ? 'blue' : 'default'}>
              {charCount.toLocaleString()}
            </Tag>
          );
        },
        sorter: (a, b) => {
          const countA = a.detail ? a.detail.length : 0;
          const countB = b.detail ? b.detail.length : 0;
          return countA - countB;
        }
      },
      {
        title: 'User Class Allowed',
        dataIndex: 'allowed_user_class',
        key: 'allowed_user_class',
        width: 200,
        render: (allowedClasses) => {
          if (!allowedClasses || allowedClasses.length === 0) {
            return <Tag>Chưa gắn</Tag>;
          }

          // Find user class names from userClasses array
          const classNames = allowedClasses
            .map(id => {
              const userClass = userClasses.find(c => c.id === id);
              return userClass?.name || `Class #${id}`;
            })
            .join(', ');

          return (
            <Tooltip title={classNames}>
              <span> {classNames}</span>
            </Tooltip>
          );
        },
      },




      {

        title: 'Tóm tắt',

        dataIndex: 'summary',

        key: 'summary',

        width: 200,

        ellipsis: {

          showTitle: false,

        },

        render: (summary) => (

          <Tooltip placement="topLeft" title={summary}>

            <span className={styles.summaryCell}>{summary}</span>

          </Tooltip>

        )

      },




      // {

      //   title: 'Chi tiết',

      //   dataIndex: 'detail',

      //   key: 'detail',

      //   width: 300,

      //   ellipsis: {

      //     showTitle: false,

      //   },

      //   render: (detail) => (

      //     <Tooltip placement="topLeft" title={detail}>

      //       <span className={styles.detailCell}>{detail}</span>

      //     </Tooltip>

      //   )

      // },

      ...(currentTab == 'home' || currentTab == 'news' || currentTab == 'longForm' ?

        [

          {



            title: 'Danh mục',

            dataIndex: 'category',

            key: 'category',

            width: 150,

            render: (category) => {

              const categoryMap = {

                'Case study': { color: 'blue', text: 'Case study' },

                'Kinh tế - tài chính': { color: 'green', text: 'Kinh tế - tài chính' },

                'Thế giới': { color: 'default', text: 'Thế giới' },

                'Công nghệ': { color: 'cyan', text: 'Công nghệ' },

                'Đổi mới sáng tạo': { color: 'volcano', text: 'Đổi mới sáng tạo' },

                'Khác': { color: 'orange', text: 'Khác' },

                'Lý thuyết (Theory)': { color: 'purple', text: 'Lý thuyết (Theory)' },

                'Khái niệm (Concept)': { color: 'magenta', text: 'Khái niệm (Concept)' },

                'Nguyên tắc kinh doanh (Principle)': { color: 'geekblue', text: 'Nguyên tắc kinh doanh (Principle)' },

                'Khung phân tích (Framework)': { color: 'gold', text: 'Khung phân tích (Framework)' },

                'Mô hình (Business model)': { color: 'lime', text: 'Mô hình (Business model)' },

                'Phương pháp luận (Methodology)': { color: 'processing', text: 'Phương pháp luận (Methodology)' },

                'Công cụ & kỹ thuật (Tools & Technique)': { color: 'red', text: 'Công cụ & kỹ thuật (Tools & Technique)' },

                'Các báo cáo ngành - vĩ mô': { color: 'green', text: 'Các báo cáo ngành - vĩ mô' },

                'Best Practices': { color: 'blue', text: 'Best Practices' },

                'Case Studies': { color: 'cyan', text: 'Case Studies' },

                'Tài nguyên khác': { color: 'default', text: 'Tài nguyên khác' },

                'Ý tưởng khởi nghiệp': { color: 'red', text: 'Ý tưởng khởi nghiệp' },

                'Tips khởi nghiệp': { color: 'green', text: 'Tips khởi nghiệp' },

                'Sáng tạo khác': { color: 'blue', text: 'Sáng tạo khác' }

              };

              const cat = categoryMap[category] || { color: 'default', text: category };

              return (<div>{cat.text}</div>

              );

            },

            filters: getCurrentTabCategoryFilters(),

            //  [

            //   { text: 'Case study', value: 'Case study' },

            //   { text: 'Kinh tế - tài chính', value: 'Kinh tế - tài chính' },

            //   { text: 'Thế giới', value: 'Thế giới' },

            //   { text: 'Công nghệ', value: 'Công nghệ' },

            //   { text: 'Đổi mới sáng tạo', value: 'Đổi mới sáng tạo' },

            //   { text: 'Khác', value: 'Khác' },

            //   { text: 'Lý thuyết (Theory)', value: 'Lý thuyết (Theory)' },

            //   { text: 'Khái niệm (Concept)', value: 'Khái niệm (Concept)' },

            //   { text: 'Nguyên tắc kinh doanh (Principle)', value: 'Nguyên tắc kinh doanh (Principle)' },

            //   { text: 'Khung phân tích (Framework)', value: 'Khung phân tích (Framework)' },

            //   { text: 'Mô hình (Business model)', value: 'Mô hình (Business model)' },

            //   { text: 'Phương pháp luận (Methodology)', value: 'Phương pháp luận (Methodology)' },

            //   { text: 'Công cụ & kỹ thuật (Tools & Technique)', value: 'Công cụ & kỹ thuật (Tools & Technique)' },

            //   { text: 'Các báo cáo ngành - vĩ mô', value: 'Các báo cáo ngành - vĩ mô' },

            //   { text: 'Best Practices', value: 'Best Practices' },

            //   { text: 'Case Studies', value: 'Case Studies' },

            //   { text: 'Tài nguyên khác', value: 'Tài nguyên khác' },

            //   { text: 'Ý tưởng khởi nghiệp', value: 'Ý tưởng khởi nghiệp' },

            //   { text: 'Tips khởi nghiệp', value: 'Tips khởi nghiệp' },

            //   { text: 'Sáng tạo khác', value: 'Sáng tạo khác' }

            // ],

            onFilter: (value, record) => record.category === value

          }

        ] : []),

      {

        title: 'Trạng thái',

        dataIndex: 'status',

        key: 'status',

        width: 120,

        render: (status) => {

          const statusMap = {

            published: { color: 'success', text: 'Đã xuất bản' },

            draft: { color: 'default', text: 'Nháp' },

            archived: { color: 'warning', text: 'Lưu trữ' }

          };

          const stat = statusMap[status] || { color: 'default', text: status };

          return <Badge status={stat.color} text={stat.text} />;

        },

        filters: [

          { text: 'Đã xuất bản', value: 'published' },

          { text: 'Nháp', value: 'draft' },

          { text: 'Lưu trữ', value: 'archived' }

        ],

        onFilter: (value, record) => record.status === value

      }

    ];



    // Add specific columns based on content type

    if (currentTab === 'home' || currentTab === 'news' || currentTab === 'caseTraining' || currentTab === 'longForm') {

      baseColumns.splice(5, 0,

        {

          title: 'Program',

          dataIndex: 'tag4',

          key: 'tag4',

          width: 550,

          render: (tag4) => {

            if (!Array.isArray(tag4)) return null;

            return (

              <>

                {

                  tag4.map((val) => {

                    const option = tag4Options.find((opt) => opt.value === val);

                    return (

                      <span className={styles.summaryCell}>{option?.label} , </span>

                    );

                  })}

              </>

            );

          },

        },

        // {

        //   title: 'Sentiment',

        //   dataIndex: 'sentiment',

        //   key: 'sentiment',

        //   width: 120,

        //   filters: [

        //     { text: 'Tích cực', value: 'positive' },

        //     { text: 'Tiêu cực', value: 'negative' },

        //     { text: 'Trung tính', value: 'neutral' }

        //   ],

        //   onFilter: (value, record) => record.sentiment === value

        // },

        // {

        //   title: 'Độ phức tạp',

        //   dataIndex: 'impact',

        //   key: 'impact',

        //   width: 150,

        //   filters: [

        //     { text: 'Quan trọng', value: 'important' },

        //     { text: 'Bình thường', value: 'normal' },

        //     { text: 'Bỏ qua', value: 'skip' }

        //   ],

        //   render: (impact) => {

        //     const impactMap = {

        //       important: { color: 'red', text: 'Quan trọng' },

        //       normal: { color: 'default', text: 'Bình thường' },

        //       skip: { color: 'orange', text: 'Bỏ qua' }

        //     };

        //     const imp = impactMap[impact] || { color: 'default', text: impact };

        //     return <Tag color={imp.color}>{imp.text}</Tag>;

        //   },

        //   onFilter: (value, record) => record.impact === value

        // },



        {

          title: 'Nguồn',

          dataIndex: 'source',

          key: 'source',

          width: 120,

          ellipsis: {

            showTitle: false,

          },

          render: (source) => (

            <Tooltip placement="topLeft" title={source}>

              <span className={styles.sourceCell}>{source}</span>

            </Tooltip>

          )

        },

        ...(currentTab === 'caseTraining' ? [

          {

            title: 'Categories',

            dataIndex: 'tag1',

            key: 'tag1',

            width: 120,

            render: (tag1) => {

              if (!tag1) return '';

              return <div>{tag1}</div>;

            },

            filters: getCurrentTabTag1Filters(),

            onFilter: (value, record) => {

              if (value === null) {

                return !record.tag1 || record.tag1 === '';

              }

              return record.tag1 === value;

            }

          },

          {

            title: 'Levels',

            dataIndex: 'tag2',

            key: 'tag2',

            width: 120,

            render: (tag2) => {

              if (!tag2) return '';

              return <div>{tag2}</div>;

            },

            filters: getCurrentTabTag2Filters(),

            onFilter: (value, record) => {

              if (value === null) {

                return !record.tag2 || record.tag2 === '';

              }

              return record.tag2 === value;

            }

          },

          {

            title: 'Series',

            dataIndex: 'tag3',

            key: 'tag3',

            width: 120,

            render: (tag3) => {

              if (!tag3) return '';

              return <div>{tag3}</div>;

            },

            filters: getCurrentTabTag3Filters(),

            onFilter: (value, record) => {

              if (value === null) {

                return !record.tag3 || record.tag3 === '';

              }

              return record.tag3 === value;

            }

          }

        ] : []),



        {

          title: 'Thời gian',

          dataIndex: 'createdAt',

          key: 'createdAt',

          width: 140,

          render: (createdAt) => {

            if (!createdAt) return '-';

            const date = new Date(createdAt);

            if (isNaN(date.getTime())) return '-';



            const day = String(date.getDate()).padStart(2, '0');

            const month = String(date.getMonth() + 1).padStart(2, '0');

            const year = date.getFullYear();

            const hours = String(date.getHours()).padStart(2, '0');

            const minutes = String(date.getMinutes()).padStart(2, '0');



            return `${day}/${month}/${year} ${hours}:${minutes}`;

          },

          sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)

        },

        {

          title: 'Avatar',

          key: 'avatar',

          width: 80,

          render: (_, record) => {

            if (record.avatarUrl) {

              return (

                <Image

                  width={40}

                  height={40}

                  src={record.avatarUrl}

                  style={{ objectFit: 'cover', borderRadius: '4px' }}

                  placeholder={

                    <div style={{

                      width: 40,

                      height: 40,

                      display: 'flex',

                      alignItems: 'center',

                      justifyContent: 'center',

                      backgroundColor: '#f0f0f0',

                      borderRadius: '4px'

                    }}>

                      <PictureOutlined style={{ fontSize: '16px', color: '#999' }} />

                    </div>

                  }

                />

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

              }}>

                <PictureOutlined style={{ fontSize: '16px', color: '#999' }} />

              </div>

            );

          }

        },

        {
          title: <span style={{ color: 'green', fontWeight: 'bold' }}>Diagram HTML</span>,
          key: 'diagramHtml',
          width: 90,
          render: (_, record) => {
            // Hiển thị icon HTML nếu có diagramHtmlCode
            if (record.diagramHtmlCode && record.diagramHtmlCode.length > 0) {
              return (
                <div
                  onClick={() => handleDiagramPreview(record)}
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
                  title="Diagram HTML"
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
                title="Chưa tạo diagram HTML"
              >
                <FileTextOutlined style={{ fontSize: '16px', color: '#999' }} />
              </div>
            );
          }
        },
        {
          title: <span style={{ color: '#722ed1', fontWeight: 'bold' }}>Diagram Excalidraw</span>,
          key: 'diagramExcalidraw',
          width: 90,
          render: (_, record) => {
            // Hiển thị icon Excalidraw React nếu có diagramExcalidrawJson
            if (record.diagramExcalidrawJson && record.diagramExcalidrawJson.length > 0) {
              return (
                <div
                  onClick={() => handleDiagramPreview(record)}
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
                  title="Diagram Excalidraw React"
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
                title="Chưa tạo diagram Excalidraw"
              >
                <PictureOutlined style={{ fontSize: '16px', color: '#999' }} />
              </div>
            );
          }
        },
        {
          title: <span style={{ color: '#1890ff', fontWeight: 'bold' }}>Summary Detail</span>,
          key: 'summaryDetail',
          width: 200,
          render: (_, record) => {
            if (record.summaryDetail) {
              return (
                <Tooltip title={record.summaryDetail}>
                  <div style={{
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '12px',
                    color: '#1890ff'
                  }}>
                    {record.summaryDetail.substring(0, 50)}...
                  </div>
                </Tooltip>
              );
            }
            return (
              <span style={{ color: '#999', fontSize: '12px' }}>Chưa có</span>
            );
          }
        },
    
        {

          title: 'Media',

          key: 'media',

          width: 120,

          render: (_, record) => {

            const imageCount = record.imgUrls && Array.isArray(record.imgUrls) ? record.imgUrls.length : 0;

            const hasVideo = !!record.videoUrl;

            const fileCount = record.fileUrls && Array.isArray(record.fileUrls) ? record.fileUrls.length : 0;



            return (

              <Space size="small" wrap>

                {imageCount > 0 && (

                  <Tag color="blue" style={{ margin: 0 }}>

                    🖼️ {imageCount}

                  </Tag>

                )}

                {hasVideo && (

                  <Tag color="purple" style={{ margin: 0 }}>

                    🎥 1

                  </Tag>

                )}

                {fileCount > 0 && (

                  <Tag color="green" style={{ margin: 0 }}>

                    📎 {fileCount}

                  </Tag>

                )}

                {imageCount === 0 && !hasVideo && fileCount === 0 && (

                  <Tag color="default" style={{ margin: 0 }}>

                    Không có

                  </Tag>

                )}

              </Space>

            );

          }

        },

        {

          title: 'Quiz Content',

          key: 'quizContent',

          width: 120,

          render: (_, record) => {

            const questionContent = record.questionContent || record.quizContent || record.quizzContent;

            const hasQuiz = questionContent && (

              (questionContent.questionQuiz && questionContent.questionQuiz.length > 0) ||

              (questionContent.questionEssay && questionContent.questionEssay.length > 0)

            );



            return (

              <Space size="small" wrap>

                {hasQuiz ? (

                  <Button

                    type="link"

                    icon={<QuestionCircleOutlined />}

                    onClick={() => handleViewQuestionContent(record)}

                    size="small"

                    style={{ color: '#1890ff' }}

                  >

                    Xem Quiz

                  </Button>

                ) : (

                  <Tag color="default" style={{ margin: 0 }}>

                    Không có

                  </Tag>

                )}

              </Space>

            );

          }

        }

      );

    } else if (currentTab === 'library') {

      baseColumns.splice(5, 0,

        // {

        //   title: 'Số trang',

        //   dataIndex: 'pages',

        //   key: 'pages',

        //   width: 100

        // },

        {

          title: 'Media',

          key: 'media',

          width: 120,

          render: (_, record) => {

            const imageCount = record.imgUrls && Array.isArray(record.imgUrls) ? record.imgUrls.length : 0;

            const hasVideo = !!record.videoUrl;



            return (

              <Space size="small" wrap>

                {imageCount > 0 && (

                  <Tag color="blue" style={{ margin: 0 }}>

                    🖼️ {imageCount}

                  </Tag>

                )}

                {hasVideo && (

                  <Tag color="purple" style={{ margin: 0 }}>

                    🎥 1

                  </Tag>

                )}

                {imageCount === 0 && !hasVideo && (

                  <Tag color="default" style={{ margin: 0 }}>

                    Không có

                  </Tag>

                )}

              </Space>

            );

          }

        },

      );

    } else if (currentTab === 'story') {

      baseColumns.splice(5, 0,

        {

          title: 'Thời lượng',

          dataIndex: 'duration',

          key: 'duration',

          width: 100

        },

        {

          title: 'Loại',

          dataIndex: 'storyType',

          key: 'storyType',

          width: 100

        }

      );

    }



    // Add actions column

    baseColumns.push({

      title: 'Hành động',

      key: 'actions',

      width: currentTab === 'story' ? 150 : 350,
      fixed: 'right',

      render: (_, record) => (

        <Space size="small">

          <Tooltip title="Xem chi tiết">

            <Button

              type="link"

              icon={<EyeOutlined />}

              onClick={() => handleView(record)}

              size="small"

            />

          </Tooltip>

          <Tooltip title="Chỉnh sửa">

            <Button

              type="link"

              icon={<EditOutlined />}

              onClick={() => handleEdit(record)}

              size="small"

            />

          </Tooltip>

          {currentTab === 'story' && (

            <Tooltip title={

              record.audioUrl ? `Đã có voice${record.audioText ? ' (có nội dung text)' : ''}` :

                !record.audioText ? "Cần có nội dung audioText để tạo voice" :

                  voiceQueue.find(task => task.recordId === record.id) ? "Đang trong hàng đợi" :

                    currentProcessing && currentProcessing.recordId === record.id ? "Đang tạo voice" :

                      "Tạo voice"

            }>

              <Button

                type="link"

                icon={

                  (voiceQueue.find(task => task.recordId === record.id) ||

                    (currentProcessing && currentProcessing.recordId === record.id)) ?

                    <LoadingOutlined /> : <SoundOutlined />

                }

                onClick={() => handleCreateVoice(record)}

                size="small"

                loading={

                  !!record.audioText &&

                  !!(voiceQueue.find(task => task.recordId === record.id) ||

                    (currentProcessing && currentProcessing.recordId === record.id))

                }

                disabled={

                  !record.audioText ||

                  !!(voiceQueue.find(task => task.recordId === record.id) ||

                    (currentProcessing && currentProcessing.recordId === record.id))

                }

                style={{

                  color: !record.audioText ? '#d9d9d9' :

                    record.audioUrl ? '#52c41a' :

                      voiceQueue.find(task => task.recordId === record.id) ? '#faad14' :

                        currentProcessing && currentProcessing.recordId === record.id ? '#1890ff' :

                          '#262626'

                }}

              />

            </Tooltip>

          )}

          {/* Create voice from detail - for all tabs */}


          <Tooltip title={

            record.audioUrl ? `Đã có voice${record.detail ? ' (có nội dung detail)' : ''}` :

              !record.detail ? "Cần có nội dung detail để tạo voice" :

                voiceQueue.find(task => task.recordId === record.id) ? "Đang trong hàng đợi" :

                  currentProcessing && currentProcessing.recordId === record.id ? "Đang tạo voice" :

                    "Tạo voice từ detail"

          }>

            <Button

              type="link"

              icon={

                (voiceQueue.find(task => task.recordId === record.id) ||

                  (currentProcessing && currentProcessing.recordId === record.id)) ?

                  <LoadingOutlined /> : <SoundOutlined />

              }

              onClick={() => handleCreateVoiceFromDetail(record)}

              size="small"

              loading={

                !!record.detail &&

                !!(voiceQueue.find(task => task.recordId === record.id) ||

                  (currentProcessing && currentProcessing.recordId === record.id))

              }

              disabled={

                !record.detail ||

                !!(voiceQueue.find(task => task.recordId === record.id) ||

                  (currentProcessing && currentProcessing.recordId === record.id))

              }

              style={{

                color: !record.detail ? '#d9d9d9' :

                  record.audioUrl ? '#52c41a' :

                    voiceQueue.find(task => task.recordId === record.id) ? '#faad14' :

                      currentProcessing && currentProcessing.recordId === record.id ? '#1890ff' :

                        '#262626'

              }}

            />

          </Tooltip>


          {/* Embedding button - show different buttons based on embedding status */}

          {(currentTab === 'news' || currentTab === 'caseTraining' || currentTab === 'report') && (

            embeddedItems.has(record.id) ? (

              // Item đã được embedding - hiển thị nút "Embed lại" với màu khác

              <Tooltip title="Embed lại">

                <Button

                  type="link"

                  onClick={() => handleEmbeding(record.id)}

                  size="small"

                  loading={isEmbedding(record.id)}

                  disabled={isEmbedding(record.id)}

                  icon={isEmbedding(record.id) ? <LoadingOutlined /> : <ReloadOutlined />}

                  style={{ color: '#1890ff' }} // Màu xanh cho nút embed lại

                >

                  {isEmbedding(record.id) ? 'Đang Embedding...' : 'Embed lại'}

                </Button>

              </Tooltip>

            ) : (

              // Item chưa được embedding - hiển thị nút "Embedding" bình thường

              <Tooltip title="Embedding">

                <Button

                  type="link"

                  onClick={() => handleEmbeding(record.id)}

                  size="small"

                  loading={isEmbedding(record.id)}

                  disabled={isEmbedding(record.id)}

                  icon={isEmbedding(record.id) ? <LoadingOutlined /> : null}

                >

                  {isEmbedding(record.id) ? 'Đang Embedding...' : 'Embedding'}

                </Button>

              </Tooltip>

            )

          )}

          {(currentTab === 'home' || currentTab === 'news' || currentTab === 'caseTraining' || currentTab === 'longForm') && (

            <>

              <Tooltip title={

                record.avatarUrl ? 'Đã có ảnh' :

                  imageGenerationQueue.find(task => task.recordId === record.id) ? 'Đang trong hàng đợi' :

                    currentImageProcessing && currentImageProcessing.recordId === record.id ? 'Đang tạo ảnh' :

                      'Tạo ảnh'

              }>

                <Button

                  type="link"

                  icon={

                    (imageGenerationQueue.find(task => task.recordId === record.id) ||

                      (currentImageProcessing && currentImageProcessing.recordId === record.id)) ?

                      <LoadingOutlined /> : <PictureOutlined />

                  }

                  onClick={() => handleCreateImage(record)}

                  size="small"

                  loading={

                    !!(imageGenerationQueue.find(task => task.recordId === record.id) ||

                      (currentImageProcessing && currentImageProcessing.recordId === record.id))

                  }

                  disabled={

                    !!record.avatarUrl ||

                    !!(imageGenerationQueue.find(task => task.recordId === record.id) ||

                      (currentImageProcessing && currentImageProcessing.recordId === record.id))

                  }

                  style={{

                    color: record.avatarUrl ? '#52c41a' :

                      imageGenerationQueue.find(task => task.recordId === record.id) ? '#faad14' :

                        currentImageProcessing && currentImageProcessing.recordId === record.id ? '#1890ff' :

                          '#262626'

                  }}

                />

              </Tooltip>



              {/* Diagram Generation Button */}
              <Tooltip title={
                  diagramGenerationQueue.find(task => task.recordId === record.id) ? 'Đang trong hàng đợi' :
                    currentDiagramProcessing && currentDiagramProcessing.recordId === record.id ? 'Đang tạo diagram' :
                      'Tạo diagram'
              }>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'html',
                        label: '💻 Tạo HTML code',
                        icon: <FileTextOutlined />,
                        onClick: () => handleCreateDiagram(record, 'html')
                      },
                      {
                        key: 'excalidraw-react',
                        label: '🎨 Tạo Excalidraw React',
                        icon: <PictureOutlined />,
                        onClick: () => handleCreateDiagram(record, 'excalidraw-react')
                      }
                    ]
                  }}
          
                  trigger={['click']}
                >
                  <Button
                    type="link"
                    icon={
                      (diagramGenerationQueue.find(task => task.recordId === record.id) ||
                        (currentDiagramProcessing && currentDiagramProcessing.recordId === record.id)) ?
                        <LoadingOutlined /> : <NodeIndexOutlined />
                    }
                    size="small"
                    loading={
                      !!(diagramGenerationQueue.find(task => task.recordId === record.id) ||
                        (currentDiagramProcessing && currentDiagramProcessing.recordId === record.id))
                    }
                   
                  
                  />
                </Dropdown>
              </Tooltip>

              {/* Create Summary Detail Button */}
              <Tooltip title={
                record.summaryDetail ? 'Đã có summaryDetail' :
                  summaryDetailQueue.find(task => task.recordId === record.id) ? 'Đang trong hàng đợi' :
                    currentSummaryDetailProcessing && currentSummaryDetailProcessing.recordId === record.id ? 'Đang tạo summaryDetail' :
                      'Tạo summaryDetail'
              }>
                <Button
                  type="link"
                  icon={
                    (summaryDetailQueue.find(task => task.recordId === record.id) ||
                      (currentSummaryDetailProcessing && currentSummaryDetailProcessing.recordId === record.id)) ?
                      <LoadingOutlined /> : <ThunderboltOutlined />
                  }
                  size="small"
                  onClick={() => handleCreateSummaryDetail(record)}
                  loading={
                    !!(summaryDetailQueue.find(task => task.recordId === record.id) ||
                      (currentSummaryDetailProcessing && currentSummaryDetailProcessing.recordId === record.id))
                  }
                  disabled={
                    !!record.summaryDetail ||
                    !!(summaryDetailQueue.find(task => task.recordId === record.id) ||
                      (currentSummaryDetailProcessing && currentSummaryDetailProcessing.recordId === record.id))
                  }
                  style={{
                    color: record.summaryDetail ? '#52c41a' :
                      summaryDetailQueue.find(task => task.recordId === record.id) ? '#faad14' :
                        currentSummaryDetailProcessing && currentSummaryDetailProcessing.recordId === record.id ? '#1890ff' :
                          '#1890ff'
                  }}
                />
              </Tooltip>

            </>



          )}

          <Tooltip title="Xóa">

            <Popconfirm

              title="Bạn có chắc chắn muốn xóa?"

              onConfirm={() => handleDelete(record.id)}

              okText="Có"

              cancelText="Không"

            >

              <Button

                type="link"

                danger

                icon={<DeleteOutlined />}

                size="small"

              />

            </Popconfirm>

          </Tooltip>

        </Space>

      )

    });



    return baseColumns;

  };



  // Reset upload states

  const resetUploadStates = () => {

    setSelectedImages([]);

    setSelectedVideo(null);

    setSelectedFiles([]);

    setSelectedAudio(null);

    setUploadedImageUrls([]);

    setUploadedVideoUrl('');

    setUploadedFileUrls([]);

    setUploadedAudioUrl('');

    setUploadingImages(false);

    setUploadingVideo(false);

    setUploadingFiles(false);

    setUploadingAudio(false);

    setUploadProgress({ images: 0, video: 0, files: 0, audio: 0 });

    setCustomVoiceText('');


    // Reset avatar and diagram states
    setSelectedAvatar(null);
    setSelectedDiagram(null);
    setUploadedAvatarUrl('');
    setUploadedDiagramUrl('');
    setUploadingAvatar(false);
    setUploadingDiagram(false);
  };



  // Handle image upload

  const handleImageUpload = async (fileList) => {

    // Nếu fileList rỗng, reset tất cả

    if (fileList.length === 0) {

      setSelectedImages([]);

      setUploadedImageUrls([]);

      return;

    }



    // Phân loại files: đã upload (có url) và chưa upload (cần upload)

    const existingFiles = fileList.filter(file => file.url || file.status === 'done');

    const newFiles = fileList.filter(file => !file.url && file.status !== 'done' && file.originFileObj);



    // Cập nhật selectedImages trước

    setSelectedImages(fileList);



    // Nếu không có file mới cần upload, chỉ cập nhật URLs từ existing files

    if (newFiles.length === 0) {

      const existingUrls = existingFiles.map(file => file.url).filter(Boolean);

      setUploadedImageUrls(existingUrls);

      return;

    }



    // Upload các file mới

    setUploadingImages(true);

    setUploadProgress(prev => ({ ...prev, images: 0 }));



    try {

      const filesToUpload = newFiles.map(file => file.originFileObj);

      const response = await uploadFiles(filesToUpload);



      const newUrls = response.files?.map(file => file.fileUrl || file.url) || [];

      const existingUrls = existingFiles.map(file => file.url).filter(Boolean);



      // Combine existing URLs với URLs mới

      const allUrls = [...existingUrls, ...newUrls];

      setUploadedImageUrls(allUrls);



      // Update fileList để mark các file mới là 'done' và thêm URL

      const updatedFileList = fileList.map(file => {

        if (newFiles.includes(file)) {

          const newUrlIndex = newFiles.indexOf(file);

          return {

            ...file,

            status: 'done',

            url: newUrls[newUrlIndex]

          };

        }

        return file;

      });



      setSelectedImages(updatedFileList);



      message.success(`Upload thành công ${newUrls.length} ảnh mới!`);

    } catch (error) {

      console.error('Error uploading images:', error);

      message.error('Upload ảnh thất bại!');



      // Rollback: chỉ giữ lại existing files

      const existingUrls = existingFiles.map(file => file.url).filter(Boolean);

      setUploadedImageUrls(existingUrls);

      setSelectedImages(existingFiles);

    } finally {

      setUploadingImages(false);

      setUploadProgress(prev => ({ ...prev, images: 100 }));

    }

  };


  // Handle avatar upload (single file)
  const handleAvatarUpload = async (file) => {
    if (!file) {
      setSelectedAvatar(null);
      setUploadedAvatarUrl('');
      return;
    }

    setUploadingAvatar(true);

    try {
      const response = await uploadFiles([file.originFileObj]);
      const url = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';

      const updatedFile = {
        ...file,
        status: 'done',
        url: url
      };

      setSelectedAvatar(updatedFile);
      setUploadedAvatarUrl(url);

      message.success('Upload avatar thành công!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      message.error('Upload avatar thất bại!');
      setSelectedAvatar(null);
      setUploadedAvatarUrl('');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle diagram upload (single file)
  const handleDiagramUpload = async (file) => {
    if (!file) {
      setSelectedDiagram(null);
      setUploadedDiagramUrl('');
      return;
    }

    setUploadingDiagram(true);

    try {
      const response = await uploadFiles([file.originFileObj]);
      const url = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';

      const updatedFile = {
        ...file,
        status: 'done',
        url: url
      };

      setSelectedDiagram(updatedFile);
      setUploadedDiagramUrl(url);

      message.success('Upload diagram thành công!');
    } catch (error) {
      console.error('Error uploading diagram:', error);
      message.error('Upload diagram thất bại!');
      setSelectedDiagram(null);
      setUploadedDiagramUrl('');
    } finally {
      setUploadingDiagram(false);
    }
  };


  // Handle video upload

  const handleVideoUpload = async (file) => {

    // Nếu file bị xóa hoặc không có

    if (!file) {

      setSelectedVideo(null);

      setUploadedVideoUrl('');

      return;

    }



    // Nếu file đã có URL (đã upload trước đó), chỉ cập nhật state

    if (file.url || file.status === 'done') {

      setSelectedVideo(file);

      setUploadedVideoUrl(file.url || '');

      return;

    }



    // Nếu không có originFileObj, không làm gì

    if (!file.originFileObj) {

      console.warn('No originFileObj found for video file');

      return;

    }



    // Upload file mới

    setUploadingVideo(true);

    setUploadProgress(prev => ({ ...prev, video: 0 }));



    try {

      const response = await uploadFiles([file.originFileObj]);

      const url = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';



      const updatedFile = {

        ...file,

        status: 'done',

        url: url

      };



      setUploadedVideoUrl(url);

      setSelectedVideo(updatedFile);



      message.success('Upload video thành công!');

    } catch (error) {

      console.error('Error uploading video:', error);

      message.error('Upload video thất bại!');

      setSelectedVideo(null);

      setUploadedVideoUrl('');

    } finally {

      setUploadingVideo(false);

      setUploadProgress(prev => ({ ...prev, video: 100 }));

    }

  };



  // Handle file upload

  const handleFileUpload = async (fileList) => {

    // Nếu fileList rỗng, reset tất cả

    if (fileList.length === 0) {

      setSelectedFiles([]);

      setUploadedFileUrls([]);

      return;

    }



    // Phân loại files: đã upload (có url) và chưa upload (cần upload)

    const existingFiles = fileList.filter(file => file.url || file.status === 'done');

    const newFiles = fileList.filter(file => !file.url && file.status !== 'done' && file.originFileObj);



    // Cập nhật selectedFiles trước

    setSelectedFiles(fileList);



    // Nếu không có file mới cần upload, chỉ cập nhật URLs từ existing files

    if (newFiles.length === 0) {

      const existingUrls = existingFiles.map(file => file.url).filter(Boolean);

      setUploadedFileUrls(existingUrls);

      return;

    }



    // Upload các file mới

    setUploadingFiles(true);

    setUploadProgress(prev => ({ ...prev, files: 0 }));



    try {

      const filesToUpload = newFiles.map(file => file.originFileObj);

      const response = await uploadFiles(filesToUpload);



      const newUrls = response.files?.map(file => file.fileUrl || file.url) || [];

      const existingUrls = existingFiles.map(file => file.url).filter(Boolean);



      // Combine existing URLs với URLs mới

      const allUrls = [...existingUrls, ...newUrls];

      setUploadedFileUrls(allUrls);



      // Update fileList để mark các file mới là 'done' và thêm URL

      const updatedFileList = fileList.map(file => {

        if (newFiles.includes(file)) {

          const newUrlIndex = newFiles.indexOf(file);

          return {

            ...file,

            status: 'done',

            url: newUrls[newUrlIndex]

          };

        }

        return file;

      });



      setSelectedFiles(updatedFileList);



      message.success(`Upload thành công ${newUrls.length} file mới!`);

    } catch (error) {

      console.error('Error uploading files:', error);

      message.error('Upload file thất bại!');



      // Rollback: chỉ giữ lại existing files

      const existingUrls = existingFiles.map(file => file.url).filter(Boolean);

      setUploadedFileUrls(existingUrls);

      setSelectedFiles(existingFiles);

    } finally {

      setUploadingFiles(false);

      setUploadProgress(prev => ({ ...prev, files: 100 }));

    }

  };



  // Handle audio upload

  const handleAudioUpload = async (file) => {

    // Nếu file bị xóa hoặc không có

    if (!file) {

      setSelectedAudio(null);

      setUploadedAudioUrl('');

      return;

    }



    // Nếu file đã có URL (đã upload trước đó), chỉ cập nhật state

    if (file.url || file.status === 'done') {

      setSelectedAudio(file);

      setUploadedAudioUrl(file.url || '');

      return;

    }



    // Nếu không có originFileObj, không làm gì

    if (!file.originFileObj) {

      console.warn('No originFileObj found for audio file');

      return;

    }



    // Upload file mới

    setUploadingAudio(true);

    setUploadProgress(prev => ({ ...prev, audio: 0 }));



    try {

      const response = await uploadFiles([file.originFileObj]);

      const url = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';



      const updatedFile = {

        ...file,

        status: 'done',

        url: url

      };



      setUploadedAudioUrl(url);

      setSelectedAudio(updatedFile);



      message.success('Upload audio thành công!');

    } catch (error) {

      console.error('Error uploading audio:', error);

      message.error('Upload audio thất bại!');

      setSelectedAudio(null);

      setUploadedAudioUrl('');

    } finally {

      setUploadingAudio(false);

      setUploadProgress(prev => ({ ...prev, audio: 100 }));

    }

  };



  // Handle bulk import from Excel

  const handleBulkImport = () => {
    console.log('🔄 Opening import modal...');
    setImportModalVisible(true);
    setImportPreviewData(null);
    console.log('✅ Import modal should be visible now');
  };

  const handleImportExcel = async (file) => {

    if (!file) return;



    // Validate file type

    const allowedTypes = [

      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx

      'application/vnd.ms-excel', // .xls

      'application/vnd.ms-excel.sheet.macroEnabled.12' // .xlsm

    ];



    if (!allowedTypes.includes(file.type)) {

      message.error('Vui lòng chọn file Excel (.xlsx, .xls, .xlsm)!');

      return;

    }



    setUploadingImport(true);



    try {

      const reader = new FileReader();

      reader.onload = (e) => {

        try {

          const data = new Uint8Array(e.target.result);

          const workbook = XLSX.read(data, { type: 'array' });



          // Lấy sheet đầu tiên

          const firstSheetName = workbook.SheetNames[0];

          const worksheet = workbook.Sheets[firstSheetName];



          // Convert to JSON với header row

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });



          if (jsonData.length < 2) {

            message.error('File Excel phải có ít nhất 1 dòng header và 1 dòng dữ liệu!');

            return;

          }



          // Parse data theo format

          const headers = jsonData[0];

          const rows = jsonData.slice(1);



          const parsedRecords = rows.map((row, index) => {

            const record = {};

            headers.forEach((header, colIndex) => {

              if (header && row[colIndex] !== undefined) {

                record[header.toLowerCase().trim()] = row[colIndex];

              }

            });

            record._rowIndex = index + 2; // +2 vì bắt đầu từ row 2 trong Excel

            return record;

          }).filter(record => record.title); // Chỉ lấy records có title



          console.log('📊 Excel Import Debug:', {
            headers,
            parsedRecords: parsedRecords.slice(0, 3), // Log first 3 records
            totalRows: rows.length,
            validRows: parsedRecords.length
          });

          setImportPreviewData({

            headers,

            records: parsedRecords,

            totalRows: rows.length,

            validRows: parsedRecords.length

          });

          console.log('✅ Import data set to state:', importPreviewData);

          message.success(`Đã đọc ${parsedRecords.length}/${rows.length} bản ghi hợp lệ từ Excel!`);

        } catch (parseError) {

          console.error('Error parsing Excel file:', parseError);

          message.error('Không thể đọc file Excel! Vui lòng kiểm tra format file.');

        }

      };



      reader.readAsArrayBuffer(file);

    } catch (error) {

      console.error('Error reading Excel file:', error);

      message.error('Có lỗi khi đọc file Excel!');

    } finally {

      setUploadingImport(false);

    }

  };



  const handleConfirmImport = async () => {

    if (!importPreviewData || !importPreviewData.records.length) {

      message.error('Không có dữ liệu để import!');

      return;

    }



    setUploadingImport(true);

    let successCount = 0;

    let errorCount = 0;



    try {

      for (const record of importPreviewData.records) {

        try {

          const newRecord = {

            tag4: record.tag4 || null,

            title: record.title || '',

            summary: record.summary || record.description || '',

            detail: record.detail || record.content || record.summary || '',

            category: record.category || null,

            type: currentTab, // Sử dụng tab hiện tại

            status: record.status || 'published',

            cid: record.cid || null,

            // Specific fields based on type

            ...(currentTab === 'news' && {

              source: record.source || '',

              sentiment: record.sentiment || null,

              impact: record.impact || 'normal'

            }),

            ...(currentTab === 'longForm' && {

              source: record.source || '',

              sentiment: record.sentiment || null,

              impact: record.impact || 'normal'

            }),

            ...(currentTab === 'home' && {

              source: record.source || '',

              sentiment: record.sentiment || null,

              impact: record.impact || 'normal',

              priority: record.priority || 'medium',

              featured: record.featured || false,

              homeCategory: record.homeCategory || 'latest',

              displayOrder: record.displayOrder || 1

            }),

            ...(currentTab === 'caseTraining' && {

              source: record.source || '',

              sentiment: record.sentiment || null,

              impact: record.impact || 'normal',

              tag1: record.tag1 || null,

              tag2: record.tag2 || null,

              tag3: record.tag3 || null,

              difficultyLevel: record.difficultyLevel || null,

              estimatedTime: record.estimatedTime || null,

              learningObjectives: record.learningObjectives || null,

              keywords: record.keywords || null

            }),

            ...(currentTab === 'library' && {

              pages: record.pages || null

            }),

            ...(currentTab === 'story' && {

              duration: record.duration || '',

              storyType: record.storytype || record.type || 'Podcast'

            })

          };



          await createK9(newRecord);

          successCount++;

        } catch (error) {

          console.error(`Error creating record at row ${record._rowIndex}:`, error);

          errorCount++;

        }

      }



      // Update local state instead of reloading all data
      if (successCount > 0) {
        const updater = (list) => [...(list || []), ...successfulRecords];
        setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
        setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
        setData(prev => updater(prev));
        setTableKey(prev => prev + 1);

        message.success(`Import thành công ${successCount} bản ghi${errorCount > 0 ? `, ${errorCount} bản ghi thất bại` : ''}!`);

        setImportModalVisible(false);

        setImportPreviewData(null);

      } else {

        message.error('Không thể import bản ghi nào!');

      }



    } catch (error) {

      console.error('Error in bulk import:', error);

      message.error('Có lỗi khi import dữ liệu!');

    } finally {

      setUploadingImport(false);

    }

  };



  // Generate and download Excel template

  const handleDownloadTemplate = () => {

    let headers = [];

    let sampleData = [];

    let fileName = '';



    if (currentTab === 'news') {

      headers = ['Title', 'CID', 'Summary', 'Detail', 'Category', 'Source', 'Sentiment', 'Impact', 'Tag4'];

      sampleData = [

        [

          'Tin tức về xu hướng công nghệ mới',

          'CID001',

          'Tổng hợp những tin tức mới nhất về xu hướng công nghệ đang phát triển.',

          'Bài viết này cung cấp cái nhìn tổng quan về các xu hướng công nghệ mới nhất và tác động của chúng đến doanh nghiệp.',

          'Techtok',

          'https://example.com/tech-news',

          'positive',

          'normal',

          'Program 1, Program 2'

        ],

        [

          'Phân tích thị trường tài chính tuần này',

          'CID002',

          'Đánh giá tình hình thị trường tài chính và dự báo xu hướng trong tuần tới.',

          'Báo cáo chi tiết về diễn biến thị trường tài chính, các yếu tố tác động và dự báo cho tuần tiếp theo.',

          'Kinh tế vỉa hè',

          'https://example.com/finance-analysis',

          'neutral',

          'important',

          'Program 2, Program 3'

        ]

      ];

    } else if (currentTab === 'longForm') {

      headers = ['Title', 'CID', 'Summary', 'Detail', 'Category', 'Source', 'Sentiment', 'Impact', 'Tag4'];

      sampleData = [

        [

          'Lý thuyết về quản lý chiến lược doanh nghiệp',

          'CID001',

          'Hướng dẫn chi tiết về các lý thuyết cơ bản trong quản lý chiến lược doanh nghiệp.',

          'Tài liệu này trình bày các lý thuyết nền tảng về chiến lược doanh nghiệp, từ việc phân tích môi trường, xác định mục tiêu đến việc triển khai và đánh giá kết quả.',

          'Lý thuyết (Theory)',

          'https://example.com/framework',

          'positive',

          'important',

          'Program 1, Program 2'

        ],

        [

          'Khái niệm về Business Model Canvas',

          'CID002',

          'Giới thiệu về khái niệm và cách sử dụng Business Model Canvas trong kinh doanh.',

          'Tài liệu này giải thích chi tiết về khái niệm Business Model Canvas và cách áp dụng vào thực tế kinh doanh.',

          'Khái niệm (Concept)',

          'https://example.com/process',

          'positive',

          'normal',

          'Program 1, Program 2'

        ]

      ];

      fileName = 'LongForm_Template.xlsx';

    } else if (currentTab === 'home') {

      headers = ['Title', 'CID', 'Summary', 'Detail', 'Category', 'Source', 'Sentiment', 'Impact', 'Tag4', 'Priority', 'Featured', 'HomeCategory', 'DisplayOrder'];

      sampleData = [

        [

          'Bài viết nổi bật về quản lý doanh nghiệp',

          'CID003',

          'Tổng hợp những kiến thức quan trọng về quản lý doanh nghiệp hiện đại.',

          'Tài liệu này trình bày các phương pháp và chiến lược quản lý doanh nghiệp hiệu quả trong thời đại số.',

          'Tư duy & Kỹ năng',

          'https://example.com/management',

          'positive',

          'important',

          'Program 1, Program 2',

          'high',

          'true',

          'featured',

          '1'

        ],

        [

          'Hướng dẫn khởi nghiệp cho người mới bắt đầu',

          'CID004',

          'Những bước cơ bản để bắt đầu hành trình khởi nghiệp thành công.',

          'Tài liệu hướng dẫn chi tiết từ việc lên ý tưởng đến việc triển khai và phát triển doanh nghiệp.',

          'Mô hình & Công cụ ứng dụng',

          'https://example.com/startup',

          'positive',

          'normal',

          'Program 1, Program 2',

          'medium',

          'false',

          'recommended',

          '2'

        ]

      ];

      fileName = 'Home_Template.xlsx';

    } else if (currentTab === 'caseTraining') {

      headers = ['Title', 'CID', 'Summary', 'Detail', 'Source', 'Impact', 'Tag1', 'Tag2', 'Tag3', 'Tag4', 'DifficultyLevel', 'EstimatedTime', 'LearningObjectives', 'Keywords'];

      sampleData = [

        [

          'Lý thuyết về quản lý chiến lược doanh nghiệp',

          'CID004',

          'Hướng dẫn chi tiết về các lý thuyết cơ bản trong quản lý chiến lược doanh nghiệp.',

          'Tài liệu này trình bày các lý thuyết nền tảng về chiến lược doanh nghiệp, từ việc phân tích môi trường, xác định mục tiêu đến việc triển khai và đánh giá kết quả.',

          'https://example.com/theory',

          'important',

          'Business Strategy',

          'Advanced',

          'Enterprise',

          'Program 1, Program 2',

          'intermediate',

          '45 phút',

          'Hiểu được các khái niệm cơ bản về quản lý chiến lược',

          'Business Strategy, Management, Leadership'

        ],

        [

          'Khái niệm về Business Model Canvas',

          'CID005',

          'Giới thiệu về khái niệm và cách sử dụng Business Model Canvas trong kinh doanh.',

          'Tài liệu này giải thích chi tiết về khái niệm Business Model Canvas và cách áp dụng vào thực tế kinh doanh.',

          'https://example.com/concept',

          'normal',

          'Business Strategy',

          'Intermediate',

          'SME',

          'Program 1, Program 2',

          'beginner',

          '30 phút',

          'Nắm vững khái niệm Business Model Canvas',

          'Business Model, Strategy, Innovation'

        ],

        [

          'Best Practices trong quản lý nhân sự',
          'CID006',

          'Những kinh nghiệm thực tế và bài học thành công trong quản lý nhân sự.',

          'Tài liệu này tổng hợp những best practice từ các công ty hàng đầu về cách tuyển dụng, đào tạo và phát triển nhân sự.',

          'https://example.com/best-practice',

          'important',

          'Leadership',

          'Expert',

          'Global',

          'Program 1, Program 2',

          'advanced',

          '1 giờ',

          'Áp dụng best practices vào thực tế quản lý nhân sự',

          'HR Management, Best Practices, Leadership'

        ]

      ];

      fileName = 'Case_Training_Template.xlsx';

    } else if (currentTab === 'library') {

      headers = ['Title', 'CID', 'Summary', 'Detail', 'Category', 'Pages'];

      sampleData = [

        [

          'Ý tưởng khởi nghiệp từ nhu cầu thực tế',

          'CID005',

          'Cách thức phát hiện và phát triển ý tưởng khởi nghiệp từ những nhu cầu thực tế trong cuộc sống.',

          'Cuốn sách này hướng dẫn cách phát hiện các vấn đề và nhu cầu thực tế, từ đó phát triển thành ý tưởng khởi nghiệp khả thi.',

          'Ý tưởng khởi nghiệp',

          '280'

        ],

        [

          'Tips thành công cho startup giai đoạn đầu',
          'CID006',

          'Những lời khuyên và kinh nghiệm quý báu cho các startup trong giai đoạn khởi đầu.',

          'Tài liệu tổng hợp những tips quan trọng từ các founder thành công, giúp startup tránh được những sai lầm phổ biến.',

          'Tips khởi nghiệp',

          '156'

        ]

      ];

      fileName = 'Sang_Tao_Khoi_Nghiep_Template.xlsx';

    } else if (currentTab === 'story') {

      headers = ['Title', 'CID', 'Summary', 'Detail', 'Category', 'Duration', 'StoryType'];

      sampleData = [

        [

          'Case study: Startup fintech thành công',

          'CID006',

          'Hành trình từ ý tưởng đến IPO của một startup fintech hàng đầu Việt Nam.',

          'Case study chi tiết về hành trình 7 năm xây dựng một startup fintech từ con số 0, vượt qua nhiều thử thách để trở thành unicorn đầu tiên của Việt Nam trong lĩnh vực tài chính.',

          'Case study',

          '25 phút',

          'Podcast'

        ],

        [

          'Đổi mới sáng tạo trong công nghệ blockchain',
          'CID007',

          'Cách thức các doanh nghiệp ứng dụng blockchain để tối ưu hóa quy trình.',

          'Phỏng vấn với các chuyên gia về cách blockchain đang thay đổi cách thức hoạt động của các doanh nghiệp, từ chuỗi cung ứng đến dịch vụ tài chính.',

          'Đổi mới sáng tạo',

          '18 phút',

          'Interview'

        ]

      ];

      fileName = 'Story_Case_Template.xlsx';

    }



    // Create workbook and worksheet

    const workbook = XLSX.utils.book_new();

    const worksheetData = [headers, ...sampleData];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);



    // Set column widths

    const columnWidths = headers.map(header => {

      if (header === 'Title') return { wch: 50 };

      if (header === 'Summary') return { wch: 60 };

      if (header === 'Detail') return { wch: 80 };

      if (header === 'Category') return { wch: 20 };

      if (header === 'Source') return { wch: 30 };

      return { wch: 15 };

    });

    worksheet['!cols'] = columnWidths;



    // Style the header row (bold and background color)

    for (let col = 0; col < headers.length; col++) {

      const cellAddress = XLSX.utils.encode_cell({ c: col, r: 0 });

      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {

        font: { bold: true, color: { rgb: "FFFFFF" } },

        fill: { fgColor: { rgb: "FF4472C4" } },

        alignment: { horizontal: "center", vertical: "center" },

        border: {

          top: { style: "thin", color: { rgb: "000000" } },

          bottom: { style: "thin", color: { rgb: "000000" } },

          left: { style: "thin", color: { rgb: "000000" } },

          right: { style: "thin", color: { rgb: "000000" } }

        }

      };

    }



    // Style sample data rows

    for (let row = 1; row <= sampleData.length; row++) {

      for (let col = 0; col < headers.length; col++) {

        const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });

        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {

          alignment: { horizontal: "left", vertical: "top", wrapText: true },

          border: {

            top: { style: "thin", color: { rgb: "CCCCCC" } },

            bottom: { style: "thin", color: { rgb: "CCCCCC" } },

            left: { style: "thin", color: { rgb: "CCCCCC" } },

            right: { style: "thin", color: { rgb: "CCCCCC" } }

          }

        };

      }

    }



    // Set row heights

    worksheet['!rows'] = [

      { hpt: 25 }, // Header row height

      ...sampleData.map(() => ({ hpt: 60 })) // Sample data rows height

    ];



    // Add worksheet to workbook

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');



    // Add instructions sheet

    const instructionsData = [

      ['HƯỚNG DẪN SỬ DỤNG TEMPLATE'],

      [''],

      ['1. CÁC CỘT BẮT BUỘC:'],

      ['   - Title: Tiêu đề bài viết (không được để trống)'],

      ['   - Summary: Tóm tắt nội dung (không được để trống)'],

      [''],

      ['2. CÁC CỘT TÙY CHỌN:'],

      ['   - Detail: Nội dung chi tiết'],

      ['   - Category: Danh mục (xem giá trị hợp lệ bên dưới)'],

      ['   - Status: Trạng thái (published/draft/archived)'],

      [''],

      ['3. GIÁ TRỊ HỢP LỆ CHO CATEGORY:'],

      ...((currentTab === 'home' || currentTab === 'news' || currentTab === 'caseTraining' || currentTab === 'longForm') ? [

        ['   - Lý thuyết (Theory)'],

        ['   - Khái niệm (Concept)'],

        ['   - Nguyên tắc kinh doanh (Principle)'],

        ['   - Khung phân tích (Framework)'],

        ['   - Mô hình (Business model)'],

        ['   - Phương pháp luận (Methodology)'],

        ['   - Công cụ & kỹ thuật (Tools & Technique)'],

        ['   - Các báo cáo ngành - vĩ mô'],

        ['   - Best Practices'],

        ['   - Case Studies'],

        ['   - Tài nguyên khác']

      ] : currentTab === 'library' ? [

        ['   - Ý tưởng khởi nghiệp'],

        ['   - Tips khởi nghiệp'],

        ['   - Sáng tạo khác']

      ] : [

        ['   - Case study'],

        ['   - Kinh tế - tài chính'],

        ['   - Thế giới'],

        ['   - Công nghệ'],

        ['   - Đổi mới sáng tạo'],

        ['   - Khác']

      ]),

      [''],

      ...(currentTab === 'home' || currentTab === 'news' ? [

        ['4. CÁC CỘT ĐẶC BIỆT CHO NEWS:'],

        ['   - Source: Nguồn tin (URL)'],

        ['   - Sentiment: positive/negative/neutral'],

        ['   - Impact: important/normal/skip']

      ] : currentTab === 'caseTraining' ? [

        ['4. CÁC CỘT ĐẶC BIỆT CHO CASE TRAINING:'],

        ['   - Source: Nguồn tin (URL)'],

        ['   - Sentiment: positive/negative/neutral'],

        ['   - Impact: important/normal/skip'],

        ['   - Tag1: Phân loại chủ đề (Business Strategy, Marketing, Finance, v.v.)'],

        ['   - Tag2: Phân loại mức độ (Beginner, Intermediate, Advanced, Expert, v.v.)'],

        ['   - Tag3: Phân loại quy mô (Industry, Startup, Enterprise, SME, v.v.)']

      ] : currentTab === 'story' ? [

        ['4. CÁC CỘT ĐẶC BIỆT CHO STORY:'],

        ['   - Duration: Thời lượng (VD: "15 phút")'],

        ['   - StoryType: Podcast/Video Story/Interview/Documentary']

      ] : [

        ['4. CÁC CỘT ĐẶC BIỆT CHO LIBRARY:'],

        ['   - Pages: Số trang (VD: "120")']

      ]),

      [''],

      ['5. LƯU Ý:'],

      ['   - Xóa các dòng mẫu trước khi nhập dữ liệu thực'],

      ['   - Giữ nguyên tên các cột trong dòng header'],

      ['   - Mỗi dòng tương ứng với một bài viết']

    ];



    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);

    instructionsSheet['!cols'] = [{ wch: 60 }];



    // Style instructions header

    instructionsSheet['A1'].s = {

      font: { bold: true, size: 16 },

      alignment: { horizontal: "center" }

    };



    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Hướng dẫn');



    // Download file

    XLSX.writeFile(workbook, fileName);



    message.success(`Đã tải xuống file mẫu: ${fileName}`);

  };



  // JSON Import Functions

  const getJsonTemplate = () => {

    if (currentTab === 'home') {

      return `[

  {

    "title": "Bài viết nổi bật về quản lý doanh nghiệp",

    "cid": "CID003",

    "summary": "Tổng hợp những kiến thức quan trọng về quản lý doanh nghiệp hiện đại.",

    "detail": "Tài liệu này trình bày các phương pháp và chiến lược quản lý doanh nghiệp hiệu quả trong thời đại số.",

    "category": "Tư duy & Kỹ năng",

    "source": "https://example.com/management",

    "sentiment": "positive",

    "impact": "important",

    "tag4": ["Program 1", "Program 2"],

    "priority": "high",

    "featured": true,

    "homeCategory": "featured",

    "displayOrder": 1,

    "status": "published"

  },

  {

    "title": "Hướng dẫn khởi nghiệp cho người mới bắt đầu",

    "cid": "CID004",

    "summary": "Những bước cơ bản để bắt đầu hành trình khởi nghiệp thành công.",

    "detail": "Tài liệu hướng dẫn chi tiết từ việc lên ý tưởng đến việc triển khai và phát triển doanh nghiệp.",

    "category": "Mô hình & Công cụ ứng dụng",

    "source": "https://example.com/startup",

    "sentiment": "positive",

    "impact": "normal",

    "tag4": ["Program 1", "Program 2"],

    "priority": "medium",

    "featured": false,

    "homeCategory": "recommended",

    "displayOrder": 2,

    "status": "published"

  }

]`;

    } else if (currentTab === 'news' || currentTab === 'longForm') {

      return `[

  {

    "title": "Lý thuyết về quản lý chiến lược doanh nghiệp",

    "cid": "CID001",

    "summary": "Hướng dẫn chi tiết về các lý thuyết cơ bản trong quản lý chiến lược doanh nghiệp.",

    "detail": "Tài liệu này trình bày các lý thuyết nền tảng về chiến lược doanh nghiệp, từ việc phân tích môi trường, xác định mục tiêu đến việc triển khai và đánh giá kết quả.",

    "category": "Lý thuyết (Theory)",

    "source": "https://example.com/framework",

    "sentiment": "positive",

    "impact": "important",

    "tag4": ["Program 1", "Program 2"],

    "status": "published"

  },

  {

    "title": "Khái niệm về Business Model Canvas",

    "cid": "CID002",

    "summary": "Giới thiệu về khái niệm và cách sử dụng Business Model Canvas trong kinh doanh.",

    "detail": "Tài liệu này giải thích chi tiết về khái niệm Business Model Canvas và cách áp dụng vào thực tế kinh doanh.",

    "category": "Khái niệm (Concept)",

    "source": "https://example.com/process",

    "sentiment": "positive",

    "impact": "normal",

    "tag4": ["Program 1", "Program 2"],

    "status": "published"

  },

  {

    "title": "Best Practices trong quản lý nhân sự",

    "summary": "Những kinh nghiệm thực tế và bài học thành công trong quản lý nhân sự.",

    "detail": "Tài liệu tổng hợp những best practice từ các công ty hàng tên đầu về cách tuyển dụng, đào tạo và phát triển nhân sự.",

    "category": "Best Practices",

    "source": "https://example.com/best-practice",

    "sentiment": "positive",

    "impact": "important",

    "tag4": ["Program 1", "Program 2"],

    "status": "published"

  }

]`;

    } else if (currentTab === 'caseTraining') {

      return `[

  {

    "title": "Lý thuyết về quản lý chiến lược doanh nghiệp",

    "cid": "CID004",

    "summary": "Hướng dẫn chi tiết về các lý thuyết cơ bản trong quản lý chiến lược doanh nghiệp.",

    "detail": "Tài liệu này trình bày các lý thuyết nền tảng về chiến lược doanh nghiệp, từ việc phân tích môi trường, xác định mục tiêu đến việc triển khai và đánh giá kết quả.",

    "source": "https://example.com/framework",

    "impact": "important",

    "tag1": "Business Strategy",

    "tag2": "Advanced",

    "tag3": "Enterprise",

    "tag4": ["Program 1", "Program 2"],

    "difficultyLevel": "intermediate",

    "estimatedTime": "45 phút",

    "learningObjectives": "Hiểu được các khái niệm cơ bản về quản lý chiến lược",

    "keywords": ["Business Strategy", "Management", "Leadership"],

    "status": "published"

  },

  {

    "title": "Khái niệm về Business Model Canvas",

    "cid": "CID005",

    "summary": "Giới thiệu về khái niệm và cách sử dụng Business Model Canvas trong kinh doanh.",

    "detail": "Tài liệu này giải thích chi tiết về khái niệm Business Model Canvas và cách áp dụng vào thực tế kinh doanh.",

    "source": "https://example.com/process",

    "impact": "normal",

    "tag1": "Business Strategy",

    "tag2": "Intermediate",

    "tag3": "SME",

    "tag4": ["Program 1", "Program 2"],

    "difficultyLevel": "beginner",

    "estimatedTime": "30 phút",

    "learningObjectives": "Nắm vững khái niệm Business Model Canvas",

    "keywords": ["Business Model", "Strategy", "Innovation"],

    "status": "published"

  },

  {

    "title": "Best Practices trong quản lý nhân sự",

    "summary": "Những kinh nghiệm thực tế và bài học thành công trong quản lý nhân sự.",

    "detail": "Tài liệu tổng hợp những best practice từ các công ty hàng tên đầu về cách tuyển dụng, đào tạo và phát triển nhân sự.",

    "source": "https://example.com/best-practice",

    "impact": "important",

    "tag1": "Leadership",

    "tag2": "Expert",

    "tag3": "Global",

    "tag4": ["Program 1", "Program 2"],

    "difficultyLevel": "advanced",

    "estimatedTime": "1 giờ",

    "learningObjectives": "Áp dụng best practices vào thực tế quản lý nhân sự",

    "keywords": ["HR Management", "Best Practices", "Leadership"],

    "status": "published"

  }

]`;

    } else if (currentTab === 'library') {

      return `[

  {

    "title": "Ý tưởng khởi nghiệp từ nhu cầu thực tế",

    "cid": "CID005",

    "summary": "Cách thức phát hiện và phát triển ý tưởng khởi nghiệp từ những nhu cầu thực tế trong cuộc sống.",

    "detail": "Cuốn sách này hướng dẫn cách phát hiện các vấn đề và nhu cầu thực tế, từ đó phát triển thành ý tưởng khởi nghiệp khả thi.",

    "category": "Ý tưởng khởi nghiệp",

    "status": "published"

  },

  {

    "title": "Tips thành công cho startup giai đoạn đầu",

    "summary": "Những lời khuyên và kinh nghiệm quý báu cho các startup trong giai đoạn khởi đầu.",

    "detail": "Tài liệu tổng hợp những tips quan trọng từ các founder thành công, giúp startup tránh được những sai lầm phổ biến.",

    "category": "Tips khởi nghiệp",

    "status": "published"

  }

]`;

    } else if (currentTab === 'story') {

      return `[

  {

    "title": "Case study: Startup fintech thành công",

    "cid": "CID006",

    "summary": "Hành trình từ ý tưởng đến IPO của một startup fintech hàng đầu Việt Nam.",

    "detail": "Case study chi tiết về hành trình 7 năm xây dựng một startup fintech từ con số 0, vượt qua nhiều thử thách để trở thành unicorn đầu tiên của Việt Nam trong lĩnh vực tài chính.",

    "category": "Case study",

    "duration": "25 phút",

    "storyType": "Podcast",

    "audioText": "Case study chi tiết về hành trình 7 năm xây dựng một startup fintech từ con số 0, vượt qua nhiều thử thách để trở thành unicorn đầu tiên của Việt Nam trong lĩnh vực tài chính.",

    "status": "published"

  },

  {

    "title": "Đổi mới sáng tạo trong công nghệ blockchain",

    "summary": "Cách thức các doanh nghiệp ứng dụng blockchain để tối ưu hóa quy trình.",

    "detail": "Phỏng vấn với các chuyên gia về cách blockchain đang thay đổi cách thức hoạt động của các doanh nghiệp, từ chuỗi cung ứng đến dịch vụ tài chính.",

    "category": "Đổi mới sáng tạo",

    "duration": "18 phút",

    "storyType": "Interview",

    "audioText": "Phỏng vấn với các chuyên gia về cách blockchain đang thay đổi cách thức hoạt động của các doanh nghiệp, từ chuỗi cung ứng đến dịch vụ tài chính.",

    "status": "published"

  }

]`;

    }

    return '[]';

  };



  const handleJsonImport = () => {

    setJsonImportModalVisible(true);

    setJsonInput('');

    setJsonPreviewData(null);

  };



  const handleReportOverviewSettings = async () => {

    try {

      // Load current overview settings from database

      const settings = await getSettingByType('REPORT_OVERVIEW');

      if (settings?.setting) {

        setReportOverviewData(settings.setting);

      } else {

        setReportOverviewData(null);

      }

      setReportOverviewModalVisible(true);

    } catch (error) {

      console.error('Error loading report overview settings:', error);

      setReportOverviewData(null);

      setReportOverviewModalVisible(true);

    }

  };



  const handleReportOverviewSave = (overviewData) => {

    setReportOverviewData(overviewData);

    setReportOverviewModalVisible(false);

  };



  const handleJsonInputChange = (value) => {

    setJsonInput(value);

    setJsonPreviewData(null);

  };



  const handleJsonPreview = () => {

    if (!jsonInput.trim()) {

      message.warning('Vui lòng nhập JSON!');

      return;

    }



    try {

      const parsedData = JSON.parse(jsonInput);



      if (!Array.isArray(parsedData)) {

        message.error('JSON phải là một mảng!');

        return;

      }



      if (parsedData.length === 0) {

        message.warning('Mảng JSON không được rỗng!');

        return;

      }



      // Validate each item

      const validRecords = [];

      const invalidRecords = [];



      parsedData.forEach((item, index) => {

        if (!item.title || !item.summary) {

          invalidRecords.push({

            index: index + 1,

            reason: 'Thiếu title hoặc summary'

          });

        } else {

          validRecords.push({

            ...item,

            _rowIndex: index + 1

          });

        }

      });



      setJsonPreviewData({

        records: validRecords,

        invalidRecords,

        totalRows: parsedData.length,

        validRows: validRecords.length

      });



      if (validRecords.length > 0) {

        message.success(`Đã parse thành công ${validRecords.length}/${parsedData.length} bản ghi hợp lệ!`);

      } else {

        message.error('Không có bản ghi hợp lệ nào!');

      }



    } catch (error) {

      console.error('Error parsing JSON:', error);

      message.error('JSON không hợp lệ: ' + error.message);

    }

  };



  const handleConfirmJsonImport = async () => {

    if (!jsonPreviewData || !jsonPreviewData.records.length) {

      message.error('Không có dữ liệu để import!');

      return;

    }



    setUploadingJson(true);

    let successCount = 0;

    let errorCount = 0;



    try {

      for (const record of jsonPreviewData.records) {

        try {

          const newRecord = {

            tag4: record.tag4 || null,

            title: record.title || '',

            summary: record.summary || '',

            detail: record.detail || record.summary || '',

            category: record.category || null,

            type: currentTab,

            status: record.status || 'published',

            cid: record.cid || null,

            // Specific fields based on type

            ...((currentTab === 'news' || currentTab === 'caseTraining' || currentTab === 'longForm') && {

              source: record.source || '',

              sentiment: record.sentiment || null,

              impact: record.impact || 'normal',

              tag1: record.tag1 || null,

              tag2: record.tag2 || null

            }),

            ...(currentTab === 'home' && {

              source: record.source || '',

              sentiment: record.sentiment || null,

              impact: record.impact || 'normal',

              priority: record.priority || 'medium',

              featured: record.featured || false,

              homeCategory: record.homeCategory || 'latest',

              displayOrder: record.displayOrder || 1

            }),

            ...(currentTab === 'library' && {

              pages: record.pages || null

            }),

            ...(currentTab === 'story' && {

              duration: record.duration || '',

              storyType: record.storyType || 'Podcast',

              audioText: record.audioText || ''

            })

          };



          await createK9(newRecord);

          successCount++;

        } catch (error) {

          console.error(`Error creating record at row ${record._rowIndex}:`, error);

          errorCount++;

        }

      }



      // Update local state instead of reloading all data
      if (successCount > 0) {
        const updater = (list) => [...(list || []), ...successfulRecords];
        setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
        setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
        setData(prev => updater(prev));
        setTableKey(prev => prev + 1);

        message.success(`Import JSON thành công ${successCount} bản ghi${errorCount > 0 ? `, ${errorCount} bản ghi thất bại` : ''}!`);

        setJsonImportModalVisible(false);

        setJsonInput('');

        setJsonPreviewData(null);

      } else {

        message.error('Không thể import bản ghi nào!');

      }



    } catch (error) {

      console.error('Error in JSON import:', error);

      message.error('Có lỗi khi import dữ liệu JSON!');

    } finally {

      setUploadingJson(false);

    }

  };



  const handleLoadJsonTemplate = () => {

    setJsonInput(getJsonTemplate());

    setJsonPreviewData(null);

  };



  const handleCreate = () => {

    setModalMode('create');

    setSelectedRecord(null);

    form.resetFields();

    resetUploadStates();

    setCustomVoiceText(''); // Reset custom voice text for new creation

    setAudioText(''); // Reset audioText

    setFormKey(prev => prev + 1);

    setModalVisible(true);

  };



  const handleCreateCompanySummary = () => {

    setCompanySummaryModalVisible(true);

    setCompanySummarySearchTerm('');

    setCompanySummaryData(null);

  };



  const handleClassifyNews = async () => {

    setLoadingClassify(true);

    try {

      // Lấy tất cả data hiện có cho tab hiện tại

      const allData = await getK9ByType(currentTab);



      // Lọc ra những item chưa có đầy đủ thông tin phân loại

      const unclassifiedItems = allData.filter(item => {

        const basicFields = !item.sentiment || !item.category || !item.impact ||

          item.sentiment === '' || item.category === '' || item.impact === '';



        // Thêm kiểm tra cho loại home

        if (currentTab === 'home') {

          return basicFields || !item.priority || !item.homeCategory || !item.displayOrder;

        }



        return basicFields;

      });



      if (unclassifiedItems.length === 0) {

        const tabLabel = currentTab === 'home' ? 'home' : currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'items';

        message.info(`Tất cả ${tabLabel} đã được phân loại đầy đủ!`);

        return;

      }



      const tabLabel = currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'items';

      message.info(`Bắt đầu phân loại ${unclassifiedItems.length} ${tabLabel}...`);



      let successCount = 0;

      let errorCount = 0;



      for (const item of unclassifiedItems) {

        try {

          // Detect ngôn ngữ và dịch nếu cần thiết

          let processedTitle = item.title;

          let processedSummary = item.summary;

          let processedDetail = item.detail || item.summary;



          // Kiểm tra xem có phải tiếng Anh không bằng AI

          const languageDetectionPrompt = `

Xác định ngôn ngữ của văn bản sau:

Tiêu đề: "${item.title}"

Tóm tắt: "${item.summary}"



Trả về kết quả theo định dạng JSON:

{

  "language": "vi/en",

  "confidence": "high/medium/low"

}



Chỉ trả về JSON, không thêm text khác.`;



          const languageResponse = await aiGen(

            languageDetectionPrompt,

            "Bạn là chuyên gia phân tích ngôn ngữ. Hãy xác định chính xác ngôn ngữ của văn bản.",

            'gpt-4o-mini',

            'text'

          );



          const languageResult = languageResponse.result || languageResponse.answer || languageResponse.content || languageResponse;



          let languageInfo;

          try {

            const jsonMatch = languageResult.match(/\{[\s\S]*\}/);

            if (jsonMatch) {

              languageInfo = JSON.parse(jsonMatch[0]);

            } else {

              languageInfo = { language: 'vi', confidence: 'low' };

            }

          } catch (parseError) {

            console.error('Error parsing language detection:', parseError);

            languageInfo = { language: 'vi', confidence: 'low' };

          }



          // Nếu là tiếng Anh thì dịch sang tiếng Việt

          if (languageInfo.language === 'en') {

            console.log(`🌐 Detected English content for ${currentTab} ${item.id}, translating to Vietnamese...`);



            const translationPrompt = `

Dịch văn bản tiếng Anh sau sang tiếng Việt một cách chính xác và tự nhiên:



Tiêu đề: "${item.title}"

Tóm tắt: "${item.summary}"

${item.detail && item.detail !== item.summary ? `Chi tiết: "${item.detail}"` : ''}



Trả về kết quả theo định dạng JSON:

{

  "title": "tiêu đề đã dịch",

  "summary": "tóm tắt đã dịch"${item.detail && item.detail !== item.summary ? ',\n  "detail": "chi tiết đã dịch"' : ''}

}



Yêu cầu dịch:

- Giữ nguyên ý nghĩa và ngữ cảnh

- Sử dụng tiếng Việt tự nhiên, dễ hiểu

- Giữ nguyên các tên riêng, số liệu

- Không thêm hoặc bớt thông tin



Chỉ trả về JSON, không thêm text khác.`;



            const translationResponse = await aiGen(

              translationPrompt,

              "Bạn là chuyên gia dịch thuật English-Vietnamese. Hãy dịch chính xác và tự nhiên.",

              'gpt-4o-mini',

              'text'

            );



            const translationResult = translationResponse.result || translationResponse.answer || translationResponse.content || translationResponse;



            try {

              const jsonMatch = translationResult.match(/\{[\s\S]*\}/);

              if (jsonMatch) {

                const translatedContent = JSON.parse(jsonMatch[0]);

                processedTitle = translatedContent.title || news.title;

                processedSummary = translatedContent.summary || news.summary;

                processedDetail = translatedContent.detail || processedDetail;



                console.log(`✅ Translated news ${news.id} from English to Vietnamese`);

              }

            } catch (parseError) {

              console.error('Error parsing translation result:', parseError);

              // Giữ nguyên nội dung gốc nếu dịch thất bại

            }

          }



          // Tạo prompt cho AI để phân tích (sử dụng nội dung đã được dịch)

          const analysisPrompt = `

Phân tích bài viết tin tức sau và cung cấp thông tin phân loại:



Tiêu đề: ${processedTitle}

Tóm tắt: ${processedSummary}

Chi tiết: ${processedDetail}



Hãy phân tích và trả về kết quả theo định dạng JSON chính xác sau:

{

  "sentiment": "positive/negative/neutral",

            "category": "Lý thuyết (Theory)/Khái niệm (Concept)/Nguyên tắc kinh doanh (Principle)/Khung phân tích (Framework)/Mô hình (Business model)/Phương pháp luận (Methodology)/Công cụ & kỹ thuật (Tools & Technique)/Các báo cáo ngành - vĩ mô/Best Practices/Case Studies/Tài nguyên khác", 

  "impact": "important/normal/skip"

}



Quy tắc phân loại:

- sentiment: "positive" (tin tích cực, thành công, hợp tác), "negative" (tai nạn, xung đột, tệ nạn), "neutral" (trung tính)

- category: 

  + "Lý thuyết (Theory)" (lý thuyết, nguyên lý cơ bản, học thuyết)

  + "Khái niệm (Concept)" (khái niệm, định nghĩa, ý tưởng cơ bản)

  + "Nguyên tắc kinh doanh (Principle)" (nguyên tắc, quy tắc, chuẩn mực)

  + "Khung phân tích (Framework)" (framework, khung phân tích, mô hình phân tích)

  + "Mô hình (Business model)" (business model, mô hình kinh doanh, mô hình hoạt động)

  + "Phương pháp luận (Methodology)" (phương pháp, quy trình, cách tiếp cận)

  + "Công cụ & kỹ thuật (Tools & Technique)" (công cụ, kỹ thuật, phương tiện)

  + "Các báo cáo ngành - vĩ mô" (báo cáo ngành, báo cáo vĩ mô, thống kê)

  + "Best Practices" (kinh nghiệm tốt, thực hành tốt, bài học thành công)

  + "Case Studies" (case study, nghiên cứu tình huống, ví dụ thực tế)

  + "Tài nguyên khác" (tài liệu khác, thông tin bổ sung)

- impact: "important" (tin quan trọng, ảnh hưởng lớn), "normal" (tin thường), "skip" (tin không dùng được, chất lượng kém, spam, quảng cáo)

Chỉ trả về JSON, không thêm text khác.`;



          const systemMessage = "Bạn là chuyên gia phân tích tin tức. Hãy phân loại tin tức một cách chính xác và khách quan.";



          // Gọi AI để phân tích

          const response = await aiGen(

            analysisPrompt,

            systemMessage,

            'gpt-4o-mini', // Model AI để sử dụng

            'text'

          );



          const aiResult = response.result || response.answer || response.content || response;



          // Parse kết quả JSON từ AI

          let classificationResult;

          try {

            // Tìm JSON trong response

            const jsonMatch = aiResult.match(/\{[\s\S]*\}/);

            if (jsonMatch) {

              classificationResult = JSON.parse(jsonMatch[0]);

            } else {

              throw new Error('Không tìm thấy JSON trong response');

            }

          } catch (parseError) {

            console.error('Error parsing AI response:', parseError, 'Response:', aiResult);

            // Fallback: sử dụng logic đơn giản

            classificationResult = {

              sentiment: getSentimentFromTitle(news.title),

              category: getCategoryFromContent(news.title, news.summary),

              impact: 'normal'

            };

          }



          // Validate và chuẩn hóa kết quả

          const validSentiments = ['positive', 'negative', 'neutral'];

          const validCategories = ['Tư duy & Kỹ năng', 'Mô hình & Công cụ ứng dụng'];

          const validImpacts = ['important', 'normal', 'skip'];



          const normalizedResult = {

            sentiment: validSentiments.includes(classificationResult.sentiment) ? classificationResult.sentiment : 'neutral',

            category: validCategories.includes(classificationResult.category) ? classificationResult.category : 'Tài nguyên khác',

            impact: validImpacts.includes(classificationResult.impact) ? classificationResult.impact : 'normal'

          };



          // Cập nhật news trong database (bao gồm nội dung đã dịch nếu có)

          const updatedNews = {

            ...news,

            title: processedTitle, // Cập nhật title đã dịch (nếu có)

            summary: processedSummary, // Cập nhật summary đã dịch (nếu có)

            detail: processedDetail, // Cập nhật detail đã dịch (nếu có)

            sentiment: normalizedResult.sentiment,

            category: normalizedResult.category,

            impact: normalizedResult.impact

          };



          await updateK9(updatedNews);

          successCount++;



          console.log(`✅ Classified news ${news.id}:`, normalizedResult);



          // Log translation info if translated

          if (languageInfo && languageInfo.language === 'en') {

            console.log(`🌐 Also translated content for news ${news.id} from English to Vietnamese`);

          }



        } catch (error) {

          console.error(`❌ Error classifying news ${news.id}:`, error);

          errorCount++;

        }

      }



      // Update local state instead of reloading all data
      if (successCount > 0) {
        const updater = (list) => list.map(item => {
          const updatedItem = updatedItems.find(updated => updated.id === item.id);
          return updatedItem || item;
        });
        setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
        setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
        setData(prev => updater(prev));
        setTableKey(prev => prev + 1);

        message.success(`Phân loại thành công ${successCount} bài viết${errorCount > 0 ? `, ${errorCount} bài thất bại` : ''}!`);

      } else {

        message.error('Không thể phân loại bài viết nào');

      }



    } catch (error) {

      console.error('Error in handleClassifyNews:', error);

      message.error('Lỗi khi phân loại news: ' + error.message);

    } finally {

      setLoadingClassify(false);

    }

  };



  // Helper functions để fallback khi AI parse lỗi

  const getSentimentFromTitle = (title) => {

    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('thành công') || lowerTitle.includes('tăng trưởng') || lowerTitle.includes('hợp tác')) return 'positive';

    if (lowerTitle.includes('tai nạn') || lowerTitle.includes('lừa đảo') || lowerTitle.includes('cách chức') || lowerTitle.includes('sụp đổ')) return 'negative';

    return 'neutral';

  };



  const getCategoryFromContent = (title, summary) => {

    const content = (title + ' ' + summary).toLowerCase();

    if (content.includes('lý thuyết') || content.includes('nguyên lý') || content.includes('học thuyết')) return 'Lý thuyết (Theory)';

    if (content.includes('khái niệm') || content.includes('định nghĩa') || content.includes('ý tưởng cơ bản')) return 'Khái niệm (Concept)';

    if (content.includes('nguyên tắc') || content.includes('quy tắc') || content.includes('chuẩn mực')) return 'Nguyên tắc kinh doanh (Principle)';

    if (content.includes('framework') || content.includes('khung phân tích') || content.includes('mô hình phân tích')) return 'Khung phân tích (Framework)';

    if (content.includes('business model') || content.includes('mô hình kinh doanh') || content.includes('mô hình hoạt động')) return 'Mô hình (Business model)';

    if (content.includes('phương pháp') || content.includes('quy trình') || content.includes('cách tiếp cận')) return 'Phương pháp luận (Methodology)';

    if (content.includes('công cụ') || content.includes('kỹ thuật') || content.includes('phương tiện')) return 'Công cụ & kỹ thuật (Tools & Technique)';

    if (content.includes('báo cáo ngành') || content.includes('báo cáo vĩ mô') || content.includes('thống kê')) return 'Các báo cáo ngành - vĩ mô';

    if (content.includes('best practice') || content.includes('kinh nghiệm tốt') || content.includes('thực hành tốt')) return 'Best Practices';

    if (content.includes('case study') || content.includes('nghiên cứu tình huống') || content.includes('ví dụ thực tế')) return 'Case Studies';

    return 'Tài nguyên khác'; // default category

  };



  // Helper functions for audio processing (from AnswerPanel)

  const cleanBase64 = (base64String) => {

    return base64String.replace(/[\n\r\s]/g, '');

  };



  const base64ToUint8Array = (base64) => {

    const binaryString = atob(base64);

    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {

      bytes[i] = binaryString.charCodeAt(i);

    }

    return bytes;

  };



  const ensureFileNameWithExtension = (fileName, contentType) => {

    const extensionMap = {

      'audio/mpeg': '.mp3',

      'audio/mp3': '.mp3',

      'audio/wav': '.wav',

      'audio/x-wav': '.wav',

      'application/octet-stream': '.mp3' // Default to mp3

    };



    const extension = extensionMap[contentType] || '.mp3';



    if (!fileName.endsWith(extension)) {

      return fileName + extension;

    }

    return fileName;

  };



  const handlePlayAudio = async (audioUrl) => {

    if (!audioUrl) {

      message.warning('Không có audio để phát!');

      return;

    }



    // Nếu đang phát cùng audio thì pause/resume

    if (audioRef.current && audioRef.current.src === audioUrl) {

      if (isAudioPlaying) {

        audioRef.current.pause();

        setIsAudioPlaying(false);

      } else {

        try {

          await audioRef.current.play();

          setIsAudioPlaying(true);

        } catch (error) {

          console.error('Error resuming audio:', error);

          message.error('Không thể phát audio!');

        }

      }

      return;

    }



    // Dừng audio cũ nếu có

    if (audioRef.current) {

      audioRef.current.pause();

    }



    setIsAudioLoading(true);



    try {

      // Tạo audio element mới

      const audio = new Audio(audioUrl);

      audioRef.current = audio;



      // Xử lý events

      audio.onloadstart = () => setIsAudioLoading(true);

      audio.oncanplay = () => setIsAudioLoading(false);

      audio.onplay = () => setIsAudioPlaying(true);

      audio.onpause = () => setIsAudioPlaying(false);

      audio.onended = () => {

        setIsAudioPlaying(false);

      };

      audio.onerror = () => {

        setIsAudioLoading(false);

        setIsAudioPlaying(false);

        message.error('Không thể tải audio!');

      };



      // Phát audio

      await audio.play();



    } catch (error) {

      console.error('Error playing audio:', error);

      setIsAudioLoading(false);

      message.error('Không thể phát audio!');

    }

  };



  const handleCreateVoice = async (record) => {

    if (!record.audioText) {

      message.warning('Không có nội dung audioText để tạo voice!');

      return;

    }



    // Nếu đã có audioUrl thì thông báo

    if (record.audioUrl) {

      message.info('Story này đã có voice!');

      return;

    }



    // Kiểm tra xem đã có trong queue chưa

    const existingTask = voiceQueue.find(task => task.recordId === record.id);

    if (existingTask) {

      message.warning(`"${record.title}" đã có trong hàng đợi tạo voice!`);

      return;

    }



    // Kiểm tra xem có đang được xử lý trong queue processor không

    if (currentProcessing && currentProcessing.recordId === record.id) {

      message.warning(`"${record.title}" đang được tạo voice!`);

      return;

    }



    // Sử dụng audioText làm nội dung để tạo voice

    const content = record.audioText;



    // Thêm vào queue

    addVoiceToQueue(

      record.id,

      record.title,

      content,

      'single'

    );

  };



  // Create voice from detail field - for all tabs

  const handleCreateVoiceFromDetail = async (record) => {

    if (!record.detail) {

      message.warning('Không có nội dung detail để tạo voice!');

      return;

    }



    // Nếu đã có audioUrl thì thông báo

    if (record.audioUrl) {

      message.info('Bản ghi này đã có voice!');

      return;

    }



    // Kiểm tra xem đã có trong queue chưa

    const existingTask = voiceQueue.find(task => task.recordId === record.id);

    if (existingTask) {

      message.warning(`"${record.title}" đã có trong hàng đợi tạo voice!`);

      return;

    }



    // Kiểm tra xem có đang được xử lý trong queue processor không

    if (currentProcessing && currentProcessing.recordId === record.id) {

      message.warning(`"${record.title}" đang được tạo voice!`);

      return;

    }



    // Sử dụng detail làm nội dung để tạo voice

    const content = record.detail;



    // Thêm vào queue

    addVoiceToQueue(

      record.id,

      record.title,

      content,

      'detail-single'

    );

  };



  const handleEdit = (record) => {

    setModalMode('edit');

    setSelectedRecord(record);

    // Ensure tag1, tag2, and tag3 are properly set in the form only for caseTraining

    // Parse info to get filedLabel_1 and filedLabel_2
    let filedLabel_1 = '';
    let filedLabel_2 = '';
    if (record.info) {
      try {
        const parsed = typeof record.info === 'string' ? JSON.parse(record.info) : record.info;
        filedLabel_1 = parsed.filedLabel_1 || '';
        filedLabel_2 = parsed.filedLabel_2 || '';
      } catch (e) {
        console.error('Error parsing info:', e);
      }
    }

    const formData = {

      ...record,

      // Add filedLabel fields from info
      filedLabel_1: filedLabel_1,
      filedLabel_2: filedLabel_2,

      ...(currentTab === 'caseTraining' && {

        tag1: record.tag1 || undefined,

        tag2: record.tag2 || undefined,

        tag3: record.tag3 || undefined,

        tag4: record.tag4 || undefined,

        difficultyLevel: record.difficultyLevel || undefined,

        estimatedTime: record.estimatedTime || undefined,

        learningObjectives: record.learningObjectives || undefined,

        keywords: record.keywords || undefined

      }),

      ...(currentTab === 'home' && {

        priority: record.priority || 'medium',

        featured: record.featured || false,

        homeCategory: record.homeCategory || 'latest',

        displayOrder: record.displayOrder || 1

      })

    };

    form.setFieldsValue(formData);

    resetUploadStates();

    setCustomVoiceText('');

    setQuizContent(record.quizContent || '');

    setAudioFileList(record.backgroundAudio ? [{ uid: '-1', name: 'background-audio.mp3', status: 'done', url: record.backgroundAudio }] : []);

    if (record.type === 'library') {

      if (record.imgUrls && Array.isArray(record.imgUrls)) {

        setUploadedImageUrls(record.imgUrls);

        // Create file list for display

        const imageFileList = record.imgUrls.map((url, index) => ({

          uid: `-${index}`,

          name: `image-${index + 1}`,

          status: 'done',

          url: url,

        }));

        setSelectedImages(imageFileList);

      }



      if (record.videoUrl) {

        setUploadedVideoUrl(record.videoUrl);

        setSelectedVideo({

          uid: '-1',

          name: 'video',

          status: 'done',

          url: record.videoUrl,

        });

      }

    }

    // Load avatar data
    if (record.avatarUrl) {
      setUploadedAvatarUrl(record.avatarUrl);
      setSelectedAvatar({
        uid: '-1',
        name: 'avatar',
        status: 'done',
        url: record.avatarUrl,
      });
    }

    // Load diagram data
    if (record.diagramUrl) {
      setUploadedDiagramUrl(record.diagramUrl);
      setSelectedDiagram({
        uid: '-1',
        name: 'diagram',
        status: 'done',
        url: record.diagramUrl,
      });
    }

    if (record.type === 'news' || record.type === 'home' || record.type === 'longForm' || record.type === 'caseTraining') {
      // Load existing files for news type

      if (record.fileUrls && Array.isArray(record.fileUrls)) {

        setUploadedFileUrls(record.fileUrls);

        // Create file list for display

        const fileList = record.fileUrls.map((url, index) => {

          const fileName = url.split('/').pop() || `file-${index + 1}`;

          return {

            uid: `-${index}`,

            name: fileName,

            status: 'done',

            url: url,

          };

        });

        setSelectedFiles(fileList);

      }



      // Load existing images for news type

      if (record.imgUrls && Array.isArray(record.imgUrls)) {

        setUploadedImageUrls(record.imgUrls);

        // Create file list for display

        const imageFileList = record.imgUrls.map((url, index) => ({

          uid: `-${index}`,

          name: `image-${index + 1}`,

          status: 'done',

          url: url,

        }));

        setSelectedImages(imageFileList);

      }



      // Load existing video for news type

      if (record.videoUrl) {

        setUploadedVideoUrl(record.videoUrl);

        setSelectedVideo({

          uid: '-1',

          name: 'video',

          status: 'done',

          url: record.videoUrl,

        });

      }

    } else if (record.type === 'story') {

      // Load existing audio for story type

      if (record.audioUrl) {

        setUploadedAudioUrl(record.audioUrl);

        setSelectedAudio({

          uid: '-1',

          name: 'audio',

          status: 'done',

          url: record.audioUrl,

        });

      }



      // Load existing audioText for story type

      if (record.audioText) {

        setAudioText(record.audioText || '');

      }

    } else if (record.type === 'report') {

      // Load existing files for report type

      if (record.fileUrls && Array.isArray(record.fileUrls)) {

        setUploadedFileUrls(record.fileUrls);

        // Create file list for display

        const fileList = record.fileUrls.map((url, index) => {

          const fileName = url.split('/').pop() || `file-${index + 1}`;

          return {

            uid: `-${index}`,

            name: fileName,

            status: 'done',

            url: url,

          };

        });

        setSelectedFiles(fileList);

      }

    }

    setFormKey(prev => prev + 1);

    setModalVisible(true);

  };







  const handleView = (record) => {

    setSelectedRecord(record);

    setViewModalVisible(true);



    // Reset audio state khi mở modal mới

    if (audioRef.current) {

      audioRef.current.pause();

      setIsAudioPlaying(false);

      setIsAudioLoading(false);

    }





  };



  const handleViewQuestionContent = (record) => {

    const questionContent = record.questionContent || record.quizContent || record.quizzContent;

    setSelectedQuestionContent(questionContent);

    setSelectedQuestionContentTitle(record.title || 'Không có tiêu đề');

    setSelectedQuestionContentRecord(record);

    setQuestionContentModalVisible(true);

  };



  const handleUpdateQuestionContent = async (newQuestionContent) => {

    if (!selectedQuestionContentRecord) return;



    try {

      await updateK9({

        id: selectedQuestionContentRecord.id,

        questionContent: newQuestionContent

      });



      message.success('Cập nhật thành công');



      // Update local data

      const updater = (list) => list.map(item =>

        item.id === selectedQuestionContentRecord.id

          ? { ...item, questionContent: newQuestionContent }

          : item

      );



      if (currentTab === 'report') {

        setAiSummaryData(prev => updater(prev));

      } else if (currentTab === 'reportDN') {

        setReportDNData(prev => updater(prev));

      } else {

        setAllData(prev => ({

          ...prev,

          [currentTab]: updater(prev[currentTab] || [])

        }));

        setFilteredData(prev => ({

          ...prev,

          [currentTab]: updater(prev[currentTab] || [])

        }));

        setData(prev => updater(prev));

      }



      // Close modal and reset states

      setQuestionContentModalVisible(false);

      setSelectedQuestionContent(null);

      setSelectedQuestionContentTitle('');

      setSelectedQuestionContentRecord(null);

    } catch (error) {

      console.error('Error updating question content:', error);

      message.error('Lỗi khi cập nhật: ' + error.message);

    }

  };



  const handleDelete = async (id) => {

    try {

      await deleteK9(id);

      // Update local state instead of reloading all data
      const updater = (list) => list.filter(item => item.id !== id);
      setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
      setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
      setData(prev => updater(prev));

      message.success('Xóa thành công');

    } catch (error) {

      message.error('Lỗi khi xóa: ' + error.message);

    }

  };



  // Bulk delete function

  const handleBulkDelete = async () => {

    if (selectedRowKeys.length === 0) {

      message.warning('Vui lòng chọn ít nhất một mục để xóa!');

      return;

    }



    Modal.confirm({

      title: 'Xác nhận xóa hàng loạt',

      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} mục đã chọn? Hành động này không thể hoàn tác.`,

      okText: 'Xóa',

      okType: 'danger',

      cancelText: 'Hủy',

      onOk: async () => {

        try {

          let successCount = 0;

          let errorCount = 0;



          for (const id of selectedRowKeys) {

            try {

              await deleteK9(id);

              successCount++;

            } catch (error) {

              console.error(`Error deleting item ${id}:`, error);

              errorCount++;

            }

          }



          // Update local state instead of reloading all data
          if (successCount > 0) {
            const updater = (list) => list.filter(item => !selectedRowKeys.includes(item.id));
            setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
            setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
            setData(prev => updater(prev));
          }

          setSelectedRowKeys([]);



          if (successCount > 0) {

            message.success(`Xóa thành công ${successCount} mục${errorCount > 0 ? `, ${errorCount} mục thất bại` : ''}!`);

          } else {

            message.error('Không thể xóa mục nào!');

          }

        } catch (error) {

          console.error('Error in bulk delete:', error);

          message.error('Lỗi khi xóa hàng loạt: ' + error.message);

        }

      }

    });

  };



  const handleModalOk = async () => {

    try {

      const values = form.getFieldsValue();

      // Debug logging

      console.log('Form values:', values);

      console.log('AudioText from state:', audioText);

      const contentType = modalMode === 'create' ? currentTab : selectedRecord?.type;

      // Extract filedLabel fields and remove them from recordData
      const filedLabel_1 = values.filedLabel_1 || '';
      const filedLabel_2 = values.filedLabel_2 || '';
      const { filedLabel_1: _, filedLabel_2: __, ...valuesWithoutFiledLabels } = values;

      let recordData = {

        ...valuesWithoutFiledLabels,

        type: contentType,

        status: values.status || 'draft',

        // Build info object with filedLabel fields
        info: {
          ...(selectedRecord?.info && (
            typeof selectedRecord.info === 'string'
              ? JSON.parse(selectedRecord.info)
              : selectedRecord.info
          )),
          filedLabel_1: filedLabel_1,
          filedLabel_2: filedLabel_2
        },

        ...(currentTab === 'caseTraining' && {

          tag1: values.tag1 || null,

          tag2: values.tag2 || null,

          tag3: values.tag3 || null,

          difficultyLevel: values.difficultyLevel || null,

          estimatedTime: values.estimatedTime || null,

          learningObjectives: values.learningObjectives || null,

          keywords: values.keywords || null

        }),

        ...(currentTab === 'home' && {

          priority: values.priority || 'medium',

          featured: values.featured || false,

          homeCategory: values.homeCategory || 'latest',

          displayOrder: values.displayOrder || 1

        })

      };

      if (contentType === 'story') {

        recordData.audioText = audioText;

        if (uploadedAudioUrl) {

          recordData.audioUrl = uploadedAudioUrl;

        }

      }

      if (contentType === 'library') {

        if (uploadedImageUrls.length > 0) {

          recordData.imgUrls = uploadedImageUrls;

        }

        if (uploadedVideoUrl) {

          recordData.videoUrl = uploadedVideoUrl;

        }

      } else if (contentType === 'news' || contentType === 'home' || contentType === 'longForm') {

        if (uploadedFileUrls.length > 0) {

          recordData.fileUrls = uploadedFileUrls;

        }

        if (uploadedImageUrls.length > 0) {

          recordData.imgUrls = uploadedImageUrls;

        }

        if (uploadedVideoUrl) {

          recordData.videoUrl = uploadedVideoUrl;

        }

      } else if (contentType === 'report') {

        if (uploadedFileUrls.length > 0) {

          recordData.fileUrls = uploadedFileUrls;

        }

      }


      // Add avatar and diagram URLs for all content types
      if (uploadedAvatarUrl) {
        recordData.avatarUrl = uploadedAvatarUrl;
      }
      if (uploadedDiagramUrl) {
        recordData.diagramUrl = uploadedDiagramUrl;
      }
      if (modalMode === 'create') {

        console.log('Record data before save:', recordData);

        const newRecord = await createK9(recordData);

        message.success('Tạo mới thành công');

        // Update local state instead of reloading all data
        if (newRecord) {
          const updater = (list) => [...(list || []), newRecord];
          setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
          setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
          setData(prev => updater(prev));
        }

      } else {

        const updatedRecord = {

          ...selectedRecord,

          ...recordData,

          fileUrls: uploadedFileUrls,

          imgUrls: uploadedImageUrls,

          videoUrl: uploadedVideoUrl,

          audioUrl: uploadedAudioUrl,

          avatarUrl: uploadedAvatarUrl,
          diagramUrl: uploadedDiagramUrl,
          // Ensure info is properly merged
          info: recordData.info
        };

        console.log('Updated record:', updatedRecord);

        await updateK9(updatedRecord);

        message.success('Cập nhật thành công');

        // Update local state instead of reloading all data
        const updater = (list) => list.map(item => item.id === updatedRecord.id ? updatedRecord : item);
        setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
        setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
        setData(prev => updater(prev));
      }

      setTableKey(prev => prev + 1);

      setModalVisible(false);

      form.resetFields();

      resetUploadStates();

      setCustomVoiceText('');

      setSelectedRecord(null);

      setAudioText('');

      setSelectedRowKeys([]); // Clear selection after save

      // Reset tag fields only for caseTraining

      if (currentTab === 'caseTraining') {

        form.setFieldsValue({

          tag1: undefined,

          tag2: undefined,

          tag3: undefined,

          difficultyLevel: undefined,

          estimatedTime: undefined,

          learningObjectives: undefined,

          keywords: undefined

        });

      }

      // Reset home fields

      if (currentTab === 'home') {

        form.setFieldsValue({

          priority: undefined,

          featured: false,

          homeCategory: undefined,

          displayOrder: undefined

        });

      }

      // Reset other fields

      setQuizContent('');

      setAudioFileList([]);

      setCustomVoiceText('');

    } catch (error) {

      console.error('Error saving data:', error);

      message.error('Lỗi khi lưu dữ liệu: ' + error.message);

    }

  };



  const handleModalCancel = () => {

    setModalVisible(false);

    form.resetFields();

    resetUploadStates();

    setCustomVoiceText('');

    setSelectedRecord(null);

    setAudioText('');

    // Reset tag fields only for caseTraining

    if (currentTab === 'caseTraining') {

      form.setFieldsValue({

        tag1: undefined,

        tag2: undefined,

        tag3: undefined,

        difficultyLevel: undefined,

        estimatedTime: undefined,

        learningObjectives: undefined,

        keywords: undefined

      });

    }

    // Reset other fields

    setQuizContent('');

    setAudioFileList([]);

    setCustomVoiceText('');

  };

  const getFormFields = () => {

    // Determine content type from selected record or current tab

    const contentType = modalMode === 'edit' && selectedRecord

      ? selectedRecord.type

      : currentTab;



    const fields = [];



    // Common fields for all types

    fields.push(

      <Form.Item key="title" name="title" label="Tiêu đề">

        <Input placeholder="Nhập tiêu đề" />

      </Form.Item>

    );

    // CID field

    fields.push(

      <Form.Item key="cid" name="cid" label="CID">

        <Input placeholder="Nhập CID" />

      </Form.Item>

    );



    // Category field

    let categoryOptions = [];

    if (contentType === 'news' || contentType === 'caseTraining' || contentType === 'longForm') {

      categoryOptions = categoriesOptions;

    } else if (contentType === 'library') {

      categoryOptions = [

        { value: 'Ý tưởng khởi nghiệp', label: 'Ý tưởng khởi nghiệp' },

        { value: 'Tips khởi nghiệp', label: 'Tips khởi nghiệp' },

        { value: 'Sáng tạo khác', label: 'Sáng tạo khác' }

      ];

    } else if (contentType === 'story') {

      categoryOptions = [

        { value: 'Podcast', label: 'Podcast' },

        { value: 'Bài viết', label: 'Bài viết' }

      ];

    }

    if (contentType === 'news' || contentType === 'home' || contentType === 'longForm') {

      fields.push(

        <Form.Item key="category" name="category" label="Danh mục">

          <Select placeholder="Chọn danh mục">

            {categoryOptions.map(option => (

              <Option key={option.value} value={option.value}>

                {option.label}

              </Option>

            ))}

          </Select>

        </Form.Item>

      );

    }



    fields.push(

      <Form.Item key="summary" name="summary" label="Tóm tắt">

        <TextArea
          placeholder="Nhập tóm tắt"
          autoSize={{ minRows: 2 }}
          style={{ resize: 'none' }}
        />
      </Form.Item>

    );



    fields.push(

      <Form.Item key="detail" name="detail" label="Chi tiết">

        <TextArea
          placeholder="Nhập chi tiết"
          autoSize={{ minRows: 3 }}
          style={{ resize: 'none' }}
        />
      </Form.Item>

    );

    // FiledLabel fields
    fields.push(
      <Form.Item key="filedLabel_1" name="filedLabel_1" label="Filed Label 1">
        <Input placeholder="Nhập filedLabel_1" />
      </Form.Item>
    );

    fields.push(
      <Form.Item key="filedLabel_2" name="filedLabel_2" label="Filed Label 2">
        <Input placeholder="Nhập filedLabel_2" />
      </Form.Item>
    );





    // Type-specific fields for news, caseTraining, longForm, and home

    if (contentType === 'news' || contentType === 'caseTraining' || contentType === 'longForm' || contentType === 'home') {

      // Sentiment field

      fields.push(

        <Form.Item key="sentiment" name="sentiment" label="Sentiment">

          <Select placeholder="Chọn sentiment">

            <Option value="positive">Tích cực</Option>

            <Option value="negative">Tiêu cực</Option>

            <Option value="neutral">Trung tính</Option>

          </Select>

        </Form.Item>

      );



      fields.push(



        <Form.Item key="tag4" name="tag4" label="Program">

          <Select placeholder="Chọn program" mode="multiple" allowClear>

            {tag4Options.map(option => (

              <Option key={option.value} value={option.value}>

                {option.label}

              </Option>

            ))}

          </Select>

        </Form.Item>

      );



      // Impact field

      fields.push(

        <Form.Item key="impact" name="impact" label="Tầm quan trọng">

          <Select placeholder="Chọn tầm quan trọng">

            <Option value="important">Quan trọng</Option>

            <Option value="normal">Bình thường</Option>

            <Option value="skip">Bỏ qua</Option>

          </Select>

        </Form.Item>

      );



      // Source field

      fields.push(

        <Form.Item key="source" name="source" label="Nguồn">

          <Input placeholder="Nguồn tin tức" />

        </Form.Item>

      );



      // Tag fields only for caseTraining

      if (currentTab === 'caseTraining') {

        // Tag1 field

        fields.push(

          <Form.Item key="tag1" name="tag1" label="Categories">

            <Select

              placeholder="Chọn category"

              allowClear

              showSearch

              filterOption={(input, option) =>

                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

              }

            >

              {tag1Options.map(option => (

                <Option key={option.value} value={option.value} label={option.label}>

                  {option.label}

                </Option>

              ))}

            </Select>

          </Form.Item>

        );



        // Tag2 field

        fields.push(

          <Form.Item key="tag2" name="tag2" label="Levels">

            <Select

              placeholder="Chọn level"

              allowClear

              showSearch

              filterOption={(input, option) =>

                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

              }

            >

              {tag2Options.map(option => (

                <Option key={option.value} value={option.value} label={option.label}>

                  {option.label}

                </Option>

              ))}

            </Select>

          </Form.Item>

        );



        // Tag3 field

        fields.push(

          <Form.Item key="tag3" name="tag3" label="Series">

            <Select

              placeholder="Chọn series"

              allowClear

              showSearch

              filterOption={(input, option) =>

                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

              }

            >

              {tag3Options.map(option => (

                <Option key={option.value} value={option.value} label={option.label}>

                  {option.label}

                </Option>

              ))}

            </Select>

          </Form.Item>

        );

      }



      // Special fields for home type

      if (currentTab === 'home') {

        // Priority field for home items

        fields.push(

          <Form.Item key="priority" name="priority" label="Độ ưu tiên">

            <Select placeholder="Chọn độ ưu tiên">

              <Option value="high">Cao</Option>

              <Option value="medium">Trung bình</Option>

              <Option value="low">Thấp</Option>

            </Select>

          </Form.Item>

        );



        // Featured field for home items

        fields.push(

          <Form.Item key="featured" name="featured" label="Nổi bật" valuePropName="checked">

            <Switch />

          </Form.Item>

        );



        // Home category field (different from main category)

        fields.push(

          <Form.Item key="homeCategory" name="homeCategory" label="Danh mục Home">

            <Select placeholder="Chọn danh mục Home">

              <Option value="featured">Nổi bật</Option>

              <Option value="trending">Xu hướng</Option>

              <Option value="recommended">Đề xuất</Option>

              <Option value="latest">Mới nhất</Option>

              <Option value="popular">Phổ biến</Option>

            </Select>

          </Form.Item>

        );



        // Display order field for home items

        fields.push(

          <Form.Item key="displayOrder" name="displayOrder" label="Thứ tự hiển thị">

            <InputNumber

              placeholder="Nhập số thứ tự"

              min={1}

              max={100}

              style={{ width: '100%' }}

            />

          </Form.Item>

        );

      }



      // Status field for news and caseTraining

      fields.push(

        <Form.Item key="status" name="status" label="Trạng thái">

          <Select placeholder="Chọn trạng thái">

            <Option value="draft">Bản nháp</Option>

            <Option value="published">Đã xuất bản</Option>

            <Option value="archived">Đã lưu trữ</Option>

          </Select>

        </Form.Item>

      );

      // Avatar upload field
      fields.push(
        <Form.Item key="avatarUrl" label="Avatar">
          <Upload
            listType="picture-card"
            fileList={selectedAvatar ? [selectedAvatar] : []}
            beforeUpload={() => false} // Prevent auto upload
            onChange={({ fileList }) => {
              if (fileList.length > 0) {
                handleAvatarUpload(fileList[0]);
              } else {
                handleAvatarUpload(null);
              }
            }}
            onRemove={() => {
              handleAvatarUpload(null);
            }}
            maxCount={1}
          >
            {selectedAvatar ? null : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload Avatar</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      );



      // Image upload field for news and caseTraining

      fields.push(

        <Form.Item key="images" label="Hình ảnh">

          <Upload

            listType="picture-card"

            fileList={selectedImages}

            multiple

            beforeUpload={() => false} // Prevent auto upload

            onChange={({ fileList }) => handleImageUpload(fileList)}

            onRemove={(file) => {

              // Khi remove, filter ra file đó khỏi list

              const newFileList = selectedImages.filter(item => item.uid !== file.uid);

              setSelectedImages(newFileList);



              // Cập nhật uploadedImageUrls để loại bỏ URL của file bị xóa

              if (file.url) {

                const newUrls = uploadedImageUrls.filter(url => url !== file.url);

                setUploadedImageUrls(newUrls);

              }



              return false; // Prevent default remove behavior

            }}

            accept="image/*"

            showUploadList={{

              showPreviewIcon: true,

              showRemoveIcon: true,

            }}

          >

            {selectedImages.length >= 8 ? null : (

              <div>

                <PlusOutlined />

                <div style={{ marginTop: 8 }}>Upload</div>

              </div>

            )}

          </Upload>

          {uploadingImages && (

            <Progress

              percent={uploadProgress.images}

              size="small"

              style={{ marginTop: 10 }}

            />

          )}

          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>

            Hỗ trợ: JPG, PNG, GIF. Tối đa 8 ảnh.

          </div>

        </Form.Item>

      );



      // Video upload field for news and caseTraining

      fields.push(

        <Form.Item key="video" label="Video">

          <Dragger

            fileList={selectedVideo ? [selectedVideo] : []}

            beforeUpload={() => false} // Prevent auto upload

            onChange={({ fileList }) => {

              if (fileList.length === 0) {

                handleVideoUpload(null);

              } else {

                const file = fileList[fileList.length - 1];

                handleVideoUpload(file);

              }

            }}

            onRemove={() => {

              setSelectedVideo(null);

              setUploadedVideoUrl('');

              return false; // Prevent default remove behavior

            }}

            accept="video/*"

            maxCount={1}

            showUploadList={{

              showPreviewIcon: true,

              showRemoveIcon: true,

            }}

          >

            <p className="ant-upload-drag-icon">

              <InboxOutlined />

            </p>

            <p className="ant-upload-text">Click hoặc kéo thả file video vào đây</p>

            <p className="ant-upload-hint">

              Hỗ trợ: MP4, WebM, OGG. Tối đa 1 video.

            </p>

          </Dragger>

          {uploadingVideo && (

            <Progress

              percent={uploadProgress.video}

              size="small"

              style={{ marginTop: 10 }}

            />

          )}

        </Form.Item>

      );



      // File upload field for news and caseTraining

      fields.push(

        <Form.Item key="files" label="File đính kèm">

          <Upload

            listType="text"

            fileList={selectedFiles}

            multiple

            beforeUpload={() => false} // Prevent auto upload

            onChange={({ fileList }) => handleFileUpload(fileList)}

            onRemove={(file) => {

              // Khi remove, filter ra file đó khỏi list

              const newFileList = selectedFiles.filter(item => item.uid !== file.uid);

              setSelectedFiles(newFileList);



              // Cập nhật uploadedFileUrls để loại bỏ URL của file bị xóa

              if (file.url) {

                const newUrls = uploadedFileUrls.filter(url => url !== file.url);

                setUploadedFileUrls(newUrls);

              }



              return false; // Prevent default remove behavior

            }}

            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"

            showUploadList={{

              showPreviewIcon: true,

              showRemoveIcon: true,

            }}

            maxCount={10}

          >

            <Button icon={<UploadOutlined />} disabled={selectedFiles.length >= 10}>

              Upload Files {selectedFiles.length > 0 ? `(${selectedFiles.length}/10)` : ''}

            </Button>

          </Upload>

          {uploadingFiles && (

            <Progress

              percent={uploadProgress.files}

              size="small"

              style={{ marginTop: 10 }}

            />

          )}

          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>

            Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR. Tối đa 10 file.

          </div>

        </Form.Item>

      );



      // Quiz content field for news and caseTraining

      fields.push(

        <Form.Item key="quizContent" name="quizContent" label="Nội dung Quiz">

          <TextArea

            rows={4}

            placeholder="Nhập nội dung quiz (JSON format)"

            value={quizContent}

            onChange={(e) => setQuizContent(e.target.value)}

          />

        </Form.Item>

      );



      // Background audio field for news and caseTraining

      fields.push(

        <Form.Item key="backgroundAudio" name="backgroundAudio" label="Âm thanh nền">

          <Upload

            accept="audio/*"

            maxCount={1}

            beforeUpload={() => false}

            onChange={({ fileList }) => {

              setAudioFileList(fileList);

            }}

            fileList={audioFileList}

          >

            <Button icon={<UploadOutlined />}>Tải lên âm thanh</Button>

          </Upload>

        </Form.Item>

      );



      // Custom voice text field for news and caseTraining

      fields.push(

        <Form.Item key="customVoiceText" name="customVoiceText" label="Văn bản tùy chỉnh cho Voice">

          <TextArea

            rows={3}

            placeholder="Nhập văn bản để tạo voice tùy chỉnh"

            value={customVoiceText}

            onChange={(e) => setCustomVoiceText(e.target.value)}

          />

        </Form.Item>

      );



      // AI Summary field for news and caseTraining

      fields.push(

        <Form.Item key="aiSummary" name="aiSummary" label="Tóm tắt AI">

          <TextArea

            rows={3}

            placeholder="Tóm tắt được tạo bởi AI"

            readOnly

          />

        </Form.Item>

      );



      // Keywords field for news and caseTraining

      fields.push(

        <Form.Item key="keywords" name="keywords" label="Từ khóa">

          <Select

            mode="tags"

            placeholder="Nhập từ khóa"

            style={{ width: '100%' }}

          />

        </Form.Item>

      );



      // Difficulty level field for caseTraining

      if (currentTab === 'caseTraining') {

        fields.push(

          <Form.Item key="difficultyLevel" name="difficultyLevel" label="Mức độ khó">

            <Select placeholder="Chọn mức độ khó">

              <Option value="beginner">Người mới bắt đầu</Option>

              <Option value="intermediate">Trung cấp</Option>

              <Option value="advanced">Nâng cao</Option>

              <Option value="expert">Chuyên gia</Option>

            </Select>

          </Form.Item>

        );



        fields.push(

          <Form.Item key="estimatedTime" name="estimatedTime" label="Thời gian ước tính">

            <Input placeholder="VD: 30 phút, 2 giờ" />

          </Form.Item>

        );



        fields.push(

          <Form.Item key="learningObjectives" name="learningObjectives" label="Mục tiêu học tập">

            <TextArea

              rows={3}

              placeholder="Nhập các mục tiêu học tập"

            />

          </Form.Item>

        );

      }

    } else if (contentType === 'library') {

      // fields.push(

      //   <Form.Item key="pages" name="pages" label="Số trang">

      //     <Input placeholder="VD: 45 trang" />

      //   </Form.Item>

      // );



      // Image upload field

      fields.push(

        <Form.Item key="images" label="Hình ảnh">

          <Upload

            listType="picture-card"

            fileList={selectedImages}

            multiple

            beforeUpload={() => false} // Prevent auto upload

            onChange={({ fileList }) => handleImageUpload(fileList)}

            onRemove={(file) => {

              // Khi remove, filter ra file đó khỏi list

              const newFileList = selectedImages.filter(item => item.uid !== file.uid);

              setSelectedImages(newFileList);



              // Cập nhật uploadedImageUrls để loại bỏ URL của file bị xóa

              if (file.url) {

                const newUrls = uploadedImageUrls.filter(url => url !== file.url);

                setUploadedImageUrls(newUrls);

              }



              return false; // Prevent default remove behavior

            }}

            accept="image/*"

            showUploadList={{

              showPreviewIcon: true,

              showRemoveIcon: true,

            }}

          >

            {selectedImages.length >= 8 ? null : (

              <div>

                <PlusOutlined />

                <div style={{ marginTop: 8 }}>Upload</div>

              </div>

            )}

          </Upload>

          {uploadingImages && (

            <Progress

              percent={uploadProgress.images}

              size="small"

              style={{ marginTop: 10 }}

            />

          )}

          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>

            Hỗ trợ: JPG, PNG, GIF. Tối đa 8 ảnh.

          </div>

        </Form.Item>

      );



      // Video upload field

      fields.push(

        <Form.Item key="video" label="Video">

          <Dragger

            fileList={selectedVideo ? [selectedVideo] : []}

            beforeUpload={() => false} // Prevent auto upload

            onChange={({ fileList }) => {

              if (fileList.length === 0) {

                handleVideoUpload(null);

              } else {

                const file = fileList[fileList.length - 1];

                handleVideoUpload(file);

              }

            }}

            onRemove={() => {

              setSelectedVideo(null);

              setUploadedVideoUrl('');

              return false; // Prevent default remove behavior

            }}

            accept="video/*"

            maxCount={1}

            showUploadList={{

              showPreviewIcon: false,

              showRemoveIcon: true,

            }}

          >

            <p className="ant-upload-drag-icon">

              <InboxOutlined />

            </p>

            <p className="ant-upload-text">

              Click hoặc kéo thả video vào đây để upload

            </p>

            <p className="ant-upload-hint">

              Hỗ trợ: MP4, AVI, MOV, WMV. Tối đa 1 video.

            </p>

          </Dragger>

          {uploadingVideo && (

            <Progress

              percent={uploadProgress.video}

              size="small"

              style={{ marginTop: 10 }}

            />

          )}

        </Form.Item>

      );





    } else if (contentType === 'report') {

      // File upload field for report

      fields.push(

        <Form.Item key="files" label="File đính kèm">

          <Upload

            listType="text"

            fileList={selectedFiles}

            multiple

            beforeUpload={() => false} // Prevent auto upload

            onChange={({ fileList }) => handleFileUpload(fileList)}

            onRemove={(file) => {

              // Khi remove, filter ra file đó khỏi list

              const newFileList = selectedFiles.filter(item => item.uid !== file.uid);

              setSelectedFiles(newFileList);



              // Cập nhật uploadedFileUrls để loại bỏ URL của file bị xóa

              if (file.url) {

                const newUrls = uploadedFileUrls.filter(url => url !== file.url);

                setUploadedFileUrls(newUrls);

              }



              return false; // Prevent default remove behavior

            }}

            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"

            showUploadList={{

              showPreviewIcon: true,

              showRemoveIcon: true,

            }}

            maxCount={10}

          >

            <Button icon={<UploadOutlined />} disabled={selectedFiles.length >= 10}>

              Upload Files {selectedFiles.length > 0 ? `(${selectedFiles.length}/10)` : ''}

            </Button>

          </Upload>

          {uploadingFiles && (

            <Progress

              percent={uploadProgress.files}

              size="small"

              style={{ marginTop: 10 }}

            />

          )}

          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>

            Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR. Tối đa 10 file.

          </div>

        </Form.Item>

      );

    } else if (contentType === 'story') {

      fields.push(

        <Form.Item key="duration" name="duration" label="Thời lượng">

          <Input placeholder="VD: 15 phút" />

        </Form.Item>

      );



      fields.push(

        <Form.Item key="storyType" name="storyType" label="Loại">

          <Select placeholder="Chọn loại">

            <Option value="Podcast">Podcast</Option>

            <Option value="Video Story">Video Story</Option>

            <Option value="Interview">Interview</Option>

            <Option value="Documentary">Documentary</Option>

          </Select>

        </Form.Item>

      );



      // Add audioText field for story type

      fields.push(

        <Form.Item

          key="audioText"

          name="audioText"

          label="Nội dung Voice"

          rules={[{ required: false, type: 'string' }]}

        >

          <TextArea

            rows={6}

            placeholder="Nhập nội dung để tạo voice cho story này..."

            showCount

            maxLength={50000}

            value={audioText}

            onChange={e => setAudioText(e.target.value)}

          />

          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>

            Nội dung này sẽ được sử dụng để tạo voice cho story. Tối đa 50000 ký tự.

          </div>

        </Form.Item>

      );



      // Audio upload or AI generation field

      fields.push(

        <Form.Item key="audio" label="Audio">

          {/* AI Voice Generation Section - Only show in edit mode */}

          {modalMode === 'edit' && (

            <div style={{

              marginBottom: '16px',

              padding: '16px',

              border: '1px dashed #d9d9d9',

              borderRadius: '6px',

              backgroundColor: '#fafafa'

            }}>

              <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#1890ff' }}>

                Tạo Voice bằng AI

              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

                <Button

                  type="primary"

                  icon={<SoundOutlined />}

                  onClick={() => {

                    // Thêm vào queue tạo voice từ audioText

                    if (!audioText) return;

                    if (selectedRecord) {

                      // Không cho phép thêm nếu đã có trong queue hoặc đang xử lý

                      if (

                        voiceQueue.find(task => task.recordId === selectedRecord.id) ||

                        (currentProcessing && currentProcessing.recordId === selectedRecord.id)

                      ) return;

                      addVoiceToQueue(

                        selectedRecord.id,

                        selectedRecord.title,

                        audioText,

                        'custom'

                      );

                    }

                  }}

                  disabled={

                    !audioText ||

                    (modalMode === 'edit' && selectedRecord &&

                      voiceQueue.find(task => task.recordId === selectedRecord.id)) ||

                    (modalMode === 'edit' && selectedRecord &&

                      currentProcessing && currentProcessing.recordId === selectedRecord.id)

                  }

                >

                  {modalMode === 'edit' && selectedRecord &&

                    voiceQueue.find(task => task.recordId === selectedRecord.id) ?

                    'Đã trong hàng đợi' :

                    modalMode === 'edit' && selectedRecord &&

                      currentProcessing && currentProcessing.recordId === selectedRecord.id ?

                      'Đang tạo voice...' :

                      'Thêm vào hàng đợi'}

                </Button>

                <span style={{ fontSize: '12px', color: '#666' }}>

                  Voice sẽ được thêm vào hàng đợi và tự động xử lý từ nội dung "Nội dung Voice" phía trên

                </span>

              </div>

            </div>

          )}



          <div style={{ marginBottom: '16px' }}>

            <Dragger

              fileList={selectedAudio ? [selectedAudio] : []}

              beforeUpload={() => false} // Prevent auto upload

              onChange={({ fileList }) => {

                if (fileList.length === 0) {

                  handleAudioUpload(null);

                } else {

                  const file = fileList[fileList.length - 1];

                  handleAudioUpload(file);

                }

              }}

              onRemove={() => {

                setSelectedAudio(null);

                setUploadedAudioUrl('');

                return false; // Prevent default remove behavior

              }}

              accept="audio/*"

              maxCount={1}

              showUploadList={{

                showPreviewIcon: false,

                showRemoveIcon: true,

              }}

            >

              <p className="ant-upload-drag-icon">

                <SoundOutlined />

              </p>

              <p className="ant-upload-text">

                Click hoặc kéo thả audio vào đây để upload

              </p>

              <p className="ant-upload-hint">

                Hỗ trợ: MP3, WAV, AAC, M4A. Hoặc có thể tạo bằng AI bên dưới.

              </p>

            </Dragger>

            {uploadingAudio && (

              <Progress

                percent={uploadProgress.audio}

                size="small"

                style={{ marginTop: 10 }}

              />

            )}

          </div>



          {/* Hidden field để lưu audioUrl vào form */}

          <Form.Item name="audioUrl" style={{ display: 'none' }}>

            <Input />

          </Form.Item>

        </Form.Item>

      );

    }

    // Status field (always last)

    fields.push(

      <Form.Item key="status" name="status" label="Trạng thái">

        <Select placeholder="Chọn trạng thái">

          <Option value="draft">Nháp</Option>

          <Option value="published">Đã xuất bản</Option>

          <Option value="archived">Lưu trữ</Option>

        </Select>

      </Form.Item>

    );



    return fields;

  };



  const tabOptions = [

    // { key: 'story', label: 'Podcast & Câu chuyện', count: allData.story?.length || 0 },

    { key: 'home', label: 'Home', count: allData.home?.length || 0 },

    { key: 'news', label: 'Learning Block', count: allData.news?.length || 0 },

    { key: 'caseTraining', label: 'Case Training', count: allData.caseTraining?.length || 0 },

    { key: 'longForm', label: 'Kho tài nguyên', count: allData.longForm?.length || 0 },

    // { key: 'report', label: 'Báo cáo ngành, Vĩ mô', count: aiSummaryData.length || 0 },

    // { key: 'reportDN', label: 'Báo cáo doanh nghiệp', count: reportDNData.length || 0 },

  ];



  // Bulk voice creation function - QUEUE VERSION

  const handleBulkCreateVoice = async () => {

    if (selectedRowKeys.length === 0) {

      message.warning('Vui lòng chọn ít nhất một story để tạo voice!');

      return;

    }



    // Lọc ra những story chưa có voice, thuộc loại story và có audioText

    const selectedStories = data.filter(item =>

      selectedRowKeys.includes(item.id) &&

      item.type === 'story' &&

      !item.audioUrl &&

      item.audioText

    );



    if (selectedStories.length === 0) {

      message.warning('Không có story nào được chọn hoặc tất cả đã có voice!');

      return;

    }



    // Kiểm tra và lọc ra những story chưa có trong queue

    const storiesNotInQueue = selectedStories.filter(story => {

      const existingTask = voiceQueue.find(task => task.recordId === story.id);

      const isProcessing = currentProcessing && currentProcessing.recordId === story.id;

      return !existingTask && !isProcessing;

    });



    if (storiesNotInQueue.length === 0) {

      message.warning('Tất cả story đã có trong hàng đợi hoặc đang được xử lý!');

      return;

    }



    let addedCount = 0;



    // Thêm tất cả vào queue

    storiesNotInQueue.forEach(story => {

      const content = story.audioText;

      if (content) {

        addVoiceToQueue(

          story.id,

          story.title,

          content,

          'bulk'

        );

        addedCount++;

      }

    });



    // Clear selection

    setSelectedRowKeys([]);



    if (addedCount > 0) {

      message.success(`📝 Đã thêm ${addedCount} story vào hàng đợi tạo voice!`);

    } else {

      message.warning('Không có story nào có audioText để tạo voice!');

    }

  };



  // Bulk voice creation from detail - for all tabs except story

  const handleBulkCreateVoiceFromDetail = async () => {

    if (selectedRowKeys.length === 0) {

      message.warning('Vui lòng chọn ít nhất một bản ghi để tạo voice!');

      return;

    }



    // Lọc ra những bản ghi chưa có voice và có detail

    const selectedRecords = data.filter(item =>

      selectedRowKeys.includes(item.id) &&

      !item.audioUrl &&

      item.detail

    );



    if (selectedRecords.length === 0) {

      message.warning('Tất cả bản ghi đã có voice!');

      return;

    }



    // Kiểm tra và lọc ra những bản ghi chưa có trong queue

    const recordsNotInQueue = selectedRecords.filter(record => {

      const existingTask = voiceQueue.find(task => task.recordId === record.id);

      const isProcessing = currentProcessing && currentProcessing.recordId === record.id;

      return !existingTask && !isProcessing;

    });



    if (recordsNotInQueue.length === 0) {

      message.warning('Tất cả bản ghi đã có trong hàng đợi hoặc đang được xử lý!');

      return;

    }



    let addedCount = 0;



    // Thêm tất cả vào queue

    recordsNotInQueue.forEach(record => {

      const content = record.detail;

      if (content) {

        addVoiceToQueue(

          record.id,

          record.title,

          content,

          'detail-bulk'

        );

        addedCount++;

      }

    });



    // Clear selection

    setSelectedRowKeys([]);



    if (addedCount > 0) {

      message.success(`📝 Đã thêm ${addedCount} bản ghi vào hàng đợi tạo voice từ detail!`);

    } else {

      message.warning('Không có bản ghi nào có detail để tạo voice!');

    }

  };

  // Bulk Summary Detail creation function - Queue version
  const handleBulkCreateSummaryDetail = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một bản ghi để tạo summaryDetail!');
      return;
    }

    if (!summaryDetailConfig.aiModel || !summaryDetailConfig.aiPrompt) {
      message.warning('Vui lòng cấu hình prompt tóm tắt detail trước!');
      setSummaryDetailConfigModalVisible(true);
      return;
    }

    // Lọc ra những bản ghi chưa có summaryDetail và có detail
    const selectedRecords = data.filter(item =>
      selectedRowKeys.includes(item.id) &&
      !item.summaryDetail &&
      item.detail
    );

    if (selectedRecords.length === 0) {
      message.warning('Tất cả bản ghi đã có summaryDetail hoặc không có detail!');
      return;
    }

    // Kiểm tra và lọc ra những bản ghi chưa có trong queue
    const recordsNotInQueue = selectedRecords.filter(record => {
      const existingTask = summaryDetailQueue.find(task => task.recordId === record.id);
      const isProcessing = currentSummaryDetailProcessing && currentSummaryDetailProcessing.recordId === record.id;
      return !existingTask && !isProcessing;
    });

    if (recordsNotInQueue.length === 0) {
      message.warning('Tất cả bản ghi đã có trong hàng đợi hoặc đang được xử lý!');
      return;
    }

    let addedCount = 0;

    // Thêm tất cả vào queue
    recordsNotInQueue.forEach(record => {
      addSummaryDetailToQueue(record.id, record.title);
      addedCount++;
    });

    // Clear selection
    setSelectedRowKeys([]);

    if (addedCount > 0) {
      message.success(`📝 Đã thêm ${addedCount} bản ghi vào hàng đợi tạo summaryDetail!`);
    }
  };

  // Bulk image creation function - QUEUE VERSION

  const handleBulkCreateImage = async () => {

    if (selectedRowKeys.length === 0) {

      const tabLabel = currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'item';

      message.warning(`Vui lòng chọn ít nhất một ${tabLabel} để tạo ảnh!`);

      return;

    }



    // Lọc ra những item chưa có avatarUrl và thuộc loại hiện tại

    const selectedItems = data.filter(item =>

      selectedRowKeys.includes(item.id) &&

      item.type === currentTab &&

      !item.avatarUrl

    );



    if (selectedItems.length === 0) {

      const tabLabel = currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'item';

      message.warning(`Không có ${tabLabel} nào được chọn hoặc tất cả đã có ảnh!`);

      return;

    }



    // Kiểm tra và lọc ra những item chưa có trong queue

    const itemsNotInQueue = selectedItems.filter(item => {

      const existingTask = imageGenerationQueue.find(task => task.recordId === item.id);

      const isProcessing = currentImageProcessing && currentImageProcessing.recordId === item.id;

      return !existingTask && !isProcessing;

    });



    if (itemsNotInQueue.length === 0) {

      const tabLabel = currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'item';

      message.warning(`Tất cả ${tabLabel} đã có trong hàng đợi hoặc đang được xử lý!`);

      return;

    }



    let addedCount = 0;



    // Thêm tất cả vào queue

    itemsNotInQueue.forEach(item => {

      if (item.summary) {

        addImageToQueue(item.id, item.title);

        addedCount++;

      }

    });



    // Clear selection

    setSelectedRowKeys([]);



    if (addedCount > 0) {

      const tabLabel = currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'item';

      message.success(`📝 Đã thêm ${addedCount} ${tabLabel} vào hàng đợi tạo ảnh!`);

    } else {

      const tabLabel = currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'item';

      message.warning(`Không có ${tabLabel} nào có tóm tắt để tạo ảnh!`);

    }

  };


  // Bulk diagram creation function - QUEUE VERSION
  const handleBulkCreateDiagram = async (mode = 'kroki') => {
    if (selectedRowKeys.length === 0) {
      const tabLabel = currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'item';
      message.warning(`Vui lòng chọn ít nhất một ${tabLabel} để tạo ${mode === 'html' ? 'HTML code' : 'diagram'}!`);
      return;
    }

    // Lọc ra những item chưa có diagram data và thuộc loại hiện tại
    const selectedItems = data.filter(item => {
      if (!selectedRowKeys.includes(item.id) || item.type !== currentTab) {
        return false;
      }

      // Check if already has diagram data of the SPECIFIC type we're creating
      if (mode === 'html') {
        // For HTML mode, only check HTML code
        const hasExistingHtmlCode = item.diagramHtmlCode && item.diagramHtmlCode.length > 0;
        if (hasExistingHtmlCode) {
          return false;
        }
      } else if (mode === 'excalidraw-react') {
        // For Excalidraw mode, only check Excalidraw JSON
        const hasExistingExcalidrawJson = item.diagramExcalidrawJson && item.diagramExcalidrawJson.length > 0;
        if (hasExistingExcalidrawJson) {
          return false;
        }
      } else {
        // For kroki mode, check all diagram types
        const hasExistingDiagram = item.diagramUrl && item.diagramUrl.length > 0;
        const hasExistingHtmlCode = item.diagramHtmlCode && item.diagramHtmlCode.length > 0;
        const hasExistingExcalidrawJson = item.diagramExcalidrawJson && item.diagramExcalidrawJson.length > 0;
        if (hasExistingDiagram || hasExistingHtmlCode || hasExistingExcalidrawJson) {
          return false;
        }
      }

      return true;
    });

    if (selectedItems.length === 0) {
      const tabLabel = currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'item';
      const modeText = mode === 'html' ? 'HTML code' : mode === 'excalidraw-react' ? 'Excalidraw diagram' : 'diagram';
      message.warning(`Không có ${tabLabel} nào được chọn hoặc tất cả đã có ${modeText}!`);
      return;
    }

    // Kiểm tra và lọc ra những item chưa có trong queue với cùng mode
    const itemsNotInQueue = selectedItems.filter(item => {
      // Check if there's a task with same recordId AND same mode
      const existingTask = diagramGenerationQueue.find(task => 
        task.recordId === item.id && task.mode === mode
      );
      // Check if currently processing with same recordId AND same mode
      const isProcessing = currentDiagramProcessing && 
        currentDiagramProcessing.recordId === item.id && 
        currentDiagramProcessing.mode === mode;
      return !existingTask && !isProcessing;
    });

    if (itemsNotInQueue.length === 0) {
      const tabLabel = currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'item';
      message.warning(`Tất cả ${tabLabel} đã có trong hàng đợi hoặc đang được xử lý!`);
      return;
    }

    // Lưu mode và records để dùng sau khi chọn prompt
    setPendingDiagramMode(mode);
    setPendingDiagramRecords(itemsNotInQueue);
    setSelectDiagramPromptModalVisible(true);
  };

  // Bulk: tạo Case Training từ Learning Block (news)
  const handleBulkCreateCaseFromLearningBlock = async () => {
    if (currentTab !== 'news') {
      message.warning('Chức năng này chỉ dùng trong tab Learning Block!');
      return;
    }

    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một Learning Block để tạo Case Training!');
      return;
    }

    // Chỉ lấy các bản ghi thuộc loại news (Learning Block)
    const selectedItems = data.filter(item =>
      selectedRowKeys.includes(item.id) &&
      item.type === 'news'
    );

    if (selectedItems.length === 0) {
      message.warning('Không có Learning Block hợp lệ nào được chọn!');
      return;
    }

    setPendingCaseFromLearningRecords(selectedItems);
    setSelectCaseFromLearningPromptModalVisible(true);
  };

  const handleDiagramPromptSelected = (prompt) => {
    setSelectDiagramPromptModalVisible(false);
    
    const mode = pendingDiagramMode;
    const itemsNotInQueue = pendingDiagramRecords;
    
    // If single record (not from bulk), use single handler
    if (itemsNotInQueue.length === 1 && selectedRowKeys.length === 0) {
      handleSingleDiagramPromptSelected(prompt);
      return;
    }
    
    let addedCount = 0;

    // Thêm tất cả vào queue với prompt đã chọn
    itemsNotInQueue.forEach(item => {
      if (item.detail) {
        addDiagramToQueue(item.id, item.title, mode, prompt);
        addedCount++;
      }
    });

    // Clear selection
    setSelectedRowKeys([]);
    setPendingDiagramMode(null);
    setPendingDiagramRecords([]);

    if (addedCount > 0) {
      const tabLabel = currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'item';
      message.success(`📝 Đã thêm ${addedCount} ${tabLabel} vào hàng đợi tạo ${mode === 'html' ? 'HTML code' : 'diagram'}!`);
    } else {
      const tabLabel = currentTab === 'news' ? 'news' : currentTab === 'caseTraining' ? 'case training' : currentTab === 'longForm' ? 'longForm' : 'item';
      message.warning(`Không có ${tabLabel} nào có nội dung detail để tạo ${mode === 'html' ? 'HTML code' : 'diagram'}!`);
    }
  };


  // Process Voice Queue

  const processVoiceQueue = async () => {

    if (voiceQueue.length === 0 || processingQueue) {

      return;

    }



    setProcessingQueue(true);



    const queue = [...voiceQueue];



    for (let i = 0; i < queue.length; i++) {

      const task = queue[i];

      setCurrentProcessing(task);



      // Remove from queue immediately

      setVoiceQueue(prev => prev.filter(item => item.id !== task.id));



      try {

        const aiGenResult = await generateText(
          task.content,
          voiceSettings.systemMessage,
          voiceSettings.textModel
        );

        const listeningContent = aiGenResult?.response || aiGenResult?.result || aiGenResult?.data || aiGenResult;

        // Gọi API để tạo voice
        const response = await generateAudio(
          listeningContent,
          '',
          voiceSettings.audioModel,
          voiceSettings.voiceType,
          'mp3',
          voiceSettings.speed,
        );

        const aiResult = response?.data


        if (aiResult && aiResult.audio_base64) {

          // Xử lý upload audio base64 lên cloud

          const contentType = aiResult.audio_format === 'mp3' ? 'audio/mpeg' : 'application/octet-stream';

          const base64 = cleanBase64(aiResult.audio_base64);

          const bytes = base64ToUint8Array(base64);

          const blob = new Blob([bytes], { type: contentType });

          const finalFileName = ensureFileNameWithExtension(`voice_${task.recordId}_${Date.now()}`, contentType);

          const fileObj = new File([blob], finalFileName, { type: contentType });



          try {

            const res = await uploadFiles([fileObj]);

            const url = res.files?.[0]?.fileUrl || res.files?.[0]?.url || '';



            // Lấy record mới nhất từ database

            const currentRecord = await getK9ById(task.recordId);



            // Cập nhật record với audioUrl và audioText

            const updatedRecord = {

              ...currentRecord,

              audioUrl: url,

              audioText: task.content

            };



            await updateK9(updatedRecord);

            // Update local state instead of reloading all data
            const updater = (list) => list.map(item => item.id === task.recordId ? updatedRecord : item);
            setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
            setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));
            setData(prev => updater(prev));
            setTableKey(prev => prev + 1);

            // Nếu đang edit record này trong modal, cập nhật modal

            if (modalVisible && selectedRecord && selectedRecord.id === task.recordId) {

              setSelectedRecord(updatedRecord);

              setUploadedAudioUrl(url);

              setSelectedAudio({

                uid: '-1',

                name: 'voice_audio',

                status: 'done',

                url: url,

              });

              form.setFieldValue('audioUrl', url);

            }



            message.success(`✅ Tạo voice thành công cho "${task.title}"!`);



          } catch (uploadError) {

            console.error(`Upload error for task ${task.id}:`, uploadError);

            message.error(`❌ Upload voice thất bại cho "${task.title}"!`);

          }

        } else {

          message.error(`❌ Không tạo được voice cho "${task.title}"!`);

        }

      } catch (error) {

        console.error(`Error creating voice for task ${task.id}:`, error);

        message.error(`❌ Lỗi khi tạo voice cho "${task.title}"!`);

      }



      // Delay giữa các task

      if (i < queue.length - 1) {

        await new Promise(resolve => setTimeout(resolve, 1000));

      }

    }



    setCurrentProcessing(null);

    setProcessingQueue(false);

  };

  // Stop a task from queue
  const handleStopVoiceTask = (taskId) => {
    // Remove from queue
    setVoiceQueue(prev => prev.filter(item => item.id !== taskId));

    message.success('Đã dừng task!');
  };

  // Add voice task to queue

  const addVoiceToQueue = (recordId, title, content, source = 'custom') => {

    const task = {

      id: `voice_${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

      recordId,

      title: title?.length > 50 ? title.substring(0, 50) + '...' : title,

      content,

      source, // 'custom', 'bulk', 'single'

      createdAt: new Date().toISOString()

    };



    setVoiceQueue(prev => [...prev, task]);

    message.success(`📝 Đã thêm "${task.title}" vào hàng đợi tạo voice!`);



    return task;

  };



  // Handle bulk delete avatar

  const handleBulkDeleteAvatar = async () => {

    if (selectedRowKeys.length === 0) {

      message.warning('Vui lòng chọn ít nhất một dòng để xóa avatar!');

      return;

    }



    try {

      setLoading(true);

      const updatePromises = selectedRowKeys.map(id =>

        updateK9({ id, avatarUrl: null })

      );



      await Promise.all(updatePromises);



      message.success(`Đã xóa avatar cho ${selectedRowKeys.length} dòng!`);

      setSelectedRowKeys([]);

      loadAllData(); // Reload data to reflect changes

    } catch (error) {

      console.error('Error deleting avatars:', error);

      message.error('Xóa avatar thất bại!');

    } finally {

      setLoading(false);

    }

  };


  // Handle bulk delete HTML diagram
  const handleBulkDeleteHtmlDiagram = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một dòng để xóa diagram HTML!');
      return;
    }

    try {
      setLoading(true);
      const updatePromises = selectedRowKeys.map(id =>
        updateK9({ id, diagramHtmlCode: null, diagramNote: null })
      );

      await Promise.all(updatePromises);

      message.success(`Đã xóa diagram HTML cho ${selectedRowKeys.length} dòng!`);
      setSelectedRowKeys([]);
      loadAllData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error deleting HTML diagrams:', error);
      message.error('Xóa diagram HTML thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk delete Excalidraw diagram
  const handleBulkDeleteExcalidrawDiagram = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một dòng để xóa diagram Excalidraw!');
      return;
    }

    try {
      setLoading(true);
      const updatePromises = selectedRowKeys.map(id =>
        updateK9({ id, diagramExcalidrawJson: null, diagramExcalidrawNote: null, diagramExcalidrawImageUrls: null })
      );

      await Promise.all(updatePromises);

      message.success(`Đã xóa diagram Excalidraw cho ${selectedRowKeys.length} dòng!`);
      setSelectedRowKeys([]);
      loadAllData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error deleting Excalidraw diagrams:', error);
      message.error('Xóa diagram Excalidraw thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk delete audio
  const handleBulkDeleteAudio = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một dòng để xóa audio!');
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        ids: selectedRowKeys,
        fieldToUpdate: 'audioUrl',
        value: null
      };
      await updateK9Bulk(updateData);

      message.success(`Đã xóa audio cho ${selectedRowKeys.length} dòng!`);
      setSelectedRowKeys([]);
      setAllData(prev => ({
        ...prev,
        [currentTab]: prev[currentTab].map(item =>
          selectedRowKeys.includes(item.id)
            ? { ...item, audioUrl: null } // chỉ xóa audio
            : item
        ),
      }));
    } catch (error) {
      console.error('Error deleting audio:', error);
      message.error('Xóa audio thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // Company Summary functions

  const handleCompanySummarySearch = async () => {

    if (!companySummarySearchTerm.trim()) {

      message.warning('Vui lòng nhập mã chứng khoán!');

      return;

    }



    setCompanySummaryLoading(true);

    try {

      // Load all necessary data

      const [companyReports, companyInfos, finRatios, finRatioNH, finRatioCK, finRatioBH] = await Promise.all([

        getAllCompanyReports(),

        getAllCompanyInfos(),

        getAllFinRatios(),

        getAllFinRatioNganhangs(),

        getAllFinRatioChungkhoans(),

        getAllFinRatioBaohiems()

      ]);



      const companyReportData = companyReports.map(item => item.data);

      const companyInfoData = companyInfos.map(item => item.data);

      const finRatioData = finRatios.map(item => item.data);

      const finRatioDataNH = finRatioNH.map(item => item.data);

      const finRatioDataCK = finRatioCK.map(item => item.data);

      const finRatioDataBH = finRatioBH.map(item => item.data);



      // Filter data for the search term

      const searchLower = companySummarySearchTerm.toLowerCase();



      // Filter company reports

      const filteredReports = companyReportData.filter(item => {

        try {

          const maCK = item['Mã CK'] || '';

          return maCK.toLowerCase().includes(searchLower);

        } catch {

          return false;

        }

      });



      // Filter financial ratios

      const allFinRatioData = [...finRatioData, ...finRatioDataNH, ...finRatioDataCK, ...finRatioDataBH];

      const filteredFinRatios = allFinRatioData.filter(item => {

        try {

          const maCK = item['Mã CK'] || '';

          return maCK.toLowerCase().includes(searchLower);

        } catch {

          return false;

        }

      });



      // Find company info

      const companyInfo = companyInfoData.find(item =>

        (item['Mã CK'] || '').toLowerCase() === searchLower

      );



      setCompanySummaryData({

        searchTerm: companySummarySearchTerm,

        companyInfo,

        valuationData: filteredReports,

        financialRatioData: filteredFinRatios,

        hasData: filteredReports.length > 0 || filteredFinRatios.length > 0

      });



    } catch (error) {

      console.error('Error loading company summary data:', error);

      message.error('Lỗi khi tải dữ liệu!');

    } finally {

      setCompanySummaryLoading(false);

    }

  };



  const handleCreateCompanySummaryReport = async () => {

    if (!companySummaryData || !companySummaryData.hasData) {

      message.warning('Không có dữ liệu để tạo tổng quan!');

      return;

    }



    // Add to queue instead of creating immediately

    const task = {

      id: `company_summary_${companySummaryData.searchTerm}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

      searchTerm: companySummaryData.searchTerm,

      data: companySummaryData,

      createdAt: new Date().toISOString()

    };



    setCompanySummaryQueue(prev => [...prev, task]);

    message.success(`📝 Đã thêm "${companySummaryData.searchTerm}" vào hàng đợi tạo tổng quan!`);



    // Close modal

    setCompanySummaryModalVisible(false);

    setCompanySummarySearchTerm('');

    setCompanySummaryData(null);

  };



  // Process company summary queue

  const processCompanySummaryQueue = async () => {

    if (processingCompanySummaryQueue || companySummaryQueue.length === 0) {

      return;

    }



    setProcessingCompanySummaryQueue(true);



    while (companySummaryQueue.length > 0) {

      const task = companySummaryQueue[0];

      setCurrentCompanySummaryProcessing(task);



      try {

        const analysisData = {

          searchTerm: task.data.searchTerm,

          companyInfo: task.data.companyInfo || null,

          valuationData: task.data.valuationData,

          financialRatioData: task.data.financialRatioData,

          industryComparisonData: []

        };



        const prompt = JSON.stringify(analysisData, null, 2);

        const systemMessage = `

Bạn sẽ nhận toàn bộ dữ liệu phân tích của một mã chứng khoán dưới dạng JSON bao gồm:

- Thông tin công ty (companyInfo): thông tin cơ bản về doanh nghiệp

- Dữ liệu định giá (valuationData): các báo cáo định giá từ các nguồn khác nhau

- Dữ liệu tỷ số tài chính (financialRatioData): các chỉ số tài chính qua các kỳ

- Dữ liệu so sánh cùng ngành (industryComparisonData): so sánh với các công ty cùng ngành



Hãy đọc và trả về kết quả theo định dạng sau:



[SUMMARY_SHORT]

(Viết đoạn tóm tắt ngắn, 7–10 câu, nêu mục tiêu hoặc nội dung chính của báo cáo phân tích, bao gồm thông tin cơ bản về công ty.)



[SUMMARY_DETAILED]

(Viết đoạn tổng quan chi tiết hơn, 15–20 câu, phân tích bối cảnh, cách tiếp cận và các kết luận chính, trả về dạng markdown. Sử dụng thông tin công ty để làm rõ bối cảnh phân tích.)



Chỉ trả về nội dung theo đúng định dạng trên, không thêm phần thừa. Đảm bảo giữ nguyên nhãn [SUMMARY_SHORT] và [SUMMARY_DETAILED].

`;



        const model = "google/gemini-2.5-pro";

        const response = await aiGen(prompt, systemMessage, model, 'text');

        console.log('AI Response:', response);



        if (response && response.result) {

          const resultText = response.result;



          const shortMatch = resultText.match(/\[SUMMARY_SHORT\]\s*\n([\s\S]*?)(?=\n\[SUMMARY_DETAILED\]|$)/);

          const summary1 = shortMatch ? shortMatch[1].trim() : '';



          const detailedMatch = resultText.match(/\[SUMMARY_DETAILED\]\s*\n([\s\S]*?)$/);

          const summary2 = detailedMatch ? detailedMatch[1].trim() : '';



          if (summary1 || summary2) {

            const aiSummaryData = {

              summary1: summary1 || null,

              summary2: summary2 || null,

              info: {

                title: 'Phân tích tổng quan ' + task.data.searchTerm,

                sheetName: 'CompanySummary',

                searchTerm: task.data.searchTerm,

                companyInfo: task.data.companyInfo ? true : false,

                valuationDataCount: task.data.valuationData.length,

                finalRatioDataCount: task.data.financialRatioData.length,

                industryComparisonCount: 0,

                dataType: 'CompanySummary'

              }

            };



            const savedSummary = await createAISummary(aiSummaryData);

            console.log('Saved to aiSummary table:', savedSummary);



            message.success(`✅ Tạo tổng quan cho ${task.data.searchTerm} hoàn thành!`);

          } else {

            message.warning(`⚠️ Tạo tổng quan cho ${task.data.searchTerm} hoàn thành nhưng không thể trích xuất nội dung tóm tắt`);

          }

        } else {

          message.warning(`⚠️ Tạo tổng quan cho ${task.data.searchTerm} hoàn thành nhưng không nhận được kết quả hợp lệ`);

        }

      } catch (error) {

        console.error('Lỗi khi tạo tổng quan:', error);

        message.error(`❌ Lỗi khi tạo tổng quan cho ${task.data.searchTerm}`);

      }



      // Remove completed task from queue

      setCompanySummaryQueue(prev => prev.slice(1));



      // Small delay between tasks

      await new Promise(resolve => setTimeout(resolve, 1000));

    }



    setProcessingCompanySummaryQueue(false);

    setCurrentCompanySummaryProcessing(null);



    // Refresh data after all tasks are completed

    loadAllData();

  };



  // Auto-process queue when it changes

  useEffect(() => {

    if (companySummaryQueue.length > 0 && !processingCompanySummaryQueue) {

      processCompanySummaryQueue();

    }

  }, [companySummaryQueue, processingCompanySummaryQueue]);







  return (

    <div className={styles.container}>

      <Card>

        <div className={styles.header}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

              <Button

                type="text"

                icon={<ArrowLeftOutlined />}

                onClick={handleBackToK9}

                className={styles.backButton}

              >

              </Button>

              <Tooltip title="Cài đặt Voice">

                <Button

                  type="text"

                  icon={<SoundOutlined />}

                  onClick={() => setVoiceSettingsVisible(true)}

                  style={{ color: '#52c41a' }}

                />

              </Tooltip>

              <Tooltip title={`Voice Queue (${voiceQueue.length + (currentProcessing ? 1 : 0)} tasks)`}>
                <Button
                  type="text"
                  icon={<InboxOutlined />}
                  onClick={() => setVoiceQueueModalVisible(true)}
                  style={{
                    color: '#1890ff',
                    position: 'relative'
                  }}
                >
                  {(voiceQueue.length > 0 || currentProcessing) && (
                    <Badge
                      count={voiceQueue.length + (currentProcessing ? 1 : 0)}
                      offset={[-8, 8]}
                      style={{ backgroundColor: '#52c41a' }}
                    />
                  )}
                </Button>
              </Tooltip>

              <Tooltip title="Cài đặt nhạc nền">

                <Button

                  type="text"

                  icon={<SettingOutlined />}

                  onClick={() => setBgAudioSettingsVisible(true)}

                  style={{ color: bgAudioSettings.enabled ? '#1890ff' : undefined }}

                />

              </Tooltip>

              <Tooltip title="Cài đặt Guideline">

                <Button

                  type="text"

                  icon={<FileTextOutlined />}

                  onClick={() => setGuidelineSettingsVisible(true)}

                  style={{ color: guidelineSettings.imageUrl || guidelineSettings.markdownText ? '#1890ff' : undefined }}

                />

              </Tooltip>

              {(currentTab === 'home' || currentTab === 'news' || currentTab === 'caseTraining' || currentTab === 'longForm') && (

                <>

                  <Tooltip title="Cấu hình tạo ảnh">

                    <Button

                      type="text"

                      icon={<PictureOutlined />}

                      onClick={() => setImageConfigModalVisible(true)}

                      style={{ color: '#1890ff' }}

                    />

                  </Tooltip>

                  <Tooltip title="Cấu hình tạo diagram">
                    <Button
                      type="text"
                      icon={<NodeIndexOutlined />}
                      onClick={() => setDiagramConfigModalVisible(true)}
                      style={{ color: '#1890ff' }}
                    />
                  </Tooltip>

                  <Tooltip title="Cấu hình tóm tắt Detail">
                    <Button
                      type="text"
                      icon={<ThunderboltOutlined />}
                      onClick={() => setSummaryDetailConfigModalVisible(true)}
                      style={{ color: '#722ed1' }}
                    />
                  </Tooltip>

                  <Tooltip title="Quản lý Tag">

                    <Button

                      type="text"

                      icon={<TagsOutlined />}

                      onClick={() => setTagManagementModalVisible(true)}

                      style={{ color: '#1890ff' }}

                    />

                  </Tooltip>

                  <Tooltip title="Quản lý Categories">

                    <Button

                      type="text"

                      icon={<AppstoreOutlined />}

                      onClick={() => setCategoriesManagementModalVisible(true)}

                      style={{ color: '#52c41a' }}

                    />

                  </Tooltip>

                  <Tooltip title="Quản lý Program">

                    <Button

                      type="text"

                      icon={<ThunderboltOutlined />}

                      onClick={() => setProgramManagementModalVisible(true)}

                      style={{ color: '#1890ff' }}

                    />

                  </Tooltip>


                  <Tooltip title="Cài đặt Prompt AI Update Quiz & Content">

                    <Button

                      type="text"

                      icon={<SettingOutlined />}

                      onClick={() => setPromptSettingsModalVisible(true)}

                      style={{ color: '#52c41a' }}

                    />

                  </Tooltip>

                  <Tooltip title="Cài đặt Prompt AI (Danh sách)">

                    <Button

                      type="text"

                      icon={<SettingOutlined />}

                      onClick={() => setPromptSettingsListModalVisible(true)}

                      style={{ color: '#fa8c16' }}

                    />

                  </Tooltip>

                </>

              )}

            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

              <AutoComplete

                placeholder="Tìm kiếm theo tiêu đề, tóm tắt, chi tiết..."

                value={searchText}

                onChange={(value) => handleLocalSearch(value)}

                onSearch={handleSearchSubmit}

                style={{ width: 250 }}

                allowClear

                loading={searchLoading}

                options={searchHistory[currentTab]?.map(term => ({

                  value: term,

                  label: (

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                      <HistoryOutlined style={{ color: '#999' }} />

                      <span>{term}</span>

                    </div>

                  )

                })) || []}

                onSelect={(value) => handleSearchSubmit(value)}

              />

              {processingImageQueue && (

                <div style={{

                  display: 'flex',

                  alignItems: 'center',

                  gap: 4,

                  padding: '4px 8px',

                  backgroundColor: '#e6f7ff',

                  borderRadius: '4px',

                  border: '1px solid #91d5ff'

                }}>

                  <LoadingOutlined style={{ color: '#1890ff' }} />

                  <span style={{ fontSize: '12px', color: '#1890ff' }}>

                    Đang tạo ảnh: {imageGenerationQueue.length + 1}

                  </span>

                </div>

              )}

              {processingDiagramQueue && (

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    backgroundColor: '#fff7e6',
                    borderRadius: '4px',
                    border: '1px solid #ffd591'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flex: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => setDiagramProgressModalVisible(true)}
                  >
                    <LoadingOutlined style={{ color: '#fa8c16' }} />
                    <span style={{ fontSize: '12px', color: '#fa8c16' }}>
                      Đang tạo: {currentDiagramProcessing?.title}
                      {diagramGenerationQueue.length > 0 && (
                        <span style={{ color: '#666', marginLeft: '4px' }}>
                          (+{diagramGenerationQueue.length} chờ)
                        </span>
                      )}
                    </span>
                  </div>
                  <Button
                    size="small"
                    danger
                    onClick={handleStopDiagramGeneration}
                    style={{ fontSize: '10px', height: '20px', padding: '0 6px' }}
                  >
                    Dừng
                  </Button>
                </div>

              )}

              {diagramGenerationResults.length > 0 && !processingDiagramQueue && (

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    backgroundColor: '#f6ffed',
                    borderRadius: '4px',
                    border: '1px solid #b7eb8f',
                    cursor: 'pointer'
                  }}
                  onClick={() => setDiagramProgressModalVisible(true)}
                >
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>
                    Hoàn thành: {diagramGenerationStats.success}/{diagramGenerationStats.total} {diagramGenerationStats.type === 'html' ? 'HTML code' : 'diagram'}

                    {diagramGenerationStats.failed > 0 && (
                      <span style={{ color: '#ff4d4f', marginLeft: '8px' }}>
                        ({diagramGenerationStats.failed} thất bại)
                      </span>
                    )}
                  </span>
                </div>

              )}

              {processingCaseFromLearningBlockQueue && (

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    backgroundColor: '#fff7e6',
                    borderRadius: '4px',
                    border: '1px solid #ffd591'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flex: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => setCaseFromLearningProgressModalVisible(true)}
                  >
                    <LoadingOutlined style={{ color: '#fa8c16' }} />
                    <span style={{ fontSize: '12px', color: '#fa8c16' }}>
                      Đang tạo Case: {currentCaseFromLearningBlockProcessing?.title}
                      {caseFromLearningBlockQueue.length > 0 && (
                        <span style={{ color: '#666', marginLeft: '4px' }}>
                          (+{caseFromLearningBlockQueue.length} chờ)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

              )}

              {caseFromLearningResults.length > 0 && !processingCaseFromLearningBlockQueue && (

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    backgroundColor: '#f6ffed',
                    borderRadius: '4px',
                    border: '1px solid #b7eb8f',
                    cursor: 'pointer'
                  }}
                  onClick={() => setCaseFromLearningProgressModalVisible(true)}
                >
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>
                    Hoàn thành Case: {caseFromLearningStats.success}/{caseFromLearningStats.total}
                    {caseFromLearningStats.failed > 0 && (
                      <span style={{ color: '#ff4d4f', marginLeft: '8px' }}>
                        ({caseFromLearningStats.failed} thất bại)
                      </span>
                    )}
                  </span>
                </div>

              )}

              {companySummaryQueue.length > 0 && (

                <div style={{

                  display: 'flex',

                  alignItems: 'center',

                  gap: 4,

                  padding: '4px 8px',

                  backgroundColor: '#f6ffed',

                  borderRadius: '4px',

                  border: '1px solid #b7eb8f'

                }}>

                  <LoadingOutlined style={{ color: '#52c41a' }} />

                  <span style={{ fontSize: '12px', color: '#52c41a' }}>

                    Đang tạo tổng quan: {currentCompanySummaryProcessing?.searchTerm} ({companySummaryQueue.length} bản ghi)

                  </span>

                </div>

              )}

            </div>

          </div>

          {/* Thanh menu các nút chức năng */}

          <Space style={{ flexWrap: 'wrap' }}>

            <Button

              type="primary"

              icon={<PlusOutlined />}

              onClick={handleCreate}

            >

            </Button>



            {(currentTab === 'news' || currentTab === 'report' || currentTab === 'reportDN') &&

              <Button

                icon={<ThunderboltOutlined />}

                onClick={handleEmbedingAll}

                loading={embeddingAllLoading}

                disabled={embeddingAllLoading}

              >

                {embeddingAllLoading

                  ? `Đang Embedding... (${embeddingProgress.current}/${embeddingProgress.total})`

                  : selectedRowKeys.length > 0

                    ? `Embedding selected (${selectedRowKeys.length})`

                    : 'Embedding all'

                }

              </Button>

            }

            {currentTab !== 'report' && currentTab !== 'reportDN' && (

              <>

                <Button

                  icon={<FileExcelOutlined />}

                  onClick={handleBulkImport}

                  style={{ color: '#52c41a', borderColor: '#52c41a' }}

                >

                  Import Excel

                </Button>

                <Button

                  icon={<FileExcelOutlined />}

                  onClick={handleJsonImport}

                  style={{ color: '#722ed1', borderColor: '#722ed1' }}

                >

                  Import JSON

                </Button>

              </>

            )}

            <Button

              icon={<SettingOutlined />}

              onClick={handleReportOverviewSettings}

              style={{ color: '#1890ff', borderColor: '#1890ff' }}

            >

              Cài đặt tổng quan

            </Button>

            {(currentTab === 'news' || currentTab === 'caseTraining') && (

              <>

                {/*<Button*/}

                {/*  type="primary"*/}

                {/*  onClick={handleGetFeed}*/}

                {/*  loading={loadingGetFeeds}*/}

                {/*>*/}

                {/*  Lấy tin mới*/}

                {/*</Button>*/}

                <Button

                  type="primary"

                  onClick={handleClassifyNews}

                  loading={loadingClassify}

                >

                  Phân loại AI

                </Button>



              </>

            )}

            {currentTab === 'reportDN' && (

              <Button

                type="primary"

                icon={<PlusOutlined />}

                onClick={handleCreateCompanySummary}

              >

                Tạo mới

              </Button>

            )}

            {selectedRowKeys.length > 0 && (

              <>

                <Button

                  danger

                  icon={<DeleteOutlined />}

                  onClick={handleBulkDelete}

                >

                  Xóa ({selectedRowKeys.length})

                </Button>

                <Button

                  type="primary"

                  icon={<CheckCircleOutlined />}

                  onClick={() => handleBulkToggleHasTitle(true)}

                  disabled={loading}

                >

                  Bật mục lục ({selectedRowKeys.length})

                </Button>

                <Button

                  onClick={() => handleBulkToggleHasTitle(false)}

                  disabled={loading}

                >

                  Tắt mục lục ({selectedRowKeys.length})

                </Button>

                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleBulkToggleIsPublic(true)}
                  disabled={loading}
                >
                  Bật Public ({selectedRowKeys.length})
                </Button>

                <Button
                  onClick={() => handleBulkToggleIsPublic(false)}
                  disabled={loading}
                >
                  Tắt Public ({selectedRowKeys.length})
                </Button>

                <Button
                  type="primary"
                  onClick={() => handleBulkToggleAllowRetake(true)}
                  disabled={loading}
                >
                  Bật làm lại Quiz ({selectedRowKeys.length})
                </Button>

                <Button
                  onClick={() => handleBulkToggleAllowRetake(false)}
                  disabled={loading}
                >
                  Tắt làm lại Quiz ({selectedRowKeys.length})
                </Button>

                <Button
                  icon={<TagsOutlined />}
                  onClick={() => {
                    // Nếu chỉ chọn 1 bản ghi, load allowed_user_class hiện tại
                    if (selectedRowKeys.length === 1) {
                      const selectedRecord = data.find(item => item.id === selectedRowKeys[0]);
                      const currentUserClasses = selectedRecord?.allowed_user_class || [];
                      setSelectedUserClasses(Array.isArray(currentUserClasses) ? currentUserClasses : []);
                    } else {
                      // Nếu nhiều bản ghi, reset về empty
                      setSelectedUserClasses([]);
                    }
                    setUserClassModalVisible(true);
                  }}
                  disabled={loading}
                >
                  Gán User Class ({selectedRowKeys.length})
                </Button>

                <Popconfirm
                  title="Xác nhận xóa user class"
                  description={`Bạn có chắc chắn muốn xóa user class cho ${selectedRowKeys.length} bản ghi đã chọn?`}
                  onConfirm={handleBulkClearUserClasses}
                  okText="Xác nhận"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={loading}
                  >
                    Clear User Class ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>

                {(currentTab === 'home' || currentTab === 'news' || currentTab === 'caseTraining' || currentTab === 'longForm') && (

                  <>
                    <Popconfirm
                      title="Xác nhận xóa avatar"
                      description={`Bạn có chắc chắn muốn xóa avatar cho ${selectedRowKeys.length} bản ghi đã chọn?`}
                      onConfirm={handleBulkDeleteAvatar}
                      okText="Xác nhận"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        danger
                        icon={<PictureOutlined />}
                        disabled={loading}
                      >
                        Xóa avatar ({selectedRowKeys.length})
                      </Button>
                    </Popconfirm>

                    <Popconfirm
                      title="Xác nhận xóa diagram HTML"
                      description={`Bạn có chắc chắn muốn xóa diagram HTML cho ${selectedRowKeys.length} bản ghi đã chọn?`}
                      onConfirm={handleBulkDeleteHtmlDiagram}
                      okText="Xác nhận"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        danger
                        icon={<FileTextOutlined />}
                        disabled={loading}
                        style={{ marginRight: '8px' }}
                      >
                        Xóa diagram HTML ({selectedRowKeys.length})
                      </Button>
                    </Popconfirm>
                    <Popconfirm
                      title="Xác nhận xóa diagram Excalidraw"
                      description={`Bạn có chắc chắn muốn xóa diagram Excalidraw cho ${selectedRowKeys.length} bản ghi đã chọn?`}
                      onConfirm={handleBulkDeleteExcalidrawDiagram}
                      okText="Xác nhận"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        danger
                        icon={<PictureOutlined />}
                        disabled={loading}
                      >
                        Xóa diagram Excalidraw ({selectedRowKeys.length})
                      </Button>
                    </Popconfirm>
                  </>
                )}

                <Popconfirm
                  title="Xác nhận xóa audio"
                  description={`Bạn có chắc chắn muốn xóa audio cho ${selectedRowKeys.length} bản ghi đã chọn?`}
                  onConfirm={handleBulkDeleteAudio}
                  okText="Xác nhận"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<SoundOutlined />}
                    disabled={loading}
                  >
                    Xóa audio ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>


                {currentTab === 'story' && (

                  <Button

                    type="primary"

                    icon={<ThunderboltOutlined />}

                    onClick={handleBulkCreateVoice}

                    disabled={processingQueue}

                  >

                    Thêm vào hàng đợi ({selectedRowKeys.length})

                  </Button>

                )}



                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleBulkCreateVoiceFromDetail}
                  disabled={processingQueue}
                >
                  Tạo voice từ detail ({selectedRowKeys.length})
                </Button>


                {(currentTab === 'home' || currentTab === 'news' || currentTab === 'caseTraining' || currentTab === 'longForm') && (

                  <>

                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      onClick={handleBulkCreateSummaryDetail}
                      disabled={processingSummaryDetailQueue}
                      style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                    >
                      Tạo Summary Detail ({selectedRowKeys.length})
                    </Button>

                    <Button

                      type="primary"

                      icon={<PictureOutlined />}

                      onClick={handleBulkCreateImage}

                      disabled={processingImageQueue}

                    >

                      Tạo ảnh ({selectedRowKeys.length})

                    </Button>

                    {currentTab === 'news' && (
                      <Space>
                        <Button
                          type="primary"
                          icon={<AppstoreOutlined />}
                          onClick={handleBulkCreateCaseFromLearningBlock}
                          disabled={processingCaseFromLearningBlockQueue}
                          loading={processingCaseFromLearningBlockQueue}
                        >
                          Tạo Case từ Learning Block ({selectedRowKeys.length})
                        </Button>
                        {/* <Button
                          type="default"
                          onClick={() => setCaseFromLearningProgressModalVisible(true)}
                        >
                          Xem tiến trình Case
                        </Button> */}
                      </Space>
                    )}

                    <Dropdown
                      menu={{
                        items: [
                     
                          {
                            key: 'html',
                            label: '💻 Tạo HTML code',
                            icon: <FileTextOutlined />,
                            onClick: () => handleBulkCreateDiagram('html')
                          },
                          {
                            key: 'excalidraw-react',
                            label: '🎨 Tạo Excalidraw React',
                            icon: <PictureOutlined />,
                            onClick: () => handleBulkCreateDiagram('excalidraw-react')
                          }
                        ]
                      }}
                      disabled={processingDiagramQueue}
                      trigger={['click']}
                    >
                      <Button
                        type="primary"
                        icon={<NodeIndexOutlined />}
                        disabled={processingDiagramQueue}
                      >
                        Tạo diagram ({selectedRowKeys.length}) <DownOutlined />
                      </Button>
                    </Dropdown>
                    <Button

                      disabled={false}

                      type="primary"

                      onClick={() => {

                        setShowImproveDetail(true)

                      }}

                    >

                      {improveDetailLoading ? <Spin size="small" className={styles.spinDotItem} /> : null}



                      Improve Detail ({selectedRowKeys.length})

                    </Button>

                    <Button

                      type="primary"

                      disabled={false}

                      onClick={() => {

                        if (selectedRowKeys.length === 0) {

                          message.warning('Vui lòng chọn ít nhất một bản ghi!');

                          return;

                        }

                        setShowCreateQuiz(true);

                      }}

                    // loading={createQuizzLoading}

                    >

                      {createQuizzLoading ? <Spin size="small" className={styles.spinDotItem} /> : null}

                      Create Quizz ({selectedRowKeys.length})

                    </Button>

                    {currentTab === 'caseTraining' && (
                      <>
                        <Button

                          type="primary"

                          disabled={false}

                          onClick={() => {

                            if (selectedRowKeys.length === 0) {

                              message.warning('Vui lòng chọn ít nhất một bản ghi!');

                              return;

                            }
                            setShowUpdateQuiz(true);
                          }}
                        >
                          Cập nhật Quiz & Nội dung theo CID ({selectedRowKeys.length})
                        </Button>
                      </>
                    )}
                    <Button

                      type="primary"

                      icon={<ThunderboltOutlined />}

                      onClick={handleEmbedingAll}

                      loading={embeddingAllLoading}

                      disabled={embeddingAllLoading}

                    >

                      {embeddingAllLoading

                        ? `Đang Embedding... (${embeddingProgress.current}/${embeddingProgress.total})`

                        : selectedRowKeys.length > 0

                          ? `Embedding selected (${selectedRowKeys.length})`

                          : 'Embedding all'

                      }

                    </Button>

                  </>

                )}

                {/* Bulk Update Buttons for different tabs */}

                {(currentTab === 'news' || currentTab === 'longForm' || currentTab === 'home' || currentTab === 'report' || currentTab === 'reportDN') && (

                  <>

                    <Button

                      type="primary"

                      disabled={false}

                      onClick={() => {

                        if (selectedRowKeys.length === 0) {

                          message.warning('Vui lòng chọn ít nhất một bản ghi!');

                          return;

                        }

                        handleBulkUpdate('category');

                      }}

                    >

                      {updateCategoryLoading ? <Spin size="small" className={styles.spinDotItem} /> : null}

                      Update Danh mục ({selectedRowKeys.length})

                    </Button>



                  </>

                )}



                {/* Special buttons for caseTraining tab */}

                {currentTab === 'caseTraining' && (

                  <>

                    <Button

                      type="primary"

                      disabled={false}

                      onClick={() => {

                        if (selectedRowKeys.length === 0) {

                          message.warning('Vui lòng chọn ít nhất một bản ghi!');

                          return;

                        }

                        handleBulkUpdate('tag1');

                      }}

                    >

                      Update Category ({selectedRowKeys.length})

                    </Button>

                    <Button

                      type="primary"

                      disabled={false}

                      onClick={() => {

                        if (selectedRowKeys.length === 0) {

                          message.warning('Vui lòng chọn ít nhất một bản ghi!');

                          return;

                        }

                        handleBulkUpdate('tag2');

                      }}

                    >

                      Update Level ({selectedRowKeys.length})

                    </Button>

                    <Button

                      type="primary"

                      disabled={false}

                      onClick={() => {

                        if (selectedRowKeys.length === 0) {

                          message.warning('Vui lòng chọn ít nhất một bản ghi!');

                          return;

                        }

                        handleBulkUpdate('tag3');

                      }}

                    >

                      Update Series ({selectedRowKeys.length})

                    </Button>



                  </>

                )}

              </>

            )}

            {
              selectedRowKeys.length > 0 && (
                <Button

                  type="primary"

                  disabled={false}

                  onClick={() => {

                    if (selectedRowKeys.length === 0) {

                      message.warning('Vui lòng chọn ít nhất một bản ghi!');

                      return;

                    }

                    handleBulkUpdate('tag4');

                  }}

                >

                  Update Program ({selectedRowKeys.length})

                </Button>

              )
            }

          </Space>

          {/* ... phần còn lại ... */}

        </div>



        <div className={styles.tabsContainer}>

          {tabOptions.map(tab => (

            <button

              key={tab.key}

              className={`${styles.tabButton} ${currentTab === tab.key ? styles.active : ''}`}

              onClick={() => handleTabChange(tab.key)}

            >

              {tab.label}

              <Badge count={tab.count} size="small" className={styles.tabBadge} />

            </button>

          ))}

        </div>



        {/* Filter section for home, news, caseTraining, and longForm tabs */}

        {(currentTab === 'home' || currentTab === 'news' || currentTab === 'caseTraining' || currentTab === 'longForm') && (

          <div style={{

            marginBottom: '16px',

            padding: '16px',

            backgroundColor: '#fafafa',

            borderRadius: '8px',

            border: '1px solid #e8e8e8'

          }}>

            <div style={{

              display: 'flex',

              alignItems: 'center',

              gap: '16px',

              flexWrap: 'wrap'

            }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Lọc theo:</span>

              </div>



              {/* Filter Count Display */}

              <div style={{

                display: 'flex',

                alignItems: 'center',

                gap: '8px',

                marginLeft: 'auto',

                fontSize: '12px',

                color: '#666'

              }}>

                <span>

                  Hiển thị {filteredData[currentTab]?.length || 0} / {allData[currentTab]?.length || 0} bản ghi

                </span>

              </div>



              {/* Category Filter */}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                {

                  currentTab !== 'caseTraining' && <>

                    <span style={{ fontSize: '14px' }}>Danh mục:</span>

                    <Select

                      value={categoryFilter}

                      onChange={(value) => handleCategoryFilterChange(value)}

                      style={{ width: 200 }}

                      placeholder="Chọn danh mục"

                    >


                      <Option value="">Trống</Option>

                      {categoriesOptions.map(option => (

                        <Option key={option.key} value={option.key}>

                          {option.label}

                        </Option>

                      ))}





                    </Select>

                  </>

                }



              </div>

              {/* Program Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>Program:</span>
                <Select
                  value={programFilter}
                  onChange={handleProgramFilterChange}
                  style={{ width: 200 }}
                  placeholder="Chọn program"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="">Trống</Option>
                  {programOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>



              {/* Image Filter */}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                <span style={{ fontSize: '14px' }}>Ảnh:</span>

                <Select

                  value={imageFilter}

                  onChange={handleImageFilterChange}

                  style={{ width: 120 }}

                  placeholder="Chọn trạng thái ảnh"

                >

                  <Option value="all">Tất cả</Option>

                  <Option value="has">Có ảnh</Option>

                  <Option value="no">Không có ảnh</Option>

                </Select>

              </div>

              {/* Voice Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>Voice:</span>
                <Select
                  value={voiceFilter}
                  onChange={handleVoiceFilterChange}
                  style={{
                    width: 150,
                  }}
                  className={styles.voiceFilter}
                  placeholder="Chọn trạng thái voice"
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="hasVoice">Có voice</Option>
                  <Option value="noVoice">Không có voice</Option>
                </Select>
              </div>

              {/* Diagram Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>Diagram:</span>
                <Select
                  value={diagramFilter}
                  onChange={handleDiagramFilterChange}
                  placeholder="Chọn loại diagram"
                  style={{ width: 180 }}
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="not_created">Chưa tạo</Option>
                  <Option value="html">Đã tạo bằng HTML</Option>
                  <Option value="excalidraw">Đã tạo bằng Excalidraw</Option>
                </Select>
              </div>


              {/* Quiz Filter */}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                <span style={{ fontSize: '14px' }}>Quiz:</span>

                <Select

                  value={quizFilter}

                  onChange={handleQuizFilterChange}

                  style={{ width: 120 }}

                  placeholder="Chọn trạng thái quiz"

                >

                  <Option value="all">Tất cả</Option>

                  <Option value="has">Có quiz</Option>

                  <Option value="no">Không có quiz</Option>

                </Select>

              </div>



              {/* Tag1 Filter - Only for caseTraining */}

              {currentTab === 'caseTraining' && (

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                  <span style={{ fontSize: '14px' }}>Categories:</span>

                  <Select

                    value={tag1Filter}

                    onChange={handleTag1FilterChange}

                    style={{ width: 150 }}

                    placeholder="Chọn category"

                  >

                    <Option value="all">Tất cả</Option>

                    {tag1Options.map(option => (

                      <Option key={option.value} value={option.value}>

                        {option.label}

                      </Option>

                    ))}

                  </Select>

                </div>

              )}



              {/* Tag2 Filter - Only for caseTraining */}

              {currentTab === 'caseTraining' && (

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                  <span style={{ fontSize: '14px' }}>Levels:</span>

                  <Select

                    value={tag2Filter}

                    onChange={handleTag2FilterChange}

                    style={{ width: 150 }}

                    placeholder="Chọn level"

                  >

                    <Option value="all">Tất cả</Option>

                    {tag2Options.map(option => (

                      <Option key={option.value} value={option.value}>

                        {option.label}

                      </Option>

                    ))}

                  </Select>

                </div>

              )}



              {/* Tag3 Filter - Only for caseTraining */}

              {currentTab === 'caseTraining' && (

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                  <span style={{ fontSize: '14px' }}>Series:</span>

                  <Select

                    value={tag3Filter}

                    onChange={handleTag3FilterChange}

                    style={{ width: 150 }}

                    placeholder="Chọn series"

                  >

                    <Option value="all">Tất cả</Option>

                    {tag3Options.map(option => (

                      <Option key={option.value} value={option.value}>

                        {option.label}

                      </Option>

                    ))}

                  </Select>

                </div>

              )}



              {/* Tag4 Filter (Program) - For all tabs */}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                <span style={{ fontSize: '14px' }}>Program:</span>

                <Select

                  mode="multiple"

                  value={tag4Filter}

                  onChange={handleTag4FilterChange}

                  style={{ width: 300 }}

                  placeholder="Chọn program"

                  maxTagCount="responsive"

                  showSearch

                  filterOption={(input, option) =>

                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

                  }

                >

                  {tag4Options.map(option => (

                    <Option key={option.value} value={option.value} label={option.label}>

                      {option.label}

                    </Option>

                  ))}

                </Select>

              </div>



              {/* Chapter Filter - For all tabs */}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                <span style={{ fontSize: '14px' }}>Số program:</span>

                <Select

                  value={chapterFilter}

                  onChange={handleChapterFilterChange}

                  style={{ width: 150 }}

                  placeholder="Chọn số program"

                >

                  <Option value="all">Tất cả</Option>

                  <Option value="has">Có program</Option>

                  <Option value="no">Không có program</Option>

                  <Option value="1">1 program</Option>

                  <Option value="2">2 programs</Option>

                  <Option value="3">3 programs</Option>

                  <Option value="4">4 programs</Option>

                  <Option value="5">5 programs</Option>

                  <Option value="6">6 programs</Option>

                  <Option value="7">7 programs</Option>
                  <Option value="8">8 programs</Option>
                  <Option value="9">9 programs</Option>
                  <Option value="10+">10+ programs</Option>

                </Select>

              </div>



              {/* Reset Filters Button */}

              <Button

                onClick={resetFilters}

                style={{ marginLeft: '8px' }}

                disabled={categoryFilter === 'all' && imageFilter === 'all' && diagramFilter === 'all' && quizFilter === 'all' && tag4Filter.length === 0 && chapterFilter === 'all' && programFilter === 'all' &&
                  (currentTab === 'caseTraining' ? (tag1Filter === 'all' && tag2Filter === 'all' && tag3Filter === 'all') : true) &&

                  !searchText.trim()}

              >

                Xóa bộ lọc

              </Button>







              {/* Active Filters Display */}

              {(categoryFilter !== 'all' || imageFilter !== 'all' || voiceFilter !== 'all' || diagramFilter !== 'all' || quizFilter !== 'all' || tag4Filter.length > 0 || chapterFilter !== 'all' ||
                (currentTab === 'caseTraining' && (tag1Filter !== 'all' || tag2Filter !== 'all' || tag3Filter !== 'all'))) && (

                  <div style={{

                    display: 'flex',

                    alignItems: 'center',

                    gap: '8px',

                    marginTop: '8px',

                    flexWrap: 'wrap'

                  }}>

                    <span style={{ fontSize: '12px', color: '#666' }}>Bộ lọc đang hoạt động:</span>

                    {categoryFilter !== 'all' && (

                      <Tag color="blue" closable onClose={() => handleCategoryFilterChange('all')}>

                        Danh mục: {categoryFilter}

                      </Tag>

                    )}

                    {imageFilter !== 'all' && (

                      <Tag color="green" closable onClose={() => handleImageFilterChange('all')}>

                        Ảnh: {imageFilter === 'has' ? 'Có ảnh' : 'Không có ảnh'}

                      </Tag>

                    )}

                    {voiceFilter !== 'all' && (

                      <Tag color="orange" closable onClose={() => handleVoiceFilterChange('all')}>

                        Voice: {voiceFilter === 'hasVoice' ? 'Có voice' : 'Không có voice'}

                      </Tag>

                    )}

                    {diagramFilter !== 'all' && (
                      <Tag color="purple" closable onClose={() => handleDiagramFilterChange('all')}>
                        Diagram: {
                          diagramFilter === 'not_created' ? 'Chưa tạo' :
                            diagramFilter === 'html' ? 'Đã tạo bằng HTML' :
                              diagramFilter === 'excalidraw' ? 'Đã tạo bằng Excalidraw' : ''
                        }
                      </Tag>
                    )}
                    {quizFilter !== 'all' && (

                      <Tag color="orange" closable onClose={() => handleQuizFilterChange('all')}>

                        Quiz: {quizFilter === 'has' ? 'Có quiz' : 'Không có quiz'}

                      </Tag>

                    )}

                    {tag4Filter.length > 0 && (

                      <Tag color="magenta" closable onClose={() => handleTag4FilterChange([])}>

                        Program: {tag4Filter.length} đã chọn

                      </Tag>

                    )}

                    {chapterFilter !== 'all' && (

                      <Tag color="geekblue" closable onClose={() => handleChapterFilterChange('all')}>

                        Số program: {

                          chapterFilter === 'has' ? 'Có program' :

                            chapterFilter === 'no' ? 'Không có program' :

                              chapterFilter === '1' ? '1 program' :

                                chapterFilter === '2' ? '2 programs' :

                                  chapterFilter === '3' ? '3 programs' :

                                    chapterFilter === '4+' ? '4+ programs' : ''

                        }

                      </Tag>

                    )}

                    {programFilter !== 'all' && (
                      <Tag color="lime" closable onClose={() => handleProgramFilterChange('all')}>
                        Program: {programFilter}
                      </Tag>
                    )}

                    {currentTab === 'caseTraining' && tag1Filter !== 'all' && (

                      <Tag color="purple" closable onClose={() => handleTag1FilterChange('all')}>

                        Categories: {tag1Filter}

                      </Tag>

                    )}

                    {currentTab === 'caseTraining' && tag2Filter !== 'all' && (

                      <Tag color="cyan" closable onClose={() => handleTag2FilterChange('all')}>

                        Levels: {tag2Filter}

                      </Tag>

                    )}

                    {currentTab === 'caseTraining' && tag3Filter !== 'all' && (

                      <Tag color="red" closable onClose={() => handleTag3FilterChange('all')}>

                        Series: {tag3Filter}

                      </Tag>

                    )}

                  </div>

                )}

            </div>

          </div>

        )}



        {/* Render different content based on current tab */}

        {currentTab === 'report' ? (

          <Table

            key="ai-summary-table"

            virtual

            columns={getAISummaryColumns()}

            dataSource={aiSummaryData}

            rowKey="id"

            loading={aiSummaryLoading}

            pagination={{

              total: aiSummaryData.length,

              pageSize: 500,

              showSizeChanger: true,

              showQuickJumper: true,

              showTotal: (total, range) =>

                `${range[0]}-${range[1]} của ${total} mục`

            }}

            scroll={{ x: 800, y: '60vh' }}

            className={styles.table}

            rowSelection={{

              type: 'checkbox',

              columnWidth: 48, // chỉnh size của cột checkbox

              selectedRowKeys,

              onChange: (newSelectedRowKeys) => {

                setSelectedRowKeys(newSelectedRowKeys);

              },

            }}

          />

        ) : currentTab === 'reportDN' ? (

          <Table

            key="report-dn-table"

            virtual

            columns={getAISummaryColumns()}

            dataSource={reportDNData}

            rowKey="id"

            loading={reportDNLoading}

            pagination={{

              total: reportDNData.length,

              pageSize: 500,

              showSizeChanger: true,

              showQuickJumper: true,

              showTotal: (total, range) =>

                `${range[0]}-${range[1]} của ${total} mục`

            }}

            scroll={{ x: 800, y: '60vh' }}

            className={styles.table}

            rowSelection={{

              type: 'checkbox',

              columnWidth: 48, // chỉnh size của cột checkbox

              selectedRowKeys,

              onChange: (newSelectedRowKeys) => {

                setSelectedRowKeys(newSelectedRowKeys);

              },

            }}

          />

        ) : (

          <Table

            key={tableKey}

            virtual

            columns={getColumns()}

            dataSource={data}

            rowKey="id"

            loading={loading}

            pagination={{

              total: data.length,

              pageSize: pageSize,

              pageSizeOptions: ['100', '500', '1000', '2000', '5000'],

              showSizeChanger: true,

              showQuickJumper: true,

              onShowSizeChange: (current, size) => {

                console.log('Page size changed to:', size);

                setPageSize(size);

              },

              showTotal: (total, range) =>

                `${range[0]}-${range[1]} của ${total} mục`

            }}

            scroll={{ x: 3000, y: '50vh' }}

            className={styles.table}

            rowSelection={{

              type: 'checkbox',

              columnWidth: 48, // chỉnh size của cột checkbox

              selectedRowKeys,

              onChange: (newSelectedRowKeys) => {

                setSelectedRowKeys(newSelectedRowKeys);

              },

            }}

          />

        )}

      </Card>



      {/* Create/Edit Modal */}

      {

        modalVisible && <CreateEditModal

          visible={modalVisible}

          onOk={handleModalOk}

          onCancel={handleModalCancel}

          modalMode={modalMode}

          formKey={formKey}

          form={form}

          getFormFields={getFormFields}

        />

      }





      {/* View Detail Modal */}

      {

        viewModalVisible && <ViewDetailModal

          visible={viewModalVisible}

          onCancel={() => {

            // Dừng audio khi đóng modal

            if (audioRef.current) {

              audioRef.current.pause();

              setIsAudioPlaying(false);

              setIsAudioLoading(false);

            }

            setViewModalVisible(false);

          }}

          selectedRecord={selectedRecord}

          isAudioPlaying={isAudioPlaying}

          isAudioLoading={isAudioLoading}

          handlePlayAudio={handlePlayAudio}

        />

      }





      {/* Import Excel Modal */}

      <ImportDataExcel
        handleImportExcel={handleImportExcel}

        importModalVisible={importModalVisible}

        setImportPreviewData={setImportPreviewData}

        setImportModalVisible={setImportModalVisible}

        importPreviewData={importPreviewData}

        uploadingImport={uploadingImport}

        handleConfirmImport={handleConfirmImport}

        handleDownloadTemplate={handleDownloadTemplate}

        currentTab={currentTab}

      />



      {/* Background Audio Settings Modal */}

      <BackgroundAudio

        visible={bgAudioSettingsVisible}

        onCancel={() => setBgAudioSettingsVisible(false)}

        onOk={saveBgAudioSettings}

        bgAudioSettings={bgAudioSettings}

        setBgAudioSettings={setBgAudioSettings}

        bgAudioFile={bgAudioFile}

        bgAudioUploading={bgAudioUploading}

        handleBackgroundAudioUpload={handleBackgroundAudioUpload}

      />



      {/* Guideline Settings Modal */}

      <GuidelineSettingModal

        visible={guidelineSettingsVisible}

        onCancel={() => setGuidelineSettingsVisible(false)}

        onOk={saveGuidelineSettings}

        guidelineSettings={guidelineSettings}

        setGuidelineSettings={setGuidelineSettings}

        guidelineImageFile={guidelineImageFile}

        guidelineImageUploading={guidelineImageUploading}

        handleGuidelineImageUpload={handleGuidelineImageUpload}

      />



      {/* JSON Import Modal */}

      {

        jsonImportModalVisible && <ImportDataJson

          setJsonInput={setJsonInput}

          setJsonPreviewData={setJsonPreviewData}

          jsonImportModalVisible={jsonImportModalVisible}

          setJsonImportModalVisible={setJsonImportModalVisible}

          jsonInput={jsonInput}

          jsonPreviewData={jsonPreviewData}

          uploadingJson={uploadingJson}

          currentTab={currentTab}

          handleJsonInputChange={handleJsonInputChange}

          handleJsonPreview={handleJsonPreview}

          handleConfirmJsonImport={handleConfirmJsonImport}

          handleLoadJsonTemplate={handleLoadJsonTemplate}

        />

      }





      {/* AI Summary Modal */}

      {

        aiSummaryModalVisible && <AISummaryTable

          aiSummaryModalVisible={aiSummaryModalVisible}

          setAiSummaryModalVisible={setAiSummaryModalVisible}

          aiSummaryData={aiSummaryData}

          aiSummaryLoading={aiSummaryLoading}

          getAISummaryColumns={getAISummaryColumns}

          setSelectedAISummary={setSelectedAISummary}

          setAISummaryDetailModalVisible={setAISummaryDetailModalVisible}

        />

      }





      {/* AI Summary Detail Modal */}

      {

        aiSummaryDetailModalVisible && <AISummaryDetailModal

          visible={aiSummaryDetailModalVisible}

          onCancel={() => setAISummaryDetailModalVisible(false)}

          selectedAISummary={selectedAISummary}

        />

      }



      {/* AI Summary Edit Modal */}

      {

        aiSummaryEditModalVisible && <AISummaryEditModal

          visible={aiSummaryEditModalVisible}

          onCancel={() => {

            setAISummaryEditModalVisible(false);

            setSelectedAISummary(null);

            aiSummaryEditForm.resetFields();

            setTables([]); // Reset tables when closing modal

            setUploadedFileUrls([]); // Reset file URLs

            setSelectedFiles([]); // Reset selected files

          }}

          onOk={handleUpdateAISummary}

          aiSummaryEditForm={aiSummaryEditForm}

          selectedFiles={selectedFiles}

          uploadingFiles={uploadingFiles}

          uploadProgress={uploadProgress}

          tables={tables}

          handleFileUpload={handleFileUpload}

          handleAddTable={handleAddTable}

          handleEditTable={handleEditTable}

          handleDeleteTable={handleDeleteTable}

        />

      }





      {imageConfigModalVisible &&

        <CreateConfigImage

          imageConfigModalVisible={imageConfigModalVisible}

          setImageConfigModalVisible={setImageConfigModalVisible}

          imageConfig={imageConfig}

          setImageConfig={setImageConfig}

          saveImageConfig={saveImageConfig}

        />

      }







      {/* Table Edit Modal */}

      {

        tableModalVisible && <TableEditModal

          visible={tableModalVisible}

          onCancel={() => {

            setTableModalVisible(false);

            setEditingTable(null);

          }}

          editingTable={editingTable}

          onSave={handleSaveTable}

          generateTableDataStructure={generateTableDataStructure}

        />

      }



      {/* Report Overview Modal */}

      {

        reportOverviewModalVisible && <ReportOverviewModal

          visible={reportOverviewModalVisible}

          onCancel={() => setReportOverviewModalVisible(false)}

          onSave={handleReportOverviewSave}

          currentOverview={reportOverviewData}

        />

      }





      {/* Company Summary Modal */}

      {

        companySummaryModalVisible && <CreateCompanyOverview

          companySummaryModalVisible={companySummaryModalVisible}

          setCompanySummaryModalVisible={setCompanySummaryModalVisible}

          companySummarySearchTerm={companySummarySearchTerm}

          setCompanySummarySearchTerm={setCompanySummarySearchTerm}

          companySummaryLoading={companySummaryLoading}

          companySummaryData={companySummaryData}

          handleCompanySummarySearch={handleCompanySummarySearch}

          handleCreateCompanySummaryReport={handleCreateCompanySummaryReport}

        />

      }



      <ImproveDetailModal

        visible={showImproveDetail}

        onCancel={() => setShowImproveDetail(false)}

        selectedRecords={

          currentTab === 'report'

            ? aiSummaryData.filter(item => selectedRowKeys.includes(item.id))

            : currentTab === 'reportDN'

              ? reportDNData.filter(item => selectedRowKeys.includes(item.id))

              : data.filter(item => selectedRowKeys.includes(item.id))

        }

        onSuccess={(updatedRecords = []) => {

          // Cập nhật cục bộ chỉ các phần tử đã thay đổi

          if (Array.isArray(updatedRecords) && updatedRecords.length > 0) {

            if (currentTab === 'report') {

              setAiSummaryData(prev => prev.map(item => {

                const u = updatedRecords.find(r => r.id === item.id);

                return u ? { ...item, ...u } : item;

              }));

            } else if (currentTab === 'reportDN') {

              setReportDNData(prev => prev.map(item => {

                const u = updatedRecords.find(r => r.id === item.id);

                return u ? { ...item, ...u } : item;

              }));

            } else {

              // news/library/story dataset

              setAllData(prev => ({

                ...prev,

                [currentTab]: (prev[currentTab] || []).map(item => {

                  const u = updatedRecords.find(r => r.id === item.id);

                  return u ? { ...item, ...u } : item;

                })

              }));

              setFilteredData(prev => ({

                ...prev,

                [currentTab]: (prev[currentTab] || []).map(item => {

                  const u = updatedRecords.find(r => r.id === item.id);

                  return u ? { ...item, ...u } : item;

                })

              }));

              setData(prev => prev.map(item => {

                const u = updatedRecords.find(r => r.id === item.id);

                return u ? { ...item, ...u } : item;

              }));

            }

          }

          setShowImproveDetail(false);

          setImproveDetailLoading(false);

          setSelectedRowKeys([]);

        }}

        setImproveDetailLoading={setImproveDetailLoading}

      />



      <CreateQuizModal

        visible={showCreateQuiz}

        onCancel={() => setShowCreateQuiz(false)}

        selectedRecords={

          currentTab === 'report'

            ? aiSummaryData.filter(item => selectedRowKeys.includes(item.id))

            : currentTab === 'reportDN'

              ? reportDNData.filter(item => selectedRowKeys.includes(item.id))

              : data.filter(item => selectedRowKeys.includes(item.id))

        }

        setCreateQuizzLoading={setCreateQuizzLoading}

        onSuccess={(updatedRecords = []) => {

          if (Array.isArray(updatedRecords) && updatedRecords.length > 0) {

            if (currentTab === 'report') {

              setAiSummaryData(prev => prev.map(item => {

                const u = updatedRecords.find(r => r.id === item.id);

                return u ? { ...item, ...u } : item;

              }));

            } else if (currentTab === 'reportDN') {

              setReportDNData(prev => prev.map(item => {

                const u = updatedRecords.find(r => r.id === item.id);

                return u ? { ...item, ...u } : item;

              }));

            } else {

              setAllData(prev => ({

                ...prev,

                [currentTab]: (prev[currentTab] || []).map(item => {

                  const u = updatedRecords.find(r => r.id === item.id);

                  return u ? { ...item, ...u } : item;

                })

              }));

              setFilteredData(prev => ({

                ...prev,

                [currentTab]: (prev[currentTab] || []).map(item => {

                  const u = updatedRecords.find(r => r.id === item.id);

                  return u ? { ...item, ...u } : item;

                })

              }));

              setData(prev => prev.map(item => {

                const u = updatedRecords.find(r => r.id === item.id);

                return u ? { ...item, ...u } : item;

              }));

            }

          }

          setShowCreateQuiz(false);

          setCreateQuizzLoading(false);

          setSelectedRowKeys([]);

        }}

      />

      <UpdateQuizContentModal
        visible={showUpdateQuiz}
        onCancel={() => setShowUpdateQuiz(false)}
        selectedRowKeys={selectedRowKeys}
        data={data}
        onUpdate={async (recordsData) => {
          try {
            console.log('Updating quiz and content for:', recordsData);

            // Cập nhật data trong state
            if (recordsData) {
              await updateK9({
                id: recordsData.id,
                title: recordsData.title,
                summary: recordsData.summary,
                detail: recordsData.detail,
                questionContent: recordsData.questionContent
              });
              // Cập nhật trong data chính
              setData(prev => prev.map(item =>
                item.id === recordsData.id
                  ? { ...item, ...recordsData }
                  : item
              ));

              // Cập nhật trong filteredData nếu có
              setFilteredData(prev => ({
                ...prev,
                [currentTab]: (prev[currentTab] || []).map(item =>
                  item.id === recordsData.id
                    ? { ...item, ...recordsData }
                    : item
                )
              }));

              console.log(`Successfully updated record ${recordsData.id}`);
            }
          } catch (error) {
            console.error('Error updating record:', error);
            throw error;
          }
        }}
      />

      {/* Prompt Settings Modal */}
      <PromptSettingsModal
        visible={promptSettingsModalVisible}
        onCancel={() => setPromptSettingsModalVisible(false)}
        onSuccess={(settings) => {
          console.log('Prompt settings updated:', settings);
          message.success('Cài đặt prompt đã được cập nhật!');
        }}
      />

      <PromptSettingsListModal
        visible={promptSettingsListModalVisible}
        onCancel={() => setPromptSettingsListModalVisible(false)}
        onSuccess={() => {
          message.success('Cài đặt prompt danh sách đã được cập nhật!');
        }}
      />

      <SelectPromptModal
        visible={selectDiagramPromptModalVisible}
        onCancel={() => {
          setSelectDiagramPromptModalVisible(false);
          setPendingDiagramMode(null);
          setPendingDiagramRecords([]);
        }}
        onSelect={handleDiagramPromptSelected}
        promptType={pendingDiagramMode === 'html' ? 'HTML_FROM_DETAIL_PROMPTS' : pendingDiagramMode === 'excalidraw-react' ? 'EXCALIDRAW_REACT_PROMPTS' : null}
        title={pendingDiagramMode === 'html' ? 'Chọn cài đặt Prompt - HTML từ Detail' : pendingDiagramMode === 'excalidraw-react' ? 'Chọn cài đặt Prompt - Excalidraw React' : 'Chọn cài đặt Prompt'}
      />

      <SelectPromptModal
        visible={selectCaseFromLearningPromptModalVisible}
        onCancel={() => {
          setSelectCaseFromLearningPromptModalVisible(false);
          setPendingCaseFromLearningRecords([]);
        }}
        onSelect={handleCaseFromLearningPromptSelected}
        promptType="CASE_FROM_LEARNING_BLOCK_PROMPTS"
        title="Chọn cài đặt Prompt - Tạo Case từ Learning Block"
      />

      {/* User Class Modal */}
      <Modal
        title={`Gán User Class cho ${selectedRowKeys.length} bản ghi`}
        open={userClassModalVisible}
        onCancel={() => {
          setUserClassModalVisible(false);
          setSelectedUserClasses([]);
        }}
        onOk={handleBulkUpdateUserClasses}
        okText="Cập nhật"
        cancelText="Hủy"
        width={600}
        loading={loading}
      >
        <div style={{ marginTop: 20 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              mode="multiple"
              placeholder="Chọn nhóm user class"
              value={selectedUserClasses}
              onChange={setSelectedUserClasses}
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
              allowClear
            >
              {userClasses.map(cls => (
                <Option key={cls.id} value={cls.id}>
                  {cls.name || `Class #${cls.id}`}
                </Option>
              ))}
            </Select>
            <div style={{ fontSize: '12px', color: '#999', marginTop: 8 }}>
              Chọn các nhóm user class được phép xem. Để trống nếu muốn xóa giới hạn.
            </div>
          </Space>
        </div>
      </Modal>

      {/* Tag Management Modal */}

      {

        tagManagementModalVisible && (

          <TagManagementModal

            visible={tagManagementModalVisible}

            onClose={() => setTagManagementModalVisible(false)}

            tag1Options={tag1Options}

            tag2Options={tag2Options}

            tag3Options={tag3Options}

            onSave={saveTagOptions}

          />

        )

      }

      {/* Categories Management Modal */}

      {

        categoriesManagementModalVisible && (

          <CategoriesManagementModal

            visible={categoriesManagementModalVisible}

            onClose={() => setCategoriesManagementModalVisible(false)}

            categoriesOptions={categoriesOptions}

            onSave={saveCategoriesOptions}

          />

        )

      }



      {

        programManagementModalVisible && (

          <TagProgramModal

            visible={programManagementModalVisible}

            onClose={() => setProgramManagementModalVisible(false)}

            tag4Options={tag4Options}

            onSave={handleSaveTags}

          />

        )

      }





      {

        quizEditorVisible && <QuizEditorModal

          visible={quizEditorVisible}

          onCancel={() => { setQuizEditorVisible(false); setQuizEditorRecord(null); }}

          record={quizEditorRecord}

          confirmLoading={savingQuiz}

          onSave={async (questionContent) => {

            if (!quizEditorRecord) return;

            try {

              setSavingQuiz(true);

              await updateK9({ id: quizEditorRecord.id, questionContent });

              message.success('Lưu quiz/essay thành công');

              // Update local datasets

              const updater = (list) => list.map(item => item.id === quizEditorRecord.id ? { ...item, questionContent } : item);

              if (currentTab === 'report') {

                setAiSummaryData(prev => updater(prev));

              } else if (currentTab === 'reportDN') {

                setReportDNData(prev => updater(prev));

              } else {

                setAllData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));

                setFilteredData(prev => ({ ...prev, [currentTab]: updater(prev[currentTab] || []) }));

                setData(prev => updater(prev));

              }

              setQuizEditorVisible(false);

              setQuizEditorRecord(null);

            } catch (e) {

              console.error(e);

              message.error('Lưu quiz/essay thất bại');

            } finally {

              setSavingQuiz(false);

            }

          }}

        />

      }



      {/* QuestionContent Modal */}

      {

        questionContentModalVisible && <QuestionContentModal

          visible={questionContentModalVisible}

          onCancel={() => {

            setQuestionContentModalVisible(false);

            setSelectedQuestionContent(null);

            setSelectedQuestionContentTitle('');

            setSelectedQuestionContentRecord(null);

          }}

          questionContent={selectedQuestionContent}

          recordTitle={selectedQuestionContentTitle}

          onUpdateQuestionContent={handleUpdateQuestionContent}

        />

      }



      {/* Bulk Update Modal */}

      <BulkUpdateModal

        visible={bulkUpdateModalVisible}

        onClose={() => setBulkUpdateModalVisible(false)}

        selectedIds={selectedRowKeys}

        fieldToUpdate={fieldToUpdate}

        currentTab={currentTab}

        onSuccess={handleBulkUpdateSuccess}

        categoryOptions={categoriesOptions}

        tagOptions={tag1Options}

        levelOptions={tag2Options}

        seriesOptions={tag3Options}

        programOptions={programOptions}

        setUpdateCategoryLoading={setUpdateCategoryLoading}

      />



      {/* Diagram Config Modal */}
      <CreateConfigDiagram
        diagramConfigModalVisible={diagramConfigModalVisible}
        setDiagramConfigModalVisible={setDiagramConfigModalVisible}
        diagramConfig={diagramConfig}
        setDiagramConfig={setDiagramConfig}
        saveDiagramConfig={saveDiagramConfig}
      />

      {/* Summary Detail Config Modal */}
      <CreateConfigSummaryDetail
        summaryDetailConfigModalVisible={summaryDetailConfigModalVisible}
        setSummaryDetailConfigModalVisible={setSummaryDetailConfigModalVisible}
        summaryDetailConfig={summaryDetailConfig}
        setSummaryDetailConfig={setSummaryDetailConfig}
        saveSummaryDetailConfig={saveSummaryDetailConfig}
      />

      {/* Diagram Preview Modal */}
      {
        diagramPreviewModalVisible && (
          <DiagramPreviewModal
            visible={diagramPreviewModalVisible}
            onClose={() => setDiagramPreviewModalVisible(false)}
            diagramData={selectedDiagramData}
            onSave={handleDiagramSave}
          />
        )
      }

      {/* Diagram Progress Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Tiến trình tạo {
              diagramGenerationStats.type === 'html' ? 'HTML Code' : 
              diagramGenerationStats.type === 'excalidraw-react' ? 'Excalidraw React' : 
              'Diagram'
            }</span>
          </div>
        }
        open={diagramProgressModalVisible}
        onCancel={() => setDiagramProgressModalVisible(false)}
        footer={[
          processingDiagramQueue && (
            <Button
              key="stop"
              danger
              onClick={handleStopDiagramGeneration}
              style={{ marginRight: '8px' }}
            >
              Dừng quá trình
            </Button>
          ),
          <Button key="close" onClick={() => setDiagramProgressModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {diagramGenerationStats.total}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Tổng số</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {diagramGenerationStats.success}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Thành công</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px', backgroundColor: '#fff2f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {diagramGenerationStats.failed}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Thất bại</div>
            </div>
          </div>

          {processingDiagramQueue && currentDiagramProcessing && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fff7e6',
              borderRadius: '6px',
              border: '1px solid #ffd591',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <LoadingOutlined style={{ color: '#fa8c16' }} />
                <span style={{ fontWeight: 'bold' }}>Đang xử lý:</span>
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {currentDiagramProcessing.title}
              </div>
            </div>
          )}

        </div>

        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>Danh sách tất cả task:</div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>

            {/* Task đang xử lý */}
            {processingDiagramQueue && currentDiagramProcessing && (
              <div
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  backgroundColor: '#fff7e6',
                  border: '1px solid #ffd591'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <LoadingOutlined style={{ color: '#fa8c16' }} />
                  <span style={{ fontWeight: 'bold' }}>Đang xử lý: {currentDiagramProcessing.title}</span>
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: currentDiagramProcessing.mode === 'html' ? '#e6f7ff' : '#fff7e6',
                    color: currentDiagramProcessing.mode === 'html' ? '#1890ff' : '#fa8c16'
                  }}>
                    {currentDiagramProcessing.mode === 'html' ? 'HTML' : 'Kroki'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Đang tạo {currentDiagramProcessing.mode === 'html' ? 'HTML code' : 'diagram'}...
                </div>
              </div>
            )}

            {/* Tasks trong queue */}
            {diagramGenerationQueue.map((task, index) => (
              <div
                key={task.id}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #d9d9d9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#e6f7ff',
                    color: '#1890ff',
                    fontWeight: 'bold'
                  }}>
                    #{index + 1}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>Chờ xử lý: {task.title}</span>
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: task.mode === 'html' ? '#e6f7ff' : '#fff7e6',
                    color: task.mode === 'html' ? '#1890ff' : '#fa8c16'
                  }}>
                    {task.mode === 'html' ? 'HTML' : 'Kroki'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Sẽ tạo {task.mode === 'html' ? 'HTML code' : 'diagram'} sau khi hoàn thành task trước
                </div>
              </div>
            ))}

            {/* Kết quả đã hoàn thành */}
            {diagramGenerationResults.length > 0 && (
              <>
                <div style={{
                  fontWeight: 'bold',
                  marginTop: '16px',
                  marginBottom: '12px',
                  padding: '8px',
                  backgroundColor: '#f6ffed',
                  borderRadius: '4px',
                  border: '1px solid #b7eb8f'
                }}>
                  ✅ Kết quả đã hoàn thành ({diagramGenerationResults.length}):
                </div>
                {diagramGenerationResults.map((result, index) => (
                  <div
                    key={result.id}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      borderRadius: '6px',
                      backgroundColor: result.status === 'success' ? '#f6ffed' : '#fff2f0',
                      border: `1px solid ${result.status === 'success' ? '#b7eb8f' : '#ffccc7'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {result.status === 'success' ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <span style={{ color: '#ff4d4f' }}>❌</span>
                      )}
                      <span style={{ fontWeight: 'bold' }}>✅ Hoàn thành: {result.title}</span>
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: result.type === 'html' ? '#e6f7ff' : '#fff7e6',
                        color: result.type === 'html' ? '#1890ff' : '#fa8c16'
                      }}>
                        {result.type === 'html' ? 'HTML' : 'Kroki'}
                      </span>
                    </div>
                    {result.status === 'success' ? (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Tạo thành công {result.count} {result.type === 'html' ? 'HTML code' : 'diagram'}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
                        Lỗi: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Case From Learning Block Progress Modal */}
      <Modal
        title="Tiến trình tạo Case Training từ Learning Block"
        open={caseFromLearningProgressModalVisible}
        onCancel={() => setCaseFromLearningProgressModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCaseFromLearningProgressModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {caseFromLearningStats.total}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Tổng số Case dự kiến</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {caseFromLearningStats.success}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Tạo thành công</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px', backgroundColor: '#fff2f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {caseFromLearningStats.failed}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Thất bại</div>
            </div>
          </div>
          {processingCaseFromLearningBlockQueue && (
            <div style={{ marginBottom: '12px' }}>
              <Spin size="small" />{' '}
              <span style={{ marginLeft: 8 }}>Đang xử lý: {currentCaseFromLearningBlockProcessing?.title || '...'}</span>
            </div>
          )}
        </div>
        <div style={{ maxHeight: '400px', overflowY: 'auto', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
          {caseFromLearningResults.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999' }}>Chưa có bản ghi nào được xử lý.</div>
          ) : (
            <Table
              size="small"
              pagination={false}
              rowKey="id"
              dataSource={caseFromLearningResults}
              columns={[
                {
                  title: 'ID',
                  dataIndex: 'recordId',
                  key: 'recordId',
                  width: 80
                },
                {
                  title: 'Tiêu đề',
                  dataIndex: 'title',
                  key: 'title',
                  render: (text) => <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: 400 }}>{text}</span>
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'status',
                  key: 'status',
                  width: 120,
                  render: (status) => {
                    if (status === 'success') {
                      return <Tag color="green">Thành công</Tag>;
                    }
                    if (status === 'failed') {
                      return <Tag color="red">Thất bại</Tag>;
                    }
                    return <Tag>Khác</Tag>;
                  }
                },
                {
                  title: 'Lỗi',
                  dataIndex: 'error',
                  key: 'error',
                  render: (error) => error ? <span style={{ color: '#ff4d4f' }}>{error}</span> : null
                }
              ]}
            />
          )}
        </div>
      </Modal>

      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        visible={voiceSettingsVisible}
        onCancel={() => setVoiceSettingsVisible(false)}
        settings={voiceSettings}
        onSave={(updatedSettings) => {
          setVoiceSettings(updatedSettings);
          saveVoiceSettings(updatedSettings);
        }}
      />

      {/* Voice Queue Modal */}
      <VoiceQueueModal
        visible={voiceQueueModalVisible}
        onCancel={() => setVoiceQueueModalVisible(false)}
        voiceQueue={voiceQueue}
        currentProcessing={currentProcessing}
        onStopTask={handleStopVoiceTask}
      />
    </div>

  );

};



export default K9Management;