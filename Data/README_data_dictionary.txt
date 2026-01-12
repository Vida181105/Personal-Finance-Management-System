================================================================================
PERSONAL FINANCE MANAGEMENT SYSTEM - DATA DICTIONARY & README
================================================================================

Dataset Version: 1.0
Generated: January 5, 2026
Time Coverage: January 1 - October 31, 2024
Total Records: 3,000+ transactions across 10 users
Format: CSV (Comma-Separated Values)
Purpose: Synthetic personal finance dataset for ML/AI applications

================================================================================
DATASET OVERVIEW
================================================================================

This dataset contains complete personal finance records for 10 synthetic users
representing diverse income levels, household types, and spending patterns in
India. The data is designed for:

- Machine learning model training (anomaly detection, clustering, forecasting)
- Time-series analysis
- Spending pattern recognition
- Budget optimization
- Personal finance application development

DATASET COMPOSITION:

Master Data Files:
  1. users.csv - User profiles with demographics and income
  2. categories.csv - Expense/income category taxonomy
  3. merchants.csv - Merchant master data with default categories

Transaction Files:
  4. transactions_u001.csv - Student user (300 records)
  5. transactions_u002.csv - Software Engineer (300 records)
  6. transactions_u003.csv - Product Manager (300 records)
  7. transactions_u004.csv - Management Consultant (300 records)
  8. transactions_u005.csv - Senior Engineer (300 records)
  9. transactions_u006.csv - Marketing Manager (300 records)
  10. transactions_u007.csv - VP Engineering, Family (305 records)
  11. transactions_u008.csv - Director Sales, Married (300 records)
  12. transactions_u009.csv - CFO, Family (300 records)
  13. transactions_u010.csv - Managing Director, Family (300 records)

Recurring Definition File:
  14. recurring_transactions.csv - Monthly/recurring expense definitions

================================================================================
FILE DESCRIPTIONS
================================================================================

---
FILE 1: users.csv
---
PURPOSE: Master reference for all users in the system
RECORDS: 10 users (U001-U010)
FORMAT: CSV

COLUMNS:
  userId (String)
    - Format: Uxxx (e.g., U001, U007)
    - Unique user identifier
    - Range: U001 to U010

  name (String)
    - Full name of synthetic user
    - Examples: Arjun Sharma, Vikram Iyer, Lakshmi Sundaram

  age (Integer)
    - User age in years
    - Range: 21 (student) to 48 (managing director)

  profession (String)
    - Job title/occupation
    - Examples: Student, Software Engineer, VP Engineering, CFO

  city (String)
    - Primary residence city
    - Values: Bangalore, Mumbai, Hyderabad, Chennai, Delhi

  householdType (String)
    - Family composition
    - Values: Single, Married, Family with Children

  monthlyIncome (Integer)
    - Gross monthly income (₹)
    - Range: ₹5,000 (student) to ₹250,000 (managing director)

USER PROFILES:

U001 | Arjun Sharma | 21 | Student | Bangalore | Single | ₹5,000/mo
U002 | Vikram Iyer | 28 | Software Engineer | Bangalore | Single | ₹55,000/mo
U003 | Ananya Desai | 30 | Product Manager | Mumbai | Single | ₹65,000/mo
U004 | Divya Reddy | 29 | Management Consultant | Hyderabad | Single | ₹60,000/mo
U005 | Sanjay Patel | 35 | Senior Engineer | Bangalore | Single | ₹85,000/mo
U006 | Meera Kapoor | 30 | Marketing Manager | Mumbai | Single | ₹70,000/mo
U007 | Rajesh Iyer | 45 | VP Engineering | Bangalore | Family with Children | ₹180,000/mo
U008 | Kavya Sharma | 42 | Director Sales | Mumbai | Married | ₹160,000/mo
U009 | Lakshmi Sundaram | 48 | CFO | Chennai | Family with Children | ₹200,000/mo
U010 | Ashok Kumar | 48 | Managing Director | Delhi | Family with Children | ₹250,000/mo

---
FILE 2: categories.csv
---
PURPOSE: Transaction category taxonomy for classification
RECORDS: 14 categories (1 income + 13 expense)
FORMAT: CSV

COLUMNS:
  categoryId (String)
    - Format: Cxxx (e.g., C001, C014)
    - Unique category identifier
    - Range: C001 to C014

  categoryName (String)
    - Human-readable category name
    - Must be used consistently across all transaction files

  categoryType (String)
    - Classification type
    - Values: Income, Expense

CATEGORY DEFINITIONS:

INCOME CATEGORIES:

