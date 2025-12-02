import axios from './axiosInterceptors';
const BASE_URL = import.meta.env.VITE_API_URL;
const THESIS_API_BASE = `${BASE_URL}/api/thesis`;

export const thesisService = {
  // Tạo thesis mới
  createThesis: async (thesisData) => {
    try {
      const response = await axios.post(THESIS_API_BASE, thesisData);
      return response.data;
    } catch (error) {
      console.error('Error creating thesis:', error);
      throw error;
    }
  },

  // Lấy tất cả thesis
  getAllThesis: async () => {
    try {
      const response = await axios.get(THESIS_API_BASE);
      // Return array directly or from data property
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    } catch (error) {
      console.error('Error fetching all thesis:', error);
      throw error;
    }
  },

  // Lấy thesis theo ID
  getThesisById: async (id) => {
    try {
      const response = await axios.get(`${THESIS_API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching thesis by ID:', error);
      throw error;
    }
  },

  // Lấy thesis theo user
  getThesisByUser: async (userCreated) => {
    try {
      const response = await axios.get(`${THESIS_API_BASE}/user/${userCreated}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching thesis by user:', error);
      throw error;
    }
  },

  // Tìm kiếm thesis
  searchThesis: async (searchTerm) => {
    try {
      const response = await axios.get(`${THESIS_API_BASE}/search?q=${encodeURIComponent(searchTerm)}`);
      // Return array directly or from data property
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    } catch (error) {
      console.error('Error searching thesis:', error);
      throw error;
    }
  },

  // Cập nhật thesis
  updateThesis: async (id, thesisData) => {
    try {
      const response = await axios.put(`${THESIS_API_BASE}/${id}`, thesisData);
      return response.data;
    } catch (error) {
      console.error('Error updating thesis:', error);
      throw error;
    }
  },

  // Xóa thesis
  deleteThesis: async (id) => {
    try {
      const response = await axios.delete(`${THESIS_API_BASE}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting thesis:', error);
      throw error;
    }
  }
}; 