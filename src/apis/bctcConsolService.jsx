import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/bctc-consol';
const URL = BASE_URL + SUB_URL;

export const getAllBctcConsols = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bctc_consol:', error);
        throw error;
    }
};

export const getBctcConsolById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy bctc_consol theo id:', error);
        throw error;
    }
};

export const createBctcConsol = async (bctcConsolData) => {
    try {
        const { data } = await instance.post(URL, bctcConsolData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo bctc_consol:', error);
        throw error;
    }
};

export const updateBctcConsol = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật bctc_consol:', error);
        throw error;
    }
};

export const deleteBctcConsol = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa bctc_consol:', error);
        throw error;
    }
}; 