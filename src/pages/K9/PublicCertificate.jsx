import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import { getK9ByTypePublic, getSettingByTypePublic, getListQuestionHistoryByUserPublic } from '../../apis/public/publicService.jsx';
import CertificateModal from './components/CertificateModal.jsx';

const PublicCertificate = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [valid, setValid] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [newsItems, setNewsItems] = useState([]);
    const [caseTrainingItems, setCaseTrainingItems] = useState([]);
    const [tag4Options, setTag4Options] = useState([]);
    const [dataUser, setDataUser] = useState(null);

    // Read params
    const params = new URLSearchParams(location.search);
    const userId = params.get('certificate_user');

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load data
    useEffect(() => {
        if (!userId) {
            setValid(false);
            return;
        }
        setValid(true);
        setLoading(true);

        // Fetch all data in parallel
        Promise.all([
            getListQuestionHistoryByUserPublic({ where: { user_id: userId } }),
            getK9ByTypePublic('news'),
            getK9ByTypePublic('caseTraining'),
            getSettingByTypePublic('TAG4_OPTIONS')
        ])
            .then(([historyResp, news, cases, tag4Res]) => {
                // Set history data
                if (historyResp && typeof historyResp === 'object' && historyResp.data) {
                    setDataUser(historyResp.user || null);
                    setHistoryData(historyResp.data || []);
                } else if (Array.isArray(historyResp)) {
                    setDataUser(null);
                    setHistoryData(historyResp);
                } else {
                    setDataUser(null);
                    setHistoryData([]);
                }

                // Set items
                setNewsItems(news || []);
                setCaseTrainingItems(cases || []);

                // Set tag4 options
                if (tag4Res && tag4Res.setting) {
                    setTag4Options(tag4Res.setting);
                } else {
                    setTag4Options([]);
                }
            })
            .catch(() => {
                setDataUser(null);
                setHistoryData([]);
                setNewsItems([]);
                setCaseTrainingItems([]);
                setTag4Options([]);
            })
            .finally(() => setLoading(false));
    }, [userId]);

    // Get certificate stats for a specific program (with theory and quiz completion)
    const getProgramCertificateStats = (programValue) => {
        if (!programValue || !historyData?.length) {
            return {
                averageScore: 0,
                theoryCompleted: 0,
                theoryTotal: 0,
                theoryPercent: 0,
                quizCompleted: 0,
                quizTotal: 0,
                quizPercent: 0
            };
        }

        // Get all items for this program
        const allItems = [...newsItems, ...caseTrainingItems];
        const theoryItems = [];
        const quizItems = [];

        allItems.forEach(item => {
            if (item.questionContent != null && item.questionContent != undefined) {
                if (programValue === 'all') {
                    if (item.type === 'news') {
                        theoryItems.push(item.id);
                    } else if (item.type === 'caseTraining') {
                        quizItems.push(item.id);
                    }
                } else {
                    const itemTag4Array = Array.isArray(item.tag4) ? item.tag4 : [];
                    if (itemTag4Array.includes(programValue)) {
                        if (item.type === 'news') {
                            theoryItems.push(item.id);
                        } else if (item.type === 'caseTraining') {
                            quizItems.push(item.id);
                        }
                    }
                }
            }
        });

        // Filter history for this program
        const theoryHistory = historyData.filter(item =>
            theoryItems.includes(item.question_id) && item.questionType === 'news'
        );
        const quizHistory = historyData.filter(item =>
            quizItems.includes(item.question_id) && item.questionType === 'caseTraining'
        );

        // Calculate theory completion
        const theoryCompleted = theoryHistory.filter(item => item.score && parseFloat(item.score) >= 0).length;
        const theoryTotal = theoryItems.length;
        const theoryPercent = theoryTotal > 0 ? Math.round((theoryCompleted / theoryTotal) * 100) : 0;

        // Calculate quiz completion
        const quizCompleted = quizHistory.filter(item => item.score && parseFloat(item.score) >= 0).length;
        const quizTotal = quizItems.length;
        const quizPercent = quizTotal > 0 ? Math.round((quizCompleted / quizTotal) * 100) : 0;

        // Calculate average score from all history
        const allHistory = [...theoryHistory, ...quizHistory];
        const validScores = allHistory
            .map(item => parseFloat(item.score))
            .filter(score => !isNaN(score) && score >= 0 && score <= 100);
        const averageScore = validScores.length > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : 0;

        return {
            averageScore,
            theoryCompleted,
            theoryTotal,
            theoryPercent,
            quizCompleted,
            quizTotal,
            quizPercent
        };
    };

    // Check if program passes certificate requirements
    const checkProgramPass = (programValue) => {
        const stats = getProgramCertificateStats(programValue);

        // Excellence: Điểm TB > 80% + Hoàn thành ≥ 75% lý thuyết và ≥ 75% quiz
        if (stats.averageScore > 80 && stats.theoryPercent >= 75 && stats.quizPercent >= 75) {
            return { passed: true, level: 'Excellence' };
        }

        // Qualified: Điểm TB > 60% + Hoàn thành ≥ 70% lý thuyết và ≥ 70% quiz
        if (stats.averageScore > 60 && stats.theoryPercent >= 70 && stats.quizPercent >= 70) {
            return { passed: true, level: 'Qualified' };
        }

        return { passed: false, level: null };
    };

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

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
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
        );
    }

    return (
        <CertificateModal
            publicMode={true}
            open={true}
            onCancel={() => navigate('/k9')}
            currentUser={dataUser}
            isMobile={isMobile}
            tag4Options={tag4Options}
            checkProgramPass={checkProgramPass}
            getProgramCertificateStats={getProgramCertificateStats}
        />
    );
};

export default PublicCertificate;

