import React, { useEffect, useState } from 'react';
import { Table, Input, Select, Space, Button, Tag, Modal, Tooltip, Card, Statistic, Divider, Typography } from 'antd';
import { getFeedback } from '../../../apis/feedbackService.jsx';
import { formatDateFromTimestamp } from '../../../generalFunction/format.js';
import styles from './FeedbackManagement.module.css';
import { useNavigate } from 'react-router-dom';

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
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
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
    fetchData();
  }, []);

  useEffect(() => {
    // Reset to first page when filters/search change
    setCurrentPage(1);
  }, [search, sourceFilter]);

  const getFiltered = () => {
    let list = Array.isArray(feedbacks) ? feedbacks : [];
    if (sourceFilter !== 'all') {
      list = list.filter(f => normalizeSource(f.source_tab) === sourceFilter);
    }
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

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      fixed: 'left',
      render: (v) => <span>{formatDateFromTimestamp(v) || '-'}</span>
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
      title: 'Liên hệ',
      key: 'contact',
      width: 260,
      render: (_, r) => (
        <div style={{ lineHeight: 1.4 }}>
          <div><Text type="secondary">Email:</Text> {r.email || '-'}</div>
          <div><Text type="secondary">Phone:</Text> {r.phone || '-'}</div>
        </div>
      )
    },
    {
      title: 'Nội dung góp ý',
      dataIndex: 'desc',
      key: 'desc',
      ellipsis: { showTitle: false },
      render: (text) => (
        <Tooltip placement="topLeft" title={text || '(Trống)'}>
          <span style={{ display: 'inline-block', maxWidth: 520, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: text ? 'normal' : 'italic', color: text ? undefined : '#999' }}>
            {text || '(Trống)'}
          </span>
        </Tooltip>
      )
    },
    {
      title: 'Nguồn',
      dataIndex: 'source_tab',
      key: 'source_tab',
      width: 140,
      render: (v) => {
        const nv = normalizeSource(v);
        return nv ? <Tag color="blue">{nv}</Tag> : <Tag>-</Tag>;
      }
    },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.headerCard} bodyStyle={{ padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Space size={16} wrap>
            <Button onClick={() => navigate(-1)}>← Quay lại</Button>
            <Statistic title="Tổng góp ý" value={stats.total} />
          </Space>
          <Space size={8} wrap>
            <Input
              placeholder="Tìm kiếm (tên bài, người gửi, nội dung, email, phone, id...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ width: 360 }}
            />
            <Select value={sourceFilter} onChange={setSourceFilter} style={{ width: 200 }}>
              <Option value="all">Tất cả nguồn</Option>
              <Option value="stream">Lý thuyết</Option>
              <Option value="longForm">Kho tài nguyên</Option>
              <Option value="home">Home</Option>
              <Option value="caseTraining">Case Training</Option>
            </Select>
          </Space>
        </div>
      </Card>

      <div className={styles.tableWrap}>
        <Table
          size="middle"
          rowKey={(r) => r.id}
          loading={loading}
          dataSource={filtered}
          columns={columns}
          bordered
          sticky
          scroll={{ y: 'calc(100vh - 240px)', x: true }}
          pagination={{
            current: currentPage,
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10','20','30','50','100'],
            onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
            onShowSizeChange: (page, size) => { setCurrentPage(1); setPageSize(size); },
            showTotal: (t) => `${t} góp ý`,
          }}
        />
      </div>

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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeedbackManagement;
