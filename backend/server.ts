import 'dotenv/config'; 
import { Pool } from 'pg';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken'; 
import cors from 'cors';

// --- CONFIGURATION ---
const app = express();
const port = 8000;

const SALT_ROUNDS = 10; 
const JWT_SECRET = process.env.JWT_SECRET || 'a_fallback_secret_key_if_env_is_missing';
const TOKEN_EXPIRY = '1h';

// Apply CORS Middleware with proper configuration
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173',
    'https://bi-dashboard-pro.netlify.app',
    'https://business-intelligence-dashboard-ohbe.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).send();
});

// Apply body-parser
app.use(bodyParser.json());

// Database Pool - supports both local dev and Render production
// Database Pool - supports both local dev and Render production
let connectionConfig;

if (process.env.DATABASE_URL) {
  // Production (Render) - use DATABASE_URL
  connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
} else {
  // Local development - use individual env vars
  connectionConfig = {
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'db', 
    database: process.env.POSTGRES_DB || 'dashboard_db',
    password: process.env.POSTGRES_PASSWORD || 'devpassword',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
  };
}

const pool = new Pool(connectionConfig);

// --- UTILITY FUNCTIONS ---

// Function to execute a query
async function executeQuery(text: string, params: (string | number)[] = []) {
    const client = await pool.connect();
    try {
        return await client.query(text, params);
    } finally {
        client.release();
    }
}