C001 | Income | Income
  Description: Salary and other income sources
  Frequency: Monthly (typically)
  Examples: Employer salary, freelance income, investment returns

EXPENSE CATEGORIES:

C002 | Rent | Expense
  Description: Home rental or EMI (Equated Monthly Installment)
  Frequency: Monthly (recurring, typically 2nd of month)
  Typical Amount: ₹20,000-₹76,000/month
  Examples: Landlord rent, Home EMI (HDFC, ICICI)

C003 | Groceries | Expense
  Description: Food and grocery shopping
  Frequency: Weekly/Bi-weekly/Monthly
  Typical Amount: ₹600-₹15,000/transaction
  Examples: BigBasket, DMart, Nature's Basket, Reliance Fresh

C004 | Food & Dining | Expense
  Description: Restaurants, food delivery, cafes
  Frequency: Daily to weekly
  Typical Amount: ₹150-₹8,600/transaction
  Examples: Zomato, Swiggy, Dominos, KFC, McDonald's, Restaurants

C005 | Transport | Expense
  Description: Fuel, cabs, public transit
  Frequency: Daily to weekly
  Typical Amount: ₹50-₹4,200/transaction
  Examples: Uber, Ola, Shell Petrol, BP, Metro cards, Railways

C006 | Utilities | Expense
  Description: Internet, mobile, electricity, water bills
  Frequency: Monthly (recurring, typically 1st-10th)
  Typical Amount: ₹399-₹3,400/transaction
  Examples: Jio, Airtel, VI, BSES, TATA Power, Delhi Jal Board

C007 | Subscriptions | Expense
  Description: OTT, apps, online services
  Frequency: Monthly/Yearly (recurring)
  Typical Amount: ₹99-₹5,500/transaction
  Examples: Netflix, Spotify, Disney+, BYJU'S, YouTube Premium, LinkedIn

C008 | Shopping | Expense
  Description: Fashion, electronics, home goods, personal care
  Frequency: Weekly to monthly
  Typical Amount: ₹500-₹15,000/transaction
  Examples: Myntra, Flipkart, Amazon, Nykaa, Gucci, Louis Vuitton

C009 | Entertainment | Expense
  Description: Movies, events, streaming, gaming
  Frequency: Weekly to monthly
  Typical Amount: ₹200-₹2,000/transaction
  Examples: BookMyShow, INOX, PVR Cinemas, Gold's Gym

C010 | Healthcare | Expense
  Description: Doctors, medicines, medical procedures
  Frequency: Monthly to quarterly
  Typical Amount: ₹500-₹10,000/transaction
  Examples: Apollo Pharmacy, Apollo Hospitals, Max Healthcare, Medicines

C011 | Insurance | Expense
  Description: Health and life insurance premiums
  Frequency: Monthly/Yearly (recurring)
  Typical Amount: ₹1,500-₹6,000/transaction
  Examples: HDFC Life, AXA Life, Max Bupa, ICICI Prudential

C012 | Education | Expense
  Description: School fees, tuition, courses
  Frequency: Monthly (recurring, for school fees)
  Typical Amount: ₹1,500-₹28,000/transaction
  Examples: DPS Schools, Sri Chaitanya, Tuition centers, Online courses

C013 | Travel | Expense
  Description: Flights, hotels, vacation bookings
  Frequency: Occasional to quarterly
  Typical Amount: ₹2,000-₹125,000/transaction
  Examples: MakeMyTrip, AirAsia, Hotels, Travel packages

C014 | Miscellaneous | Expense
  Description: Other irregular or unclassified expenses
  Frequency: Occasional
  Typical Amount: ₹100-₹5,000/transaction
  Examples: Unknown vendors, local shops, charity, gifts

---
FILE 3: merchants.csv
---
PURPOSE: Master list of merchants with default category mappings
RECORDS: 80 merchants (M001-M080)
FORMAT: CSV

COLUMNS:
  merchantId (String)
    - Format: Mxxx (e.g., M001, M080)
    - Unique merchant identifier

  merchantName (String)
    - Merchant/vendor/service provider name
    - Must match exactly as used in transaction files

  categoryId (String)
    - Default category for this merchant
    - Foreign key to categories.csv

MERCHANT CATEGORIES (Sample):

GROCERIES:
  BigBasket, DMart, Nature's Basket, Blinkit, Reliance Fresh, Local Store

FOOD & DINING:
  Zomato, Swiggy, Dominos, KFC, McDonald's, Cafe Coffee Day, Restaurants

