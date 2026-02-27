const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { errorHandler } = require('./src/middleware/errorHandler');
const swaggerDefinition = require('./src/config/swagger');

// Load environment variables
dotenv.config();

const app = express();

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
if (mongoURI) {
  mongoose
    .connect(mongoURI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 60000,
    })
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const options = {
  definition: swaggerDefinition,
  apis: ['./src/docs/api.docs.js'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Finance Pro API Documentation',
}));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/transactions', require('./src/routes/transactionRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/import', require('./src/routes/importRoutes'));
app.use('/api/ai', require('./src/routes/aiRoutes'));
app.use('/api/ml', require('./src/routes/mlRoutes'));
app.use('/api/budget', require('./src/routes/budgetRoutes'));
// Import additional routes here as needed
// app.use('/api/users', require('./src/routes/userRoutes'));
// app.use('/api/recurring', require('./src/routes/recurringRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Swagger documentation endpoint info
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Personal Finance Management System API',
    version: '1.0.0',
    documentation: 'http://localhost:8888/api-docs',
    health: 'http://localhost:8888/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND'
  });
});

// Global error handler (MUST be last middleware)
app.use(errorHandler);

module.exports = app;
