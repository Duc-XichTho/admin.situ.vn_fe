import { Form, Input, Switch, Button, Card, Space } from 'antd';

export default function ShareSettings() {
    const [form] = Form.useForm();

    const onFinish = (values) => {
        console.log('Form values:', values);
    };

    return (
        <div>
            <Card title="Cài đặt chia sẻ bài viết">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        allowPublicSharing: true,
                        requireApproval: false,
                        defaultExpiryDays: 30,
                    }}
                >
                    <Form.Item
                        name="allowPublicSharing"
                        label="Cho phép chia sẻ công khai"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item
                        name="requireApproval"
                        label="Yêu cầu phê duyệt trước khi chia sẻ"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item
                        name="defaultExpiryDays"
                        label="Thời hạn chia sẻ mặc định (ngày)"
                        rules={[{ required: true, message: 'Vui lòng nhập số ngày' }]}
                    >
                        <Input type="number" min={1} />
                    </Form.Item>

                    <Form.Item
                        name="allowedDomains"
                        label="Tên miền được phép chia sẻ (mỗi dòng một tên miền)"
                    >
                        <Input.TextArea rows={4} placeholder="example.com&#10;example.org" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Lưu cài đặt
                            </Button>
                            <Button onClick={() => form.resetFields()}>
                                Đặt lại
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
} 