import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/case-public-history'
const URL = BASE_URL + SUB_URL;

export const getAllCasePublicHistory = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getCasePublicHistoryDataById = async (id) => {
    try {
        const result = await instance.get(URL + `/${id}`);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const getCasePublicHistoryByUser = async (userEmail) => {
    try {
        const result = await instance.get(URL + `/user/${userEmail}`);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}


export const getCasePublicHistoryByUserAndIdQuestion = async ( userId , idQuestion) => {
    try {
        const result = await instance.get(URL + `/userId/${userId}/${idQuestion}`);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}


export const getListCasePublicHistoryByUser = async ( data ) => {
    try {
        const result = await instance.post(URL + `/user-history`, data);
        return result.data;
    } catch (e) {
        console.error("Lỗi khi lấy dữ liệu : ", e);
        throw e;
    }
}

export const createNewCasePublicHistory = async (newRowData) => {
    try {
        let {data} = await instance.post(URL, newRowData)
        return data
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateCasePublicHistory = async (newRowData) => {
    try {
        let {data} = await instance.put(URL, newRowData)
        return data
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}

export const deleteCasePublicHistory = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
} 