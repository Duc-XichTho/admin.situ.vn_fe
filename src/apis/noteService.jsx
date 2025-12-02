import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/note';
const URL = BASE_URL + SUB_URL;

export const getNoteChartData = async (title) => {
	try {
		if (title != undefined) {
			let response = await instance.get(`${URL}/chartTitle/${title}`);
			return response.data;
		}
	} catch (error) {
		console.error('Error getting note: ', error);
		throw error;
	}
};

export const getNoteChartDataByID = async (id) => {
	try {
		let response = await instance.get(`${URL}/${id}`);
		return response.data;
	} catch (error) {
		console.error('Error getting note: ', error);
		throw error;
	}
};

export const addNoteChartData = async (data) => {
		try {
			let response = await instance.post(`${URL}`, data);
			return response.data;
		} catch (error) {
			console.error('Error adding note: ', error);
			throw error;
		}
	}
;

export const updateNoteChart = async (id, data) => {
	try {
		let response = await instance.put(`${URL}/${id}`, data);
		return response.data;
	} catch (error) {
		console.error('Error adding note: ', error);
		throw error;
	}
};

export const getALLNoteChartData = async () => {
	try {
		let response = await instance.get(`${URL}`);
		return response.data;
	} catch (error) {
		console.error('Error getting note: ', error);
		throw error;
	}
};
