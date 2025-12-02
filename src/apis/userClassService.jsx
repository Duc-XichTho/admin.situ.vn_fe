import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/user-class';
const URL = BASE_URL + SUB_URL;

export const getAllUserClass = async () => {
    try {
        const { data } = await instance.get(URL);
        return data.sort((a, b) => b.id - a.id);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách AI summaries:', error);
        throw error;
    }
};

export const getUserClassById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy AI summary theo id:', error);
        throw error;
    }
};

export const createUserClass = async (value) => {
    try {
        const { data } = await instance.post(URL, value);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo AI summary:', error);
        throw error;
    }
};

export const updateUserClass = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật AI summary:', error);
        throw error;
    }
};

export const deleteUserClass = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa AI summary:', error);
        throw error;
    }
};
