# EduBridge - School Management System

A comprehensive web-based School Management System built with React, TypeScript, Node.js, Express, and MySQL.

## 🚀 Features

### Role-Based Access Control
- **Admin**: Full system control, user management, reports, announcements
- **Teacher**: Attendance marking, assignment creation, marking, exam management
- **Student**: View assignments, submit work, check attendance, view results
- **Parent**: Monitor children's progress, attendance, schedule PTM

### Core Modules
- ✅ Authentication & Authorization (JWT)
- ✅ User Management (CRUD for all roles)
- ✅ Attendance Tracking
- ✅ Assignment Management (Create → Submit → Mark)
- ✅ Announcements & Events
- ✅ Dashboard Analytics
- ✅ Parent-Teacher Meetings (PTM)

## 📁 Project Structure

```
edubridge/
├── frontend/          # React + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── pages/         # Page components by role
│   │   ├── services/      # API clients
│   │   ├── context/       # React context (Auth)
│   │   └── types/         # TypeScript types
│   └── package.json
│
└── backend/           # Node.js + Express + TypeScript
    ├── src/
    │   ├── config/        # Database & environment
    │   ├── controllers/   # Request handlers
    │   ├── services/      # Business logic
    │   ├── routes/        # API routes
    │   └── middleware/    # Auth & error handling
    ├── database/          # SQL schema & seed data
    └── package.json
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL (v8+)
- npm or yarn

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create and populate database
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed-data.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
# Edit .env file with your database credentials

# Start development server
npm run dev

# Server will run on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# App will run on http://localhost:3000
```

## 🔐 Demo Credentials

All passwords: `password123`

```
Admin:
email: admin@edubridge.com

Teacher:
email: prakash.saneshan@gmail.com

Student:
email: kavingj.suthakaran@gmail.com

Parent:
email: suthaseena@hotamail.com
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - All users
- `POST /api/admin/users` - Create user
- `GET /api/admin/announcements` - Get announcements
- `POST /api/admin/announcements` - Create announcement

### Teacher
- `GET /api/teacher/dashboard` - Teacher dashboard
- `POST /api/teacher/attendance` - Mark attendance
- `POST /api/teacher/assignments` - Create assignment
- `GET /api/teacher/assignments/:id/submissions` - View submissions
- `POST /api/teacher/submissions/:id/mark` - Mark assignment

### Student
- `GET /api/student/dashboard` - Student dashboard
- `GET /api/student/assignments` - View assignments
- `POST /api/student/assignments/:id/submit` - Submit assignment
- `GET /api/student/attendance` - View attendance

### Parent
- `GET /api/parent/dashboard` - Parent dashboard
- `GET /api/parent/child/:id/attendance` - Child's attendance
- `GET /api/parent/child/:id/progress` - Child's progress

## 🎨 Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide Icons

### Backend
- Node.js
- Express
- TypeScript
- MySQL2
- JWT (jsonwebtoken)
- Bcrypt
- CORS

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Build output will be in dist/
```

## 🔧 Development

- Backend auto-reloads with `ts-node-dev`
- Frontend hot-reloads with Vite HMR
- TypeScript for type safety
- ESLint for code quality

## 📝 Database Schema

- 20 normalized tables
- Foreign key relationships
- Indexed for performance
- Supports academic workflows

Key tables:
- users, students, teachers, parents
- assignments, assignment_submissions, assignment_marks
- attendance, exams, announcements, events
- classes, timetable, ptm_meetings

## 🚀 Features Implemented

✅ Role-based authentication
✅ Admin dashboard with system stats
✅ User management (CRUD)
✅ Teacher dashboard with class overview
✅ Assignment creation & submission
✅ Late submission detection
✅ Attendance marking & tracking
✅ Student dashboard with pending work
✅ Parent dashboard with child monitoring
✅ Announcements system
✅ Events management
✅ Data tables with sorting
✅ Protected routes
✅ Responsive design

## 📄 License

This project is for educational purposes.

## 👨‍💻 Support

For issues or questions, please contact the development team.
