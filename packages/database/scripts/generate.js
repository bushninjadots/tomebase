#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const dbDir = path.join(__dirname, '..');
const schemaPath = path.join(dbDir, 'prisma', 'schema.prisma');

try {
  execSync(`npx prisma generate --schema=${schemaPath}`, { stdio: 'inherit', cwd: dbDir });
  console.log('Prisma client generated successfully');
} catch (error) {
  console.error('Failed to generate Prisma client:', error);
  process.exit(1);
}
