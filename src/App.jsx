import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from './CONST';
import Admin from './pages/Admin/Admin.jsx';
import AIGen from './pages/Admin/AIGen/AIGen.jsx';
import NotFoundPage from './pages/HTTPStatus/NotFoundPage';
import K9 from './pages/K9/K9.jsx';
import PublicHistory from './pages/K9/PublicHistory.jsx';
import PublicCertificate from './pages/K9/PublicCertificate.jsx';
import K9Management from './pages/K9Management/K9Management.jsx';
import CompanyReport from './pages/CompanyReport/CompanyReport.jsx';
import Management from './pages/Management/Management.jsx';
import UserManagement from './pages/UserManagement/UserManagement.jsx';
import HomepageContentEditor from './pages/Admin/HomepageContentEditor.jsx';
import AuthRoute from './routes/AuthRoute';
import AuthRouteAdmin from './routes/AuthRouteAdmin';

import Login from './pages/Login/Login.jsx';
import ExcelData from './pages/ExcelData.jsx';
import Homepage from './pages/Homepage/Homepage.jsx';
import FeedbackManagement from './pages/K9/components/FeedbackManagement.jsx';
import PaymentSuccess from './pages/K9/PaymentSuccess.jsx';
import AIQuestionEvaluation from './pages/K9/AIQuestionEvaluation.jsx';
import AISummaryDetailGeneration from './pages/K9/AISummaryDetailGeneration.jsx';
import React from 'react';

// Wrapper component to route between PublicHistory and PublicCertificate
const PublicK9Route = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const shareCertificate = params.get('share_certificate');
    const certificateUser = params.get('certificate_user');
    
    if (shareCertificate === 'true' && certificateUser) {
        return <PublicCertificate />;
    }
    return <PublicHistory />;
};

const App = () => {
    return (
        <Routes>
            {/* Redirect root to K9 page */}
            {/* <Route path="/" element={<Navigate to={ROUTES.HOME_PAGE} replace />} /> */}
            <Route path="/" element={<Homepage />} />


            {/* Trang mặc định là Homepage */}
            {/* <Route path={ROUTES.LOGIN} element={<Homepage />} /> */}
            <Route path={ROUTES.HOME_PAGE} element={<Homepage />} />
            <Route path="/k9" element={<PublicK9Route />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />

            {/* Regular user routes */}
            <Route element={<AuthRoute />}>
                <Route path={ROUTES.K9} element={<K9 />} />
                <Route path={ROUTES.EXCEL_DATA} element={<ExcelData />} />
            </Route>

            {/* Admin routes - yêu cầu quyền Admin */}
            <Route element={<AuthRouteAdmin />}>
                <Route path="/ai-question-evaluation" element={<AIQuestionEvaluation />} />
                <Route path="/ai-summary-detail-generation" element={<AISummaryDetailGeneration />} />
                <Route path={ROUTES.ADMIN} element={<Admin />}>
                    <Route index element={<AIGen />} />
                    <Route path="homepage-content" element={<HomepageContentEditor />} />
                </Route>
                <Route path={ROUTES.MANAGEMENT} element={<Management />} />
                <Route path={ROUTES.USER_MANAGEMENT} element={<UserManagement />} />
                <Route path={ROUTES.K9_MANAGEMENT} element={<K9Management />} />
                <Route path={ROUTES.FEEDBACK_MANAGEMENT} element={<FeedbackManagement />} />
                <Route path={ROUTES.COMPANY_REPORT} element={<CompanyReport />} />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default App;
