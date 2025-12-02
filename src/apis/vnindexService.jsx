import axios from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;

export const getAllVNIndex = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/vnindex`);
    return response.data;
  } catch (error) {
    console.error('Error fetching VNINDEX data:', error);
    throw error;
  }
};

export const getVNIndexById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/vnindex/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching VNINDEX with ID ${id}:`, error);
    throw error;
  }
};

export const createVNIndex = async (vnindexData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/vnindex`, vnindexData);
    return response.data;
  } catch (error) {
    console.error('Error creating VNINDEX entry:', error);
    throw error;
  }
};

export const updateVNIndex = async (id, vnindexData) => {
  try {
    const response = await axios.put(`${BASE_URL}/api/vnindex/${id}`, vnindexData);
    return response.data;
  } catch (error) {
    console.error(`Error updating VNINDEX with ID ${id}:`, error);
    throw error;
  }
};

export const deleteVNIndex = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/vnindex/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting VNINDEX with ID ${id}:`, error);
    throw error;
  }
}; 