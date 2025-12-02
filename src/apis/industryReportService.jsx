import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/industry-report';
const URL = BASE_URL + SUB_URL;

export const getAllIndustryReports = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách industry_report:', error);
        throw error;
    }
};

export const getIndustryReportById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy industry_report theo id:', error);
        throw error;
    }
};

export const createIndustryReport = async (industryReportData) => {
    try {
        const { data } = await instance.post(URL, industryReportData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo industry_report:', error);
        throw error;
    }
};

export const updateIndustryReport = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật industry_report:', error);
        throw error;
    }
};

export const deleteIndustryReport = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa industry_report:', error);
        throw error;
    }
}; 