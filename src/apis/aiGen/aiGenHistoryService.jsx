import instance from './../axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/aiGenHistory';
const URL = BASE_URL + SUB_URL;

export const getAllAiGenHistory = async () => {
    try {
        const { data } = await instance.get(URL);
        return data.data;
    } catch (error) {
        console.error('Error fetching AI gen history:', error);
        throw error;
    }
};

export const getAiGenHistoryById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data.data;
    } catch (error) {
        console.error('Error fetching AI gen history by ID:', error);
        throw error;
    }
};

export const createAiGenHistory = async (historyData) => {
    try {
        const { data } = await instance.post(URL, historyData);
        return data;
    } catch (error) {
        console.error('Error creating AI gen history:', error);
        throw error;
    }
};

export const updateAiGenHistory = async (historyData) => {
    try {
        const { data } = await instance.put(URL, historyData);
        return data;
    } catch (error) {
        console.error('Error updating AI gen history:', error);
        throw error;
    }
};

export const deleteAiGenHistory = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error deleting AI gen history:', error);
        throw error;
    }
};
