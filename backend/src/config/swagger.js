/**
 * Swagger Configuration for Personal Finance Management System API
 * OpenAPI 3.0 Specification
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Personal Finance Management System API',
    version: '1.0.0',
    description: 'Comprehensive RESTful API for managing personal finances with transaction tracking, categorization, and analytics.',
    contact: {
      name: 'Finance Pro Team',
      email: 'support@financepro.local',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:8888/api',
      description: 'Development Server',
    },
    {
      url: 'https://api.financepro.com/api',
      description: 'Production Server (coming soon)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for API authentication',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '695bec395d8148b83b56ff40' },
          userId: { type: 'string', example: 'U001' },
          email: { type: 'string', example: 'arjun.sharma@example.com' },
          name: { type: 'string', example: 'Arjun Sharma' },
          age: { type: 'number', example: 21 },
          ageGroup: { type: 'string', example: 'Student' },
          profession: { type: 'string', example: 'B.Tech Student' },
          city: { type: 'string', example: 'Bangalore' },
          householdType: { type: 'string', example: 'Student' },
          monthlyIncome: { type: 'number', example: 5000 },
          isActive: { type: 'boolean', example: true },
          accountCreatedDate: { type: 'string', format: 'date-time' },
          lastLogin: { type: 'string', format: 'date-time' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6963947cd0ba03f47b1f554e' },
          transactionId: { type: 'string', example: 'TXN-1234567890-abc123def' },
          userId: { type: 'string', example: 'U001' },
          date: { type: 'string', format: 'date-time' },
          amount: { type: 'number', example: 250.50 },
          type: { type: 'string', enum: ['Income', 'Expense'], example: 'Expense' },
          category: { type: 'string', example: 'Food & Dining' },
          merchantName: { type: 'string', example: 'KFC' },
          description: { type: 'string', example: 'KFC - Meal' },
          paymentMode: { type: 'string', example: 'UPI' },
          isRecurring: { type: 'boolean', example: false },
          source: { type: 'string', example: 'MANUAL' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Food & Dining' },
          type: { type: 'string', enum: ['Income', 'Expense'], example: 'Expense' },
          keywords: { type: 'array', items: { type: 'string' }, example: ['food', 'restaurant', 'cafe'] },
          color: { type: 'string', example: '#FF6B6B' },
          icon: { type: 'string', example: 'utensils' },
        },
      },
      AuthToken: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresIn: { type: 'string', example: '7d' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object' },
          meta: { type: 'object' },
          code: { type: 'string' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              pages: { type: 'number' },
              summary: { type: 'object' },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

module.exports = swaggerDefinition;
