import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/fin-ratio-chungkhoan';
const URL = BASE_URL + SUB_URL;

export const getAllFinRatioChungkhoans = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách fin_ratio_chungkhoan:', error);
        throw error;
    }
};

export const getFinRatioChungkhoanById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy fin_ratio_chungkhoan theo id:', error);
        throw error;
    }
};

export const createFinRatioChungkhoan = async (finRatioChungkhoanData) => {
    try {
        const { data } = await instance.post(URL, finRatioChungkhoanData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo fin_ratio_chungkhoan:', error);
        throw error;
    }
};

export const updateFinRatioChungkhoan = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật fin_ratio_chungkhoan:', error);
        throw error;
    }
};

export const deleteFinRatioChungkhoan = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa fin_ratio_chungkhoan:', error);
        throw error;
    }
}; 