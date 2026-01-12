import api from './api';

export const categoryService = {
  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/categories');
    return response.data;
  },

  suggestCategory: async (merchant: string): Promise<{ category: string }> => {
    const response = await api.post('/categories/categorize', {
      merchantName: merchant,
      description: merchant,
    });
    return response.data;
  },

  categorizeTransaction: async (
    merchantName: string,
    description: string
  ): Promise<{ category: string; confidence: string }> => {
    const response = await api.post('/categories/categorize', {
      merchantName,
      description,
    });
    return response.data;
  },

  categorizeBulk: async (
    transactions: Array<{ merchantName: string; description: string }>
  ): Promise<Array<{ category: string; confidence: string }>> => {
    const response = await api.post('/categories/categorize-bulk', { transactions });
    return response.data;
  },

  getCategoryRules: async (categoryName: string): Promise<string[]> => {
    const response = await api.get(`/categories/${categoryName}/rules`);
    return response.data;
  },

  addCategoryRule: async (categoryName: string, pattern: string): Promise<void> => {
    await api.post(`/categories/${categoryName}/rules`, { pattern });
  },
};
