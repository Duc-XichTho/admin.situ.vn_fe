import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/company-info';
const URL = BASE_URL + SUB_URL;

export const getAllCompanyInfos = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách company_info:', error);
        throw error;
    }
};

export const getCompanyInfoById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy company_info theo id:', error);
        throw error;
    }
};

export const createCompanyInfo = async (companyInfoData) => {
    try {
        const { data } = await instance.post(URL, companyInfoData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo company_info:', error);
        throw error;
    }
};

export const updateCompanyInfo = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật company_info:', error);
        throw error;
    }
};

export const deleteCompanyInfo = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa company_info:', error);
        throw error;
    }
}; 