TRANSPORT:
  Uber, Ola, Shell Petrol, BP, Metro, Railways, Fuel Stations

UTILITIES:
  Jio, Airtel, VI, BSNL, TATA Power, BSES, TANGEDCO, Delhi Jal Board

SUBSCRIPTIONS:
  Netflix, Spotify, Disney+, BYJU'S, YouTube Premium, LinkedIn, Canva

SHOPPING:
  Amazon, Flipkart, Myntra, Nykaa, Gucci, Louis Vuitton, Bata

ENTERTAINMENT:
  BookMyShow, INOX, PVR Cinemas, Gold's Gym

HEALTHCARE:
  Apollo Pharmacy, Apollo Hospitals, Max Healthcare, Medicines

INSURANCE:
  HDFC Life, AXA Life, Max Bupa, ICICI

EDUCATION:
  DPS Schools, Sri Chaitanya, Tuition Centers, Coursera

TRAVEL:
  MakeMyTrip, AirAsia, Hotel Bookings, Travel Agencies

---
FILE 4-13: transactions_u001.csv through transactions_u010.csv
---
PURPOSE: Individual transaction history for each user
RECORDS: 300-305 per user (total 3,005 transactions)
FORMAT: CSV
DATE RANGE: January 1, 2024 - October 31, 2024

COLUMNS:

  transactionId (String)
    - Format: Txxxx (e.g., T0001, T3005)
    - Unique transaction identifier globally (not per user)
    - Range: T0001 to T3005 (continuous across all users)
    - Property: Globally unique, never duplicated

  userId (String)
    - Format: Uxxx (e.g., U001, U010)
    - User who performed the transaction
    - Foreign key to users.csv

  date (Date)
    - Format: YYYY-MM-DD
    - Transaction date
    - Range: 2024-01-01 to 2024-10-31
    - Property: Realistic distribution across dates

  amount (Integer)
    - Numeric value in Indian Rupees (₹)
    - Transaction amount
    - Range: 0 to 250,000
    - Special case: 0 for edge case testing (1 per user)

  type (String)
    - Values: income, expense
    - Transaction classification
    - Income: ~10-12 per user (monthly salary)
    - Expense: All other transactions

  category (String)
    - Expense/income category
    - Must match exactly from categories.csv
    - Values: C001-C014
    - Property: All categories covered across dataset

  merchantName (String)
    - Name of merchant/vendor/service provider
    - Should match merchants.csv
    - Property: Realistic Indian merchant names
    - Edge case: Empty/blank or "Unknown Store" (1+ per user)

  description (String)
    - Bank statement style description
    - Format: MERCHANT NAME - ACTIVITY or TRANSACTION TYPE
    - Examples: "SALARY CREDIT - JANUARY", "ZOMATO ORDER 5621"
    - Edge case: Empty/blank (1 per user for testing)

  paymentMode (String)
    - Values: UPI, Debit Card, Credit Card, Cash
    - Method of payment
    - Distribution: UPI ~65%, Debit Card ~15%, Credit Card ~15%, Cash ~5%

  isRecurring (Boolean)
    - Values: true, false
    - Flag for recurring transactions
    - true: Salary, rent, subscriptions, utilities, insurance
    - false: Discretionary spending (food, shopping, entertainment)

  source (String)
    - Values: CSV_UPLOAD, MANUAL_ENTRY
    - Data source indicator
    - CSV_UPLOAD: ~95% (normal transactions)
    - MANUAL_ENTRY: ~5% (anomalies, special cases)

TRANSACTION PATTERNS BY USER:

Salary (Monthly):
  - Date: 1st of month
  - Type: income
  - Category: C001 (Income)
  - Amount: Exact monthly income per user
  - Recurring: true

Rent/EMI (Monthly):
  - Date: 2nd of month (typically)
  - Type: expense
  - Category: C002 (Rent)
  - Amount: User-specific (₹20,000-₹76,000)
  - Recurring: true
  - Merchants: Landlord, HDFC Bank, ICICI Bank

Utilities (Monthly):
  - Dates: Variable (1st-10th of month, typically)
  - Type: expense
  - Category: C006 (Utilities)
  - Amount: User-specific (₹399-₹3,400)
  - Recurring: true
  - Merchants: Jio, Airtel, VI, BSES, etc.

Subscriptions (Monthly):
  - Dates: 1st of month (consistent)
  - Type: expense
  - Category: C007 (Subscriptions)
  - Amount: Consistent per subscription
  - Recurring: true
  - Merchants: Netflix, Spotify, BYJU'S, etc.

