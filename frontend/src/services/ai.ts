import api from './api';

export const aiService = {
  /**
   * Send natural language query to AI
   * @param {string} query - User's financial question
   * @returns {Promise} Response with answer and data
   */
  query: async (query: string) => {
    const response = await api.post('/ai/query', { query });
    return response.data.data;
  },

  /**
   * Get AI-powered category suggestion
   * @param {string} description - Transaction description
   * @param {number} amount - Transaction amount
   * @returns {Promise} Object with category, confidence, reason
   */
  checkCategory: async (description: string, amount: number) => {
    const response = await api.post('/ai/categorize', { description, amount });
    return response.data.data;
  },

  /**
   * Get personalized financial insights
   * @param {boolean} refresh - Force refresh cache
   * @returns {Promise} Array of insights
   */
  getInsights: async (refresh: boolean = false) => {
    const response = await api.get(`/ai/insights${refresh ? '?refresh=true' : ''}`);
    return response.data.data;
  },
};
