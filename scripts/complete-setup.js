#!/usr/bin/env node

/**
 * Complete Appwrite Setup Script for Todos Application
 * 
 * This script runs the complete setup process:
 * 1. Database and collection creation
 * 2. Permissions configuration
 * 3. Setup verification
 * 
 * Usage:
 * node scripts/complete-setup.js [--multi-user]
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if multi-user mode is enabled
const isMultiUser = process.argv.includes('--multi-user');

// Run a script and return a promise
function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running: ${scriptPath} ${args.join(' ')}`);
    console.log('='.repeat(50));
    
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptPath} completed successfully\n`);
        resolve();
      } else {
        console.error(`❌ ${scriptPath} failed with code ${code}\n`);
        reject(new Error(`Script failed: ${scriptPath}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ Failed to start ${scriptPath}:`, error.message);
      reject(error);
    });
  });
}

// Main setup function
async function completeSetup() {
  try {
    console.log('🎯 Starting Complete Appwrite Setup');
    console.log('====================================');
    
    if (isMultiUser) {
      console.log('🔒 Multi-user mode enabled');
    } else {
      console.log('🔓 Single-user mode (development)');
    }
    
    // Step 1: Database setup
    await runScript('scripts/setup-appwrite-database.js');
    
    // Step 2: Permissions configuration
    const permissionArgs = isMultiUser ? ['--multi-user'] : [];
    await runScript('scripts/configure-permissions.js', permissionArgs);
    
    // Step 3: Verification
    await runScript('scripts/verify-database-setup.js');
    
    console.log('🎉 Complete Setup Finished Successfully!');
    console.log('=======================================');
    console.log('');
    console.log('✅ Database created and configured');
    console.log('✅ Permissions set up');
    console.log('✅ Setup verified');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Test the connection: http://localhost:3000/api/health/appwrite');
    console.log('3. Start building your todo application!');
    console.log('');
    console.log('📚 For more information, see docs/APPWRITE_SETUP.md');
    
  } catch (error) {
    console.error('\n❌ Complete setup failed:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('1. Check your .env file configuration');
    console.error('2. Verify your Appwrite API key permissions');
    console.error('3. Ensure your Appwrite endpoint is accessible');
    console.error('4. Run individual scripts to identify the issue:');
    console.error('   - npm run setup:database');
    console.error('   - npm run setup:permissions');
    console.error('   - npm run verify:database');
    console.error('');
    console.error('📚 See docs/APPWRITE_SETUP.md for detailed troubleshooting');
    process.exit(1);
  }
}

// Run complete setup
completeSetup();
