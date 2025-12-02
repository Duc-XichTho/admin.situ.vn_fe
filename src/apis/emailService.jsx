// Email service for handling email submissions
// This is a placeholder service - implement according to your backend requirements

import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/email/send';
const URL = BASE_URL + SUB_URL;

export const sendEmail = async (emailData) => {
	try {
		const response = await instance.post(URL, {
			email: emailData.email
		});

		return response.data;
	} catch (error) {
		console.error('Error sending email:', error);
		throw error;
	}
};

