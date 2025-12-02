import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const PATH = "/api/quiz";
const URL = BASE_URL + PATH;

export const getAllQuiz = async (note_id) => {
  try {
    const response = await instance.get(`${URL}/${note_id}`);
    return response.data[0];
  } catch (error) {
    console.error("Error fetching Quiz: ", error);
    throw error;
  }
};

export const getQuizData = async (id) => {
  try {
    const response = await instance.get(`${URL}/data/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching Quiz: ", error);
    throw error;
  }
};

export const updateQuiz = async (id, data) => {
  try {
    const response = await instance.put(`${URL}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating Quiz: ", error);
    throw error;
  }
};
