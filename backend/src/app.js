// Import required dependencies
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from the .env file

// Import database pool and connection tester
const { pool, testConnection } = require('./config/db');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) to allow requests from a frontend
app.use(cors());

// Parse incoming HTTP request bodies containing JSON data
app.use(express.json());

/**
 * @route   GET /api/health
 * @desc    Checks if the backend Express API is running
 * @access  Public
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Industrial Document Management API is running"
  });
});

/**
 * @route   GET /api/health/db
 * @desc    Verifies that the backend can successfully query the MySQL database
 * @access  Public
 */
app.get('/api/health/db', async (req, res) => {
  try {
    // Run a basic test query. SELECT 1 is extremely lightweight and fast.
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    
    res.status(200).json({
      success: true,
      message: "Database connection is healthy",
      dbStatus: "Connected",
      testResult: rows[0].result
    });
  } catch (error) {
    // If the database is down or connection parameters are incorrect
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      dbStatus: "Disconnected",
      error: error.message
    });
  }
});

// Serve uploads directory as a static folder (will be used for physical PDF/DOCX)
// We create the uploads folder to store these files locally on the backend.
app.use('/uploads', express.static('uploads'));

// Authentication Endpoint for Demo Login
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const [rows] = await pool.query('SELECT user_id, name, email, role FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// Register Document Module Routes
const documentRoutes = require('./routes/documentRoutes');
const documentVersionRoutes = require('./routes/documentVersionRoutes');
const documentRejectionRoutes = require('./routes/documentRejectionRoutes');
const documentApprovalRoutes = require('./routes/documentApprovalRoutes');
const documentReviewRoutes = require('./routes/documentReviewRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

app.use('/api/documents', documentRoutes);
app.use('/api/documents', documentVersionRoutes);
app.use('/api/documents', documentRejectionRoutes);
app.use('/api/documents', documentApprovalRoutes);
app.use('/api/documents', documentReviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/departments', departmentRoutes);

// Global Error Handling Middleware
// Express uses the presence of 4 arguments to identify this as an error-handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error Caught by Middleware:', err.stack || err.message);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Bootstrapping function to test database first, then start listening
const bootstrap = async () => {
  try {
    // Test database connection before initializing web server
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`Backend Server successfully started on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start application server: database test failed.');
    // Exit process with failure code
    process.exit(1);
  }
};

bootstrap();
