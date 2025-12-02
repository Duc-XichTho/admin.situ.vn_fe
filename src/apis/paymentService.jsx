import instance from "./axiosInterceptors.jsx";

const BASE_URL = import.meta.env.VITE_API_URL_PAYMENT;
const INTERNAL_API_SECRET = import.meta.env.VITE_API_SECRET_PAYMENT;

export const createPaymentLink = async (paymentData) => {
  try {
    const response = await instance.post(
      `${BASE_URL}/payment/create-payment-link`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${INTERNAL_API_SECRET}`,
          // Hoặc có thể dùng: 'X-API-Key': INTERNAL_API_SECRET
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
};

/**
 * Lấy thông tin payment link theo orderCode
 * @param {number} orderCode - Mã đơn hàng
 * @returns {Promise<Object>} - Thông tin payment
 */
export const getPaymentLinkInfo = async (orderCode) => {
  try {
    const response = await instance.get(
      `${BASE_URL}/payment/payment-link-info/${orderCode}`,
      {
        headers: {
          'Authorization': `Bearer ${INTERNAL_API_SECRET}`,
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting payment link info:', error);
    throw error;
  }
};

/**
 * Hủy payment link
 * @param {number} orderCode - Mã đơn hàng
 * @param {string} reason - Lý do hủy
 * @returns {Promise<Object>} - Response
 */
export const cancelPaymentLink = async (orderCode, reason = "Cancelled by user") => {
  try {
    const response = await instance.post(
      `${BASE_URL}/payment/cancel-payment-link/${orderCode}`,
      {
        cancellationReason: reason
      },
      {
        headers: {
          'Authorization': `Bearer ${INTERNAL_API_SECRET}`,
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error cancelling payment link:', error);
    throw error;
  }
};

