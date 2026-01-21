# Personal Finance Management System - Database Schema

## Overview
This document provides complete information about the MongoDB database schema used in the Personal Finance Management System.

---

## Table of Contents
1. [User Collection](#user-collection)
2. [Transaction Collection](#transaction-collection)
3. [Category Collection](#category-collection)
4. [Merchant Collection](#merchant-collection)
5. [RecurringTransaction Collection](#recurring-transaction-collection)
6. [Relationships](#relationships)
7. [Enums Summary](#enums-summary)

---

## User Collection

**Primary Key:** `userId` (String, Unique, Indexed)

**Description:** Stores user account information and profile data.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| userId | String | Required, Unique, Indexed | Primary identifier (e.g., "U001") |
| name | String | Required | User's full name |
| email | String | Required, Unique, Lowercase, Indexed | Login credential |
| password | String | Required, MinLength: 6, Select: false | Hashed with bcrypt (10 salt rounds), hidden by default |
| phone | String | Optional | Contact number |
| profession | String | Optional | User's occupation |
| monthlyIncome | Number | Required, Min: 0 | User's monthly earnings |
| city | String | Optional | User's location |
| age | Number | Min: 18, Max: 120 | Age validation |
| isActive | Boolean | Default: true | Account status |
| lastLogin | Date | Optional | Last login timestamp |
| accountCreatedDate | Date | Default: Date.now | Account creation date |
| createdAt | Date | Auto-generated | Mongoose timestamp |
| updatedAt | Date | Auto-generated | Mongoose timestamp |

**Methods:**
- `comparePassword(candidatePassword)` - Verify user password using bcrypt comparison
- `toJSON()` - Returns user object without password field

**Pre-save Hook:** 
- Automatically hashes password using bcrypt before saving if password is new or modified

**Example Document:**
```json
{
  "_id": "ObjectId",
  "userId": "usr_001",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$...",
  "phone": "9876543210",
  "profession": "Software Engineer",
  "monthlyIncome": 75000,
  "city": "Bangalore",
  "age": 28,
  "isActive": true,
  "lastLogin": "2026-01-20T10:30:00Z",
  "accountCreatedDate": "2025-01-15T08:00:00Z",
  "createdAt": "2025-01-15T08:00:00Z",
  "updatedAt": "2026-01-20T10:30:00Z"
}
```

---

## Transaction Collection

**Primary Key:** `transactionId` (String, Unique, Indexed)

**Foreign Keys:** `userId` → User.userId

**Description:** Records individual financial transactions (income or expenses).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| transactionId | String | Required, Unique, Indexed | Primary identifier (e.g., "TXN0001000") |
| userId | String | Required, Indexed | Links to User collection (e.g., "U001") |
| date | Date | Required, Indexed | Transaction date |
| amount | Number | Required, Min: 0 | Transaction amount |
| type | String | Enum: ['Income', 'Expense'], Required, Indexed | Transaction type |
| category | String | Required, Indexed | Transaction category (category name, not ID) |
| merchantName | String | Optional | Merchant/vendor name |
| description | String | Optional | Transaction details/notes |
| paymentMode | String | Enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Net Banking', 'UPI'] | Payment method |
| isRecurring | Boolean | Default: false | Flag for recurring transactions |
| source | String | Optional | Data source (e.g., 'Salary', 'Utilities', 'Dining') |
| createdAt | Date | Auto-generated | Mongoose timestamp |
| updatedAt | Date | Auto-generated | Mongoose timestamp |

**Indexes:**
- `transactionId` (unique)
- `userId` (for user-specific queries)
- `date` (for temporal queries)
- `type` (for transaction type filtering)
- `category` (for category analysis)
- **Compound:** `{ userId: 1, date: -1 }` - Date-based user queries
- **Compound:** `{ userId: 1, type: 1, date: -1 }` - Type & date filtering
- **Compound:** `{ userId: 1, category: 1 }` - Category analysis

**Example Document:**
```json
{
  "_id": "ObjectId",
  "transactionId": "txn_001",
  "userId": "usr_001",
  "date": "2026-01-20T14:30:00Z",
  "amount": 2500,
  "type": "Expense",
  "category": "Groceries",
  "merchantName": "Big Bazaar",
  "description": "Weekly grocery shopping",
  "paymentMode": "Debit Card",
  "isRecurring": false,
  "source": "manual",
  "createdAt": "2026-01-20T14:32:00Z",
  "updatedAt": "2026-01-20T14:32:00Z"
}
```

---

## Category Collection

**Primary Key:** `categoryId` (String, Unique, Indexed)

**Description:** Defines expense and income categories with optional budget limits.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| categoryId | String | Required, Unique, Indexed | Primary identifier (e.g., "C001") |
| categoryName | String | Required | Category name |
| categoryType | String | Enum: ['Income', 'Expense'], Required | Category type (lowercase in data: 'income', 'expense') |
| description | String | Optional | Category description |
| budgetLimit | Number | Min: 0 | Budget limit for category (optional) |
| createdAt | Date | Auto-generated | Mongoose timestamp |
| updatedAt | Date | Auto-generated | Mongoose timestamp |

**Example Document:**
```json
{
  "_id": "ObjectId",
  "categoryId": "cat_001",
  "categoryName": "Groceries",
  "categoryType": "Expense",
  "description": "Food and grocery purchases",
  "budgetLimit": 10000,
  "createdAt": "2025-01-10T00:00:00Z",
  "updatedAt": "2025-01-10T00:00:00Z"
}
```

---

## Merchant Collection

**Primary Key:** `merchantId` (String, Unique, Indexed)

**Description:** Stores merchant/vendor information for transaction tracking.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| merchantId | String | Required, Unique, Indexed | Primary identifier (e.g., "M001") |
| merchantName | String | Required, Indexed | Merchant name |
| defaultCategory | String | Optional | Default category ID (references categoryId, e.g., "C003") |
| category | String | Optional | Business category (not used in current data) |
| merchantType | String | Enum: ['Online', 'Offline'] | Business type (optional field) |
| city | String | Optional | Merchant location (optional field) |
| website | String | Optional | Merchant website URL (optional field) |
| createdAt | Date | Auto-generated | Mongoose timestamp |
| updatedAt | Date | Auto-generated | Mongoose timestamp |

**Example Document:**
```json
{
  "_id": "ObjectId",
  "merchantId": "mrch_001",
  "merchantName": "Amazon",
  "category": "E-commerce",
  "merchantType": "Online",
  "city": null,
  "website": "www.amazon.in",
  "createdAt": "2025-01-10T00:00:00Z",
  "updatedAt": "2025-01-10T00:00:00Z"
}
```

---

## RecurringTransaction Collection

**Primary Key:** `recurringId` (String, Unique, Indexed)

**Foreign Keys:** `userId` → User.userId

**Description:** Stores recurring/subscription transaction templates.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|(e.g., "REC001") |
| userId | String | Required, Indexed | Links to User collection (e.g., "U001") |
| category | String | Required | Transaction category |
| merchantName | String | Required | Merchant name |
| description | String | Optional | Transaction details |
| amount | Number | Required, Min: 0 | Recurring transaction amount |
| frequency | String | Enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'], Required | Recurrence pattern |
| type | String | Enum: ['Income', 'Expense'] | Transaction type (optional in schema, inferred from category) |
| paymentMode | String | Enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI'] | Payment method (optional field)
| paymentMode | String | Enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI'] | Payment method |
| startDate | Date | Required | Start date of recurrence |
| endDate | Date | Optional | End date of recurrence (null = infinite) |
| isActive | Boolean | Default: true | Active status |
| createdAt | Date | Auto-generated | Mongoose timestamp |
| updatedAt | Date | Auto-generated | Mongoose timestamp |

**Indexes:**
- `recurringId` (unique)
- `userId` (for user-specific queries)
- `category` (for category filtering)
- **Compound:** `{ userId: 1, isActive: 1 }` - Active recurring transactions query
- **Compound:** `{ userId: 1, category: 1 }` - Category filtering

**Example Document:**
```json
{
  "_id": "ObjectId",
  "recurringId": "rec_001",
  "userId": "usr_001",
  "category": "Subscriptions",
  "merchantName": "Netflix",
  "description": "Netflix Premium Subscription",
  "amount": 499,
  "frequency": "Monthly",
  "type": "Expense",
  "paymentMode": "Credit Card",
  "startDate": "2025-01-15T00:00:00Z",
  "endDate": null,
  "isActive": true,
  "createdAt": "2025-01-15T08:00:00Z",
  "updatedAt": "2026-01-20T10:30:00Z"
}
```

---

## Relationships

### Entity Relationship Diagram
```
┌─────────┐         1        ∞  ┌──────────────┐
│  User   ├──────────────────────┤ Transaction  │
│         │                      │              │
└─────────┘                      └──────────────┘
    │1
    │
    │∞
    │
    └──────────────────────────────────────┐
                                           │
                          ┌────────────────────────────────┐
                          │ RecurringTransaction           │
                          │ (Linked via userId)            │
                          └────────────────────────────────┘

┌─────────┐                ┌──────────────┐
│Category │◇──(referenced──│ Transaction  │
│         │ by name)       │              │
└─────────┘                └──────────────┘
    │                           ▲
    │                           │
    │(referenced by name)       │
    └───────────────────────────┘

┌─────────┐                ┌──────────────┐
│Merchant │◇──(referenced──│ Transaction  │
│         │ by name)       │              │
└─────────┘                └──────────────┘
    │                           ▲
    │                           │
    │(referenced by name)       │
    └───────────────────────────┘

┌─────────┐                ┌──────────────────────┐
│Category │◇──(referenced──│ RecurringTransaction │
│         │ by name)       │                      │
└─────────┘                └──────────────────────┘
    │                           ▲
    │                           │
    │(referenced by name)       │
    └───────────────────────────┘

┌─────────┐                ┌──────────────────────┐
│Merchant │◇──(referenced──│ RecurringTransaction │
│         │ by name)       │                      │
└─────────┘                └──────────────────────┘
```

### Relationship Details

| Relationship | Type | Foreign Key | Notes |
|--------------|------|-------------|-------|
| User → Transaction | One-to-Many | `Transaction.userId` | A user has many transactions |
| User → RecurringTransaction | One-to-Many | `RecurringTransaction.userId` | A user has many recurring transactions |
| Category → Transaction | One-to-Many | `Transaction.category` (string reference) | Referenced by name, no hard foreign key constraint |
| Category → RecurringTransaction | One-to-Many | `RecurringTransaction.category` (string reference) | Referenced by name, no hard foreign key constraint |
| Merchant → Transaction | One-to-Many | `Transaction.merchantName` (string reference) | Referenced by name, no hard foreign key constraint |
| Merchant → RecurringTransaction | One-to-Many | `RecurringTransaction.merchantName` (string reference) | Referenced by name, no hard foreign key constraint |

---

## Enums Summary

### Transaction Type
- `Income` - Money received
- `Expense` - Money spent

### Payment Modes
- `Cash` - Physical cash payment
- `Credit Card` - Credit card transaction
- `Debit Card` - Debit card transaction
- `Bank Transfer` - Direct bank transfer
- `Net Banking` - Online banking transfer
- `UPI` - Unified Payments Interface (India)

### Frequency (Recurring Transactions)
- `Daily` - Every day
- `Weekly` - Every week
- `Monthly` - Every month
- `Quarterly` - Every 3 months
- `Yearly` - Every year

### Merchant Type
- `Online` - Digital/E-commerce merchant
- `Offline` - Physical store merchant

### Category Type
- `Income` - Income category
- `Expense` - Expense category

---

## Indexing Strategy

### Single Field Indexes
| Collection | Field | Purpose |
|------------|-------|---------|
| User | userId | Primary key lookup |
| User | email | Authentication |
| Transaction | transactionId | Primary key lookup |
| Transaction | userId | User-specific queries |
| Transaction | date | Temporal filtering |
| Transaction | type | Transaction type filtering |
| Transaction | category | Category analysis |
| Category | categoryId | Primary key lookup |
| Merchant | merchantId | Primary key lookup |
| Merchant | merchantName | Merchant lookup |
| RecurringTransaction | recurringId | Primary key lookup |
| RecurringTransaction | userId | User-specific queries |
| RecurringTransaction | category | Category filtering |

### Compound Indexes
| Collection | Index | Purpose |
|------------|-------|---------|
| Transaction | `{ userId: 1, date: -1 }` | Retrieve user transactions sorted by date |
| Transaction | `{ userId: 1, type: 1, date: -1 }` | Filter by transaction type and date |
| Transaction | `{ userId: 1, category: 1 }` | Category-based analysis |
| RecurringTransaction | `{ userId: 1, isActive: 1 }` | Active recurring transactions for user |
| RecurringTransaction | `{ userId: 1, category: 1 }` | Category-based recurring filtering |

---

## Data Constraints & Validation

### User Collection
- `monthlyIncome` must be >= 0
- `age` must be between 18 and 120
- `password` minimum length: 6 characters
- `email` must be unique and lowercase
- `userId` must be unique

### Transaction Collection
- `amount` must be >= 0
- `type` must be one of: 'Income', 'Expense'
- `transactionId` must be unique
- `userId` must reference existing User
- `date` is required

### Category Collection
- `categoryType` must be one of: 'Income', 'Expense'
- `budgetLimit` must be >= 0 (if provided)
- `categoryId` must be unique

### RecurringTransaction Collection
- `amount` must be >= 0
- `type` must be one of: 'Income', 'Expense'
- `frequency` must be one of: 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'
- `recurringId` must be unique
- `userId` must reference existing User
- `startDate` is required
- `endDate` optional (null means indefinite)

---

## Timestamps

All collections include automatic Mongoose timestamps:
- `createdAt` - Document creation timestamp
- `updatedAt` - Document last modification timestamp

---

## Data Model Notes

1. **String-based IDs:** Custom string IDs are used instead of MongoDB ObjectIds for better readability and API responses.

2. **Reference Strategy:** Categories and Merchants are referenced by name strings rather than using MongoDB foreign keys. This allows flexibility but requires application-level consistency checks.

3. **Password Security:** User passwords are hashed using bcryptjs with 10 salt rounds before storage. Never stored or transmitted in plain text.

4. **Recurring Transactions:** Used to track subscription and regular income/expense patterns for budgeting and forecasting.

5. **Soft Deletes:** The `isActive` flag on User and RecurringTransaction collections can be used for soft deletion without removing historical data.

6. **Query Optimization:** Compound indexes are created for the most common query patterns to ensure optimal performance.

---

## Example Queries

### Get all transactions for a user in the last 30 days, sorted by date
```javascript
db.transactions.find({
  userId: "usr_001",
  date: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
}).sort({ date: -1 })
```

### Get total expenses by category for a user
```javascript
db.transactions.aggregate([
  { $match: { userId: "usr_001", type: "Expense" } },
  { $group: { _id: "$category", total: { $sum: "$amount" } } }
])
```

### Get active recurring transactions for a user
```javascript
db.recurringtransactions.find({
  userId: "usr_001",
  isActive: true
})
```

### Get user profile without password
```javascript
db.users.findOne({ userId: "usr_001" }, { password: 0 })
```

---

## Verification & Data Mapping

### Discrepancies Found & Corrected

1. **User Collection:**
   - ✅ Schema matches model definition
   - ✅ Sample data format: `U001` (matches model)
   - ⚠️ **Note:** CSV data has extra fields like `ageGroup` and `householdType` that are NOT in the MongoDB model schema
   
2. **Transaction Collection:**
   - ✅ Schema matches model definition
   - ✅ All enum values verified in data: `Income`, `Expense`, `Cash`, `Credit Card`, etc.
   - ✅ Sample data: `TXN0001000` format verified
   - ⚠️ **Note:** `source` field in data contains category names (e.g., "Salary", "Utilities") rather than import source

3. **Category Collection:**
   - ⚠️ **MISMATCH:** CSV header uses `type` but model expects `categoryType`
   - ⚠️ **MISMATCH:** CSV data uses lowercase values: `income`, `expense` (CSV) vs capitalized enum: `Income`, `Expense` (model)
   - Data format verified: `C001`, `C002`, etc.

4. **Merchant Collection:**
   - ⚠️ **MISMATCH:** CSV has `defaultCategory` field (not in model schema)
   - ⚠️ **MISMATCH:** CSV only has `merchantId`, `merchantName`, `defaultCategory` - missing fields like `category`, `merchantType`, `city`, `website`
   - Model expects `category` (required) but CSV data doesn't provide it

5. **RecurringTransaction Collection:**
   - ✅ Most fields match
   - ⚠️ **MISMATCH:** `type` field NOT present in CSV data - would need to be inferred from category
   - ✅ Sample data format: `REC001` verified
   - ✅ `frequency` values verified in data: `Monthly` matches model

### CSV vs Model Field Mapping

| CSV Table | Model Schema | Status | Notes |
|-----------|--------------|--------|-------|
| users.csv | User | ⚠️ Extra fields in CSV | `ageGroup`, `householdType` not in model |
| transactions.csv | Transaction | ✅ Compatible | All fields map correctly |
| categories.csv | Category | ❌ Issues | `type` → `categoryType` (case mismatch) |
| merchants.csv | Merchant | ❌ Incomplete | Missing required model fields |
| recurring_transactions.csv | RecurringTransaction | ⚠️ Missing field | `type` field not in CSV |

### Enum Values Verification

| Enum | CSV Data | Model Expected | Status |
|------|----------|-----------------|--------|
| Transaction Type | `Income`, `Expense` | `Income`, `Expense` | ✅ Match |
| Payment Mode | `Cash`, `Net Banking`, `Credit Card` | `Cash`, `Credit Card`, `Debit Card`, `Bank Transfer`, `Net Banking`, `UPI` | ✅ Subset OK |
| Frequency | `Monthly` | `Daily`, `Weekly`, `Monthly`, `Quarterly`, `Yearly` | ✅ Valid |
| Category Type | `income`, `expense` (lowercase) | `Income`, `Expense` | ❌ Case mismatch |

### Recommendations

1. **Update CSV data** to use capitalized enum values for `categoryType`: `Income`, `Expense`
2. **Add missing fields** to merchants.csv or update Merchant model to match CSV structure
3. **Add `type` field** to recurring_transactions.csv or derive it from category
4. **Data import scripts** should handle case conversion and field mapping to align CSV with model schema
5. **Validation** should be added in import scripts to enforce model constraints

---

*Schema Verification Date: January 20, 2026*
*Status: VERIFIED with noted discrepancies*