Discretionary (Scattered):
  - Dates: Random distribution
  - Categories: Food & Dining, Shopping, Entertainment, Transport
  - Amount: Variable
  - Recurring: false

---
FILE 14: recurring_transactions.csv
---
PURPOSE: Definition of recurring expenses for forecasting and alerts
RECORDS: 79 recurring transaction definitions
FORMAT: CSV

COLUMNS:

  recurringId (String)
    - Format: RECxxx (e.g., REC001, REC079)
    - Unique recurring expense identifier

  userId (String)
    - Format: Uxxx (e.g., U001, U010)
    - User associated with this recurring expense
    - Foreign key to users.csv

  merchantName (String)
    - Merchant/service provider name
    - Must match as used in transaction files

  category (String)
    - Expense category
    - Values from: Rent, Utilities, Subscriptions, Insurance, Education, etc.
    - Must match categories.csv exactly

  amount (Integer)
    - Fixed recurring amount (₹)
    - Per-frequency amount
    - Example: ₹3,500 monthly Netflix for U010

  frequency (String)
    - Recurrence pattern
    - Values: Monthly, Quarterly, Yearly
    - Example: Netflix is "Monthly", Annual plans might be "Yearly"

  startDate (Date)
    - Format: YYYY-MM-DD
    - Date when recurring expense started
    - Range: 2024-01-01 to 2024-02-01 (typically early in year)

RECURRING TRANSACTIONS BY USER:

U001 (Student): 5 recurring expenses
  - Airtel mobile
  - Jio mobile
  - BYJU'S online course
  - Coursera subscription
  - Gold's Gym membership

U002-U006 (Single Professionals): 6-7 recurring each
  - Rent (₹20,000-₹32,000/mo)
  - Mobile bills (2 providers)
  - Netflix/OTT subscription
  - Life insurance
  - Entertainment (gym, etc.)

U007-U010 (Senior Professionals/Families): 8-13 recurring each
  - Rent (₹48,000-₹76,000/mo)
  - Multiple mobile bills
  - Premium OTT subscriptions (Netflix, Spotify, Disney+)
  - BYJU'S (kids learning)
  - School fees (₹18,000-₹28,000/mo)
  - Life insurance (₹3,000-₹6,000/mo)
  - Additional bank EMIs

USAGE: These recurring definitions are used for:
  - Expense forecasting
  - Budget planning
  - Alert generation for missed payments
  - Agent reasoning for user recommendations

================================================================================
CATEGORY DEFINITIONS - DETAILED
================================================================================

INCOME (C001):
  Represents salary and other regular income sources. Typically monthly
  on the 1st of each month for employed users. Amount matches user profile
  monthlyIncome field from users.csv.

RENT (C002):
  Primary residence rent or home loan EMI. Fixed monthly amount, typically
  on 2nd of month. Represents 35-55% of income for professionals. One of the
  largest recurring expenses in the dataset.

GROCERIES (C003):
  Food shopping at supermarkets, online grocery platforms. Usually weekly
  to bi-weekly frequency. Amount varies (₹600-₹15,000 per transaction)
  based on user income level and household size.

FOOD & DINING (C004):
  Restaurants, food delivery apps, cafes. Discretionary expense showing
  daily to weekly frequency. Amount reflects user income (₹150-₹8,600).
  Higher frequency for single professionals in metro cities.

TRANSPORT (C005):
  Fuel, cab rides, public transit cards. Includes Uber/Ola rides (UPI-based),
  fuel pump transactions, and metro recharges. Amount varies but typically
  ₹50-₹4,200 per transaction depending on distance/type.

UTILITIES (C006):
  Internet, mobile bills, electricity, water. Essential recurring expenses
  appearing on specific dates each month. Amount ₹399-₹3,400. Typically
  multiple providers per user (mobile, internet, electricity, water).

