import instance from './../axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/aiChatHistory';
const URL = BASE_URL + SUB_URL;

export const getAllAiChatHistory = async () => {
    try {
        const { data } = await instance.get(URL);
        return data.data;
    } catch (error) {
        console.error('Error fetching AI chat history:', error);
        throw error;
    }
};

export const getAiChatHistoryById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data.data;
    } catch (error) {
        console.error('Error fetching AI chat history by ID:', error);
        throw error;
    }
};

export const createAiChatHistory = async (chatData) => {
    try {
        const { data } = await instance.post(URL, chatData);
        return data;
    } catch (error) {
        console.error('Error creating AI chat history:', error);
        throw error;
    }
};

export const updateAiChatHistory = async (chatData) => {
    try {
        const { data } = await instance.put(URL, chatData);
        return data;
    } catch (error) {
        console.error('Error updating AI chat history:', error);
        throw error;
    }
};

export const deleteAiChatHistory = async (id) => {
    try {
        const { data } = await instance.delete(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error deleting AI chat history:', error);
        throw error;
    }
};

// Additional functions for chat-specific operations
export const getAiChatHistoryByUser = async (userCreated) => {
    try {
        const { data } = await instance.get(`${URL}?userCreated=${userCreated}`);
        return data.data;
    } catch (error) {
        console.error('Error fetching AI chat history by user:', error);
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
            createAt: new Date().toISOString()
        };
        const { data } = await instance.post(URL, chatData);
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
            chatHistory: updatedHistory
        };
        
        const { data } = await instance.put(URL, updatedChatData);
        return data;
    } catch (error) {
        console.error('Error adding message to chat:', error);
        throw error;
    }
};

export const getActiveChatSessions = async (userCreated) => {
    try {
        const { data } = await instance.get(`${URL}/user/${userCreated}`);
        return data.data;
    } catch (error) {
        console.error('Error fetching active chat sessions:', error);
        throw error;
    }
}; 