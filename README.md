# Todos App with Nuxt.js & Appwrite

A modern todo application built with Nuxt.js 4 and Appwrite backend.

## Prerequisites

- Node.js 18+
- An Appwrite account (cloud or self-hosted)
- Appwrite project with a database and collection set up

## Setup

### 1. Install Dependencies

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### 2. Configure Environment Variables

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

**Important:**
- For Appwrite Cloud, use `https://cloud.appwrite.io/v1` as the endpoint
- Create a server-side API key in your Appwrite console with database read/write permissions

### 3. Set Up Appwrite Database

Run the automated database setup:

```bash
# Install dependencies
npm install

# Create database, collections, attributes, and indexes
npm run setup:database

# Configure permissions (optional)
npm run setup:permissions

# Verify setup
npm run verify:database
```

For detailed setup instructions, see [docs/APPWRITE_SETUP.md](docs/APPWRITE_SETUP.md)

### 4. Test Appwrite Connection

You can test your Appwrite configuration by visiting the health check endpoint after starting the development server:

```
http://localhost:3000/api/health/appwrite
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Appwrite Setup

### Database Structure

This application uses the following Appwrite database structure:

- **Database ID:** `todo_apps`
- **Collection ID:** `todos`
- **Storage Bucket ID:** `todo_files`

For complete database schema and setup instructions, see [docs/APPWRITE_SETUP.md](docs/APPWRITE_SETUP.md)

### API Key Permissions

Your Appwrite API key should have the following permissions:
- `databases.read`
- `databases.write`
- `collections.read`
- `collections.write`
- `documents.read`
- `documents.write`
- `files.read`
- `files.write`

For detailed permission configuration, see [docs/APPWRITE_SETUP.md](docs/APPWRITE_SETUP.md)

## Troubleshooting

### Common Issues

1. **"Cannot read properties of undefined (reading 'startsWith')"**
   - This error occurs when Appwrite environment variables are not set
   - Make sure you've copied `.env.example` to `.env` and filled in your values

2. **"Appwrite endpoint is not configured"**
   - Check that `APPWRITE_ENDPOINT` is set in your `.env` file
   - Verify the endpoint URL is correct (include `/v1` at the end)

3. **"Failed to fetch todos"**
   - Verify your Appwrite project ID and API key are correct
   - Check that your database and collection exist with the correct IDs
   - Test the connection using `/api/health/appwrite`

### Health Check

Visit `http://localhost:3000/api/health/appwrite` to test your Appwrite configuration. This endpoint will verify:
- Environment variables are properly set
- Connection to Appwrite is successful
- API key has proper permissions
