import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/page-section'
const URL = BASE_URL + SUB_URL;
export const getAllPageSection = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getPageSectionDataById = async (id) => {
    try {
        const result = await instance.get(URL + '/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const getPageSectionDataShareByIdPage = async (id) => {
    try {
        const result = await instance.get(URL + '/share/' + id);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const getAllPageSectionDataShare = async () => {
    try {
        const result = await instance.get(URL + '/all-share');
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}


export const createNewPageSection = async (newRowData) => {
    try {
        let { data } = await instance.post(URL, newRowData)
        return data
    } catch (error) {
        console.log(error);
        throw error;
    }
}
export const updatePageSection = async (newRowData) => {
    try {
        let res = await instance.put(URL, newRowData)
        return res
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}
export const deletePageSection = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
}