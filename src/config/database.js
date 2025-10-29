// Database Configuration
const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eye_clinic_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4'
});

// Test connection
pool.getConnection()
    .then(async (connection) => {
        try {
            await connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            await connection.query("SET collation_connection = utf8mb4_unicode_ci");
            await connection.query("SET character_set_client = utf8mb4");
            await connection.query("SET character_set_results = utf8mb4");
            await connection.query("SET character_set_connection = utf8mb4");
            console.log('✅ Database connected successfully with utf8mb4 session');
        } finally {
            connection.release();
        }
    })
    .catch(err => {
        console.error('❌ Database connection error:', err.message);
    });

module.exports = pool;
