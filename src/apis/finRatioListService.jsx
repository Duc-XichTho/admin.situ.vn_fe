import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/fin-ratio-list';
const URL = BASE_URL + SUB_URL;

export const getAllFinRatioLists = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách fin_ratio_list:', error);
        throw error;
    }
};

export const getFinRatioListById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy fin_ratio_list theo id:', error);
        throw error;
    }
};

export const createFinRatioList = async (finRatioListData) => {
    try {
        const { data } = await instance.post(URL, finRatioListData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo fin_ratio_list:', error);
        throw error;
    }
};

export const updateFinRatioList = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật fin_ratio_list:', error);
        throw error;
    }
};

export const deleteFinRatioList = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa fin_ratio_list:', error);
        throw error;
    }
}; 