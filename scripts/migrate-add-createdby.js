#!/usr/bin/env node

/**
 * Migration Script: Add createdBy field to existing todos
 * 
 * This script adds the createdBy attribute to existing todos collections
 * and creates the necessary index for efficient user-based filtering.
 * 
 * Prerequisites:
 * - Node.js installed
 * - Existing Appwrite project with todos collection
 * - Environment variables configured (.env file)
 * 
 * Usage:
 * node scripts/migrate-add-createdby.js
 */

import * as sdk from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Constants from the application
const TODOS_DATABASE_ID = "todo_apps";
const TODOS_COLLECTION_ID = "todos";

// Validate environment variables
function validateEnvironment() {
  const required = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please ensure your .env file is configured correctly.');
    process.exit(1);
  }
}

// Initialize Appwrite client
function initializeAppwrite() {
  const client = new sdk.Client();
  
  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  return {
    databases: new sdk.Databases(client)
  };
}

// Add createdBy attribute
async function addCreatedByAttribute(databases) {
  try {
    console.log('🏗️  Adding createdBy attribute to todos collection...');
    
    const result = await databases.createStringAttribute(
      TODOS_DATABASE_ID,
      TODOS_COLLECTION_ID,
      'createdBy',
      36, // size for Appwrite user ID
      false, // required - false initially for migration
      null, // default
      false // array
    );
    
    console.log('✅ Created createdBy attribute successfully');
    
    // Wait for attribute to be ready
    console.log('⏳ Waiting for attribute to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return result;
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  createdBy attribute already exists');
      return null;
    }
    throw error;
  }
}

// Create index for createdBy
async function createCreatedByIndex(databases) {
  try {
    console.log('🔍 Creating index for createdBy field...');
    
    const result = await databases.createIndex(
      TODOS_DATABASE_ID,
      TODOS_COLLECTION_ID,
      'createdBy_index',
      'key',
      ['createdBy']
    );
    
    console.log('✅ Created createdBy index successfully');
    return result;
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  createdBy index already exists');
      return null;
    }
    throw error;
  }
}

// List existing todos without createdBy
async function listTodosWithoutCreatedBy(databases) {
  try {
    console.log('📋 Checking for todos without createdBy field...');
    
    const result = await databases.listDocuments(
      TODOS_DATABASE_ID,
      TODOS_COLLECTION_ID,
      []
    );
    
    const todosWithoutCreatedBy = result.documents.filter(todo => !todo.createdBy);
    console.log(`📊 Found ${todosWithoutCreatedBy.length} todos without createdBy field`);
    
    return todosWithoutCreatedBy;
  } catch (error) {
    console.error('❌ Error listing todos:', error.message);
    throw error;
  }
}

// Main migration function
async function runMigration() {
  try {
    console.log('🚀 Starting createdBy migration...\n');
    
    // Validate environment
    validateEnvironment();
    
    // Initialize Appwrite
    const { databases } = initializeAppwrite();
    
    // Add createdBy attribute
    await addCreatedByAttribute(databases);
    
    // Create index
    await createCreatedByIndex(databases);
    
    // Check for existing todos
    const todosWithoutCreatedBy = await listTodosWithoutCreatedBy(databases);
    
    if (todosWithoutCreatedBy.length > 0) {
      console.log('\n⚠️  WARNING: Found todos without createdBy field');
      console.log('These todos will not be visible to any user until manually assigned.');
      console.log('Consider running a data migration to assign these todos to appropriate users.');
      console.log('\nTodos without createdBy:');
      todosWithoutCreatedBy.forEach(todo => {
        console.log(`  - ID: ${todo.$id}, Text: "${todo.text}"`);
      });
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your application code to use the createdBy field');
    console.log('2. Consider assigning existing todos to appropriate users');
    console.log('3. Test the user-based filtering functionality');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Please check your Appwrite configuration and try again.');
    process.exit(1);
  }
}

// Run migration
runMigration();
