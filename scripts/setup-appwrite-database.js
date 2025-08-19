#!/usr/bin/env node

/**
 * Appwrite Database Setup Script for Todos Application
 * 
 * This script creates the necessary database structure for the todos application
 * including database, collections, attributes, indexes, and storage bucket.
 * 
 * Prerequisites:
 * - Node.js installed
 * - Appwrite project created
 * - Environment variables configured (.env file)
 * 
 * Usage:
 * node scripts/setup-appwrite-database.js
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
const TODO_FILES_BUCKET_ID = "todo_files";

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
    databases: new sdk.Databases(client),
    storage: new sdk.Storage(client)
  };
}

// Create database
async function createDatabase(databases) {
  try {
    console.log('📊 Creating database:', TODOS_DATABASE_ID);
    
    const database = await databases.create(
      TODOS_DATABASE_ID,
      'Todo Apps Database',
      true // enabled
    );
    
    console.log('✅ Database created successfully:', database.name);
    return database;
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  Database already exists:', TODOS_DATABASE_ID);
      return await databases.get(TODOS_DATABASE_ID);
    }
    throw error;
  }
}

// Create collection
async function createCollection(databases) {
  try {
    console.log('📋 Creating collection:', TODOS_COLLECTION_ID);
    
    const collection = await databases.createCollection(
      TODOS_DATABASE_ID,
      TODOS_COLLECTION_ID,
      'Todos Collection',
      [], // permissions - will be set later
      true, // documentSecurity
      true  // enabled
    );
    
    console.log('✅ Collection created successfully:', collection.name);
    return collection;
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  Collection already exists:', TODOS_COLLECTION_ID);
      return await databases.getCollection(TODOS_DATABASE_ID, TODOS_COLLECTION_ID);
    }
    throw error;
  }
}

// Create attributes
async function createAttributes(databases) {
  console.log('🏗️  Creating collection attributes...');
  
  const attributes = [
    {
      key: 'text',
      type: 'string',
      size: 1000,
      required: true,
      default: null,
      array: false
    },
    {
      key: 'completed',
      type: 'boolean',
      required: true,
      array: false
    },
    {
      key: 'children',
      type: 'string',
      size: 36,
      required: false,
      default: null,
      array: true
    },
    {
      key: 'expanded',
      type: 'boolean',
      required: false,
      array: false
    },
    {
      key: 'priority',
      type: 'enum',
      elements: ['low', 'medium', 'high'],
      required: false,
      default: 'low',
      array: false
    },
    {
      key: 'dueDate',
      type: 'datetime',
      required: false,
      default: null,
      array: false
    },
    {
      key: 'createdAt',
      type: 'datetime',
      required: false,
      default: null,
      array: false
    },
    {
      key: 'updatedAt',
      type: 'datetime',
      required: false,
      default: null,
      array: false
    },
    {
      key: 'createdBy',
      type: 'string',
      size: 36,
      required: false,
      default: null,
      array: false
    }
  ];

  for (const attr of attributes) {
    try {
      let result;
      
      switch (attr.type) {
        case 'string':
          result = await databases.createStringAttribute(
            TODOS_DATABASE_ID,
            TODOS_COLLECTION_ID,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array
          );
          break;
          
        case 'boolean':
          result = await databases.createBooleanAttribute(
            TODOS_DATABASE_ID,
            TODOS_COLLECTION_ID,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
          break;
          
        case 'enum':
          result = await databases.createEnumAttribute(
            TODOS_DATABASE_ID,
            TODOS_COLLECTION_ID,
            attr.key,
            attr.elements,
            attr.required,
            attr.default,
            attr.array
          );
          break;
          
        case 'datetime':
          result = await databases.createDatetimeAttribute(
            TODOS_DATABASE_ID,
            TODOS_COLLECTION_ID,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
          break;
      }
      
      console.log(`✅ Created attribute: ${attr.key} (${attr.type})`);
      
      // Wait a bit between attribute creation to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      if (error.code === 409) {
        console.log(`ℹ️  Attribute already exists: ${attr.key}`);
      } else {
        console.error(`❌ Failed to create attribute ${attr.key}:`, error.message);
      }
    }
  }
}

// Create indexes
async function createIndexes(databases) {
  console.log('🔍 Creating database indexes...');
  
  const indexes = [
    {
      key: 'completed_index',
      type: 'key',
      attributes: ['completed']
    },
    {
      key: 'priority_index', 
      type: 'key',
      attributes: ['priority']
    },
    {
      key: 'dueDate_index',
      type: 'key', 
      attributes: ['dueDate']
    },
    {
      key: 'createdAt_index',
      type: 'key',
      attributes: ['createdAt']
    },
    {
      key: 'text_search',
      type: 'fulltext',
      attributes: ['text']
    },
    {
      key: 'createdBy_index',
      type: 'key',
      attributes: ['createdBy']
    }
  ];

  for (const index of indexes) {
    try {
      const result = await databases.createIndex(
        TODOS_DATABASE_ID,
        TODOS_COLLECTION_ID,
        index.key,
        index.type,
        index.attributes
      );
      
      console.log(`✅ Created index: ${index.key}`);
      
      // Wait between index creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      if (error.code === 409) {
        console.log(`ℹ️  Index already exists: ${index.key}`);
      } else {
        console.error(`❌ Failed to create index ${index.key}:`, error.message);
      }
    }
  }
}

// Create storage bucket
async function createStorageBucket(storage) {
  try {
    console.log('🗂️  Creating storage bucket:', TODO_FILES_BUCKET_ID);
    
    const bucket = await storage.createBucket(
      TODO_FILES_BUCKET_ID,
      'Todo Files Bucket',
      [], // permissions
      false, // fileSecurity
      false, // enabled
      1, // maximumFileSize
      ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'], // allowedFileExtensions
      'none', // compression
      false, // encryption
      false  // antivirus
    );
    
    console.log('✅ Storage bucket created successfully:', bucket.name);
    return bucket;
  } catch (error) {
    console.error(error);
    if (error.code === 409) {
      console.log('ℹ️  Storage bucket already exists:', TODO_FILES_BUCKET_ID);
      return await storage.getBucket(TODO_FILES_BUCKET_ID);
    }
    throw error;
  }
}

// Main setup function
async function setupDatabase() {
  try {
    console.log('🚀 Starting Appwrite database setup...\n');
    
    // Validate environment
    validateEnvironment();
    
    // Initialize Appwrite
    const { databases, storage } = initializeAppwrite();
    
    // Create database
    await createDatabase(databases);
    
    // Create collection
    await createCollection(databases);
    
    // Create attributes
    await createAttributes(databases);
    
    // Create indexes
    await createIndexes(databases);
    
    // Create storage bucket
    await createStorageBucket(storage);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test the connection: npm run dev && visit http://localhost:3000/api/health/appwrite');
    console.log('2. Start building your todo application!');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('Please check your Appwrite configuration and try again.');
    process.exit(1);
  }
}

// Run setup
setupDatabase();