// Function to set up database tables
async function setupDatabase() {
    console.log("Checking database schema...");
    try {
        // Users table
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Dashboard metrics table with category and region
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS dashboard_metrics (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                revenue DECIMAL(10,2) NOT NULL,
                units_sold INTEGER NOT NULL,
                cost_of_goods DECIMAL(10,2) NOT NULL,
                profit DECIMAL(10,2) NOT NULL,
                product_category VARCHAR(100),
                region VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Database tables checked/created successfully.");
        
        // Generate sample data if table is empty
        await generateSampleData();
        
    } catch (error) {
        console.error("CRITICAL: Database schema setup failed.", error);
    }
}

// Generate sample data function
async function generateSampleData() {
    try {
        // Check if we already have data
        const result = await executeQuery('SELECT COUNT(*) FROM dashboard_metrics');
        const count = parseInt(result.rows[0].count);
        
        if (count > 0) {
            console.log(`Sample data already exists (${count} records).`);
            return;
        }

        console.log("Generating sample dashboard data...");
        
        // Generate 90 days of sample data
        const categories = ['Electronics', 'Clothing', 'Home Goods', 'Books', 'Sports'];
        const regions = ['North', 'South', 'East', 'West'];
        
        const inserts = [];
        const today = new Date();
        
        // Define base revenue for each category
        const baseRevenueMap: { [key: string]: number } = {
            'Electronics': 1500, 
            'Clothing': 300, 
            'Home Goods': 600, 
            'Books': 100, 
            'Sports': 400
        };
        
        for (let i = 0; i < 90; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (89 - i)); // Last 90 days
            
            const category = categories[Math.floor(Math.random() * categories.length)];
            const region = regions[Math.floor(Math.random() * regions.length)];
            
            // Get base revenue with type safety
            const baseRevenue = baseRevenueMap[category] || 500; // Fallback to 500 if undefined
            
            const revenue = Math.max(100, baseRevenue + (Math.random() - 0.5) * baseRevenue);
            const costOfGoods = revenue * (0.3 + Math.random() * 0.3); // 30-60% COGS
            const profit = revenue - costOfGoods;
            const unitsSold = Math.max(1, Math.floor(revenue / (baseRevenue * 0.3)));
            
            inserts.push(
                executeQuery(
                    `INSERT INTO dashboard_metrics (date, revenue, units_sold, cost_of_goods, profit, product_category, region) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [date.toISOString().split('T')[0], revenue, unitsSold, costOfGoods, profit, category, region]
                )
            );
        }
        
        await Promise.all(inserts);
        console.log("Sample data generated successfully!");
        
    } catch (error) {
        console.error("Error generating sample data:", error);
    }
}

// --- AUTHENTICATION MIDDLEWARE ---

// This function checks if a request has a valid JWT, protecting all data routes.
export function authenticateToken(req: Request, res: Response, next: () => void) {
    const authHeader = req.headers['authorization'];
    // Expects format: Bearer <TOKEN>
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        // 401: Unauthorized - No token provided
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            // 403: Forbidden - Invalid or expired token
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        // Attach user payload (userId, email) to the request object
        (req as any).user = user; 
        next(); // Proceed to the protected route handler
    });
}

// --- ROUTES ---

// 1. User Registration (POST /api/register)
app.post('/api/register', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
        const query = 'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id';
        const result = await executeQuery(query, [email, password_hash]);

        res.status(201).json({ 
            status: 'success', 
            message: 'User registered successfully. Please log in.',
            userId: result.rows[0].id
        });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        if (details.includes('duplicate key')) {
            return res.status(409).json({ message: 'User already exists.' });
        }
        res.status(500).json({ message: 'Internal server error during registration.', details });
    }
});

// 2. User Login (POST /api/login)
app.post('/api/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const query = 'SELECT id, email, password_hash FROM users WHERE email = $1';
        const result = await executeQuery(query, [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

        res.json({
            status: 'success',
            message: 'Login successful.',
            token: token
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});

// 3. Enhanced Dashboard Data Route with Filters (GET /api/dashboard/data)
// In server.ts - UPDATE the /api/dashboard/data endpoint query
app.get('/api/dashboard/data', authenticateToken, async (req: Request, res: Response) => {
  const { startDate, endDate, category, region } = req.query;

  // Build query efficiently
  let query = `
    SELECT 
      TO_CHAR(date, 'YYYY-MM-DD') as date, 
      revenue, 
      units_sold, 
      cost_of_goods, 
      profit,
      product_category,
      region
    FROM dashboard_metrics
    WHERE date >= $1 AND date <= $2
  `;
  
  const params: any[] = [startDate, endDate];
  let paramCount = 2;

  // Apply most selective filters first
  if (category && typeof category === 'string') {
    paramCount++;
    query += ` AND product_category = $${paramCount}`;
    params.push(category);
  }

  if (region && typeof region === 'string') {
    paramCount++;
    query += ` AND region = $${paramCount}`;
    params.push(region);
  }

  // Add limit for safety and order by date
  query += ` ORDER BY date ASC LIMIT 1000;`;

  console.log(`Executing optimized dashboard query with ${params.length} params`);

  try {
    const result = await executeQuery(query, params);
    
   const formattedData = result.rows.map(row => ({
  date: row.date,
  revenue: parseFloat(row.revenue).toFixed(2),  // Just number
  profit: parseFloat(row.profit).toFixed(2),    // Just number
  cost_of_goods: parseFloat(row.cost_of_goods).toFixed(2),  // Just number
  units_sold: row.units_sold,
  product_category: row.product_category,
  region: row.region
}));

    res.json({
      status: 'success',
      message: 'Dashboard data retrieved successfully.',
      data: formattedData,
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve dashboard data.',
    });
  }
});

// 4. KPI Summary Endpoint (GET /api/dashboard/summary)
app.get('/api/dashboard/summary', authenticateToken, async (req: Request, res: Response) => {
    const { startDate, endDate, category, region } = req.query;

    let query = `
        SELECT 
            SUM(revenue) as total_revenue,
            SUM(profit) as total_profit,
            SUM(units_sold) as total_units,
            AVG(revenue) as avg_revenue,
            COUNT(*) as record_count
        FROM dashboard_metrics
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];

    // Date filters
    if (startDate && typeof startDate === 'string') {
        conditions.push(`date >= $${params.length + 1}`);
        params.push(startDate);
    }
    if (endDate && typeof endDate === 'string') {
        conditions.push(`date <= $${params.length + 1}`);
        params.push(endDate);
    }

    // Category filter
    if (category && typeof category === 'string') {
        conditions.push(`product_category = $${params.length + 1}`);
        params.push(category);
    }

    // Region filter
    if (region && typeof region === 'string') {
        conditions.push(`region = $${params.length + 1}`);
        params.push(region);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    try {
        const result = await executeQuery(query, params);
        const summary = result.rows[0];
        
        res.json({
            status: 'success',
            data: {
                totalRevenue: summary.total_revenue,
                totalProfit: summary.total_profit,
                totalUnits: summary.total_units,
                avgRevenue: summary.avg_revenue,
                recordCount: summary.record_count
            }
        });
    } catch (error) {
        console.error("Summary fetch error:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to get summary data.' 
        });
    }
});

// 5. Available Filters Endpoint (GET /api/dashboard/filters)
app.get('/api/dashboard/filters', authenticateToken, async (req: Request, res: Response) => {
    try {
        const categoriesResult = await executeQuery('SELECT DISTINCT product_category FROM dashboard_metrics WHERE product_category IS NOT NULL ORDER BY product_category');
        const regionsResult = await executeQuery('SELECT DISTINCT region FROM dashboard_metrics WHERE region IS NOT NULL ORDER BY region');
        const dateRangeResult = await executeQuery('SELECT MIN(date) as min_date, MAX(date) as max_date FROM dashboard_metrics');

        res.json({
            status: 'success',
            data: {
                categories: categoriesResult.rows.map(row => row.product_category),
                regions: regionsResult.rows.map(row => row.region),
                dateRange: {
                    minDate: dateRangeResult.rows[0].min_date,
                    maxDate: dateRangeResult.rows[0].max_date
                }
            }
        });
    } catch (error) {
        console.error("Filters fetch error:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to get filter options.' 
        });
    }
});

// 6. Connection Test (GET /api/test-db) - For verification
app.get('/api/test-db', async (req: Request, res: Response) => {
    try {
        const result = await executeQuery('SELECT NOW()');
        res.json({ 
            status: 'success', 
            message: 'Database connection successful!',
            databaseTime: result.rows[0].now 
        });
    } catch (error) {
        const details = error instanceof Error ? error.message : String(error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Database connection failed.',
            details
        });
    }
});

