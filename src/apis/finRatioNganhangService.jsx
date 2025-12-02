import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/fin-ratio-nganhang';
const URL = BASE_URL + SUB_URL;

export const getAllFinRatioNganhangs = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách fin_ratio_nganhang:', error);
        throw error;
    }
};

export const getFinRatioNganhangById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy fin_ratio_nganhang theo id:', error);
        throw error;
    }
};

export const createFinRatioNganhang = async (finRatioNganhangData) => {
    try {
        const { data } = await instance.post(URL, finRatioNganhangData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo fin_ratio_nganhang:', error);
        throw error;
    }
};

export const updateFinRatioNganhang = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật fin_ratio_nganhang:', error);
        throw error;
    }
};

export const deleteFinRatioNganhang = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa fin_ratio_nganhang:', error);
        throw error;
    }
}; 