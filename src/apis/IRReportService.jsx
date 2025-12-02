import axios from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;

export const getAllIRReports = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/ir-report`);
    return response.data;
  } catch (error) {
    console.error('Error fetching IR reports:', error);
    throw error;
  }
};

export const getIRReportById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/ir-report/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching IR report with ID ${id}:`, error);
    throw error;
  }
};

export const createIRReport = async (reportData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/ir-report`, reportData);
    return response.data;
  } catch (error) {
    console.error('Error creating IR report:', error);
    throw error;
  }
};

export const updateIRReport = async (id, reportData) => {
  try {
    const response = await axios.put(`${BASE_URL}/api/ir-report/${id}`, reportData);
    return response.data;
  } catch (error) {
    console.error(`Error updating IR report with ID ${id}:`, error);
    throw error;
  }
};

export const deleteIRReport = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/ir-report/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting IR report with ID ${id}:`, error);
    throw error;
  }
}; 