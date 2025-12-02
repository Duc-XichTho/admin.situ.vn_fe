import React, { useRef, useEffect } from 'react';
import { AgCharts } from 'ag-charts-community';
import styles from '../K9.module.css';
import { Paperclip } from 'lucide-react';
import { FileChartColumnIncreasing } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { FileList } from '../../../components/PreviewFile';
// Component để render một chart
const ChartContainer = ({ table, index }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const transformTableToChartData = (table) => {
    if (!table.data || Object.keys(table.data).length === 0) {
      return [];
    }

    return Object.entries(table.data)
      .map(([key, value]) => ({
        period: key,
        value: parseFloat(value) || 0,
        valueStr: value // Keep original string value for display
      }))
      .filter(item => item.value > 0); // Filter out zero values
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const chartData = transformTableToChartData(table);

    // Skip if no valid data
    if (chartData.length === 0) {
      return;
    }

    const options = {
      container: chartRef.current,
      data: chartData,
      title: {
        text: table.name || 'Bảng thông số',
      },
      
      series: [
        {
          type: 'line',
          xKey: 'period',
          yKey: 'value',
          yName: table.name || 'Giá trị',
          stroke: '#1890ff',
          strokeWidth: 3,
          marker: {
            enabled: true,
            size: 8,
            fill: '#1890ff',
            stroke: '#ffffff',
            strokeWidth: 2,
          },
          tooltip: {
            renderer: ({ datum }) => ({
              content: `${datum.period}: ${datum.valueStr}`,
            }),
          },
        },
      ],
      axes: [
        {
          type: 'category',
          position: 'bottom',
        },
        {
          type: 'number',
          position: 'left',
          title: {
            text: 'Giá trị',
          },
          label: {
            formatter: ({ value }) => {
              // Format numbers with commas
              return new Intl.NumberFormat('vi-VN').format(value);
            },
          },
        },
      ],
      legend: {
        enabled: false,
      },
      background: {
        fill: '#ffffff',
      },
      padding: {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60,
      },
    };

    // Create chart
    chartInstanceRef.current = AgCharts.create(options);

    // Cleanup function
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [table]);

  const chartData = transformTableToChartData(table);

            // Skip tables with no valid numeric data
          if (chartData.length === 0) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #e8e8e8'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#666' }}>
          {table.name || `Bảng ${index + 1}`}
        </h5>
        <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>
          Chưa có dữ liệu số để hiển thị biểu đồ
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      border: '1px solid #e8e8e8',
      overflow: 'hidden'
    }}>
      <div
        ref={chartRef}
        style={{
          height: '300px',
          width: '100%'
        }}
      />
    </div>
  );
};

