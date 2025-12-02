import React, { useState, useEffect, useContext } from 'react';
import { MyContext } from '../../../MyContext';
import {getCurrentUserLogin, updateUser} from '../../../apis/userService';
import styles from '../K9.module.css';
import K9Filters from './K9Filters';
import LibraryItem from './LibraryItem';

const LibraryTab = ({ 
  loading, 
  filteredLibrary, 
  filters, 
  onFilterChange, 
  onSearchChange, 
  onItemClick,
  totalCount = 0,
  libraryItems = []
}) => {
  // Bookmark states
  const [bookmarkedItems, setBookmarkedItems] = useState([]);
  const [bookmarkFilter, setBookmarkFilter] = useState('all');

  // Load bookmarked items from user info

  const fetchFavorites = async () => {
    try {
      const user = (await getCurrentUserLogin()).data;
      setBookmarkedItems(user.info?.bookmarks_library || []);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu bookmark:', error);
      setBookmarkedItems([]);
    }
  };

  useEffect(() => {
    fetchFavorites();
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
            bookmarks_library: newBookmarkedItems
          }
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert state if update fails
      setBookmarkedItems(bookmarkedItems || []);
    }
  };

  const handleBookmarkFilterChange = (value) => {
    setBookmarkFilter(value);
  };

  // Filter library based on bookmark filter
  const getFilteredLibraryWithBookmark = () => {
    if (bookmarkFilter === 'bookmarked') {
      return filteredLibrary.filter(item => (bookmarkedItems || []).includes(item.id));
    }
    return filteredLibrary;
  };

  // Get current filtered count
  const getCurrentFilteredCount = () => {
    return getFilteredLibraryWithBookmark().length;
  };

  // Lấy danh sách đã lọc theo các điều kiện khác, KHÔNG filter theo category
  const getLibraryListForCategoryCount = () => {
    let list = libraryItems.filter(item => item.status === 'published');
    if (bookmarkFilter === 'bookmarked') {
      list = list.filter(item => (bookmarkedItems || []).includes(item.id));
    }
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      list = list.filter(item => {
        const searchableText = `${item.title} ${item.summary || ''} ${item.description || ''} ${item.detail || ''}`.toLowerCase();
        return searchableText.includes(searchTerm);
      });
    }
    return list;
  };

  // Tính số lượng từng danh mục đúng logic
  const getCategoryCounts = () => {
    const list = getLibraryListForCategoryCount();
    return filterConfig.categories.map(cat => ({
      key: cat.key,
      label: cat.label,
      count: cat.key === 'all'
        ? list.length
        : list.filter(item => item.category === cat.key).length
    }));
  };

  const filterConfig = {
    searchPlaceholder: "Tìm kiếm trong thư viện...",
    categories: [
      { key: 'all', label: 'Tất cả' },
      { key: 'Ý tưởng khởi nghiệp', label: 'Ý tưởng khởi nghiệp' },
      { key: 'Tips khởi nghiệp', label: 'Tips khởi nghiệp' },
      { key: 'Sáng tạo khác', label: 'Sáng tạo khác' }
    ],
    showTimeFilter: false,
    showSentimentFilter: false
  };

  return (
    <div className={styles.tabContent}>
      <K9Filters 
        filters={filters}
        onFilterChange={onFilterChange}
        onSearchChange={onSearchChange}
        filterConfig={filterConfig}
        showBookmarkFilter={true}
        onBookmarkFilterChange={handleBookmarkFilterChange}
        bookmarkFilter={bookmarkFilter}
        filteredCount={getCurrentFilteredCount()}
        totalCount={totalCount}
        categoryCounts={getCategoryCounts()}
      />

      <div className={styles.newsPanel}>
        {loading ? (
          <div className={styles.emptyState}>
            <div>Đang tải dữ liệu...</div>
          </div>
        ) : getFilteredLibraryWithBookmark().length === 0 ? (
          <div className={styles.emptyState}>
            <div>Không tìm thấy tài liệu phù hợp</div>
          </div>
        ) : (
          getFilteredLibraryWithBookmark().map(item => (
            <LibraryItem
              key={item.id}
              item={item}
              expandedItem={item.id}
              // onItemClick={onItemClick} // Remove expansion logic
              isBookmarked={(bookmarkedItems || []).includes(item.id)}
              onToggleBookmark={handleToggleBookmark}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default LibraryTab; 