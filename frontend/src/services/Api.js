import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";

export const askQuestion = async (query) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ask`, { query });
    return response.data;
  } catch (error) {
    console.error("Error asking question:", error);
    throw error;
  }
};

export const checkArbitrage = async (crypto) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/arbitrage?crypto=${crypto}`);
    return response.data;
  } catch (error) {
    console.error("Error checking arbitrage:", error);
    throw error;
  }
};

export const executeMockTrade = async (tradeData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/mock-trade`, tradeData);
    return response.data;
  } catch (error) {
    console.error("Error executing trade:", error);
    throw error;
  }
};

export const getTradeFeedback = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/get_trade_feedback`);
    return response.data;
  } catch (error) {
    console.error("Error fetching feedback:", error);
    throw error;
  }
};