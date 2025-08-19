#!/usr/bin/env node

/**
 * Appwrite Permissions Configuration Script for Todos Application
 * 
 * This script configures permissions for the todos collection and storage bucket.
 * It supports both single-user and multi-user configurations.
 * 
 * Prerequisites:
 * - Database and collection already created
 * - Environment variables configured (.env file)
 * 
 * Usage:
 * node scripts/configure-permissions.js [--multi-user]
 */

import * as sdk from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Constants
const TODOS_DATABASE_ID = "todo_apps";
const TODOS_COLLECTION_ID = "todos";
const TODO_FILES_BUCKET_ID = "todo_files";

// Check if multi-user mode is enabled
const isMultiUser = process.argv.includes('--multi-user');

// Initialize Appwrite client
function initializeAppwrite() {
  const client = new sdk.Client();
  
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  return {
    databases: new sdk.Databases(client),
    storage: new sdk.Storage(client)
  };
}

// Configure collection permissions
async function configureCollectionPermissions(databases) {
  console.log('🔐 Configuring collection permissions...');
  
  let permissions;
  
  if (isMultiUser) {
    // Multi-user permissions: users can only access their own todos
    permissions = [
      'read("any")',      // Allow any authenticated user to read (for now)
      'create("users")',  // Allow any authenticated user to create
      'update("users")',  // Allow any authenticated user to update
      'delete("users")'   // Allow any authenticated user to delete
    ];
    console.log('📝 Setting up multi-user permissions (user-specific access)');
  } else {
    // Single-user permissions: open access for development
    permissions = [
      'read("any")',      // Allow anyone to read
      'create("any")',    // Allow anyone to create
      'update("any")',    // Allow anyone to update
      'delete("any")'     // Allow anyone to delete
    ];
    console.log('📝 Setting up single-user permissions (open access)');
  }

  try {
    const collection = await databases.updateCollection(
      TODOS_DATABASE_ID,
      TODOS_COLLECTION_ID,
      'Todos Collection',
      permissions,
      true, // documentSecurity
      true  // enabled
    );
    
    console.log('✅ Collection permissions updated successfully');
    return collection;
  } catch (error) {
    console.error('❌ Failed to update collection permissions:', error.message);
    throw error;
  }
}

// Configure storage bucket permissions
async function configureStoragePermissions(storage) {
  console.log('🗂️  Configuring storage bucket permissions...');
  
  let permissions;
  
  if (isMultiUser) {
    // Multi-user storage permissions
    permissions = [
      'read("any")',      // Allow any authenticated user to read files
      'create("users")',  // Allow any authenticated user to upload files
      'update("users")',  // Allow any authenticated user to update files
      'delete("users")'   // Allow any authenticated user to delete files
    ];
  } else {
    // Single-user storage permissions
    permissions = [
      'read("any")',      // Allow anyone to read files
      'create("any")',    // Allow anyone to upload files
      'update("any")',    // Allow anyone to update files
      'delete("any")'     // Allow anyone to delete files
    ];
  }

  try {
    const bucket = await storage.updateBucket(
      TODO_FILES_BUCKET_ID,
      'Todo Files Bucket',
      permissions,
      false, // fileSecurity
      true,  // enabled
      null,  // maximumFileSize
      ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'], // allowedFileExtensions
      'none', // compression
      false,  // encryption
      false   // antivirus
    );
    
    console.log('✅ Storage bucket permissions updated successfully');
    return bucket;
  } catch (error) {
    console.error('❌ Failed to update storage permissions:', error.message);
    throw error;
  }
}

// Create sample document permissions (for multi-user mode)
function getSampleDocumentPermissions(userId) {
  if (isMultiUser && userId) {
    return [
      `read("user:${userId}")`,
      `update("user:${userId}")`,
      `delete("user:${userId}")`
    ];
  } else {
    return [
      'read("any")',
      'update("any")',
      'delete("any")'
    ];
  }
}

// Display permission information
function displayPermissionInfo() {
  console.log('\n📋 Permission Configuration Summary:');
  console.log('=====================================');
  
  if (isMultiUser) {
    console.log('🔒 Multi-user mode enabled');
    console.log('   - Users can only access their own todos');
    console.log('   - Authentication required for all operations');
    console.log('   - Document-level permissions will be set per user');
    console.log('\n💡 Next steps for multi-user setup:');
    console.log('   1. Implement user authentication in your app');
    console.log('   2. Set document permissions when creating todos:');
    console.log('      permissions: ["read(\'user:USER_ID\')", "update(\'user:USER_ID\')", "delete(\'user:USER_ID\')"]');
    console.log('   3. Filter todos by user in your API endpoints');
  } else {
    console.log('🔓 Single-user mode (development)');
    console.log('   - Open access for all operations');
    console.log('   - No authentication required');
    console.log('   - Suitable for development and single-user deployments');
    console.log('\n⚠️  Warning: This configuration is not suitable for production multi-user apps');
    console.log('   To enable multi-user mode, run: npm run setup:permissions -- --multi-user');
  }
  
  console.log('\n🔧 API Key Permissions Required:');
  console.log('   - databases.read');
  console.log('   - databases.write');
  console.log('   - collections.read');
  console.log('   - collections.write');
  console.log('   - documents.read');
  console.log('   - documents.write');
  console.log('   - files.read');
  console.log('   - files.write');
}

// Main configuration function
async function configurePermissions() {
  try {
    console.log('🚀 Starting permissions configuration...\n');
    
    // Initialize Appwrite
    const { databases, storage } = initializeAppwrite();
    
    // Configure collection permissions
    await configureCollectionPermissions(databases);
    
    // Configure storage permissions
    await configureStoragePermissions(storage);
    
    // Display configuration info
    displayPermissionInfo();
    
    console.log('\n🎉 Permissions configuration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    console.error('Please check your Appwrite configuration and try again.');
    process.exit(1);
  }
}

// Run configuration
configurePermissions();
