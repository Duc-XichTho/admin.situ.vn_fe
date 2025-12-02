import React, { useState, useEffect, useContext } from 'react';
import { MyContext } from '../../../MyContext';
import { getCurrentUserLogin, updateUser } from '../../../apis/userService';
import styles from '../K9.module.css';
import K9Filters from './K9Filters';
import ReportItem from './ReportItem';

const ReportTab = ({
  loading,
  filteredReports,
  filters,
  expandedItem,
  showDetailId,
  onFilterChange,
  onSearchChange,
  onItemClick,
  onShowDetail,
  onOpenFile,
  activeTab,
  totalCount = 0,
  reportItems = []
}) => {

  // Bookmark states
  const [bookmarkedItems, setBookmarkedItems] = useState([]);
  const [bookmarkFilter, setBookmarkFilter] = useState('all');

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

  // Apply CompanySummary filter to all data
  const filteredReportsWithoutCompanySummary = filterCompanySummaryRecords(filteredReports);
  const reportItemsWithoutCompanySummary = filterCompanySummaryRecords(reportItems);

  // Load bookmarked items from user info
  const fetchFavorites = async () => {
    try {
      const user = (await getCurrentUserLogin()).data;
      setBookmarkedItems(user.info?.bookmarks_report || []);
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
            bookmarks_report: newBookmarkedItems
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

  // Filter reports based on bookmark filter
  const getFilteredReportsWithBookmark = () => {
    if (bookmarkFilter === 'bookmarked') {
      return filteredReportsWithoutCompanySummary.filter(item => (bookmarkedItems || []).includes(item.id));
    }
    return filteredReportsWithoutCompanySummary;
  };

  // Get current filtered count
  const getCurrentFilteredCount = () => {
    return getFilteredReportsWithBookmark().length;
  };

  // Extract categories from report items
  const extractCategories = () => {
    const categorySet = new Set();

    // Always extract categories from all items to show all available categories
    reportItemsWithoutCompanySummary.forEach(item => {
      if (item.category) {
        categorySet.add(item.category);
      }
    });
    return Array.from(categorySet).filter(item => item !== 'Doanh nghiệp').sort();
  };

  // Lấy danh sách đã lọc theo các điều kiện khác, KHÔNG filter theo category
  const getReportListForCategoryCount = () => {
    // Use reportItemsWithoutCompanySummary (complete dataset) instead of filteredReports to get accurate counts
    let list = reportItemsWithoutCompanySummary;
    if (bookmarkFilter === 'bookmarked') {
      list = list.filter(item => (bookmarkedItems || []).includes(item.id));
    }
    return list;
  };

  // Tính số lượng từng danh mục đúng logic
  const getCategoryCounts = () => {
    const list = getReportListForCategoryCount();
    const categories = extractCategories();

    return [
      { key: 'all', label: 'Tất cả', count: reportItemsWithoutCompanySummary.length },
      ...categories.map(category => ({
        key: category,
        label: category,
        count: list.filter(item => item.category === category).length
      }))
    ];
  };

  const filterConfig = {
    searchPlaceholder: "Tìm kiếm báo cáo...",
    categories: [
      { key: 'all', label: 'Tất cả' },
      ...extractCategories().map(category => ({ key: category, label: category }))
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
        activeTab={activeTab}
        showBookmarkFilter={true}
        onBookmarkFilterChange={handleBookmarkFilterChange}
        bookmarkFilter={bookmarkFilter}
        filteredCount={getCurrentFilteredCount()}
        totalCount={reportItemsWithoutCompanySummary.length}
        categoryCounts={getCategoryCounts()}
      />
      <div className={styles.newsPanel}>
        {loading ? (
          <div className={styles.emptyState}>
            <div>Đang tải dữ liệu...</div>
          </div>
        ) : getFilteredReportsWithBookmark().length === 0 ? (
          <div className={styles.emptyState}>
            <div>Không tìm thấy báo cáo phù hợp</div>
          </div>
        ) : (
          getFilteredReportsWithBookmark().map(item => (
            <ReportItem
              key={item.id}
              item={item}
              expandedItem={item.id}
              showDetailId={showDetailId}
              onShowDetail={onShowDetail}
              onOpenFile={onOpenFile}
              isBookmarked={(bookmarkedItems || []).includes(item.id)}
              onToggleBookmark={handleToggleBookmark}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ReportTab;
