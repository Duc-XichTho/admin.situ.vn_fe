import React, { useState, useEffect, useContext } from 'react';
import { MyContext } from '../../../MyContext';
import {getCurrentUserLogin, updateUser} from '../../../apis/userService';
import styles from '../K9.module.css';
import K9Filters from './K9Filters';
import StoryItem from './StoryItem';

const StoryTab = ({
  loading,
  filteredStories,
  filters,
  expandedItem,
  showDetailId,
  currentPlayingId,
  isPlaying,
  isLoading,
  onFilterChange,
  onSearchChange,
  onItemClick,
  onShowDetail,
  onPlayStory,
  onStopStory,
  totalCount = 0,
  storyItems = []
}) => {

  // Bookmark states
  const [bookmarkedItems, setBookmarkedItems] = useState([]);
  const [bookmarkFilter, setBookmarkFilter] = useState('all');

  const fetchFavorites = async () => {
    try {
      const user = (await getCurrentUserLogin()).data;
      setBookmarkedItems(user.info?.bookmarks_story || []);
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
        await updateUser(user.email, {
          info: {
            ...user.info,
            bookmarks_story: newBookmarkedItems
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

  // Filter stories based on bookmark filter
  const getFilteredStoriesWithBookmark = () => {
    if (bookmarkFilter === 'bookmarked') {
      return filteredStories.filter(item => (bookmarkedItems || []).includes(item.id));
    }
    return filteredStories;
  };

  // Get current filtered count
  const getCurrentFilteredCount = () => {
    return getFilteredStoriesWithBookmark().length;
  };

  // Lấy danh sách đã lọc theo các điều kiện khác, KHÔNG filter theo category
  const getStoryListForCategoryCount = () => {
    let list = storyItems.filter(item => item.status === 'published');
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
    const list = getStoryListForCategoryCount();
    return filterConfig.categories.map(cat => ({
      key: cat.key,
      label: cat.label,
      count: cat.key === 'all'
        ? list.length
        : list.filter(item => item.category === cat.key).length
    }));
  };

  const filterConfig = {
    searchPlaceholder: "Tìm kiếm câu chuyện...",
    categories: [
      { key: 'all', label: 'Tất cả' },
      // { key: 'Podcast', label: 'Podcast' },
      { key: 'Bài viết', label: 'Bài viết' },
    ],
    showTimeFilter: true,
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
        ) : getFilteredStoriesWithBookmark().length === 0 ? (
          <div className={styles.emptyState}>
            <div>Không tìm thấy câu chuyện phù hợp</div>
          </div>
        ) : (
          getFilteredStoriesWithBookmark().map(item => (
            <StoryItem
              key={item.id}
              item={item}
              expandedItem={item.id}
              showDetailId={showDetailId}
              currentPlayingId={currentPlayingId}
              isPlaying={isPlaying}
              isLoading={isLoading}
              // onItemClick={onItemClick} // Remove expansion logic
              onShowDetail={onShowDetail}
              onPlayStory={onPlayStory}
              onStopStory={onStopStory}
              isBookmarked={(bookmarkedItems || []).includes(item.id)}
              onToggleBookmark={handleToggleBookmark}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default StoryTab;
