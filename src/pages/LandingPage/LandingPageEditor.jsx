import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Form, Input, Button, message, Space, Card, Typography, Divider, Upload, Image, Row, Col, Switch, Popconfirm, Collapse, Spin } from 'antd';
import { UploadOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getSettingByType, createOrUpdateSetting } from '../../apis/settingService';
import { uploadFiles } from '../../apis/uploadImageWikiNoteService';
import { createLandingPageConfig } from './landingPageConfig';
import PackageGrid from '../../components/PaymentModal/PackageGrid';
import { Modal } from 'antd';

const { TextArea } = Input;
const { Panel } = Collapse;

const LandingPageEditor = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState({});
    const [defaultConfig, setDefaultConfig] = useState(null);
    const [previewKey, setPreviewKey] = useState(0); // Force re-render preview
    const previewContainerRef = useRef(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [createdUserId, setCreatedUserId] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const renderTimerRef = useRef(null); // Ref để lưu timer

    // Deep merge function
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
                    result[key] = deepMerge(defaultObj[key], customObj[key]);
                } else {
                    result[key] = customObj[key] !== undefined && customObj[key] !== null 
                        ? customObj[key] 
                        : defaultObj[key];
                }
            }
        }
        
        return result;
    };

    // Load config
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            // Load default config từ hardcode
            const defaultConfigData = createLandingPageConfig({
                onRegistrationRequest: () => {},
                onLoginRequest: () => {},
                onRegistrationFormSubmit: async () => {}
            });
            setDefaultConfig(defaultConfigData);

            // Load config từ database (nếu có)
            let customConfigContents = null;
            try {
                const setting = await getSettingByType('LANDING_PAGE_CONFIG');
                if (setting && setting.setting && setting.setting.contents) {
                    customConfigContents = setting.setting.contents;
                }
            } catch (error) {
                console.log('Không tìm thấy config trong database, sử dụng config mặc định');
            }

            // Deep merge
            const configContents = customConfigContents 
                ? deepMerge(defaultConfigData.contents, customConfigContents)
                : defaultConfigData.contents;

            // Set form values
            form.setFieldsValue({
                banner: {
                    backgroundImage: {
                        landscape: { src: configContents.banner?.backgroundImage?.landscape?.src || '' },
                        portrait: { src: configContents.banner?.backgroundImage?.portrait?.src || '' }
                    },
                    coverImage: {
                        src: configContents.banner?.coverImage?.src || '',
                        alt: configContents.banner?.coverImage?.alt || ''
                    }
                },
                ecoSystem: {
                    highlightsBackgroundImage: {
                        src: configContents.ecoSystem?.highlightsBackgroundImage?.src || ''
                    },
                    slideImages: configContents.ecoSystem?.slideImages || []
                },
                resources: {
                    brandStories: {
                        slideImages: configContents.resources?.brandStories?.slideImages || []
                    },
                    businessModels: {
                        slideImages: configContents.resources?.businessModels?.slideImages || []
                    },
                    bookInsights: {
                        slideImages: configContents.resources?.bookInsights?.slideImages || []
                    },
                    miscellaneous: {
                        slideImages: configContents.resources?.miscellaneous?.slideImages || []
                    }
                },
                modules: {
                    backgroundImage: {
                        src: configContents.modules?.backgroundImage?.src || ''
                    },
                    slideVideos: configContents.modules?.slideVideos || []
                },
                coreValues: {
                    backgroundImage: {
                        src: configContents.coreValues?.backgroundImage?.src || ''
                    }
                },
                ourSolution: {
                    coverImage: {
                        src: configContents.ourSolution?.coverImage?.src || '',
                        alt: configContents.ourSolution?.coverImage?.alt || ''
                    },
                    slideImages: configContents.ourSolution?.slideImages || []
                },
                learningStrategy: {
                    backgroundImage: {
                        src: configContents.learningStrategy?.backgroundImage?.src || ''
                    },
                    coverImage: {
                        src: configContents.learningStrategy?.coverImage?.src || '',
                        alt: configContents.learningStrategy?.coverImage?.alt || ''
                    }
                },
                targetAudience: {
                    backgroundImage: {
                        src: configContents.targetAudience?.backgroundImage?.src || ''
                    },
                    certificateImage: {
                        src: configContents.targetAudience?.certificateImage?.src || '',
                        alt: configContents.targetAudience?.certificateImage?.alt || ''
                    }
                },
                beingTrusted: {
                    testimonials: configContents.beingTrusted?.testimonials || []
                },
                registration: {
                    backgroundImage: {
                        src: configContents.registration?.backgroundImage?.src || ''
                    }
                },
                frequentlyAskedQuestions: {
                    questionsAndAnswers: configContents.frequentlyAskedQuestions?.questionsAndAnswers || []
                },
                footer: {
                    qrCode: {
                        title: configContents.footer?.qrCode?.title || '',
                        data: configContents.footer?.qrCode?.data || '',
                        image: {
                            src: configContents.footer?.qrCode?.image?.src || ''
                        }
                    }
                }
            });

            // Render preview sau khi load xong
            setTimeout(() => {
                renderPreview();
            }, 100);
        } catch (error) {
            console.error('Error loading config:', error);
            message.error('Lỗi khi tải cấu hình!');
        } finally {
            setLoading(false);
        }
    };

    // Watch form changes và update preview - sử dụng Form.Item shouldUpdate
    const [renderTrigger, setRenderTrigger] = useState(0);
    
    // Tăng renderTrigger mỗi khi form thay đổi
    useEffect(() => {
        if (defaultConfig) {
            const timer = setTimeout(() => {
                setRenderTrigger(prev => prev + 1);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [defaultConfig]);

    // Render preview landing page
    const renderPreview = useCallback(() => {
        if (!defaultConfig || !previewContainerRef.current) return;

        try {
            const currentValues = form.getFieldsValue() || {};
            const defaultContents = defaultConfig.contents || {};
            const mergedContents = deepMerge(defaultContents, currentValues);

            const landingPageConfig = {
                ...defaultConfig,
                contents: mergedContents,
                onRegistrationRequest() {
                    const registrationSection = document.querySelector('#Registration') || document.querySelector('[id*="Registration"]');
                    if (registrationSection) {
                        registrationSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                },
                onLoginRequest() {
                    message.info('Chức năng đăng nhập (preview mode)');
                },
                async onRegistrationFormSubmit({ formData, onFeedback }) {
                    message.info('Chức năng đăng ký (preview mode)');
                    onFeedback({ type: 'info', message: 'Preview mode' });
                }
            };

            const container = previewContainerRef.current;
            if (!container) return;

            // Render landing page - chỉ clear và render nếu aimbaLP sẵn sàng
            if (typeof window.aimbaLP !== 'undefined' && window.aimbaLP.render) {
                try {
                    // Lưu scroll position để giữ nguyên vị trí xem
                    const scrollTop = container.scrollTop;
                    
                    // Clear container và render
                    container.innerHTML = '';
                    
                    // Render ngay lập tức
                    window.aimbaLP.render(container, landingPageConfig);
                    
                    // Khôi phục scroll position sau một chút
                    setTimeout(() => {
                        if (container) {
                            container.scrollTop = scrollTop;
                        }
                    }, 100);
                    
                    console.log('✅ Preview đã được render');
                } catch (renderError) {
                    console.error('Error in aimbaLP.render:', renderError);
                    // Nếu lỗi, thử render lại với config cũ
                    message.warning('Lỗi khi render preview, vui lòng thử lại');
                }
            } else {
                console.warn('⏳ aimbaLP chưa sẵn sàng, đang đợi...');
                // Retry sau 300ms
                setTimeout(() => {
                    if (typeof window.aimbaLP !== 'undefined' && window.aimbaLP.render && previewContainerRef.current) {
                        try {
                            previewContainerRef.current.innerHTML = '';
                            window.aimbaLP.render(previewContainerRef.current, landingPageConfig);
                            console.log('✅ Preview đã được render (retry)');
                        } catch (renderError) {
                            console.error('Error in aimbaLP.render (retry):', renderError);
                        }
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Error rendering preview:', error);
        }
    }, [defaultConfig, form]);
    
    // Render preview khi renderTrigger thay đổi
    useEffect(() => {
        if (defaultConfig && renderTrigger > 0) {
            renderPreview();
        }
    }, [renderTrigger, defaultConfig, renderPreview]);

    // Đợi aimbaLP sẵn sàng
    useEffect(() => {
        const waitForAimbaLP = () => {
            if (typeof window.aimbaLP !== 'undefined') {
                console.log('✅ aimbaLP đã sẵn sàng');
                renderPreview();
            } else {
                setTimeout(waitForAimbaLP, 100);
            }
        };
        waitForAimbaLP();
    }, []);

    const handleImageUpload = async (file, fieldPath) => {
        setUploading(prev => ({ ...prev, [fieldPath]: true }));
        try {
            const response = await uploadFiles([file]);
            const imageUrl = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';
            if (imageUrl) {
                const pathArray = fieldPath.split('.');
                form.setFieldValue(pathArray, imageUrl);
                message.success('Upload ảnh thành công!');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            message.error('Upload ảnh thất bại!');
        } finally {
            setUploading(prev => ({ ...prev, [fieldPath]: false }));
        }
        return false;
    };

    const handleVideoUpload = async (file, fieldPath) => {
        setUploading(prev => ({ ...prev, [fieldPath]: true }));
        try {
            const response = await uploadFiles([file]);
            const videoUrl = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';
            if (videoUrl) {
                const pathArray = fieldPath.split('.');
                form.setFieldValue(pathArray, videoUrl);
                message.success('Upload video thành công!');
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            message.error('Upload video thất bại!');
        } finally {
            setUploading(prev => ({ ...prev, [fieldPath]: false }));
        }
        return false;
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            
            // Load existing config from DB to preserve unchanged fields
            let existingConfigContents = null;
            try {
                const setting = await getSettingByType('LANDING_PAGE_CONFIG');
                if (setting && setting.setting && setting.setting.contents) {
                    existingConfigContents = setting.setting.contents;
                }
            } catch (error) {
                console.log('Không tìm thấy config trong database, sẽ tạo mới');
            }

            // Merge: existing DB data (base) + form values (overrides)
            // This preserves fields that user didn't edit
            const baseContents = existingConfigContents || defaultConfig?.contents || {};
            const configContents = deepMerge(baseContents, values);

            setSaving(true);
            
            await createOrUpdateSetting({
                type: 'LANDING_PAGE_CONFIG',
                setting: {
                    contents: configContents
                }
            });

            message.success('Đã lưu cấu hình thành công!');
        } catch (error) {
            console.error('Error saving config:', error);
            message.error('Lỗi khi lưu cấu hình!');
        } finally {
            setSaving(false);
        }
    };

    const handleRevertToDefault = async () => {
        if (!defaultConfig) {
            message.warning('Không thể khôi phục, vui lòng thử lại!');
            return;
        }

        try {
            setLoading(true);
            
            await createOrUpdateSetting({
                type: 'LANDING_PAGE_CONFIG',
                setting: {
                    contents: null
                }
            });

            // Reset form về default
            loadConfig();
            message.success('Đã khôi phục về cấu hình mặc định!');
        } catch (error) {
            console.error('Error reverting to default:', error);
            message.error('Lỗi khi khôi phục về mặc định!');
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshPreview = () => {
        setPreviewKey(prev => prev + 1);
        setTimeout(() => {
            renderPreview();
        }, 100);
    };

    // Render functions (giống LandingPageConfigModal)
    const renderImageUpload = (fieldPath, label) => {
        const pathArray = fieldPath.split('.');
        return (
            <Form.Item label={label} name={pathArray}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item noStyle shouldUpdate={(prev, curr) => {
                        let prevVal = prev;
                        let currVal = curr;
                        for (const key of pathArray) {
                            prevVal = prevVal?.[key];
                            currVal = currVal?.[key];
                        }
                        return prevVal !== currVal;
                    }}>
                        {({ getFieldValue }) => {
                            const currentValue = getFieldValue(pathArray);
                            return currentValue ? (
                                <Image
                                    src={currentValue}
                                    alt="Preview"
                                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', marginBottom: 8 }}
                                    preview
                                />
                            ) : null;
                        }}
                    </Form.Item>
                    <Upload
                        beforeUpload={(file) => handleImageUpload(file, fieldPath)}
                        showUploadList={false}
                        accept="image/*"
                    >
                        <Button
                            icon={<UploadOutlined />}
                            loading={uploading[fieldPath]}
                            disabled={uploading[fieldPath]}
                            size="small"
                        >
                            Upload ảnh
                        </Button>
                    </Upload>
                    <Form.Item noStyle name={pathArray}>
                        <Input
                            placeholder="Hoặc nhập URL ảnh trực tiếp"
                            size="small"
                            onChange={(e) => form.setFieldValue(pathArray, e.target.value)}
                        />
                    </Form.Item>
                </Space>
            </Form.Item>
        );
    };

    const renderImageList = (fieldPath, label) => {
        const fieldName = fieldPath.split('.');
        return (
            <Form.List name={fieldName}>
                {(fields, { add, remove }) => (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Typography.Text strong>{label}</Typography.Text>
                            <Button type="dashed" onClick={() => add({ src: '', alt: '' })} icon={<PlusOutlined />} size="small">
                                Thêm ảnh
                            </Button>
                        </div>
                        {fields.map(({ key, name, ...restField }) => {
                            const currentSrc = form.getFieldValue([...fieldName, name, 'src']);
                            const uploadFieldPath = `${fieldPath}.${name}.src`;
                            const fullPathArray = [...fieldName, name, 'src'];
                            return (
                                <Card key={key} size="small" style={{ marginBottom: 16 }}>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'src']}
                                                label="URL ảnh"
                                                rules={[{ required: true, message: 'Vui lòng nhập URL ảnh hoặc upload!' }]}
                                            >
                                                <Input placeholder="Nhập URL ảnh" size="small" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={10}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'alt']}
                                                label="Alt text"
                                            >
                                                <Input placeholder="Mô tả ảnh" size="small" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={2}>
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => remove(name)}
                                                style={{ marginTop: 30 }}
                                                size="small"
                                            />
                                        </Col>
                                    </Row>
                                    <Row gutter={16} style={{ marginTop: 8 }}>
                                        <Col span={24}>
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                {currentSrc && (
                                                    <Image
                                                        src={currentSrc}
                                                        alt="Preview"
                                                        style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }}
                                                        preview
                                                    />
                                                )}
                                                <Upload
                                                    beforeUpload={(file) => {
                                                        handleImageUpload(file, uploadFieldPath);
                                                        return false;
                                                    }}
                                                    showUploadList={false}
                                                    accept="image/*"
                                                >
                                                    <Button
                                                        icon={<UploadOutlined />}
                                                        loading={uploading[uploadFieldPath]}
                                                        disabled={uploading[uploadFieldPath]}
                                                        size="small"
                                                        block
                                                    >
                                                        Upload ảnh
                                                    </Button>
                                                </Upload>
                                            </Space>
                                        </Col>
                                    </Row>
                                </Card>
                            );
                        })}
                    </>
                )}
            </Form.List>
        );
    };

    const renderVideoList = (fieldPath, label) => {
        const fieldName = fieldPath.split('.');
        return (
            <Form.List name={fieldName}>
                {(fields, { add, remove }) => (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Typography.Text strong>{label}</Typography.Text>
                            <Button type="dashed" onClick={() => add({ src: '', poster: '', muted: false })} icon={<PlusOutlined />} size="small">
                                Thêm video
                            </Button>
                        </div>
                        {fields.map(({ key, name, ...restField }) => {
                            const currentPoster = form.getFieldValue([...fieldName, name, 'poster']);
                            const currentVideoSrc = form.getFieldValue([...fieldName, name, 'src']);
                            const posterUploadFieldPath = `${fieldPath}.${name}.poster`;
                            const videoUploadFieldPath = `${fieldPath}.${name}.src`;
                            return (
                                <Card key={key} size="small" style={{ marginBottom: 16 }}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'src']}
                                        label="URL video"
                                        rules={[{ required: true, message: 'Vui lòng nhập URL video hoặc upload!' }]}
                                    >
                                        <Input placeholder="Nhập URL video" size="small" />
                                    </Form.Item>
                                    {currentVideoSrc && (
                                        <div style={{ marginBottom: 8 }}>
                                            <video
                                                src={currentVideoSrc}
                                                controls
                                                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
                                            >
                                                Trình duyệt của bạn không hỗ trợ video.
                                            </video>
                                        </div>
                                    )}
                                    <Upload
                                        beforeUpload={(file) => {
                                            handleVideoUpload(file, videoUploadFieldPath);
                                            return false;
                                        }}
                                        showUploadList={false}
                                        accept="video/*"
                                    >
                                        <Button
                                            icon={<UploadOutlined />}
                                            loading={uploading[videoUploadFieldPath]}
                                            disabled={uploading[videoUploadFieldPath]}
                                            size="small"
                                            style={{ marginBottom: 8 }}
                                        >
                                            Upload video
                                        </Button>
                                    </Upload>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'poster']}
                                        label="Poster (ảnh thumbnail)"
                                    >
                                        <Input placeholder="URL ảnh thumbnail" size="small" />
                                    </Form.Item>
                                    {currentPoster && (
                                        <Image
                                            src={currentPoster}
                                            alt="Poster Preview"
                                            style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', marginBottom: 8 }}
                                            preview
                                        />
                                    )}
                                    <Upload
                                        beforeUpload={(file) => {
                                            handleImageUpload(file, posterUploadFieldPath);
                                            return false;
                                        }}
                                        showUploadList={false}
                                        accept="image/*"
                                    >
                                        <Button
                                            icon={<UploadOutlined />}
                                            loading={uploading[posterUploadFieldPath]}
                                            disabled={uploading[posterUploadFieldPath]}
                                            size="small"
                                            style={{ marginBottom: 8 }}
                                        >
                                            Upload ảnh thumbnail
                                        </Button>
                                    </Upload>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'muted']}
                                        valuePropName="checked"
                                        label="Muted (tắt tiếng)"
                                    >
                                        <Switch size="small" />
                                    </Form.Item>
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => remove(name)}
                                        size="small"
                                    >
                                        Xóa video
                                    </Button>
                                </Card>
                            );
                        })}
                    </>
                )}
            </Form.List>
        );
    };

    const renderTestimonials = () => {
        return (
            <Form.List name={['beingTrusted', 'testimonials']}>
                {(fields, { add, remove }) => (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Typography.Text strong>Testimonials (Lời chứng thực)</Typography.Text>
                            <Button type="dashed" onClick={() => add({ avatar: '', name: '', title: '', message: '' })} icon={<PlusOutlined />} size="small">
                                Thêm testimonial
                            </Button>
                        </div>
                        {fields.map(({ key, name, ...restField }) => {
                            const currentAvatar = form.getFieldValue(['beingTrusted', 'testimonials', name, 'avatar']);
                            const avatarUploadFieldPath = `beingTrusted.testimonials.${name}.avatar`;
                            return (
                                <Card key={key} size="small" style={{ marginBottom: 16 }}>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'avatar']}
                                                label="Avatar URL"
                                            >
                                                <Input placeholder="URL ảnh đại diện" size="small" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'name']}
                                                label="Tên"
                                                rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                                            >
                                                <Input placeholder="Tên người" size="small" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    {currentAvatar && (
                                        <Image
                                            src={currentAvatar}
                                            alt="Avatar Preview"
                                            style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain', marginBottom: 8, borderRadius: '50%' }}
                                            preview
                                        />
                                    )}
                                    <Upload
                                        beforeUpload={(file) => {
                                            handleImageUpload(file, avatarUploadFieldPath);
                                            return false;
                                        }}
                                        showUploadList={false}
                                        accept="image/*"
                                    >
                                        <Button
                                            icon={<UploadOutlined />}
                                            loading={uploading[avatarUploadFieldPath]}
                                            disabled={uploading[avatarUploadFieldPath]}
                                            size="small"
                                            style={{ marginBottom: 8 }}
                                        >
                                            Upload Avatar
                                        </Button>
                                    </Upload>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'title']}
                                        label="Chức danh"
                                        rules={[{ required: true, message: 'Vui lòng nhập chức danh!' }]}
                                    >
                                        <Input placeholder="Ví dụ: CEO Công ty ABC" size="small" />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'message']}
                                        label="Nội dung"
                                        rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
                                    >
                                        <TextArea rows={4} placeholder="Nội dung testimonial" size="small" />
                                    </Form.Item>
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => remove(name)}
                                        size="small"
                                    >
                                        Xóa testimonial
                                    </Button>
                                </Card>
                            );
                        })}
                    </>
                )}
            </Form.List>
        );
    };

    const renderFAQ = () => {
        return (
            <Form.List name={['frequentlyAskedQuestions', 'questionsAndAnswers']}>
                {(fields, { add, remove }) => (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Typography.Text strong>Câu hỏi thường gặp (FAQ)</Typography.Text>
                            <Button type="dashed" onClick={() => add({ question: '', answer: '' })} icon={<PlusOutlined />} size="small">
                                Thêm câu hỏi
                            </Button>
                        </div>
                        {fields.map(({ key, name, ...restField }) => (
                            <Card key={key} size="small" style={{ marginBottom: 16 }}>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'question']}
                                    label="Câu hỏi"
                                    rules={[{ required: true, message: 'Vui lòng nhập câu hỏi!' }]}
                                >
                                    <Input placeholder="Nhập câu hỏi" size="small" />
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'answer']}
                                    label="Câu trả lời"
                                    rules={[{ required: true, message: 'Vui lòng nhập câu trả lời!' }]}
                                >
                                    <TextArea rows={3} placeholder="Nhập câu trả lời" size="small" />
                                </Form.Item>
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => remove(name)}
                                    size="small"
                                >
                                    Xóa câu hỏi
                                </Button>
                            </Card>
                        ))}
                    </>
                )}
            </Form.List>
        );
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Card style={{ margin: '16px', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Button
                            type="default"
                            icon={<HomeOutlined />}
                            onClick={() => navigate('/home')}
                            size="small"
                        >
                            Về trang chủ
                        </Button>
                        <Typography.Title level={4} style={{ margin: 0 }}>
                            Chỉnh sửa Landing Page
                        </Typography.Title>
                    </div>
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleRefreshPreview}
                            size="small"
                        >
                            Làm mới Preview
                        </Button>
                        <Popconfirm
                            title="Khôi phục về mặc định"
                            description="Bạn có chắc chắn muốn khôi phục tất cả cấu hình về giá trị mặc định?"
                            onConfirm={handleRevertToDefault}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button 
                                danger 
                                disabled={loading || !defaultConfig}
                                loading={loading}
                                size="small"
                            >
                                Khôi phục mặc định
                            </Button>
                        </Popconfirm>
                        <Button 
                            type="primary" 
                            icon={<SaveOutlined />}
                            onClick={handleSave} 
                            loading={saving}
                            size="small"
                        >
                            Lưu cấu hình
                        </Button>
                    </Space>
                </div>
            </Card>

            {/* Main Content - 2 Panels */}
            <div style={{ flex: 1, display: 'flex', margin: '16px', marginTop: '8px', gap: '16px', overflow: 'hidden' }}>
                {/* Left Panel - Form Editor */}
                <Card 
                    style={{ 
                        width: '400px', 
                        flexShrink: 0,
                        height: '100%',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    bodyStyle={{ 
                        height: '100%', 
                        overflowY: 'auto',
                        padding: '16px'
                    }}
                >
                    <Typography.Title level={5} style={{ marginBottom: 16 }}>
                        Danh sách cài đặt
                    </Typography.Title>
                    <Form 
                        form={form} 
                        layout="vertical"
                        onValuesChange={() => {
                            // Clear timer cũ nếu có
                            if (renderTimerRef.current) {
                                clearTimeout(renderTimerRef.current);
                            }
                            // Trigger render preview khi form values thay đổi (debounce 300ms)
                            renderTimerRef.current = setTimeout(() => {
                                setRenderTrigger(prev => prev + 1);
                            }, 300);
                        }}
                    >
                        <Collapse defaultActiveKey={['banner']} ghost>
                            {/* Banner */}
                            <Panel header="🏠 Banner - Ảnh nền & Cover" key="banner">
                                {renderImageUpload('banner.backgroundImage.landscape.src', 'Hình nền Landscape')}
                                {renderImageUpload('banner.backgroundImage.portrait.src', 'Hình nền Portrait')}
                                {renderImageUpload('banner.coverImage.src', 'Ảnh Cover Banner')}
                                <Form.Item name={['banner', 'coverImage', 'alt']} label="Alt text cho ảnh cover">
                                    <Input placeholder="Mô tả ảnh" size="small" />
                                </Form.Item>
                            </Panel>

                            {/* Ecosystem */}
                            <Panel header="🌐 Ecosystem - Hệ sinh thái" key="ecoSystem">
                                {renderImageUpload('ecoSystem.highlightsBackgroundImage.src', 'Hình nền Highlights')}
                                {renderImageList('ecoSystem.slideImages', 'Slide Images')}
                            </Panel>

                            {/* Resources */}
                            <Panel header="📚 Resources - Tài nguyên" key="resources">
                                <Typography.Title level={5}>Brand Stories</Typography.Title>
                                {renderImageList('resources.brandStories.slideImages', 'Slide Images')}
                                <Divider />
                                <Typography.Title level={5}>Business Models</Typography.Title>
                                {renderImageList('resources.businessModels.slideImages', 'Slide Images')}
                                <Divider />
                                <Typography.Title level={5}>Book Insights</Typography.Title>
                                {renderImageList('resources.bookInsights.slideImages', 'Slide Images')}
                                <Divider />
                                <Typography.Title level={5}>Miscellaneous</Typography.Title>
                                {renderImageList('resources.miscellaneous.slideImages', 'Slide Images')}
                            </Panel>

                            {/* Modules */}
                            <Panel header="📦 Modules - Các module học" key="modules">
                                {renderImageUpload('modules.backgroundImage.src', 'Hình nền Modules')}
                                {renderVideoList('modules.slideVideos', 'Slide Videos')}
                            </Panel>

                            {/* Core Values */}
                            <Panel header="💎 Core Values - Giá trị cốt lõi" key="coreValues">
                                {renderImageUpload('coreValues.backgroundImage.src', 'Hình nền Core Values')}
                            </Panel>

                            {/* Our Solution */}
                            <Panel header="✨ Our Solution - Giải pháp" key="ourSolution">
                                {renderImageUpload('ourSolution.coverImage.src', 'Ảnh Cover')}
                                <Form.Item name={['ourSolution', 'coverImage', 'alt']} label="Alt text">
                                    <Input placeholder="Mô tả ảnh" size="small" />
                                </Form.Item>
                                {renderImageList('ourSolution.slideImages', 'Slide Images')}
                            </Panel>

                            {/* Learning Strategy */}
                            <Panel header="🎓 Learning Strategy - Chiến lược học tập" key="learningStrategy">
                                {renderImageUpload('learningStrategy.backgroundImage.src', 'Hình nền')}
                                {renderImageUpload('learningStrategy.coverImage.src', 'Ảnh Cover')}
                                <Form.Item name={['learningStrategy', 'coverImage', 'alt']} label="Alt text">
                                    <Input placeholder="Mô tả ảnh" size="small" />
                                </Form.Item>
                            </Panel>

                            {/* Target Audience */}
                            <Panel header="👥 Target Audience - Đối tượng mục tiêu" key="targetAudience">
                                {renderImageUpload('targetAudience.backgroundImage.src', 'Hình nền')}
                                {renderImageUpload('targetAudience.certificateImage.src', 'Ảnh Chứng chỉ')}
                                <Form.Item name={['targetAudience', 'certificateImage', 'alt']} label="Alt text cho ảnh chứng chỉ">
                                    <Input placeholder="Mô tả ảnh" size="small" />
                                </Form.Item>
                            </Panel>

                            {/* Being Trusted */}
                            <Panel header="⭐ Being Trusted - Được tin tưởng" key="beingTrusted">
                                {renderTestimonials()}
                            </Panel>

                            {/* Registration */}
                            <Panel header="📝 Registration - Đăng ký" key="registration">
                                {renderImageUpload('registration.backgroundImage.src', 'Hình nền Registration')}
                            </Panel>

                            {/* FAQ */}
                            <Panel header="❓ FAQ - Câu hỏi thường gặp" key="frequentlyAskedQuestions">
                                {renderFAQ()}
                            </Panel>

                            {/* Footer */}
                            <Panel header="🔻 Footer - Chân trang" key="footer">
                                <Form.Item name={['footer', 'qrCode', 'title']} label="QR Code Title">
                                    <Input placeholder="Ví dụ: Tacasoft" size="small" />
                                </Form.Item>
                                <Form.Item name={['footer', 'qrCode', 'data']} label="QR Code Data (URL)">
                                    <Input placeholder="Ví dụ: https://tacasoft.vn" size="small" />
                                </Form.Item>
                                {renderImageUpload('footer.qrCode.image.src', 'QR Code Image')}
                            </Panel>
                        </Collapse>
                    </Form>
                </Card>

                {/* Right Panel - Preview */}
                <Card 
                    style={{ 
                        flex: 1,
                        height: '100%',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    bodyStyle={{ 
                        height: '100%', 
                        overflow: 'auto',
                        padding: 0
                    }}
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography.Text strong>Preview Landing Page (Thời gian thực)</Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                Thay đổi ở panel trái sẽ tự động cập nhật ở đây
                            </Typography.Text>
                        </div>
                    }
                >
                    <div 
                        ref={previewContainerRef}
                        id="landing-page-preview-root"
                        key={previewKey}
                        style={{
                            width: '100%',
                            minHeight: '100%',
                            position: 'relative'
                        }}
                    />
                    {loading && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1000
                        }}>
                            <Spin size="large" tip="Đang tải preview..." />
                        </div>
                    )}
                </Card>
            </div>

            {/* Register Modal - Chọn gói (cho preview) */}
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
                        onPackageSelect={() => {
                            message.info('Preview mode - Chức năng thanh toán không khả dụng');
                        }}
                        loading={paymentLoading}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default LandingPageEditor;

