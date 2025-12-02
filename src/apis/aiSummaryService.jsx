import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/ai-summary';
const URL = BASE_URL + SUB_URL;

export const getAllAISummaries = async () => {
    try {
        const { data } = await instance.get(URL);
        return data.sort((a, b) => b.id - a.id);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách AI summaries:', error);
        throw error;
    }
};

export const getAISummaryById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy AI summary theo id:', error);
        throw error;
    }
};

export const createAISummary = async (summaryData) => {
    try {
        const { data } = await instance.post(URL, summaryData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo AI summary:', error);
        throw error;
    }
};

export const updateAISummary = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật AI summary:', error);
        throw error;
    }
};

export const deleteAISummary = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa AI summary:', error);
        throw error;
    }
};
