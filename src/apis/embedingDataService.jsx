import instance from './axiosInterceptors';

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = '/api/embedingData';
const URL = BASE_URL + SUB_URL;

// CRUD operations
export const createEmbedingData = async (embedingData) => {
    try {
        const { data } = await instance.post(URL, embedingData);
        return data;
    } catch (error) {
        console.error('Error creating EmbedingData:', error);
        throw error;
    }
};

export const getAllEmbedingData = async () => {
    try {
        const { data } = await instance.get(URL);
        return data;
    } catch (error) {
        console.error('Error fetching all EmbedingData:', error);
        throw error;
    }
};

export const getEmbedingDataById = async (id) => {
    try {
        const { data } = await instance.get(`${URL}/${id}`);
        return data;
    } catch (error) {
        console.error('Error fetching EmbedingData by ID:', error);
        throw error;
    }
};

export const updateEmbedingData = async (embedingData) => {
    try {
        const { data } = await instance.put(URL, embedingData);
        return data;
    } catch (error) {
        console.error('Error updating EmbedingData:', error);
        throw error;
    }
};

export const deleteEmbedingData = async (ids) => {
    try {
        const { data } = await instance.delete(URL, { data: { ids } });
        return data;
    } catch (error) {
        console.error('Error deleting EmbedingData:', error);
        throw error;
    }
};

// Source-based operations
export const getEmbedingDataBySourceId = async (sourceId, table) => {
    try {
        const { data } = await instance.get(`${URL}/source/${sourceId}/${table}`);
        return data;
    } catch (error) {
        console.error('Error fetching EmbedingData by source ID:', error);
        throw error;
    }
};

export const deleteEmbedingDataBySourceId = async (sourceId, table) => {
    try {
        const { data } = await instance.delete(`${URL}/source/${sourceId}/${table}`);
        return data;
    } catch (error) {
        console.error('Error deleting EmbedingData by source ID:', error);
        throw error;
    }
};

// Table-based operations
export const getEmbedingDataByTable = async (table) => {
    try {
        const { data } = await instance.get(`${URL}/table/${table}`);
        return data.data;
    } catch (error) {
        console.error('Error fetching EmbedingData by table:', error);
        throw error;
    }
};

// Statistics
export const getEmbedingDataStats = async () => {
    try {
        const { data } = await instance.get(`${URL}/stats`);
        return data;
    } catch (error) {
        console.error('Error fetching EmbedingData stats:', error);
        throw error;
    }
};

// Search operations
export const searchEmbedingDataByVector = async (vector, limit = 10, threshold = 0.3) => {
    try {
        const { data } = await instance.post(`${URL}/search/vector`, {
            vector,
            limit,
            threshold
        });
        return data;
    } catch (error) {
        console.error('Error searching EmbedingData by vector:', error);
        throw error;
    }
};

export const searchEmbedingDataByText = async (text, limit = 10, threshold = 0.3) => {
    try {
        const { data } = await instance.post(`${URL}/search/text`, {
            text,
            limit,
            threshold
        });
        return data;
    } catch (error) {
        console.error('Error searching EmbedingData by text:', error);
        throw error;
    }
};

export const searchEmbedingDataByTextForTable = async (text, table, limit = 10, threshold = 0.3) => {
    try {
        const { data } = await instance.post(`${URL}/search/text/${table}`, {
            text,
            limit,
            threshold
        });
        return data;
    } catch (error) {
        console.error('Error searching EmbedingData by text for table:', error);
        throw error;
    }
};

// Convert text to vector
export const convertTextToVector = async (text) => {
    try {
        const { data } = await instance.post(`${URL}/convert-to-vector`, {
            text
        });
        return data;
    } catch (error) {
        console.error('Error converting text to vector:', error);
        throw error;
    }
};

