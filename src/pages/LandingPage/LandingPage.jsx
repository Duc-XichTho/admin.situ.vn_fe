import React, { useContext, useEffect, useState } from 'react';
import { MyContext } from '../../MyContext.jsx';
import { registerAccountPublic, updateAccountTrial } from '../../apis/public/publicService.jsx';
import { createPaymentLink } from '../../apis/paymentService';
import { updateUser } from '../../apis/userService';
import { Modal, message } from 'antd';
import PackageGrid from '../../components/PaymentModal/PackageGrid';
import { createLandingPageConfig } from './landingPageConfig.js';
import { getSettingByTypePublic } from '../../apis/public/publicService.jsx';

const LandingPage = () => {
    const { currentUser } = useContext(MyContext);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [createdUserId, setCreatedUserId] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);

    const handleGmailLogin = () => {
        const currentPath = '/home';
        window.open(`${import.meta.env.VITE_API_URL}/login?redirect=${encodeURIComponent(currentPath)}`, '_self');
    };

    // Bước 1: Tạo user với thông tin cơ bản
    const handleStep1Submit = async (values) => {
        try {
            const formattedData = {
                name: values.name,
                phone: values.phone,
                email: values.email,
                address: values.address,
            };

            const res = await registerAccountPublic(formattedData);
            if (res.code === 'USER_EXIST') {
                message.error(res.message);
                return { type: 'error', message: res.message };
            } else {
                // Lưu user ID để dùng cho bước 2
                const userId = res.data?.id || res.id || res.user?.id;
                setCreatedUserId(userId);
                message.success('Tài khoản đã được tạo thành công! Vui lòng chọn gói để tiếp tục.');
                return { type: 'success', message: 'Tài khoản đã được tạo thành công!' };
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';
            message.error(errorMessage);
            return { type: 'error', message: errorMessage };
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

                await updateAccountTrial(createdUserId, updateData);
                message.success(`Gói dùng thử ${packageData.durationText} đã được kích hoạt thành công!`);

                // Đóng modal
                setTimeout(() => {
                    setIsRegisterModalOpen(false);
                    setCreatedUserId(null);
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
                cancelUrl: `${window.location.origin}/landing`,
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

    // Deep merge function để merge nested objects
    const deepMerge = (defaultObj, customObj) => {
        if (!customObj || typeof customObj !== 'object' || Array.isArray(customObj)) {
            return customObj !== undefined ? customObj : defaultObj;
        }
        
        const result = { ...defaultObj };
        
        for (const key in customObj) {
            if (customObj.hasOwnProperty(key)) {
                if (
                    defaultObj[key] &&
                    typeof defaultObj[key] === 'object' &&
                    !Array.isArray(defaultObj[key]) &&
                    customObj[key] &&
                    typeof customObj[key] === 'object' &&
                    !Array.isArray(customObj[key])
                ) {
                    // Recursive merge cho nested objects
                    result[key] = deepMerge(defaultObj[key], customObj[key]);
                } else {
                    // Override với custom value (hoặc giữ default nếu custom là undefined/null)
                    result[key] = customObj[key] !== undefined && customObj[key] !== null 
                        ? customObj[key] 
                        : defaultObj[key];
                }
            }
        }
        
        return result;
    };

    useEffect(() => {
        const renderLandingPage = async () => {
            // Tạo landing page config với các handlers (default config từ hardcode)
            const defaultConfig = createLandingPageConfig({
                onRegistrationRequest() {
                    // Smooth scroll đến section Registration
                    const registrationSection = document.querySelector('#Registration') || document.querySelector('[id*="Registration"]');
                    if (registrationSection) {
                        registrationSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    } else {
                        // Fallback: update URL và scroll
                        window.history.pushState(null, '', '#Registration');
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }
                },
                onLoginRequest() {
                    handleGmailLogin();
                },
                async onRegistrationFormSubmit({ formData, onFeedback }) {
                    let values = {};
                    for (let [name, value] of formData.entries()) {
                        values[name] = value;
                    }

                    // Gọi API đăng ký
                    const result = await handleStep1Submit(values);

                    if (result) {
                        // Nếu đăng ký thành công, mở modal chọn gói
                        if (result.type === 'success') {
                            setIsRegisterModalOpen(true);
                        }
                        // Gửi feedback cho external JS
                        onFeedback(result);
                    }
                }
            });

            // Load config từ database (nếu có)
            let customConfigContents = null;
            try {
                const setting = await getSettingByTypePublic('LANDING_PAGE_CONFIG');
                if (setting && setting.setting && setting.setting.contents) {
                    customConfigContents = setting.setting.contents;
                }
            } catch (error) {
                console.log('Không tìm thấy config trong database, sử dụng config mặc định từ hardcode');
            }

            // Deep merge: default config làm base, custom config override các field đã chỉnh sửa
            const landingPageConfig = {
                ...defaultConfig,
                contents: customConfigContents 
                    ? deepMerge(defaultConfig.contents, customConfigContents)
                    : defaultConfig.contents
            };

            // Landing page root
            const landingPageRoot = document.getElementById('landing-page-root');

            if (!landingPageRoot) {
                console.error('❌ Không tìm thấy element với id "landing-page-root"');
                return;
            }

            // Render landing page into root with config
            try {
                window.aimbaLP.render(landingPageRoot, landingPageConfig);
                console.log('✅ Landing page đã được render thành công');
            } catch (error) {
                console.error('❌ Lỗi khi render landing page:', error);
            }
        };

        // Đợi aimbaLP object sẵn sàng từ file JS đã load trong index.html
        const waitForAimbaLP = () => {
            if (typeof window.aimbaLP !== 'undefined') {
                console.log('✅ aimbaLP đã sẵn sàng');
                renderLandingPage().catch(error => {
                    console.error('❌ Lỗi khi render landing page:', error);
                });
            } else {
                console.log('⏳ Đang đợi aimbaLP...');
                setTimeout(waitForAimbaLP, 50);
            }
        };

        // Bắt đầu đợi aimbaLP (JS đã được load trong index.html)
        waitForAimbaLP();
    }, []);

    // Xử lý smooth scroll cho tất cả anchor links trong landing page
    useEffect(() => {
        const handleSmoothScroll = (e) => {
            // Kiểm tra nếu click vào link có href bắt đầu bằng #
            const target = e.target.closest('a[href^="#"]');
            if (target) {
                const href = target.getAttribute('href');
                if (href && href !== '#') {
                    e.preventDefault();
                    const targetElement = document.querySelector(href);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                        // Update URL without triggering scroll
                        window.history.pushState(null, '', href);
                    }
                }
            }
        };

        // Lắng nghe click events trên landing page root
        const landingPageRoot = document.getElementById('landing-page-root');
        if (landingPageRoot) {
            landingPageRoot.addEventListener('click', handleSmoothScroll);
            return () => {
                landingPageRoot.removeEventListener('click', handleSmoothScroll);
            };
        }
    }, []);

    return (
        <>
            <div
                id="landing-page-root"
                className={`landing-page-root`}
            >
                {/* File JS sẽ tự động tìm element có class "landing-page-root" và render nội dung vào đây */}
            </div>

            {/* Register Modal - Chọn gói */}
            <Modal
                title={
                    <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                            Chọn gói dịch vụ
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                            Chọn gói phù hợp với nhu cầu của bạn
                        </div>
                    </div>
                }
                open={isRegisterModalOpen}
                onCancel={() => {
                    setIsRegisterModalOpen(false);
                    setCreatedUserId(null);
                }}
                footer={null}
                width={1200}
                centered
            >
                <div style={{ padding: '20px 0' }}>
                    <PackageGrid
                        onPackageSelect={handlePurchasePackage}
                        loading={paymentLoading}
                    />
                </div>
            </Modal>
        </>
    );
};

export default LandingPage;

