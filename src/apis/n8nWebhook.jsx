import instance from "./axiosInterceptors";

const BASE_URL = import.meta.env.VITE_API_URL;
const SUB_URL = "/api/n8n-webhook";
const URL = BASE_URL + SUB_URL;

export const n8nWebhook = async (data) => {
  try {
    const result = await instance.post(URL + "/send-to-n8n", data);
    return result.data.n8nResponse;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin:", error);
    throw error;
  }
};

export const n8nWebhookV2 = async (url, fileName) => {
  try {
    const result = await instance.post(URL + "/send-to-n8n-v2", { url });
    return result.data;
    console.log(result.data);
  } catch (error) {
    console.error("Error calling n8nWebhookV2:", error);
    throw error;
  }
};

export const sendFacebookWebhook = async ({ url, access_token, page_id }) => {
  try {
    const result = await instance.post(URL + "/send-to-n8n-v3", {
      url,
      access_token,
      page_id,
    });
    return result.data.data; // raw messages array
  } catch (error) {
    console.error("Lỗi khi gọi sendFacebookWebhook:", error);
    throw error;
  }
};

export const sendToN8nFacebookPostsScraper = async (payload) => {
  try {
    const result = await instance.post(URL + '/send-to-n8n-facebook-posts-scraper', payload);
    return result.data;
  } catch (error) {
    console.error('Lỗi khi gọi sendToN8nFacebookPostsScraper:', error);
    throw error;
  }
};

export const sendToN8nCrawlerGooglePlaces = async (locationQuery, maxCrawledPlacesPerSearch, searchStringsArray) => {
  try {
    const result = await instance.post(URL + '/send-to-n8n-crawler-google-places', {
      locationQuery,
      maxCrawledPlacesPerSearch,
      searchStringsArray,
    });
    return result.data;
  } catch (error) {
    console.error('Lỗi khi gọi sendToN8nCrawlerGooglePlaces:', error);
    throw error;
  }
};

export const sendToN8nSocialMediaSentimentAnalysisTool = async (params) => {
  try {
    const result = await instance.post(URL + '/send-to-n8n-social-media-sentiment-analysis-tool', params);
    return result.data;
  } catch (error) {
    console.error('Lỗi khi gọi sendToN8nSocialMediaSentimentAnalysisTool:', error);
    throw error;
  }
};

export const sendToN8nGoogleTrendsFastScraper = async (params) => {
  try {
    const result = await instance.post(URL + '/send-to-n8n-google-trends-fast-scraper', params);
    return result.data;
  } catch (error) {
    console.error('Lỗi khi gọi sendToN8nGoogleTrendsFastScraper:', error);
    throw error;
  }
};

export const sendToN8nParseExcel = async (sheetNamesJson, googleDriveUrl) => {
  try {
    const payload = googleDriveUrl ? { ...sheetNamesJson, googleDriveUrl } : sheetNamesJson;
    const result = await instance.post(URL +'/send-to-n8n-parse-excel', payload);
    return result.data.n8nResponse;
  } catch (error) {
    console.error('Error calling sendToN8nParseExcel:', error);
    throw error;
  }
};

