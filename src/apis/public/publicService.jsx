import instance from '../axiosInterceptors.jsx';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/public';
const URL = BASE_URL + SUB_URL;

export const getListQuestionHistoryByUserPublic = async (data) => {
	try {
		const result = await instance.post(URL + `/question-history/user-history`, data);
		return result.data;
	} catch (e) {
		console.error("Lỗi khi lấy dữ liệu : ", e);
		throw e;
	}
}

export const getK9ByTypePublic = async (type) => {
	try {
		const { data } = await instance.get(`${URL}/k9/type/${type}`);
		return data.data.sort((a, b) => b.id - a.id);
	} catch (error) {
		console.error('Error fetching K9 by type:', error);
		throw error;
	}
};

export const getK9ByIdPublic = async (id) => {
	try {
		const { data } = await instance.get(`${URL}/k9/${id}`);
		return data.data;
	} catch (error) {
		console.error('Error fetching K9 by ID:', error);
		throw error;
	}
};

export const getK9ByCidTypePublic = async (cid, type) => {
	try {
		const { data } = await instance.get(`${URL}/k9/cid/${cid}/type/${type}`);
		return data.data;
	} catch (error) {
		console.error('Error fetching K9 by CID:', error);
		throw error;
	}
};


export const getPageSectionDataShareByIdPagePublic = async (id, currentUser) => {
	try {
		const result = await instance.post(URL + '/share/' + id, {
			currentUser: { email: currentUser?.email }
		});
		return result.data;
	} catch (e) {
		console.error('Lỗi khi lấy dữ liệu : ', e);
		throw e;
	}
};

export const getSettingPublic = async (id) => {
	try {
		const result = await instance.get(URL + '/setting/' + id);
		return result.data;
	} catch (e) {
		console.error('Lỗi khi lấy dữ liệu : ', e);
		throw e;
	}
};

export const getSettingByTypePublic = async (type) => {
	try {
		const data = await instance.get(URL + '/setting/' + type);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy thông tin:', error);
		throw error;
	}
};


export const createNewSettingPublic = async (newRowData) => {
	try {
		let { data } = await instance.post(URL + '/setting/', newRowData)
		return data
	} catch (error) {
		console.log(error);
		throw error;
	}
}

export const getAllPageSectionDataSharePublic = async () => {
	try {
		const result = await instance.get(URL + '/all-share');
		return result.data;
	} catch (e) {
		console.error('Lỗi khi lấy dữ liệu : ', e);
		throw e;
	}
};


export const getPageDataByPathPublic = async (path) => {
	try {
		const result = await instance.get(URL + '/by-path/' + path);
		return result.data;
	} catch (e) {
		console.error('Lỗi khi lấy dữ liệu : ', e);
		throw e;
	}
};

export const getPageSectionDataByIdPublic = async (id, currentUser) => {
	try {
		const result = await instance.post(URL + '/page-section/' + id, {
			currentUser: { email: currentUser?.email }
		});
		return result.data;
	} catch (e) {
		console.error('Lỗi khi lấy dữ liệu : ', e);
		throw e;
	}
};

export const createNewContentPagePublic = async (newRowData) => {
	try {
		let { data } = await instance.post(URL + '/content-page/', newRowData);
		return data;
	} catch (error) {
		console.log(error);
		throw error;
	}
};

export const getContentPageDataByIdPublic = async (id) => {
	try {
		const result = await instance.get(URL + '/content-page/' + id);
		return result.data;
	} catch (e) {
		console.error('Lỗi khi lấy dữ liệu : ', e);
		throw e;
	}
};

export const getNoteChartDataPublic = async (title) => {
	try {
		if (title != undefined) {
			let response = await instance.get(`${URL}/note/chartTitle/${title}`);
			return response.data;
		}
	} catch (error) {
		console.error('Error getting note: ', error);
		throw error;
	}
};

export const sendRequestEmailPublic = async (data) => {
	try {
		const response = await instance.post(`${URL}/send-request-create-page`, data);
		return response.data;
	} catch (error) {
		console.error('Error sending notification email:', error);
		throw error;
	}
};

export const createNewRequestPagePublic = async (newRowData) => {
	try {
		let { data } = await instance.post(`${URL}/request-page`, newRowData);
		return data;
	} catch (error) {
		console.log(error);
		throw error;
	}
};

export const registerAccountPublic = async (userData) => {
	try {
		const { data } = await instance.post(`${URL}/register-account`, userData);
		return data;
	} catch (error) {
		throw error;
	}
};


// Đăng nhập bằng username
export const loginWithUsername = async (username, password, deviceFingerprint) => {
	try {
		const response = await instance.post(`${BASE_URL}/login/username`, {
			username,
			password,
			// deviceFingerprint
		});
		return response.data;
	} catch (error) {
		throw error;
	}
};

// Đăng nhập bằng username
export const updateAccountTrial = async (id , data) => {
	try {
		const response = await instance.post(`${URL}/update-account-trial/${id}`, data);
		return response.data;
	} catch (error) {
		throw error;
	}
};