// Add this endpoint to your server.ts
app.get('/api/dashboard/export', authenticateToken, async (req: Request, res: Response) => {
    const { startDate, endDate, category, region } = req.query;

    let query = `
        SELECT 
            date, 
            revenue, 
            units_sold, 
            cost_of_goods, 
            profit,
            product_category,
            region
        FROM 
            dashboard_metrics
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];

    // Same filter logic as data endpoint
    if (startDate && typeof startDate === 'string') {
        conditions.push(`date >= $${params.length + 1}`);
        params.push(startDate);
    }
    if (endDate && typeof endDate === 'string') {
        conditions.push(`date <= $${params.length + 1}`);
        params.push(endDate);
    }
    if (category && typeof category === 'string') {
        conditions.push(`product_category = $${params.length + 1}`);
        params.push(category);
    }
    if (region && typeof region === 'string') {
        conditions.push(`region = $${params.length + 1}`);
        params.push(region);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY date ASC;`;

    try {
        const result = await executeQuery(query, params);
        
        // Convert to CSV
        const csvData = result.rows.map(row => 
            `${row.date},${row.revenue},${row.units_sold},${row.cost_of_goods},${row.profit},${row.product_category || ''},${row.region || ''}`
        ).join('\n');
        
        const csvHeaders = 'Date,Revenue,Units Sold,Cost of Goods,Profit,Category,Region\n';
        const csv = csvHeaders + csvData;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=dashboard-export.csv');
        res.send(csv);

    } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to export data.',
        });
    }
});

// 8. Real Analytics Endpoints

