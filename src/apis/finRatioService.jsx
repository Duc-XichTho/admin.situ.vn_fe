import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/fin-ratio';
const URL = BASE_URL + SUB_URL;

export const getAllFinRatios = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách fin_ratio:', error);
        throw error;
    }
};

export const getFinRatioById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy fin_ratio theo id:', error);
        throw error;
    }
};

export const createFinRatio = async (finRatioData) => {
    try {
        const { data } = await instance.post(URL, finRatioData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo fin_ratio:', error);
        throw error;
    }
};

export const updateFinRatio = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật fin_ratio:', error);
        throw error;
    }
};

export const deleteFinRatio = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa fin_ratio:', error);
        throw error;
    }
}; 