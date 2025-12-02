import axios from 'axios';

const instance = axios.create({
  withCredentials: true,
});

instance.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
);

instance.interceptors.response.use(
  response => response,
  error => {
    if (!error.response || error.response.status === 401) {
      console.error('Lỗi phản hồi từ server:', error);
    }
    return Promise.reject(error);
  }
);

export default instance;