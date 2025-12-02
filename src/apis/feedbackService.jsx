import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/feedback-k9';
const URL = BASE_URL + SUB_URL;

export const createFeedback = async (payload) => {
  try {
    const { data } = await instance.post(URL, payload);
    return data;
  } catch (error) {
    console.error('Error creating feedback:', error);
    throw error;
  }
};


export const getFeedback = async () => {
  try {
    const { data } = await instance.get(URL);
    return data;
  } catch (error) {
    console.error('Error getting feedback:', error);
    throw error;
  }
};
