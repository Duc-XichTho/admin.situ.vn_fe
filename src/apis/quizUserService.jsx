import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const PATH = "/api/quiz-user";
const URL = BASE_URL + PATH;

export const getAllQuizUser = async (user_id, quiz_id) => {
  try {
    const response = await instance.get(`${URL}/${user_id}/${quiz_id}`);
    return response.data[0];
  } catch (error) {
    console.error("Error fetching Quiz: ", error);
    throw error;
  }
};

export const getAllQuizUserByUserId = async (user_id) => {
  try {
    const response = await instance.get(`${URL}/${user_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching Quiz: ", error);
    throw error;
  }
};

export const getQuizUserByQuizId = async (quiz_id) => {
  try {
    const response = await instance.get(`${URL}/by-quiz/${quiz_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching Quiz: ", error);
    throw error;
  }
};

export const updateQuizUser = async (id, data) => {
  try {
    const response = await instance.put(`${URL}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating Quiz: ", error);
    throw error;
  }
};
