const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let pool = null;
let isConnected = false;
let connectionError = null;

function getSslConfig() {
  if (process.env.DB_SSL === 'false') {
    return false;
  }
  // Aiven cloud MySQL uses SSL. rejectUnauthorized: false allows secure TLS
  // connection without requiring local bundle CA files.
  return {
    rejectUnauthorized: false
  };
}

async function initDatabase() {
  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT || '16552', 10);
  const user = process.env.DB_USER || 'avnadmin';
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'coding_hub';
  const defaultDb = process.env.DB_DEFAULT_NAME || 'defaultdb';
  const ssl = getSslConfig();

  if (!host || !password) {
    console.warn('⚠️  MySQL credentials not fully configured in .env. Skipping database initialization.');
    return false;
  }

  console.log(`🔌 Connecting to Aiven MySQL server at ${host}:${port}...`);

  try {
    // 1. Initial connection using defaultdb to ensure the target database exists
    const adminConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: defaultDb,
      ssl
    });

    console.log(`🔨 Ensuring database "${database}" exists...`);
    await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await adminConn.end();
    console.log(`✅ Database "${database}" verified/created successfully.`);

    // 2. Create the main connection pool for coding_hub
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      ssl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });

    // Test the pool connection
    const testConn = await pool.getConnection();
    await testConn.ping();
    testConn.release();

    // 3. Create tables
    await createTables();

    // 4. Seed / migrate existing users
    await seedExistingUsers();

    isConnected = true;
    connectionError = null;
    console.log(`🎉 Successfully connected to MySQL database: ${database}`);
    return true;
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.error('❌ Failed to connect to MySQL database:', err.message);
    return false;
  }
}

async function createTables() {
  if (!pool) return;

  // 1. Users Table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  // 2. Sessions Table
  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(createUsersTable);
  console.log('✅ MySQL Table "users" is ready.');

  await pool.query(createSessionsTable);
  console.log('✅ MySQL Table "sessions" is ready.');
}

async function seedExistingUsers() {
  if (!pool) return;

  // Check and migrate users from data/users.json if any exist
  const usersJsonPath = path.join(__dirname, 'data', 'users.json');
  let usersToMigrate = [];

  if (fs.existsSync(usersJsonPath)) {
    try {
      const raw = fs.readFileSync(usersJsonPath, 'utf8');
      usersToMigrate = JSON.parse(raw || '[]');
    } catch (e) {
      console.warn('Could not read data/users.json for migration:', e.message);
    }
  }

  // Ensure standard demo user exists
  const hasDemo = usersToMigrate.some(u => u.email === 'demo@codinghub.com');
  if (!hasDemo) {
    usersToMigrate.push({
      id: 'usr_demo_1',
      name: 'Suninda',
      email: 'demo@codinghub.com',
      passwordHash: 'codinghub123',
      role: 'student',
      createdAt: new Date().toISOString()
    });
  }

  for (const user of usersToMigrate) {
    try {
      const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [user.email.toLowerCase()]);
      if (rows.length === 0) {
        await pool.query(
          'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [
            user.id || ('usr_' + Date.now().toString(36)),
            user.name || user.email.split('@')[0],
            user.email.toLowerCase(),
            user.passwordHash || user.password_hash,
            user.role || 'student',
            user.createdAt ? new Date(user.createdAt) : new Date()
          ]
        );
        console.log(`👤 Migrated user to MySQL: ${user.email}`);
      }
    } catch (err) {
      console.warn(`Could not seed user ${user.email}:`, err.message);
    }
  }
}

async function findUserByEmail(email) {
  if (!pool || !isConnected) return null;
  const normalized = (email || '').trim().toLowerCase();
  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE email = ?',
    [normalized]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function findUserById(id) {
  if (!pool || !isConnected) return null;
  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE email = ?',
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function createUser({ id, name, email, passwordHash, role = 'student' }) {
  if (!pool || !isConnected) {
    throw new Error('Database is not connected');
  }
  const normalized = email.trim().toLowerCase();
  const userId = id || ('usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6));
  const userName = name ? name.trim() : normalized.split('@')[0];

  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [userId, userName, normalized, passwordHash, role]
  );

  return {
    id: userId,
    name: userName,
    email: normalized,
    role
  };
}

async function saveSession(token, { userId, email, role = 'student' }) {
  if (!pool || !isConnected) return;
  try {
    await pool.query(
      'INSERT INTO sessions (token, user_id, email, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), email = VALUES(email), role = VALUES(role)',
      [token, userId, email, role]
    );
  } catch (err) {
    console.warn('Error saving session to MySQL:', err.message);
  }
}

async function getSession(token) {
  if (!pool || !isConnected) return null;
  try {
    const [rows] = await pool.query(
      'SELECT token, user_id AS userId, email, role, created_at AS createdAt FROM sessions WHERE token = ?',
      [token]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.warn('Error fetching session from MySQL:', err.message);
    return null;
  }
}

async function deleteSession(token) {
  if (!pool || !isConnected) return;
  try {
    await pool.query('DELETE FROM sessions WHERE token = ?', [token]);
  } catch (err) {
    console.warn('Error deleting session from MySQL:', err.message);
  }
}

function getDatabaseStatus() {
  return {
    connected: isConnected,
    database: process.env.DB_NAME || 'coding_hub',
    host: process.env.DB_HOST || 'unknown',
    port: process.env.DB_PORT || '16552',
    user: process.env.DB_USER || 'avnadmin',
    error: connectionError
  };
}

async function getAllUsers() {
  if (!pool || !isConnected) return [];
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at AS createdAt FROM users ORDER BY created_at DESC'
    );
    return rows;
  } catch (err) {
    console.warn('Error fetching all users:', err.message);
    return [];
  }
}

module.exports = {
  initDatabase,
  getPool: () => pool,
  isDatabaseConnected: () => isConnected,
  getDatabaseStatus,
  findUserByEmail,
  findUserById,
  createUser,
  getAllUsers,
  saveSession,
  getSession,
  deleteSession
};
