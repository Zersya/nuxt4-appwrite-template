#!/usr/bin/env node

/**
 * Appwrite Database Verification Script for Todos Application
 * 
 * This script verifies that the database setup is correct and compatible
 * with the existing application code.
 * 
 * Prerequisites:
 * - Database setup completed
 * - Environment variables configured (.env file)
 * 
 * Usage:
 * node scripts/verify-database-setup.js
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

// Expected attributes
const EXPECTED_ATTRIBUTES = [
  { key: 'text', type: 'string', required: true },
  { key: 'completed', type: 'boolean', required: true },
  { key: 'children', type: 'string', required: false, array: true },
  { key: 'expanded', type: 'boolean', required: false },
  { key: 'priority', type: 'enum', required: false },
  { key: 'dueDate', type: 'datetime', required: false },
  { key: 'createdAt', type: 'datetime', required: false },
  { key: 'updatedAt', type: 'datetime', required: false }
];

// Expected indexes
const EXPECTED_INDEXES = [
  'completed_index',
  'priority_index',
  'dueDate_index',
  'createdAt_index',
  'text_search'
];

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

// Verify database exists
async function verifyDatabase(databases) {
  console.log('🔍 Verifying database...');
  
  try {
    const database = await databases.get(TODOS_DATABASE_ID);
    console.log(`✅ Database found: ${database.name} (${database.$id})`);
    console.log(`   Status: ${database.enabled ? 'Enabled' : 'Disabled'}`);
    return true;
  } catch (error) {
    console.error(`❌ Database not found: ${TODOS_DATABASE_ID}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Verify collection exists
async function verifyCollection(databases) {
  console.log('🔍 Verifying collection...');
  
  try {
    const collection = await databases.getCollection(TODOS_DATABASE_ID, TODOS_COLLECTION_ID);
    console.log(`✅ Collection found: ${collection.name} (${collection.$id})`);
    console.log(`   Status: ${collection.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Document Security: ${collection.documentSecurity ? 'Enabled' : 'Disabled'}`);
    return collection;
  } catch (error) {
    console.error(`❌ Collection not found: ${TODOS_COLLECTION_ID}`);
    console.error(`   Error: ${error.message}`);
    return null;
  }
}

// Verify attributes
async function verifyAttributes(databases) {
  console.log('🔍 Verifying attributes...');
  
  try {
    const attributes = await databases.listAttributes(TODOS_DATABASE_ID, TODOS_COLLECTION_ID);
    
    let allAttributesValid = true;
    
    for (const expected of EXPECTED_ATTRIBUTES) {
      const found = attributes.attributes.find(attr => attr.key === expected.key);
      
      if (!found) {
        console.error(`❌ Missing attribute: ${expected.key}`);
        allAttributesValid = false;
        continue;
      }
      
      // Verify attribute properties
      const issues = [];
      if (found.type !== expected.type) {
        issues.push(`type mismatch (expected: ${expected.type}, found: ${found.type})`);
      }
      if (found.required !== expected.required) {
        issues.push(`required mismatch (expected: ${expected.required}, found: ${found.required})`);
      }
      if (expected.array && found.array !== expected.array) {
        issues.push(`array mismatch (expected: ${expected.array}, found: ${found.array})`);
      }
      
      if (issues.length > 0) {
        console.error(`❌ Attribute ${expected.key}: ${issues.join(', ')}`);
        allAttributesValid = false;
      } else {
        console.log(`✅ Attribute ${expected.key}: ${found.type}${found.array ? '[]' : ''} (${found.required ? 'required' : 'optional'})`);
      }
    }
    
    return allAttributesValid;
  } catch (error) {
    console.error('❌ Failed to verify attributes:', error.message);
    return false;
  }
}

// Verify indexes
async function verifyIndexes(databases) {
  console.log('🔍 Verifying indexes...');
  
  try {
    const indexes = await databases.listIndexes(TODOS_DATABASE_ID, TODOS_COLLECTION_ID);
    
    let allIndexesValid = true;
    
    for (const expectedIndex of EXPECTED_INDEXES) {
      const found = indexes.indexes.find(index => index.key === expectedIndex);
      
      if (!found) {
        console.error(`❌ Missing index: ${expectedIndex}`);
        allIndexesValid = false;
      } else {
        console.log(`✅ Index ${expectedIndex}: ${found.type} (${found.attributes.join(', ')})`);
      }
    }
    
    return allIndexesValid;
  } catch (error) {
    console.error('❌ Failed to verify indexes:', error.message);
    return false;
  }
}

// Verify storage bucket
async function verifyStorageBucket(storage) {
  console.log('🔍 Verifying storage bucket...');
  
  try {
    const bucket = await storage.getBucket(TODO_FILES_BUCKET_ID);
    console.log(`✅ Storage bucket found: ${bucket.name} (${bucket.$id})`);
    console.log(`   Status: ${bucket.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   File Security: ${bucket.fileSecurity ? 'Enabled' : 'Disabled'}`);
    console.log(`   Allowed Extensions: ${bucket.allowedFileExtensions.join(', ')}`);
    return true;
  } catch (error) {
    console.error(`❌ Storage bucket not found: ${TODO_FILES_BUCKET_ID}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Test basic operations
async function testBasicOperations(databases) {
  console.log('🔍 Testing basic operations...');
  
  try {
    // Test listing documents (should work even if empty)
    const documents = await databases.listDocuments(TODOS_DATABASE_ID, TODOS_COLLECTION_ID);
    console.log(`✅ List documents: ${documents.total} documents found`);
    
    // Test creating a sample document
    const sampleTodo = {
      text: 'Test todo for verification',
      completed: false,
      priority: 'low',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const created = await databases.createDocument(
      TODOS_DATABASE_ID,
      TODOS_COLLECTION_ID,
      sdk.ID.unique(),
      sampleTodo
    );
    
    console.log(`✅ Create document: ${created.$id}`);
    
    // Test updating the document
    const updated = await databases.updateDocument(
      TODOS_DATABASE_ID,
      TODOS_COLLECTION_ID,
      created.$id,
      { completed: true, updatedAt: new Date().toISOString() }
    );
    
    console.log(`✅ Update document: ${updated.$id}`);
    
    // Test deleting the document
    await databases.deleteDocument(TODOS_DATABASE_ID, TODOS_COLLECTION_ID, created.$id);
    console.log(`✅ Delete document: ${created.$id}`);
    
    return true;
  } catch (error) {
    console.error('❌ Basic operations test failed:', error.message);
    return false;
  }
}

// Main verification function
async function verifySetup() {
  try {
    console.log('🚀 Starting database setup verification...\n');
    
    // Initialize Appwrite
    const { databases, storage } = initializeAppwrite();
    
    let allChecksPass = true;
    
    // Verify database
    if (!await verifyDatabase(databases)) {
      allChecksPass = false;
    }
    
    console.log('');
    
    // Verify collection
    const collection = await verifyCollection(databases);
    if (!collection) {
      allChecksPass = false;
    }
    
    console.log('');
    
    // Verify attributes
    if (!await verifyAttributes(databases)) {
      allChecksPass = false;
    }
    
    console.log('');
    
    // Verify indexes
    if (!await verifyIndexes(databases)) {
      allChecksPass = false;
    }
    
    console.log('');
    
    // Verify storage bucket
    if (!await verifyStorageBucket(storage)) {
      allChecksPass = false;
    }
    
    console.log('');
    
    // Test basic operations
    if (!await testBasicOperations(databases)) {
      allChecksPass = false;
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (allChecksPass) {
      console.log('🎉 All verification checks passed!');
      console.log('✅ Your Appwrite database is properly configured');
      console.log('✅ Compatible with the existing application code');
      console.log('\n🚀 You can now start your application:');
      console.log('   npm run dev');
      console.log('   Visit: http://localhost:3000/api/health/appwrite');
    } else {
      console.log('❌ Some verification checks failed');
      console.log('🔧 Please run the setup script to fix issues:');
      console.log('   npm run setup:database');
      console.log('   npm run setup:permissions');
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('Please check your Appwrite configuration and try again.');
    process.exit(1);
  }
}

// Run verification
verifySetup();
