import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/full-name-company';
const URL = BASE_URL + SUB_URL;

export const getAllFullNameCompanies = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách full_name_company:', error);
        throw error;
    }
};

export const getFullNameCompanyById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy full_name_company theo id:', error);
        throw error;
    }
};

export const createFullNameCompany = async (fullNameCompanyData) => {
    try {
        const { data } = await instance.post(URL, fullNameCompanyData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo full_name_company:', error);
        throw error;
    }
};

export const updateFullNameCompany = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật full_name_company:', error);
        throw error;
    }
};

export const deleteFullNameCompany = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa full_name_company:', error);
        throw error;
    }
}; 