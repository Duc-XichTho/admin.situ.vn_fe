import instance from './../axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/aiGenConfigList';
const URL = BASE_URL + SUB_URL;

export const getAllAiGenConfigList = async () => {
    try {
        const { data } = await instance.get(URL);
        return data.data;
    } catch (error) {
        console.error('Error fetching AI gen config list:', error);
        throw error;
    }
};

export const getAiGenConfigListById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data.data;
    } catch (error) {
        console.error('Error fetching AI gen config list by ID:', error);
        throw error;
    }
};

export const createAiGenConfigList = async (configData) => {
    try {
        const { data } = await instance.post(URL, configData);
        return data;
    } catch (error) {
        console.error('Error creating AI gen config list:', error);
        throw error;
    }
};

export const updateAiGenConfigList = async (configData) => {
    try {
        const { data } = await instance.put(URL, configData);
        return data;
    } catch (error) {
        console.error('Error updating AI gen config list:', error);
        throw error;
    }
};

export const deleteAiGenConfigList = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error deleting AI gen config list:', error);
        throw error;
    }
};
