import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/question'
const URL = BASE_URL + SUB_URL;

export const getAllQuestion = async () => {
    try {
        const {data} = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const getQuestionDataById = async (id) => {
  try {
    const result = await instance.get(URL + `/${id}`);
    return result.data;
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu : ", e);
    throw e;
  }
}

export const createNewQuestion = async (newRowData) => {
    try {
        let {data} = await instance.post(URL, newRowData)
        return data
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const updateQuestion = async (newRowData) => {
    try {
        let {data} = await instance.put(URL, newRowData)
        return data
    } catch (error) {
        console.log(1, error);
        throw error;
    }
}

export const deleteQuestion = async (id) => {
    try {
        let res = await instance.delete(URL + '/' + id)
        return res
    } catch (error) {
        console.log(error);
        throw error;
    }
} 