// Growth Analysis Endpoint
app.get('/api/analytics/growth', authenticateToken, async (req: Request, res: Response) => {
    const { period = 'month' } = req.query;

    try {
        let currentPeriodQuery = '';
        let previousPeriodQuery = '';
        
        if (period === 'month') {
            currentPeriodQuery = `
                SELECT SUM(revenue) as revenue, SUM(profit) as profit, SUM(units_sold) as units
                FROM dashboard_metrics 
                WHERE date >= date_trunc('month', CURRENT_DATE)
            `;
            previousPeriodQuery = `
                SELECT SUM(revenue) as revenue, SUM(profit) as profit, SUM(units_sold) as units
                FROM dashboard_metrics 
                WHERE date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                AND date < date_trunc('month', CURRENT_DATE)
            `;
        } else if (period === 'week') {
            currentPeriodQuery = `
                SELECT SUM(revenue) as revenue, SUM(profit) as profit, SUM(units_sold) as units
                FROM dashboard_metrics 
                WHERE date >= date_trunc('week', CURRENT_DATE)
            `;
            previousPeriodQuery = `
                SELECT SUM(revenue) as revenue, SUM(profit) as profit, SUM(units_sold) as units
                FROM dashboard_metrics 
                WHERE date >= date_trunc('week', CURRENT_DATE - INTERVAL '1 week')
                AND date < date_trunc('week', CURRENT_DATE)
            `;
        } else {
            return res.status(400).json({ status: 'error', message: 'Invalid period parameter' });
        }

        const [currentResult, previousResult] = await Promise.all([
            executeQuery(currentPeriodQuery),
            executeQuery(previousPeriodQuery)
        ]);

        const current = currentResult.rows[0];
        const previous = previousResult.rows[0];

        // Ensure we have numbers, not null
        const currentRevenue = parseFloat(current.revenue) || 0;
        const previousRevenue = parseFloat(previous.revenue) || 0;
        const currentProfit = parseFloat(current.profit) || 0;
        const previousProfit = parseFloat(previous.profit) || 0;
        const currentUnits = parseInt(current.units) || 0;
        const previousUnits = parseInt(previous.units) || 0;

        const growthRates = {
            revenue: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
            profit: previousProfit > 0 ? ((currentProfit - previousProfit) / previousProfit) * 100 : 0,
            units: previousUnits > 0 ? ((currentUnits - previousUnits) / previousUnits) * 100 : 0
        };

        res.json({
            status: 'success',
            data: {
                currentPeriod: {
                    revenue: currentRevenue,
                    profit: currentProfit,
                    units: currentUnits
                },
                previousPeriod: {
                    revenue: previousRevenue,
                    profit: previousProfit,
                    units: previousUnits
                },
                growthRates
            }
        });

    } catch (error) {
        console.error("Growth analysis error:", error);
        res.status(500).json({ status: 'error', message: 'Failed to analyze growth' });
    }
});


// Trend Analysis Endpoint
app.get('/api/analytics/trends', authenticateToken, async (req: Request, res: Response) => {
    try {
        const trendQuery = `
            SELECT 
                product_category,
                SUM(revenue) as total_revenue,
                SUM(profit) as total_profit,
                SUM(units_sold) as total_units,
                COUNT(*) as transaction_count
            FROM dashboard_metrics 
            WHERE date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY product_category
            ORDER BY total_revenue DESC
        `;

        const result = await executeQuery(trendQuery);
        
        const trends = {
            topPerformer: result.rows[0] || null,
            categoryBreakdown: result.rows,
            totalCategories: result.rows.length
        };

        res.json({
            status: 'success',
            data: trends
        });

    } catch (error) {
        console.error("Trend analysis error:", error);
        res.status(500).json({ status: 'error', message: 'Failed to analyze trends' });
    }
});

// Simple Forecasting Endpoint
app.get('/api/analytics/forecast', authenticateToken, async (req: Request, res: Response) => {
    try {
        const historicalQuery = `
            SELECT 
                date,
                SUM(revenue) as daily_revenue
            FROM dashboard_metrics 
            WHERE date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY date
            ORDER BY date
        `;

        const result = await executeQuery(historicalQuery);
        
        // Simple linear regression for 30-day forecast
        const forecasts = generateRevenueForecast(result.rows);
        
        res.json({
            status: 'success',
            data: {
                historical: result.rows,
                forecast: forecasts
            }
        });

    } catch (error) {
        console.error("Forecast error:", error);
        res.status(500).json({ status: 'error', message: 'Failed to generate forecast' });
    }
});

