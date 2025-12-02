import instance from './../axiosInterceptors';

const BASE_URL = import.meta.env.VITE_FLASK_URL;
const BASE_URL2 = import.meta.env.VITE_FLASK_URL_2;

const SUB_URL = '/api/bot-chat';
const URL = BASE_URL + SUB_URL;
const BOT_CHAT_URL = '/api/bot-chat';
const DATA_ANALYSIS_URL = '/api/data-analysis';
const DIAGRAM_GENERATE_URL = '/api/diagram/generate';


export const generateAudio = async (text, system_message = null, model = null, voice = null, response_format = null, speed = null) => {

	try {
		const response = await instance.post(`${BASE_URL2}${DATA_ANALYSIS_URL}/generate-audio`, {
			text,
			system_message,
			model,
			voice,
			response_format,
			speed,
		});
		return response;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};

export const generateText = async (prompt, system_message = null, model = null) => {
    try {
        const response = await instance.post(`${BASE_URL2}${DATA_ANALYSIS_URL}/generate-text`, {prompt, system_message, model});
        return response.data;
    } catch (error) {
        console.error('Lỗi khi phân tích dữ liệu: ', error);
        throw error;
    }
};

export const webSearch = async (data) => {
	try {
		const response = await instance.post(`${BASE_URL2}/api/websearch/search`, data);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi tìm kiếm web: ', error);
		throw error;
	}
};

export const webSearchChat = async (data) => {
	try {
		const response = await instance.post(`${BASE_URL2}/api/websearch/search-with-history`, data);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi tìm kiếm web: ', error);
		throw error;
	}
};


export const getFeeds2 = async () => {
	try {
		const response = await instance.get(`${BASE_URL2}/api/inoreader/simple/feeds-with-content?limit=5&articleCount=3`);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};
export const getFeeds = async () => {
	try {
		const response = await instance.get(`${BASE_URL2}/api/feeds/latest`);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};
export const pullFeeds = async () => {
	try {
		const response = await instance.post(`${BASE_URL2}/api/feeds/pull`);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};

export const aiGen = async (prompt, system_message = null, model = null, type = 'text') => {
	// try {
	// 	const response = await instance.post(`${BASE_URL}${DATA_ANALYSIS_URL}/ai-gen`, {
	// 		prompt,
	// 		system_message,
	// 		model,
	// 		type
	// 	});
	// 	return response.data;
	// } catch (error) {
	// 	console.error('Lỗi khi phân tích dữ liệu: ', error);
	// 	throw error;
	// }

	try {
		const response = await instance.post(`${BASE_URL2}${DATA_ANALYSIS_URL}/ai-gen`, {
			prompt,
			system_message,
			model,
			type
		});
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};

export const aiGenImageDiagram = async (request, diagramType , model = null) => {
	try {
		const response = await instance.post(`${BASE_URL2}${DIAGRAM_GENERATE_URL}`, {
			request,
			diagramType,
			model,
		});
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};


export const aiGen2 = async (prompt, system_message = null, model = null, type = 'text') => {
	try {
		const response = await instance.post(`${BASE_URL2}${DATA_ANALYSIS_URL}/ai-gen`, {
			prompt,
			system_message,
			model,
			type
		});
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};

export const aiChat = async (chat_history, new_message = '', model, current_advisor = null) => {
	try {
		const response = await instance.post(`${BASE_URL2}${DATA_ANALYSIS_URL}/chat-with-history`, {
			chat_history,
			new_message,
			model,
			current_advisor,
		});
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};

// ANSWER QUESTION
export const answerQuestion = async (data) => {
	try {
		const response = await instance.post(`${URL}/question`, data);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi trả lời câu hỏi: ', error);
		throw error;
	}
};

export const answerSingleQuestion = async (data) => {
	try {
		const response = await instance.post(`${URL}/single-question`, data);
		console.log(response);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi trả lời câu hỏi: ', error);
		throw error;
	}
};

export const analyzeData = async (data, prompt, system_message, model = null) => {
	try {
		const response = await instance.post(`${BASE_URL}${DATA_ANALYSIS_URL}/analyze-data`, {
			data,
			prompt,
			system_message,
			model
		});
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};

export const analyzeData2 = async (data, prompt, system_message = null, model = null) => {
	try {
		const response = await instance.post(`${BASE_URL}${DATA_ANALYSIS_URL}/analyze-with-claude`, {
			data,
			prompt,
			system_message,
			model
		});
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};

export const analyzeDataFinal = async (data, prompt, system_message = null, model = null, desc) => {
	try {
		const response = await instance.post(`${BASE_URL}${DATA_ANALYSIS_URL}/analyze-final-data`, {
			data,
			prompt,
			system_message,
			model,
			desc
		});
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};

export const drawChart = async (data) => {
	try {
		const response = await instance.post(`${BASE_URL}${DATA_ANALYSIS_URL}/generate_charts`, data);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu: ', error);
		throw error;
	}
};

// ANALYZE DATA WITH CSV
export const analyzeDataWithCsv = async (data) => {
	try {
		const response = await instance.post(`${BASE_URL}${DATA_ANALYSIS_URL}/analyze_with_csv`, data);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi phân tích dữ liệu với CSV: ', error);
		throw error;
	}
};

export const answerSingleQuestionFile = async (data) => {
	try {
		const response = await instance.post(`${URL}/question-with-pdf`, data);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi trả lời câu hỏi: ', error);
		throw error;
	}
};

export const answerHuggingFile = async (data) => {
	try {
		return await instance.post(`${BASE_URL}/api/pdf/upload`, data, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			},
		);
	} catch (error) {
		console.error('Lỗi khi trả lời câu hỏi: ', error);
		throw error;
	}
};

export const uploadPdfFile = async (file) => {
	try {
		const formData = new FormData();
		formData.append('file', file);

		const response = await instance.post(`${BASE_URL}/api/pdf/upload`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data;
	} catch (error) {
		console.error('Error uploading PDF: ', error);
		throw error;
	}
};

export const startScheduledQuestion = async (data) => {
	try {
		const response = await instance.post(`${URL}/scheduled/start`, data);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi bắt đầu câu hỏi định kỳ: ', error);
		throw error;
	}
};

export const stopScheduledQuestion = async () => {
	try {
		const response = await instance.post(`${URL}/scheduled/stop`);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi dừng câu hỏi định kỳ: ', error);
		throw error;
	}
};

export const getScheduledStatus = async () => {
	try {
		const response = await instance.get(`${URL}/scheduled/status`);
		return response.data;
	} catch (error) {
		console.error('Lỗi khi lấy trạng thái câu hỏi định kỳ: ', error);
		throw error;
	}
};

export const sendQuestionToAI = async (data) => {
	try {
		const response = await instance.post(`${BASE_URL}/api/ai-chat/chat`, data);
		return response;
	} catch (error) {
		console.error('Lỗi khi gửi câu hỏi đến AI: ', error);
		throw error;
	}
};

// IMPROVE TEXT
export const improveText = async (originalText, selectedText, improvementPrompt, model) => {
	try {
		const response = await instance.post(`${BASE_URL}${DATA_ANALYSIS_URL}/improve-text`, {
			original_text: originalText,
			selected_text: selectedText,
			improvement_prompt: improvementPrompt,
			model
		});
		return response.data;
	} catch (error) {
		console.error('Lỗi khi cải thiện văn bản:', error);
		throw error;
	}
};