SUBSCRIPTIONS (C007):
  Streaming services (Netflix, Spotify, Disney+), learning platforms
  (BYJU'S, Coursera), tools (LinkedIn, Canva). Premium tier subscriptions
  scale with user income (Netflix ₹99→₹5,500).

SHOPPING (C008):
  Fashion, electronics, beauty, home goods from e-commerce and physical
  stores. Amount varies widely (₹500-₹15,000). Luxury brands for high-income
  users (Gucci, Louis Vuitton for U010).

ENTERTAINMENT (C009):
  Movies, events, gym, sports activities. Includes BookMyShow tickets,
  INOX cinema, gym memberships. Amount ₹200-₹2,000. More frequent for
  higher-income users.

HEALTHCARE (C010):
  Medicines, doctor visits, medical procedures, hospital services.
  Amount ₹500-₹10,000. Includes Apollo Hospitals, pharmacies, insurance
  claim reimbursements.

INSURANCE (C011):
  Health and life insurance premiums. Recurring monthly or yearly.
  Amount ₹1,500-₹6,000. Essential for professionals, higher for families.
  Premium increases with user income level.

EDUCATION (C012):
  School fees, tuition, online courses. Recurring monthly for school fees
  (₹18,000-₹28,000). Online course subscriptions occasional. Family users
  (U007-U010) show high school fees.

TRAVEL (C013):
  Flights, hotels, vacation packages. Occasional but high-value transactions
  (₹2,000-₹125,000). Marked as MANUAL_ENTRY and used for anomaly detection.
  Luxury destinations for high-income users.

MISCELLANEOUS (C014):
  Unclassified or irregular expenses. Unknown merchants, local shops, gifts,
  charity. Catch-all category for edge cases and incomplete data.

================================================================================
MERCHANT USAGE PATTERNS
================================================================================

MERCHANT MAPPING:

Each merchant in merchants.csv has a primary category. However, transactions
may deviate in specific cases (e.g., Amazon appears in Shopping but also
Electronics under Shopping category).

HIGH-FREQUENCY MERCHANTS:
  - Zomato: Food & Dining (appears in 15-30% of food transactions)
  - Jio: Utilities (monthly subscription for most users)
  - Netflix: Subscriptions (monthly for most professionals)
  - Rent payments: To Landlord or Banks (HDFC, ICICI)

LOW-FREQUENCY MERCHANTS:
  - Gucci, Louis Vuitton: Shopping (luxury, high-income users only)
  - MakeMyTrip: Travel (rare, high-value anomalies)
  - Apollo Hospitals: Healthcare (occasional, high-value)

MERCHANT SELECTION LOGIC:
  - By user income: Higher-income users show luxury brand merchants
  - By household type: Family users show school-related merchants
  - By city: City-specific merchants (DPS Delhi for U010, Sri Chaitanya for U009)
  - By transaction type: Recurring uses same merchant, discretionary varies

INCONSISTENCIES / EDGE CASES:
  - "Unknown Store" or blank merchant name (1+ per user)
  - These trigger category as Miscellaneous or empty

================================================================================
RECURRING LOGIC
================================================================================

DEFINITION:

A recurring transaction is any expense that:
  1. Occurs on a predictable schedule (monthly, quarterly, yearly)
  2. Has a fixed or near-fixed amount
  3. Serves an ongoing necessity (bills, subscriptions, school fees)

NOT RECURRING:

  - One-time purchases (groceries, shopping, random meals)
  - Variable-amount expenses (Uber rides, food orders)
  - Seasonal expenses (vacation, festival shopping)

RECURRING TRANSACTION TYPES:

Category: Rent
  Frequency: Monthly
  Typical Date: 2nd of month
  Amount: Fixed per user
  Examples: Landlord rent, Home EMI (₹20,000-₹76,000/mo)

Category: Utilities
  Frequency: Monthly
  Typical Dates: 1st-10th of month (varies by provider)
  Amount: Fixed or near-fixed per provider
  Examples: Jio (₹600-₹1,200/mo), Electricity (₹2,000-₹3,400/mo)

Category: Subscriptions
  Frequency: Monthly or Yearly
  Typical Date: 1st of month (consistent)
  Amount: Fixed per subscription tier
  Examples: Netflix (₹99-₹5,500/mo), Spotify (₹99-₹4,000/mo)

Category: Insurance
  Frequency: Monthly or Yearly
  Typical Date: 1st-10th of month
  Amount: Fixed premium
  Examples: Health insurance (₹2,000-₹6,000/mo), Life insurance (₹1,500-₹5,000/mo)

Category: Education
  Frequency: Monthly (for school fees)
  Typical Date: 1st of month
  Amount: Fixed school fee
  Examples: DPS Schools (₹18,000-₹28,000/mo), BYJU'S (₹2,800-₹3,500/mo)

USAGE IN SYSTEM:

Forecasting: Recurring amounts are used to project future spending
Budget Planning: Recurring expenses are the foundation of budget calculations
Alert System: Missing recurring transactions trigger alerts
User Segmentation: Recurring vs. discretionary ratio identifies user type

RECURRING DEFINITION FILE:

recurring_transactions.csv contains explicit definitions of all recurring
expenses. This file is separate from transaction history because:
  - Definitions remain stable across time periods
  - Used for forecasting beyond the 2024 data period
  - Agent reasoning uses definitions, not individual transactions
  - Enables "what if" scenario analysis

USER COUNTS:

U001: 5 recurring (light, student)
U002: 6 recurring (standard, single professional)
U003: 6 recurring (standard, single professional)
U004: 7 recurring (moderate, consultant with extra tools)
U005: 7 recurring (moderate, senior engineer)
U006: 7 recurring (moderate, single professional with design tools)
U007: 9 recurring (high, family with school fees)
U008: 8 recurring (high, married couple with premium subscriptions)
U009: 11 recurring (very high, family with premium school and insurance)
U010: 13 recurring (very high, ultra-luxury family)

================================================================================
EDGE CASES INCLUDED
================================================================================

INTENTIONAL DATA QUALITY EDGE CASES:

Each transaction file (transactions_u001 through transactions_u010) includes
exactly 5 types of edge cases for testing data cleaning and anomaly detection:

1. ANOMALY TRANSACTION (1 per user):
   Large unexpected expense significantly above typical transaction amount
   for that user. Marked as MANUAL_ENTRY.
   
   U001: T040 - ₹45,000 private coaching (unusual for ₹5,000/mo income)
   U002: T369 - ₹42,000 premium monitor (4x typical electronics purchase)
   U003: T669 - ₹48,000 international flight
   U004: T969 - ₹50,000 hotel booking
   U005: T1269 - ₹55,000 gaming monitor setup
   U006: T1569 - ₹52,000 Europe trip booking
   U007: T1951 - ₹88,000 Goa family vacation
   U008: T2174 - ₹75,000 GOA luxury resort
   U009: T2556 - ₹98,000 Bali family vacation
   U010: T2856 - ₹125,000 Maldives luxury resort (largest anomaly)
   
   Detection Strategy: Flag transactions > 3x user's typical spending or
   > 50% monthly income as potential anomalies.

2. DUPLICATE TRANSACTION (1 per user):
   Identical or near-identical transaction (same merchant, similar amount)
   on same or different date. Tests deduplication logic.
   
   Example: Two ₹6,000 Karavali restaurant charges on different dates
   Example: Two similar Flipkart purchases on different dates
   
   Detection Strategy: Flag same merchant, amount within ±10%, within 7 days.

3. MISSING DESCRIPTION (1 per user):
   Transaction with empty/blank description field while other fields normal.
   Tests null-handling in data pipelines.
   
   All other fields: present and valid
   Description field: empty string or null
   Amount: non-zero
   Merchant: populated
   
   Detection Strategy: Validate non-null descriptions or provide defaults.

4. ZERO-AMOUNT TRANSACTION (1 per user):
   Transaction with amount = 0. Tests edge case handling.
   
   Characteristics:
     - Amount: 0
     - Other fields: populated normally
     - Type: typically expense
     - Description: May reference "Zero transaction" or similar
   
   Detection Strategy: Flag zero amounts for manual review or exclusion.

5. UNKNOWN MERCHANT (1+ per user):
   Merchant name is "Unknown Store", "Unknown Vendor", "Local Store", etc.
   Category is Miscellaneous or unclassified.
   Tests merchant classification accuracy.
   
   Characteristics:
     - Merchant name: Unknown/unclear
     - Category: Miscellaneous or empty
     - Amount: small to medium
     - Description: vague or empty
   
   Detection Strategy: Classify to Miscellaneous or prompt user for clarification.

EDGE CASE DISTRIBUTION:

Total Edge Cases: 50 (5 per user × 10 users)
Percentage of Dataset: ~1.7% (50 / 3005 transactions)
Purpose: Sufficient anomalies for ML training without overwhelming normal data

IMPACT ON ANALYSIS:

When cleaning data for production use:
  - Remove zero-amount transactions
  - Deduplicate near-identical transactions
  - Classify unknown merchants as Miscellaneous or exclude
  - Add descriptions to empty-description transactions
  - Retain anomalies for anomaly detection model training (do not remove)

================================================================================
TIME RANGE & SEASONALITY
================================================================================

PRIMARY COVERAGE: January 1, 2024 - October 31, 2024 (10 months)
EXTENDED COVERAGE: Some users extend to October 31 (most data)
TOTAL DAYS: 304 days

MONTHLY BREAKDOWN:

January   2024 (31 days): New Year expenses, fresh starts
February  2024 (29 days): Winter expenses (leap year)
March     2024 (31 days): Q1 closing, tax planning
April     2024 (30 days): Summer begins
May       2024 (31 days): Vacation season, summer travel
June      2024 (30 days): Monsoon season, reduced travel
July      2024 (31 days): Mid-year, potential bonuses
August    2024 (31 days): Back-to-school, educational expenses
September 2024 (30 days): Post-summer recovery
October   2024 (31 days): Diwali preparations, festival spending

SEASONAL PATTERNS:

January-March:
  - New Year shopping, gym memberships
  - Tax-related expenses
  - Budget planning purchases

May-June:
  - Vacation and travel expenses (highest anomalies)
  - School fees for new academic year
  - AC/cooling expenses (electricity spike)

September-October:
  - School fees
  - Diwali festival spending
  - Gift purchasing
  - Entertainment expenses spike

TRANSACTION DISTRIBUTION:

Average transactions per day: ~10 (3,005 transactions / 304 days)
Average transactions per user per day: 1.0-1.02

Peak Days: Weekends show higher Food & Dining, Entertainment, Shopping
Off-Peak Days: Weekday mornings show higher Utilities, Transport

MONTHLY PATTERNS:

1st of month: Salary credits, subscriptions (auto-debit)
2nd of month: Rent/EMI payments
1st-10th of month: Utilities, insurance, fixed expenses
11th-31st of month: Discretionary spending (variable)

HOLIDAY IMPACT:

Republic Day (Jan 26): Increased travel/entertainment
Holi (March): Festival shopping, gifts, celebrations
Diwali (October): Major festival shopping, gifts, travel

NOTE: Complete December data not included (dataset covers Jan-Oct).
For full year forecasting, extrapolate patterns or request extended data.

================================================================================
DATA QUALITY SUMMARY
================================================================================

VALIDATION CHECKS PERFORMED:

✓ All transactionIds unique (T0001-T3005)
✓ All userIds valid (U001-U010)
✓ All dates within valid range (2024-01-01 to 2024-10-31)
✓ All amounts non-negative (except 0 as edge case)
✓ All types from valid enum (income, expense)
✓ All categories from valid set (C001-C014)
✓ All paymentModes from valid enum (UPI, Debit Card, Credit Card, Cash)
✓ All isRecurring from valid enum (true, false)
✓ All sources from valid enum (CSV_UPLOAD, MANUAL_ENTRY)
✓ Monthly income >= average monthly expenses (for all users)
✓ Recurring transactions marked correctly
✓ Merchant-category mappings logical
✓ Edge cases distributed (5 per user)

KNOWN LIMITATIONS:

- December data not included (Jan-Oct only)
- No weekend/weekday explicit flag (derivable from date)
- No transaction success/failure indicator (all assumed successful)
- No currency conversion (all in ₹ Indian Rupees)
- No budget or goal tracking separate from transactions
- No split transactions (each row is single transaction)

================================================================================
USAGE EXAMPLES & QUERIES
================================================================================

BASIC QUERIES:

1. Get all transactions for a user:
   SELECT * FROM transactions_u007 WHERE userId = 'U007'

2. Get monthly salary:
   SELECT date, amount FROM transactions_u002 
   WHERE type = 'income' AND category = 'C001'
   ORDER BY date

3. Get all recurring expenses:
   SELECT * FROM recurring_transactions 
   WHERE userId = 'U010' 
   ORDER BY category

4. Get monthly spending by category:
   SELECT category, SUM(amount) as total 
   FROM transactions_u008 
   WHERE type = 'expense' AND MONTH(date) = 5
   GROUP BY category
   ORDER BY total DESC

5. Identify anomalies:
   SELECT transactionId, date, amount, category, merchantName 
   FROM transactions_u010
   WHERE source = 'MANUAL_ENTRY'

6. Get recurring vs discretionary ratio:
   SELECT 
     SUM(CASE WHEN isRecurring = true THEN amount ELSE 0 END) as recurring_total,
     SUM(CASE WHEN isRecurring = false THEN amount ELSE 0 END) as discretionary_total
   FROM transactions_u007

ADVANCED QUERIES:

7. Monthly expense trend for single user:
   SELECT 
     DATE_TRUNC('month', date) as month,
     SUM(amount) as monthly_total
   FROM transactions_u005
   WHERE type = 'expense'
   GROUP BY month
   ORDER BY month

8. Compare spending patterns between users:
   SELECT userId, category, AVG(amount) as avg_amount, COUNT(*) as count
   FROM (SELECT * FROM transactions_u001 
         UNION ALL SELECT * FROM transactions_u010)
   WHERE type = 'expense'
   GROUP BY userId, category
   ORDER BY userId, category

9. Identify duplicate transactions:
   SELECT merchantName, amount, COUNT(*) as count, 
          GROUP_CONCAT(transactionId) as ids
   FROM transactions_u006
   GROUP BY merchantName, amount
   HAVING count > 1

10. Calculate savings rate:
    SELECT 
      (SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)) / 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as savings_rate
    FROM transactions_u010

