import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Result, Button, Card, Spin, Typography, Tag, Space } from 'antd';
import { CheckCircleOutlined, HomeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import confetti from 'canvas-confetti';
import { MyContext } from '../../MyContext';
import styles from './PaymentSuccess.module.css';

const { Title, Text, Paragraph } = Typography;

const PaymentSuccess = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { fetchCurrentUser, currentUser } = useContext(MyContext);
	
	const [loading, setLoading] = useState(true);
	const [paymentInfo, setPaymentInfo] = useState(null);

	useEffect(() => {
		// Trigger confetti animation
		const duration = 3 * 1000;
		const animationEnd = Date.now() + duration;
		const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

		function randomInRange(min, max) {
			return Math.random() * (max - min) + min;
		}

		const interval = setInterval(function() {
			const timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				return clearInterval(interval);
			}

			const particleCount = 50 * (timeLeft / duration);

			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
			});
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
			});
		}, 250);

		// Lấy thông tin từ URL params
		const orderCode = searchParams.get('orderCode');
		const packageName = searchParams.get('package');
		const amount = searchParams.get('amount');

		// Simulate loading và fetch user data
		setTimeout(async () => {
			if (fetchCurrentUser) {
				await fetchCurrentUser();
			}
			
			setPaymentInfo({
				orderCode,
				packageName: packageName ? decodeURIComponent(packageName) : 'Unknown',
				amount : amount ? decodeURIComponent(amount) : 'Unknown',
				timestamp: new Date().toLocaleString('vi-VN')
			});
			
			setLoading(false);
		}, 1500);

		return () => clearInterval(interval);
	}, [searchParams]);

	const handleGoHome = () => {
		navigate('/home');
	};

	if (loading) {
		return (
			<div className={styles.loadingContainer}>
				<Spin size="large" />
				<Paragraph style={{ marginTop: 20, fontSize: 16 }}>
					Đang xác nhận thanh toán...
				</Paragraph>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<div className={styles.content}>
				<Result
					icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
					status="success"
					title={
						<Title level={2} style={{ color: '#52c41a', marginBottom: 0 }}>
							🎉 Thanh toán thành công!
						</Title>
					}
					subTitle={
						<Space direction="vertical" size="small" style={{ marginTop: 16 }}>
							<Text style={{ fontSize: 16 }}>
								Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi
							</Text>
							<Text type="secondary">
								Tài khoản của bạn đã được kích hoạt thành công
							</Text>
						</Space>
					}
					extra={[
						<Button
							type="primary"
							size="large"
							icon={<HomeOutlined />}
							onClick={handleGoHome}
							key="home"
						>
							Về trang chủ
						</Button>
					]}
				/>

				<Card 
					className={styles.infoCard}
					bordered={false}
					style={{ maxWidth: 600, margin: '0 auto' }}
				>
					<Space direction="vertical" size="middle" style={{ width: '100%' }}>
						<div className={styles.infoRow}>
							<Text strong>Mã đơn hàng:</Text>
							<Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
								{paymentInfo?.orderCode}
							</Tag>
						</div>

						<div className={styles.infoRow}>
							<Text strong>Gói dịch vụ:</Text>
							<Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
								{paymentInfo?.packageName}
							</Tag>
						</div>

						{currentUser?.account_type && (
							<div className={styles.infoRow}>
								<Text strong>Loại tài khoản:</Text>
								<Tag color="gold" style={{ fontSize: 14, padding: '4px 12px' }}>
									{currentUser.account_type}
								</Tag>
							</div>
						)}

						<div className={styles.infoRow}>
							<Text strong>
								<ClockCircleOutlined /> Thời gian:
							</Text>
							<Text>{paymentInfo?.timestamp}</Text>
						</div>
					</Space>

					<div className={styles.note}>
						<Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
							💡 Email xác nhận đã được gửi đến địa chỉ email của bạn. 
							Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.
						</Paragraph>
					</div>
				</Card>
			</div>
		</div>
	);
};

export default PaymentSuccess;