// Helper function for revenue forecasting
// Helper function for revenue forecasting
function generateRevenueForecast(historicalData: any[]) {
    if (historicalData.length < 2) return [];
    
    // Simple moving average forecast
    const last30Days = historicalData.slice(-30);
    const avgRevenue = last30Days.reduce((sum: number, day: any) => {
        const revenue = parseFloat(day.daily_revenue) || 0;
        return sum + revenue;
    }, 0) / last30Days.length;
    
    // Generate next 30 days forecast
    const forecasts = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);
        
        forecasts.push({
            date: forecastDate.toISOString().split('T')[0],
            forecasted_revenue: avgRevenue * (1 + (Math.random() * 0.1 - 0.05)), // ±5% variation
            confidence: 0.85 - (i * 0.02) // Decreasing confidence further out
        });
    }
    
    return forecasts;
}

// =====================
// ADMIN ENDPOINTS
// =====================

// 9. Add Single Sales Record
app.post('/api/admin/add-record', authenticateToken, async (req: Request, res: Response) => {
    const { date, revenue, units_sold, cost_of_goods, product_category, region } = req.body;

    // Validate required fields
    if (!date || !revenue || !units_sold || !cost_of_goods || !product_category || !region) {
        return res.status(400).json({
            status: 'error',
            message: 'All fields are required: date, revenue, units_sold, cost_of_goods, product_category, region'
        });
    }

    try {
        const profit = parseFloat(revenue) - parseFloat(cost_of_goods);
        
        const query = `
            INSERT INTO dashboard_metrics 
            (date, revenue, units_sold, cost_of_goods, profit, product_category, region) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const result = await executeQuery(query, [
            date, 
            parseFloat(revenue), 
            parseInt(units_sold), 
            parseFloat(cost_of_goods), 
            profit,
            product_category, 
            region
        ]);

        res.json({
            status: 'success',
            message: 'Sales record added successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Add record error:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add sales record'
        });
    }
});

// 10. Generate Bulk Test Data
app.post('/api/admin/generate-data', authenticateToken, async (req: Request, res: Response) => {
    const { records = 50, scenario = 'normal' } = req.body;

    try {
        // Clear existing data first
        await executeQuery('DELETE FROM dashboard_metrics');
        
        const categories = ['Electronics', 'Clothing', 'Home Goods', 'Books', 'Sports'];
        const regions = ['North', 'South', 'East', 'West'];
        const inserts = [];
        const today = new Date();

        // Scenario multipliers
        const scenarioMultipliers = {
            normal: 1.0,
            growth: 1.3,      // 30% growth scenario
            recession: 0.7,   // 30% decline scenario
            spike: 2.0        // 100% spike scenario
        };

        const multiplier = scenarioMultipliers[scenario as keyof typeof scenarioMultipliers] || 1.0;

        for (let i = 0; i < records; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Last 90 days
            
            const category = categories[Math.floor(Math.random() * categories.length)];
            const region = regions[Math.floor(Math.random() * regions.length)];
            
            // Base revenue with scenario multiplier
            const baseRevenueMap: { [key: string]: number } = {
                'Electronics': 1500, 
                'Clothing': 300, 
                'Home Goods': 600, 
                'Books': 100, 
                'Sports': 400
            };
            
            const baseRevenue = baseRevenueMap[category] * multiplier;
            const revenue = Math.max(100, baseRevenue + (Math.random() - 0.5) * baseRevenue);
            const costOfGoods = revenue * (0.3 + Math.random() * 0.3);
            const profit = revenue - costOfGoods;
            const unitsSold = Math.max(1, Math.floor(revenue / (baseRevenue * 0.3)));

            inserts.push(
                executeQuery(
                    `INSERT INTO dashboard_metrics (date, revenue, units_sold, cost_of_goods, profit, product_category, region) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [date.toISOString().split('T')[0], revenue, unitsSold, costOfGoods, profit, category, region]
                )
            );
        }

        await Promise.all(inserts);

        res.json({
            status: 'success',
            message: `Generated ${records} records with ${scenario} scenario`,
            data: {
                records: records,
                scenario: scenario,
                multiplier: multiplier
            }
        });

    } catch (error) {
        console.error("Generate data error:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate test data'
        });
    }
});

