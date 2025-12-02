import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/macro-report';
const URL = BASE_URL + SUB_URL;

export const getAllMacroReports = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách macro report:', error);
        throw error;
    }
};

export const getMacroReportById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy macro report theo id:', error);
        throw error;
    }
};

export const createMacroReport = async (reportData) => {
    try {
        const { data } = await instance.post(URL, reportData);
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo macro report:', error);
        throw error;
    }
};

export const updateMacroReport = async (id, newData) => {
    try {
        const { data } = await instance.put(`${URL}/${id}`, newData);
        return data;
    } catch (error) {
        console.error('Lỗi khi cập nhật macro report:', error);
        throw error;
    }
};

export const deleteMacroReport = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Lỗi khi xóa macro report:', error);
        throw error;
    }
}; 