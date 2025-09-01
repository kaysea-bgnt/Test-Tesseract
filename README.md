# Test-Tesseract OCR Integration

This project integrates Tesseract OCR with the NGR (Nestle GoodNes Rewards) backend system for testing receipt processing, product matching, and points earning functionality.

## Project Structure

```
Test-Tesseract/
├── backend/           # Backend API server
├── client/           # Simple frontend for testing
├── shared/           # Shared utilities and types
└── README.md         # This file
```

## Features

- **Image Upload**: Upload receipt images via file or URL
- **OCR Processing**: Extract text from receipts using Tesseract.js
- **Cloud Storage**: Store images using Cloudinary
- **Product Matching**: Fuzzy search matching with existing products
- **Points Earning**: Calculate and award points based on matched products
- **Receipt Validation**: Validate receipts against store database

## Tech Stack

### Backend

- Node.js with Express
- Tesseract.js for OCR
- Cloudinary for image storage
- Fuse.js for fuzzy search
- MongoDB with Mongoose

### Frontend

- React with TypeScript
- Tailwind CSS for styling
- Axios for API calls

## Getting Started

1. Install dependencies for both backend and client
2. Set up environment variables
3. Start the backend server
4. Start the client application

## Environment Variables

### Backend (.env)

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ngr-test
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Client (.env)

```
VITE_API_URL=http://localhost:3001/api
```

## API Endpoints

- `POST /api/upload` - Upload receipt image
- `POST /api/ocr/process` - Process OCR on image URL
- `GET /api/products` - Get products for matching
- `GET /api/stores` - Get stores for validation
- `POST /api/transactions/process` - Process receipt for points

## Testing Flow

1. Upload receipt image
2. OCR extracts text and structure
3. Match products using fuzzy search
4. Validate store
5. Calculate and award points
6. Return results to user
