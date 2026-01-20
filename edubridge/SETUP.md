# EduBridge - Simple Setup Guide

## 🚀 Quick Setup (3 Steps)

### Step 1: Configure MySQL Connection

1. Open `backend/.env` file
2. Update your MySQL credentials:
   ```
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   ```
3. Save the file

### Step 2: Setup Database (Automatic)

```bash
cd backend
npm install
node setup-database.js
```

This will automatically:
- ✅ Create the database
- ✅ Create all tables
- ✅ Insert sample data

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server will start on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```
App will start on http://localhost:3000

## 🔐 Login

Open http://localhost:3000 and use:

**Admin:**
- Email: `admin@edubridge.com`
- Password: `password123`

**Teacher:**
- Email: `prakash.saneshan@gmail.com`
- Password: `password123`

**Student:**
- Email: `kavingj.suthakaran@gmail.com`
- Password: `password123`

**Parent:**
- Email: `suthaseena@hotamail.com`
- Password: `password123`

---

## ⚠️ Troubleshooting

### MySQL Connection Error?

1. Make sure MySQL is running:
   ```bash
   # Windows
   net start MySQL80
   ```

2. Check your MySQL credentials in `backend/.env`

3. Test MySQL connection:
   ```bash
   mysql -u root -p
   ```

### Port Already in Use?

Change the port in `backend/.env`:
```
PORT=5001
```

And update `frontend/vite.config.ts` proxy target accordingly.

---

## 📝 Manual Database Setup (Alternative)

If the automatic script doesn't work, run manually:

```bash
# Login to MySQL
mysql -u root -p

# Run these commands:
source backend/database/schema.sql
source backend/database/seed-data.sql
```

---

## ✅ Verify Setup

After starting both servers:

1. Backend health check: http://localhost:5000/api/health
2. Frontend app: http://localhost:3000
3. Login with any demo account

That's it! 🎉