// Component để render bảng thông số dưới dạng line chart
const TableCharts = ({ tables }) => {
  if (!tables || !Array.isArray(tables) || tables.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {tables.map((table, index) => (
          <ChartContainer
            key={table.id || index}
            table={table}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

const ReportItem = ({
  item,
  expandedItem,
  showDetailId,
  onItemClick,
  onShowDetail,
  onOpenFile,
  isBookmarked = false,
  onToggleBookmark,
}) => {
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

  let title = '';
  let urlReport = '';
  let category = '';
  let tables = [];

  try {
    const info = typeof item.info === 'string' ? JSON.parse(item.info) : item.info;
    title = info?.title || '';
    urlReport = info?.URLReport || '';
    category = item.category || '';
  } catch (error) {
    title = '';
  }

  // Parse tables data
  try {
    if (item.tables) {
      tables = typeof item.tables === 'string' ? JSON.parse(item.tables) : item.tables;
      if (!Array.isArray(tables)) {
        tables = [];
      }
    }
  } catch (error) {
    console.error('Error parsing tables:', error);
    tables = [];
  }

  // If no title, use first 30 characters of summary1
  if (!title && item.summary1) {
    const summaryText = typeof item.summary1 === 'string' ? item.summary1 : JSON.stringify(item.summary1);
    title = summaryText.length > 30 ? summaryText.substring(0, 30) + '...' : summaryText;
  }

  // Fallback if still no title
  if (!title) {
    title = 'Không có tiêu đề';
  }

  return (
    <div
      className={`${styles.newsItem} ${isBookmarked ? styles.hasBookmark : ''}`}
      onClick={(e) => onShowDetail(item, e)}
    >
      <div className={styles.newsContent}>
        <div className={styles.newsTitle}> <FileChartColumnIncreasing size={18} style={{marginRight: 5, transform: 'translateY(2px)'}}/>{title}</div>
        {/* Always expanded by default, so show expanded content */}
        <div className={styles.newsExpandedContent}>
          <div className={styles.newsSummary2}>
            {item.summary1 ? (
                <div
                    className={styles.markdownContent}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(marked.parse(typeof item.summary2 === 'string' ? item.summary1 : JSON.stringify(item.summary1) || '')),
                    }}
                />
            ) : (
              <div className={styles.noSummary}>Không có tóm tắt</div>
            )}
          </div>

          {/* Display files if available */}
          {item.fileUrls && Array.isArray(item.fileUrls) && item.fileUrls.length > 0 && (
            <div style={{ marginTop: '12px', marginBottom: '12px' }}>
              <FileList
                fileUrls={item.fileUrls}
                title="File đính kèm"
                showCount={true}
              />
            </div>
          )}

          <div className={styles.newsMeta}>
            <span className={styles.newsTime}>
              {getTimeAgo(item.created_at)}
            </span>
            {/* Category */}
            {category && (
              <span className={styles.categoryTag}>
                <span className={styles.tagItem}>
                  {category}
                </span>
              </span>
            )}
            {/* File attachment indicator */}
            {urlReport && (
              <span className={styles.fileIndicator} title="File đính kèm"
                    onClick={(e) => onOpenFile(item, e)}>
                <Paperclip size={15}/>
                <span>Xem chi tiết báo cáo</span>
              </span>
            )}
            {/* File URLs indicator */}
            {item.fileUrls && Array.isArray(item.fileUrls) && item.fileUrls.length > 0 && (
              <span className={styles.fileIndicator} title={`${item.fileUrls.length} file đính kèm`}>
                <Paperclip size={12} />
                {item.fileUrls.length}
              </span>
            )}
          </div>

          {/* Detail section when expanded */}
          {showDetailId === item.id && (
            <div className={styles.newsDetail}>
              <div className={styles.detailContent}>
                {/* Summary2 Content */}
                {item.summary2 && (
                  <>
                    <h4>Chi tiết:</h4>
                    <div className={styles.detailText}>
                      <div
                          className={styles.markdownContent}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(marked.parse(typeof item.summary2 === 'string' ? item.summary2 : JSON.stringify(item.summary2) || '')),
                          }}
                      />
                    </div>
                  </>
                )}

                {/* File URLs Content */}
                {item.fileUrls && Array.isArray(item.fileUrls) && item.fileUrls.length > 0 && (
                  <>
                    <h4>File đính kèm:</h4>
                    <div className={styles.detailText}>
                      <FileList
                        fileUrls={item.fileUrls}
                        title=""
                        showCount={false}
                      />
                    </div>
                  </>
                )}

                {/* Tables Content */}
                {tables.length > 0 && (
                  <>
                    <h4>Bảng thông số:</h4>
                    <div className={styles.detailText}>
                      <TableCharts tables={tables} />
                    </div>
                  </>
                )}

                {/* Show message if no content */}
                {!item.summary2 && tables.length === 0 && !item.fileUrls && (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#999',
                    fontStyle: 'italic'
                  }}>
                    Chưa có nội dung chi tiết
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions on the right */}
      <div className={styles.newsActions}>
        <button
            className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`}
          title={isBookmarked ? 'Bỏ bookmark' : 'Thêm bookmark'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(item);
          }}
        >
          {isBookmarked ? '🔖' : '📖'}
        </button>
      </div>
    </div>
  );
};

export default ReportItem;
