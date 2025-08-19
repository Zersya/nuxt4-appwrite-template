# Appwrite Database Setup Guide

This guide provides comprehensive instructions for setting up and configuring the Appwrite database for the Todos application.

## Prerequisites

- Node.js 18+ installed
- An Appwrite account (cloud or self-hosted)
- Appwrite project created
- API key with appropriate permissions

## Quick Setup

### 1. Environment Configuration

Copy the example environment file and configure your Appwrite settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your Appwrite configuration:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id-here
APPWRITE_API_KEY=your-api-key-here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Database Setup

```bash
# Create database, collections, attributes, indexes, and storage bucket
npm run setup:database

# Configure permissions (optional - choose single-user or multi-user)
npm run setup:permissions

# For multi-user setup:
npm run setup:permissions -- --multi-user

# Verify setup is correct
npm run verify:database
```

### 4. Test Connection

Start the development server and test the connection:

```bash
npm run dev
```

Visit: http://localhost:3000/api/health/appwrite

## Database Structure

### Database: `todo_apps`

The application uses a single database with the following structure:

### Collection: `todos`

| Attribute | Type | Required | Array | Default | Description |
|-----------|------|----------|-------|---------|-------------|
| `text` | string | ✅ | ❌ | - | Todo item text content |
| `completed` | boolean | ✅ | ❌ | `false` | Completion status |
| `children` | string | ❌ | ✅ | - | Array of child todo IDs |
| `expanded` | boolean | ❌ | ❌ | `false` | UI expansion state |
| `priority` | enum | ❌ | ❌ | `low` | Priority level (low/medium/high) |
| `dueDate` | datetime | ❌ | ❌ | - | Due date for the todo |
| `createdAt` | datetime | ❌ | ❌ | - | Creation timestamp |
| `updatedAt` | datetime | ❌ | ❌ | - | Last update timestamp |

### Indexes

- `completed_index` - For filtering by completion status
- `priority_index` - For sorting by priority
- `dueDate_index` - For sorting by due date
- `createdAt_index` - For sorting by creation date
- `text_search` - Full-text search on todo text

### Storage Bucket: `todo_files`

For file attachments with the following configuration:
- Allowed extensions: jpg, jpeg, png, gif, pdf, doc, docx, txt
- No compression
- No encryption
- No antivirus scanning

## Permission Configurations

### Single-User Mode (Default)

- Open access for all operations
- No authentication required
- Suitable for development and single-user deployments

```javascript
permissions: [
  'read("any")',
  'create("any")',
  'update("any")',
  'delete("any")'
]
```

### Multi-User Mode

- User-specific access control
- Authentication required
- Document-level permissions

```javascript
// Collection permissions
permissions: [
  'read("any")',
  'create("users")',
  'update("users")',
  'delete("users")'
]

// Document permissions (set when creating todos)
permissions: [
  'read("user:USER_ID")',
  'update("user:USER_ID")',
  'delete("user:USER_ID")'
]
```

## API Key Permissions

Your Appwrite API key must have the following permissions:

- `databases.read`
- `databases.write`
- `collections.read`
- `collections.write`
- `documents.read`
- `documents.write`
- `files.read`
- `files.write`

## Manual Setup (Alternative)

If you prefer to set up manually through the Appwrite console:

### 1. Create Database

1. Go to your Appwrite console
2. Navigate to Databases
3. Click "Create Database"
4. Set Database ID: `todo_apps`
5. Set Name: `Todo Apps Database`

### 2. Create Collection

1. Inside the database, click "Create Collection"
2. Set Collection ID: `todos`
3. Set Name: `Todos Collection`
4. Enable "Document Security"

### 3. Add Attributes

Add the following attributes in order:

```javascript
// String attributes
text: { type: 'string', size: 1000, required: true }

// Boolean attributes
completed: { type: 'boolean', required: true, default: false }
expanded: { type: 'boolean', required: false, default: false }

// Array attributes
children: { type: 'string', size: 36, required: false, array: true }

// Enum attributes
priority: { type: 'enum', elements: ['low', 'medium', 'high'], required: false, default: 'low' }

// DateTime attributes
dueDate: { type: 'datetime', required: false }
createdAt: { type: 'datetime', required: false }
updatedAt: { type: 'datetime', required: false }
```

### 4. Create Indexes

Add the following indexes:

- `completed_index`: key index on `completed`
- `priority_index`: key index on `priority`
- `dueDate_index`: key index on `dueDate`
- `createdAt_index`: key index on `createdAt`
- `text_search`: fulltext index on `text`

### 5. Create Storage Bucket

1. Navigate to Storage
2. Click "Create Bucket"
3. Set Bucket ID: `todo_files`
4. Set Name: `Todo Files Bucket`
5. Configure allowed file extensions: jpg, jpeg, png, gif, pdf, doc, docx, txt

## Troubleshooting

### Common Issues

1. **SSL Certificate Error**
   - Ensure your Appwrite endpoint is correct
   - For self-hosted instances, verify SSL certificate is valid

2. **Permission Denied**
   - Check your API key has the required permissions
   - Verify the API key is not expired

3. **Collection Not Found**
   - Ensure database and collection IDs match the constants
   - Run the verification script: `npm run verify:database`

4. **Attribute Creation Failed**
   - Attributes must be created in the correct order
   - Some attributes depend on others being created first

### Verification Commands

```bash
# Test Appwrite connection
npm run dev
curl http://localhost:3000/api/health/appwrite

# Verify complete database setup
npm run verify:database

# Check specific components
node -e "
const { databases } = require('./server/utils/appwrite.js');
databases.get('todo_apps').then(console.log).catch(console.error);
"
```

## Migration Scripts

For existing data migration or schema updates, see the `scripts/` directory:

- `setup-appwrite-database.js` - Complete database setup
- `configure-permissions.js` - Permission configuration
- `verify-database-setup.js` - Setup verification

## Production Deployment

### Security Checklist

- [ ] Use environment variables for all sensitive configuration
- [ ] Enable multi-user mode if needed
- [ ] Set appropriate collection and document permissions
- [ ] Use HTTPS endpoints only
- [ ] Regularly rotate API keys
- [ ] Monitor database usage and performance

### Performance Optimization

- [ ] Verify all necessary indexes are created
- [ ] Monitor query performance
- [ ] Set appropriate file size limits for storage
- [ ] Enable compression for large files if needed

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run the verification script
3. Review Appwrite console logs
4. Check the application logs for detailed error messages

For more information, visit the [Appwrite Documentation](https://appwrite.io/docs).
