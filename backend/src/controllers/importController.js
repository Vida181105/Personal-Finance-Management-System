const Transaction = require('../models/Transaction');
const ResponseHandler = require('../utils/responseHandler');
const fs = require('fs');
const csv = require('csv-parser');

class ImportController {
  /**
   * Import Transactions from CSV
   * POST /api/import/csv
   * File: transactions.csv
   * Headers: date, amount, description, category, type, merchantName, paymentMode
   */
  static async importCSV(req, res, next) {
    try {
      if (!req.user) {
        return ResponseHandler.unauthorized(res, 'Authentication required');
      }

      if (!req.file) {
        return ResponseHandler.validationError(res, 'CSV file is required');
      }

      const userId = req.user._id.toString();
      const transactions = [];
      const errors = [];
      let rowNum = 0;

      // Parse CSV file
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          rowNum++;
          try {
            // Map CSV columns to transaction fields
            const transactionData = {
              date: row.date || new Date(),
              amount: parseFloat(row.amount),
              description: row.description || 'N/A',
              category: row.category || 'Uncategorized',
              type: row.type || 'Expense', // Income or Expense
              merchantName: row.merchantName || 'Other',
              paymentMode: row.paymentMode || 'Cash',
            };

            // Validate required fields
            if (!transactionData.amount || isNaN(transactionData.amount)) {
              throw new Error('Invalid amount');
            }

            if (transactionData.amount <= 0) {
              throw new Error('Amount must be positive');
            }

            if (!['Income', 'Expense'].includes(transactionData.type)) {
              throw new Error('Type must be Income or Expense');
            }

            // Validate date format
            const dateObj = new Date(transactionData.date);
            if (isNaN(dateObj.getTime())) {
              throw new Error('Invalid date format');
            }

            // Check for duplicates (same user, same date, same amount, same description)
            const existingTransaction = transactions.find(
              (t) =>
                t.userId === userId &&
                t.date.toDateString() === dateObj.toDateString() &&
                t.amount === transactionData.amount &&
                t.description === transactionData.description
            );

            if (existingTransaction) {
              throw new Error('Duplicate transaction detected');
            }

            // Add transaction with metadata
            transactions.push({
              transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              userId,
              date: dateObj,
              amount: transactionData.amount,
              description: transactionData.description,
              category: transactionData.category,
              type: transactionData.type,
              merchantName: transactionData.merchantName,
              paymentMode: transactionData.paymentMode,
            });
          } catch (error) {
            errors.push({
              row: rowNum,
              error: error.message,
              data: row,
            });
          }
        })
        .on('end', async () => {
          try {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);

            if (transactions.length === 0) {
              return ResponseHandler.validationError(res, `No valid transactions found. Errors: ${errors.length}`, errors);
            }

            // Batch insert transactions
            const inserted = await Transaction.insertMany(transactions, { ordered: false }).catch((insertError) => {
              // Continue with successful inserts even if some fail
              if (insertError.writeErrors) {
                return insertError.result.ops || [];
              }
              throw insertError;
            });

            return ResponseHandler.success(res, 201, 'CSV import completed', {
              imported: inserted.length || transactions.length,
              failed: errors.length,
              totalRows: rowNum,
              errors: errors.slice(0, 10), // Show first 10 errors
            });
          } catch (error) {
            // Clean up file on error
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
            next(error);
          }
        })
        .on('error', (error) => {
          // Clean up file on error
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          next(error);
        });
    } catch (error) {
      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }

  /**
   * Get Import Template (CSV headers)
   * GET /api/import/template
   */
  static async getTemplate(req, res, next) {
    try {
      const template = {
        headers: [
          'date (YYYY-MM-DD)',
          'amount (number)',
          'description (string)',
          'category (string)',
          'type (Income or Expense)',
          'merchantName (string)',
          'paymentMode (Cash, Credit Card, Debit Card, Bank Transfer, UPI)',
        ],
        example: {
          date: '2026-01-08',
          amount: '1500',
          description: 'Grocery shopping',
          category: 'Food',
          type: 'Expense',
          merchantName: 'BigMart',
          paymentMode: 'Credit Card',
        },
        sampleCSV: `date,amount,description,category,type,merchantName,paymentMode
2026-01-08,1500,Grocery shopping,Food,Expense,BigMart,Credit Card
2026-01-07,2000,Monthly salary,Income,Income,Employer,Bank Transfer
2026-01-06,500,Coffee,Food,Expense,CafeX,Cash`,
      };

      return ResponseHandler.success(res, 200, 'Template retrieved', template);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ImportController;
