import DOMPurify from 'dompurify';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import React, { useEffect, useState, useRef, useContext, useMemo } from 'react';
import { Modal, Image, Button, Input } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { IconButton } from '@mui/material';
import { getListQuestionHistoryByUser } from '../../../apis/questionHistoryService.jsx';
import { getCurrentUserLogin, updateUser } from '../../../apis/userService';
import { getAllUserClass } from '../../../apis/userClassService';
import { MyContext } from '../../../MyContext';
import styles from '../K9.module.css';
import newsTabStyles from './NewsTab.module.css';
import K9Filters from './K9Filters';
import NewsItem from './NewsItem';
import QuizComponent from './QuizComponent.jsx';
import HomeItem from './HomeItem.jsx';
import { getK9ById } from '../../../apis/k9Service.jsx';
import { getK9ByIdPublic } from '../../../apis/public/publicService.jsx';
import ShareButton from './ShareButton.jsx';
import { getSettingByType } from '../../../apis/settingService.jsx';

import EditDetailModal from './EditDetailModal.jsx';

// Cấu hình marked với KaTeX extension
marked.use(markedKatex({
  throwOnError: false,
  strict: false,
  trust: true
}));

import PreviewFileModal from '../../../components/PreviewFile/PreviewFileModal';
import AccessDenied from './AccessDenied.jsx';
import AudioPlayer from '../../../components/AudioPlayer/AudioPlayer.jsx';
import { Customize_Icon, Document_Icon, Clock_Icon, Expand_Icon, Close_Icon } from '../../../icon/IconSvg.jsx';
import { formatDateFromTimestamp } from '../../../generalFunction/format.js';
import ExcalidrawViewer from '../../K9Management/components/ExcalidrawViewer';

