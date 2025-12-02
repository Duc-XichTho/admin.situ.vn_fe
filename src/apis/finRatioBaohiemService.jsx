import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/fin-ratio-baohiem';
const URL = BASE_URL + SUB_URL;

export const getAllFinRatioBaohiems = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách fin_ratio_baohiem:', error);
        throw error;
    }
};

export const getFinRatioBaohiemById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy fin_ratio_baohiem theo id:', error);
        throw error;
    }
};

export const createFinRatioBaohiem = async (finRatioBaohiemData) => {
    try {
        const { data } = await instance.post(URL, finRatioBaohiemData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo fin_ratio_baohiem:', error);
        throw error;
    }
};

export const updateFinRatioBaohiem = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật fin_ratio_baohiem:', error);
        throw error;
    }
};

export const deleteFinRatioBaohiem = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa fin_ratio_baohiem:', error);
        throw error;
    }
}; 