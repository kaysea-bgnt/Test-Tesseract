# Test-Tesseract Setup Instructions

This guide will help you set up and run the Test-Tesseract OCR integration project.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for image storage)
- Git

## Quick Start

### 1. Clone and Setup

```bash
# Navigate to the Test-Tesseract directory
cd Test-Tesseract

# Install backend dependencies
cd backend
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration

#### Backend (.env)

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ngr-test

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=ngr-test

# Client Configuration
CLIENT_URL=http://localhost:5173
```

#### Client (.env)

Create a `.env` file in the `client` directory:

```bash
cd client
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

### 3. Database Setup

#### Option A: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Create database: `ngr-test`

#### Option B: MongoDB Atlas (Cloud)

1. Create a MongoDB Atlas account
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in backend `.env`

### 4. Cloudinary Setup

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from the dashboard:
   - Cloud Name
   - API Key
   - API Secret
3. Update the backend `.env` file with your credentials

### 5. Seed Database

Run the seed script to populate the database with test data:

```bash
cd backend
node scripts/seedData.js
```

This will create:

- Test user (ID will be displayed)
- Sample brands (Nestle, Coca-Cola, etc.)
- Sample products with points
- Sample stores (SM Hypermarket, etc.)

### 6. Start the Application

#### Terminal 1: Backend

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

#### Terminal 2: Client

```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173`

## Testing the Application

### 1. Access the Application

Open your browser and go to `http://localhost:5173`

### 2. Test User

Use the test user ID that was displayed when you ran the seed script, or use the default:

- **User ID**: `testuser` (or the ID from seed output)
- **Email**: `test@example.com`

### 3. Test Receipt Upload

#### Option A: File Upload

1. Go to the "Upload File" tab
2. Select a receipt image (PNG, JPG, JPEG, WebP)
3. Click "Upload & Process"
4. View results in the "Results" tab

#### Option B: Image URL

1. Go to the "Image URL" tab
2. Enter a public image URL of a receipt
3. Click "Process OCR"
4. View results in the "Results" tab

### 4. Sample Receipt Images

You can test with:

- Receipt images from SM Hypermarket, Robinsons, etc.
- Images containing product names like "Milo", "Coca-Cola", "Dove"
- Any receipt with clear text and prices

## API Endpoints

### Health Check

- `GET /api/health` - Server health status

### Upload & OCR

- `POST /api/upload` - Upload receipt image
- `POST /api/upload/url` - Process OCR from image URL
- `POST /api/ocr/process` - Direct OCR processing

### Products

- `GET /api/products` - List products
- `POST /api/products` - Create product
- `POST /api/products/match` - Test product matching

### Stores

- `GET /api/stores` - List stores
- `POST /api/stores` - Create store
- `POST /api/stores/match` - Test store matching

### Transactions

- `GET /api/transactions` - List transactions
- `POST /api/transactions/earn` - Award points manually
- `GET /api/transactions/user/:userId` - User transaction history

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error

```
❌ MongoDB connection error: connect ECONNREFUSED
```

**Solution**: Ensure MongoDB is running and the connection string is correct.

#### 2. Cloudinary Upload Error

```
❌ Cloudinary Upload Error: Invalid cloud_name
```

**Solution**: Check your Cloudinary credentials in the `.env` file.

#### 3. CORS Error

```
Access to fetch at 'http://localhost:3001/api/upload' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution**: Ensure the backend is running and CORS is properly configured.

#### 4. File Upload Error

```
❌ Upload error: No file uploaded
```

**Solution**: Check that the file is selected and the form data is properly formatted.

### Debug Mode

To enable debug logging, set `NODE_ENV=development` in the backend `.env` file.

### Logs

Check the console output for:

- Backend: Terminal running `npm run dev`
- Client: Browser developer tools console

## Project Structure

```
Test-Tesseract/
├── backend/                 # Backend API server
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── scripts/            # Database scripts
│   └── server.js           # Main server file
├── client/                 # React frontend
│   ├── src/
│   │   ├── api.ts          # API client
│   │   ├── types.ts        # TypeScript types
│   │   └── App.tsx         # Main component
│   └── package.json
└── README.md               # Project documentation
```

## Next Steps

1. **Add More Products**: Use the API to add more products to the database
2. **Test Different Receipts**: Try various receipt formats and stores
3. **Customize Matching**: Adjust fuzzy search thresholds in the services
4. **Add Authentication**: Implement user authentication and authorization
5. **Deploy**: Deploy to production environment

## Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all services (MongoDB, backend, client) are running
4. Check the API endpoints with a tool like Postman
