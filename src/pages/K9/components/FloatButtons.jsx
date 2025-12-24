import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MyContext } from '../../../MyContext';
import styles from './FloatButtons.module.css';
import EmailModal from './EmailModal';
import ZaloModal from './ZaloModal';
import { sendEmail } from '../../../apis/emailService';

const FloatButtons = ({ onShowGuideline }) => {
	const [showEmailModal, setShowEmailModal] = useState(false);
	const [showZaloModal, setShowZaloModal] = useState(false);
	const { currentUser } = React.useContext(MyContext);

	const handleEmailSubmit = async (email) => {
		try {
			await sendEmail({ email });
			alert('Email đã được gửi thành công!');
		} catch (error) {
			console.error('Error sending email:', error);
			alert('Có lỗi xảy ra khi gửi email!');
		}
	};

	const floatButtonsContent = (
		<div className={styles.floatButtonsContainer}>
			{/* Guideline Button */}
			{/* <button
				className={`${styles.floatButton} ${styles.guidelineButton}`}
				onClick={onShowGuideline}
				title="Hướng dẫn sử dụng"
			>
				📖
			</button> */}

			{/* Email Button */}
			{/* <button
				className={`${styles.floatButton} ${styles.emailButton}`}
				onClick={() => setShowEmailModal(true)}
				title="Liên hệ qua Email"
			>
				<img src="https://images.icon-icons.com/1826/PNG/512/4202011emailgmaillogomailsocialsocialmedia-115677_115624.png" alt="" />
			</button> */}

			{/* Zalo Button */}
			{/* <button
				className={`${styles.floatButton} ${styles.zaloButton}`}
				onClick={() => setShowZaloModal(true)}
				title="Liên hệ qua Zalo"
			>
				<img src="https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Zalo-Arc.png" alt="" />
			</button> */}
			<button
				className={`${styles.floatButton} ${styles.facebookButton}`}
				onClick={() => window.open('https://www.facebook.com/profile.php?id=61582830943777', '_blank')}
				title="Liên hệ qua Facebook"
			>
				<img src="https://cdn.icon-icons.com/icons2/2108/PNG/512/facebook_icon_130940.png" alt="Facebook" />
			</button>
		</div>
	);

	return (
		<>
			{typeof window !== 'undefined' && createPortal(floatButtonsContent, document.body)}

			{/* Email Modal */}
			<EmailModal
				visible={showEmailModal}
				onClose={() => setShowEmailModal(false)}
				onSubmit={handleEmailSubmit}
			/>

			{/* Zalo Modal */}
			<ZaloModal
				visible={showZaloModal}
				onClose={() => setShowZaloModal(false)}
				currentUser={currentUser}
			/>
		</>
	);
};

export default FloatButtons;
