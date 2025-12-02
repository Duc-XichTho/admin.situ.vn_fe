import axios from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;

export const getAllStrategyReports = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/strategy-report`);
    return response.data;
  } catch (error) {
    console.error('Error fetching strategy reports:', error);
    throw error;
  }
};

export const getStrategyReportById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/strategy-report/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching strategy report with ID ${id}:`, error);
    throw error;
  }
};

export const createStrategyReport = async (reportData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/strategy-report`, reportData);
    return response.data;
  } catch (error) {
    console.error('Error creating strategy report:', error);
    throw error;
  }
};

export const updateStrategyReport = async (id, reportData) => {
  try {
    const response = await axios.put(`${BASE_URL}/api/strategy-report/${id}`, reportData);
    return response.data;
  } catch (error) {
    console.error(`Error updating strategy report with ID ${id}:`, error);
    throw error;
  }
};

export const deleteStrategyReport = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/strategy-report/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting strategy report with ID ${id}:`, error);
    throw error;
  }
}; 