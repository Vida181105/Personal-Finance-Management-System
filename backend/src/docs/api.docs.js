/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - monthlyIncome
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: arjun.sharma@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: Password@123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *               name:
 *                 type: string
 *                 example: Arjun Sharma
 *               monthlyIncome:
 *                 type: number
 *                 example: 5000
 *               phone:
 *                 type: string
 *                 example: "+91-9876543210"
 *               profession:
 *                 type: string
 *                 example: B.Tech Student
 *               city:
 *                 type: string
 *                 example: Bangalore
 *               age:
 *                 type: number
 *                 example: 21
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthToken'
 *       400:
 *         description: Validation error or email already exists
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password, returns JWT tokens
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: arjun.sharma@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthToken'
 *       400:
 *         description: Invalid email or password
 */

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               profession:
 *                 type: string
 *               city:
 *                 type: string
 *               age:
 *                 type: number
 *               monthlyIncome:
 *                 type: number
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens generated
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */

/**
 * @swagger
 * /transactions/{userId}:
 *   get:
 *     summary: Get transactions for user
 *     description: Retrieve paginated transactions with filtering and sorting
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: U001
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 20
 *           maximum: 100
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           example: Food & Dining
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [Income, Expense]
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *           example: groceries
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           default: date
 *       - name: order
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Transactions retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /transactions/{userId}/{transactionId}:
 *   get:
 *     summary: Get single transaction
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /transactions/{userId}:
 *   post:
 *     summary: Create new transaction
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - description
 *               - category
 *               - type
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 250.50
 *               description:
 *                 type: string
 *                 example: Lunch at KFC
 *               category:
 *                 type: string
 *                 example: Food & Dining
 *               type:
 *                 type: string
 *                 enum: [Income, Expense]
 *               merchantName:
 *                 type: string
 *                 example: KFC
 *               date:
 *                 type: string
 *                 format: date
 *               paymentMode:
 *                 type: string
 *                 example: UPI
 *     responses:
 *       201:
 *         description: Transaction created
 */

/**
 * @swagger
 * /transactions/{userId}/{transactionId}:
 *   put:
 *     summary: Update transaction
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Income, Expense]
 *     responses:
 *       200:
 *         description: Transaction updated
 */

/**
 * @swagger
 * /transactions/{userId}/{transactionId}:
 *   delete:
 *     summary: Delete transaction
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted
 */

/**
 * @swagger
 * /transactions/{userId}/stats:
 *   get:
 *     summary: Get transaction statistics
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Statistics retrieved
 */

/**
 * @swagger
 * /transactions/{userId}/bulk:
 *   post:
 *     summary: Bulk create transactions
 *     description: Create multiple transactions at once (useful for imports)
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Transactions created
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: Categories retrieved
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create new category
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Income, Expense]
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Category created
 */

/**
 * @swagger
 * /import:
 *   post:
 *     summary: Import transactions from CSV
 *     tags:
 *       - Import
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               format:
 *                 type: string
 *                 enum: [generic, icici, hdfc, axis]
 *     responses:
 *       200:
 *         description: Transactions imported successfully
 */

/**
 * @swagger
 * /analytics/{userId}/summary:
 *   get:
 *     summary: Get financial summary
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary retrieved
 */

/**
 * @swagger
 * /analytics/{userId}/monthly:
 *   get:
 *     summary: Get monthly analytics
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: year
 *         in: query
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Monthly data retrieved
 */

/**
 * @swagger
 * /analytics/{userId}/category:
 *   get:
 *     summary: Get category-wise breakdown
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category breakdown retrieved
 */

/**
 * @swagger
 * /agents/run:
 *   post:
 *     summary: Run multi-agent orchestration cycle
 *     description: Executes all financial agents (Financial Analyzer, Goal Optimizer, Alert Monitor, Insight Generator) in coordinated workflow
 *     tags:
 *       - Agent Orchestration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agent orchestration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Agent orchestration completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     contextVersion:
 *                       type: number
 *                       example: 42
 *                     executedAgents:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["financial_analyzer", "goal_optimizer", "alert_monitor", "insight_generator"]
 *                     newRecommendations:
 *                       type: number
 *                       example: 5
 *                     newAlerts:
 *                       type: number
 *                       example: 2
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error during agent execution
 */

/**
 * @swagger
 * /agents/context:
 *   get:
 *     summary: Get latest shared agent context
 *     description: Retrieves the current shared context state including agent outputs, recommendations, and alerts
 *     tags:
 *       - Agent Orchestration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Context retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     contextVersion:
 *                       type: number
 *                       example: 42
 *                     sharedContext:
 *                       type: object
 *                       description: Agent-specific context data
 *                     agentStates:
 *                       type: object
 *                       description: Per-agent execution status and metadata
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /agents/messages:
 *   get:
 *     summary: Get recent inter-agent messages
 *     description: Retrieves communication history between agents
 *     tags:
 *       - Agent Orchestration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Number of recent messages to retrieve (max 200)
 *         schema:
 *           type: number
 *           default: 30
 *           minimum: 1
 *           maximum: 200
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [TASK, FINDINGS, ALERT, RECOMMENDATION, ESCALATION, REPORT]
 *                       from:
 *                         type: string
 *                       to:
 *                         type: string
 *                       priority:
 *                         type: number
 *                       payload:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /agents/state:
 *   get:
 *     summary: Get per-agent state snapshot
 *     description: Retrieves execution status and metadata for each agent
 *     tags:
 *       - Agent Orchestration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agent states retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     financial_analyzer:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [idle, running, completed, failed]
 *                         lastRun:
 *                           type: string
 *                           format: date-time
 *                         error:
 *                           type: string
 *                     goal_optimizer:
 *                       type: object
 *                     alert_monitor:
 *                       type: object
 *                     insight_generator:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
