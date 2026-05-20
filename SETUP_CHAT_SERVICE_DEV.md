# Chat Service Development Setup

## Overview

The chat service backend is required to run on `localhost:3001` for the frontend to connect properly.

## Prerequisites Checklist

- ✅ Node.js 18+ installed
- ⚠️ MongoDB running (choose ONE option below)
- ⚠️ AWS S3 credentials (optional, for file uploads)

---

## Option 1: Using Docker Compose (Recommended)

### Step 1: Start all services

```bash
cd d:\study-at-school\Projects\nhom\ott-edu

# Start MongoDB and chat-service
docker-compose up mongo-db chat-service
```

### Step 2: Verify MongoDB is running

```bash
# Should see "mongo-db" container running
docker ps | findstr mongo
```

---

## Option 2: Manual Setup (MongoDB locally)

### Step 1: Install MongoDB Community Edition

Download from: https://www.mongodb.com/try/download/community

Or use Chocolatey:

```powershell
choco install mongodb-community
```

### Step 2: Start MongoDB locally

```powershell
# Windows
mongod

# Or if using service:
net start MongoDB
```

### Step 3: Verify MongoDB is running

```powershell
# Should connect successfully
mongosh
```

---

## Starting Chat Service Backend

### Step 1: Install dependencies (if not done)

```bash
cd services\chat-service
npm install
```

### Step 2: Verify .env configuration

File: `services/chat-service/.env`

```env
NODE_ENV=development
CHAT_PORT=3001
MONGO_URI=mongodb://localhost:27017/ott_edu_db
AWS_REGION=us-east-1
AWS_S3_BUCKET=chat-uploads
```

### Step 3: Start the development server

```bash
cd services\chat-service
npm run dev
```

### Expected Output

```
🚀 Server is running on http://localhost:3001
🔌 Socket.IO is ready
✅ MongoDB Connected: localhost
```

---

## Troubleshooting

### Error: "Cannot connect to MongoDB"

**Solution:**

```powershell
# Check if MongoDB is running
netstat -ano | findstr :27017

# If not running, start MongoDB
mongod
```

### Error: "Port 3001 already in use"

**Solution:**

```powershell
# Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Error: "ERR_CONNECTION_REFUSED" in frontend

**Solution:**

1. Verify chat-service is running on port 3001
2. Check frontend .env has correct CHAT_SERVICE_URL
3. Ensure MongoDB is connected

```powershell
# Test API endpoint
curl http://localhost:3001/
# Should return: "API is running..."
```

---

## Verifying Everything Works

### Test 1: Health Check

```powershell
curl http://localhost:3001/
# Expected: "API is running..."
```

### Test 2: API Endpoint (with x-user-id header)

```powershell
curl -H "x-user-id: test-user-123" http://localhost:3001/api/conversations
# Expected: { "data": [] } or existing conversations
```

### Test 3: Socket.IO Connection

Open browser console and check if connected:

```javascript
// Should see successful connection in console
```

---

## Port Configuration

| Service      | Port  | Status          |
| ------------ | ----- | --------------- |
| MongoDB      | 27017 | Must be running |
| Chat Service | 3001  | Must be running |
| Web App      | 3000  | Frontend        |

---

## Development Workflow

1. **Start MongoDB** (choose Option 1 or 2)
2. **Start Chat Service**:
   ```bash
   cd services\chat-service
   npm run dev
   ```
3. **Start Web App** (in separate terminal):
   ```bash
   cd apps\web-app
   npm run dev
   ```
4. **Access UI**: http://localhost:3000

---

## Logs & Debugging

### View Chat Service Logs

```bash
# Terminal should show real-time logs from chat-service
# Look for connection errors, database issues, etc.
```

### Enable Verbose Logging

In `services/chat-service/.env`:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

---

## Full Stack Startup (One Command with Docker)

If using Docker Compose:

```bash
docker-compose up mongo-db chat-service web-app
```

Then open: http://localhost:3000

---

## Next Steps After Setup

1. ✅ Backend runs on port 3001
2. ✅ Frontend connects to backend
3. ✅ MongoDB stores messages
4. ✅ Socket.IO handles real-time events
5. (Optional) Configure AWS S3 for file uploads

---

## AWS S3 Configuration (Optional)

If file uploads are needed, add to `.env`:

```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```
