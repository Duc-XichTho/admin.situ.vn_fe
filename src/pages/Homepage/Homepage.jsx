import React, { useEffect, useState } from 'react';
import { Button, Form, Input, message, Modal, Radio, Checkbox, Divider, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { loginWithUsername, registerAccountPublic } from '../../apis/public/publicService.jsx';
import { getSettingByTypePublic } from '../../apis/public/publicService.jsx';
import { createPaymentLink } from '../../apis/paymentService';
import { updateUser } from '../../apis/userService';
import PackageGrid from '../../components/PaymentModal/PackageGrid';
import styles from './Homepage.module.css';

const Homepage = () => {
    const [countdown, setCountdown] = useState({
        days: 5,
        hours: 14,
        minutes: 32,
        seconds: 18
    });

    // Homepage content state
    const [homepageContent, setHomepageContent] = useState(null);
    const [homepageImages, setHomepageImages] = useState(null);
    const [contentLoading, setContentLoading] = useState(true);
    const [contentError, setContentError] = useState(null);

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
    const navigate = useNavigate();

    // Fetch homepage content from settings
    const fetchHomepageContent = async () => {
        try {
            setContentLoading(true);
            setContentError(null);

            // Fetch both content and images in parallel
            const [contentResponse, imagesResponse] = await Promise.all([
                getSettingByTypePublic('homepage_content'),
                getSettingByTypePublic('homepage_images')
            ]);

            if (contentResponse && contentResponse.setting) {
                setHomepageContent(contentResponse.setting);
            } else {
                // Fallback to default content if no settings found
                setHomepageContent(getDefaultHomepageContent());
            }

            if (imagesResponse && imagesResponse.setting) {
                setHomepageImages(imagesResponse.setting);
            } else {
                setHomepageImages(null);
            }
        } catch (error) {
            console.error('Error fetching homepage content:', error);
            setContentError(error);
            // Use default content as fallback
            setHomepageContent(getDefaultHomepageContent());
            setHomepageImages(null);
        } finally {
            setContentLoading(false);
        }
    };

    // Default homepage content structure
    const getDefaultHomepageContent = () => ({
        hero: {
            brandLine: "AiMBA - Applied Intelligence MBA",
            brandSubtitle: "Phát triển năng lực qua đào tạo mô phỏng",
            tagline: "Chuyển hóa kiến thức từ \"biết\" sang \"làm được\" với 640+ case study và 170+ khối lý thuyết thực tế",
            description: "Tiên phong trong đào tạo mô phỏng với hệ thống Case Study phong phú hàng đầu. Học từ thực tiễn, áp dụng ngay lập tức trong môi trường kinh doanh Việt Nam.",
            ctaText: "Bắt đầu học ngay!"
        },
        problem: {
            title: "Thách thức của giáo dục truyền thống",
            subtitle: "Nhiều nhà quản lý tại Việt Nam đã đầu tư đáng kể vào các chương trình MBA danh tiếng, nhưng vẫn gặp khó khăn khi áp dụng vào thực tế...",
            cards: [
                {
                    icon: "📚",
                    title: "Quá lý thuyết",
                    image: "[Hình ảnh: Sinh viên trong giảng đường]",
                    description: "Các chương trình MBA truyền thống tập trung vào lý thuyết mà thiếu tính ứng dụng thực tế trong môi trường kinh doanh Việt Nam"
                },
                {
                    icon: "💰",
                    title: "Chi phí cao",
                    image: "[Hình ảnh: Calculator và tiền]",
                    description: "Học phí MBA quốc tế có thể lên đến hàng tỷ đồng, cùng với thời gian nghỉ làm dài hạn"
                },
                {
                    icon: "🏢",
                    title: "Không phù hợp bối cảnh Việt Nam",
                    image: "[Hình ảnh: Văn hóa kinh doanh VN]",
                    description: "Khó áp dụng SWOT khi đối thủ có mạng lưới \"quan hệ\" phức tạp, hay triển khai Design Thinking trong tổ chức phân cấp cao"
                }
            ]
        },
        solution: {
            title: "Giải pháp đột phá từ AiMBA",
            items: [
                {
                    icon: "🔄",
                    title: "Phương pháp Thiết kế Ngược",
                    image: "[Hình ảnh: Quy trình học từ thực tế]",
                    description: "Bắt đầu từ 640+ case study thực tế, đi ngược lại chắt lọc 170+ khối lý thuyết quan trọng nhất. Học để làm được ngay!"
                },
                {
                    icon: "🇻🇳",
                    title: "Bản địa hóa cho thị trường Việt Nam",
                    image: "[Hình ảnh: Doanh nghiệp Việt]",
                    description: "Từ \"Nghệ thuật quan hệ\", \"Vượt qua tâm lý cả nể\" đến \"Quản trị doanh nghiệp gia đình\" - giải quyết thách thức đặc thù Việt Nam"
                },
                {
                    icon: "⚡",
                    title: "Linh hoạt theo nhu cầu",
                    image: "[Hình ảnh: Learning on mobile]",
                    description: "7 module chuyên biệt, học theo tiến độ cá nhân. Không cần nghỉ làm, vẫn phát triển sự nghiệp"
                }
            ]
        },
        howItWorks: {
            title: "Cách thức học tập tại AiMBA",
            steps: [
                {
                    number: "1",
                    title: "Chọn module phù hợp",
                    image: "[Icon: Chọn khóa học]",
                    description: "Lựa chọn từ 7 chương trình chuyên biệt theo vị trí và mục tiêu sự nghiệp của bạn"
                },
                {
                    number: "2",
                    title: "Thực hành với case study thực tế",
                    image: "[Icon: Case study]",
                    description: "Giải quyết các tình huống dựa trên 640+ case study thực tế tại Việt Nam"
                },
                {
                    number: "3",
                    title: "Học sâu qua kiến giải chi tiết",
                    image: "[Icon: Analysis]",
                    description: "Nhận phản hồi chi tiết từ 170+ khối lý thuyết, hiểu \"tại sao\" và kết nối với thực tiễn"
                },
                {
                    number: "4",
                    title: "Áp dụng ngay vào công việc",
                    image: "[Icon: Implementation]",
                    description: "Ứng dụng kiến thức và kỹ năng đã học vào các tình huống thực tế tại công ty"
                }
            ]
        },
        statsOverview: {
            title: "Hệ sinh thái học tập toàn diện",
            stats: [
                {
                    number: "640+",
                    description: "Case Study",
                    detail: "Tình huống thực tế"
                },
                {
                    number: "170+",
                    description: "Khối lý thuyết",
                    detail: "Được chắt lọc cẩn thận"
                },
                {
                    number: "7",
                    description: "Module chuyên biệt",
                    detail: "Từ cơ bản đến nâng cao"
                },
                {
                    number: "1",
                    description: "Năm truy cập",
                    detail: "Học linh hoạt theo lịch"
                }
            ],
            resourceLibrary: {
                title: "Kho tài nguyên chung tham khảo",
                subtitle: "Truy cập mở đến kho tàng tri thức kinh doanh",
                resources: [
                    {
                        title: "50+ Brand Stories",
                        description: "Câu chuyện thành công từ các thương hiệu toàn cầu và Việt Nam"
                    },
                    {
                        title: "40+ Business Models",
                        description: "Mô hình kinh doanh đã được chứng minh thành công"
                    },
                    {
                        title: "24+ Phân tích sách",
                        description: "Luận giải chi tiết từ các cuốn sách kinh doanh nổi tiếng"
                    },
                    {
                        title: "Hàng trăm tài nguyên",
                        description: "Template, framework, checklist và công cụ hữu ích"
                    }
                ]
            }
        },
        programs: {
            title: "7 Module chuyên biệt của AiMBA",
            subtitle: "Mỗi module tập trung giải quyết các năng lực cụ thể, từ cơ bản đến nâng cao",
            modules: [
                {
                    title: "D101 - Essential Professional Skills",
                    image: "[Hình ảnh: Professional skills]",
                    description: "Bệ phóng sự nghiệp vững chắc cho sinh viên và nhân sự mới. Case study phân bố: 80+ tình huống cơ bản"
                },
                {
                    title: "D201 - Advanced Sales & Negotiation",
                    image: "[Hình ảnh: Sales meeting]",
                    description: "Đỉnh cao nghệ thuật bán hàng và đàm phán. Case study phân bố: 100+ tình huống sales thực chiến"
                },
                {
                    title: "D251 - Strategic Marketing Methodology",
                    image: "[Hình ảnh: Marketing strategy]",
                    description: "Tư duy marketing chiến lược cho thời đại số. Case study phân bố: 90+ tình huống marketing"
                },
                {
                    title: "D501 - Business Finance Essential",
                    image: "[Hình ảnh: Financial analysis]",
                    description: "Tài chính kinh doanh cho nhà quản lý không chuyên. Case study phân bố: 70+ tình huống tài chính"
                },
                {
                    title: "D551 - Business Finance Mastery",
                    image: "[Hình ảnh: Advanced finance]",
                    description: "Chuyên gia tài chính chiến lược cho CFO và chuyên viên tài chính. Case study phân bố: 80+ tình huống nâng cao"
                },
                {
                    title: "D601 - Team Leadership & Management",
                    image: "[Hình ảnh: Team leadership]",
                    description: "Năng lực lãnh đạo đội ngũ hiệu quả. Case study phân bố: 85+ tình huống quản lý nhân sự"
                },
                {
                    title: "D801 - Competitive Strategy & Innovation",
                    image: "[Hình ảnh: Strategy planning]",
                    description: "Chiến lược cạnh tranh và đổi mới sáng tạo cho lãnh đạo cấp cao. Case study phân bố: 75+ tình huống chiến lược"
                },
                {
                    title: "D901 - AI & Technology 4.0 for Business",
                    image: "[Hình ảnh: AI technology]",
                    description: "Chuyển đổi doanh nghiệp với AI và công nghệ 4.0. Case study phân bố: 60+ tình huống công nghệ"
                }
            ]
        },
        socialProof: {
            title: "Được tin tưởng bởi",
            image: "[Hình ảnh: Testimonials từ học viên, logos của các công ty]"
        },
        faq: {
            title: "Câu hỏi thường gặp",
            items: [
                {
                    question: "AiMBA khác gì với MBA truyền thống?",
                    answer: "AiMBA tập trung vào tính ứng dụng thực tế với phương pháp thiết kế ngược, bắt đầu từ 640+ case study thực tế rồi đi ngược lại 170+ khối lý thuyết. Phù hợp với bối cảnh kinh doanh Việt Nam và linh hoạt theo thời gian học tập."
                },
                {
                    question: "Tôi có thể học riêng lẻ từng module không?",
                    answer: "AiMBA được thiết kế như một hệ sinh thái học tập toàn diện. Bạn sẽ nhận được trọn bộ 7 module để phát triển năng lực một cách hệ thống từ cơ bản đến nâng cao, đảm bảo tính liên kết và hiệu quả tối ưu."
                },
                {
                    question: "640+ case study được phân bố như thế nào trong các module?",
                    answer: "Mỗi module có số lượng case study khác nhau tùy theo độ phức tạp: D101 (80+), D201 (100+), D251 (90+), D501 (70+), D551 (80+), D601 (85+), D801 (75+), D901 (60+). Tất cả đều dựa trên tình huống thực tế tại Việt Nam."
                },
                {
                    question: "Có chứng chỉ sau khi hoàn thành không?",
                    answer: "Có, bạn sẽ nhận được chứng chỉ hoàn thành từ AiMBA sau khi hoàn thành các bài tập và đánh giá trong chương trình."
                },
                {
                    question: "Có hỗ trợ tư vấn trong quá trình học không?",
                    answer: "Có, chúng tôi có đội ngũ mentor hỗ trợ học viên qua hệ thống Q&A và forum thảo luận, cùng với truy cập vào kho tài nguyên chung với 50+ Brand Stories, 40+ Business Models và hàng trăm tài liệu tham khảo."
                }
            ]
        },
        finalCta: {
            title: "Ưu đãi có thời hạn!",
            subtitle: "Đăng ký ngay để nhận ưu đãi đặc biệt",
            pricing: {
                title: "Gói ưu đãi đặc biệt",
                price: "489.000 VND",
                period: "Mỗi khóa học - Truy cập 1 năm",
                specialOffer: "🎯 Đăng ký từ 3 khóa trở lên: GIẢM GIÁ ĐẶC BIỆT!",
                features: [
                    "✅ Truy cập đầy đủ 640+ case study",
                    "✅ 170+ khối lý thuyết được kiến giải chi tiết",
                    "✅ Kho tài nguyên: 50+ Brand Stories, 40+ Business Models",
                    "✅ 24+ phân tích sách kinh doanh nổi tiếng",
                    "✅ Chứng chỉ hoàn thành cho từng module",
                    "✅ Hỗ trợ mentor 24/7"
                ],
                ctaText: "ĐĂNG KÝ NGAY - TIẾT KIỆM 30%",
                disclaimer: "*Ưu đãi có thời hạn. Áp dụng cho 100 học viên đầu tiên"
            }
        }
    });

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

    // FAQ Toggle
    const toggleFAQ = (element) => {
        // Find the button element (in case the span was clicked)
        const button = element.closest(`.${styles.faqQuestion}`) || element;
        const answer = button.nextElementSibling;
        const icon = button.querySelector('span');

        // Check if elements exist before accessing properties
        if (!answer || !icon) {
            console.warn('FAQ elements not found');
            return;
        }

        const isOpen = answer.style.display === 'block';

        // Close all other FAQs
        document.querySelectorAll(`.${styles.faqAnswer}`).forEach(faq => {
            faq.style.display = 'none';
        });
        document.querySelectorAll(`.${styles.faqQuestion} span`).forEach(span => {
            span.textContent = '+';
        });

        // Toggle current FAQ
        if (!isOpen) {
            answer.style.display = 'block';
            icon.textContent = '−';
        }
    };

    // Fetch homepage content on component mount
    useEffect(() => {
        fetchHomepageContent();
    }, []);

    // Countdown Timer
    useEffect(() => {
        const updateCountdown = () => {
            // Set target date (5 days from now for demo)
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 5);
            targetDate.setHours(23, 59, 59, 999);

            const now = new Date().getTime();
            const timeLeft = targetDate.getTime() - now;

            if (timeLeft > 0) {
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

                setCountdown({
                    days: days.toString().padStart(2, '0'),
                    hours: hours.toString().padStart(2, '0'),
                    minutes: minutes.toString().padStart(2, '0'),
                    seconds: seconds.toString().padStart(2, '0')
                });
            } else {
                setCountdown({
                    days: '00',
                    hours: '00',
                    minutes: '00',
                    seconds: '00'
                });
            }
        };

        // Update countdown every second
        const interval = setInterval(updateCountdown, 1000);
        updateCountdown(); // Initial call

        return () => clearInterval(interval);
    }, []);

    // Smooth scrolling for anchor links
    useEffect(() => {
        const handleSmoothScroll = (e) => {
            if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        };

        document.addEventListener('click', handleSmoothScroll);
        return () => document.removeEventListener('click', handleSmoothScroll);
    }, []);

    // Add scroll effect to header
    useEffect(() => {
        const handleScroll = () => {
            const header = document.querySelector(`.${styles.header}`);
            if (header) {
                if (window.scrollY > 100) {
                    header.style.background = 'linear-gradient(135deg, rgba(14, 114, 176, 0.95) 0%, rgba(40, 168, 224, 0.95) 100%)';
                    header.style.backdropFilter = 'blur(10px)';
                } else {
                    header.style.background = 'linear-gradient(135deg, #0E72B0 0%, #28A8E0 100%)';
                    header.style.backdropFilter = 'none';
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Show loading state
    if (contentLoading) {
        return (
            <div className={styles.homepage}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <Spin size="large" />
                </div>
            </div>
        );
    }

    // Show error state
    if (contentError && !homepageContent) {
        return (
            <div className={styles.homepage}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    fontSize: '1.2rem',
                    color: '#e74c3c',
                    flexDirection: 'column'
                }}>
                    <p>Có lỗi khi tải nội dung trang chủ</p>
                    <button
                        onClick={fetchHomepageContent}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#0E72B0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.homepage}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <img src="/AiMBA1.png" alt="AiMBA" className={styles.logo} style={{ width: '120px', height: '30px' }} />
                    <div className={styles.authButtons}>
                        <button
                            className={`${styles.btn} ${styles.btnOutline}`}
                            onClick={() => handleGmailLogin()}
                        >
                            Đăng nhập
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={() => setIsRegisterModalOpen(true)}
                        >
                            Đăng ký
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBlocks}>
                    <div className={`${styles.colorBlock} ${styles.block1}`}></div>
                    <div className={`${styles.colorBlock} ${styles.block2}`}></div>
                    <div className={`${styles.colorBlock} ${styles.block3}`}></div>
                    <div className={`${styles.colorBlock} ${styles.block4}`}></div>
                </div>

                <div className={styles.container}>
                    {homepageContent && homepageContent.hero && (
                        <>
                            <div className={styles.heroBrandLine}>
                                {homepageContent.hero.brandLine}
                                <span className={styles.brandSubtitle}>{homepageContent.hero.brandSubtitle}</span>
                            </div>

                            <p className={styles.heroTagline}>
                                {homepageContent.hero.tagline}
                            </p>

                            <p className={styles.heroDescription}>
                                {homepageContent.hero.description}
                            </p>

                            <div className={styles.heroCta}>
                                <a href="#final-cta" className={`${styles.btn} ${styles.btnHero} ${styles.pulse}`}>
                                    {homepageContent.hero.ctaText}
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Problem Section */}
            <section className={styles.problem}>
                <div className={styles.container}>
                    {homepageContent && homepageContent.problem && (
                        <>
                            <h2 className={styles.sectionTitle}>{homepageContent.problem.title}</h2>
                            <p className={styles.sectionSubtitle}>
                                {homepageContent.problem.subtitle}
                            </p>

                            <div className={styles.problemGrid}>
                                {homepageContent.problem.cards && homepageContent.problem.cards.map((card, index) => (
                                    <div key={index} className={styles.problemCard}>
                                        <div className={styles.problemIcon}>{card.icon}</div>
                                        <h3>{card.title}</h3>
                                        {homepageImages?.problem?.cards?.[index] ? (
                                            <img
                                                src={homepageImages.problem.cards[index]}
                                                alt={card.title}
                                                className={styles.problemImage}
                                            />
                                        ) : (
                                            <div className={styles.photoPlaceholder}>{card.image}</div>
                                        )}
                                        <p>{card.description}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Solution Section */}
            <section className={styles.solution}>
                <div className={styles.container}>
                    {homepageContent && homepageContent.solution && (
                        <>
                            <h2 className={styles.sectionTitle}>{homepageContent.solution.title}</h2>

                            <div className={styles.solutionGrid}>
                                {homepageContent.solution.items && homepageContent.solution.items.map((item, index) => (
                                    <div key={index} className={styles.solutionItem}>
                                        <div className={styles.solutionIcon}>{item.icon}</div>
                                        <h3>{item.title}</h3>
                                        {homepageImages?.solution?.items?.[index] ? (
                                            <img
                                                src={homepageImages.solution.items[index]}
                                                alt={item.title}
                                                className={styles.solutionImage}
                                            />
                                        ) : (
                                            <div className={styles.photoPlaceholder}>{item.image}</div>
                                        )}
                                        <p>{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* How It Works */}
            <section className={styles.howItWorks}>
                <div className={styles.container}>
                    {homepageContent && homepageContent.howItWorks && (
                        <>
                            <h2 className={styles.sectionTitle}>{homepageContent.howItWorks.title}</h2>

                            <div className={styles.processContainer}>
                                <div className={styles.processFlow}>
                                    {homepageContent.howItWorks.steps && homepageContent.howItWorks.steps.map((step, index) => (
                                        <div key={index} className={styles.step}>
                                            <div className={styles.stepNumber}>{step.number}</div>
                                            <h3>{step.title}</h3>
                                            {homepageImages?.howItWorks?.steps?.[index] ? (
                                                <img
                                                    src={homepageImages.howItWorks.steps[index]}
                                                    alt={step.title}
                                                    className={styles.stepImage}
                                                />
                                            ) : (
                                                <div className={styles.photoPlaceholder}>{step.image}</div>
                                            )}
                                            <p>{step.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Stats Overview */}
            <section className={styles.statsOverview}>
                <div className={styles.container}>
                    {homepageContent && homepageContent.statsOverview && (
                        <>
                            <h2 className={styles.sectionTitle} style={{ color: 'white' }}>{homepageContent.statsOverview.title}</h2>

                            <div className={styles.statsGrid}>
                                {homepageContent.statsOverview.stats && homepageContent.statsOverview.stats.map((stat, index) => (
                                    <div key={index} className={styles.statItem}>
                                        <span className={styles.statNumber}>{stat.number}</span>
                                        <p className={styles.statDescription}>{stat.description}</p>
                                        <p className={styles.statDetail}>{stat.detail}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Resource Library */}
                            {homepageContent.statsOverview.resourceLibrary && (
                                <div className={styles.resourceLibrary}>
                                    <h3 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'white' }}>
                                        {homepageContent.statsOverview.resourceLibrary.title}
                                    </h3>
                                    <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
                                        {homepageContent.statsOverview.resourceLibrary.subtitle}
                                    </p>

                                    <div className={styles.resourceGrid}>
                                        {homepageContent.statsOverview.resourceLibrary.resources && homepageContent.statsOverview.resourceLibrary.resources.map((resource, index) => (
                                            <div key={index} className={styles.resourceItem}>
                                                <h4>{resource.title}</h4>
                                                <p>{resource.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Programs */}
            <section className={styles.programs}>
                <div className={styles.container}>
                    {homepageContent && homepageContent.programs && (
                        <>
                            <h2 className={styles.sectionTitle}>{homepageContent.programs.title}</h2>
                            <p className={styles.sectionSubtitle}>{homepageContent.programs.subtitle}</p>

                            <div className={styles.programsGrid}>
                                {homepageContent.programs.modules && homepageContent.programs.modules.map((module, index) => (
                                    <div key={index} className={styles.programCard}>
                                        <h3>{module.title}</h3>
                                        {homepageImages?.programs?.modules?.[index] ? (
                                            <img
                                                src={homepageImages.programs.modules[index]}
                                                alt={module.title}
                                                className={styles.programImage}
                                            />
                                        ) : (
                                            <div className={styles.photoPlaceholder}>{module.image}</div>
                                        )}
                                        <p>{module.description}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Social Proof */}
            <section className={styles.socialProof}>
                <div className={styles.container}>
                    {homepageContent && homepageContent.socialProof && (
                        <>
                            <h2 className={styles.sectionTitle} style={{ color: 'white' }}>{homepageContent.socialProof.title}</h2>

                            {homepageImages?.socialProof?.testimonials ? (
                                <img
                                    src={homepageImages.socialProof.testimonials}
                                    alt="Testimonials"
                                    className={styles.socialProofImage}
                                />
                            ) : (
                                <div className={styles.photoPlaceholder} style={{ marginTop: '3rem', height: '300px' }}>
                                    {homepageContent.socialProof.image}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* FAQ */}
            <section className={styles.faq}>
                <div className={styles.container}>
                    {homepageContent && homepageContent.faq && (
                        <>
                            <h2 className={styles.sectionTitle}>{homepageContent.faq.title}</h2>

                            {homepageContent.faq.items && homepageContent.faq.items.map((faq, index) => (
                                <div key={index} className={styles.faqItem}>
                                    <button className={styles.faqQuestion} onClick={(e) => toggleFAQ(e.target)}>
                                        {faq.question}
                                        <span>+</span>
                                    </button>
                                    <div className={styles.faqAnswer}>
                                        {faq.answer}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </section>

            {/* Final CTA */}
            <section className={styles.finalCta} id="final-cta">
                <div className={styles.container}>
                    {homepageContent && homepageContent.finalCta && (
                        <>
                            <h2 className={styles.sectionTitle} style={{ color: 'white' }}>{homepageContent.finalCta.title}</h2>
                            <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.9 }}>{homepageContent.finalCta.subtitle}</p>

                            <div className={styles.countdown}>
                                <div className={styles.countdownItem}>
                                    <span className={styles.countdownNumber}>{countdown.days}</span>
                                    <span>Ngày</span>
                                </div>
                                <div className={styles.countdownItem}>
                                    <span className={styles.countdownNumber}>{countdown.hours}</span>
                                    <span>Giờ</span>
                                </div>
                                <div className={styles.countdownItem}>
                                    <span className={styles.countdownNumber}>{countdown.minutes}</span>
                                    <span>Phút</span>
                                </div>
                                <div className={styles.countdownItem}>
                                    <span className={styles.countdownNumber}>{countdown.seconds}</span>
                                    <span>Giây</span>
                                </div>
                            </div>

                            {homepageContent.finalCta.pricing && (
                                <div className={styles.pricing}>
                                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: 600 }}>
                                        {homepageContent.finalCta.pricing.title}
                                    </h3>
                                    <div className={styles.price}>{homepageContent.finalCta.pricing.price}</div>
                                    <p style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.9 }}>
                                        {homepageContent.finalCta.pricing.period}
                                    </p>
                                    <p style={{ color: '#0E72B0', fontWeight: 'bold', marginBottom: '2rem', fontSize: '1.1rem' }}>
                                        {homepageContent.finalCta.pricing.specialOffer}
                                    </p>
                                    <ul>
                                        {homepageContent.finalCta.pricing.features && homepageContent.finalCta.pricing.features.map((feature, index) => (
                                            <li key={index}>{feature}</li>
                                        ))}
                                    </ul>
                                    <button
                                        className={`${styles.btn} ${styles.btnHero} ${styles.pulse}`}
                                        style={{ fontSize: '1.3rem', padding: '1.4rem 3rem', marginTop: '2rem' }}
                                        onClick={() => setIsRegisterModalOpen(true)}
                                    >
                                        {homepageContent.finalCta.pricing.ctaText}
                                    </button>
                                    <p style={{ fontSize: '0.95rem', marginTop: '1.5rem', opacity: 0.8, color: '#868686' }}>
                                        {homepageContent.finalCta.pricing.disclaimer}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

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
};

export default Homepage;
