/**
 * Transaction Auto-Categorization Rules
 * Keyword-based categorization for automatic classification
 */

const categorizationRules = {
  // Food & Dining
  Food: [
    /restaurant|cafe|pizza|burger|sushi|bakery|grocery|supermarket|market|food|diner|bistro|pub|bar|wine|beer|alcohol|coca|pepsi|mcdonald|kfc|subway|starbucks|dunkin|chipotle|taco|ramen|noodle|curry|biryani/i,
  ],

  // Transportation
  Transportation: [
    /uber|lyft|taxi|car rental|fuel|petrol|diesel|gas station|parking|toll|metro|bus|train|ticket|airplane|flight|transit|bike|motorcycle|scooter|vehicle/i,
  ],

  // Entertainment
  Entertainment: [
    /movie|cinema|theater|concert|music|spotify|netflix|hulu|disney|gaming|game|steam|playstation|xbox|sports|gym|fitness|yoga|entertainment|show|ticket|event|festival/i,
  ],

  // Shopping & Retail
  Shopping: [
    /amazon|walmart|target|mall|store|shop|retail|clothing|apparel|shoes|fashion|dress|shirt|pants|jacket|brand|nike|adidas|puma|zara|h&m|forever21|costco|ikea/i,
  ],

  // Utilities & Bills
  Utilities: [
    /electricity|water|gas|internet|phone|mobile|broadband|wifi|utility|bill|payment|subscription|netflix|spotify|amazon prime|apple|microsoft|adobe/i,
  ],

  // Healthcare & Medical
  Healthcare: [
    /hospital|pharmacy|doctor|clinic|medical|health|medicine|drug|nurse|dental|dentist|vision|optometrist|physical therapy|therapy|mental health|psychiatrist|covid|vaccine/i,
  ],

  // Education
  Education: [
    /school|university|college|course|tuition|book|textbook|library|education|learning|training|certification|degree|diploma/i,
  ],

  // Travel & Accommodation
  Travel: [
    /hotel|motel|airbnb|resort|hostel|travel|accommodation|lodging|vacation|holiday|trip|resort|booking|expedia|kayak|marriott|hilton/i,
  ],

  // Office & Work
  Office: [
    /office|supplies|stationery|printer|paper|pen|desk|computer|laptop|monitor|keyboard|mouse|software|license|business|work|corporate/i,
  ],

  // Home & Garden
  Home: [
    /home improvement|hardware|home depot|lowes|garden|lawn|furniture|decoration|home decor|paint|tools|fix-it|home goods|pottery barn|wayfair|ikea/i,
  ],

  // Personal Care
  PersonalCare: [
    /salon|barber|haircut|spa|massage|cosmetics|beauty|makeup|skincare|perfume|gym|fitness|shampoo|toothpaste|deodorant|sunscreen|grooming|personal care/i,
  ],

  // Insurance
  Insurance: [
    /insurance|policy|premium|claim|coverage|auto insurance|health insurance|life insurance|home insurance|travel insurance/i,
  ],

  // Investments & Finance
  Investments: [
    /investment|stock|crypto|bitcoin|ethereum|mutual fund|etf|trading|broker|portfolio|dividend|interest|bank|credit union|savings|account|transfer/i,
  ],

  // Donations & Charity
  Donations: [
    /charity|donation|donate|nonprofit|ngos|religious|church|temple|mosque|synagogue|foundation|cause|fundraiser|aid|relief/i,
  ],

  // Pets
  Pets: [
    /pet|dog|cat|veterinary|vet|animal|pet store|pet supplies|pet food|pet care|grooming|veterinarian/i,
  ],

  // Memberships & Subscriptions
  Subscriptions: [
    /subscription|membership|gym membership|club|annual fee|recurring|premium|subscription service|patreon|vip|membership fee/i,
  ],
};

/**
 * Categorize transaction based on merchant name and description
 * @param {string} merchantName - Name of the merchant
 * @param {string} description - Transaction description
 * @returns {string} - Categorized category name or "Uncategorized"
 */
function categorizeTransaction(merchantName = '', description = '') {
  const text = `${merchantName} ${description}`.toLowerCase();

  for (const [category, patterns] of Object.entries(categorizationRules)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return category;
      }
    }
  }

  return 'Uncategorized';
}

/**
 * Get all available categories
 * @returns {Array} - Array of category names
 */
function getAvailableCategories() {
  return Object.keys(categorizationRules).sort();
}

/**
 * Add custom rule to a category
 * @param {string} category - Category name
 * @param {string|RegExp} pattern - Pattern to match
 * @returns {boolean} - Success status
 */
function addCustomRule(category, pattern) {
  if (!categorizationRules[category]) {
    categorizationRules[category] = [];
  }

  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
  categorizationRules[category].push(regex);
  return true;
}

/**
 * Get rules for a specific category
 * @param {string} category - Category name
 * @returns {Array} - Array of regex patterns
 */
function getRulesForCategory(category) {
  return categorizationRules[category] || [];
}

module.exports = {
  categorizeTransaction,
  getAvailableCategories,
  addCustomRule,
  getRulesForCategory,
  categorizationRules,
};
