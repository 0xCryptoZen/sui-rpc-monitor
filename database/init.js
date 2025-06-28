// Database initialization script
// Run this with: bun run database/init.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'sui_monitor',
    user: process.env.DB_USER || 'agg',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema...');
    await client.query(schema);
    
    console.log('Database initialized successfully!');
    console.log('Default admin user created: username=admin, password=admin123');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };