# Getting Started

> [!CAUTION]
> This is an experimental UI Console and still under active development.

## Prerequisites

- Node.js (v18 or later)
- Go (v1.20 or later)
- Aerospike Vector Search instance
- asvec CLI (https://github.com/aerospike/asvec)

## How to Run the Application
To run this application, you'll need to:

1. Install dependencies:
   ```shellscript
   npm install
   ```
   
   If you encounter dependency conflicts, use either:
   ```shellscript
   npm install --legacy-peer-deps
   ```
   or
   ```shellscript
   npm install date-fns@2.30.0
   ```

2. Start the Go backend server:
   ```shellscript
   cd server
   go run main.go
   ```

3. Start the Next.js frontend:
   ```shellscript
   npm run dev
   ```

The Go backend will run on port 8080, and the frontend will connect to it using the `NEXT_PUBLIC_API_URL` environment variable.

## Architecture Overview

This implementation follows a client-server architecture:

### Go Backend

- Provides RESTful API endpoints built on top of asvec CLI(https://github.com/aerospike/asvec)
- Handles data processing and business logic 
- Includes proper error handling, debug logging and CORS support

### React Frontend

- Uses React hooks for state management and data fetching
- Implements loading states with skeleton loaders
- Provides error handling for API failures


### Environment Variables & Configuration File

The UI application uses the following environment variable:

\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:8080
\`\`\`

You can set this in a `.env.local` file in the root directory. If not set, the application will default to `http://127.0.0.1:8080`, which works for local development without any configuration.

The server will use the default settings configured in
your `asvec.yaml` file which is located by default at 
`/etc/aerospike/asvec.yaml`

