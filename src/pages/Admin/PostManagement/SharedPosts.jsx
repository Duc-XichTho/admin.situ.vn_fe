import { Table, Tag, Space, Button } from 'antd';
import { EyeOutlined, StopOutlined } from '@ant-design/icons';

export default function SharedPosts() {
    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Người chia sẻ',
            dataIndex: 'sharedBy',
            key: 'sharedBy',
        },
        {
            title: 'Ngày chia sẻ',
            dataIndex: 'sharedAt',
            key: 'sharedAt',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? 'Đang chia sẻ' : 'Đã dừng'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button icon={<EyeOutlined />} type="primary" ghost>
                        Xem
                    </Button>
                    <Button icon={<StopOutlined />} danger>
                        Dừng chia sẻ
                    </Button>
                </Space>
            ),
        },
    ];

    // Dummy data for demonstration
    const data = [
        {
            key: '1',
            title: 'Bài viết đã chia sẻ 1',
            sharedBy: 'Nguyễn Văn A',
            sharedAt: '2024-03-20',
            status: 'active',
        },
        {
            key: '2',
            title: 'Bài viết đã chia sẻ 2',
            sharedBy: 'Trần Thị B',
            sharedAt: '2024-03-19',
            status: 'inactive',
        },
    ];

    return (
        <div>
            <Table columns={columns} dataSource={data} />
        </div>
    );
} 