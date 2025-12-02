import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/case-public';
const URL = BASE_URL + SUB_URL;

export const getAllCasePublicByUser = async (data) => {
	try {
		const result = await instance.post(URL + `/user`, data);
		return result.data;
	} catch (e) {
		console.error('Lỗi khi lấy dữ liệu : ', e);
		throw e;
	}
};

export const getCasePublicDataById = async (id) => {
	try {
		const result = await instance.get(URL + `/${id}`);
		return result.data;
	} catch (e) {
		console.error('Lỗi khi lấy dữ liệu : ', e);
		throw e;
	}
};

export const createNewCasePublic = async (newRowData) => {
	try {
		let { data } = await instance.post(URL, newRowData);
		return data;
	} catch (error) {
		console.log(error);
		throw error;
	}
};

export const updateCasePublic = async (newRowData) => {
	try {
		let { data } = await instance.put(URL, newRowData);
		return data;
	} catch (error) {
		console.log(1, error);
		throw error;
	}
};
export const deleteCasePublic = async (id) => {
	try {
		let res = await instance.delete(URL + '/' + id);
		return res;
	} catch (error) {
		console.log(error);
		throw error;
	}
};