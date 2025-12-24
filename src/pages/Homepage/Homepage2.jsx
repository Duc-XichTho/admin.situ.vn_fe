import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithUsername } from '../../apis/public/publicService.jsx';
import styles from './Homepage.module.css';
import cssHomePage2 from './Homepage2.module.css';

import { Button, Checkbox, Divider, Form, Input, message, Modal } from 'antd';
import { createPaymentLink } from '../../apis/paymentService';
import { updateUser } from '../../apis/userService';
import PackageGrid from '../../components/PaymentModal/PackageGrid';

export default function Homepage2() {
    const navigate = useNavigate();
    // Login modal states
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [registerForm] = Form.useForm();
    const [loginForm] = Form.useForm();
    const [registerLoading, setRegisterLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [registerStep, setRegisterStep] = useState(1); // 1: Thông tin cơ bản, 2: Chọn gói
    const [createdUserId, setCreatedUserId] = useState(null); // Lưu user ID sau khi tạo
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Login handlers
    const handleLogin = async (values) => {
        try {
            const response = await loginWithUsername(values.username, values.password);

            if (response.success) {
                message.success('Đăng nhập thành công');
                setTimeout(() => {
                    navigate('/home');
                    setIsLoginModalOpen(false);
                    loginForm.resetFields();
                }, 1000);
            } else {
                message.error(response.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            message.error('Đăng nhập thất bại!');
        }
    };

    const handleGmailLogin = () => {
        const currentPath = '/home';
        window.open(`${import.meta.env.VITE_API_URL}/login?redirect=${encodeURIComponent(currentPath)}`, '_self');
    };


    // Bước 1: Tạo user với thông tin cơ bản
    const handleStep1Submit = async (values) => {
        if (!termsAccepted) {
            message.error('Vui lòng đồng ý với Điều khoản & Dịch vụ!');
            return;
        }

        setRegisterLoading(true);

        try {
            const formattedData = {
                name: values.name,
                phone: values.phone,
                email: values.email,
            };

            const res = await registerAccountPublic(formattedData);
            console.log(res);
            if (res.code === 'USER_EXIST') {
                message.error(res.message);
            } else {
                // Lưu user ID để dùng cho bước 2
                const userId = res.data?.id || res.id || res.user?.id;
                setCreatedUserId(userId);
                setRegisterStep(2); // Chuyển sang bước 2
                message.success('Tài khoản đã được tạo thành công! Vui lòng chọn gói để tiếp tục.');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
        } finally {
            setRegisterLoading(false);
        }
    };

    // Bước 2: Thanh toán gói
    const generateNumericOrderCode = (userId) => {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(100 + Math.random() * 900);
        return Number(`${userId}${timestamp}${random}`);
    };

    const handlePurchasePackage = async (packageData) => {
        if (!createdUserId) {
            message.error('Vui lòng hoàn thành bước 1 trước!');
            return;
        }

        // Xử lý gói dùng thử - activate trực tiếp không cần thanh toán
        if (packageData.isTrial && packageData.price === 0) {
            setPaymentLoading(true);
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startDate = today.toISOString();
                const durationDays = packageData.duration;
                const expiryDate = new Date(today);
                expiryDate.setDate(today.getDate() + durationDays - 1);
                expiryDate.setHours(23, 59, 59, 999);

                const updateData = {
                    account_type: 'Dùng thử',
                    info: {
                        startDate: startDate,
                        durationDays: durationDays,
                        expiryDate: expiryDate.toISOString(),
                    }
                };

                await updateUser(createdUserId, updateData);
                message.success(`Gói dùng thử ${packageData.durationText} đã được kích hoạt thành công!`);

                // Đóng modal và chuyển đến trang đăng nhập
                setTimeout(() => {
                    setIsRegisterModalOpen(false);
                    setIsLoginModalOpen(true);
                    setRegisterStep(1);
                    setCreatedUserId(null);
                    registerForm.resetFields();
                    message.info('Vui lòng đăng nhập để sử dụng dịch vụ');
                }, 1500);
            } catch (error) {
                console.error('Error activating trial:', error);
                message.error('Có lỗi xảy ra khi kích hoạt gói dùng thử. Vui lòng thử lại!');
            } finally {
                setPaymentLoading(false);
            }
            return;
        }

        // Xử lý các gói có phí - tạo payment link
        setPaymentLoading(true);
        try {
            const orderCode = generateNumericOrderCode(createdUserId);

            const paymentData = {
                userId: createdUserId,
                amount: packageData.price,
                description: `Thanh toán ${packageData.name}`,
                returnUrl: `${window.location.origin}/payment-success?payment_success=true&orderCode=${orderCode}&package=${encodeURIComponent(packageData.name)}`,
                cancelUrl: `${window.location.origin}/`,
                serviceDomain: 'aimba',
                paymentType: 'improve-account',
                callbackUrl: import.meta.env.VITE_API_URL + '/api/payment-callback',
                orderCode: orderCode,
                items: [
                    {
                        name: packageData.name,
                        quantity: 1,
                        price: packageData.price
                    }
                ]
            };

            const result = await createPaymentLink(paymentData);

            if (result.success && result.data?.checkoutUrl) {
                // Redirect to PayOS checkout
                window.open(result.data.checkoutUrl, '_blank');
            } else {
                message.error(result.message || 'Có lỗi xảy ra khi tạo link thanh toán');
            }
        } catch (error) {
            console.error('Error creating payment link:', error);
            message.error('Có lỗi xảy ra khi tạo link thanh toán. Vui lòng thử lại!');
        } finally {
            setPaymentLoading(false);
        }
    };


    return (
        <div className={cssHomePage2.container}>
            {/* Navigation */}
            <nav className={cssHomePage2.nav}>
                <div className={cssHomePage2.navContent}>
                    <div className={cssHomePage2.logo}>
                        <div className={cssHomePage2.logoImage}>
                            <div className={cssHomePage2.logoPlaceholder}>
                                <img style={{ width: '38px', height: '35px' }} src="/Favicon.png" alt="" />
                            </div>
                        </div>
                        <div>
                            <span className={cssHomePage2.logoText}>AIMBA</span>
                            <span className={cssHomePage2.logoSubtext}>Executive Education</span>
                        </div>
                    </div>
                    <div className={cssHomePage2.navLinks}>
                        <button className={cssHomePage2.loginButton} onClick={() => handleGmailLogin()}>Đăng nhập</button>
                        <button className={cssHomePage2.registerButton} onClick={() => setIsRegisterModalOpen(true)}>Đăng ký sử dụng</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className={cssHomePage2.hero}>
                <div className={cssHomePage2.heroBackground}>
                    <div className={cssHomePage2.heroPattern}></div>
                    <div className={cssHomePage2.heroGradient}></div>
                </div>

                <div className={cssHomePage2.heroContent}>
                    <div className={cssHomePage2.heroLeft}>
                        <div className={`${cssHomePage2.badge} ${cssHomePage2.animateIn1}`}>
                            <span className={cssHomePage2.badgeDot}></span>
                            Nền tảng đào tạo 4.0 tiên phong ứng dụng mô phỏng
                        </div>

                        <div className={`${cssHomePage2.platformTagline} ${cssHomePage2.animateIn1}`}>
                            AGILE & IMMERSIVE MBA TRAINING PLATFORM
                        </div>

                        <h1 className={`${cssHomePage2.heroTitle} ${cssHomePage2.animateIn2}`}>
                            Giải pháp huấn luyện<br />
                            đào tạo mô phỏng<br />
                            <span className={cssHomePage2.heroTitleAccent}>cấp độ MBA</span>
                        </h1>

                        <p className={`${cssHomePage2.heroDescription} ${cssHomePage2.animateIn3}`}>
                            Dành cho nhà quản lý, chuyên gia, người chuẩn bị học MBA<br />
                            hoặc đã học MBA muốn thực hành thực chiến
                        </p>

                        <div className={`${cssHomePage2.teamCredential} ${cssHomePage2.animateIn4}`}>
                            Được phát triển bởi đội ngũ chuyên gia nghiên cứu và giảng viên với hàng chục năm kinh nghiệm, tiên phong trong gắn kết lý luận với thực hành, tinh chỉnh phù hợp cho thực trạng doanh nghiệp và môi trường kinh doanh Việt Nam
                        </div>
                    </div>

                    <div className={`${cssHomePage2.heroRight} ${cssHomePage2.animateIn3}`}>
                        <div className={cssHomePage2.heroCard}>
                            <div className={cssHomePage2.heroCardInner}>
                                <h3 className={cssHomePage2.heroCardTitle}>Nội dung học tập toàn diện</h3>
                                <div className={cssHomePage2.statsListContainer}>
                                    <div className={cssHomePage2.statsListItem}>
                                        <div className={cssHomePage2.statsListIcon}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <span className={cssHomePage2.statsListText}>1000+ Case tình huống</span>
                                    </div>
                                    <div className={cssHomePage2.statsListItem}>
                                        <div className={cssHomePage2.statsListIcon}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <span className={cssHomePage2.statsListText}>250+ Bài lý thuyết và tư duy</span>
                                    </div>
                                    <div className={cssHomePage2.statsListItem}>
                                        <div className={cssHomePage2.statsListIcon}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <span className={cssHomePage2.statsListText}>15 Module chuyên môn</span>
                                    </div>
                                    <div className={cssHomePage2.statsListItem}>
                                        <div className={cssHomePage2.statsListIcon}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <span className={cssHomePage2.statsListText}>Phân tích 38 mô hình kinh doanh</span>
                                    </div>
                                    <div className={cssHomePage2.statsListItem}>
                                        <div className={cssHomePage2.statsListIcon}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <span className={cssHomePage2.statsListText}>Và 300+ tài nguyên hữu ích khác</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cssHomePage2.scrollIndicator}>
                    <div className={cssHomePage2.scrollLine}></div>
                </div>
            </section>

            {/* Floating Facebook Contact Button */}
            <a href="#" className={cssHomePage2.floatingFbButton} title="Liên hệ qua Facebook">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            </a>

            {/* Curriculum Section */}
            <section className={cssHomePage2.curriculumSection}>
                <div className={cssHomePage2.container}>
                    <div className={cssHomePage2.sectionHeader}>
                        <h2 className={cssHomePage2.sectionTitle}>Nội dung Học tập Toàn diện</h2>
                        <p className={cssHomePage2.sectionSubtitle}>
                            250+ nội dung lý thuyết, tư duy hiệu quả, thực tiễn, phù hợp với môi trường kinh doanh Việt Nam, kết hợp với 1000+ thực hành áp dụng chuyên sâu để thành thạo áp dụng. Tiêu biểu như:
                        </p>
                    </div>

                    <div className={cssHomePage2.curriculumContent}>
                        {/* Category I */}
                        <div className={cssHomePage2.curriculumCategory}>
                            <h3 className={cssHomePage2.categoryTitle}>I. Chiến lược & Quản trị Doanh nghiệp</h3>
                            <div className={cssHomePage2.topicsList}>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Mô hình Business Model Canvas:</strong> Thiết kế và đổi mới mô hình kinh doanh.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Mô hình 5 Áp lực cạnh tranh của Porter:</strong> Phân tích cấu trúc ngành và vị thế đối thủ.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Chiến lược Đại dương xanh:</strong> Tạo ra thị trường mới và vô hiệu hóa cạnh tranh.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Ma trận VRIO:</strong> Đánh giá nguồn lực nội tại để tạo lợi thế cạnh tranh bền vững.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Phân tích PESTEL:</strong> Đánh giá các yếu tố vĩ mô ảnh hưởng đến doanh nghiệp.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Mô hình McKinsey 7S:</strong> Đảm bảo sự đồng bộ giữa chiến lược và tổ chức.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>3 Chân trời Tăng trưởng (McKinsey):</strong> Cân bằng giữa vận hành hiện tại và đổi mới tương lai.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Lập kế hoạch Kịch bản (Scenario Planning):</strong> Chuẩn bị cho các biến động bất ngờ của thị trường.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Quản trị Doanh nghiệp Gia đình:</strong> Giải quyết vấn đề kế thừa và chuyển giao quyền lực.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Quản trị Rủi ro Tích hợp (COSO ERM):</strong> Nhận diện và ứng phó rủi ro hệ thống.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category II */}
                        <div className={cssHomePage2.curriculumCategory}>
                            <h3 className={cssHomePage2.categoryTitle}>II. AI, Dữ liệu & Chuyển đổi số</h3>
                            <div className={cssHomePage2.topicsList}>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Tư duy Chuyển đổi AI (AI Transformation Mindset):</strong> Tích hợp AI vào chiến lược lõi.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Generative AI & Kỹ năng Prompt:</strong> Tối ưu hiệu suất bằng AI tạo sinh.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Đạo đức AI & Quản trị Dữ liệu:</strong> Đảm bảo tính minh bạch và bảo mật thông tin.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Lộ trình Chuyển đổi số (Digital Roadmap):</strong> Các bước số hóa doanh nghiệp toàn diện.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Nhận thức An ninh mạng cho Quản lý:</strong> Bảo vệ tài sản số của doanh nghiệp.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Tư duy Dữ liệu (Data-Driven Mindset):</strong> Ra quyết định dựa trên bằng chứng và số liệu.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category III */}
                        <div className={cssHomePage2.curriculumCategory}>
                            <h3 className={cssHomePage2.categoryTitle}>III. Tài chính & Đầu tư</h3>
                            <div className={cssHomePage2.topicsList}>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Phân tích Báo cáo Tài chính nâng cao:</strong> Giải mã chất lượng lợi nhuận và dòng tiền.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Định giá Doanh nghiệp (Valuation):</strong> Xác định giá trị nội tại trong đầu tư và M&A.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Quy trình M&A & Tích hợp sau Sáp nhập (PMI):</strong> Hiện thực hóa sức mạnh cộng hưởng.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Quản trị Rủi ro Tài chính & ESG:</strong> Tài chính bền vững và trách nhiệm xã hội.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Quản trị Vốn lưu động & Dòng tiền:</strong> Đảm bảo khả năng thanh khoản và vận hành.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category IV */}
                        <div className={cssHomePage2.curriculumCategory}>
                            <h3 className={cssHomePage2.categoryTitle}>IV. Marketing & Bán hàng Thực chiến</h3>
                            <div className={cssHomePage2.topicsList}>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Lý thuyết "Jobs-to-be-Done" (JTBD):</strong> Thấu hiểu nhu cầu sâu thẳm của khách hàng.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Mô hình Marketing Mix (7Ps):</strong> Khung chiến lược tiếp thị toàn diện cho sản phẩm và dịch vụ.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Phễu Bán hàng & Marketing (Funnel):</strong> Tối ưu hóa tỷ lệ chuyển đổi khách hàng.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Bản đồ Hành trình Khách hàng (Customer Journey Map):</strong> Quản trị trải nghiệm khách hàng tại mọi điểm chạm.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Kỹ thuật SPIN Selling:</strong> Nghệ thuật đặt câu hỏi trong bán hàng tư vấn giá trị cao.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Kinh tế học hành vi trong Bán hàng:</strong> Ứng dụng tâm lý học để thúc đẩy quyết định mua hàng.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Tư duy Tăng trưởng (Growth Hacking):</strong> Tìm kiếm các đòn bẩy tăng trưởng đột phá.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Định vị Thương hiệu & Storytelling:</strong> Xây dựng cảm xúc và sự khác biệt cho thương hiệu.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category V */}
                        <div className={cssHomePage2.curriculumCategory}>
                            <h3 className={cssHomePage2.categoryTitle}>V. Vận hành & Quản lý Dự án</h3>
                            <div className={cssHomePage2.topicsList}>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Quản trị Dự án Agile & Scrum:</strong> Thích ứng nhanh và cải tiến liên tục.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Quản trị Chuỗi cung ứng (SCOR Model):</strong> Tối ưu hóa từ nguồn cung đến tay người dùng.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Tư duy Thiết kế (Design Thinking):</strong> Giải quyết vấn đề sáng tạo lấy con người làm trung tâm.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Tư duy Hệ thống (Systems Thinking):</strong> Giải quyết các vấn đề phức tạp từ gốc rễ.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category VI */}
                        <div className={cssHomePage2.curriculumCategory}>
                            <h3 className={cssHomePage2.categoryTitle}>VI. Lãnh đạo & Năng lực Quản trị Con người</h3>
                            <div className={cssHomePage2.topicsList}>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Lãnh đạo trong thế giới VUCA:</strong> Dẫn dắt đội ngũ qua sự biến động và bất định.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Quản trị theo Mục tiêu & Kết quả then chốt (OKRs):</strong> Thiết lập mục tiêu tham vọng và minh bạch.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Trí tuệ Cảm xúc (EQ) & An toàn Tâm lý:</strong> Nền tảng của đội ngũ hiệu suất cao.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Quản trị Sự thay đổi (Kotter's 8-Step):</strong> Dẫn dắt tổ chức thích nghi với cái mới.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Kỹ năng Đàm phán Win-Win (BATNA):</strong> Tìm kiếm giải pháp tối ưu cho các bên.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Ma trận Quản lý Thời gian (Eisenhower):</strong> Ưu tiên công việc quan trọng thay vì việc khẩn cấp.
                                    </div>
                                </div>
                                <div className={cssHomePage2.topicItem}>
                                    <span className={cssHomePage2.topicBullet}>•</span>
                                    <div>
                                        <strong>Tư duy Phản biện (Critical Thinking):</strong> Đánh giá thông tin đa chiều để ra quyết định chính xác.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={cssHomePage2.moreTopics}>
                            <p>(Và hơn 200 bài học/ lý thuyết/ tư duy hiệu quả và có tính vận dụng cao khác)</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={cssHomePage2.featuresSection}>
                <div className={cssHomePage2.featuresSectionPattern}></div>

                {/* Decorative Elements */}
                <div className={cssHomePage2.featuresCircle1}></div>
                <div className={cssHomePage2.featuresCircle2}></div>

                <div className={cssHomePage2.container}>
                    <div className={cssHomePage2.sectionHeader}>
                        <h2 className={cssHomePage2.featuresSectionTitle}>Tại sao chọn AIMBA?</h2>
                        <p className={cssHomePage2.sectionSubtitle}>
                            Nền tảng đào tạo mô phỏng cung cấp trải nghiệm học tập toàn diện, thích hợp với đặc trưng, môi trường kinh doanh Việt Nam, được đúc rút từ kinh nghiệm tư vấn, vận hành tại 500+ doanh nghiệp bởi đội ngũ chuyên gia hàng đầu.
                        </p>
                    </div>

                    <div className={cssHomePage2.featuresGrid}>
                        <div className={`${cssHomePage2.featureCard} ${cssHomePage2.featureCard}`}>
                            <div className={cssHomePage2.featureCardHeader}>
                                <h3 className={cssHomePage2.featureTitleNew}>Phương pháp mô phỏng</h3>
                            </div>
                            <div className={cssHomePage2.featureCardBody}>
                                <p className={cssHomePage2.featureText}>
                                    Đưa bạn vào các tình huống kinh doanh thực tế, giúp rèn luyện kỹ năng ra quyết định trong môi trường an toàn
                                </p>
                            </div>
                        </div>

                        <div className={`${cssHomePage2.featureCard} ${cssHomePage2.featureCard}`}>
                            <div className={cssHomePage2.featureCardHeader}>
                                <h3 className={cssHomePage2.featureTitleNew}>Nội dung chuẩn MBA</h3>
                            </div>
                            <div className={cssHomePage2.featureCardBody}>
                                <p className={cssHomePage2.featureText}>
                                    Kiến thức được biên soạn bởi các giảng viên MBA với kinh nghiệm giảng dạy tại các trường kinh doanh hàng đầu
                                </p>
                            </div>
                        </div>

                        <div className={`${cssHomePage2.featureCard} ${cssHomePage2.featureCard}`}>
                            <div className={cssHomePage2.featureCardHeader}>
                                <h3 className={cssHomePage2.featureTitleNew}>250+ Infographic trực quan</h3>
                            </div>
                            <div className={cssHomePage2.featureCardBody}>
                                <p className={cssHomePage2.featureText}>
                                    Visualize đẹp mắt và trực quan nội dung học tập, giúp tiếp thu kiến thức nhanh chóng và dễ dàng hơn
                                </p>
                            </div>
                        </div>

                        <div className={`${cssHomePage2.featureCard} ${cssHomePage2.featureCard}`}>
                            <div className={cssHomePage2.featureCardHeader}>
                                <h3 className={cssHomePage2.featureTitleNew}>Podcast rảnh tay</h3>
                            </div>
                            <div className={cssHomePage2.featureCardBody}>
                                <p className={cssHomePage2.featureText}>
                                    Nghe học tiện lợi mọi lúc mọi nơi, tận dụng tối đa thời gian di chuyển hoặc nghỉ ngơi để nâng cao kiến thức
                                </p>
                            </div>
                        </div>

                        <div className={`${cssHomePage2.featureCard} ${cssHomePage2.featureCard}`}>
                            <div className={cssHomePage2.featureCardHeader}>
                                <h3 className={cssHomePage2.featureTitleNew}>Học tập linh hoạt</h3>
                            </div>
                            <div className={cssHomePage2.featureCardBody}>
                                <p className={cssHomePage2.featureText}>
                                    Học mọi lúc, mọi nơi với nền tảng trực tuyến tối ưu cho cả máy tính và thiết bị di động
                                </p>
                            </div>
                        </div>

                        <div className={`${cssHomePage2.featureCard} ${cssHomePage2.featureCard}`}>
                            <div className={cssHomePage2.featureCardHeader}>
                                <h3 className={cssHomePage2.featureTitleNew}>Cộng đồng chuyên gia</h3>
                            </div>
                            <div className={cssHomePage2.featureCardBody}>
                                <p className={cssHomePage2.featureText}>
                                    Kết nối với mạng lưới nhà quản lý, chuyên gia và học viên MBA để trao đổi kinh nghiệm và xây dựng mối quan hệ
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={cssHomePage2.modulesSection}>
                        <h3 className={cssHomePage2.modulesTitle}>15 Module Chuyên môn Toàn diện</h3>
                        <div className={cssHomePage2.modulesGrid}>
                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Đạo đức - Kỹ năng Làm việc Chuyên nghiệp</h4>
                                <p className={cssHomePage2.moduleDescription}>Trang bị kỹ năng nền tảng và tư duy chuyên nghiệp cho nhân sự mới. Nội dung tập trung vào tư duy chủ động, giao tiếp, làm việc nhóm và đạo đức nghề nghiệp—những yếu tố quyết định sự thành công</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Chiến lược & Phương pháp Marketing</h4>
                                <p className={cssHomePage2.moduleDescription}>Cung cấp kiến thức chuyên sâu về marketing chiến lược trong kỷ nguyên số. Học viên học cách xây dựng chiến lược dựa trên dữ liệu, triển khai marketing toàn phễu và nghệ thuật kể chuyện thương hiệu. Khóa học nhấn mạnh kỹ năng phân tích và đo lường ROI để tối ưu hóa chiến dịch</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Chuyên gia Bán hàng Chuyên nghiệp</h4>
                                <p className={cssHomePage2.moduleDescription}>Nâng tầm chuyên môn, giúp học viên trở thành chuyên gia bán hàng. Nội dung tập trung vào các phương pháp nâng cao như bán hàng tư vấn, chẩn đoán nhu cầu, xây dựng giải pháp giá trị và đàm phán đỉnh cao để trở thành đối tác chiến lược của khách hàng</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Quản trị Nhân sự Hiện đại</h4>
                                <p className={cssHomePage2.moduleDescription}>Xây dựng nền tảng vững chắc về quản trị nhân sự hiện đại. Chương trình bao quát các chức năng thiết yếu của HR, từ thu hút và hội nhập nhân tài, quản lý hiệu suất, gắn kết nhân viên đến các quy định luật lao động cơ bản. Đây là khóa học hoàn hảo cho các chuyên gia nhân sự hoặc các nhà quản lý muốn quản lý hiệu quả tài sản quý giá nhất của mình - con người - và đóng góp một cách chiến lược vào thành công của tổ chức</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Quản trị Chuỗi Cung ứng & Logistics</h4>
                                <p className={cssHomePage2.moduleDescription}>Tối ưu hóa dòng chảy hàng hóa từ nhà cung cấp đến tay khách hàng. Khóa học đi sâu vào các nguyên tắc quan trọng của quản lý chuỗi cung ứng và tồn kho hiện đại. Học cách dự báo nhu cầu chính xác, kiểm soát mức tồn kho để giảm chi phí, cải thiện hiệu quả logistics và xây dựng một chuỗi cung ứng linh hoạt, bền vững. Nắm vững các kỹ năng này để nâng cao sự hài lòng của khách hàng, cải thiện dòng tiền và tạo ra lợi thế cạnh tranh đáng kể.</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Quản trị Rủi ro Doanh nghiệp</h4>
                                <p className={cssHomePage2.moduleDescription}>Chủ động xác định và giảm thiểu các mối đe dọa đối với thành công kinh doanh của bạn. Chương trình thiết yếu này giới thiệu các nguyên tắc cốt lõi của quản trị rủi ro. Bạn sẽ học cách xây dựng một khuôn khổ có hệ thống để xác định, đánh giá và ứng phó với các rủi ro về hoạt động, tài chính và chiến lược. Trang bị cho mình những kỹ năng thực tế để bảo vệ tài sản của tổ chức, đảm bảo hoạt động kinh doanh liên tục và đưa ra các quyết định sáng suốt hơn.</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Quản trị dự án chuyên sâu & hiệu quả</h4>
                                <p className={cssHomePage2.moduleDescription}>Vượt qua những thách thức trong các dự án phức tạp. Chương trình này trang bị cho bạn các phương pháp quản lý dự án tiên tiến, từ Agile đến Waterfall, cùng kỹ năng chuyên sâu về lập kế hoạch, quản trị rủi ro, quản lý ngân sách và lãnh đạo đội ngũ dự án. Hãy làm chủ nghệ thuật hoàn thành dự án đúng hạn, trong ngân sách và vượt trên cả sự mong đợi của các bên liên quan, tạo ra tác động kinh doanh rõ rệt.</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Quản lý và Dẫn dắt Đội nhóm Hiệu suất cao</h4>
                                <p className={cssHomePage2.moduleDescription}>Tập trung vào khía cạnh con người, giúp lãnh đạo chuyển đổi từ "quản lý" sang "người huấn luyện". Nội dung đi sâu vào tâm lý tạo động lực, dẫn dắt đối thoại khó, giải quyết xung đột và đưa phản hồi xây dựng để tạo ra đội ngũ gắn kết, hiệu suất cao</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Chiến lược Cạnh tranh & Đổi mới Sáng tạo</h4>
                                <p className={cssHomePage2.moduleDescription}>Trang bị tư duy chiến lược và năng lực thúc đẩy đổi mới và tầm nhìn rộng. Người dùng học cách phân tích thị trường, nhận diện cơ hội, xây dựng mô hình kinh doanh đột phá và dẫn dắt sự thay đổi. Khóa học tập trung vào công cụ thực tiễn để biến ý tưởng thành kết quả kinh doanh vượt trội</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Tài chính Doanh nghiệp cho Nhà Quản lý</h4>
                                <p className={cssHomePage2.moduleDescription}>Trang bị tư duy tài chính và khả năng đọc hiểu các chỉ số kinh doanh cốt lõi cho nhà quản lý không chuyên. Người học sẽ nắm vững cách đọc báo cáo tài chính, lập và quản lý ngân sách, và phân tích các chỉ số quan trọng để đánh giá sức khỏe doanh nghiệp. Khóa học giúp nhà quản lý/ nhân sự không chuyên đưa ra quyết định vận hành dựa trên dữ liệu, tối ưu hóa chi phí và đóng góp hiệu quả vào mục tiêu chung.</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>AI & Công nghệ 4.0 trong Kinh doanh</h4>
                                <p className={cssHomePage2.moduleDescription}>Xây dựng tư duy chuyển đổi số và trang bị kiến thức nền tảng về Trí tuệ nhân tạo (AI) và tự động hóa. Người học sẽ khám phá các ứng dụng thực tế của AI, học cách phân tích quy trình và làm việc với dữ liệu để tìm ra cơ hội cải tiến. Khóa học cung cấp lộ trình để bắt đầu tự động hóa các tác vụ, ra quyết định dựa trên dữ liệu và dẫn dắt các sáng kiến công nghệ.</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Quản trị Hệ thống Kiểm soát & Đo lường Hiệu suất</h4>
                                <p className={cssHomePage2.moduleDescription}>Thúc đẩy thành công của tổ chức thông qua các hệ thống kiểm soát và hiệu suất hiệu quả. Chương trình cung cấp cho các nhà quản lý công cụ để thiết kế và triển khai các hệ thống kiểm soát quản lý chặt chẽ, thiết lập các chỉ số KPI ý nghĩa và thực hiện đánh giá hiệu suất hiệu quả. Học cách điều chỉnh nỗ lực của đội nhóm với các mục tiêu chiến lược, theo dõi tiến độ chính xác và xây dựng một văn hóa hiệu suất cao, liên tục mang lại kết quả vượt trội.</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>M&A và phân tích đầu tư</h4>
                                <p className={cssHomePage2.moduleDescription}>Nâng cao năng lực tài chính chuyên sâu và phát triển tầm nhìn chiến lược của một Giám đốc Tài chính (CFO). Học viên sẽ đi sâu vào các kỹ thuật phức tạp như mô hình hóa tài chính, định giá doanh nghiệp, quản trị rủi ro và phân tích đầu tư.</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Pháp lý Kinh doanh cho Nhà Quản lý</h4>
                                <p className={cssHomePage2.moduleDescription}>Tự tin điều hướng trong bối cảnh pháp lý phức tạp. Chương trình này được thiết kế cho các nhà lãnh đạo và quản lý doanh nghiệp, cung cấp kiến thức cần thiết về các lĩnh vực pháp lý quan trọng bao gồm hợp đồng, quản trị doanh nghiệp, luật lao động và sở hữu trí tuệ. Hiểu rõ các quyền và nghĩa vụ pháp lý, giảm thiểu rủi ro và đảm bảo hoạt động kinh doanh của bạn tuân thủ đúng quy định. Kiến thức này rất quan trọng để bảo vệ công ty của bạn.</p>
                            </div>

                            <div className={cssHomePage2.moduleCard}>
                                <h4 className={cssHomePage2.moduleTitle}>Chiến lược Tài chính trong Kinh doanh</h4>
                                <p className={cssHomePage2.moduleDescription}>Nâng cao năng lực tài chính chuyên sâu và phát triển tầm nhìn chiến lược của một Giám đốc Tài chính (CFO). Học viên sẽ đi sâu vào các kỹ thuật phức tạp như mô hình hóa tài chính, định giá doanh nghiệp, quản trị rủi ro và phân tích đầu tư. Chương trình tập trung vào việc sử dụng công cụ tài chính hiện đại để tham mưu chiến lược, dẫn dắt các quyết định lớn và tối ưu hóa giá trị doanh nghiệp.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={cssHomePage2.ctaSection}>
                <div className={cssHomePage2.ctaBackground}>
                    {/* Decorative Circles */}
                    <div className={cssHomePage2.ctaCircle1}></div>
                    <div className={cssHomePage2.ctaCircle2}></div>
                    <div className={cssHomePage2.ctaCircle3}></div>

                    {/* Grid Pattern */}
                    <div className={cssHomePage2.ctaPattern}></div>

                    {/* Geometric Shapes */}
                    <svg className={cssHomePage2.ctaShape1} width="200" height="200" viewBox="0 0 200 200" fill="none">
                        <circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="5,5" />
                        <circle cx="100" cy="100" r="60" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                    </svg>

                    <svg className={cssHomePage2.ctaShape2} width="150" height="150" viewBox="0 0 150 150" fill="none">
                        <rect x="20" y="20" width="110" height="110" stroke="rgba(255,255,255,0.1)" strokeWidth="2" rx="8" transform="rotate(15 75 75)" />
                    </svg>

                    <svg className={cssHomePage2.ctaShape3} width="100" height="100" viewBox="0 0 100 100" fill="none">
                        <polygon points="50,10 90,90 10,90" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="rgba(255,255,255,0.03)" />
                    </svg>
                </div>

                <div className={cssHomePage2.ctaContent}>
                    <h2 className={cssHomePage2.ctaTitle}>Sẵn sàng nâng cao năng lực quản lý?</h2>
                    <p className={cssHomePage2.ctaText}>
                        Tham gia AIMBA ngay hôm nay và trải nghiệm phương pháp đào tạo mô phỏng cấp độ MBA
                    </p>
                    <button className={cssHomePage2.ctaButton} onClick={() => setIsRegisterModalOpen(true)}>
                        <span>Đăng ký sử dụng</span>
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className={cssHomePage2.footer}>
                <div className={cssHomePage2.footerContainer}>
                    <p className={cssHomePage2.copyright}>© 2025 AIMBA. All rights reserved.</p>
                </div>
            </footer>
            {/* Login Modal */}
            <Modal
                title={
                    <div className={styles.modalTitle}>
                        <div className={styles.modalTitleMain}>Đăng nhập</div>
                        <div className={styles.modalTitleSub}>Chọn cách đăng nhập phù hợp với bạn</div>
                    </div>
                }
                open={isLoginModalOpen}
                onCancel={() => {
                    setIsLoginModalOpen(false);
                    loginForm.resetFields();
                }}
                footer={null}
                width={480}
                className={styles.customModal}
                centered
            >
                <div className={styles.loginOptions}>
                    <Button
                        size='large'
                        className={styles.gmailLoginBtn}
                        onClick={handleGmailLogin}
                        block
                    >
                        <div className={styles.btnDescInBtn}>
                            <span className={styles.btnDesc}>Đăng nhập với Gmail</span>
                            <span className={styles.btnDescSmall}>Đăng nhập nhanh và bảo mật</span>
                        </div>
                    </Button>

                    <Divider>Hoặc</Divider>

                    <Form
                        layout='vertical'
                        className={styles.modalForm}
                        form={loginForm}
                        onFinish={handleLogin}
                    >
                        <Form.Item
                            label='Tài khoản'
                            name='username'
                            className={styles.formItem}
                            rules={[
                                { required: true, message: 'Vui lòng nhập username!' },
                            ]}
                        >
                            <Input size='large' placeholder='Nhập username' />
                        </Form.Item>
                        <Form.Item
                            label='Mật khẩu'
                            name='password'
                            className={styles.formItem}
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                            ]}
                        >
                            <Input.Password size='large' placeholder='Nhập mật khẩu' />
                        </Form.Item>
                        <Button
                            type='primary'
                            size='large'
                            block
                            htmlType='submit'
                            className={styles.modalSubmitBtn}
                        >
                            Đăng nhập
                        </Button>
                    </Form>
                </div>
            </Modal>

            {/* Register Modal - 2 bước */}
            <Modal
                title={
                    <div className={styles.modalTitle}>
                        <div className={styles.modalTitleMain}>
                            {registerStep === 1 ? 'Đăng ký tài khoản mới' : 'Chọn gói dịch vụ'}
                        </div>
                        <div className={styles.modalTitleSub}>
                            {registerStep === 1 ? 'Nhập thông tin cơ bản để bắt đầu' : 'Chọn gói phù hợp với nhu cầu của bạn'}
                        </div>
                    </div>
                }
                open={isRegisterModalOpen}
                onCancel={() => {
                    setIsRegisterModalOpen(false);
                    registerForm.resetFields();
                    setRegisterStep(1);
                    setTermsAccepted(false);
                    setCreatedUserId(null);
                }}
                footer={registerStep === 1 ? (
                    <div>
                        <Checkbox
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                        >
                            <span className={styles.termsText}>
                                Tôi đồng ý với{' '}
                                <button
                                    type='button'
                                    className={styles.termsLink}
                                    onClick={() => setIsTermsModalOpen(true)}
                                >
                                    Điều khoản & Dịch vụ
                                </button>
                                {' '}của AiMBA
                            </span>
                        </Checkbox>
                        <Button
                            type='primary'
                            size='large'
                            block
                            onClick={() => registerForm.submit()}
                            loading={registerLoading}
                            className={styles.modalSubmitBtn}
                            style={{ marginTop: '12px' }}
                        >
                            Tiếp tục
                        </Button>
                    </div>
                ) : null}
                width={registerStep === 1 ? 480 : 1200}
                className={styles.customModal}
                centered
            >
                {registerStep === 1 ? (
                    <div className={styles.modalScrollContent}>
                        <Form
                            layout='vertical'
                            className={styles.modalForm}
                            form={registerForm}
                            onFinish={handleStep1Submit}
                        >
                            <Form.Item
                                label='Họ tên'
                                name='name'
                                className={styles.formItem}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập họ tên!' },
                                    { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' },
                                ]}
                            >
                                <Input size='large' placeholder='Nhập họ tên' />
                            </Form.Item>
                            <Form.Item
                                label='Email (Gmail)'
                                name='email'
                                className={styles.formItem}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập Gmail!' },
                                    { type: 'email', message: 'Gmail không hợp lệ!' },
                                ]}
                            >
                                <Input size='large' placeholder='Nhập Gmail' />
                            </Form.Item>
                            <Form.Item
                                label='Số điện thoại'
                                name='phone'
                                className={styles.formItem}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' },
                                ]}
                            >
                                <Input size='large' placeholder='Nhập số điện thoại' />
                            </Form.Item>
                        </Form>
                    </div>
                ) : (
                    <div style={{ padding: '20px 0' }}>
                        <PackageGrid
                            onPackageSelect={handlePurchasePackage}
                            loading={paymentLoading}
                        />
                    </div>
                )}
            </Modal>

            {/* Terms Modal */}
            <Modal
                title={
                    <div className={styles.modalTitle}>
                        <div className={styles.modalTitleMain}>Điều khoản & Dịch vụ</div>
                        <div className={styles.modalTitleSub}>AiMBA - Nền tảng kiến thức toàn diện</div>
                    </div>
                }
                open={isTermsModalOpen}
                onCancel={() => setIsTermsModalOpen(false)}
                width={600}
                className={styles.customModal}
                centered
                footer={null}
            >
                <div className={styles.termsContent}>
                    <div className={styles.termsSection}>
                        <h3>1. Điều khoản sử dụng</h3>
                        <p>
                            Bằng việc đăng ký và sử dụng dịch vụ của AiMBA, bạn đồng ý tuân thủ các điều khoản và điều kiện sau:
                        </p>
                        <ul>
                            <li>Sử dụng dịch vụ một cách hợp pháp và phù hợp với mục đích giáo dục</li>
                            <li>Không chia sẻ thông tin đăng nhập với người khác</li>
                            <li>Không sử dụng dịch vụ để vi phạm quyền sở hữu trí tuệ</li>
                            <li>Không thực hiện các hành vi gây hại đến hệ thống</li>
                        </ul>
                    </div>

                    <div className={styles.termsSection}>
                        <h3>2. Quyền riêng tư</h3>
                        <p>
                            Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn:
                        </p>
                        <ul>
                            <li>Thu thập thông tin cần thiết để cung cấp dịch vụ</li>
                            <li>Không chia sẻ thông tin cá nhân với bên thứ ba</li>
                            <li>Bảo mật thông tin theo tiêu chuẩn quốc tế</li>
                            <li>Cho phép bạn kiểm soát thông tin cá nhân</li>
                        </ul>
                    </div>

                    <div className={styles.termsSection}>
                        <h3>3. Dịch vụ miễn phí</h3>
                        <p>
                            AiMBA cung cấp dịch vụ dùng thử miễn phí trong 2 ngày:
                        </p>
                        <ul>
                            <li>Truy cập đầy đủ nội dung kiến thức</li>
                            <li>Tham gia các bài tập tình huống</li>
                            <li>Sử dụng các tính năng cơ bản</li>
                            <li>Hỗ trợ kỹ thuật trong thời gian dùng thử</li>
                        </ul>
                    </div>

                    <div className={styles.termsSection}>
                        <h3>4. Trách nhiệm pháp lý</h3>
                        <p>
                            AiMBA không chịu trách nhiệm về:
                        </p>
                        <ul>
                            <li>Việc sử dụng sai mục đích của người dùng</li>
                            <li>Thông tin không chính xác do người dùng cung cấp</li>
                            <li>Thiệt hại gián tiếp từ việc sử dụng dịch vụ</li>
                            <li>Gián đoạn dịch vụ do lý do khách quan</li>
                        </ul>
                    </div>

                    <div className={styles.termsSection}>
                        <h3>5. Thay đổi điều khoản</h3>
                        <p>
                            Chúng tôi có quyền thay đổi điều khoản này và sẽ thông báo trước cho người dùng.
                            Việc tiếp tục sử dụng dịch vụ sau khi thay đổi được coi là đồng ý với điều khoản mới.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}