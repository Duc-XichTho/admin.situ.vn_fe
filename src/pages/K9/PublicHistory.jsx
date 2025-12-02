import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Empty, Spin, Table, Typography, Select, Space, Result, Button, Row, Col, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getK9ByTypePublic, getSettingByTypePublic, getListQuestionHistoryByUserPublic } from '../../apis/public/publicService.jsx';
import { formatDateToDDMMYYYY } from '../../generalFunction/format.js';
import { Program_Icon } from '../../icon/IconSvg';

const { Title, Text } = Typography;
const { Option } = Select;

const PublicHistory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [programFilter, setProgramFilter] = useState('all');
  const [valid, setValid] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [headerStats, setHeaderStats] = useState({
    completedQuizzes: 0,
    totalQuizzes: 0,
    averageScore: 0,
    highScoreCount: 0,
    completedTheory: 0,
    totalTheory: 0
  });
  const [newsItems, setNewsItems] = useState([]);
  const [caseTrainingItems, setCaseTrainingItems] = useState([]);
  const [tag4Options, setTag4Options] = useState([]);
  // 1. State cho filter loại tài liệu
  const [questionTypeFilter, setQuestionTypeFilter] = useState('all');

  // Read params
  const params = new URLSearchParams(location.search);
  const userId = params.get('history_user');
  const initialProgram = params.get('history_program') || 'all';
  const [dataUser, setDataUser] = useState(null);

  useEffect(() => {
    setProgramFilter(initialProgram);
  }, [initialProgram]);

  // Validate exp and load
  useEffect(() => {
    if (!userId) {
      setValid(false);
      return;
    }
    setValid(true);
    setLoading(true);
    getListQuestionHistoryByUserPublic({ where: { user_id: userId } })
      .then(resp => {
        if (resp && typeof resp === 'object' && resp.data) {
          setDataUser(resp.user || null);
          setHistoryData(resp.data || []);
        } else if (Array.isArray(resp)) {
          setDataUser(null);
          setHistoryData(resp);
        } else {
          setDataUser(null);
          setHistoryData([]);
        }
      })
      .catch(() => {
        setDataUser(null);
        setHistoryData([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    // Fetch quizzes for all programs when mount
    async function fetchQuizzes() {
      try {
        const [news, cases] = await Promise.all([
          getK9ByTypePublic('news'),
          getK9ByTypePublic('caseTraining'),
        ]);
        setNewsItems(news || []);
        setCaseTrainingItems(cases || []);
      } catch (e) {
        setNewsItems([]);
        setCaseTrainingItems([]);
      }
    }
    fetchQuizzes();
  }, []);

  // Fetch chương trình (tag4 options)
  useEffect(() => {
    async function fetchTag4Options() {
      try {
        const res = await getSettingByTypePublic('TAG4_OPTIONS');
        if (res && res.setting) setTag4Options(res.setting);
        else setTag4Options([]);
      } catch { setTag4Options([]); }
    }
    fetchTag4Options();
  }, []);

  // update programFilter default value logic if tag4Options changes and initialProgram is not found, fallback to 'all'
  useEffect(() => {
    if (tag4Options.length > 0 &&
      programFilter !== 'all' &&
      !tag4Options.some(opt => opt.value === programFilter)) {
      setProgramFilter('all');
    }
  }, [tag4Options]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 2. Lấy label chương trình đang chọn
  const programLabel = useMemo(() => {
    if (programFilter === 'all') return 'Tất cả chương trình';
    const found = tag4Options.find(opt => opt.value === programFilter);
    return found ? found.label : programFilter;
  }, [programFilter, tag4Options]);

  // 3. Lấy các quiz thuộc chương trình đang chọn (theo tag4)
  const validQuizIds = useMemo(() => {
    const ids = new Set();
    newsItems.forEach(item => {
      if (item.questionContent != null && item.questionContent != undefined) {
        if (programFilter === 'all') {
          ids.add(item.id);
        } else {
          const t4 = Array.isArray(item.tag4) ? item.tag4 : [];
          if (t4.includes(programFilter)) ids.add(item.id);
        }
      }
    });
    caseTrainingItems.forEach(item => {
      if (item.questionContent != null && item.questionContent != undefined) {
        if (programFilter === 'all') {
          ids.add(item.id);
        } else {
          const t4 = Array.isArray(item.tag4) ? item.tag4 : [];
          if (t4.includes(programFilter)) ids.add(item.id);
        }
      }
    });
    return ids;
  }, [newsItems, caseTrainingItems, programFilter]);

  // 4. Lọc lịch sử chuẩn: vừa ID nằm trong validQuizIds, vừa đúng loại tài liệu nếu chọn
  const tableData = useMemo(() => {
    let res = (historyData || []).filter(item => validQuizIds.has(item.question_id));
    if (questionTypeFilter !== 'all') {
      res = res.filter(item => item.questionType === questionTypeFilter);
    }
    // Sort: News (lý thuyết) always first, then Case Training
    const sortedRes = [...res].sort((a, b) => {
      // News (lý thuyết) comes first
      if (a.questionType === 'news' && b.questionType !== 'news') {
        return -1;
      }
      if (a.questionType !== 'news' && b.questionType === 'news') {
        return 1;
      }
      // If both are news or both are not, then sort Case Training next
      if (a.questionType === 'caseTraining' && b.questionType !== 'caseTraining') {
        return -1;
      }
      if (a.questionType !== 'caseTraining' && b.questionType === 'caseTraining') {
        return 1;
      }
      // Maintain original order for others
      return 0;
    });
    return sortedRes;
  }, [validQuizIds, historyData, questionTypeFilter]);



  // 5. Tính toán headerStats đúng với khoảng lọc
  useEffect(() => {
    const completedQuizzes = tableData.filter(item => item.score && parseFloat(item.score) >= 0).length;
    
    // Tính tổng số quiz có sẵn (news + caseTraining) - tất cả bài có questionContent, không filter theo chương trình
    const totalQuizzes = [
      ...newsItems.filter(item => 
        item.questionContent != null && 
        item.questionContent != undefined
      ),
      ...caseTrainingItems.filter(item => 
        item.questionContent != null && 
        item.questionContent != undefined
      )
    ].length;
    
    const validScores = tableData.map(item => {
      const num = parseFloat(item.score);
      return isNaN(num) ? null : num;
    }).filter(v => v !== null && v >= 0 && v <= 100);
    const averageScore = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
    const highScoreCount = tableData.filter(item => (item.score || 0) >= 60).length;
    
    // Tính toán thống kê lý thuyết
    const totalTheory = newsItems.filter(item => 
      item.questionContent != null && 
      item.questionContent != undefined &&
      validQuizIds.has(item.id)
    ).length;
    const completedTheory = tableData.filter(item => 
      item.questionType === 'news' && 
      item.score && 
      parseFloat(item.score) >= 0
    ).length;
    
    setHeaderStats({ completedQuizzes, totalQuizzes, averageScore, highScoreCount, completedTheory, totalTheory });
  }, [tableData, newsItems, caseTrainingItems, validQuizIds]);

  const getTypeLabel = (questionType) => {
    switch (questionType) {
      case 'news':
        return 'Learning Block';
      case 'caseTraining':
        return 'Case Training';
      case 'longForm':
        return 'Kho Tài Nguyên';
      case 'home':
        return 'Home';
      default:
        return 'Khác';
    }
  };

  const columns = [
    {
      title: 'Tên nội dung',
      dataIndex: 'questionName',
      key: 'questionName',
      ellipsis: true,
      width: '30%',
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#262626' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'questionType',
      key: 'questionType',
      width: '15%',
      render: (questionType) => (
        <span style={{
          fontWeight: '500',
          fontSize: '13px',
          color: questionType === 'learning_block' ? '#1890ff' : '#722ed1',
          backgroundColor: questionType === 'learning_block' ? '#e6f7ff' : '#f9f0ff',
          padding: '4px 8px',
          borderRadius: '4px',
          border: `1px solid ${questionType === 'learning_block' ? '#91d5ff' : '#d3adf7'}`
        }}>
          {getTypeLabel(questionType)}
        </span>
      ),
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      width: '15%',
      render: (score) => (
        <span style={{
          fontWeight: 'bold',
          fontSize: '14px',
          color: score >= 60 ? '#52c41a' : '#ff4d4f',
          backgroundColor: score >= 60 ? '#f6ffed' : '#fff2f0',
          padding: '4px 8px',
          borderRadius: '4px',
          border: `1px solid ${score >= 60 ? '#b7eb8f' : '#ffccc7'}`
        }}>
          {score}%
        </span>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: '40%',
      render: (date) => {
        const formattedDate = formatDateToDDMMYYYY(date);
        return (
          <span style={{ color: '#666', fontSize: '13px' }}>
            {formattedDate}
          </span>
        );
      },
    }
  ];

  if (!valid) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="403"
          title="Link đã hết hạn hoặc không hợp lệ"
          subTitle="Vui lòng yêu cầu người chia sẻ gửi lại link mới."
          extra={<Button type="primary" onClick={() => navigate('/k9')}>Về trang K9</Button>}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {loading ? (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.9)',
          zIndex: 2,
          position: 'relative'
        }}>
          <Spin size="large" />
          <div style={{ marginTop: 20, color: '#888' }}>Đang tải dữ liệu...</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Title level={4} style={{ margin: 0 }}>
                Learning Portfolio
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#1890ff' }}>
                <Program_Icon style={{ fontSize: '16px' }} />
                <Typography.Text style={{ fontSize: '14px', color: '#1890ff', fontWeight: '500' }}>
                  {programLabel}
                </Typography.Text>
              </div>
            </div>
            <Space>
              <Text>Lọc theo tài liệu:</Text>
              <Select value={questionTypeFilter} onChange={setQuestionTypeFilter} style={{ width: 180 }}>
                <Option value="all">Tất cả</Option>
                <Option value="news">Learning Block</Option>
                <Option value="caseTraining">Case Training</Option>
              </Select>
            </Space>
          </div>

          {/* User Info Display */}
          {dataUser && (
            <Card
              size="small"
              style={{
                marginBottom: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Avatar
                  size={64}
                  src={dataUser?.picture}
                  icon={!dataUser?.picture && <UserOutlined />}
                  style={{
                    border: '3px solid #fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Typography.Text strong style={{ 
                    fontSize: '18px', 
                    color: '#262626',
                    display: 'block',
                    marginBottom: '6px'
                  }}>
                    {dataUser?.name || dataUser?.username || 'User'}
                  </Typography.Text>
                  <Typography.Text 
                    type="secondary" 
                    style={{ 
                      fontSize: '14px',
                      color: '#8c8c8c',
                      display: 'block',
                      marginBottom: '8px'
                    }}
                  >
                    📧 {dataUser?.email || dataUser?.username || 'Chưa có email'}
                  </Typography.Text>
                </div>
              </div>
            </Card>
          )}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>Tổng số bài lý thuyết đã làm</div>
                <div style={{ color: '#1890ff', fontSize: 24 }}>{headerStats.completedTheory} / {headerStats.totalTheory}</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>Tổng số bài quiz Đã làm</div>
                <div style={{ color: '#1890ff', fontSize: 24 }}>{headerStats.completedQuizzes} / {headerStats.totalQuizzes}</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>Điểm trung bình</div>
                <div style={{ color: headerStats.averageScore >= 60 ? '#52c41a' : '#ff4d4f', fontSize: 24, fontWeight: 'bold' }}>{headerStats.averageScore}%</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>Bài đạt điểm cao (≥60%)</div>
                <div style={{ color: '#52c41a', fontSize: 24 }}>{headerStats.highScoreCount}</div>
              </Card>
            </Col>
          </Row>
          <Card title={<Typography.Title level={5} style={{ margin: 0, color: '#262626' }}>Nội dung hoàn thành</Typography.Title>} bodyStyle={{ padding: 16 }} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {(tableData || []).length === 0 ? (
              <Empty description="Không có dữ liệu lịch sử phù hợp" />
            ) : (
              <>
                {/* PC - Table View */}
                {!isMobile && (
                  <Table
                    columns={columns}
                    dataSource={tableData}
                    rowKey={(r, i) => r.id || r._id || i}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    style={{ borderRadius: 6, overflow: 'hidden' }}
                  />
                )}

                {/* Mobile - Cards View */}
                {isMobile && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tableData.map((item, index) => (
                      <Card
                        key={item.id || item._id || index}
                        size="small"
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #f0f0f0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                        bodyStyle={{ padding: '12px' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* Question Name */}
                          <div>
                            <Typography.Text strong style={{ fontSize: '13px', color: '#262626' }}>
                              {item.questionName}
                            </Typography.Text>
                          </div>

                          {/* Info Row */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            {/* Type Badge */}
                            <span style={{
                              fontWeight: '500',
                              fontSize: '10px',
                              color: item.questionType === 'news' ? '#1890ff' : '#722ed1',
                              backgroundColor: item.questionType === 'news' ? '#e6f7ff' : '#f9f0ff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${item.questionType === 'news' ? '#91d5ff' : '#d3adf7'}`
                            }}>
                              {getTypeLabel(item.questionType)}
                            </span>

                            {/* Score Badge */}
                            <span style={{
                              fontWeight: 'bold',
                              fontSize: '11px',
                              color: (item.score || 0) >= 60 ? '#52c41a' : '#ff4d4f',
                              backgroundColor: (item.score || 0) >= 60 ? '#f6ffed' : '#fff2f0',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${(item.score || 0) >= 60 ? '#b7eb8f' : '#ffccc7'}`
                            }}>
                              {item.score || 0}%
                            </span>

                            {/* Date */}
                            <Typography.Text type="secondary" style={{ fontSize: '10px' }}>
                              {formatDateToDDMMYYYY(item.updated_at)}
                            </Typography.Text>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default PublicHistory;



