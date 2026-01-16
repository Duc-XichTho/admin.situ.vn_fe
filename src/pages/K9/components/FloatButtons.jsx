import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent } from '@mui/material';
import { MyContext } from '../../../MyContext';
import styles from './FloatButtons.module.css';
import EmailModal from './EmailModal';
import ZaloModal from './ZaloModal';
import OnboardingGuide from '../../../pages/Guide/OnboardingGuide';
import { sendEmail } from '../../../apis/emailService';
import { HelpOutline } from '@mui/icons-material';
const FloatButtons = ({ onShowGuideline }) => {
	const [showEmailModal, setShowEmailModal] = useState(false);
	const [showZaloModal, setShowZaloModal] = useState(false);
	const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);
	const [openSlideManager, setOpenSlideManager] = useState(false);
	const [hideOnboarding, setHideOnboarding] = useState(false);
	const { currentUser } = React.useContext(MyContext);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Kiểm tra localStorage khi component mount
	useEffect(() => {
		const hideGuide = localStorage.getItem('hideOnboardingGuideK9');
		if (hideGuide === 'true') {
			setHideOnboarding(true);
		} else {
			setHideOnboarding(false);
			setShowOnboardingGuide(true);
		}
	}, []);

	const handleEmailSubmit = async (email) => {
		try {
			await sendEmail({ email });
			alert('Email đã được gửi thành công!');
		} catch (error) {
			console.error('Error sending email:', error);
			alert('Có lỗi xảy ra khi gửi email!');
		}
	};

	const handleCloseDialog = () => {
		if (hideOnboarding) {
			localStorage.setItem('hideOnboardingGuideK9', 'true');
		}
		setShowOnboardingGuide(false);
		setHideOnboarding(false);
	};

	const handleCheckboxChange = (event) => {
		localStorage.setItem('hideOnboardingGuideK9', event.target.checked);
		setHideOnboarding(event.target.checked);
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

			{/* Onboarding Guide Button */}
			<button
				className={`${styles.floatButton} ${styles.guidelineButton}`}
				onClick={() => setShowOnboardingGuide(true)}
				title="Hướng dẫn sử dụng"
			>
				<HelpOutline
					style={{ fontSize: 22 }}
				/>
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

			{/* Onboarding Guide Dialog */}
			<Dialog
				open={showOnboardingGuide}
				onClose={handleCloseDialog}
				fullScreen={isMobile}
				PaperProps={{
					style: isMobile ? {
						margin: '20px 10px 30px 10px',
						maxHeight: 'calc(100vh - 50px)',
						height: 'calc(100vh - 50px)',
						maxWidth: 'calc(100vw - 20px)',
						width: 'calc(100vw - 20px)',
						borderRadius: '8px',
					} : {
						width: '80vw',
						height: '80vh',
						maxWidth: 'none',
						maxHeight: '80vh',
					},
				}}
			>
				<DialogContent
					style={{
						padding: '0px',
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden'
					}}
				>
					<OnboardingGuide
						componentName="K9"
						openSlideManager={openSlideManager}
						setOpenSlideManager={setOpenSlideManager}
						currentUser={currentUser}
						onClose={handleCloseDialog}
						hideOnboarding={hideOnboarding}
						onCheckboxChange={handleCheckboxChange}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default FloatButtons;
