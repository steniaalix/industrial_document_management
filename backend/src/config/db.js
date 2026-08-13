const mysql = require('mysql2/promise');

// Load environment variables (useful if this file is run/tested standalone, 
// though app.js will load dotenv globally)
require('dotenv').config();

// Define database connection settings using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'industrial_document_management',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  // Connection pool configurations
  waitForConnections: true,
  connectionLimit: 10, // Maximum number of connections to create at once
  queueLimit: 0        // Unlimited queueing when connectionLimit is reached
};

// Create a connection pool to share and reuse connections efficiently
const pool = mysql.createPool(dbConfig);

// Test function to verify the connection on start
const testConnection = async () => {
  try {
    // Attempt to acquire a connection from the pool
    const connection = await pool.getConnection();
    console.log('Database Connection Status: Connected to database successfully.');
    // Always release the connection back to the pool
    connection.release();
    return true;
  } catch (error) {
    console.error('Database Connection Status: Failed to connect. Error:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection
};
