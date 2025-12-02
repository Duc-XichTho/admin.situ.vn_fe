import { Typography, Layout, Button, Space, Spin } from 'antd';
import { EditOutlined, ShareAltOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAllPageSectionDataSharePublic } from '../../../apis/public/publicService';

const { Title } = Typography;
const { Content } = Layout;

export default function PostListContent() {
    const { sectionId, itemId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getAllPageSectionDataSharePublic();
                if (sectionId) {
                    const section = result.find(item => item.id === parseInt(sectionId));
                    if (section) {
                        if (itemId) {
                            const item = section.contentPage?.find(content => content.id === parseInt(itemId));
                            if (item) {
                                setData({ ...item, parentType: section.type });
                            } else {
                                setData(null);
                            }
                        } else {
                            setData(section);
                        }
                    } else {
                        setData(null);
                    }
                } else {
                    setData(null);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [sectionId, itemId]);

    if (loading) {
        return (
            <Content>
                <div style={{ padding: '24px', textAlign: 'center' }}>
                    <Spin size="large" />
                </div>
            </Content>
        );
    }

    if (!data) {
        return (
            <Content>
                <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                    {sectionId ? 'Không tìm thấy dữ liệu' : 'Chọn một mục để xem chi tiết'}
                </div>
            </Content>
        );
    }

    return (
        <Content>
            <div style={{ padding: '24px' }}>
                <Title level={4}>{data.name}</Title>
                <div>
                    {data.type && <p><strong>Loại:</strong> {data.type}</p>}
                    {data.created_at && <p><strong>Ngày tạo:</strong> {new Date(data.created_at).toLocaleDateString()}</p>}
                    {data.user_create && <p><strong>Người tạo:</strong> {data.user_create}</p>}
                    {data.content && <p><strong>Nội dung:</strong> {data.content}</p>}
                    {data.info && (
                        <div>
                            <p><strong>Thông tin thêm:</strong></p>
                            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                                {JSON.stringify(data.info, null, 2)}
                            </pre>
                        </div>
                    )}
                    
                    <Space size="middle" style={{ marginTop: '16px' }}>
                        <Button icon={<EditOutlined />} type="primary" ghost>
                            Sửa
                        </Button>
                        <Button icon={<ShareAltOutlined />} type="primary">
                            Chia sẻ
                        </Button>
                        <Button icon={<DeleteOutlined />} danger>
                            Xóa
                        </Button>
                    </Space>
                </div>
            </div>
        </Content>
    );
} 