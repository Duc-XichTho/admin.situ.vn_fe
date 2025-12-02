import React from 'react';
import { Card, Row, Col, Typography, Divider, Button } from 'antd';

const PackageGrid = ({ onPackageSelect, loading = false }) => {

    const packages = [
        {
            name: 'Dùng thử',
            duration: 3,
            durationText: 'Dùng thử 3 ngày',
            price: 0,
            originalPrice: null,
            features: ['Dùng thử miễn phí 3 ngày', 'Tất cả tính năng Pro', 'Không cần thanh toán'],
            popular: false,
            isTrial: true
        },
        {
            name: 'Starter',
            duration: 90,
            durationText: 'Dùng trong 3 tháng',
            price: 399000,
            originalPrice: 799000,
            features: ['Dùng trong 3 tháng', 'Tất cả tính năng Pro', 'Hỗ trợ 24/7'],
            popular: false
        },
        {
            name: 'M12',
            duration: 450,
            durationText: '12 tháng + Tặng 3 tháng',
            price: 699000,
            originalPrice: 1490000,
            features: ['Truy cập 12 tháng', 'Tặng thêm 3 tháng', 'Tất cả tính năng Pro', 'Ưu đãi tốt nhất', 'Hỗ trợ 24/7'],
            popular: true
        },
        {
            name: 'M24',
            duration: 900,
            durationText: '24 tháng + Tặng 6 tháng',
            price: 999000,
            originalPrice: 2290000,
            features: ['Truy cập 24 tháng', 'Tặng thêm 6 tháng', 'Tất cả tính năng Pro', 'Tiết kiệm nhất', 'Hỗ trợ 24/7'],
            popular: false
        }
    ];

    return (
        <Row gutter={[16, 16]}>
            {packages.map((pkg) => (
                <Col xs={24} sm={12} md={8} lg={6} xl={6} key={pkg.name}>
                    <Card
                        hoverable
                        style={{
                            height: '100%',
                            border: pkg.popular ? '2px solid #1890ff' : '1px solid #d9d9d9',
                            borderRadius: '12px',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            background: pkg.popular ? 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)' : '#ffffff',
                            cursor: 'pointer'
                        }}
                        bodyStyle={{ padding: '20px' }}
                        onClick={() => onPackageSelect(pkg)}
                    >
                        {pkg.popular && (
                            <div style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '20px',
                                background: '#1890ff',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                Phổ biến
                            </div>
                        )}
                        
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <Typography.Title level={3} style={{ margin: 0, color: '#262626' }}>
                                {pkg.name}
                            </Typography.Title>
                            <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
                                {pkg.durationText || `${pkg.duration} ngày`}
                            </Typography.Text>
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            {pkg.isTrial ? (
                                <Typography.Title
                                    level={2}
                                    style={{
                                        margin: 0,
                                        color: '#52c41a',
                                        fontSize: '32px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    MIỄN PHÍ
                                </Typography.Title>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                                    {pkg.originalPrice && (
                                        <Typography.Text
                                            delete
                                            type="secondary"
                                            style={{ fontSize: '16px', color: '#999' }}
                                        >
                                            {pkg.originalPrice.toLocaleString('vi-VN')}đ
                                        </Typography.Text>
                                    )}
                                    <Typography.Title
                                        level={2}
                                        style={{
                                            margin: 0,
                                            color: '#1890ff',
                                            fontSize: '28px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {pkg.price.toLocaleString('vi-VN')}đ
                                    </Typography.Title>
                                </div>
                            )}
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <div style={{ marginBottom: '20px' }}>
                            {pkg.features.map((feature, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '8px',
                                        fontSize: '14px',
                                        color: '#595959'
                                    }}
                                >
                                    <span style={{ marginRight: '8px', color: '#52c41a', fontSize: '16px' }}>✓</span>
                                    {feature}
                                </div>
                            ))}
                        </div>

                        <Button
                            type={pkg.popular ? "primary" : "default"}
                            block
                            size="large"
                            loading={loading}
                            style={{
                                height: '44px',
                                fontSize: '16px',
                                fontWeight: '600',
                                borderRadius: '8px'
                            }}
                        >
                            Chọn gói này
                        </Button>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default PackageGrid;

