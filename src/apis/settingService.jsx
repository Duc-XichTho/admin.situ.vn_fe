import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/setting';
const URL = BASE_URL + SUB_URL;

export const getSettingByType = async (type) => {
    try {
        const data = await instance.get(URL + '/' + type);
        return data.data;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        throw error;
    }
};

export const createSetting = async (newData) => {
    try {
        const response = await instance.post(URL, newData);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi tạo mới:', error);
        throw error;
    }
};

export const updateSetting = async (updatedData) => {
    try {
        const response = await instance.put(URL, updatedData);
        return response.data;
    } catch (error) {
        console.error('Lỗi khi cập nhật:', error);
        throw error;
    }
};

export const createOrUpdateSetting = async (settingData) => {
    try {
        // Kiểm tra xem setting đã tồn tại chưa
        try {
            const existingSetting = await getSettingByType(settingData.type);
            if (existingSetting) {                
                // Nếu đã tồn tại, cập nhật
                return await updateSetting({
                    ...settingData,
                    id: existingSetting.id
                });
            }
        } catch (error) {
            // Nếu không tìm thấy, tiếp tục tạo mới
        }
        
        // Tạo mới nếu chưa tồn tại
        return await createSetting(settingData);
    } catch (error) {
        console.error('Lỗi khi tạo hoặc cập nhật setting:', error);
        throw error;
    }
};
