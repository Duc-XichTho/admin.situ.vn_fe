import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/company-report';
const URL = BASE_URL + SUB_URL;

export const getAllCompanyReports = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách company_report:', error);
        throw error;
    }
};

export const getCompanyReportById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy company_report theo id:', error);
        throw error;
    }
};

export const createCompanyReport = async (companyReportData) => {
    try {
        const { data } = await instance.post(URL, companyReportData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo company_report:', error);
        throw error;
    }
};

export const updateCompanyReport = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật company_report:', error);
        throw error;
    }
};

export const deleteCompanyReport = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa company_report:', error);
        throw error;
    }
}; 