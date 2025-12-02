import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/k9';
const URL = BASE_URL + SUB_URL;

// CRUD operations
export const getAllK9 = async (type = null) => {
    try {
        const params = type ? { type } : {};
        const { data } = await instance.get(URL, { params });
        return data;
    } catch (error) {
        console.error('Error fetching all K9:', error);
        throw error;
    }
};

export const getK9ById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data.data        ;
    } catch (error) {
        console.error('Error fetching K9 by ID:', error);
        throw error;
    }
};

export const getK9ByCidType = async (cid , type) => {
    try {
        const { data } = await instance.get(`${URL}/cid/${cid}/type/${type}`);
        return data.data;
    } catch (error) {
        console.error('Error fetching K9 by CID:', error);
        throw error;
    }
};

export const createK9 = async (k9Data) => {
    try {
        const { data } = await instance.post(URL, k9Data);
        return data;
    } catch (error) {
        console.error('Error creating K9:', error);
        throw error;
    }
};

export const updateK9 = async (k9Data) => {
    try {
        const { data } = await instance.put(URL, k9Data);
        return data;
    } catch (error) {
        console.error('Error updating K9:', error);
        throw error;
    }
};

export const deleteK9 = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error deleting K9:', error);
        throw error;
    }
};

export const getK9ByType = async (type ) => {
    try {
        const { data } = await instance.get(`${URL}/type/${type}`);
        return data.data.sort((a, b) => b.id - a.id);
    } catch (error) {
        console.error('Error fetching K9 by type:', error);
        throw error;
    }
};

// Vector search operations (legacy - use embedingDataService instead)
export const searchK9ByVector = async (query, limit = 10, threshold = 0.3) => {
    try {
        const { data } = await instance.post(`${URL}/search/vector`, {
            query,
            limit,
            threshold
        });
        return data;
    } catch (error) {
        console.error('Error searching K9 by vector:', error);
        throw error;
    }
};

export const convertTextToVector = async (text) => {
    try {
        const { data } = await instance.post(`${URL}/convert-to-vector`, {
            text
        });
        return data;
    } catch (error) {
        console.error('Error converting text to vector:', error);
        throw error;
    }
};

export const searchK9ByPreConvertedVector = async (vector, limit = 10, threshold = 0.3) => {
    try {
        const { data } = await instance.post(`${URL}/search/pre-converted-vector`, {
            vector,
            limit,
            threshold
        });
        return data;
    } catch (error) {
        console.error('Error searching K9 by pre-converted vector:', error);
        throw error;
    }
};

export const searchK9ByTextToVector = async (text, limit = 10, threshold = 0.3) => {
    try {
        // Use embedingDataService instead
        const { searchEmbedingDataByTextForTable } = await import('./embedingDataService.jsx');
        return await searchEmbedingDataByTextForTable(text, 'k9', limit, threshold);
    } catch (error) {
        console.error('Error in text-to-vector search for K9:', error);
        throw error;
    }
};

export const updateK9Bulk = async (updateData) => {
    try {
        const res = await instance.post(`${URL}/update-batch`, updateData);
        return res.data;
    } catch (error) {
        throw error;
    }
};

