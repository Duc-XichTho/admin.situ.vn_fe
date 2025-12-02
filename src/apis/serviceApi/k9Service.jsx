import instance from '../axiosInterceptors.jsx';

const BASE_URL = import.meta.env.VITE_JS_SERVER_URL2;
const SUB_URL = '/api/external';
const URL = BASE_URL + SUB_URL;
const API_KEY = import.meta.env.VITE_EXTERNAL_API_KEY;

const apiKeyHeader = {
	headers: {
		'x-api-key': API_KEY,
	},
};

// ==================== K9Service API ENDPOINTS ====================

// GET /api/external/k9 - Lấy tất cả K9Service records
export const getK9Data = async () => {
	try {
		const { data } = await instance.get(URL + '/k9', apiKeyHeader);
		return data.data?.sort((a, b) => b.id - a.id);
	} catch (error) {
		console.error('Lỗi khi lấy K9Service:', error);
		throw error;
	}
};

// GET /api/external/k9/:id - Lấy K9Service record theo ID
export const getK9Id = async (id) => {
	try {
		const { data } = await instance.get(`${URL}/k9/${id}`, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy K9Service by ID:', error);
		throw error;
	}
};

// GET /api/external/k9/type/:type - Lấy K9Service records theo type
export const getK9ByType = async (type) => {
	try {
		const { data } = await instance.get(`${URL}/k9/type/${type}`, apiKeyHeader);
		return data.data?.sort((a, b) => b.id - a.id);
	} catch (error) {
		console.error('Lỗi khi lấy K9Service by Type:', error);
		throw error;
	}
};

// ==================== AI SUMMARY API ENDPOINTS ====================

// GET /api/external/ai-summary - Lấy tất cả AI Summary records
export const getAISummaries = async () => {
	try {
		const { data } = await instance.get(URL + '/ai-summary', apiKeyHeader);
		return data.data?.sort((a, b) => b.id - a.id);
	} catch (error) {
		console.error('Lỗi khi lấy AI Summaries:', error);
		throw error;
	}
};

export const createAISummary = async (data) => {
	try {
		const  res  = await instance.post(URL + '/ai-summary', data, apiKeyHeader);
		return res.data.data;
	} catch (error) {
		console.error('Lỗi khi lấy AI Summaries:', error);
		throw error;
	}
};

// GET /api/external/ai-summary/:id - Lấy AI Summary record theo ID
export const getAISummaryById = async (id) => {
	try {
		const { data } = await instance.get(`${URL}/ai-summary/${id}`, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy AI Summary by ID:', error);
		throw error;
	}
};


// ==================== Setting API ENDPOINTS ====================
export const getSettingByTypeExternal = async (type) => {
	try {
		const { data } = await instance.get(URL + '/setting/' + type, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy thông tin:', error);
		throw error;
	}
};

export const createSettingByTypeExternal = async (newData) => {
	try {
		const { data } = await instance.post(URL + '/setting', newData, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi tạo mới:', error);
		throw error;
	}
};

export const updateSettingByTypeExternal = async (updatedData) => {
	try {
		const { data } = await instance.put(URL + '/setting', updatedData, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi cập nhật:', error);
		throw error;
	}
};

export const createOrUpdateSettingByTypeExternal = async (settingData) => {
	try {
		// Kiểm tra xem setting đã tồn tại chưa
		try {
			const existingSetting = await getSettingByTypeExternal(settingData.type);
			if (existingSetting) {
				// Nếu đã tồn tại, cập nhật
				return await updateSettingByTypeExternal({
					...settingData,
					id: existingSetting.id,
				});
			}
		} catch (error) {
			// Nếu không tìm thấy, tiếp tục tạo mới
		}

		// Tạo mới nếu chưa tồn tại
		return await createSettingByTypeExternal(settingData);
	} catch (error) {
		console.error('Lỗi khi tạo hoặc cập nhật setting:', error);
		throw error;
	}
};

// =================== CompanyReport API ENDPOINTS ====================
export const getAllCompanyReportsExternal = async (signal) => {
	try {
		const { data } = await instance.get(URL + '/company-report/', apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy thông tin:', error);
		throw error;
	}
};

// =================== CompanyInfo API ENDPOINTS ====================
export const getAllCompanyInfosExternal = async (signal) => {
	try {
		const { data } = await instance.get(URL + '/company-info/', apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy thông tin:', error);
		throw error;
	}
};

// =================== FinRatio API ENDPOINTS ====================

export const getAllFinRatioNganhangsByMaCKExternal = async (maCK) => {
	try {
		const { data } = await instance.get(URL + '/fin-ratio-nganhang/maCK/' + maCK, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy danh sách fin_ratio:', error);
		throw error;
	}
};

export const getAllFinRatioNganhangsByMaCK2External = async (maCK) => {
	try {
		const { data } = await instance.get(URL + '/fin-ratio-nganhang/maCK2/' + maCK, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy danh sách fin_ratio:', error);
		throw error;
	}
};

export const getAllFinRatioChungkhoansByMaCKExternal = async (maCK) => {
	try {
		const { data } = await instance.get(URL + '/fin-ratio-chungkhoan/maCK/' + maCK, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy danh sách fin_ratio:', error);
		throw error;
	}
};

export const getAllFinRatioChungkhoansByMaCK2External = async (maCK) => {
	try {
		const { data } = await instance.get(URL + '/fin-ratio-chungkhoan/maCK2/' + maCK, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy danh sách fin_ratio:', error);
		throw error;
	}
};

export const getAllFinRatioBaohiemsByMaCKExternal = async (maCK) => {
	try {
		const { data } = await instance.get(URL + '/fin-ratio-baohiem/maCK/' + maCK, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy danh sách fin_ratio:', error);
		throw error;
	}
};

export const getAllFinRatioBaohiemsByMaCK2External = async (maCK) => {
	try {
		const { data } = await instance.get(URL + '/fin-ratio-baohiem/maCK2/' + maCK, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy danh sách fin_ratio:', error);
		throw error;
	}
};


export const getAllFinRatioPhitaichinhByMaCKExternal = async (maCK) => {
	try {
		const { data } = await instance.get(URL + '/fin-ratio-phitaichinh/maCK/' + maCK, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy danh sách fin_ratio:', error);
		throw error;
	}
};

export const getAllFinRatioPhitaichinhByMaCK2External = async (maCK) => {
	try {
		const { data } = await instance.get(URL + '/fin-ratio-phitaichinh/maCK2/' + maCK, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Lỗi khi lấy danh sách fin_ratio:', error);
		throw error;
	}
};

// =================== AI Chat History API ENDPOINTS ====================
export const getAiChatHistoryById = async (id) => {
	try {
		const { data } = await instance.get(`${URL}/aiChatHistory/${id}`, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Error fetching AI chat history by ID:', error);
		throw error;
	}
};

export const createNewChatSession = async (userCreated, advisorType, title, model) => {
	try {
		const chatData = {
			userCreated,
			advisorType,
			title,
			model,
			chatHistory: [],
			show: true,
			createAt: new Date().toISOString(),
		};
		const { data } = await instance.post(URL + '/aiChatHistory', chatData, apiKeyHeader);
		return data;
	} catch (error) {
		console.error('Error creating new chat session:', error);
		throw error;
	}
};

export const addMessageToChat = async (chatId, newMessage) => {
	try {
		// First get current chat history
		const currentChat = await getAiChatHistoryById(chatId);

		// Add new message to history
		const updatedHistory = [...currentChat.chatHistory, newMessage];

		// Update chat with new history
		const updatedChatData = {
			...currentChat,
			chatHistory: updatedHistory,
		};

		const { data } = await instance.put(URL + '/aiChatHistory', updatedChatData, apiKeyHeader);
		return data;
	} catch (error) {
		console.error('Error adding message to chat:', error);
		throw error;
	}
};

export const getActiveChatSessions = async (userCreated) => {
	try {
		const { data } = await instance.get(`${URL}/aiChatHistory/user/${userCreated}`, apiKeyHeader);
		return data.data;
	} catch (error) {
		console.error('Error fetching active chat sessions:', error);
		throw error;
	}
};


export const updateAiChatHistory = async (chatData) => {
	try {
		const { data } = await instance.put(URL + '/aiChatHistory', chatData, apiKeyHeader);
		return data;
	} catch (error) {
		console.error('Error updating AI chat history:', error);
		throw error;
	}
};

export const deleteAiChatHistory = async (id) => {
	try {
		const { data } = await instance.delete(`${URL}/aiChatHistory/${id}`, apiKeyHeader);
		return data;
	} catch (error) {
		console.error('Error deleting AI chat history:', error);
		throw error;
	}
};

// =================== Embeding Data API ENDPOINTS ====================

export const getEmbedingDataBySourceId = async (sourceId, table) => {
	try {
		const { data } = await instance.get(`${URL}/embeding-data/source/${sourceId}/${table}`, apiKeyHeader);
		return data;
	} catch (error) {
		console.error('Error fetching EmbedingData by source ID:', error);
		throw error;
	}
};

export const aiGenWithEmbedding = async (question) => {


	try {
		const { data } = await instance.post(`${URL}/embeding-data/ai-gen`, {
			question,
		}, apiKeyHeader);


		return data;
	} catch (error) {
		console.error('Error in AI generation with embedding:', error);

		// Enhanced error handling
		if (error.response) {
			console.error('Server error:', error.response.data);
			throw new Error(`Server error: ${error.response.data.message || 'Unknown server error'}`);
		} else if (error.request) {
			console.error('Network error:', error.request);
			throw new Error('Network error: Không thể kết nối đến server');
		} else {
			console.error('Request error:', error.message);
			throw new Error(`Request error: ${error.message}`);
		}
	}
};

export const searchEmbedingDataByTextForTable = async (text, table, limit = 10, threshold = 0.3) => {
	try {
		const { data } = await instance.post(`${URL}/embeding-data/search/text/${table}`, {
			text,
			limit,
			threshold,
		}, apiKeyHeader);
		return data;
	} catch (error) {
		console.error('Error searching EmbedingData by text for table:', error);
		throw error;
	}
};

// =================== Thesis API ENDPOINTS ====================
export const createThesis = async (thesisData) => {
	try {
		const response = await instance.post(URL + '/thesis', thesisData, apiKeyHeader);
		return response.data;
	} catch (error) {
		console.error('Error creating thesis:', error);
		throw error;
	}
};

// Lấy tất cả thesis
export const getAllThesis = async () => {
	try {
		const response = await instance.get(URL + '/thesis', apiKeyHeader);
		// Return array directly or from data property
		return Array.isArray(response.data) ? response.data : (response.data?.data || []);
	} catch (error) {
		console.error('Error fetching all thesis:', error);
		throw error;
	}
};

// Cập nhật thesis
export const updateThesis = async (id, thesisData) => {
	try {
		const response = await instance.put(`${URL}/thesis/${id}`, thesisData, apiKeyHeader);
		return response.data;
	} catch (error) {
		console.error('Error updating thesis:', error);
		throw error;
	}
};
// Delete thesis
export const deleteThesis = async (id) => {
	try {
		const response = await instance.delete(`${URL}/thesis/${id}`, apiKeyHeader);
		return response.data;
	} catch (error) {
		console.error('Error updating thesis:', error);
		throw error;
	}
};