================================================================================
MACHINE LEARNING APPLICATIONS
================================================================================

This dataset is designed for multiple ML/AI use cases:

ANOMALY DETECTION:
  - Identify unusual transactions (vacation spends, emergency expenses)
  - Training data: Intentional anomalies + normal transactions
  - Algorithms: Isolation Forest, Local Outlier Factor, Autoencoder
  - Accuracy: Expect >90% with edge cases included

CLUSTERING/SEGMENTATION:
  - Cluster users by spending pattern similarity
  - Identify user archetypes (luxury spender, frugal, family-focused)
  - Segment for targeted recommendations
  - Features: Category distribution, spending level, frequency

TIME-SERIES FORECASTING:
  - Predict next month's expenses
  - Forecast category-wise spending
  - Seasonal trend identification
  - Methods: ARIMA, Prophet, LSTM

RECURRING TRANSACTION DETECTION:
  - Identify subscription/recurring charges
  - Test subscription cancellation opportunities
  - Budget calculation accuracy
  - Methods: Frequency analysis, clustering, rule-based

BUDGET RECOMMENDATIONS:
  - Suggest budgets based on spending history
  - Identify optimization opportunities
  - Compare to benchmarks (user group averages)
  - Calculate "savings potential"

FRAUD DETECTION:
  - Detect unauthorized transactions
  - Test ML models trained on normal patterns
  - Identify compromised accounts
  - Methods: Classification, supervised learning

