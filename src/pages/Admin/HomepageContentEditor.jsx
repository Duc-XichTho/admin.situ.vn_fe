import React, { useEffect, useState } from 'react';
import { 
    Card, 
    Form, 
    Input, 
    Button, 
    message, 
    Divider, 
    Space, 
    Typography,
    Row,
    Col,
    InputNumber,
    Upload,
    Image
} from 'antd';
import { SaveOutlined, ReloadOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { getSettingByType, createOrUpdateSetting } from '../../apis/settingService.jsx';
import { uploadFiles } from '../../apis/uploadImageWikiNoteService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const HomepageContentEditor = () => {
    const [content, setContent] = useState(null);
    const [images, setImages] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [form] = Form.useForm();

    // Fetch content on component mount
    useEffect(() => {
        fetchContent();
        fetchImages();
    }, []);


    const fetchContent = async () => {
        setLoading(true);
        try {
            const data = await getSettingByType('homepage_content');
            if (data && data.setting) {
                // Convert features array to string for textarea
                const contentForForm = { ...data.setting };
                if (contentForForm.finalCta?.pricing?.features && Array.isArray(contentForForm.finalCta.pricing.features)) {
                    contentForForm.finalCta.pricing.features = contentForForm.finalCta.pricing.features.join('\n');
                }
                
                setContent(data.setting);
                // Use setTimeout to ensure form is ready
                setTimeout(() => {
                    form.setFieldsValue(contentForForm);
                }, 100);
            } else {
                // Use default content if none exists
                const defaultContent = getDefaultContent();
                const contentForForm = { ...defaultContent };
                if (contentForForm.finalCta?.pricing?.features && Array.isArray(contentForForm.finalCta.pricing.features)) {
                    contentForForm.finalCta.pricing.features = contentForForm.finalCta.pricing.features.join('\n');
                }
                
                setContent(defaultContent);
                // Use setTimeout to ensure form is ready
                setTimeout(() => {
                    form.setFieldsValue(contentForForm);
                }, 100);
            }
        } catch (error) {
            console.error('Error fetching content:', error);
            message.error('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const fetchImages = async () => {
        try {
            const data = await getSettingByType('homepage_images');
            if (data && data.setting) {
                setImages(data.setting);
            } else {
                // Use default images structure
                const defaultImages = getDefaultImages();
                setImages(defaultImages);
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            message.error('Failed to load images');
        }
    };

    const getDefaultImages = () => ({
        hero: {
            background: null
        },
        problem: {
            cards: [null, null, null]
        },
        solution: {
            items: [null, null, null]
        },
        howItWorks: {
            steps: [null, null, null, null]
        },
        programs: {
            modules: [null, null, null, null, null, null, null]
        },
        socialProof: {
            testimonials: null
        },
        statsOverview: {
            resourceLibrary: {
                resources: [null, null, null, null]
            }
        }
    });

    const handleImageUpload = async (file, path) => {
        try {
            setUploadingImages(true);
            const response = await uploadFiles([file]);
            const imageUrl = response.files?.[0]?.fileUrl || response.files?.[0]?.url || '';
            
            if (imageUrl) {
                // Update images state
                const newImages = { ...images };
                const pathArray = path.split('.');
                let current = newImages;
                
                for (let i = 0; i < pathArray.length - 1; i++) {
                    if (!current[pathArray[i]]) {
                        current[pathArray[i]] = {};
                    }
                    current = current[pathArray[i]];
                }
                
                current[pathArray[pathArray.length - 1]] = imageUrl;
                setImages(newImages);
                
                // Save to database
                await createOrUpdateSetting({
                    type: 'homepage_images',
                    setting: newImages
                });
                
                message.success('Image uploaded successfully!');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            message.error('Failed to upload image');
        } finally {
            setUploadingImages(false);
        }
    };

    const removeImage = async (path) => {
        try {
            const newImages = { ...images };
            const pathArray = path.split('.');
            let current = newImages;
            
            for (let i = 0; i < pathArray.length - 1; i++) {
                current = current[pathArray[i]];
            }
            
            current[pathArray[pathArray.length - 1]] = null;
            setImages(newImages);
            
            // Save to database
            await createOrUpdateSetting({
                type: 'homepage_images',
                setting: newImages
            });
            
            message.success('Image removed successfully!');
        } catch (error) {
            console.error('Error removing image:', error);
            message.error('Failed to remove image');
        }
    };

    const getDefaultContent = () => ({
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

    const saveContent = async () => {
        try {
            setSaving(true);
            const formData = form.getFieldsValue();
            
            // Convert features textarea to array format
            if (formData.finalCta?.pricing?.features) {
                if (typeof formData.finalCta.pricing.features === 'string') {
                    formData.finalCta.pricing.features = formData.finalCta.pricing.features
                        .split('\n')
                        .filter(line => line.trim() !== '')
                        .map(line => line.trim());
                }
            }
            
            await createOrUpdateSetting({
                type: 'homepage_content',
                setting: formData
            });
            
            setContent(formData);
            message.success('Content saved successfully!');
        } catch (error) {
            console.error('Error saving content:', error);
            message.error('Failed to save content');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh' 
            }}>
                <Text>Loading content...</Text>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Title level={2}>Homepage Content Editor</Title>
                <Text type="secondary">
                    Edit the content that appears on your homepage. Changes will be reflected immediately.
                </Text>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={saveContent}
                initialValues={content}
            >
                {/* Hero Section */}
                <Card title="🎯 Hero Section" style={{ marginBottom: '1rem' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Brand Line" name={['hero', 'brandLine']}>
                                <Input placeholder="AiMBA - Applied Intelligence MBA" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Brand Subtitle" name={['hero', 'brandSubtitle']}>
                                <Input placeholder="Phát triển năng lực qua đào tạo mô phỏng" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Tagline" name={['hero', 'tagline']}>
                        <TextArea rows={2} placeholder="Main tagline text..." />
                    </Form.Item>
                    <Form.Item label="Description" name={['hero', 'description']}>
                        <TextArea rows={3} placeholder="Hero section description..." />
                    </Form.Item>
                    <Form.Item label="CTA Button Text" name={['hero', 'ctaText']}>
                        <Input placeholder="Bắt đầu học ngay!" />
                    </Form.Item>
                </Card>

                {/* Problem Section */}
                <Card title="⚠️ Problem Section" style={{ marginBottom: '2rem' }}>
                    <Form.Item label="Section Title" name={['problem', 'title']}>
                        <Input placeholder="Thách thức của giáo dục truyền thống" />
                    </Form.Item>
                    <Form.Item label="Section Subtitle" name={['problem', 'subtitle']}>
                        <TextArea rows={2} placeholder="Problem section subtitle..." />
                    </Form.Item>
                    
                    <Title level={4}>Problem Cards</Title>
                    <Row gutter={[16, 16]}>
                        {[0, 1, 2].map((index) => (
                            <Col span={8} key={index}>
                                <Card size="small" style={{ height: '100%' }}>
                                    <Form.Item label="Icon" name={['problem', 'cards', index, 'icon']}>
                                        <Input placeholder="📚" />
                                    </Form.Item>
                                    
                                    <Form.Item label="Title" name={['problem', 'cards', index, 'title']}>
                                        <Input placeholder="Card title" />
                                    </Form.Item>
                                    
                                    <Form.Item label="Card Image">
                                        <div style={{ marginBottom: '8px' }}>
                                            {images?.problem?.cards?.[index] ? (
                                                <div>
                                                    <Image 
                                                        src={images.problem.cards[index]} 
                                                        alt={`Problem card ${index + 1}`} 
                                                        style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', marginBottom: '8px' }}
                                                    />
                                                    <Button 
                                                        type="link" 
                                                        danger 
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => removeImage(`problem.cards.${index}`)}
                                                        size="small"
                                                    >
                                                        Remove Image
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Upload
                                                    beforeUpload={(file) => {
                                                        handleImageUpload(file, `problem.cards.${index}`);
                                                        return false;
                                                    }}
                                                    showUploadList={false}
                                                    accept="image/*"
                                                >
                                                    <Button icon={<UploadOutlined />} loading={uploadingImages} size="small">
                                                        Upload Card Image
                                                    </Button>
                                                </Upload>
                                            )}
                                        </div>
                                    </Form.Item>
                                    
                                    <Form.Item label="Image Placeholder (Fallback)" name={['problem', 'cards', index, 'image']}>
                                        <Input placeholder="[Hình ảnh: Description]" />
                                    </Form.Item>
                                    <Form.Item label="Description" name={['problem', 'cards', index, 'description']}>
                                        <TextArea rows={2} placeholder="Card description..." />
                                    </Form.Item>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card>

                {/* Solution Section */}
                <Card title="✅ Solution Section" style={{ marginBottom: '2rem' }}>
                    <Form.Item label="Section Title" name={['solution', 'title']}>
                        <Input placeholder="Giải pháp đột phá từ AiMBA" />
                    </Form.Item>
                    
                    <Title level={4}>Solution Items</Title>
                    <Row gutter={[16, 16]}>
                        {[0, 1, 2].map((index) => (
                            <Col span={12} key={index}>
                                <Card size="small" style={{ height: '100%' }}>
                                    <Form.Item label="Icon" name={['solution', 'items', index, 'icon']}>
                                        <Input placeholder="🔄" />
                                    </Form.Item>
                                    
                                    <Form.Item label="Title" name={['solution', 'items', index, 'title']}>
                                        <Input placeholder="Solution item title" />
                                    </Form.Item>
                                    
                                    <Form.Item label="Solution Image">
                                        <div style={{ marginBottom: '8px' }}>
                                            {images?.solution?.items?.[index] ? (
                                                <div>
                                                    <Image 
                                                        src={images.solution.items[index]} 
                                                        alt={`Solution item ${index + 1}`} 
                                                        style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', marginBottom: '8px' }}
                                                    />
                                                    <Button 
                                                        type="link" 
                                                        danger 
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => removeImage(`solution.items.${index}`)}
                                                        size="small"
                                                    >
                                                        Remove Image
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Upload
                                                    beforeUpload={(file) => {
                                                        handleImageUpload(file, `solution.items.${index}`);
                                                        return false;
                                                    }}
                                                    showUploadList={false}
                                                    accept="image/*"
                                                >
                                                    <Button icon={<UploadOutlined />} loading={uploadingImages} size="small">
                                                        Upload Solution Image
                                                    </Button>
                                                </Upload>
                                            )}
                                        </div>
                                    </Form.Item>
                                    
                                    <Form.Item label="Image Placeholder (Fallback)" name={['solution', 'items', index, 'image']}>
                                        <Input placeholder="[Hình ảnh: Description]" />
                                    </Form.Item>
                                    <Form.Item label="Description" name={['solution', 'items', index, 'description']}>
                                        <TextArea rows={2} placeholder="Solution item description..." />
                                    </Form.Item>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card>

                {/* How It Works Section */}
                <Card title="🔄 How It Works Section" style={{ marginBottom: '2rem' }}>
                    <Form.Item label="Section Title" name={['howItWorks', 'title']}>
                        <Input placeholder="Cách thức học tập tại AiMBA" />
                    </Form.Item>
                    
                    <Title level={4}>Steps</Title>
                    <Row gutter={[16, 16]}>
                        {[0, 1, 2, 3].map((index) => (
                            <Col span={12} key={index}>
                                <Card size="small" style={{ height: '100%' }}>
                                    <Row gutter={16}>
                                        <Col span={6}>
                                            <Form.Item label="Number" name={['howItWorks', 'steps', index, 'number']}>
                                                <Input placeholder="1" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={18}>
                                            <Form.Item label="Title" name={['howItWorks', 'steps', index, 'title']}>
                                                <Input placeholder="Step title" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    
                                    <Form.Item label="Step Image">
                                        <div style={{ marginBottom: '8px' }}>
                                            {images?.howItWorks?.steps?.[index] ? (
                                                <div>
                                                    <Image 
                                                        src={images.howItWorks.steps[index]} 
                                                        alt={`Step ${index + 1}`} 
                                                        style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', marginBottom: '8px' }}
                                                    />
                                                    <Button 
                                                        type="link" 
                                                        danger 
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => removeImage(`howItWorks.steps.${index}`)}
                                                        size="small"
                                                    >
                                                        Remove Image
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Upload
                                                    beforeUpload={(file) => {
                                                        handleImageUpload(file, `howItWorks.steps.${index}`);
                                                        return false;
                                                    }}
                                                    showUploadList={false}
                                                    accept="image/*"
                                                >
                                                    <Button icon={<UploadOutlined />} loading={uploadingImages} size="small">
                                                        Upload Step Image
                                                    </Button>
                                                </Upload>
                                            )}
                                        </div>
                                    </Form.Item>
                                    
                                    <Form.Item label="Description" name={['howItWorks', 'steps', index, 'description']}>
                                        <TextArea rows={2} placeholder="Step description..." />
                                    </Form.Item>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card>

                {/* Programs Section */}
                <Card title="🎓 Programs Section" style={{ marginBottom: '2rem' }}>
                    <Form.Item label="Section Title" name={['programs', 'title']}>
                        <Input placeholder="7 Module chuyên biệt của AiMBA" />
                    </Form.Item>
                    <Form.Item label="Section Subtitle" name={['programs', 'subtitle']}>
                        <Input placeholder="Mỗi module tập trung giải quyết các năng lực cụ thể, từ cơ bản đến nâng cao" />
                    </Form.Item>
                    
                    <Title level={4}>Modules</Title>
                    <Row gutter={[16, 16]}>
                        {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                            <Col span={8} key={index}>
                                <Card size="small" style={{ height: '100%' }}>
                                    <Form.Item label="Module Title" name={['programs', 'modules', index, 'title']}>
                                        <Input placeholder="D101 - Essential Professional Skills" />
                                    </Form.Item>
                                    
                                    <Form.Item label="Module Image">
                                        <div style={{ marginBottom: '8px' }}>
                                            {images?.programs?.modules?.[index] ? (
                                                <div>
                                                    <Image 
                                                        src={images.programs.modules[index]} 
                                                        alt={`Module ${index + 1}`} 
                                                        style={{ width: '100%', maxHeight: '100px', objectFit: 'cover', marginBottom: '8px' }}
                                                    />
                                                    <Button 
                                                        type="link" 
                                                        danger 
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => removeImage(`programs.modules.${index}`)}
                                                        size="small"
                                                    >
                                                        Remove Image
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Upload
                                                    beforeUpload={(file) => {
                                                        handleImageUpload(file, `programs.modules.${index}`);
                                                        return false;
                                                    }}
                                                    showUploadList={false}
                                                    accept="image/*"
                                                >
                                                    <Button icon={<UploadOutlined />} loading={uploadingImages} size="small">
                                                        Upload Module Image
                                                    </Button>
                                                </Upload>
                                            )}
                                        </div>
                                    </Form.Item>
                                    
                                    <Form.Item label="Image Placeholder (Fallback)" name={['programs', 'modules', index, 'image']}>
                                        <Input placeholder="[Hình ảnh: Professional skills]" />
                                    </Form.Item>
                                    <Form.Item label="Description" name={['programs', 'modules', index, 'description']}>
                                        <TextArea rows={2} placeholder="Bệ phóng sự nghiệp vững chắc cho sinh viên và nhân sự mới. Case study phân bố: 80+ tình huống cơ bản" />
                                    </Form.Item>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card>

                {/* Social Proof Section */}
                <Card title="👥 Social Proof Section" style={{ marginBottom: '2rem' }}>
                    <Form.Item label="Section Title" name={['socialProof', 'title']}>
                        <Input placeholder="Được tin tưởng bởi" />
                    </Form.Item>
                    
                    <Form.Item label="Testimonials Image">
                        <div style={{ marginBottom: '8px' }}>
                            {images?.socialProof?.testimonials ? (
                                <div>
                                    <Image 
                                        src={images.socialProof.testimonials} 
                                        alt="Social proof testimonials" 
                                        style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', marginBottom: '8px' }}
                                    />
                                    <Button 
                                        type="link" 
                                        danger 
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeImage('socialProof.testimonials')}
                                        size="small"
                                    >
                                        Remove Image
                                    </Button>
                                </div>
                            ) : (
                                <Upload
                                    beforeUpload={(file) => {
                                        handleImageUpload(file, 'socialProof.testimonials');
                                        return false;
                                    }}
                                    showUploadList={false}
                                    accept="image/*"
                                >
                                    <Button icon={<UploadOutlined />} loading={uploadingImages} size="small">
                                        Upload Testimonials Image
                                    </Button>
                                </Upload>
                            )}
                        </div>
                    </Form.Item>
                    
                    <Form.Item label="Image Placeholder (Fallback)" name={['socialProof', 'image']}>
                        <Input placeholder="[Hình ảnh: Testimonials từ học viên, logos của các công ty]" />
                    </Form.Item>
                </Card>

                {/* Stats Overview */}
                <Card title="📊 Stats Overview" style={{ marginBottom: '2rem' }}>
                    <Form.Item label="Section Title" name={['statsOverview', 'title']}>
                        <Input placeholder="Hệ sinh thái học tập toàn diện" />
                    </Form.Item>
                    
                    <Title level={4}>Statistics</Title>
                    <Row gutter={[16, 16]}>
                        {[0, 1, 2, 3].map((index) => (
                            <Col span={6} key={index}>
                                <Card size="small" style={{ height: '100%' }}>
                                    <Form.Item label="Number" name={['statsOverview', 'stats', index, 'number']}>
                                        <Input placeholder="640+" />
                                    </Form.Item>
                                    <Form.Item label="Description" name={['statsOverview', 'stats', index, 'description']}>
                                        <Input placeholder="Case Study" />
                                    </Form.Item>
                                    <Form.Item label="Detail" name={['statsOverview', 'stats', index, 'detail']}>
                                        <Input placeholder="Tình huống thực tế" />
                                    </Form.Item>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <Divider />
                    
                    <Title level={4}>Resource Library</Title>
                    <Form.Item label="Library Title" name={['statsOverview', 'resourceLibrary', 'title']}>
                        <Input placeholder="Kho tài nguyên chung tham khảo" />
                    </Form.Item>
                    <Form.Item label="Library Subtitle" name={['statsOverview', 'resourceLibrary', 'subtitle']}>
                        <Input placeholder="Truy cập mở đến kho tàng tri thức kinh doanh" />
                    </Form.Item>
                    
                    <Row gutter={[16, 16]}>
                        {[0, 1, 2, 3].map((index) => (
                            <Col span={6} key={index}>
                                <Card size="small" style={{ height: '100%' }}>
                                    <Form.Item label="Resource Title" name={['statsOverview', 'resourceLibrary', 'resources', index, 'title']}>
                                        <Input placeholder="50+ Brand Stories" />
                                    </Form.Item>
                                    <Form.Item label="Resource Description" name={['statsOverview', 'resourceLibrary', 'resources', index, 'description']}>
                                        <Input placeholder="Resource description..." />
                                    </Form.Item>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card>

                {/* FAQ Section */}
                <Card title="❓ FAQ Section" style={{ marginBottom: '2rem' }}>
                    <Form.Item label="Section Title" name={['faq', 'title']}>
                        <Input placeholder="Câu hỏi thường gặp" />
                    </Form.Item>
                    
                    <Title level={4}>FAQ Items</Title>
                    {[0, 1, 2, 3, 4].map((index) => (
                        <Card key={index} size="small" style={{ marginBottom: '0.5rem' }}>
                            <Form.Item label="Question" name={['faq', 'items', index, 'question']}>
                                <Input placeholder="FAQ question..." />
                            </Form.Item>
                            <Form.Item label="Answer" name={['faq', 'items', index, 'answer']}>
                                <TextArea rows={3} placeholder="FAQ answer..." />
                            </Form.Item>
                        </Card>
                    ))}
                </Card>

                {/* Final CTA Section */}
                <Card title="🎯 Final CTA Section" style={{ marginBottom: '2rem' }}>
                    <Form.Item label="Section Title" name={['finalCta', 'title']}>
                        <Input placeholder="Ưu đãi có thời hạn!" />
                    </Form.Item>
                    <Form.Item label="Section Subtitle" name={['finalCta', 'subtitle']}>
                        <Input placeholder="Đăng ký ngay để nhận ưu đãi đặc biệt" />
                    </Form.Item>
                    
                    <Title level={4}>Pricing Information</Title>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Pricing Title" name={['finalCta', 'pricing', 'title']}>
                                <Input placeholder="Gói ưu đãi đặc biệt" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Price" name={['finalCta', 'pricing', 'price']}>
                                <Input placeholder="489.000 VND" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Period" name={['finalCta', 'pricing', 'period']}>
                        <Input placeholder="Mỗi khóa học - Truy cập 1 năm" />
                    </Form.Item>
                    <Form.Item label="Special Offer" name={['finalCta', 'pricing', 'specialOffer']}>
                        <Input placeholder="🎯 Đăng ký từ 3 khóa trở lên: GIẢM GIÁ ĐẶC BIỆT!" />
                    </Form.Item>
                    
                    <Form.Item 
                        label="Features List" 
                        name={['finalCta', 'pricing', 'features']}
                        rules={[{ required: false }]}
                    >
                        <TextArea 
                            rows={6} 
                            placeholder="✅ Truy cập đầy đủ 640+ case study&#10;✅ 170+ khối lý thuyết được kiến giải chi tiết&#10;✅ Kho tài nguyên: 50+ Brand Stories, 40+ Business Models&#10;✅ 24+ phân tích sách kinh doanh nổi tiếng&#10;✅ Chứng chỉ hoàn thành cho từng module&#10;✅ Hỗ trợ mentor 24/7"
                            onChange={(e) => {
                                // Force form update
                                form.setFieldValue(['finalCta', 'pricing', 'features'], e.target.value);
                            }}
                        />
                        <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                            Enter each feature on a new line. Each line will become a separate feature item.
                        </Text>
                    </Form.Item>
                    
                    <Form.Item label="CTA Button Text" name={['finalCta', 'pricing', 'ctaText']}>
                        <Input placeholder="ĐĂNG KÝ NGAY - TIẾT KIỆM 30%" />
                    </Form.Item>
                    <Form.Item label="Disclaimer" name={['finalCta', 'pricing', 'disclaimer']}>
                        <Input placeholder="*Ưu đãi có thời hạn. Áp dụng cho 100 học viên đầu tiên" />
                    </Form.Item>
                </Card>


                {/* Action Buttons */}
                <Card>
                    <Space>
                        <Button 
                            type="primary" 
                            size="large" 
                            icon={<SaveOutlined />}
                            loading={saving}
                            onClick={saveContent}
                        >
                            Save All Changes
                        </Button>
                        <Button 
                            size="large" 
                            icon={<ReloadOutlined />}
                            onClick={fetchContent}
                        >
                            Reload Content
                        </Button>
                    </Space>
                </Card>
            </Form>
        </div>
    );
};

export default HomepageContentEditor;
