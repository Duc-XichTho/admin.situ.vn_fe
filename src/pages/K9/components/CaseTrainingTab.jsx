import {
  FilterOutlined,
  SearchOutlined,
  CloseOutlined,
  MenuOutlined,
  LockOutlined,
  EditOutlined,
  LeftOutlined,
  RightOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Menu } from 'lucide-react';
import { Customize_Icon, Document_Icon, FeedBack_Icon, Expand_Icon, Close_Icon } from '../../../icon/IconSvg.jsx';

import {
  Button,
  Empty,
  Image,
  Input,
  Modal,
  Popover,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Pagination
} from 'antd';
import React, { useEffect, useState, useRef, useContext, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { getSettingByType } from '../../../apis/settingService';
import { getSettingByTypePublic } from '../../../apis/public/publicService.jsx';
import { getListQuestionHistoryByUser } from '../../../apis/questionHistoryService.jsx';
import { getCurrentUserLogin } from '../../../apis/userService';
import { getAllUserClass } from '../../../apis/userClassService';
import { MyContext } from '../../../MyContext';
import styles from './CaseTrainingTab.module.css';
import newsTabStyles from './NewsTab.module.css';
import QuizComponent from './QuizComponent.jsx';
import { IconButton } from '@mui/material';
import { InfoMore_Icon } from '../../../icon/IconSvg.jsx';
import { getK9ById, getK9ByCidType } from '../../../apis/k9Service.jsx';
import { getK9ByIdPublic, getK9ByCidTypePublic } from '../../../apis/public/publicService.jsx';

import ShareButton from './ShareButton.jsx';
import PreviewFileModal from '../../../components/PreviewFile/PreviewFileModal';
import AccessDenied from './AccessDenied.jsx';
import AudioPlayer from '../../../components/AudioPlayer/AudioPlayer.jsx';
import EditDetailModal from './EditDetailModal.jsx';
import FeedbackModal from './FeedbackModal.jsx';
import PaymentModal from '../../../components/PaymentModal/PaymentModal';
import ExcalidrawViewer from '../../K9Management/components/ExcalidrawViewer';
import CaseTrainingContentPanel from './CaseTrainingContentPanel.jsx';
const { Option } = Select;
const { Text, Title } = Typography;
import { useNavigate } from 'react-router-dom';
const CaseTrainingTab = ({
  setExpandedItem,
  updateURL,
  selectedProgram,
  tag4Filter,
  loading,
  filteredCaseTraining,
  filters,
  expandedItem,
  showDetailId,
  onFilterChange,
  onSearchChange,
  onItemClick,
  onShowDetail,
  onOpenSource,
  activeTab,
  totalCount,
  caseTrainingItems,
  tag1Options: propTag1Options,
  tag2Options: propTag2Options,
  tag3Options: propTag3Options,
  onShare,
  showSearchSection = true,
  viewMode = 'list',
  getTabDisplayName // Function to get tab display name from parent
}) => {
  const { currentUser } = useContext(MyContext);

  // Configure marked with katex extension
  marked.use(markedKatex({
    throwOnError: false,
    strict: false,
    trust: true
  }));


  // Hàm xử lý LaTeX trước khi parse với marked
  const preprocessLatex = (text) => {
    if (!text) return text;

    // Thay thế $$...$$ bằng placeholder để tránh double processing
    let processedText = text;
    const latexBlocks = [];

    // Tìm và thay thế display math ($$...$$)
    processedText = processedText.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
      const placeholder = `LATEX_DISPLAY_${latexBlocks.length}`;
      latexBlocks.push({ placeholder, formula, display: true });
      return placeholder;
    });

    // Tìm và thay thế inline math ($...$)
    processedText = processedText.replace(/\$([^$]+)\$/g, (match, formula) => {
      const placeholder = `LATEX_INLINE_${latexBlocks.length}`;
      latexBlocks.push({ placeholder, formula, display: false });
      return placeholder;
    });

    return { processedText, latexBlocks };
  };

  // Hàm khôi phục LaTeX sau khi parse với marked
  const postprocessLatex = (html, latexBlocks) => {
    if (!latexBlocks || latexBlocks.length === 0) return html;

    let result = html;

    // Replace ngược lại: từ placeholder về LaTeX đã render
    latexBlocks.forEach(({ placeholder, formula, display }, index) => {
      try {
        const renderedLatex = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: display,
          strict: false,
          trust: true
        });

        // Tìm và replace tất cả các phiên bản của placeholder (có thể bị marked escape)
        result = result.replace(new RegExp(placeholder, 'g'), renderedLatex);
      } catch (error) {
        console.warn('LaTeX rendering error:', error);
        // Giữ nguyên placeholder nếu có lỗi
      }
    });

    return result;
  };

  const [userClasses, setUserClasses] = useState([]);
  const [localFilters, setLocalFilters] = useState({
    tag1: [],
    tag2: [],
    tag3: [],
    search: '',
    impact: 'all',
    quizStatus: 'all'
  });

  // Feedback modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Package purchase modal states
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null); // Track which dropdown is open
  const [showHoverPopup, setShowHoverPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [hoveredItemId, setHoveredItemId] = useState(null);

  // State for CID source info
  const [cidSourceInfo, setCidSourceInfo] = useState(null);

  // Local state for tag options
  const [tag1Options, setTag1Options] = useState([]);
  const [tag2Options, setTag2Options] = useState([]);
  const [tag3Options, setTag3Options] = useState([]);
  // Quiz score state
  const [quizScores, setQuizScores] = useState({});

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const contentPanelRef = useRef(null);
  const markdownContentRef = useRef(null);

  // File preview modal states
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // SummaryDetail collapse state
  const [showSummaryDetail, setShowSummaryDetail] = useState(false);

  // DetailImageUrls gallery state - track selected main image for each item
  const [selectedDetailImageIndex, setSelectedDetailImageIndex] = useState({}); // { itemId: index }

  // State for category expansion
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Table of Contents sidebar states
  const [showTOCSidebar, setShowTOCSidebar] = useState(false);
  const [headings, setHeadings] = useState([]);
  const [activeHeadingIndex, setActiveHeadingIndex] = useState(-1);

  // Infinite scroll states
  const [visibleItems, setVisibleItems] = useState([]);
  const [renderedCount, setRenderedCount] = useState(20);

  // Search in content states
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showSearchResultsPanel, setShowSearchResultsPanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 10, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  // Persist filters for CaseTraining
  const CASE_FILTERS_KEY = 'k9_case_training_filters_v1';

  const fetchUserData = async () => {
    try {
      const user = (await getCurrentUserLogin()).data;

      // Fetch all quiz histories for this user and build score map
      if (user && user.id) {
        try {
          const histories = await getListQuestionHistoryByUser({ where: { user_id: user.id } });
          if (Array.isArray(histories?.data)) {
            const map = histories?.data?.reduce((acc, h) => {
              const qid = h.question_id ?? h.questionId ?? h.idQuestion;
              if (!qid) return acc;
              const prev = acc[qid];
              // Choose the latest by updated_at/created_at
              const currTime = new Date(h.updated_at || h.created_at || 0).getTime();
              const prevTime = prev ? new Date(prev.updated_at || prev.created_at || 0).getTime() : -1;
              if (!prev || currTime >= prevTime) {
                acc[qid] = h;
              }
              return acc;
            }, {});
            const scoreMap = Object.fromEntries(
              Object.entries(map).map(([qid, hist]) => {
                const raw = hist.score;
                const num = typeof raw === 'number' ? raw : parseFloat(raw);
                return [qid, isNaN(num) ? undefined : num];
              })
            );
            setQuizScores(scoreMap);
          } else {
            setQuizScores({});
          }
        } catch (err) {
          console.error('Lỗi khi lấy lịch sử quiz:', err);
          setQuizScores({});
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu user:', error);
      setQuizScores({});
    }
  };

  // Status is rendered as a separate pill in NewsItem, not appended to title

  useEffect(() => {
    fetchUserData();
  }, []);

  // Animation effect when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setIsAnimating(true);

      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 800); // Match the longest animation duration

      return () => clearTimeout(timer);
    }
  }, [selectedItem?.id]);

  // Extract headings when selectedItem changes
  useEffect(() => {
    if (selectedItem && selectedItem.detail) {
      const extractedHeadings = extractHeadings(selectedItem.detail);
      setHeadings(extractedHeadings);
      setActiveHeadingIndex(-1); // Reset active heading
    } else {
      setHeadings([]);
      setActiveHeadingIndex(-1);
    }
  }, [selectedItem]);

  // Search and highlight functions
  const performSearch = (text, item) => {
    if (!text || !item || !item.detail) {
      setSearchResults([]);
      return;
    }

    // Render markdown to HTML first
    const { processedText, latexBlocks } = preprocessLatex(item.detail || '');
    let html = marked.parse(processedText, {
      headerIds: true,
      mangle: false,
      headerPrefix: '',
      breaks: false,
      gfm: true
    });
    const finalHtml = postprocessLatex(html, latexBlocks);

    // Create a temporary DOM element to get plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = finalHtml;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    // Search in plain text (rendered text, not markdown)
    const searchTerm = text.toLowerCase();
    const lowerPlainText = plainText.toLowerCase();
    const results = [];
    let index = 0;

    while ((index = lowerPlainText.indexOf(searchTerm, index)) !== -1) {
      const before = Math.max(0, index - 100);
      const after = Math.min(plainText.length, index + searchTerm.length + 100);
      const context = plainText.substring(before, after);

      results.push({
        index: results.length,
        position: index,
        context: context,
        match: plainText.substring(index, index + searchTerm.length),
        matchIndex: index
      });
      index += searchTerm.length;
    }

    setSearchResults(results);
    if (results.length > 0) {
      setHighlightedIndex(0);
    }
  };

  const highlightTextInContent = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  // Search directly in rendered HTML content
  const performSearchInRenderedContent = (text) => {
    if (!text || !markdownContentRef.current) {
      setSearchResults([]);
      return;
    }

    const searchTerm = text.toLowerCase();
    const container = markdownContentRef.current;

    // Get all text nodes
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // Build plain text and map positions
    let plainText = '';
    const nodeMap = [];
    textNodes.forEach(textNode => {
      const nodeText = textNode.textContent;
      const startPos = plainText.length;
      plainText += nodeText;
      nodeMap.push({
        node: textNode,
        startPos: startPos,
        endPos: plainText.length,
        text: nodeText
      });
    });

    // Search in plain text
    const lowerPlainText = plainText.toLowerCase();
    const results = [];
    let index = 0;

    while ((index = lowerPlainText.indexOf(searchTerm, index)) !== -1) {
      const before = Math.max(0, index - 100);
      const after = Math.min(plainText.length, index + searchTerm.length + 100);
      const context = plainText.substring(before, after);

      // Find which node contains this position
      const nodeInfo = nodeMap.find(n => index >= n.startPos && index < n.endPos);

      results.push({
        index: results.length,
        position: index,
        context: context,
        match: plainText.substring(index, index + searchTerm.length),
        node: nodeInfo?.node || null,
        nodeOffset: nodeInfo ? index - nodeInfo.startPos : 0
      });
      index += searchTerm.length;
    }

    setSearchResults(results);
    if (results.length > 0) {
      setHighlightedIndex(0);
    }
  };

  const scrollToSearchResult = (resultIndex) => {
    if (resultIndex < 0 || resultIndex >= searchResults.length) return;

    setHighlightedIndex(resultIndex);
    const result = searchResults[resultIndex];

    setTimeout(() => {
      if (!markdownContentRef.current) {
        console.warn('markdownContentRef not available');
        return;
      }

      if (result.node) {
        try {
          const range = document.createRange();
          const offset = result.nodeOffset || 0;
          const matchLength = result.match.length;

          const maxOffset = result.node.textContent.length;
          const safeOffset = Math.min(Math.max(0, offset), maxOffset);
          const safeEnd = Math.min(safeOffset + matchLength, maxOffset);

          if (safeOffset >= maxOffset) {
            console.warn('Invalid offset for scroll');
            return;
          }

          range.setStart(result.node, safeOffset);
          range.setEnd(result.node, safeEnd);

          let scrollContainer = null;
          let current = markdownContentRef.current;
          while (current && current !== document.body) {
            const style = window.getComputedStyle(current);
            const hasOverflow = style.overflow === 'auto' || style.overflowY === 'auto' ||
              style.overflow === 'scroll' || style.overflowY === 'scroll';

            if (hasOverflow && current.style.height && current.style.height.includes('75vh')) {
              scrollContainer = current;
              break;
            }

            if (hasOverflow && !scrollContainer) {
              scrollContainer = current;
            }

            current = current.parentElement;
          }

          if (!scrollContainer) {
            scrollContainer = markdownContentRef.current.closest('.ant-modal-body') ||
              markdownContentRef.current.closest('[style*="overflow"]') ||
              document.querySelector('.ant-modal-body');
          }

          const rect = range.getBoundingClientRect();

          if (rect.height === 0 && rect.width === 0) {
            const parent = result.node.parentElement;
            if (parent) {
              parent.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });

              parent.style.backgroundColor = '#ffd700';
              parent.style.transition = 'background-color 0.3s';
              parent.style.borderRadius = '4px';
              parent.style.padding = '2px 4px';
              setTimeout(() => {
                parent.style.backgroundColor = '';
                parent.style.borderRadius = '';
                parent.style.padding = '';
              }, 2000);
            }
            return;
          }

          let elementToScroll = range.startContainer.parentElement;

          while (elementToScroll && elementToScroll !== markdownContentRef.current) {
            const tagName = elementToScroll.tagName?.toLowerCase();
            if (['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'].includes(tagName)) {
              if (tagName !== 'span' || elementToScroll.textContent.length > 50) {
                break;
              }
            }
            elementToScroll = elementToScroll.parentElement;
          }

          if (elementToScroll) {
            elementToScroll.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });

            if (scrollContainer && scrollContainer !== window && scrollContainer !== elementToScroll) {
              setTimeout(() => {
                const elementRect = elementToScroll.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();
                const relativeTop = elementRect.top - containerRect.top;
                const targetScroll = scrollContainer.scrollTop + relativeTop - 150;

                scrollContainer.scrollTo({
                  top: Math.max(0, targetScroll),
                  behavior: 'smooth'
                });
              }, 50);
            }
          } else {
            range.startContainer.parentElement?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          }

          const parent = range.startContainer.parentElement;
          if (parent) {
            markdownContentRef.current.querySelectorAll('.search-highlight-temp').forEach(el => {
              el.classList.remove('search-highlight-temp');
              el.style.backgroundColor = '';
              el.style.borderRadius = '';
              el.style.padding = '';
            });

            parent.classList.add('search-highlight-temp');
            parent.style.backgroundColor = '#ffd700';
            parent.style.transition = 'background-color 0.3s';
            parent.style.borderRadius = '4px';
            parent.style.padding = '2px 4px';

            setTimeout(() => {
              if (parent.classList) {
                parent.classList.remove('search-highlight-temp');
              }
              parent.style.backgroundColor = '';
              parent.style.borderRadius = '';
              parent.style.padding = '';
            }, 2000);
          }
        } catch (e) {
          console.error('Error scrolling to search result:', e);
          if (result.node && result.node.parentElement) {
            result.node.parentElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      } else {
        if (markdownContentRef.current) {
          const walker = document.createTreeWalker(
            markdownContentRef.current,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node;
          let charCount = 0;

          while (node = walker.nextNode()) {
            const nodeText = node.textContent;
            const nodeLength = nodeText.length;

            if (charCount + nodeLength >= result.position) {
              const offset = result.position - charCount;
              try {
                const range = document.createRange();
                range.setStart(node, Math.min(offset, nodeLength));
                range.setEnd(node, Math.min(offset + result.match.length, nodeLength));

                node.parentElement?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              } catch (e) {
                node.parentElement?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              }
              break;
            }
            charCount += nodeLength;
          }
        }
      }
    }, 100);
  };

  const navigateSearchResult = (direction) => {
    if (searchResults.length === 0) return;

    let newIndex = highlightedIndex + direction;
    if (newIndex < 0) {
      newIndex = searchResults.length - 1;
    } else if (newIndex >= searchResults.length) {
      newIndex = 0;
    }

    scrollToSearchResult(newIndex);
  };

  // Handle search text change
  useEffect(() => {
    if (selectedItem && selectedItem.detail && searchText.trim()) {
      setTimeout(() => {
        if (markdownContentRef.current) {
          performSearchInRenderedContent(searchText);
        } else {
          performSearch(searchText, selectedItem);
        }
      }, 100);
    } else {
      setSearchResults([]);
      setHighlightedIndex(-1);
    }
  }, [searchText, selectedItem]);

  // Reset search when item changes
  useEffect(() => {
    setSearchText('');
    setSearchResults([]);
    setHighlightedIndex(-1);
    setShowSearchResultsPanel(false);
    setPanelPosition({ x: 10, y: 50 });
    setShowSummaryDetail(false); // Reset summaryDetail collapse when item changes
  }, [selectedItem?.id]);

  // Keyboard navigation for detailImageUrls gallery
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle arrow keys when not typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Check if there's a selected item with detailImageUrls
      if (selectedItem && selectedItem.detailImageUrls && Array.isArray(selectedItem.detailImageUrls) && selectedItem.detailImageUrls.length > 1 && selectedItem.showDetailImageUrls !== false) {
        const currentIndex = selectedDetailImageIndex[selectedItem.id] ?? 0;
        const totalImages = selectedItem.detailImageUrls.length;

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const newIndex = currentIndex === 0 ? totalImages - 1 : currentIndex - 1;
          setSelectedDetailImageIndex(prev => ({
            ...prev,
            [selectedItem.id]: newIndex
          }));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const newIndex = currentIndex === totalImages - 1 ? 0 : currentIndex + 1;
          setSelectedDetailImageIndex(prev => ({
            ...prev,
            [selectedItem.id]: newIndex
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItem, selectedDetailImageIndex]);

  // Auto show panel when search results appear
  useEffect(() => {
    if (searchResults.length > 0) {
      setShowSearchResultsPanel(true);
    }
  }, [searchResults.length]);

  // Drag handlers for search results panel
  const handleMouseDown = (e) => {
    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDragging) return;

    let animationFrameId = null;
    const maxX = window.innerWidth - 350;
    const maxY = window.innerHeight - 100;

    const handleMouseMove = (e) => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        setPanelPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      });
    };

    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Helper function to format time ago (same as NewsItem.jsx)
  const getTimeAgo = (createdAt) => {
    if (!createdAt) return '-';

    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return '-';

    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} ngày trước`;
    } else if (diffHours > 0) {
      return `${diffHours} giờ trước`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes} phút trước` : 'Vừa xong';
    }
  };

  // Extract headings from markdown content
  const extractHeadings = (content) => {
    if (!content) return [];

    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const extractedHeadings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();

      extractedHeadings.push({
        level,
        text
      });
    }

    return extractedHeadings;
  };


  // Scroll to heading by index
  const scrollToHeading = (headingIndex) => {
    // Set active heading
    setActiveHeadingIndex(headingIndex);

    // Use the markdown content ref directly
    const markdownContent = markdownContentRef.current;
    if (!markdownContent) {
      return;
    }

    const headings = markdownContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const element = headings[headingIndex];

    if (element) {
      // Remove previous highlight
      headings.forEach(h => h.classList.remove(newsTabStyles.headingHighlight));

      // Add highlight to current heading
      element.classList.add(newsTabStyles.headingHighlight);

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    } else {
      console.log('Element not found at index:', headingIndex);
    }
  };

  // Toggle TOC sidebar
  const toggleTOCSidebar = () => {
    setShowTOCSidebar(!showTOCSidebar);
  };

  // Load saved filters on mount and propagate to parent
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CASE_FILTERS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          setLocalFilters(prev => ({ ...prev, ...saved }));
          // Push to parent handlers so K9 keeps in sync
          Object.entries(saved).forEach(([k, v]) => {
            if (['tag1', 'tag2', 'tag3', 'search', 'impact', 'quizStatus'].includes(k)) {
              onFilterChange(k, v);
            }
          });
          if (typeof saved.search === 'string') {
            onSearchChange({ target: { value: saved.search } });
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save filters when they change
  useEffect(() => {
    try {
      localStorage.setItem(CASE_FILTERS_KEY, JSON.stringify(localFilters));
    } catch (e) {
      // ignore
    }
  }, [localFilters]);

  useEffect(() => {
    // Merge filters prop with local defaults, ensuring impact is always 'all' by default
    const mergedFilters = {
      tag1: [],
      tag2: [],
      tag3: [],
      search: '',
      impact: 'all',
      quizStatus: 'all',
      ...filters
    };
    setLocalFilters(mergedFilters);
  }, [filters]);

  // Load tag options from settings
  useEffect(() => {
    loadTagOptions();
  }, []);

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


  const fetchCidSourceInfo = async (cid) => {
    const data = await getK9ByCidTypePublic(cid, 'news' , currentUser?.id );
    if (data) {
      setCidSourceInfo(data);
    } else {
      setCidSourceInfo(null);
    }
  }

  const fetchItem = async (id) => {
    const item = await getK9ByIdPublic(id);
    if (item) {
      setSelectedItem(item);
      onItemClick(item);
      fetchCidSourceInfo(item.cid);
      if (isMobile) {
        setShowMobileModal(true);
      }

      // Ensure the item is in visibleItems before scrolling
      // Find the index of the item in filteredItems
      const filteredItems = getFilteredItems();
      const itemIndex = filteredItems.findIndex(i => i.id === id);
      
      if (itemIndex >= 0) {
        // If item is beyond renderedCount, increase renderedCount to include it
        if (itemIndex >= renderedCount) {
          setRenderedCount(itemIndex + 1);
          // Wait for visibleItems to update before scrolling
          setTimeout(() => {
            scrollToItemWithRetry(id);
          }, 500);
        } else {
          // Item is already in visibleItems, scroll immediately
          scrollToItemWithRetry(id);
        }
      } else {
        // Item not found in filteredItems, try scrolling anyway
        scrollToItemWithRetry(id);
      }
      return;
    }
  }

  // Helper function to scroll to item with retry logic
  const scrollToItemWithRetry = (id, retryCount = 0) => {
    const targetElement = document.querySelector(`[data-item-id="${id}"]`);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    } else if (retryCount < 10) {
      // Retry up to 10 times with increasing delay
      setTimeout(() => scrollToItemWithRetry(id, retryCount + 1), 200 * (retryCount + 1));
    }
  };

  useEffect(() => {
    if (expandedItem) {
      fetchItem(expandedItem);
    } else if (!isMobile && caseTrainingItems && caseTrainingItems.length > 0 && viewMode === 'list') {
      const firstItem = getFilteredItems()[0];
      if (firstItem) {
        setSelectedItem(firstItem);
        onItemClick(firstItem);
        fetchCidSourceInfo(firstItem.cid);
        // Trigger onShowDetail if available with a mock event
        if (onShowDetail) {
          const mockEvent = {
            stopPropagation: () => { }
          };
          onShowDetail(firstItem, mockEvent);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseTrainingItems, selectedProgram, expandedItem, isMobile, viewMode]);


  // Load tag options from settings
  const loadTagOptions = async () => {
    try {

      // Load TAG1_OPTIONS (Categories)
      const tag1Setting = await getSettingByTypePublic('TAG1_OPTIONS');


      if (tag1Setting?.setting && Array.isArray(tag1Setting.setting) && tag1Setting.setting.length > 0) {
        setTag1Options(tag1Setting.setting);
      } else {
        // Set default options if none exist
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
      }

      // Load TAG2_OPTIONS (Levels)
      const tag2Setting = await getSettingByTypePublic('TAG2_OPTIONS');


      if (tag2Setting?.setting && Array.isArray(tag2Setting.setting) && tag2Setting.setting.length > 0) {
        setTag2Options(tag2Setting.setting);
      } else {
        // Set default options if none exist
        const defaultTag2Options = [
          { value: 'Beginner', label: 'Beginner' },
          { value: 'Intermediate', label: 'Intermediate' },
          { value: 'Advanced', label: 'Advanced' },
          { value: 'Expert', label: 'Expert' },
          { value: 'Case Study', label: 'Case Study' },
          { value: 'Tool', label: 'Tool' }
        ];
        setTag2Options(defaultTag2Options);
      }

      // Load TAG3_OPTIONS (Series)
      const tag3Setting = await getSettingByTypePublic('TAG3_OPTIONS');

      if (tag3Setting?.setting && Array.isArray(tag3Setting.setting) && tag3Setting.setting.length > 0) {
        setTag3Options(tag3Setting.setting);
      } else {
        // Set default options if none exist
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
      }
    } catch (error) {
      console.error('❌ Error loading tag options:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
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

  // Use local state (from settings) if available, otherwise use prop options
  const finalTag1Options = tag1Options.length > 0 ? tag1Options : (propTag1Options || []);
  const finalTag2Options = tag2Options.length > 0 ? tag2Options : (propTag2Options || []);
  const finalTag3Options = tag3Options.length > 0 ? tag3Options : (propTag3Options || []);

  // Debug log for final options



  // Render quiz status function - giống hệt NewsItem.jsx
  const renderQuizStatus = (item) => {
    if (!item) return null;
    if (item.questionContent === undefined || item.questionContent === null) {
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: '#E9FBFF',
            color: '#88B7CD',
            border: '1px solid #9ED5D8',
          }}
          title='Tham khảo'
        >
          Tham khảo
        </span>
      );
    }

    const quizScore = quizScores[item.id];

    if (quizScore === undefined || quizScore === null) {
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: '#FFE9ED',
            color: '#E39191',
            border: '1px solid #F3B2B2',
          }}
          title='Chưa làm'
        >
          Chưa làm
        </span>);
    }
    const numeric = Number(quizScore);
    const pass = !isNaN(numeric) && numeric >= 70;
    return (
      <span
        style={{
          marginLeft: 8,
          padding: '2px 8px',
          borderRadius: '6px',
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: pass ? '#E5F6DD' : '#E9EEFF',
          color: pass ? '#75C341' : '#7A8ED7',
          border: pass ? '1px solid #9FDE7D' : '1px solid #B9C4F7',
        }}
        title={'Đạt ' + numeric + '/' + 100}
      >
        {'Đạt ' + numeric + '/' + 100}
      </span>
    );
  };

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the dropdown menu and not on a dropdown item
      if (!event.target.closest(`.${styles.dropdownMenu}`) &&
        !event.target.closest(`.${styles.dropdownToggle}`)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...localFilters,
      [filterType]: value,
    };
    setLocalFilters(newFilters);
    onFilterChange(filterType, value);
  };

  const handleTagToggle = (filterType, tagValue) => {
    const currentTags = localFilters[filterType] || [];
    const newTags = currentTags.includes(tagValue)
      ? currentTags.filter(tag => tag !== tagValue)
      : [...currentTags, tagValue];

    const newFilters = {
      ...localFilters,
      [filterType]: newTags,
    };
    setLocalFilters(newFilters);
    onFilterChange(filterType, newTags);
  };

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setLocalFilters(prev => ({
      ...prev,
      search: searchTerm,
    }));
    onSearchChange(e);
  };


  // Toggle dropdown for a tag
  const toggleDropdown = (tagType, tagValue, event) => {
    event.stopPropagation();
    const dropdownKey = `${tagType}-${tagValue}`;
    setDropdownOpen(dropdownOpen === dropdownKey ? null : dropdownKey);
  };

  // Handle item selection from dropdown
  const handleItemSelectFromDropdown = async (itemId, event) => {
    const itemData = await getK9ByIdPublic(itemId);
    if (itemData) {
      setSelectedItem(itemData);
      fetchCidSourceInfo(itemData.cid);
      if (onShowDetail) {
        onShowDetail(itemData, event);
      }
      if (isMobile) {
        setShowMobileModal(true);
      }

      // Wait for DOM to re-render then scroll to item
      setTimeout(() => {
        const itemElement = document.querySelector(`[data-item-id="${itemData.id}"]`);
        if (itemElement) {
          itemElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          itemElement.style.backgroundColor = '#e6f7ff';
          setTimeout(() => {
            itemElement.style.backgroundColor = '';
          }, 2000);
        }
      }, 300);
    }
    setDropdownOpen(null);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.tag1 && localFilters.tag1.length > 0) count += 1;
    if (localFilters.tag2 && localFilters.tag2.length > 0) count += 1;
    if (localFilters.tag3 && localFilters.tag3.length > 0) count += 1;
    if (localFilters.impact && localFilters.impact !== 'all') count += 1;
    if (localFilters.quizStatus && localFilters.quizStatus !== 'all') count += 1;
    return count;
  };

  const renderMobileFiltersContent = () => (
    <div className={styles.filterPopoverContent}>
      <div className={styles.filterPopoverHeader}>
        <Title level={5} className={styles.filterPopoverTitle}>Bộ lọc tìm kiếm</Title>
        <Text type="secondary" className={styles.filterPopoverDescription}>Chọn các tiêu chí để lọc case training</Text>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterSectionHeader}>
          <span className={styles.filterSectionIcon}>📂</span>
          <Text strong className={styles.filterSectionTitle}>Phân loại</Text>
        </div>

        <div className={styles.categoryFilterGroup}>
          {/* Danh mục */}
          {
            isMobile && (
              <>   <div className={styles.categoryFilterCard}>
                <div className={styles.categoryFilterHeader}>
                  <span className={`${styles.categoryFilterIndicator} ${styles.tag1}`}></span>
                  <Text strong className={styles.categoryFilterLabel}>Danh mục</Text>
                </div>
                <div className={styles.categoryFilterTags}>
                  {finalTag1Options.map(option => {
                    const titlesInTag = getTitlesForTag('tag1', option.value);
                    const hasItems = titlesInTag.length > 0;
                    const tagCount = getTagCount('tag1', option.value);

                    return (
                      <div key={option.value} className={styles.categoryButtonContainer}>
                        <Tag
                          color={localFilters.tag1?.includes(option.value) ? 'blue' : 'default'}
                          className={`${styles.categoryFilterTag} ${localFilters.tag1?.includes(option.value) ? styles.tag1Selected : styles.tag1Unselected}`}
                          onClick={() => handleTagToggle('tag1', option.value)}
                        >   {tagCount > 0 && (
                          <span style={{
                            marginLeft: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: localFilters.tag1?.includes(option.value) ? '#0958d9' : '#666'
                          }}>
                            ({tagCount})
                          </span>
                        )}
                          {option.label}

                          {hasItems && (
                            <button
                              className={styles.dropdownToggle}
                              onClick={(e) => toggleDropdown('tag1', option.value, e)}
                              title={`Xem danh sách ${option.label}`}
                            >
                              <Menu size={14} color={localFilters.tag1?.includes(option.value) ? '#0958d9' : '#000'} />
                            </button>
                          )}
                        </Tag>

                        {hasItems && dropdownOpen === `tag1-${option.value}` && (
                          <div className={styles.dropdownMenu}>
                            <div className={styles.dropdownHeader}>
                              <span>{option.label}</span>
                              <button
                                className={styles.closeDropdown}
                                onClick={(e) => toggleDropdown('tag1', option.value, e)}
                              >
                                ×
                              </button>
                            </div>
                            <div className={styles.dropdownItems}>
                              {titlesInTag.map(item => (
                                <button
                                  key={item.id}
                                  className={styles.dropdownItem}
                                  onClick={(e) => handleItemSelectFromDropdown(item.id, e)}
                                >
                                  {item.lessonNumber && (
                                    <>
                                      {item.lessonNumber}:
                                    </>
                                  )}
                                  {currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
                                    <span style={{ marginRight: '4px', fontSize: '12px' }}>🔒</span>
                                  )}
                                  < > {item.title}</>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              </>
            )
          }


          {/* Cấp độ */}
          <div className={styles.categoryFilterCard}>
            <div className={styles.categoryFilterHeader}>
              <span className={`${styles.categoryFilterIndicator} ${styles.tag2}`}></span>
              <Text strong className={styles.categoryFilterLabel}>Cấp độ</Text>
            </div>
            <div className={styles.categoryFilterTags}>
              {finalTag2Options.map(option => (
                <Tag
                  key={option.value}
                  color={localFilters.tag2?.includes(option.value) ? 'green' : 'default'}
                  className={`${styles.categoryFilterTag} ${localFilters.tag2?.includes(option.value) ? styles.tag2Selected : styles.tag2Unselected
                    }`}
                  onClick={() => handleTagToggle('tag2', option.value)}
                >
                  {option.label}
                </Tag>
              ))}
            </div>
          </div>

          {/* Loại bài - chỉ hiển thị trên mobile */}
          {/*{isMobile && (*/}
          {/*  <div className={styles.categoryFilterCard}>*/}
          {/*    <div className={styles.categoryFilterHeader}>*/}
          {/*      <span className={`${styles.categoryFilterIndicator} ${styles.tag3}`}></span>*/}
          {/*      <Text strong className={styles.categoryFilterLabel}>Loại bài</Text>*/}
          {/*    </div>*/}
          {/*    <div className={styles.categoryFilterTags}>*/}
          {/*      {finalTag3Options.map(option => (*/}
          {/*        <Tag*/}
          {/*          key={option.value}*/}
          {/*          color={localFilters.tag3?.includes(option.value) ? 'orange' : 'default'}*/}
          {/*          className={`${styles.categoryFilterTag} ${localFilters.tag3?.includes(option.value) ? styles.tag3Selected : styles.tag3Unselected*/}
          {/*            }`}*/}
          {/*          onClick={() => handleTagToggle('tag3', option.value)}*/}
          {/*        >*/}
          {/*          {option.label}*/}
          {/*        </Tag>*/}
          {/*      ))}*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>
      </div>

      {/* <div className={styles.filterSection}>
        <div className={styles.filterSectionHeader}>
          <span className={styles.filterSectionIcon}>🎯</span>
          <Text strong className={styles.filterSectionTitle}>Độ phức tạp</Text>
        </div>
        <div className={styles.impactFilterContainer}>
          <Space size="small" wrap className={styles.impactFilterButtons}>
            <Button
                type={localFilters.impact === 'all' ? 'primary' : 'default'}
                onClick={() => handleFilterChange('impact', 'all')}
                size="middle"
                className={styles.impactFilterButton}
            >
              Tất cả
            </Button>
            <Button
                type={localFilters.impact === 'high' ? 'primary' : 'default'}
                onClick={() => handleFilterChange('impact', 'high')}
                size="middle"
                className={styles.impactFilterButton}
            >
              Cao
            </Button>
            <Button
                type={localFilters.impact === 'normal' ? 'primary' : 'default'}
                onClick={() => handleFilterChange('impact', 'normal')}
                size="middle"
                className={styles.impactFilterButton}
            >
              Tiêu chuẩn
            </Button>
          </Space>
        </div>
      </div> */}
      {
        isMobile && (
          <> <div className={styles.filterSection}>
            <div className={styles.filterSectionHeader}>
              <span className={styles.filterSectionIcon}>📝</span>
              <Text strong className={styles.filterSectionTitle}>Trạng thái Quiz</Text>
            </div>
            <div className={styles.quizStatusFilterContainer}>
              <Select
                value={localFilters.quizStatus}
                onChange={(value) => handleFilterChange('quizStatus', value)}
                placeholder="Chọn trạng thái Quiz"
                className={styles.quizStatusSelect}
                size="middle"
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="completed">✅ Đã hoàn thành Quiz</Option>
                <Option value="incomplete">⏳ Chưa hoàn thành Quiz</Option>
              </Select>
            </div>
          </div>
          </>
        )
      }

      {
        isMobile && (
          <div className={styles.filterActions}>
            <Button
              onClick={resetFilters}
              size="middle"
              className={styles.filterResetButton}
            >
              <span style={{ fontSize: '13px' }}>🗑️ Xóa tất cả bộ lọc</span>
            </Button>
          </div>
        )
      }
    </div>
  );

  const resetFilters = () => {
    const resetFilters = {
      tag1: [],
      tag2: [],
      tag3: [],
      search: '',
      impact: 'all',
      quizStatus: 'all'
    };
    setLocalFilters(resetFilters);
    Object.keys(resetFilters).forEach(key => {
      onFilterChange(key, resetFilters[key]);
    });
  };

  const getFilteredItems = () => {
    let filtered = caseTrainingItems.filter(item =>
      item.status === 'published' && item.impact !== 'skip'
    );

    if (selectedProgram && selectedProgram !== 'all') {
      filtered = filtered.filter(item => {
        if (!Array.isArray(item.tag4)) return false; // bỏ qua nếu không phải mảng
        // Support both string and array for selectedProgram
        if (Array.isArray(selectedProgram)) {
          return selectedProgram.some(prog => item.tag4.includes(prog));
        }
        return item.tag4.includes(selectedProgram);
      });
    }

    if (tag4Filter && tag4Filter !== 'all') {
      filtered = filtered.filter(item => {
        if (!Array.isArray(item.tag4)) return false;
        // Support both string and array for tag4Filter
        if (Array.isArray(tag4Filter)) {
          return tag4Filter.some(prog => item.tag4.includes(prog));
        }
        return item.tag4.includes(tag4Filter);
      });
    }

    // Tag1 filter
    if (localFilters.tag1 && localFilters.tag1.length > 0) {
      filtered = filtered.filter(item => localFilters.tag1.includes(item.tag1));
    }

    // Tag2 filter
    if (localFilters.tag2 && localFilters.tag2.length > 0) {
      filtered = filtered.filter(item => localFilters.tag2.includes(item.tag2));
    }

    // Tag3 filter
    if (localFilters.tag3 && localFilters.tag3.length > 0) {
      filtered = filtered.filter(item => localFilters.tag3.includes(item.tag3));
    }

    // Impact filter
    if (localFilters.impact !== 'all') {
      filtered = filtered.filter(item => item.impact === localFilters.impact);
    }

    // Quiz status filter (>=70 is completed)
    if (localFilters.quizStatus === 'completed') {
      filtered = filtered.filter(item => {
        const score = quizScores[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return !isNaN(n) && n >= 70;
      });
    } else if (localFilters.quizStatus === 'incomplete') {
      filtered = filtered.filter(item => {
        const score = quizScores[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return isNaN(n) || n < 70;
      });
    }

    // Search filter
    if (localFilters.search) {
      const searchTerm = localFilters.search.toLowerCase();
      filtered = filtered.filter(item => {
        const id = (item.id || "");   // ép id sang string để tránh lỗi
        const title = item.title || "";
        const summary = item.summary || "";
        const description = item.description || "";
        const detail = item.detail || "";

        const searchableText = `${id} ${title} ${summary} ${description} ${detail}`.toLowerCase();
        return searchableText.includes(searchTerm);
      });
    }

    return filtered;
  };

  // Memoize filteredItems để tránh tính toán lại không cần thiết
  const filteredItems = useMemo(() => {
    return getFilteredItems();
  }, [caseTrainingItems, selectedProgram, tag4Filter, localFilters, quizScores]);

  // Ref để track filteredItems và tránh race condition
  const filteredItemsRef = useRef(filteredItems);
  useEffect(() => {
    filteredItemsRef.current = filteredItems;
  }, [filteredItems]);

  // Infinite scroll logic - reset renderedCount khi filters thay đổi
  useEffect(() => {
    setRenderedCount(20); // Reset to initial count when filters change
  }, [localFilters, selectedProgram, tag4Filter]);

  // Update visible items based on rendered count
  useEffect(() => {
    const currentFiltered = filteredItemsRef.current;
    if (currentFiltered.length > 0) {
      setVisibleItems(currentFiltered.slice(0, renderedCount));
    } else {
      setVisibleItems([]);
    }
  }, [renderedCount, filteredItems.length]); // Chỉ theo dõi length để tránh infinite loop

  // Load more items when scrolling to bottom
  const loadMoreItems = () => {
    if (renderedCount < filteredItems.length) {
      setRenderedCount(prev => Math.min(prev + 20, filteredItems.length));
    }
  };

  // Intersection Observer for infinite scroll
  const lastItemRef = useRef(null);

  useEffect(() => {
    if (!lastItemRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && renderedCount < filteredItems.length) {
          loadMoreItems();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px' // Trigger 100px before reaching the element
      }
    );

    observer.observe(lastItemRef.current);

    return () => observer.disconnect();
  }, [visibleItems.length, renderedCount, filteredItems.length, viewMode]);

  // Get titles for a specific tag
  const getTitlesForTag = (tagType, tagValue) => {
    let dataCase = filteredItems;
    if (selectedProgram && selectedProgram !== 'all') {
      if (Array.isArray(selectedProgram)) {
        dataCase = filteredItems.filter(item => selectedProgram.some(prog => item.tag4?.includes(prog)));
      } else {
        dataCase = filteredItems.filter(item => item.tag4?.includes(selectedProgram));
      }
    }

    if (!tagValue) return dataCase;
    return filteredItems.filter(item => item[tagType] == tagValue).map(item => ({
      id: item.id,
      title: item.title,
      tagType: tagType,
      lessonNumber: item.lessonNumber,
      isPublic: item.isPublic
    }));
  };

  // Get count for a specific tag
  const getTagCount = (tagType, tagValue) => {
    if (!tagValue) return 0;
    return filteredItems.filter(item => {
      // Filter by selectedProgram first
      let matchesProgram = true;
      if (selectedProgram && selectedProgram !== 'all') {
        if (Array.isArray(selectedProgram)) {
          matchesProgram = selectedProgram.some(prog => item.tag4?.includes(prog));
        } else {
          matchesProgram = item.tag4 && item.tag4.includes(selectedProgram);
        }
      }
      // Then filter by tag value
      return matchesProgram && item[tagType] === tagValue;
    }).length;
  };


  const handleIconMouseEnter = (e, itemId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setHoveredItemId(itemId);
    setShowHoverPopup(true);
  };

  const handleIconMouseLeave = () => {
    setShowHoverPopup(false);
    setHoveredItemId(null);
  };

  // Handle item selection
  const handleItemSelect = async (item) => {
    const itemData = await getK9ByIdPublic(item.id);
    if (itemData) {
      setSelectedItem(itemData);
      onItemClick(itemData);
      fetchCidSourceInfo(itemData.cid);
      if (isMobile) {
        setShowMobileModal(true);
      }
    }
  };

  // Handle grid item click - for grid view modal
  const handleGridItemClick = async (item) => {
    const itemData = await getK9ByIdPublic(item.id);
    if (itemData) {
      setSelectedItem(itemData);
      fetchCidSourceInfo(itemData.cid);
      onItemClick(itemData);
      if (onShowDetail) {
        onShowDetail(itemData);
      }
      if (onItemClick) {
        onItemClick(itemData);
      }
    }
  };

  // Mobile modal controls
  const closeMobileModal = () => {
    setShowMobileModal(false);
    setSelectedItem(null);
  };


  // Helper function to get file icon based on extension
  const getFileIcon = (extension) => {
    const iconMap = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📽️',
      pptx: '📽️',
      txt: '📄',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎥',
      avi: '🎥',
      mov: '🎥',
      mp3: '🎵',
      wav: '🎵',
      zip: '📦',
      rar: '📦',
      '7z': '📦'
    };
    return iconMap[extension] || '📄';
  };

  // Helper function to open file preview
  const openFilePreview = (fileUrl, fileName) => {
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    setPreviewFile({
      url: fileUrl,
      name: fileName,
      extension: fileExtension
    });
    setPreviewModalVisible(true);
  };


  const handleCidSourceInfoClick = (data) => {
    if (data.length > 0) {
      const url = `${window.location.origin}/home?tab=stream&item=${data[0]?.id}`;
      window.open(url, '_blank');
    }
  }

  // Handle edit button click
  const handleEditClick = () => {
    if (selectedItem) {
      setEditingItem(selectedItem);
      setEditModalVisible(true);
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingItem(null);
  };

  // Handle update after edit
  const handleDetailUpdate = (updatedItem) => {
    setSelectedItem(updatedItem);
    // Có thể thêm logic khác nếu cần cập nhật state khác
  };

  // Render TOC Sidebar
  const renderTOCSidebar = () => {
    if (headings.length === 0) return null;

    return (
      <>
        {/* Sidebar */}
        <div className={`${newsTabStyles.tocSidebar} ${showTOCSidebar ? newsTabStyles.show : ''}`}>
          <div className={newsTabStyles.tocSidebarHeader}>
            <h4>Mục lục</h4>
            {/* <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={toggleTOCSidebar}
              title="Đóng mục lục"
              className={newsTabStyles.tocSidebarCloseButton}
            /> */}
          </div>
          <div className={newsTabStyles.tocSidebarList}>
            {headings.map((heading, index) => (
              <div
                key={index}
                className={`${newsTabStyles.tocSidebarItem} ${newsTabStyles[`tocSidebarLevel${heading.level}`]} ${activeHeadingIndex === index ? newsTabStyles.tocSidebarItemActive : ''
                  }`}
                onClick={() => scrollToHeading(index)}
                title={`Cuộn đến: ${heading.text}`}
              >
                {heading.text}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  // Render content panel
  const renderSkeleton = () => (
    <div className={`${styles.contentPanel} ${newsTabStyles.contentPanel}`}>
      <div className={`${styles.contentHeader} ${newsTabStyles.contentHeader}`}>
        <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`} style={{ width: '70%' }}></div>
        <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`} style={{ width: '20%' }}></div>
      </div>

      <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonImage}`}></div>

      <div className={`${styles.contentBody} ${newsTabStyles.contentBody}`}>
        <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`}></div>
        <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`}></div>
        <div className={`${newsTabStyles.skeleton} ${newsTabStyles.skeletonText}`} style={{ width: '80%' }}></div>
      </div>
    </div>
  );

  // Check if user has access to the item
  const hasAccess = (item) => {
    if (!item) return false;

    // 1. If user is admin, allow access immediately
    if (currentUser?.isAdmin) {
      return true;
    }

    // 2. If isPublic is true, allow access
    if (item.isPublic === true) {
      return true;
    }

    // 3. If isPublic is false, only non-trial accounts can access
    // Note: Trial accounts (account_type === 'Dùng thử') are NOT allowed to access non-public items
    if (item.isPublic === false) {
      // Check if user is a trial account - if yes, deny access
      const isTrialAccount = currentUser?.account_type === 'Dùng thử';
      if (isTrialAccount) {
        return false;
      }

      // Non-trial accounts can access non-public items
      return true;
    }

    // Default: deny access
    return false;
  };
  // Render content panel - now using CaseTrainingContentPanel component
  const renderContentPanel = (item) => {
      return (
      <CaseTrainingContentPanel
        item={item}
        currentUser={currentUser}
        isMobile={isMobile}
        isAnimating={isAnimating}
        showSummaryDetail={showSummaryDetail}
        selectedDetailImageIndex={selectedDetailImageIndex}
        searchText={searchText}
        cidSourceInfo={cidSourceInfo}
        selectedItem={selectedItem}
        contentPanelRef={contentPanelRef}
        markdownContentRef={markdownContentRef}
        hasAccess={hasAccess}
        renderSkeleton={renderSkeleton}
        highlightTextInContent={highlightTextInContent}
        getFileIcon={getFileIcon}
        openFilePreview={openFilePreview}
        handleEditClick={handleEditClick}
        handleCidSourceInfoClick={handleCidSourceInfoClick}
        onShare={onShare}
        setShowSummaryDetail={setShowSummaryDetail}
        setSelectedDetailImageIndex={setSelectedDetailImageIndex}
        setShowFeedbackModal={setShowFeedbackModal}
        setIsPackageModalOpen={setIsPackageModalOpen}
        setQuizScores={setQuizScores}
        preprocessLatex={preprocessLatex}
        postprocessLatex={postprocessLatex}
                />
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <Text>Loading case training data...</Text>
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      <PreviewFileModal
        open={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        fileUrl={previewFile?.url}
        fileName={previewFile?.name}
        title={previewFile ? `${getFileIcon(previewFile.extension)} ${previewFile.name}` : 'Preview File'}
      />
      {
        showFeedbackModal && (
          <FeedbackModal
            visible={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            item={selectedItem}
            currentUser={currentUser}
            activeTab={activeTab}
          />
        )
      }
      {/* Edit Detail Modal */}
      {
        editModalVisible && (
          <EditDetailModal
            visible={editModalVisible}
            onClose={closeEditModal}
            item={editingItem}
            onUpdate={handleDetailUpdate}
          />
        )
      }

      {/* Package Purchase Modal */}
      <PaymentModal
        open={isPackageModalOpen}
        onCancel={() => setIsPackageModalOpen(false)}
        currentUser={currentUser}
        isMobile={isMobile}
        onTrialActivated={() => {
          // Reload user data để cập nhật quyền truy cập
          window.location.reload();
        }}
      />
      {/* Header with count */}

      {/* Filters Section - Matching NewsTab.jsx Layout */}
      {showSearchSection && (
        <div className={styles.filters}>
          {/* Search Row */}
          <div className={styles.searchRow}>
            <div className={styles.searchGroup}>
              <Input
                placeholder="Tìm kiếm case training..."
                value={localFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
                size="large"
                style={{
                  width: '100%',
                  ...(localFilters.search && { backgroundColor: 'rgb(245, 231, 231)' })
                }}
              />
            </div>
            {
              isMobile ? (
                <>   {isFilterPopoverOpen && isMobile && (
                  <div className={styles.popoverOverlay} onClick={() => setIsFilterPopoverOpen(false)} />
                )}
                  <Popover
                    placement="bottomRight"
                    trigger="click"
                    open={isFilterPopoverOpen}
                    onOpenChange={setIsFilterPopoverOpen}
                    overlayStyle={{ zIndex: 1001 }}
                    content={renderMobileFiltersContent()}
                  >
                    <Button icon={<FilterOutlined />} size="large">
                      <span style={{ fontSize: '13px' }}>Bộ lọc{getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()})` : ''}</span>
                    </Button>
                  </Popover>
                </>
              )
                : (
                  <>
                    {/* Loại bài filter cho PC */}
                    {/*<div className={styles.filterGroup}>*/}
                    {/*  <strong>Loại bài:</strong>*/}
                    {/*  <div className={styles.filterTags}>*/}
                    {/*    {finalTag3Options.map(option => (*/}
                    {/*      <Tag*/}
                    {/*        key={option.value}*/}
                    {/*        color={localFilters.tag3?.includes(option.value) ? 'orange' : 'default'}*/}
                    {/*        className={`${styles.filterTag} ${localFilters.tag3?.includes(option.value) ? styles.tagSelected : styles.tagUnselected}`}*/}
                    {/*        onClick={() => handleTagToggle('tag3', option.value)}*/}
                    {/*        style={{*/}
                    {/*          cursor: 'pointer',*/}
                    {/*          height: '35px'*/}
                    {/*        }}*/}
                    {/*      >*/}
                    {/*        <span style={{ fontSize: '13px' }}>{option.label}</span>*/}
                    {/*      </Tag>*/}
                    {/*    ))}*/}
                    {/*  </div>*/}
                    {/*</div>*/}

                    <div className={styles.filterGroup}>
                      <strong>Trạng thái Quiz:</strong>
                      <Select
                        value={localFilters.quizStatus}
                        onChange={(value) => handleFilterChange('quizStatus', value)}
                        placeholder="Chọn trạng thái"
                        size="middle"
                        style={{ minWidth: '160px' }}
                      >
                        <Option value="all">Tất cả trạng thái</Option>
                        <Option value="completed">✅ Đã hoàn thành</Option>
                        <Option value="incomplete">⏳ Chưa hoàn thành</Option>
                      </Select>
                    </div>

                    {/* Advanced Filters Button */}
                    <div className={styles.actionGroup}>
                      <Popover
                        content={renderMobileFiltersContent}
                        trigger="click"
                        placement="bottomRight"
                        overlayClassName={styles.filterPopover}
                      >
                        <Button
                          icon={<FilterOutlined />}
                          size="large"
                        >
                          <span style={{ fontSize: '13px' }}>Bộ lọc{getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()})` : ''}</span>
                        </Button>
                      </Popover>

                    </div>
                    <div>
                      <Button
                        onClick={resetFilters}
                        size="middle"
                        className={styles.filterResetButton}
                      >
                        <span style={{ fontSize: '13px' }}>🗑️ Xóa tất cả bộ lọc</span>
                      </Button>
                    </div>
                  </>
                )
            }


            {/* Controls Row */}

          </div>
          {
            !isMobile && (
              <>   <div className={styles.controlsRow}>
                {/* Category Filter */}
                <div className={styles.filterGroup}>
                  <strong>Danh mục:</strong>
                  <div className={styles.filterTags}>
                    {finalTag1Options.slice(0, showAllCategories ? finalTag1Options.length : 5).map(option => {
                      const titlesInTag = getTitlesForTag('tag1', option.value);
                      const hasItems = titlesInTag.length > 0;
                      const tagCount = getTagCount('tag1', option.value);

                      return (
                        <div key={option.value} className={styles.categoryButtonContainer}>
                          <Tag
                            color={localFilters.tag1?.includes(option.value) ? 'blue' : 'default'}
                            className={`${styles.filterTag} ${localFilters.tag1?.includes(option.value) ? styles.tagSelected : styles.tagUnselected}`}
                            onClick={() => handleTagToggle('tag1', option.value)}
                            style={{
                              cursor: 'pointer',
                              height: '35px'
                            }}
                          >
                            {tagCount > 0 && (
                              <span style={{
                                marginLeft: '4px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: localFilters.tag1?.includes(option.value) ? '#0958d9' : '#666'
                              }}>
                                ({tagCount})
                              </span>
                            )}
                            <span style={{ fontSize: '13px' }}>
                              {option.label}
                            </span>
                            {hasItems && (
                              <button
                                className={styles.dropdownToggle}
                                onClick={(e) => toggleDropdown('tag1', option.value, e)}
                                title={`Xem danh sách ${option.label}`}
                              >
                                <Menu size={14} color={localFilters.tag1?.includes(option.value) ? '#0958d9' : '#000'} />
                              </button>
                            )}
                          </Tag>

                          {hasItems && dropdownOpen === `tag1-${option.value}` && (
                            <div className={styles.dropdownMenu}>
                              <div className={styles.dropdownHeader}>
                                <span>{option.label}</span>
                                <button
                                  className={styles.closeDropdown}
                                  onClick={(e) => toggleDropdown('tag1', option.value, e)}
                                >
                                  ×
                                </button>
                              </div>
                              <div className={styles.dropdownItems}>
                                {titlesInTag.map(item => (
                                  <button
                                    key={item.id}
                                    className={styles.dropdownItem}
                                    onClick={(e) => handleItemSelectFromDropdown(item.id, e)}
                                  >
                                    {item.lessonNumber && (
                                      <>
                                        {item.lessonNumber}:
                                      </>
                                    )}
                                    {currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
                                      <span style={{ marginRight: '4px', fontSize: '12px' }}>🔒</span>
                                    )}
                                    < > {item.title}</>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Show more/less button */}
                    {finalTag1Options.length > 5 && (
                      <Button
                        type="text"
                        size="small"
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          color: '#1890ff',
                          padding: '4px 8px',
                          height: 'auto'
                        }}
                      >
                        {showAllCategories ? 'Thu gọn' : `Xem thêm (${finalTag1Options.length - 5})`}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              </>
            )
          }
        </div>
      )}


      {isMobile ? (
        // Mobile view: Single panel with modal
        <div className={styles.caseTrainingPanel}>
          {visibleItems.length === 0 ? (
            <Empty
              description="No case training items found"
              className={styles.emptyState}
            />
          ) : (
            visibleItems.map((item, index) => (
              <div
                key={item.id}
                ref={index === visibleItems.length - 1 ? lastItemRef : null}
                className={`${styles.caseTrainingItem} ${expandedItem === item.id ? styles.expanded : ''}`}
                onClick={() => handleItemSelect(item)}
                data-item-id={item.id}
              >
                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                      {item.avatarUrl && (
                        <div className={styles.avatarWrapper} onClick={(e) => { e.stopPropagation() }}>
                          <Image
                            src={item.avatarUrl}
                            alt="Avatar"
                            style={{
                              width: '120px',
                              height: '120px',
                              objectFit: 'cover',
                              objectPosition: 'center',
                              display: 'block',
                            }}
                            loading="lazy"
                            placeholder={
                              <div style={{
                                width: '120px',
                                height: '120px',
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#999'
                              }}>
                                📷
                              </div>
                            }
                          />
                        </div>
                      )}
                      <div style={{ flex: 1, position: 'relative' }}>
                        {/* ID - Top right corner */}
                        {item.id && (
                          <div style={{
                            position: 'absolute',
                            top: '0',
                            right: '0',
                            fontSize: '10px',
                            color: '#9F9F9F',
                            backgroundColor: '#f5f5f5',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            zIndex: 1
                          }}>
                            ID: {item.id}
                          </div>
                        )}

                        {/* Lesson Number - Above title */}
                        {item.lessonNumber && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '6px',
                            width: '100%'
                          }}>
                            <div style={{
                              backgroundColor: '#b0b2c6',
                              color: '#ffffff',
                              padding: '2px 10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              width: 'fit-content'
                            }}>
                              {item.lessonNumber}
                            </div>
                            {/* Check mark for score >= 70 */}
                            {(() => {
                              const score = quizScores[item.id];
                              const numeric = typeof score === 'number' ? score : parseFloat(score);
                              const hasPassed = !isNaN(numeric) && numeric >= 70;
                              return hasPassed ? (
                                <div style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  background: '#52c41a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)'
                                }}>
                                  <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}

                        <Title level={5} className={styles.title} style={{ paddingRight: (item.id && !isMobile) ? '50px' : '0' }}>
                          {currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
                            <span style={{ marginRight: '6px', fontSize: '14px', verticalAlign: 'middle' }}>🔒</span>
                          )}
                          {item.title}
                        </Title>
                        <div className={styles.metaInfo}>
                          {renderQuizStatus(item)}
                          <Space size="small">
                            {/* {item.tag1 && <Tag color="purple">{item.tag1}</Tag>} */}
                            {/* {item.tag2 && <Tag color="cyan">{item.tag2}</Tag>} */}
                            {/* {item.tag3 && <Tag color="red">{item.tag3}</Tag>} */}
                          </Space>
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.summary && (
                    <div className={styles.summary}>
                      <p>{item.summary}</p>
                    </div>
                  )}

                  {item.description && (
                    <div className={styles.description}>
                      <Text type="secondary">{item.description}</Text>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading indicator when loading more */}
          {renderedCount < filteredItems.length && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Spin size="small" /> Loading more items...
            </div>
          )}

          <Modal
            open={showMobileModal && selectedItem}
            onCancel={closeMobileModal}
            footer={null}
            width={'100%'}
            style={{
              top: '10'
            }}
            destroyOnClose={true}
            maskClosable={true}
            closable={true}
            centered={true}
            className={styles.modalContent}
          >
            {renderContentPanel(selectedItem)}
          </Modal>
        </div>
      ) : viewMode === 'grid' ? (
        // Desktop Grid view
        <div style={{ padding: '20px', flex: 1 }}>

          {visibleItems.length === 0 ? (
            <Empty
              description="No case training items found"
              className={styles.emptyState}
            />
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                padding: '10px'
              }}>
                {visibleItems.map((item, index) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      ref={index === visibleItems.length - 1 ? lastItemRef : null}
                      title={`${item.title}${item.summary ? '\n\n' + item.summary : ''}`}
                      style={{
                        height: '210px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
                        borderRadius: '8px',
                        transition: 'all 0.3s ease',
                        backgroundColor: isSelected ? '#e6f7ff' : '#fff',
                        padding: '16px 16px 5px 16px',
                        boxShadow: isSelected ? '0 4px 12px rgba(24, 144, 255, 0.2)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                      data-item-id={item.id}
                    >
                      {/* Bên trong card: chia 2 hàng dọc giống NewsItem grid */}
                      <div
                        style={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0x'
                        }}
                      >
                        {/* Hàng trên: Ảnh + Title + Summary */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '16px',
                            flex: 1,
                            minHeight: 0
                          }}
                        >
                          {/* Image - Bên trái */}
                          {item.avatarUrl && (
                            <div
                              className={styles.avatarGridWrapper}
                              style={{ position: 'relative' }}
                            >
                              <Image
                                src={item.avatarUrl}
                                alt={item.title}
                                preview={{
                                  mask: false
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '8px',
                                  right: '8px',
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  zIndex: 10,
                                  transition: 'all 0.2s',
                                  backdropFilter: 'blur(4px)'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Trigger image preview by finding and clicking the ant-image element
                                  const imageWrapper = e.currentTarget.parentElement;
                                  const imageElement = imageWrapper?.querySelector('.ant-image');
                                  if (imageElement) {
                                    const clickEvent = new MouseEvent('click', {
                                      bubbles: true,
                                      cancelable: true,
                                      view: window
                                    });
                                    imageElement.dispatchEvent(clickEvent);
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <EyeOutlined style={{ color: '#fff', fontSize: '12px', opacity: 0.7 }} />
                              </div>
                            </div>
                          )}

                          {/* Content - Bên phải */}
                          <div
                            style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              minWidth: 0,
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                            onClick={() => handleGridItemClick(item)}
                          >
                            {/* Lesson Number - Above title */}
                            {item.lessonNumber && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '4px',
                                width: '100%'
                              }}>
                                <div style={{
                                  backgroundColor: '#b0b2c6',
                                  color: '#ffffff',
                                  padding: '2px 10px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  width: 'fit-content'
                                }}>
                                  {item.lessonNumber}
                                </div>
                                {/* Check mark for score >= 70 */}
                                {(() => {
                                  const score = quizScores[item.id];
                                  const numeric = typeof score === 'number' ? score : parseFloat(score);
                                  const hasPassed = !isNaN(numeric) && numeric >= 70;
                                  return hasPassed ? (
                                    <div style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      background: '#52c41a',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)'
                                    }}>
                                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            )}

                            {/* Title */}
                            <div
                              style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                lineHeight: '1.4',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                color: '#1f2937'
                              }}
                            >
                              {currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
                                <span style={{ marginRight: '6px', fontSize: '14px', verticalAlign: 'middle' }}>🔒</span>
                              )}
                              {item.title}
                            </div>

                            {/* Summary */}
                            {item.summary && (
                              <div
                                style={{
                                  fontSize: '13px',
                                  color: '#6b7280',
                                  overflow: 'hidden',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  lineHeight: '1.5'
                                }}
                              >
                                {item.summary}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hàng dưới: Meta (CID + trạng thái quiz / tag) dưới cả ảnh + title + summary */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            marginTop: 'auto',
                            width: '100%'
                          }}
                        >
                          {/* CID và ID bên trái */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#868686',
                              fontSize: '11px',
                              fontWeight: '500',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}
                          >
                            {item.cid && <span>CID: {item.cid}</span>}
                            {item.id && item.cid && <span>|</span>}
                            {item.id && <span>ID: {item.id}</span>}
                          </div>

                          {/* Trạng thái quiz + tag bên phải */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexWrap: 'wrap',
                              justifyContent: 'flex-end'
                            }}
                          >
                            {renderQuizStatus(item)}
                            {/* {item.tag1 && (
                              <Tag color="purple" style={{ margin: 0, fontSize: '11px' }}>
                                {item.tag1}
                              </Tag>
                            )}
                            {item.tag3 && (
                              <Tag color="red" style={{ margin: 0, fontSize: '11px' }}>
                                {item.tag3}
                              </Tag>
                            )} */}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Loading indicator */}
              {renderedCount < filteredItems.length && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  <Spin size="small" /> Đang tải thêm...
                </div>
              )}
            </>
          )}

          {/* Grid Modal */}
          <Modal
            title={
              selectedItem && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    color: '#262626'
                  }}>
                    <span style={{ fontSize: '18px' , width: 'max-content' }}>{getTabDisplayName(activeTab)}</span>
                    <span>{'>'}</span>
                    <span style={{
                      fontSize: '16px',
                      maxWidth: '600px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {selectedItem.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Input
                      placeholder="Tìm kiếm trong nội dung..."
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                      style={{ flex: 1, maxWidth: '400px' }}
                      onPressEnter={() => {
                        if (searchResults.length > 0) {
                          scrollToSearchResult(highlightedIndex >= 0 ? highlightedIndex : 0);
                        }
                      }}
                    />
                    {searchResults.length > 0 && (
                      <>
                        <Button
                          size="small"
                          onClick={() => navigateSearchResult(-1)}
                          disabled={searchResults.length === 0}
                          style={{ minWidth: '32px', padding: '0 8px' }}
                        >
                          ↑
                        </Button>
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#666',
                            minWidth: '50px',
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => setShowSearchResultsPanel(!showSearchResultsPanel)}
                          title="Xem danh sách kết quả"
                        >
                          {highlightedIndex + 1} / {searchResults.length}
                        </span>
                        <Button
                          size="small"
                          onClick={() => navigateSearchResult(1)}
                          disabled={searchResults.length === 0}
                          style={{ minWidth: '32px', padding: '0 8px' }}
                        >
                          ↓
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            }
            open={selectedItem !== null && viewMode === 'grid'}
            onCancel={() => { setSelectedItem(null); updateURL({ item: null }), setExpandedItem(null) }}
            footer={null}
            width={selectedItem?.hasTitle ? 1500 : 1000}
            destroyOnClose={true}
            maskClosable={true}
            closable={true}
            className={newsTabStyles.modalContent}
            style={{
              top: '0px',
              paddingBottom: '0px'
            }}
          >
            <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'auto', position: 'relative' }}>
              <div style={{ flex: 1, padding: '20px' }}>
                {renderContentPanel(selectedItem)}
              </div>
              {selectedItem?.hasTitle && hasAccess(selectedItem) && (
                <div style={{ width: '25%', borderLeft: '1px solid #f0f0f0', overflowY: 'auto' }}>
                  {renderTOCSidebar()}
                </div>
              )}

              {/* Floating Search Results Panel */}
              {searchResults.length > 0 && showSearchResultsPanel && (
                <div
                  ref={panelRef}
                  style={{
                    position: 'fixed',
                    top: `${panelPosition.y}px`,
                    left: `${panelPosition.x}px`,
                    width: '350px',
                    maxHeight: '70vh',
                    backgroundColor: '#fff',
                    border: '1px solid #d9d9d9',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    cursor: isDragging ? 'grabbing' : 'default',
                    userSelect: 'none',
                    willChange: isDragging ? 'transform' : 'auto',
                    transition: isDragging ? 'none' : 'box-shadow 0.2s'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: '#fafafa',
                      cursor: 'move',
                      userSelect: 'none'
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#262626',
                      flex: 1
                    }}>
                      Kết quả tìm kiếm ({searchResults.length})
                    </div>
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => setShowSearchResultsPanel(false)}
                      style={{ minWidth: 'auto', padding: '0 4px' }}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div style={{
                    overflowY: 'auto',
                    padding: '12px',
                    flex: 1
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            scrollToSearchResult(index);
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            backgroundColor: highlightedIndex === index ? '#e6f7ff' : '#fff',
                            border: highlightedIndex === index ? '1px solid #1890ff' : '1px solid #f0f0f0',
                            fontSize: '12px',
                            lineHeight: '1.5',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (highlightedIndex !== index) {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (highlightedIndex !== index) {
                              e.currentTarget.style.backgroundColor = '#fff';
                            }
                          }}
                        >
                          <div style={{
                            color: '#666',
                            marginBottom: '4px',
                            fontSize: '11px'
                          }}>
                            Kết quả {index + 1}
                          </div>
                          <div
                            style={{
                              color: '#262626',
                              lineHeight: '1.6'
                            }}
                            dangerouslySetInnerHTML={{
                              __html: `...${result.context.replace(
                                new RegExp(`(${result.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                '<mark style="background-color: #fff3cd; padding: 2px 0; border-radius: 2px;">$1</mark>'
                              )}...`
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        </div>
      ) : (
        // Desktop view: Dual panel (List mode)
        <div className={styles.dualPanelContainer}>
          <div className={styles.leftPanel}>
            {visibleItems.length === 0 ? (
              <Empty
                description="No case training items found"
                className={styles.emptyState}
              />
            ) : (
              visibleItems.map((item, index) => (
                <div
                  key={item.id}
                  ref={index === visibleItems.length - 1 ? lastItemRef : null}
                  className={`${styles.caseTrainingItem} ${expandedItem === item.id ? styles.expanded : ''} ${selectedItem?.id === item.id ? styles.selected : ''}`}
                  onClick={() => handleItemSelect(item)}
                  data-item-id={item.id}
                >
                  {/* Hover Popup */}
                  {showHoverPopup && hoveredItemId === item.id && (item.summary || item.description || item.source) && (
                    <div
                      style={{
                        left: `${popupPosition.x}px`,
                        top: `${popupPosition.y}px`,
                        transform: 'translateX(-50%) translateY(-100%)',
                        zIndex: 9999,
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                        padding: '16px',
                        maxWidth: '350px',
                        minWidth: '280px',
                        pointerEvents: 'none',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(229, 231, 235, 0.9)',
                        isolation: 'isolate',
                        position: 'fixed',
                        transformOrigin: 'bottom center',
                      }}
                    >
                      {/* Arrow pointing down */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-8px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: '8px solid #ffffff',
                          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
                        }}
                      />

                      {/* Summary */}
                      {item.summary && (
                        <div style={{
                          marginBottom: (item.description || item.source || item.createdAt) ? '12px' : '0',
                          paddingBottom: (item.description || item.source || item.createdAt) ? '12px' : '0',
                          borderBottom: (item.description || item.source || item.createdAt) ? '1px solid #f1f5f9' : 'none'
                        }}>
                          <div style={{
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: '#374151',
                            fontWeight: '400'
                          }}>
                            {item.summary}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {item.description && (
                        <div style={{
                          marginBottom: (item.source || item.createdAt) ? '12px' : '0',
                          paddingBottom: (item.source || item.createdAt) ? '12px' : '0',
                          borderBottom: (item.source || item.createdAt) ? '1px solid #f1f5f9' : 'none'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            lineHeight: '1.4',
                            color: '#6b7280',
                            fontStyle: 'italic'
                          }}>
                            {item.description}
                          </div>
                        </div>
                      )}

                      {/* Time */}
                      {item.createdAt && (
                        <div style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                          marginBottom: item.source ? '8px' : '0',
                          fontStyle: 'italic',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>🕒</span>
                          {getTimeAgo(item.createdAt)}
                        </div>
                      )}

                      {/* Source */}
                      {item.source && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          paddingTop: (item.summary || item.description || item.createdAt) ? '8px' : '0',
                          borderTop: (item.summary || item.description || item.createdAt) ? '1px solid #f1f5f9' : 'none'
                        }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>
                            🔗 Nguồn:
                          </span>
                          <span style={{
                            fontSize: '11px',
                            color: '#3b82f6',
                            fontWeight: '600',
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}>
                            {item.source}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.itemContent}>
                    {/* Lesson Number - Separate row above image and title */}
                    {item.lessonNumber && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        width: '100%'
                      }}>
                        <div style={{
                          backgroundColor: '#b0b2c6',
                          color: '#ffffff',
                          padding: '2px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          width: 'fit-content'
                        }}>
                          {item.lessonNumber}
                        </div>
                        {/* Check mark for score >= 70 */}
                        {(() => {
                          const score = quizScores[item.id];
                          const numeric = typeof score === 'number' ? score : parseFloat(score);
                          const hasPassed = !isNaN(numeric) && numeric >= 70;
                          return hasPassed ? (
                            <div style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: '#52c41a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)'
                            }}>
                              <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    <div className={styles.itemHeader}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                        {item.avatarUrl && (
                          <div className={styles.avatarWrapper}>
                            <Image
                              src={item.avatarUrl}
                              alt="Avatar"
                              style={{
                                width: '120px',
                                height: '120px',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                display: 'block',
                              }}
                              loading="lazy"
                              placeholder={
                                <div style={{
                                  width: '120px',
                                  height: '120px',
                                  backgroundColor: '#f0f0f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#999'
                                }}>
                                  📷
                                </div>
                              }
                            />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div className={styles.title}>
                            {currentUser?.account_type === 'Dùng thử' && item.isPublic !== true && (
                              <span style={{ marginRight: '6px', fontSize: '14px', verticalAlign: 'middle' }}>🔒</span>
                            )}
                            {item.title}
                          </div>
                          {item.summary && (
                            <div className={styles.summary}>
                              <p title={item.summary}>{item.summary}</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    <div className={styles.metaInfo} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
                        {/* CID và ID - trước điểm */}
                        {(item.cid || item.id) && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#868686',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            {item.cid && <span>CID: {item.cid}</span>}
                            {item.id && item.cid && <span>|</span>}
                            {item.id && <span>ID: {item.id}</span>}
                          </div>
                        )}

                        {
                          (item.tag1 || item.tag2) && (
                            <Space size="small">
                              {item.tag1 && <Tag color="purple">{item.tag1}</Tag>}
                              {/* {item.tag3 && <Tag color="red">{item.tag3}</Tag>} */}
                            </Space>
                          )
                        }
                        {renderQuizStatus(item)}

                      </div>

                      {/* {(item.summary || item.description || item.source) && (
                        <IconButton
                          onMouseEnter={(e) => handleIconMouseEnter(e, item.id)}
                          onMouseLeave={handleIconMouseLeave}
                          title="Xem thêm thông tin"
                          style={{ zIndex: 10 }}
                        >
                          <InfoMore_Icon
                            width={16}
                            height={16}
                          />
                        </IconButton>
                      )} */}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator when loading more */}
            {renderedCount < filteredItems.length && (
              <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
                <Spin size="small" /> Loading more items...
              </div>
            )}
          </div>

          <div className={styles.rightPanel} style={{ padding: selectedItem?.hasTitle ? '20px 55px 20px 55px' : '20px 175px' }}>
            {selectedItem ? (
              renderContentPanel(selectedItem)
            ) : (
              <div className={styles.emptyContentState}>
                <div className={styles.emptyContentIcon}>📚</div>
                <h3>Chọn một case training để xem nội dung</h3>
                <p>Nhấp vào bất kỳ case training nào ở bên trái để xem chi tiết</p>
              </div>
            )}
          </div>
          {selectedItem?.hasTitle && hasAccess(selectedItem) && renderTOCSidebar()}
        </div>
      )}

    </div>
  );
};

export default CaseTrainingTab;