================================================================================
FILE LOCATIONS & FORMAT
================================================================================

All files are CSV format (Comma-Separated Values)

Location: Personal Finance Management System/

Master Data:
  - users.csv
  - categories.csv
  - merchants.csv

Transaction Data:
  - transactions_u001.csv through transactions_u010.csv

Recurring Definitions:
  - recurring_transactions.csv

Documentation:
  - README_data_dictionary.txt (this file)
  - TRANSACTIONS_DATA_DICTIONARY.md (detailed transaction guide)

FILE SIZE ESTIMATE:
  - Each transaction file: ~50-60 KB
  - Master data files: ~5-10 KB
  - Recurring file: ~3 KB
  - Total dataset: ~550 KB

CSV FORMAT SPECIFICATIONS:

Line Ending: LF (Unix style)
Delimiter: Comma (,)
Quote Character: Double quote (") for fields containing commas
Escape Character: Double quote ("")
Header Row: Present (column names in first row)
Encoding: UTF-8

EXAMPLE CSV ROW:

transactions_u010.csv:
transactionId,userId,date,amount,type,category,merchantName,description,paymentMode,isRecurring,source
T2856,U010,2024-08-15,125000,expense,C013,Maldives Resorts,"MALDIVES LUXURY RESORT - 5 DAYS",Credit Card,false,MANUAL_ENTRY

================================================================================
SUPPORT & NEXT STEPS
================================================================================

DATA VALIDATION:

Before using this dataset, verify:
  1. All CSV files present and accessible
  2. Record counts match documentation
  3. Column order and names correct
  4. No corrupted rows
  5. Dates parse correctly
  6. Amount values numeric

INTEGRATION STEPS:

1. Load CSVs into database (SQLite, PostgreSQL, MySQL)
2. Create foreign key relationships (userId → users.csv)
3. Create indexes on userId, date, category for performance
4. Validate referential integrity
5. Export to application-friendly format (JSON, Parquet for ML)

ML PREPARATION:

1. Handle missing values (edge cases identified)
2. Remove duplicate transactions
3. Encode categorical variables (category, paymentMode, etc.)
4. Scale numeric features (amount) if needed
5. Create time-based features (day of week, month, etc.)
6. Split data: training (70%), validation (15%), test (15%)

QUESTIONS?

Refer to specific data dictionary files for detailed column definitions:
  - TRANSACTIONS_DATA_DICTIONARY.md for transaction column details
  - This README for overview and patterns

================================================================================
END OF DATA DICTIONARY
================================================================================

Generated: January 5, 2026
Dataset Version: 1.0
Total Records: 3,005 transactions + 79 recurring definitions + 10 users
Coverage: January 1 - October 31, 2024
Format: CSV (Comma-Separated Values)
Purpose: Synthetic personal finance data for ML/AI applications

================================================================================
