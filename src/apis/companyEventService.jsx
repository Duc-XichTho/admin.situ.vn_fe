import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/company-event';
const URL = BASE_URL + SUB_URL;

export const getAllCompanyEvents = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách company_event:', error);
        throw error;
    }
};

export const getCompanyEventById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy company_event theo id:', error);
        throw error;
    }
};

export const createCompanyEvent = async (companyEventData) => {
    try {
        const { data } = await instance.post(URL, companyEventData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo company_event:', error);
        throw error;
    }
};

export const updateCompanyEvent = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật company_event:', error);
        throw error;
    }
};

export const deleteCompanyEvent = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa company_event:', error);
        throw error;
    }
}; 