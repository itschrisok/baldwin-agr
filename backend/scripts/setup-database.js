/**
 * Database Setup Script
 * Initialize database schema and seed data
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function setupDatabase() {
  console.log('='.repeat(50));
  console.log('Baldwin County News Hub - Database Setup');
  console.log('='.repeat(50));

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('\n1. Connecting to database...');
    console.log(`   URL: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);

    // Execute schema
    console.log('\n2. Creating tables...');
    await pool.query(schema);
    console.log('   ✓ Tables created successfully');

    // Verify tables
    console.log('\n3. Verifying schema...');
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`   ✓ Found ${result.rows.length} tables:`);
    result.rows.forEach((row) => {
      console.log(`     - ${row.table_name}`);
    });

    // Check sources
    console.log('\n4. Checking sources...');
    const sources = await pool.query('SELECT name, enabled FROM sources');
    console.log(`   ✓ Found ${sources.rows.length} sources:`);
    sources.rows.forEach((source) => {
      const status = source.enabled ? '✓' : '✗';
      console.log(`     ${status} ${source.name}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('Database setup complete!');
    console.log('='.repeat(50));
    console.log('\nNext steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Run manual scrape: npm run scrape');
    console.log('3. Check API: http://localhost:3000/api/health');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during database setup:');
    console.error(error.message);
    console.error('\nPlease check:');
    console.error('1. PostgreSQL is running');
    console.error('2. DATABASE_URL in .env is correct');
    console.error('3. Database exists and user has permissions');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase();