const HomeTab = ({
  loading,
  filteredNews,
  filters,
  expandedItem,
  showDetailId,
  onFilterChange,
  onSearchChange,
  onItemClick,
  onShowDetail,
  onOpenSource,
  onShare,
  activeTab,
  totalCount = 0,
  newsItems = [],
  isHome = false, // Thêm prop isHome với default false
  viewMode = 'list', // View mode: 'list' or 'grid'
  updateURL,
  getTabDisplayName, // Function to get tab display name from parent
}) => {
  const { currentUser } = useContext(MyContext);

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

  // Bookmark states
  const [bookmarkedItems, setBookmarkedItems] = useState([]);
  const [bookmarkFilter, setBookmarkFilter] = useState('all');

  // Read states (tick functionality)
  const [readItems, setReadItems] = useState([]);
  const [readFilter, setReadFilter] = useState('all');

  // Quiz status filter state: 'all' | 'completed' | 'incomplete'
  const [quizStatusFilter, setQuizStatusFilter] = useState('all');

  // Categories state
  const [categories, setCategories] = useState([]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [questionScoreMap, setQuestionScoreMap] = useState({});

  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // SummaryDetail collapse state
  const [showSummaryDetail, setShowSummaryDetail] = useState(false);

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const contentPanelRef = useRef(null);

  // File preview modal states
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Infinite scroll states
  const [visibleItems, setVisibleItems] = useState([]);
  const [renderedCount, setRenderedCount] = useState(20);
  const [headings, setHeadings] = useState([]);
  const [showTOCSidebar, setShowTOCSidebar] = useState(false);
  const [activeHeadingIndex, setActiveHeadingIndex] = useState(-1);

  // Search in content states
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showSearchResultsPanel, setShowSearchResultsPanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 10, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);
  const markdownContentRef = useRef(null);

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

  // Edit modal handlers
  const handleEditClick = () => {
    if (selectedItem) {
      setEditingItem(selectedItem);
      setEditModalVisible(true);
    }
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingItem(null);
  };

  const handleDetailUpdate = (updatedItem) => {
    setSelectedItem(updatedItem);
  };

  // Persist filters to localStorage
  const NEWS_FILTERS_KEY = 'k9_news_filters_v1';
  const NEWS_PARENT_FILTERS_KEY = 'k9_news_parent_filters_v1';

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const settings = await getSettingByType('CATEGORIES_OPTIONS');

        if (settings?.setting) {
          setCategories(settings.setting);
        }

      } catch (error) {
        console.error('Error loading categories:', error);

      }
    };

    loadCategories();
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

  // Load filters from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NEWS_FILTERS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          if (saved.bookmarkFilter) setBookmarkFilter(saved.bookmarkFilter);
          if (saved.readFilter) setReadFilter(saved.readFilter);
          if (saved.quizStatusFilter) setQuizStatusFilter(saved.quizStatusFilter);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      const toSave = {
        bookmarkFilter,
        readFilter,
        quizStatusFilter,
      };
      localStorage.setItem(NEWS_FILTERS_KEY, JSON.stringify(toSave));
    } catch (e) {
      // ignore
    }
  }, [bookmarkFilter, readFilter, quizStatusFilter]);

  // Persist parent-provided filters (search/category/time/filter)
  useEffect(() => {
    try {
      localStorage.setItem(NEWS_PARENT_FILTERS_KEY, JSON.stringify(filters || {}));
    } catch (e) {
      // ignore
    }
  }, [filters]);

  // Restore parent-provided filters on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NEWS_PARENT_FILTERS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          if (saved.time) onFilterChange('time', saved.time);
          if (saved.category) onFilterChange('category', saved.category);
          if (saved.filter) onFilterChange('filter', saved.filter);
          if (typeof saved.search === 'string') {
            onSearchChange({ target: { value: saved.search } });
          }
        }
      }
    } catch (e) {
      // ignore
    }
    // we only want to run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
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

  // Load bookmarked, read items, and quiz history scores
  const fetchUserData = async () => {
    try {
      const user = (await getCurrentUserLogin()).data;
      setBookmarkedItems(user.info?.bookmarks_stream || []);
      setReadItems(user.info?.read_items_stream || []);

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
            setQuestionScoreMap(scoreMap);
          } else {
            setQuestionScoreMap({});
          }
        } catch (err) {
          console.error('Lỗi khi lấy lịch sử quiz:', err);
          setQuestionScoreMap({});
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu user:', error);
      setBookmarkedItems([]);
      setReadItems([]);
      setQuestionScoreMap({});
    }
  };

  // Status is rendered as a separate pill in NewsItem, not appended to title

  useEffect(() => {
    fetchUserData();
  }, []);

  // Bookmark functions
  const handleToggleBookmark = async (item) => {
    try {
      const itemId = item.id;
      const currentBookmarks = bookmarkedItems || [];
      const isCurrentlyBookmarked = currentBookmarks.includes(itemId);

      let newBookmarkedItems;
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        newBookmarkedItems = currentBookmarks.filter(id => id !== itemId);
      } else {
        // Add bookmark
        newBookmarkedItems = [...currentBookmarks, itemId];
      }

      setBookmarkedItems(newBookmarkedItems);

      // Update user info in database
      const user = (await getCurrentUserLogin()).data;

      if (user && user.id) {
        await updateUser(user.id, {
          info: {
            ...user.info,
            bookmarks_stream: newBookmarkedItems
          }
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert state if update fails
      setBookmarkedItems(bookmarkedItems || []);
    }
  };

  // Read functions (tick functionality)
  const handleToggleRead = async (item) => {
    try {
      const itemId = item.id;
      const currentReadItems = readItems || [];
      const isCurrentlyRead = currentReadItems.includes(itemId);

      let newReadItems;
      if (isCurrentlyRead) {
        // Mark as unread
        newReadItems = currentReadItems.filter(id => id !== itemId);
      } else {
        // Mark as read
        newReadItems = [...currentReadItems, itemId];
      }

      setReadItems(newReadItems);

      // Update user info in database
      const user = (await getCurrentUserLogin()).data;

      if (user && user.id) {
        await updateUser(user.id, {
          info: {
            ...user.info,
            read_items_stream: newReadItems
          }
        });
      }
    } catch (error) {
      console.error('Error toggling read status:', error);
      // Revert state if update fails
      setReadItems(readItems || []);
    }
  };

  const handleBookmarkFilterChange = (value) => {
    setBookmarkFilter(value);
  };

  const handleReadFilterChange = (value) => {
    setReadFilter(value);
  };

  const handleQuizStatusFilterChange = (value) => {
    setQuizStatusFilter(value);
  };

  // Handle item selection
  const handleItemSelect = async (item) => {
    const itemData = await getK9ByIdPublic(item.id);
    if (item) {
      setSelectedItem(itemData || item);
      onItemClick(itemData);
      if (isMobile) {
        setShowMobileModal(true);
      }
    }
  };

  // Close mobile modal
  const closeMobileModal = () => {
    setShowMobileModal(false);
    setSelectedItem(null);
  };

  // Grid item click handler
  const handleGridItemClick = async (item) => {
    const itemData = await getK9ByIdPublic(item.id);
    if (itemData) {
      setSelectedItem(itemData);
      // Trigger onShowDetail and onItemClick to maintain consistency
      if (onShowDetail) {
        const mockEvent = { stopPropagation: () => { } };
        onShowDetail(itemData, mockEvent);
      }
      if (onItemClick) {
        onItemClick(itemData);
      }
    }
  };

  // Handle item selection from dropdown
  const handleItemSelectFromDropdown = async (itemId, event) => {
    // Find the item from the complete newsItems list
    const itemData = await getK9ByIdPublic(itemId);
    if (itemData) {
      // Set as selected item
      setSelectedItem(itemData);

      // Show detail content
      if (onShowDetail) {
        onShowDetail(itemData, event);
      }

      // If mobile, open modal
      if (isMobile) {
        setShowMobileModal(true);
      }

      // Wait a bit for the category filter to update and DOM to re-render
      setTimeout(() => {
        // Scroll to the item in the sidebar
        const itemElement = document.querySelector(`[data-item-id="${itemData.id}"]`);
        console.log('Looking for item:', itemId, 'Found:', !!itemElement);
        if (itemElement) {
          itemElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Add highlight effect
          itemElement.style.backgroundColor = '#e6f7ff';
          setTimeout(() => {
            itemElement.style.backgroundColor = '';
          }, 2000);
        } else {
          // If not found, try again after a longer delay
          setTimeout(() => {
            const retryElement = document.querySelector(`[data-item-id="${itemId}"]`);
            console.log('Retry looking for item:', itemId, 'Found:', !!retryElement);
            if (retryElement) {
              retryElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
              retryElement.style.backgroundColor = '#e6f7ff';
              setTimeout(() => {
                retryElement.style.backgroundColor = '';
              }, 2000);
            }
          }, 1000);
        }
      }, 500);
    }
  };

  // Filter news based on bookmark and read filters
  const getFilteredNewsWithFilters = () => {
    let filtered = filteredNews;

    // Apply bookmark filter
    if (bookmarkFilter === 'bookmarked') {
      filtered = filtered.filter(item => (bookmarkedItems || []).includes(item.id));
    }

    // Apply read filter
    if (readFilter === 'read') {
      filtered = filtered.filter(item => (readItems || []).includes(item.id));
    } else if (readFilter === 'unread') {
      filtered = filtered.filter(item => !(readItems || []).includes(item.id));
    }

    // Apply quiz status filter (>60 completed)
    if (quizStatusFilter === 'completed') {
      filtered = filtered.filter(item => {
        const score = questionScoreMap[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return !isNaN(n) && n >= 60;
      });
    } else if (quizStatusFilter === 'incomplete') {
      filtered = filtered.filter(item => {
        const score = questionScoreMap[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return isNaN(n) || n < 60;
      });
    }

    return filtered;
  };

  // Get current filtered count
  const getCurrentFilteredCount = () => {
    return getFilteredNewsWithFilters().length;
  };

  // Memoize filteredItems để tránh tính toán lại không cần thiết
  const filteredItems = useMemo(() => {
    return getFilteredNewsWithFilters();
  }, [filteredNews, bookmarkFilter, readFilter, quizStatusFilter, questionScoreMap]);

  // Ref để track filteredItems và tránh race condition
  const filteredItemsRef = useRef(filteredItems);
  useEffect(() => {
    filteredItemsRef.current = filteredItems;
  }, [filteredItems]);

  // Infinite scroll logic - reset renderedCount khi filters thay đổi
  useEffect(() => {
    setRenderedCount(20); // Reset to initial count when filters change
  }, [bookmarkFilter, readFilter, quizStatusFilter, filters]);

  // Update visible items based on rendered count
  useEffect(() => {
    const currentFiltered = filteredItemsRef.current;
    if (currentFiltered.length > 0) {
      setVisibleItems(currentFiltered.slice(0, renderedCount));
    } else {
      setVisibleItems([]);
    }
  }, [renderedCount, filteredItems.length]);

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

    return () => {
      observer.disconnect();
    };
  }, [visibleItems.length, renderedCount, filteredItems.length, viewMode]);

  // Lấy danh sách đã lọc theo các điều kiện khác, KHÔNG filter theo category
  const getNewsListForCategoryCount = () => {
    let list = newsItems.filter(item => item.status === 'published');

    // Apply bookmark filter
    if (bookmarkFilter === 'bookmarked') {
      list = list.filter(item => (bookmarkedItems || []).includes(item.id));
    }

    // Apply read filter
    if (readFilter === 'read') {
      list = list.filter(item => (readItems || []).includes(item.id));
    } else if (readFilter === 'unread') {
      list = list.filter(item => !(readItems || []).includes(item.id));
    }

    // Apply quiz status filter (>60 completed)
    if (quizStatusFilter === 'completed') {
      list = list.filter(item => {
        const score = questionScoreMap[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return !isNaN(n) && n >= 60;
      });
    } else if (quizStatusFilter === 'incomplete') {
      list = list.filter(item => {
        const score = questionScoreMap[item.id];
        const n = typeof score === 'number' ? score : parseFloat(score);
        return isNaN(n) || n < 60;
      });
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      list = list.filter(item => {
        const searchableText = `${item.title} ${item.summary || ''} ${item.description || ''} ${item.detail || ''}`.toLowerCase();
        return searchableText.includes(searchTerm);
      });
    }
    // Các filter khác (time, filter) nếu muốn áp dụng vào count thì thêm ở đây
    return list;
  };

  const filterConfig = {
    searchPlaceholder: "Nhập từ khóa...",
    categories: categories.length > 0 ? categories : [],
    showTimeFilter: false,
    showSentimentFilter: false
  };

  // Tính số lượng từng danh mục đúng logic
  const getCategoryCounts = () => {
    const list = getNewsListForCategoryCount();
    return filterConfig.categories.map(cat => ({
      key: cat.key,
      label: cat.label,
      count: cat.key === 'all'
        ? list.length
        : list.filter(item => item.category === cat.key).length
    }));
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

  // Render content panel
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

    // 3. If isPublic is false, check if user's id_user_class is in allowed_user_class
    if (item.isPublic === false && item.allowed_user_class) {
      const userClassIds = currentUser?.id_user_class || [];
      const allowedClasses = Array.isArray(item.allowed_user_class) ? item.allowed_user_class : [];

      // Get valid user class IDs (those that still exist in the system)
      const validUserClassIds = userClassIds.filter(classId => {
        // Check if this class ID exists in the userClasses array
        return userClasses.some(uc => uc.id === classId);
      });

      // Check if any of user's valid classes are in allowed classes
      const hasPermission = validUserClassIds.some(userClassId =>
        allowedClasses.includes(userClassId)
      );

      return hasPermission;
    }

    // Default: deny access
    return false;
  };


  const renderContentPanel = (item) => {
    if (!item) return null;

    // Check access permission
    if (!hasAccess(item)) {
      return (
        <div
          ref={contentPanelRef}
          className={`${styles.contentPanel} ${newsTabStyles.contentPanel} ${newsTabStyles.contentPanelHome}`}
        >
          <AccessDenied />
        </div>
      );
    }

    // Show skeleton while animating
    if (isAnimating) {
      return renderSkeleton();
    }

    return (
      <div
        ref={contentPanelRef}
        className={`${styles.contentPanel} ${newsTabStyles.contentPanel} `}
        style={{ width: isMobile ? '100%' :  viewMode === 'grid' ? '100%' : '75%' }}
      >
        <div className={`${styles.contentHeader} ${newsTabStyles.contentHeader}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
          {currentUser?.isAdmin && !isMobile && (
            <Button
            type="text"
            size="small"
            onClick={handleEditClick}
            style={{
              color: '#9F9F9F',
              border: 'none',
              boxShadow: 'none'
            }}
          >
            Edit
          </Button>
          )}
        </div>

        {/* Audio Player Section */}

        {/* File URLs Section */}
        <div className={newsTabStyles.contentMain} style={{ padding: isMobile ? '0px' : '0 60px' }}>
          <div className={styles.contentTitleContainer}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`${styles.contentTitle} ${newsTabStyles.contentTitle}`}>{item.title}</span>
              </div>
            </div>
            {item.summaryDetail && showSummaryDetail && (
              <div className={`${styles.contentDetail} ${newsTabStyles.contentDetail}`} style={{ marginTop: '12px', marginBottom: '12px' }}>
                <div
                  className={styles.markdownContent}
                  style={{ fontSize: '16px' }}
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      const { processedText, latexBlocks } = preprocessLatex(item.summaryDetail || '');
                      let html = marked.parse(processedText, {
                        headerIds: true,
                        mangle: false,
                        headerPrefix: '',
                        breaks: false,
                        gfm: true
                      });
                      const finalHtml = postprocessLatex(html, latexBlocks);
                      return DOMPurify.sanitize(finalHtml);
                    })(),
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <span style={{
                fontSize: '13px',
                color: '#9F9F9F',
                marginLeft: '10px',
                width: 'max-content',
                flexShrink: 0
              }}>ID: {item.id}</span>

              <ShareButton onShare={() => onShare(selectedItem)} />

              {item.updatedAt && (
                <Button
                  type="text"
                  icon={<Clock_Icon width={13} height={13} />}
                  size={'small'}
                  style={{ color: '#9F9F9F', fontSize: '13px' }}
                >
                  {formatDateFromTimestamp(item.updatedAt)}
                </Button>
              )}

            </div>

            <div
              style={{
                display: 'flex',
                gap: isMobile ? '12px' : '16px',
                fontSize: '15px',
                color: '#9F9F9F',
                marginTop: '10px',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center'
              }}
            >
              {item.summaryDetail && (
                <Button
                  type="text"
                  size="small"
                  onClick={() => setShowSummaryDetail(!showSummaryDetail)}
                  title={showSummaryDetail ? 'Ẩn Shortform' : 'Hiện Shortform'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    color: '#595959',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: 'none'
                  }}
                  icon={showSummaryDetail ? <Close_Icon width={12} height={12} /> : <Expand_Icon width={12} height={12} />}
                >
                  Shortform
                </Button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {item.info?.filedLabel_1 && (
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {item.info?.filedLabel_1}
                  </span>
                )}
                {item.info?.filedLabel_1 && item.info?.filedLabel_2 && (
                  <span style={{ color: '#C4C4C4' }}>|</span>
                )}
                {item.info?.filedLabel_2 && (
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {item.info?.filedLabel_2}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.audioPlayerContainer}>
              <AudioPlayer audioUrl={item.audioUrl} />
            </div>
          </div>

          {item.fileUrls && item.fileUrls.length > 0 && (
            <div className={`${styles.fileTagsContainer} ${newsTabStyles.fileTagsContainer}`}>
              {item.fileUrls.map((fileUrl, index) => {
                const fileName = fileUrl.split('/').pop() || `file-${index + 1}`;
                const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

                return (
                  <div
                    key={index}
                    className={`${styles.fileTag} ${newsTabStyles.fileTag}`}
                    onClick={() => openFilePreview(fileUrl, fileName)}
                    title={fileName}
                  >
                    <span className={`${styles.fileTagIcon} ${newsTabStyles.fileTagIcon}`}>
                      {getFileIcon(fileExtension)}
                    </span>
                    <span className={`${styles.fileTagName} ${newsTabStyles.fileTagName}`}>
                      {fileName}
                    </span>
                    <span className={`${styles.fileTagExtension} ${newsTabStyles.fileTagExtension}`}>
                      {fileExtension.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/*{(item.avatarUrl || item.summary) && (*/}
          {/*    <div className={`${styles.valueSection} ${newsTabStyles.valueSection}`}>*/}
          {/*      /!* <h3 className={`${styles.valueSectionTitle} ${newsTabStyles.valueSectionTitle}`}>*/}
          {/*        WHAT / WHY*/}
          {/*      </h3> *!/*/}
          {/*      <div className={`${styles.valueSectionContent} ${newsTabStyles.valueSectionContent}`}>*/}
          {/*        {*/}
          {/*            item.summary && (*/}
          {/*                <div className={`${styles.valueSummary} ${newsTabStyles.valueSummary}`}>*/}
          {/*                  {item.summary}*/}
          {/*                </div>*/}
          {/*            )*/}
          {/*        }*/}
          {/*        {*/}
          {/*            item.avatarUrl && (*/}
          {/*                <div className={`${styles.valueImage} ${newsTabStyles.valueImage}`}>*/}
          {/*                  <Image*/}
          {/*                      src={item.avatarUrl}*/}
          {/*                      alt={item.title}*/}
          {/*                      className={`${styles.coverImageDetail} ${newsTabStyles.coverImageDetail}`}*/}
          {/*                  />*/}
          {/*                </div>*/}
          {/*            )*/}
          {/*        }*/}

          {/*      </div>*/}
          {/*    </div>*/}
          {/*)}*/}
          {/* Diagram Section - Other diagrams (Kroki, HTML) */}
          {(item.diagramUrl || ((item.diagramHtmlCode || item.diagramHtmlCodeFromSummaryDetail) && item.showHtml !== false) || item.diagramNote || (item.imgUrls && item.showImgUrls !== false)) && (
            <div className={`${styles.valueSection} ${newsTabStyles.valueSection}`}>
              {/* <h3 className={`${styles.valueSectionTitle} ${newsTabStyles.valueSectionTitle}`}>
                  INFOGRAM - BẢN VẼ TRỰC QUAN HÓA
                </h3> */}
              <div className={`${styles.diagramSectionContent} ${newsTabStyles.diagramSectionContent}`}>

                {/* Handle imgUrls from SummaryDetail */}
                {item.imgUrls && Array.isArray(item.imgUrls) && item.imgUrls.length > 0 && item.showImgUrls !== false && (
                  item.imgUrls.map((imgItem, index) => {
                    const imageUrl = typeof imgItem === 'string' ? imgItem : (imgItem?.url || imgItem?.image_url || '');
                    const description = typeof imgItem === 'object' ? imgItem?.description : '';
                    if (!imageUrl) return null;

                    return (
                      <div key={`imgurls-${index}`} style={{ marginBottom: '20px' }}>
                        <div className={`${styles.diagramImage} ${newsTabStyles.diagramImage}`}>
                          <Image
                            src={imageUrl}
                            alt={description || `Ảnh ${index + 1}`}
                            className={`${styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
                            preview={{
                              mask: 'Xem ảnh',
                              maskClassName: 'custom-mask'
                            }}
                          />
                        </div>
                        {/* Show description if available */}
                        {/* {description && (
                          <div
                            className={styles.markdownContent}
                            dangerouslySetInnerHTML={{
                              __html: (() => {
                                const { processedText, latexBlocks } = preprocessLatex(description || '');
                                const html = marked.parse(processedText);
                                const finalHtml = postprocessLatex(html, latexBlocks);
                                return DOMPurify.sanitize(finalHtml);
                              })(),
                            }}
                          />
                        )} */}
                      </div>
                    );
                  })
                )}

                {/* Handle HTML Code Diagrams */}
                {item.diagramHtmlCode && Array.isArray(item.diagramHtmlCode) && item.showHtml !== false && (
                  item.diagramHtmlCode.map((htmlCode, index) => (
                    <div key={`html-${index}`}>
                      <div className={`${styles.diagramHtmlCode} ${newsTabStyles.diagramHtmlCode}`}>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(htmlCode || ''),
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}

                {/* Handle HTML Code Diagrams from SummaryDetail */}
                {item.diagramHtmlCodeFromSummaryDetail && item.showHtml !== false && (
                  (Array.isArray(item.diagramHtmlCodeFromSummaryDetail) ? item.diagramHtmlCodeFromSummaryDetail : [item.diagramHtmlCodeFromSummaryDetail]).map((htmlCode, index) => (
                    <div key={`html-summary-${index}`}>
                      <div className={`${styles.diagramHtmlCode} ${newsTabStyles.diagramHtmlCode}`}>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(htmlCode || ''),
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}

                {/* Handle Kroki Image Diagrams */}
                {item.diagramUrl && (
                  Array.isArray(item.diagramUrl) ? (
                    item.diagramUrl.map((diagramUrl, index) => (
                      <div key={`kroki-${index}`} style={{ marginBottom: '20px' }}>
                        <div className={`${styles.diagramImage} ${newsTabStyles.diagramImage}`}>
                          <Image
                            src={diagramUrl}
                            alt={`Diagram ${index + 1}`}
                            className={`${styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
                            preview={{
                              mask: 'Xem ảnh',
                              maskClassName: 'custom-mask'
                            }}
                          />
                        </div>
                        {/* Show corresponding note if available */}
                        {Array.isArray(item.diagramNote) && item.diagramNote.length > 0 && item.diagramNote[index] && (
                          <div className={`${styles.diagramNote} ${newsTabStyles.diagramNote}`}>
                            <div
                              className={styles.markdownContent}
                              dangerouslySetInnerHTML={{
                                __html: (() => {
                                  const { processedText, latexBlocks } = preprocessLatex(item.diagramNote[index] || '');
                                  const html = marked.parse(processedText);
                                  const finalHtml = postprocessLatex(html, latexBlocks);
                                  return DOMPurify.sanitize(finalHtml);
                                })(),
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    /* Handle single diagram (backward compatibility) */
                    <>
                      <div className={`${styles.diagramImage} ${newsTabStyles.diagramImage}`}>
                        <Image
                          src={item.diagramUrl}
                          alt="Diagram"
                          className={`${styles.diagramImageDetail} ${newsTabStyles.diagramImageDetail}`}
                          preview={{
                            mask: 'Xem ảnh',
                            maskClassName: 'custom-mask'
                          }}
                        />
                      </div>
                      {item.diagramNote && (
                        <div className={`${styles.diagramNote} ${newsTabStyles.diagramNote}`}>
                          <div
                            className={styles.markdownContent}
                            dangerouslySetInnerHTML={{
                              __html: (() => {
                                const { processedText, latexBlocks } = preprocessLatex(
                                  Array.isArray(item.diagramNote)
                                    ? item.diagramNote[0] || ''
                                    : item.diagramNote || ''
                                );
                                const html = marked.parse(processedText);
                                const finalHtml = postprocessLatex(html, latexBlocks);
                                return DOMPurify.sanitize(finalHtml);
                              })(),
                            }}
                          />
                        </div>
                      )}
                    </>
                  )
                )}
              </div>
            </div>
          )}

          <div className={`${styles.contentBody} ${newsTabStyles.contentBody}`}>
            {/* Handle Excalidraw React Diagrams - Hiển thị trong detail */}
            {item.diagramExcalidrawJson && Array.isArray(item.diagramExcalidrawJson) && (
              item.diagramExcalidrawJson.map((jsonString, index) => {
                // Lấy imageUrl nếu có
                const imageUrl = item.diagramExcalidrawImageUrls && Array.isArray(item.diagramExcalidrawImageUrls)
                  ? item.diagramExcalidrawImageUrls[index]
                  : null;
                
                return (
                <div key={`excalidraw-detail-${index}`} style={{ marginBottom: '30px', width: '100%' }}>
                  <ExcalidrawViewer
                    jsonString={jsonString}
                    readOnly={true}
                    height="600px"
                    imageUrl={imageUrl}
                  />
                  {/* Show corresponding note if available */}
                  {(Array.isArray(item.diagramExcalidrawNote) && item.diagramExcalidrawNote[index]) && (
                    <div className={`${styles.diagramNote} ${newsTabStyles.diagramNote}`} style={{ marginTop: '15px' }}>
                      <div
                        className={styles.markdownContent}
                        dangerouslySetInnerHTML={{
                          __html: (() => {
                            const { processedText, latexBlocks } = preprocessLatex(item.diagramExcalidrawNote[index] || '');
                            const html = marked.parse(processedText);
                            const finalHtml = postprocessLatex(html, latexBlocks);
                            return DOMPurify.sanitize(finalHtml);
                          })(),
                        }}
                      />
                    </div>
                  )}
                </div>
                );
              })
            )}

            {item.detail && (
              <div className={`${styles.contentDetail} ${newsTabStyles.contentDetail}`}>
                <div
                  ref={markdownContentRef}
                  className={styles.markdownContent}
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      const { processedText, latexBlocks } = preprocessLatex(item.detail || '');
                      let html = marked.parse(processedText, {
                        headerIds: true,
                        mangle: false,
                        headerPrefix: '',
                        breaks: false,
                        gfm: true
                      });
                      
                      // Apply search highlight if searchText exists
                      if (searchText && searchText.trim()) {
                        html = highlightTextInContent(html, searchText);
                      }
                      
                      const finalHtml = postprocessLatex(html, latexBlocks);
                      return DOMPurify.sanitize(finalHtml);
                    })(),
                  }}
                />
              </div>
            )}


            {/* Quiz Component - Hiển thị cuối cùng khi xem chi tiết */}
            {item.questionContent && (
              <QuizComponent
                allowRetake={item.allow_retake}
                quizData={item.questionContent}
                questionId={item.id}
                onScoreUpdate={(qid, score) => setQuestionScoreMap(prev => ({ ...prev, [qid]: score }))}
              />
            )}
          </div>
        </div>

      </div>
    );
  };

  const fetchItem = async (id) => {
    const item = await getK9ByIdPublic(id);
    if (item) {
      setSelectedItem(item);
      if (onItemClick) {
        onItemClick(item);
      }
      setShowMobileModal(true);
      setTimeout(() => {
        const targetElement = document.querySelector(`[data-item-id="${id}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100); // Small delay to ensure the item is rendered
      return;
    }
  }

  // Auto-select first item when newsItems changes or on mount
  useEffect(() => {
    if (expandedItem) {
      fetchItem(expandedItem)
    }
    if (!isMobile && newsItems && newsItems.length > 0 && !selectedItem && viewMode === 'list') {
      const firstItem = getFilteredNewsWithFilters()[0];
      if (firstItem) {
        setSelectedItem(firstItem);
        if (onItemClick) {
          onItemClick(firstItem);
        }
        // Trigger onShowDetail if available with a mock event
        if (onShowDetail) {
          const mockEvent = {
            stopPropagation: () => { }
          };
          onShowDetail(firstItem, mockEvent);
        }
      }
    }

  }, [newsItems, expandedItem, isMobile, viewMode]);

  // Scroll to heading by index
  const scrollToHeading = (headingIndex) => {
    if (headingIndex < 0 || headingIndex >= headings.length) return;

    setActiveHeadingIndex(headingIndex);
    const markdownContent = markdownContentRef.current;
    if (!markdownContent) {
      return;
    }

    const headingElements = markdownContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const element = headingElements[headingIndex];

    if (element) {
      // Remove previous highlight
      headingElements.forEach(h => h.classList.remove(newsTabStyles.headingHighlight));

      // Add highlight to current heading
      element.classList.add(newsTabStyles.headingHighlight);

      // Scroll to heading
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

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
        editModalVisible && (
          <EditDetailModal
            visible={editModalVisible}
            onClose={closeEditModal}
            item={editingItem}
            onUpdate={handleDetailUpdate}
          />
        )
      }
      {/* Chỉ hiển thị K9Filters khi không phải là Home tab */}
      {!isHome && (
        <K9Filters
          filters={filters}
          onFilterChange={onFilterChange}
          onSearchChange={onSearchChange}
          filterConfig={filterConfig}
          activeTab={activeTab}
          showBookmarkFilter={true}
          onBookmarkFilterChange={handleBookmarkFilterChange}
          bookmarkFilter={bookmarkFilter}
          showReadFilter={true}
          onReadFilterChange={handleReadFilterChange}
          readFilter={readFilter}
          showImportantFilter={true}
          showQuizStatusFilter={true}
          onQuizStatusFilterChange={handleQuizStatusFilterChange}
          quizStatusFilter={quizStatusFilter}
          filteredCount={getCurrentFilteredCount()}
          totalCount={totalCount}
          categoryCounts={getCategoryCounts()}
          newsItems={newsItems}
          onItemSelect={handleItemSelectFromDropdown}
        />
      )}

      {isMobile ? (
        // Mobile view: Single panel with modal
        <div className={styles.newsPanel}>
          {loading ? (
            <div className={styles.emptyState}>
              <div>Đang tải dữ liệu...</div>
            </div>
          ) : getFilteredNewsWithFilters().length === 0 ? (
            <div className={styles.emptyState}>
              <div>Không tìm thấy tin tức phù hợp</div>
            </div>
          ) : (
            getFilteredNewsWithFilters().map(item => (
              <NewsItem
                key={item.id}
                item={(item)}
                expandedItem={item.id}
                showDetailId={showDetailId}
                onItemClick={() => handleItemSelect(item)}
                onShowDetail={onShowDetail}
                onOpenSource={onOpenSource}
                isBookmarked={(bookmarkedItems || []).includes(item.id)}
                onToggleBookmark={handleToggleBookmark}
                isRead={(readItems || []).includes(item.id)}
                onToggleRead={handleToggleRead}
                quizScore={questionScoreMap[item.id]}
                data-item-id={item.id}
                isHome={true}
              />
            ))
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
          {loading ? (
            <div className={styles.emptyState}>
              <div>Đang tải dữ liệu...</div>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className={styles.emptyState}>
              <div>Không tìm thấy tin tức phù hợp</div>
            </div>
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
                      height: '200px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      backgroundColor: isSelected ? '#e6f7ff' : '#fff',
                      boxShadow: isSelected ? '0 4px 12px rgba(24, 144, 255, 0.2)' : 'none',
                      padding: '16px'
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
                  >
                    <NewsItem
                      item={item}
                      expandedItem={item.id}
                      showDetailId={showDetailId}
                      onItemClick={() => handleGridItemClick(item)}
                      onShowDetail={() => handleGridItemClick(item)}
                      onOpenSource={onOpenSource}
                      isBookmarked={(bookmarkedItems || []).includes(item.id)}
                      onToggleBookmark={handleToggleBookmark}
                      isRead={(readItems || []).includes(item.id)}
                      onToggleRead={handleToggleRead}
                      quizScore={questionScoreMap[item.id]}
                      data-item-id={item.id}
                      isHome={true}
                      isGridView={true}
                    />
                  </div>
                  );
                })}
              </div>
              {/* Loading indicator */}
              {renderedCount < filteredItems.length && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  <div>Đang tải thêm...</div>
                </div>
              )}
            </>
          )}

          {/* Grid Modal */}
          <Modal
            title={
              selectedItem && getTabDisplayName && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    color: '#262626'
                  }}>
                    <span style={{ fontSize: '18px' }}>{getTabDisplayName(activeTab)}</span>
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
            onCancel={() => {setSelectedItem(null); updateURL && updateURL({ item: null })}}
            footer={null}
            width={selectedItem?.hasTitle ? 1400 : 1000}
            destroyOnClose={true}
            maskClosable={true}
            closable={true}
            className={newsTabStyles.modalContent}
            style={{
              top: '0px' , paddingBottom: '0px'
            }}
          >
            <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'auto', position: 'relative' }}>
              <div style={{ flex: 1, padding: '20px' }}>
                {renderContentPanel(selectedItem)}
              </div>
              {selectedItem?.hasTitle && (
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
            {loading ? (
              <div className={styles.emptyState}>
                <div>Đang tải dữ liệu...</div>
              </div>
            ) : getFilteredNewsWithFilters().length === 0 ? (
              <div className={styles.emptyState}>
                <div>Không tìm thấy tin tức phù hợp</div>
              </div>
            ) : (
              getFilteredNewsWithFilters().map(item => (
                <HomeItem
                  key={item.id}
                  item={item}
                  expandedItem={item.id}
                  showDetailId={showDetailId}
                  onItemClick={() => handleItemSelect(item)}
                  onShowDetail={onShowDetail}
                  onOpenSource={onOpenSource}
                  isBookmarked={(bookmarkedItems || []).includes(item.id)}
                  onToggleBookmark={handleToggleBookmark}
                  isRead={(readItems || []).includes(item.id)}
                  onToggleRead={handleToggleRead}
                  isSelected={selectedItem?.id === item.id}
                  quizScore={questionScoreMap[item.id]}
                  data-item-id={item.id}
                  isHome={true}
                />
              ))
            )}
          </div>

          <div className={styles.rightPanelHome}>
            {selectedItem ? (
              renderContentPanel(selectedItem)
            ) : (
              <div className={styles.emptyContentState}>
                <div className={styles.emptyContentIcon}>📰</div>
                <h3>Chọn một bài viết để xem nội dung</h3>
                <p>Nhấp vào bất kỳ bài viết nào ở bên trái để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeTab;
