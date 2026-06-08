# JOBOOK MongoDB Setup Guide

## Overview
This application uses **MongoDB Atlas (NoSQL)** for its database backend.

## Architecture
```
┌─────────────────┐
│  React Frontend │ (localhost:5173)
└────────┬────────┘
         │
         │ REST API Calls
         │
┌────────▼────────┐
│ Express Backend │ (localhost:5000)
│  MongoDB API    │
└────────┬────────┘
         │
         │ MongoDB Driver
         │
┌────────▼──────────────────┐
│  MongoDB Atlas (Cloud)    │
│  (NoSQL Database)         │
└───────────────────────────┘
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Update `.env` File
Your `.env` file has been pre-configured with:
```env
VITE_MONGODB_URI=mongodb+srv://kjindus70_db_user:uALKglfkapiXXYeW@jobook.fomlauf.mongodb.net/jobook?retryWrites=true&w=majority
VITE_MONGODB_DB=jobook
VITE_DATABASE_MODE=mongodb
```

✅ Connection string is already set!

### 3. Run MongoDB API Server

**Option A: Run Together**
```bash
npm run dev:all
```
This starts both Vite (frontend) and Express (backend MongoDB API) simultaneously.

**Option B: Run Separately**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - MongoDB API Backend:
```bash
npm run dev:mongo
```

### 4. Verify Connection

Once running, check:
- Frontend: http://localhost:5173
- MongoDB API Health: http://localhost:5000/health

## Collections (Tables)

MongoDB automatically creates these collections:
- `rooms` - Room booking resources
- `bookings` - Booking records
- `time_slots` - Available time slots

## Authentication

- ✅ Managed authentication (MongoDB / Local Auth)
- ✅ NoSQL flexibility (MongoDB)
- ✅ No backend server setup complexity (REST API)

## Database Operations

### From Frontend Components
Components can now use MongoDB services:

```javascript
import mongoDbService from '@/services/mongoDbService';
const { bookingService } = mongoDbService;

// Get all bookings
const { data, error } = await bookingService.getAllBookings();

// Create booking
await bookingService.createBooking({
  user_id: userId,
  room_id: roomId,
  slot_id: slotId,
  date: new Date()
});
```

## Data Models

### Room Document
```javascript
{
  _id: ObjectId,
  name: "VIDEO EDITING ROOM",
  capacity: 10,
  floor: "MCA BLOCK",
  building: "MCA BLOCK",
  type: "Video Editing",
  emoji: "🎬",
  available: true,
  created_at: Date
}
```

### Booking Document
```javascript
{
  _id: ObjectId,
  user_id: "uuid",
  room_id: "ObjectId",
  slot_id: "ObjectId",
  date: Date,
  status: "pending|confirmed|completed|cancelled",
  notes: "Optional notes",
  created_at: Date,
  updated_at: Date
}
```

## Troubleshooting

### MongoDB Connection Fails
- Verify IP address is whitelisted in MongoDB Atlas
- Check connection string in `.env`
- Ensure MongoDB Atlas cluster is running

### API Server Won't Start
- Check if port 5000 is available
- Run `npm install` to ensure Express/CORS installed

### Collections Not Created
- Collections auto-create on first API call
- Check browser console for error messages

## Performance Notes

- MongoDB is faster for NoSQL queries
- API responses include related documents (auto-joined)
- Consider indexing frequently queried fields for production

## Next Steps

1. ✅ Start the development servers
2. ✅ Test login functionality
3. ✅ Create a booking to test write operations
4. ✅ Verify data persists in MongoDB Atlas

Enjoy your NoSQL workflow! 🎉
