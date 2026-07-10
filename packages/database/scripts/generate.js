#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const dbDir = path.join(__dirname, '..');

// Load .env from the database package
const envPath = path.join(dbDir, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
}

// Read the base schema
const baseSchema = fs.readFileSync(schemaPath, 'utf8');

// Detect database type from DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || '';
const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');

// Replace only the datasource provider (not the generator provider)
let provider = 'sqlite';
if (isPostgres) {
  provider = 'postgresql';
}

const updatedSchema = baseSchema.replace(
  /(datasource\s+db\s*\{[^}]*provider\s*=\s*)"[^"]*"/,
  `$1"${provider}"`
);

// Write the updated schema
fs.writeFileSync(schemaPath, updatedSchema);

console.log(`Prisma provider set to: ${provider}`);
console.log(`Database URL: ${databaseUrl.substring(0, 50)}...`);

// Generate the client
try {
  execSync('npx prisma generate', { stdio: 'inherit', cwd: dbDir });
  console.log('Prisma client generated successfully');
} catch (error) {
  console.error('Failed to generate Prisma client:', error);
  process.exit(1);
}