// AI Generation with embedding search
export const aiGenWithEmbedding = async (question) => {

    
    try {
        const { data } = await instance.post(`${URL}/ai-gen`, {
            question
        });
    
        
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

// Helper function to validate embedding data
export const validateEmbeddingData = (embeddingData) => {
    const errors = [];
    
    if (!embeddingData.sourceId) {
        errors.push('sourceId is required');
    }
    
    if (!embeddingData.table) {
        errors.push('table is required');
    }
    
    if (!embeddingData.chunkText) {
        errors.push('chunkText is required');
    }
    
    // chunkVector can be null initially, will be filled later
    // type and chunkIndex have defaults
    
    if (errors.length > 0) {
        throw new Error(`Embedding data validation failed: ${errors.join(', ')}`);
    }
    
    return true;
};

// Create embedding for a specific source
export const createEmbeddingForSource = async (sourceId, table, content, type = 'text') => {
    try {
        // Validate required parameters
        if (!sourceId || !table || !content) {
            throw new Error('sourceId, table, và content là bắt buộc');
        }

        const embeddingData = {
            sourceId: sourceId,
            table: table,
            type: type,
            chunkText: content,
            chunkIndex: 0,
            chunkVector: null // Will be filled later by embedding process
        };

        // Validate embedding data
        validateEmbeddingData(embeddingData);

        const { data } = await instance.post(`${URL}/batch`, {
            embedingDataList: [embeddingData]
        });
        return data;
    } catch (error) {
        console.error('Error creating embedding for source:', error);
        throw error;
    }
};

// Create embeddings for all sources in a table
export const createEmbeddingsForTable = async (table, sourcesData) => {
    try {
        // Validate required parameters
        if (!table || !sourcesData || !Array.isArray(sourcesData)) {
            throw new Error('table và sourcesData (array) là bắt buộc');
        }

        const embeddingDataList = [];
        
        for (const source of sourcesData) {
            if (!source.id) {
                console.warn('Source missing id:', source);
                continue;
            }

            const content = `${source.title || ''} ${source.summary || ''} ${source.detail || ''}`.trim();
            if (content) {
                const embeddingData = {
                    sourceId: source.id,
                    table: table,
                    type: source.type || 'text',
                    chunkText: content,
                    chunkIndex: 0,
                    chunkVector: null // Will be filled later by embedding process
                };
                
                // Validate each embedding data
                try {
                    validateEmbeddingData(embeddingData);
                    embeddingDataList.push(embeddingData);
                } catch (error) {
                    console.warn('Skipping invalid embedding data:', error.message);
                }
            }
        }

        if (embeddingDataList.length > 0) {
            const { data } = await instance.post(`${URL}/batch`, {
                embedingDataList: embeddingDataList
            });
            return data;
        } else {
            throw new Error('No content to embed');
        }
    } catch (error) {
        console.error('Error creating embeddings for table:', error);
        throw error;
    }
};

// Batch operations
export const createEmbedingDataBatch = async (embedingDataList) => {
    try {
        const { data } = await instance.post(`${URL}/batch`, {
            embedingDataList
        });
        return data;
    } catch (error) {
        console.error('Error creating EmbedingData batch:', error);
        throw error;
    }
};

// Type-based operations
export const getEmbedingDataByType = async (type) => {
    try {
        const { data } = await instance.get(`${URL}/type/${type}`);
        return data;
    } catch (error) {
        console.error('Error fetching EmbedingData by type:', error);
        throw error;
    }
};

// Combined function: convert text to vector then search
export const searchEmbedingDataByTextToVector = async (text, limit = 10, threshold = 0.3) => {
    try {
        // Use the text search endpoint which handles conversion internally
        const response = await searchEmbedingDataByText(text, limit, threshold);
        return response;
    } catch (error) {
        console.error('Error in text-to-vector search for EmbedingData:', error);
        throw error;
    }
};

// Helper function to get embedding data for a specific source with details
export const getSourceWithEmbeddingData = async (sourceId, table, sourceModel) => {
    try {
        const [sourceResponse, embeddingResponse] = await Promise.all([
            instance.get(`${BASE_URL}/api/${table}/${sourceId}`),
            getEmbedingDataBySourceId(sourceId, table)
        ]);

        return {
            source: sourceResponse.data.data,
            embeddingData: embeddingResponse.data,
            hasEmbeddings: embeddingResponse.data.length > 0,
            embeddingCount: embeddingResponse.data.length
        };
    } catch (error) {
        console.error('Error fetching source with embedding data:', error);
        throw error;
    }
};

// Helper function to get embedding statistics for a specific source
export const getSourceEmbeddingStats = async (sourceId, table) => {
    try {
        const embeddingData = await getEmbedingDataBySourceId(sourceId, table);
        
        return {
            sourceId,
            table,
            totalChunks: embeddingData.data.length,
            hasEmbeddings: embeddingData.data.length > 0,
            chunkTypes: embeddingData.data.reduce((acc, chunk) => {
                acc[chunk.type] = (acc[chunk.type] || 0) + 1;
                return acc;
            }, {}),
            averageChunkLength: embeddingData.data.length > 0 
                ? embeddingData.data.reduce((sum, chunk) => sum + chunk.chunkText.length, 0) / embeddingData.data.length 
                : 0
        };
    } catch (error) {
        console.error('Error getting source embedding stats:', error);
        throw error;
    }
};

// K9-specific helper functions (for backward compatibility)
export const getK9WithEmbeddingData = async (k9Id) => {
    return await getSourceWithEmbeddingData(k9Id, 'k9', 'k9');
};

export const getK9EmbeddingStats = async (k9Id) => {
    return await getSourceEmbeddingStats(k9Id, 'k9');
}; 

// Create embedding for a specific source with AI processing
export const createEmbeddingWithAI = async (sourceId, content, table) => {
    try {
        // Validate required parameters
        if (!sourceId || !content || !table) {
            throw new Error('sourceId, content, và table là bắt buộc');
        }

        const { data } = await instance.post(`${URL}/create-with-ai`, {
            sourceId,
            content,
            table
        });

        return data;
    } catch (error) {
        console.error('Error creating embedding with AI:', error);
        throw error;
    }
}; 