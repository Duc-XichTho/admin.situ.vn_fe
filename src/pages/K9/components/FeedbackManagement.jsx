import React, { useEffect, useState, useMemo } from 'react';
import { Table, Input, Select, Space, Button, Tag, Modal, Tooltip, Card, Statistic, Divider, Typography, Rate, Tabs, message, InputNumber } from 'antd';
import { getFeedback, createFeedback } from '../../../apis/feedbackService.jsx';
import { formatDateToDDMMYYYY, formatDateFromTimestamp, createTimestamp } from '../../../generalFunction/format.js';
import styles from './FeedbackManagement.module.css';
import { useNavigate } from 'react-router-dom';
import { ReloadOutlined } from '@ant-design/icons';
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const normalizeSource = (s) => {
  const v = String(s || '').toLowerCase();
  if (v === 'k9-home' || v === 'home') return 'home';
  if (v === 'k9-casetraining' || v === 'casetraining' || v === 'case training') return 'caseTraining';
  if (v === 'k9-news' || v === 'stream' || v === 'news') return 'stream';
  if (v === 'k9-longform' || v === 'longform' || v === 'long form') return 'longForm';
  return v;
};

const FeedbackManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [visibleDetail, setVisibleDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(1000);
  const [activeTab, setActiveTab] = useState('all');
  const [visibleContentRatings, setVisibleContentRatings] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [lowRatingFilter, setLowRatingFilter] = useState(false);
  const [buffingRating, setBuffingRating] = useState(false);
  const [visibleBuffModal, setVisibleBuffModal] = useState(false);
  const [buffingContentId, setBuffingContentId] = useState(null);
  const [buffingContentName, setBuffingContentName] = useState(null);
  const [buffCount, setBuffCount] = useState(5); // Số lần rating
  const [buffRatingValue, setBuffRatingValue] = useState(5); // Số sao
  const [commentTypeFilter, setCommentTypeFilter] = useState('all'); // Filter theo loại comment: 'all', 'user', 'admin'

  const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getFeedback();
        const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        setFeedbacks(list);
      } catch (e) {
        setFeedbacks([]);
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
  
    fetchData();
  }, []);

  useEffect(() => {
    // Reset to first page when filters/search change
    setCurrentPage(1);
  }, [search, sourceFilter, commentTypeFilter]);
