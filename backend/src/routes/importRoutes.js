const express = require('express');
const router = express.Router();
const multer = require('multer');
const ImportController = require('../controllers/importController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

// Multer configuration for CSV uploads
const upload = multer({
  dest: '/tmp',
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(csv|xlsx|xls)$/)) {
      return cb(new Error('Only CSV and Excel files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// All import routes require authentication
router.use(authMiddleware);

/**
 * POST /api/import/csv
 * Upload and import CSV file
 */
router.post('/csv', upload.single('file'), asyncHandler(ImportController.importCSV));

/**
 * GET /api/import/template
 * Get CSV import template
 */
router.get('/template', asyncHandler(ImportController.getTemplate));

module.exports = router;
