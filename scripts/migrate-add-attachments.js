#!/usr/bin/env node

/**
 * Migration Script: Add attachments field to existing todos
 * 
 * This script adds the attachments attribute to existing todos collections
 * to support file attachments functionality.
 * 
 * Prerequisites:
 * - Node.js installed
 * - Existing Appwrite project with todos collection
 * - Environment variables configured (.env file)
 * 
 * Usage:
 * node scripts/migrate-add-attachments.js
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

  const databases = new sdk.Databases(client);
  
  return { databases };
}

// Add attachments attribute
async function addAttachmentsAttribute(databases) {
  try {
    console.log('🏗️  Adding attachments attribute to todos collection...');
    
    const result = await databases.createStringAttribute(
      TODOS_DATABASE_ID,
      TODOS_COLLECTION_ID,
      'attachments',
      65535, // Large size for JSON array storage
      false, // not required - todos can exist without attachments
      '[]', // default empty array
      false // not an array attribute (we store JSON)
    );
    
    console.log('✅ Created attachments attribute successfully');
    
    // Wait for attribute to be ready
    console.log('⏳ Waiting for attribute to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return result;
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  attachments attribute already exists');
      return null;
    }
    throw error;
  }
}

// Check existing todos
async function checkExistingTodos(databases) {
  try {
    console.log('📋 Checking existing todos...');
    
    const result = await databases.listDocuments(
      TODOS_DATABASE_ID,
      TODOS_COLLECTION_ID,
      []
    );
    
    console.log(`📊 Found ${result.documents.length} existing todos`);
    
    // Check if any todos already have attachments
    const todosWithAttachments = result.documents.filter(todo => 
      todo.attachments && todo.attachments !== '[]'
    );
    
    console.log(`📎 ${todosWithAttachments.length} todos already have attachments`);
    
    return result.documents;
  } catch (error) {
    console.error('❌ Error checking todos:', error.message);
    throw error;
  }
}

// Main migration function
async function runMigration() {
  try {
    console.log('🚀 Starting attachments migration...\n');
    
    // Validate environment
    validateEnvironment();
    
    // Initialize Appwrite
    const { databases } = initializeAppwrite();
    
    // Add attachments attribute
    await addAttachmentsAttribute(databases);
    
    // Check existing todos
    await checkExistingTodos(databases);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📝 The attachments field has been added to the todos collection.');
    console.log('🔧 Existing todos will have an empty attachments array by default.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.code) {
      console.error(`Appwrite Error Code: ${error.code}`);
    }
    
    if (error.response) {
      console.error('Response:', error.response);
    }
    
    process.exit(1);
  }
}

// Run the migration
runMigration();
