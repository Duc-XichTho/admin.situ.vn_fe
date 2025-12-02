import React, { useState } from 'react';
import styles from './EmailModal.module.css';

const EmailModal = ({ visible, onClose, onSubmit }) => {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email.trim()) return;

		setLoading(true);
		try {
			await onSubmit(email);
			setEmail('');
			onClose();
		} catch (error) {
			console.error('Error submitting email:', error);
		} finally {
			setLoading(false);
		}
	};

	if (!visible) return null;

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.header}>
					<h3>Liên hệ qua Email</h3>
					<button className={styles.closeButton} onClick={onClose}>
						×
					</button>
				</div>
				<form onSubmit={handleSubmit} className={styles.form}>
					<div className={styles.inputGroup}>
						<label htmlFor="email">Email của bạn:</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Nhập email của bạn"
							required
						/>
					</div>
					<div className={styles.actions}>
						<button type="button" onClick={onClose} className={styles.cancelButton}>
							Hủy
						</button>
						<button type="submit" className={styles.submitButton} disabled={loading}>
							{loading ? 'Đang gửi...' : 'Gửi'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EmailModal;