console.log(feedbacks);
  const getFiltered = () => {
    let list = Array.isArray(feedbacks) ? feedbacks : [];
    
    // Filter by source
    if (sourceFilter !== 'all') {
      list = list.filter(f => normalizeSource(f.source_tab) === sourceFilter);
    }
    
    // Filter by comment type (user comment vs admin buff)
    if (commentTypeFilter !== 'all') {
      if (commentTypeFilter === 'user') {
        // Chỉ lấy comment của user (không phải admin buff)
        list = list.filter(f => {
          return !f.desc || f.desc.toLowerCase() !== 'admin buff';
        });
      } else if (commentTypeFilter === 'admin') {
        // Chỉ lấy admin buff
        list = list.filter(f => {
          return f.desc && f.desc.toLowerCase() === 'admin buff';
        });
      }
    }
    
    // General search (tìm trong tất cả các trường)
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f => {
        return [
          f.id,
          f.k9Content_Id,
          f.user_id,
          f.user_name,
          f.k9_name,
          f.phone,
          f.email,
          f.desc,
          f.rating,
          f.k9_tag4,
          normalizeSource(f.source_tab),
          f.createdAt,
        ].some(v => String(v || '').toLowerCase().includes(q));
      });
    }
    
    return list;
  };

  const filtered = getFiltered();

  const calcStats = () => {
    const total = feedbacks.length;
    const bySource = feedbacks.reduce((acc, f) => {
      const k = normalizeSource(f.source_tab) || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return { total, bySource };
  };

  const stats = calcStats();

  // Group feedbacks by content for "Quản lý theo bài" tab
  const contentRatings = useMemo(() => {
    const ratingsOnly = feedbacks.filter(f => f.rating != null && f.rating >= 1 && f.rating <= 5);
    const grouped = ratingsOnly.reduce((acc, f) => {
      const contentId = f.k9Content_Id;
      if (!contentId) return acc;
      
      if (!acc[contentId]) {
        acc[contentId] = {
          contentId,
          contentName: f.k9_name || 'N/A',
          sourceTab: f.source_tab,
          tag4: f.k9_tag4,
          ratings: [],
          totalRatings: 0,
          averageRating: 0
        };
      }
      
      acc[contentId].ratings.push(f);
      return acc;
    }, {});
    
    // Calculate average and total for each content
    return Object.values(grouped).map(content => {
      const validRatings = content.ratings.filter(r => r.rating != null && r.rating >= 1 && r.rating <= 5);
      const sum = validRatings.reduce((s, r) => s + r.rating, 0);
      const count = validRatings.length;
      
      return {
        ...content,
        totalRatings: count,
        averageRating: count > 0 ? sum / count : 0
      };
    });
  }, [feedbacks]);

  // Filter content ratings by low rating
  const filteredContentRatings = useMemo(() => {
    let filtered = contentRatings;
    
    if (lowRatingFilter) {
      filtered = filtered.filter(c => c.averageRating < 4.0);
    }
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => {
        return [
          c.contentId,
          c.contentName,
          c.sourceTab,
          c.tag4
        ].some(v => String(v || '').toLowerCase().includes(q));
      });
    }
    
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(c => normalizeSource(c.sourceTab) === sourceFilter);
    }
    
    // Sort by average rating (low to high)
    return filtered.sort((a, b) => a.averageRating - b.averageRating);
  }, [contentRatings, lowRatingFilter, search, sourceFilter]);

  // Open buff modal
  const handleOpenBuffModal = (contentId, contentName) => {
    setBuffingContentId(contentId);
    setBuffingContentName(contentName);
    setBuffCount(5);
    setBuffRatingValue(5);
    setVisibleBuffModal(true);
  };

  // Handle buff rating - create multiple feedbacks with same rating
  const handleBuffRating = async () => {
    if (!buffingContentId) {
      message.warning('Vui lòng chọn bài');
      return;
    }

    if (!buffCount || buffCount < 1) {
      message.warning('Số lần rating phải lớn hơn 0');
      return;
    }

    if (!buffRatingValue || buffRatingValue < 1 || buffRatingValue > 5) {
      message.warning('Rating phải từ 1 đến 5');
      return;
    }

    setBuffingRating(true);
    try {
      // Get source tab from selected content
      const content = contentRatings.find(c => c.contentId === buffingContentId);
      const sourceTab = content?.sourceTab || 'stream';

      // Create all feedbacks with same rating
      const promises = Array.from({ length: buffCount }, () => {
        const payload = {
          k9Content_Id: buffingContentId,
          rating: buffRatingValue,
          desc: 'admin buff',
          source_tab: sourceTab,
          createdAt: createTimestamp(),
        };
        return createFeedback(payload);
      });

      await Promise.all(promises);
      message.success(`Đã thêm ${buffCount} System ratings (${buffRatingValue} sao) cho bài "${buffingContentName}"`);
      
      // Refresh data after buffing
      await fetchData();
      
      // Close modals
      setVisibleBuffModal(false);
      setBuffingContentId(null);
      setBuffingContentName(null);
      setBuffCount(5);
      setBuffRatingValue(5);
      
      // Close content ratings modal if open
      if (visibleContentRatings && selectedContent?.contentId === buffingContentId) {
        setVisibleContentRatings(false);
        setSelectedContent(null);
      }
    } catch (error) {
      message.error('Lỗi khi buff rating: ' + (error.response?.data?.message || error.message));
    } finally {
      setBuffingRating(false);
    }
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      fixed: 'left',
      render: (v) => <span>{formatDateToDDMMYYYY(v) || '-'}</span>
    },
    {
      title: 'Người gửi',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 200,
      render: (v, r) => (
        <div>
          <div>{v || '-'}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>ID: {r.user_id ?? '-'}</Text>
        </div>
      )
    },
    {
      title: 'Bài',
      dataIndex: 'k9_name',
      key: 'k9_name',
      width: 300,
      ellipsis: { showTitle: false },
      render: (text, r) => (
        <Tooltip placement="topLeft" title={text}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text || '-'}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>ID: {r.k9Content_Id ?? '-'}</Text>
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Tag4',
      dataIndex: 'k9_tag4',
      key: 'k9_tag4',
      width: 200,
      ellipsis: { showTitle: false },
      render: (tag4, r) => {
        if (!tag4) return <Text type="secondary">-</Text>;
        const tags = Array.isArray(tag4) ? tag4 : (typeof tag4 === 'string' ? tag4.split(',').map(t => t.trim()) : []);
        if (tags.length === 0) return <Text type="secondary">-</Text>;
        
        return (
          <Tooltip placement="topLeft" title={tags.join(', ')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {tags.slice(0, 2).map((tag, idx) => (
                <Tag key={idx} color="purple" style={{ margin: 0 }}>
                  {tag}
                </Tag>
              ))}
              {tags.length > 2 && (
                <Tag color="default" style={{ margin: 0 }}>
                  +{tags.length - 2}
                </Tag>
              )}
            </div>
          </Tooltip>
        );
      }
    },
    {
      title: 'Comment',
      dataIndex: 'desc',
      key: 'desc',
      ellipsis: { showTitle: false },
      render: (text, record) => {
        const isAdminBuff = text && text.toLowerCase() === 'admin buff';
        return (
          <Tooltip placement="topLeft" title={text || '(Trống)'}>
            <span style={{ 
              display: 'inline-block', 
              maxWidth: 520, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              fontStyle: text ? 'normal' : 'italic', 
              color: isAdminBuff ? '#faad14' : (text ? undefined : '#999'),
              fontWeight: isAdminBuff ? 500 : 'normal'
            }}>
              {text || '(Trống)'}
              {isAdminBuff && <Tag color="orange" style={{ marginLeft: '8px', fontSize: '11px' }}>Admin</Tag>}
            </span>
          </Tooltip>
        );
      }
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 160,
      render: (rating, record) => {
        if (rating != null && rating >= 1 && rating <= 5) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Rate disabled value={rating} style={{ fontSize: 14 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>({rating})</Text>
            </div>
          );
        }
        return <Text type="secondary">-</Text>;
      }
    },
    {
      title: 'Nguồn',
      dataIndex: 'source_tab',
      key: 'source_tab',
      width: 140,
      render: (v) => {
        const nv = normalizeSource(v);
        return nv ? <Tag color="blue">{nv === 'home' ? 'Home' : nv === 'caseTraining' ? 'Case Training' : nv === 'stream' ? 'Lý thuyết' : nv === 'longForm' ? 'Kho tài nguyên' : nv}</Tag> : <Tag>-</Tag>;
      }
    },
  ];

  // Columns for content ratings table
  const contentRatingColumns = [
    {
      title: 'Bài',
      dataIndex: 'contentName',
      key: 'contentName',
      width: 300,
      ellipsis: { showTitle: false },
      render: (text, record) => (
        <Tooltip placement="topLeft" title={text}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text || '-'}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>ID: {record.contentId ?? '-'}</Text>
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Tag4',
      dataIndex: 'tag4',
      key: 'tag4',
      width: 200,
      ellipsis: { showTitle: false },
      render: (tag4) => {
        if (!tag4) return <Text type="secondary">-</Text>;
        const tags = Array.isArray(tag4) ? tag4 : (typeof tag4 === 'string' ? tag4.split(',').map(t => t.trim()) : []);
        if (tags.length === 0) return <Text type="secondary">-</Text>;
        
        return (
          <Tooltip placement="topLeft" title={tags.join(', ')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {tags.slice(0, 2).map((tag, idx) => (
                <Tag key={idx} color="purple" style={{ margin: 0 }}>
                  {tag}
                </Tag>
              ))}
              {tags.length > 2 && (
                <Tag color="default" style={{ margin: 0 }}>
                  +{tags.length - 2}
                </Tag>
              )}
            </div>
          </Tooltip>
        );
      }
    },
    {
      title: 'Điểm trung bình',
      dataIndex: 'averageRating',
      key: 'averageRating',
      width: 150,
      sorter: (a, b) => a.averageRating - b.averageRating,
      render: (rating) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Rate disabled value={rating} allowHalf style={{ fontSize: 16 }} />
          <Text strong style={{ fontSize: 14, color: rating < 4.0 ? '#ff4d4f' : rating >= 4.5 ? '#52c41a' : '#faad14' }}>
            {rating.toFixed(2)}
          </Text>
        </div>
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'totalRatings',
      key: 'totalRatings',
      width: 100,
      sorter: (a, b) => a.totalRatings - b.totalRatings,
      render: (count) => <Text>{count}</Text>
    },
    {
      title: 'Nguồn',
      dataIndex: 'sourceTab',
      key: 'sourceTab',
      width: 140,
      render: (v) => {
        const nv = normalizeSource(v);
        return nv ? <Tag color="blue">{nv === 'home' ? 'Home' : nv === 'caseTraining' ? 'Case Training' : nv === 'stream' ? 'Lý thuyết' : nv === 'longForm' ? 'Kho tài nguyên' : nv}</Tag> : <Tag>-</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelectedContent(record);
              setVisibleContentRatings(true);
            }}
          >
            Xem chi tiết
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleOpenBuffModal(record.contentId, record.contentName)}
          >
            Buff rating
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.headerCard} bodyStyle={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Button 
              onClick={() => navigate(-1)}
              style={{ 
                borderRadius: '8px',
                height: '36px',
                padding: '0 16px',
                fontWeight: 500
              }}
            >
              ← Quay lại
            </Button>
            <Text style={{ fontSize: '14px', color: '#666' }}>
              Tổng: <Text strong>{stats.total}</Text> đánh giá
            </Text>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchData}
              loading={loading}
              style={{ 
                borderRadius: '8px',
                height: '36px'
              }}
            >
              Làm mới
            </Button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <Input
              placeholder={activeTab === 'all' ? "Tìm kiếm (tên bài, người gửi, email, phone, id...)" : "Tìm kiếm (tên bài, ID...)"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ 
                width: activeTab === 'all' ? 280 : 260,
                borderRadius: '8px',
                height: '36px'
              }}
              prefix={<span style={{ color: '#999' }}>🔍</span>}
            />
            
            {activeTab === 'all' && (
              <Select
                value={commentTypeFilter}
                onChange={setCommentTypeFilter}
                style={{ 
                  width: 180,
                  borderRadius: '8px',
                  height: '36px'
                }}
                placeholder="Loại comment"
              >
                <Option value="all">Tất cả comment</Option>
                <Option value="user">Comment của user</Option>
                <Option value="admin">Admin buff</Option>
              </Select>
            )}
            
            <Select 
              value={sourceFilter} 
              onChange={setSourceFilter} 
              style={{ 
                width: 160,
                borderRadius: '8px',
                height: '36px'
              }}
            >
              <Option value="all">Tất cả nguồn</Option>
              <Option value="stream">Lý thuyết</Option>
              <Option value="longForm">Kho tài nguyên</Option>
              <Option value="home">Home</Option>
              <Option value="caseTraining">Case Training</Option>
            </Select>
            
            {activeTab === 'byContent' && (
              <Select 
                value={lowRatingFilter ? 'low' : 'all'} 
                onChange={(val) => setLowRatingFilter(val === 'low')} 
                style={{ 
                  width: 160,
                  borderRadius: '8px',
                  height: '36px'
                }}
              >
                <Option value="all">Tất cả điểm</Option>
                <Option value="low">Điểm thấp (&lt; 4.0)</Option>
              </Select>
            )}
          </div>
        </div>
      </Card>

      <Card 
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(17, 24, 39, 0.04)',
          border: '1px solid #eef2f7'
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 16px' }}
          items={[
          {
            key: 'all',
            label: 'Tất cả đánh giá',
            children: (
              <div className={styles.tableWrap}>
                <Table
                  size="middle"
                  rowKey={(r) => r.id}
                  loading={loading}
                  dataSource={filtered}
                  columns={columns}
                  bordered
                  sticky
                  scroll={{ y: 'calc(100vh - 350px)', x: true }}
                  pagination={{
                    current: currentPage,
                    pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['100','500','1000','2000','5000'],
                    onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
                    onShowSizeChange: (page, size) => { setCurrentPage(1); setPageSize(size); },
                    showTotal: (t) => `${t} góp ý`,
                  }}
                />
              </div>
            )
          },
          {
            key: 'byContent',
            label: 'Quản lý theo bài',
            children: (
              <div className={styles.tableWrap}>
                <Table
                  size="middle"
                  rowKey={(r) => r.contentId}
                  loading={loading}
                  dataSource={filteredContentRatings}
                  columns={contentRatingColumns}
                  bordered
                  sticky
                  scroll={{ y: 'calc(100vh - 400px)', x: true }}
                  pagination={{
                    current: currentPage,
                    pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['50','100','200','500'],
                    onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
                    onShowSizeChange: (page, size) => { setCurrentPage(1); setPageSize(size); },
                    showTotal: (t) => `${t} bài`,
                  }}
                />
              </div>
            )
          }
        ]}
        />
      </Card>

      {/* Modal chi tiết feedback */}
      <Modal
        open={visibleDetail}
        title={
          <div>
            <Title level={5} style={{ margin: 0 }}>Chi tiết góp ý</Title>
            {selected?.source_tab && <Tag color="blue" style={{ marginTop: 6 }}>{normalizeSource(selected.source_tab)}</Tag>}
          </div>
        }
        onCancel={() => setVisibleDetail(false)}
        footer={null}
        width={760}
        destroyOnClose
        className={styles.detailModal}
      >
        {selected && (
          <div>
            <Space size={24} wrap>
              <div>
                <Text type="secondary">Thời gian</Text>
                <div>{formatDateFromTimestamp(selected.createdAt) || '-'}</div>
              </div>
              <div>
                <Text type="secondary">Bài</Text>
                <div style={{ maxWidth: 420 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.k9_name || '-'}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>ID: {selected.k9Content_Id ?? '-'}</Text>
                </div>
              </div>
              <div>
                <Text type="secondary">Người gửi</Text>
                <div>
                  <div>{selected.user_name || '-'}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>ID: {selected.user_id ?? '-'}</Text>
                </div>
              </div>
            </Space>

            <Divider style={{ margin: '16px 0' }} />

            <Space size={24} wrap>
              <div>
                <Text type="secondary">Email</Text>
                <div>{selected.email || '-'}</div>
              </div>
              <div>
                <Text type="secondary">Phone</Text>
                <div>{selected.phone || '-'}</div>
              </div>
              <div>
                <Text type="secondary">Trạng thái</Text>
                <div>{selected.show ? <Tag color="green">Hiện</Tag> : <Tag>Ẩn</Tag>}</div>
              </div>
            </Space>

            <Divider style={{ margin: '16px 0' }} />

            <Text type="secondary">Nội dung góp ý</Text>
            <Card size="small" style={{ marginTop: 8, background: '#fafafa' }} bodyStyle={{ whiteSpace: 'pre-wrap' }}>
              <Paragraph style={{ margin: 0 }}>{selected.desc || '-'}</Paragraph>
            </Card>

            {selected.rating != null && selected.rating >= 1 && selected.rating <= 5 && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div>
                  <Text type="secondary">Rating</Text>
                  <div style={{ marginTop: 8 }}>
                    <Rate disabled value={selected.rating} style={{ fontSize: 18 }} />
                    <Text style={{ marginLeft: 8 }}>({selected.rating}/5)</Text>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Modal chi tiết ratings của một bài */}
      <Modal
        open={visibleContentRatings}
        title={
          <div>
            <Title level={5} style={{ margin: 0 }}>Chi tiết đánh giá</Title>
            {selectedContent && (
              <>
                <div style={{ marginTop: 8 }}>
                  <Text strong>{selectedContent.contentName}</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>ID: {selectedContent.contentId}</Text>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Rate disabled value={selectedContent.averageRating} allowHalf style={{ fontSize: 16 }} />
                  <Text strong style={{ fontSize: 16 }}>
                    {selectedContent.averageRating.toFixed(2)} ({selectedContent.totalRatings} đánh giá)
                  </Text>
                </div>
              </>
            )}
          </div>
        }
        onCancel={() => {
          setVisibleContentRatings(false);
          setSelectedContent(null);
        }}
        footer={null}
        width={900}
        destroyOnClose
        className={styles.detailModal}
      >
        {selectedContent && (
          <div>
            <Table
              size="small"
              rowKey={(r) => r.id}
              dataSource={selectedContent.ratings}
              columns={[
                {
                  title: 'Người đánh giá',
                  dataIndex: 'user_name',
                  key: 'user_name',
                  width: 200,
                  render: (v, r) => (
                    <div>
                      <div>{v === 'System' ? <Tag color="purple">System</Tag> : (v || '-')}</div>
                      {r.user_id && <Text type="secondary" style={{ fontSize: 12 }}>ID: {r.user_id}</Text>}
                    </div>
                  )
                },
                {
                  title: 'Rating',
                  dataIndex: 'rating',
                  key: 'rating',
                  width: 150,
                  render: (rating) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Rate disabled value={rating} style={{ fontSize: 14 }} />
                      <Text>({rating})</Text>
                    </div>
                  )
                },
                {
                  title: 'Comment',
                  dataIndex: 'desc',
                  key: 'desc',
                  ellipsis: { showTitle: false },
                  render: (text) => (
                    <Tooltip placement="topLeft" title={text || '(Trống)'}>
                      <span style={{ fontStyle: text ? 'normal' : 'italic', color: text ? undefined : '#999' }}>
                        {text || '(Trống)'}
                      </span>
                    </Tooltip>
                  )
                },
                {
                  title: 'Thời gian',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  width: 130,
                  render: (v) => <span>{formatDateToDDMMYYYY(v) || '-'}</span>
                }
              ]}
              pagination={{ pageSize: 10 }}
            />
          </div>
        )}
      </Modal>

      {/* Modal Buff Rating */}
      <Modal
        open={visibleBuffModal}
        title={
          <div>
            <Title level={5} style={{ margin: 0 }}>Buff Rating</Title>
            {buffingContentName && (
              <div style={{ marginTop: 8 }}>
                <Text strong>{buffingContentName}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>ID: {buffingContentId}</Text>
              </div>
            )}
          </div>
        }
        onCancel={() => {
          setVisibleBuffModal(false);
          setBuffingContentId(null);
          setBuffingContentName(null);
          setBuffCount(5);
          setBuffRatingValue(5);
        }}
        onOk={handleBuffRating}
        okText="Thêm ratings"
        cancelText="Hủy"
        confirmLoading={buffingRating}
        width={500}
        destroyOnClose
      >
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
            Thêm System ratings cho bài này. Tất cả ratings sẽ có cùng số sao và desc = "admin buff"
          </Text>
          
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Số lần rating:
              </Text>
              <InputNumber
                min={1}
                max={100}
                value={buffCount}
                onChange={(value) => setBuffCount(value || 1)}
                style={{ width: '100%' }}
                placeholder="Nhập số lần rating"
              />
            </div>
            
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Số sao (cho tất cả các lần):
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <Rate
                  value={buffRatingValue}
                  onChange={setBuffRatingValue}
                  style={{ fontSize: 24 }}
                />
                <InputNumber
                  min={1}
                  max={5}
                  value={buffRatingValue}
                  onChange={(value) => setBuffRatingValue(value || 5)}
                  style={{ width: '100px' }}
                  precision={1}
                  step={0.5}
                />
                <Text type="secondary">/ 5</Text>
              </div>
            </div>
          </Space>
          
          <Divider />
          
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '4px',
            border: '1px solid #bae7ff'
          }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Sẽ tạo: <Text strong style={{ color: '#1890ff' }}>{buffCount}</Text> System ratings
            </Text>
            <Text type="secondary">
              Mỗi rating: <Text strong style={{ color: '#1890ff' }}>{buffRatingValue}</Text> sao
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FeedbackManagement;
