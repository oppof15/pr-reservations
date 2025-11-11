// File: server/db.js
const mysql = require('mysql2/promise');

// Create a "connection pool"
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connected successfully!');
    conn.release(); // release the connection back to the pool
  })
  .catch(err => {
    console.error('Error connecting to database:', err);
  });

// Export the pool so our routes can use it
module.exports = pool;