// 11. Apply Pre-built Scenario
app.post('/api/admin/apply-scenario', authenticateToken, async (req: Request, res: Response) => {
    const { scenario } = req.body;

    const scenarios = {
        'revenue-spike': {
            description: '50% Revenue Spike in Electronics',
            query: `UPDATE dashboard_metrics SET revenue = revenue * 1.5, profit = profit * 1.5 WHERE product_category = 'Electronics'`
        },
        'profit-drop': {
            description: '30% Profit Drop in Clothing',
            query: `UPDATE dashboard_metrics SET profit = profit * 0.7, revenue = revenue * 0.9 WHERE product_category = 'Clothing'`
        },
        'category-leader': {
            description: 'Make Sports Category the Leader',
            query: `UPDATE dashboard_metrics SET revenue = revenue * 2.0, profit = profit * 2.0 WHERE product_category = 'Sports'`
        },
        'regional-boom': {
            description: 'West Region Business Boom',
            query: `UPDATE dashboard_metrics SET revenue = revenue * 1.8, profit = profit * 1.8 WHERE region = 'West'`
        }
    };

    const selectedScenario = scenarios[scenario as keyof typeof scenarios];

    if (!selectedScenario) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid scenario. Available: revenue-spike, profit-drop, category-leader, regional-boom'
        });
    }

    try {
        const result = await executeQuery(selectedScenario.query);
        
        res.json({
            status: 'success',
            message: `Applied scenario: ${selectedScenario.description}`,
            data: {
                scenario: scenario,
                description: selectedScenario.description,
                affectedRows: result.rowCount
            }
        });

    } catch (error) {
        console.error("Apply scenario error:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to apply scenario'
        });
    }
});

// 12. Reset to Default Data
app.post('/api/admin/reset-data', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Clear existing data
        await executeQuery('DELETE FROM dashboard_metrics');
        
        // Regenerate default sample data
        await generateSampleData();
        
        res.json({
            status: 'success',
            message: 'Data reset to default sample data'
        });

    } catch (error) {
        console.error("Reset data error:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to reset data'
        });
    }
});

// 13. Modify Data with Multipliers
app.post('/api/admin/modify-data', authenticateToken, async (req: Request, res: Response) => {
    const { revenueMultiplier = 1.0, profitMultiplier = 1.0, category, region } = req.body;

    try {
        let query = 'UPDATE dashboard_metrics SET revenue = revenue * $1, profit = profit * $2';
        const params: any[] = [revenueMultiplier, profitMultiplier];
        let paramCount = 2;

        if (category) {
            paramCount++;
            query += ` WHERE product_category = $${paramCount}`;
            params.push(category);
        }

        if (region) {
            paramCount++;
            query += ` ${category ? 'AND' : 'WHERE'} region = $${paramCount}`;
            params.push(region);
        }

        const result = await executeQuery(query, params);
        
        res.json({
            status: 'success',
            message: `Data modified with multipliers: Revenue ×${revenueMultiplier}, Profit ×${profitMultiplier}`,
            data: {
                revenueMultiplier,
                profitMultiplier,
                category: category || 'all',
                region: region || 'all',
                affectedRows: result.rowCount
            }
        });

    } catch (error) {
        console.error("Modify data error:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to modify data'
        });
    }
});

// --- SERVER START ---
setupDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Node.js/Express server running on http://localhost:${port}`);
        console.log('API routes ready.');
        console.log('Available endpoints:');
        console.log('  POST /api/register');
        console.log('  POST /api/login');
        console.log('  GET  /api/dashboard/data');
        console.log('  GET  /api/dashboard/summary');
        console.log('  GET  /api/dashboard/filters');
        console.log('  GET  /api/dashboard/export');
        console.log('  GET  /api/analytics/growth');
        console.log('  GET  /api/analytics/trends');
        console.log('  GET  /api/analytics/forecast');
        console.log('  POST /api/admin/add-record');
        console.log('  POST /api/admin/generate-data');
        console.log('  POST /api/admin/apply-scenario');
        console.log('  POST /api/admin/reset-data');
        console.log('  POST /api/admin/modify-data');
        console.log('  GET  /api/test-db');
    });
});