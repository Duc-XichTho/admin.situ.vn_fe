import React, { useState } from 'react';
import { Modal, Typography, message } from 'antd';
import { createPaymentLink } from '../../apis/paymentService';
import { updateUser } from '../../apis/userService';
import PackageGrid from './PackageGrid';
import homepageStyles from '../../pages/Homepage/Homepage.module.css';

const PaymentModal = ({ open, onCancel, currentUser, isMobile = false, onTrialActivated }) => {
	const [paymentLoading, setPaymentLoading] = useState(false);

	function generateNumericOrderCode(userId) {
		const timestamp = Date.now().toString().slice(-8); // 8 số cuối của timestamp
		const random = Math.floor(100 + Math.random() * 900); // random 3 chữ số
		return Number(`${userId}${timestamp}${random}`);
	}

	// Handle payment - create payment link hoặc activate trial
	const handlePurchasePackage = async (packageData) => {
		if (!currentUser?.id) {
			message.error('Vui lòng đăng nhập để mua gói');
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
						...currentUser.info,
						startDate: startDate,
						durationDays: durationDays,
						expiryDate: expiryDate.toISOString(),
					}
				};

				await updateUser(currentUser.id, updateData);
				message.success(`Gói dùng thử ${packageData.durationText} đã được kích hoạt thành công!`);
				
				// Callback để refresh user data
				if (onTrialActivated) {
					onTrialActivated();
				}
				
				// Đóng modal sau 1.5 giây
				setTimeout(() => {
					onCancel();
					// Reload page để cập nhật user data
					window.location.reload();
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
			// Generate orderCode based on user ID and timestamp
			const orderCode = generateNumericOrderCode(currentUser.id);

			const paymentData = {
				userId: currentUser.id,
				amount: packageData.price,
				description: `Thanh toán ${packageData.name}`, // Max 25 chars
				returnUrl: `${window.location.origin}/payment-success?payment_success=true&orderCode=${orderCode}&package=${encodeURIComponent(packageData.name)}`,
				cancelUrl: `${window.location.origin}/home`,
				serviceDomain: 'aimba',
				paymentType: 'improve-account',// hoặc tên service của bạn
				callbackUrl: import.meta.env.VITE_API_URL + '/api/payment-callback', // Để nhận callback khi thành công
				orderCode: orderCode, // Số hoặc string số đều OK
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
		<Modal
			title={
				<div className={homepageStyles.modalTitle}>
					<div className={homepageStyles.modalTitleMain}>Mua gói Pro</div>
					<div className={homepageStyles.modalTitleSub}>Chọn gói phù hợp với nhu cầu của bạn</div>
				</div>
			}
			open={open}
			onCancel={onCancel}
			footer={null}
			width={isMobile ? '95%' : '1200px'}
			className={homepageStyles.customModal}
			centered
		>
			<div style={{ padding: '20px 0' }}>
				<PackageGrid
					onPackageSelect={handlePurchasePackage}
					loading={paymentLoading}
				/>

				<div style={{
					marginTop: '24px',
					padding: '16px',
					background: '#f6f8fa',
					borderRadius: '8px',
					border: '1px solid #e1e4e8'
				}}>
					<Typography.Text type="secondary" style={{ fontSize: '13px' }}>
						💡 <strong>Lưu ý:</strong> Sau khi thanh toán thành công, tài khoản của bạn sẽ được tự động kích hoạt gói tương ứng.
					</Typography.Text>
				</div>
			</div>
		</Modal>
	);
};

export default PaymentModal;

