# EduBridge - Detailed Code Review Report
**Project:** School Management System  
**Date:** April 2026  
**Reviewer:** Code Analysis  

---

## TABLE OF CONTENTS
1. [Project Overview](#project-overview)
2. [Database Schema](#database-schema)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Key Features & Implementation](#key-features--implementation)
6. [CRUD Operations in Detail](#crud-operations-in-detail)
7. [Security & Authentication](#security--authentication)

---

## PROJECT OVERVIEW

**EduBridge** is a comprehensive full-stack web application for managing schools. It has:
- **Frontend:** React + TypeScript + Tailwind CSS (built with Vite)
- **Backend:** Node.js + Express + TypeScript
- **Database:** MySQL (relational database)
- **Authentication:** JWT (JSON Web Tokens)
- **File Handling:** Multer (for uploading assignments, profiles, etc.)

### Tech Stack Summary
```
Frontend: React 18, TypeScript, Tailwind CSS, Vite, React Router, Axios
Backend: Express.js, TypeScript, JWT, bcryptjs (password hashing), MySQL2
Database: MySQL with 20+ tables
```

---

## DATABASE SCHEMA

The database has **20+ tables** designed to handle all aspects of school management:

### Core User Management Tables
```sql
1. users (Core user authentication)
   - id (PK), email (UNIQUE), password, role, created_at, updated_at, active

2. students (Student-specific info)
   - id (PK), user_id (FK), full_name, roll_number, class_id (FK), 
     date_of_birth, parent_id (FK)

3. teachers (Teacher-specific info)
   - id (PK), user_id (FK), full_name, subject_id (FK)

4. parents (Parent-specific info)
   - id (PK), user_id (FK), full_name, phone

5. activation_tokens (Email verification)
   - token (PK), user_id (FK), expires_at, created_at
```

### Academic Tables
```sql
6. classes (Class structure)
   - id (PK), grade, section, class_teacher_id (FK)

7. subjects (Subject/Course catalog)
   - id (PK), subject_name (UNIQUE)

8. timetable (Class schedule)
   - id (PK), class_id (FK), subject_id (FK), day_of_week (M-F),
     start_time, end_time, teacher_id (FK)

9. assignments (Teacher-created assignments)
   - id (PK), title, description, due_date, class_id (FK),
     subject_id (FK), assignment_file_url, created_by (FK)

10. assignment_submissions (Student submissions)
    - id (PK), assignment_id (FK), student_id (FK),
      submission_file_url, submitted_at

11. assignment_marks (Grading)
    - id (PK), assignment_submission_id (FK), marks,
      feedback, reviewed_at
```

### Examination Tables
```sql
12. exams (Exam setup)
    - id (PK), title, exam_date, duration, total_marks,
      status (draft/published/archived), class_id (FK),
      subject_id (FK), teacher_id (FK)

13. question_bank (Reusable questions)
    - id (PK), question_text, question_type (multiple_choice/true_false/short_answer/essay),
      subject_id (FK), difficulty_level (easy/medium/hard), marks,
      options (JSON), correct_answer, teacher_id (FK)

14. exam_questions (Link exam to questions)
    - id (PK), exam_id (FK), question_id (FK),
      marks, question_order

15. student_exam_attempts (Exam participation)
    - id (PK), student_id (FK), exam_id (FK),
      start_time, end_time, status (in_progress/submitted/evaluated)

16. student_exam_answers (Student answers during exam)
    - id (PK), attempt_id (FK), question_id (FK),
      selected_option, text_answer

17. online_exam_marks (Exam scores)
    - id (PK), student_id (FK), exam_id (FK),
      score, entered_by (FK), entered_at
```

### Attendance & Performance Tables
```sql
18. attendance (Daily attendance)
    - id (PK), student_id (FK), status (present/absent/late),
      date, class_id (FK), subject_id (FK)

19. term_marks (Periodic grades)
    - id (PK), student_id (FK), teacher_id (FK),
      subject_id (FK), term, marks, feedback, entered_at
```

### Communication & Engagement Tables
```sql
20. announcements (School announcements)
    - id (PK), title, message, posted_by (FK), posted_at

21. events (School events)
    - id (PK), title, description, event_date, created_by (FK)

22. notifications (User notifications)
    - id (PK), user_id (FK), title, message, type (ptm/system/assignment/exam),
      is_read, created_at

23. ptm_meetings (Parent-Teacher Meetings)
    - id (PK), student_id (FK), teacher_id (FK), parent_id (FK),
      meeting_date, meeting_time, status (pending/approved/rejected/completed/reschedule_requested),
      notes, teacher_remarks, created_at

24. ptm_feedback (Meeting feedback)
    - id (PK), ptm_meeting_id (FK), feedback_from (teacher/parent),
      feedback, created_at
```

### Student Engagement & Portfolio Tables
```sql
25. student_todos (Personal task list)
    - id (PK), student_id (FK), title, description, due_date,
      priority (high/medium/low), status (pending/in_progress/completed),
      category, created_at, completed_at

26. portfolios (Student performance portfolio)
    - id (PK), student_id (FK), teacher_id (FK),
      performance_summary, activities_achievements,
      areas_improvement, teacher_remarks, created_at, updated_at

27. certificate_types (Certificate categories)
    - id (PK), name, created_at

28. certificate_issue (Issued certificates)
    - id (PK), student_id (FK), certificate_type_id (FK),
      issue_date, certificate_number (UNIQUE),
      description, issued_by (FK), created_at
```

### Security Tables
```sql
29. password_resets (Password reset tokens)
    - id (PK), user_id (FK), token (UNIQUE), expires_at, created_at
```

### Key Database Design Features
✅ **Foreign Keys:** All relationships properly linked with ON DELETE CASCADE  
✅ **Indexes:** Email is UNIQUE for fast user lookups  
✅ **Timestamps:** created_at and updated_at for audit trails  
✅ **Constraints:** ENUM for role, status fields to limit invalid values  
✅ **Data Types:** DECIMAL(5,2) for marks (precision to 2 decimal places)  

---

## BACKEND ARCHITECTURE

### Directory Structure
```
backend/
├── src/
│   ├── server.ts              # Main entry point (starts Express server)
│   ├── config/
│   │   ├── database.ts        # MySQL connection pool
│   │   └── environment.ts     # Environment variables (PORT, JWT_SECRET, DB_HOST, etc.)
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification & role checking
│   │   ├── errorHandler.ts    # Global error handling
│   │   └── upload.ts          # File upload handling (Multer)
│   ├── routes/                # API route definitions
│   │   ├── auth.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── teacher.routes.ts
│   │   ├── student.routes.ts
│   │   ├── parent.routes.ts
│   │   ├── profile.routes.ts
│   │   └── notification.routes.ts
│   ├── controllers/           # Business logic & request handlers
│   │   ├── AuthController.ts
│   │   ├── AdminController.ts
│   │   ├── StudentController.ts
│   │   ├── TeacherController.ts
│   │   ├── ParentController.ts
│   │   ├── UserController.ts
│   │   └── [Other Controllers]
│   ├── services/              # Database & business logic
│   │   ├── AuthService.ts
│   │   ├── AssignmentService.ts
│   │   ├── ExamService.ts
│   │   ├── AttendanceService.ts
│   │   ├── UserService.ts
│   │   ├── DashboardService.ts
│   │   └── [23 total services]
│   └── utils/
│       └── validators.ts      # Input validation (password strength, etc.)
└── database/
    └── schema.sql             # Database schema definition
```

### How Backend Works

#### 1️⃣ **Server Startup (server.ts)**
```typescript
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';

const app = express();

// Middleware
app.use(cors());                           // Allow cross-origin requests
app.use(express.json());                   // Parse JSON body
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// Start listening
app.listen(config.port); // Usually 5000
```

#### 2️⃣ **Request Flow Example: Login**
```
Frontend sends: POST /api/auth/login with {email, password}
        ↓
Backend Route (auth.routes.ts):
  router.post('/login', (req, res) => authController.login(req, res))
        ↓
Controller (AuthController.ts):
  - Gets email & password from req.body
  - Calls authService.login()
  - Returns {token, user} in res.json()
        ↓
Service (AuthService.ts):
  - Queries MySQL: SELECT * FROM users WHERE email = ?
  - Compares password using bcrypt.compare()
  - Generates JWT token: jwt.sign({id, email, role}, secret)
  - Returns {token, user}
        ↓
Frontend receives: {token, user}
  - Saves token to localStorage
  - Redirects to appropriate dashboard
```

#### 3️⃣ **Request Flow Example: Create Assignment (Teacher)**
```
Frontend sends: POST /api/teacher/assignments
Body: {title, description, dueDate, classId, subjectId, file}
Headers: Authorization: Bearer <token>
        ↓
Middleware (auth.ts):
  - Extracts token from "Bearer <token>"
  - Verifies with jwt.verify()
  - Sets req.user = {id, email, role}
  - Calls next()
        ↓
Middleware (upload.ts):
  - Uses Multer to handle multipart/form-data
  - Saves file to uploads/assignments/ folder
  - Adds req.file object
        ↓
Controller (TeacherController.ts):
  - Gets title, description from req.body
  - Gets file path from req.file.filename
  - Calls assignmentService.createAssignment()
        ↓
Service (AssignmentService.ts):
  - SQL INSERT: INSERT INTO assignments (...) VALUES (...)
  - Returns {id, title, ...}
        ↓
Frontend receives: {id, title, ...}
  - Shows success message
  - Refreshes assignment list
```

### Controllers (23 total)

**AuthController.ts**
- `login()` - Check credentials, generate JWT token
- `activateAccount()` - Verify email token, set password
- `verifyToken()` - Check if token is valid
- `requestPasswordReset()` - Create password reset token
- `resetPassword()` - Update password using reset token

**AdminController.ts** (User Management & Dashboard)
- `createStudent()` - Create new student + user account
- `createTeacher()` - Create new teacher + user account
- `createParent()` - Create new parent + user account
- `toggleUserStatus()` - Activate/deactivate user
- `getDashboard()` - Return statistics & charts
- `createAnnouncement()`, `updateAnnouncement()`, `deleteAnnouncement()`
- `createEvent()`, `updateEvent()`, `deleteEvent()`
- `getCertificateTypes()`, `createCertificate()`, `deleteCertificate()`
- `getAttendanceReport()`, `getExamReport()`, `getCertificateReport()`
- And many more...

**StudentController.ts** (Student Actions)
- `getDashboard()` - Fetch student's dashboard data
- `getAssignments()` - Fetch pending assignments for student's class
- `submitAssignment()` - Upload assignment file
- `getExams()` - Fetch exams for student's class
- `getMySubmissions()` - Check submitted assignments
- `getTodos()`, `createTodo()`, `updateTodo()`, `deleteTodo()`
- `getAttendance()` - View attendance record
- `getPortfolio()` - Fetch student portfolio
- `getTimetable()` - Fetch class schedule
- `getProgress()`, `getMyProgressCard()`
- And more...

**TeacherController.ts** (Teacher Actions)
- `getDashboard()` - Teacher's overview
- `createAssignment()` - Create & upload assignment
- `getMyAssignments()` - Fetch teacher's assignments
- `markAttendance()` - Record attendance for class
- `createExam()` - Create new exam
- `getExams()` - Fetch teacher's exams
- `publishExam()` - Make exam available to students
- `getExamSubmissions()` - Check student exam attempts
- `createQuestion()` - Add question to question bank
- `getQuestions()` - Fetch questions for exams
- `uploadTermMarks()` - Bulk upload term grades
- `initiatePTM()` - Schedule parent-teacher meeting
- `getStudentPortfolio()` - View student's portfolio
- And more...

**ParentController.ts** (Parent Actions)
- `getDashboard()` - Parent's overview
- `getChildResults()` - View child's grades
- `getChildAttendance()` - View child's attendance
- `getChildPortfolio()` - View child's portfolio
- `bookPTM()` - Request parent-teacher meeting
- And more...

**UserController.ts** (General User Operations)
- `getAllUsers()` - Admin fetches all users
- `getStudents()`, `getTeachers()`, `getParents()`
- `getUserById()`
- `updateUser()` - Edit user profile
- `deleteUser()` - Remove user from system
- `getClasses()` - Fetch class list
- And more...

**Other Controllers:**
- **ResultsController** - Manage student results/grades
- **NotificationController** - Send & manage notifications
- **LeaveController** - Manage leave applications (teacher/parent)
- **TimetableController** - Manage class schedule
- **ProfileController** - User profile management

### Services (23 total)
Services contain the actual database logic. Each service has methods for database queries:

**AuthService.ts**
```typescript
async login(email, password) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);
  const token = jwt.sign({id, email, role}, secret);
  return {token, user};
}

async activateAccount(token, password) {
  const [tokenRows] = await pool.query('SELECT user_id FROM activation_tokens WHERE token = ?', [token]);
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query('UPDATE users SET password = ?, active = 1 WHERE id = ?', [hashedPassword, userId]);
  return {success: true};
}
```

**AssignmentService.ts**
```typescript
async createAssignment(data) {
  const [result] = await pool.query(
    'INSERT INTO assignments (title, description, due_date, ...) VALUES (?, ?, ?, ...)',
    [data.title, data.description, data.dueDate, ...]
  );
  return {id: result.insertId, ...data};
}

async getAssignmentsByClass(classId, studentId) {
  const [rows] = await pool.query(
    'SELECT a.*, t.full_name as teacher_name, ... ' +
    'FROM assignments a ' +
    'JOIN teachers t ON a.created_by = t.user_id ' +
    'LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = ? ' +
    'WHERE a.class_id = ?',
    [studentId, classId]
  );
  return rows;
}

async markAssignment(submissionId, marks, feedback) {
  const [result] = await pool.query(
    'INSERT INTO assignment_marks (assignment_submission_id, marks, feedback) VALUES (?, ?, ?)',
    [submissionId, marks, feedback]
  );
  return {success: true};
}
```

**ExamService.ts**
```typescript
async createExam(data) {
  // INSERT INTO exams (title, exam_date, duration, status='draft', ...)
}

async publishExam(examId) {
  // UPDATE exams SET status = 'published' WHERE id = ?
}

async getExamsByClass(classId) {
  // SELECT * FROM exams WHERE class_id = ? AND status = 'published'
}

async submitExamAttempt(studentId, examId, answers) {
  // INSERT answer attempts, update student_exam_answers
}
```

**AttendanceService.ts**
```typescript
async markBulkAttendance(attendance) {
  // INSERT INTO attendance (student_id, status, date, class_id, subject_id) VALUES ...
}

async getAttendanceByStudent(studentId) {
  // SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC
}
```

**UserService.ts**
```typescript
async createUser(data) {
  // INSERT user into users table
  // If role='student': INSERT into students table
  // If role='teacher': INSERT into teachers table
  // If role='parent': INSERT into parents table
}

async updateUser(userId, updates) {
  // UPDATE users SET ... WHERE id = ?
}

async deleteUser(userId) {
  // DELETE FROM users WHERE id = ?
  // Cascades delete related records
}
```

**DashboardService.ts**
```typescript
async getAdminDashboard() {
  return {
    totalStudents: count from students,
    totalTeachers: count from teachers,
    totalParents: count from parents,
    pendingLeavesCount: count from leave where status='pending',
    attendanceChartData: [data for last 7 days],
    recentAnnouncements: last 5 announcements,
    upcomingExams: next exams,
    ...
  };
}

async getStudentDashboard(studentId) {
  return {
    pendingAssignments: assignments not yet submitted,
    upcomingExams: exams for student's class,
    attendance: percentage,
    todaysSchedule: today's classes,
    recentNotifications: 5 latest,
    ...
  };
}
```

### Middleware

**auth.ts** - Protects routes from unauthorized access
```typescript
export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  const decoded = jwt.verify(token, secret);
  req.user = {id, email, role};
  next(); // Proceed
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({error: 'Access denied'});
    }
    next();
  };
}

// Usage in routes
router.post('/assignments', authenticate, requireRole(['teacher']), ...)
```

**errorHandler.ts** - Catches all errors
```typescript
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    error: err.message
  });
});
```

**upload.ts** - Handles file uploads
```typescript
const uploadAssignment = multer({
  dest: 'uploads/assignments/',
  fileFilter: (req, file, cb) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB max
      cb(new Error('File too large'));
    } else {
      cb(null, true);
    }
  }
}).single('file');

// Usage
router.post('/assignments', uploadAssignment, (req, res) => {
  // req.file contains: filename, path, size, etc.
  assignmentService.createAssignment({
    ...req.body,
    assignmentFileUrl: `uploads/assignments/${req.file.filename}`
  });
});
```

### Routes
Routes define the API endpoints. Pattern is:
```
POST   /api/admin/users/student        → Create student
GET    /api/admin/users                → Get all users
GET    /api/admin/users/:id            → Get specific user
PUT    /api/admin/users/:id            → Update user
DELETE /api/admin/users/:id            → Delete user
PATCH  /api/admin/users/:id/status     → Toggle user active/inactive

POST   /api/teacher/assignments        → Create assignment
GET    /api/teacher/assignments        → Get teacher's assignments
POST   /api/teacher/attendance         → Mark attendance
GET    /api/teacher/exams              → Get teacher's exams
POST   /api/teacher/exams              → Create new exam

GET    /api/student/assignments        → Get pending assignments
POST   /api/student/assignments/:id/submit → Submit assignment
GET    /api/student/exams              → Get upcoming exams
GET    /api/student/todos              → Get to-do list
POST   /api/student/todos              → Create to-do item
```

---

## FRONTEND ARCHITECTURE

### Directory Structure
```
frontend/
├── src/
│   ├── App.tsx                    # Main app with routes
│   ├── main.tsx                   # React entry point
│   ├── pages/                     # Full page components
│   │   ├── auth/                  # Login, reset password, etc.
│   │   │   ├── Login.tsx
│   │   │   ├── ActivateAccount.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── ResetPassword.tsx
│   │   ├── admin/                 # Admin pages
│   │   │   ├── Dashboard.tsx      # Admin overview & statistics
│   │   │   ├── UserManagement.tsx # Create/edit/delete users
│   │   │   ├── Announcements.tsx  # Post announcements
│   │   │   ├── Events.tsx         # Manage events
│   │   │   ├── Timetable.tsx      # Create/edit timetable
│   │   │   ├── LeaveApproval.tsx  # Approve/reject leaves
│   │   │   ├── ProgressCard.tsx   # Generate report cards
│   │   │   ├── StudentPortfolio.tsx
│   │   │   ├── Certificates.tsx   # Issue certificates
│   │   │   ├── Reports.tsx        # View analytics
│   │   │   └── Scholarships.tsx   # Scholarship management
│   │   ├── student/               # Student pages
│   │   │   ├── Dashboard.tsx      # Student overview
│   │   │   ├── Assignments.tsx    # View & submit assignments
│   │   │   ├── Exams.tsx          # View upcoming exams
│   │   │   ├── TakeExam.tsx       # Take online exam
│   │   │   ├── ReviewExam.tsx     # Review exam results
│   │   │   ├── Results.tsx        # View grades
│   │   │   ├── Portfolio.tsx      # Personal portfolio
│   │   │   ├── Attendance.tsx     # View attendance
│   │   │   ├── Progress.tsx       # Progress report
│   │   │   ├── Events.tsx         # View school events
│   │   │   ├── Announcements.tsx  # Read announcements
│   │   │   ├── Timetable.tsx      # View class schedule
│   │   │   └── ToDoList.tsx       # Personal tasks
│   │   ├── teacher/               # Teacher pages (17 pages)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Attendance.tsx     # Mark attendance
│   │   │   ├── Assignments.tsx    # Create assignments
│   │   │   ├── AssignmentSubmissions.tsx # View submissions
│   │   │   ├── Exams.tsx          # Create exams (with AI)
│   │   │   ├── QuestionBank.tsx   # Manage questions
│   │   │   ├── UploadMarks.tsx    # Bulk upload marks
│   │   │   ├── ReviewStudentExam.tsx
│   │   │   ├── StudentPortfolio.tsx
│   │   │   ├── MyClasses.tsx
│   │   │   ├── LeaveManagement.tsx
│   │   │   ├── PTMBooking.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── Announcements.tsx
│   │   │   └── Timetable.tsx
│   │   ├── parent/                # Parent pages (9 pages)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ChildResults.tsx
│   │   │   ├── ChildPortfolio.tsx
│   │   │   ├── ViewProgress.tsx
│   │   │   ├── Announcements.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── Attendance.tsx
│   │   │   ├── PTMBooking.tsx
│   │   │   └── Timetable.tsx
│   │   ├── Profile.tsx            # User profile editing
│   │   ├── ChangePassword.tsx     # Password change
│   │   └── Notifications.tsx      # Notification center
│   ├── components/                # Reusable components
│   │   ├── ProtectedRoute.tsx    # Checks login & role
│   │   ├── common/                # Common components
│   │   │   ├── StatCard.tsx      # Card showing stat
│   │   │   ├── DataTable.tsx     # Reusable table
│   │   │   ├── ConfirmationModal.tsx
│   │   │   ├── Badge.tsx         # Status badge
│   │   │   └── [Others]
│   │   └── layout/
│   │       └── DashboardLayout.tsx # Navbar + sidebar
│   ├── context/                   # Global state
│   │   └── AuthContext.tsx       # User login state
│   ├── services/                  # API calls
│   │   └── api.ts                # Axios instance & API endpoints
│   ├── types/                     # TypeScript types
│   │   └── index.ts              # Type definitions
│   ├── utils/                     # Utilities
│   │   └── certificatePDF.ts    # PDF generation
│   ├── assets/                    # Images, icons, etc.
│   └── index.css                 # Global styles
├── tailwind.config.js            # Tailwind configuration
├── vite.config.ts                # Vite configuration
└── package.json                  # Dependencies
```

### How Frontend Works

#### 1️⃣ **App.tsx - Main Router**
Defines all routes and wraps them with AuthProvider:
```typescript
<AuthProvider>                    {/* Global auth state */}
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Admin Routes - Protected */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requiredRole="admin">
          <UserManagement />
        </ProtectedRoute>
      } />
      
      {/* Teacher Routes - Protected */}
      <Route path="/teacher/dashboard" element={
        <ProtectedRoute requiredRole="teacher">
          <TeacherDashboard />
        </ProtectedRoute>
      } />
      
      {/* Student Routes - Protected */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute requiredRole="student">
          <StudentDashboard />
        </ProtectedRoute>
      } />
      
      {/* Parent Routes - Protected */}
      <Route path="/parent/dashboard" element={
        <ProtectedRoute requiredRole="parent">
          <ParentDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

#### 2️⃣ **AuthContext.tsx - Global Authentication State**
Manages user login state across the entire app:
```typescript
const AuthContext = createContext<AuthContextType>();

export function AuthProvider({children}) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On app load, restore session from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);           // Save token
    localStorage.setItem('user', JSON.stringify(newUser)); // Save user data
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';                   // Redirect to login
  };

  return (
    <AuthContext.Provider value={{user, token, login, logout, isAuthenticated, isLoading}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
```

**Why this is important:**
- Instead of passing user data through dozens of components, it's stored globally
- When user logs in, ALL components immediately know they're logged in
- When token expires (401), user is automatically logged out
- Session persists even after page refresh (localStorage)

#### 3️⃣ **ProtectedRoute.tsx - Route Protection**
Prevents unauthorized access to pages:
```typescript
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>

// Implementation
function ProtectedRoute({requiredRole, children}) {
  const {user, isAuthenticated, isLoading} = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;  // Not logged in → Login page
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/error" replace />;  // Wrong role → Error
  }
  
  return children;  // Allowed → Show page
}
```

#### 4️⃣ **API Service (api.ts)**
Centralized API calls with token management:
```typescript
const api = axios.create({
  baseURL: '/api',
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // Add token
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');      // Token expired
      window.location.href = '/login';       // Go to login
    }
    return Promise.reject(error);
  }
);

// Export API methods
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', {email, password}),
  activate: (token, password) =>
    api.post('/auth/activate', {token, password}),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllUsers: () => api.get('/admin/users'),
  getStudents: () => api.get('/admin/users/students'),
  createStudent: (data) => api.post('/admin/users/student', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/status`),
};

export const teacherAPI = {
  getDashboard: () => api.get('/teacher/dashboard'),
  getMyAssignments: () => api.get('/teacher/assignments'),
  createAssignment: (data) => api.post('/teacher/assignments', data),
  getExams: () => api.get('/teacher/exams'),
  createExam: (data) => api.post('/teacher/exams', data),
};

export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getAssignments: () => api.get('/student/assignments'),
  submitAssignment: (id, formData) =>
    api.post(`/student/assignments/${id}/submit`, formData),
  getExams: () => api.get('/student/exams'),
};
```

#### 5️⃣ **Page Examples**

**Login.tsx**
```typescript
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {login} = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authAPI.login(email, password);
      const {token, user} = response.data;
      
      login(token, user);  // Save to global state
      
      // Redirect based on role
      const dashboards = {
        admin: '/admin/dashboard',
        teacher: '/teacher/dashboard',
        student: '/student/dashboard',
        parent: '/parent/dashboard',
      };
      navigate(dashboards[user.role]);
    } catch (error) {
      setError(error.response.data.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
};
```

**AdminDashboard.tsx**
```typescript
const AdminDashboard = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard data
    adminAPI.getDashboard()
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <DashboardLayout>
      <div className="grid grid-cols-3 gap-6">
        <StatCard
          title="Total Students"
          value={data.totalStudents}
          icon={Users}
        />
        <StatCard
          title="Total Teachers"
          value={data.totalTeachers}
          icon={UserCheck}
        />
        <StatCard
          title="Pending Leaves"
          value={data.pendingLeavesCount}
          icon={Clock}
        />
      </div>
      
      {/* Charts, tables, etc. */}
    </DashboardLayout>
  );
};
```

**UserManagement.tsx** (Admin creating users)
```typescript
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'student',
    grade: '',
    section: '',
    subjectId: '',
  });

  const handleAddUser = async () => {
    try {
      const endpoint = {
        student: () => adminAPI.createStudent(formData),
        teacher: () => adminAPI.createTeacher(formData),
        parent: () => adminAPI.createParent(formData),
      }[formData.role]();

      await endpoint;
      setUsers([...users, response.data]);
      setShowAddModal(false);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <button onClick={() => setShowAddModal(true)}>Add User</button>
      <DataTable data={users} columns={['email', 'role', 'name']} />
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <input
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>
          <button onClick={handleAddUser}>Create User</button>
        </Modal>
      )}
    </div>
  );
};
```

---

## KEY FEATURES & IMPLEMENTATION

### 1. AUTHENTICATION & AUTHORIZATION

**User Roles:**
- Admin - Full system access
- Teacher - Create assignments, exams, mark attendance, upload marks
- Student - Submit assignments, take exams, view grades
- Parent - View child's grades and attendance, book meetings

**Flow:**
1. User enters email & password on Login page
2. Backend checks if user exists & password matches (bcrypt)
3. Backend generates JWT token (valid for 7 days)
4. Frontend saves token to localStorage
5. Every subsequent request includes token in Authorization header
6. Backend verifies token before allowing access
7. If token is invalid/expired, user is logged out

**Key Files:**
- `AuthService.ts` - Login logic
- `AuthController.ts` - Handles login requests
- `auth.ts` (middleware) - Verifies JWT token on every protected route

---

### 2. USER MANAGEMENT (ADMIN)

**Features:**
- Create Student (with class assignment)
- Create Teacher (with subject assignment)
- Create Parent (with phone, annual income)
- Edit user details
- Activate/Deactivate user accounts
- Delete user (cascades delete related records)

**Database Tables Involved:**
- users, students, teachers, parents, classes, subjects

**Implementation:**
```
Admin clicks "Add Student" button
→ Opens modal with form
→ Fills email, name, grade, section, parent
→ Clicks "Create"
→ Frontend: POST /api/admin/users/student {email, fullName, grade, section, parentId}
→ Backend AdminController.createStudent():
   - Validates input
   - Calls userService.createUser() with role='student'
   - userService inserts into users table → gets user_id
   - userService inserts into students table with class_id
   - Email sent to teacher with activation link
→ Response: {id, email, full_name, role, ...}
→ Frontend: Shows success, refreshes user list
```

---

### 3. ASSIGNMENT MANAGEMENT

#### Teacher Creating Assignment
```
Teacher clicks "Create Assignment"
→ Opens modal/form
→ Fills:
   - Title: "Math Homework Chapter 5"
   - Description: "Solve problems 1-20"
   - Due Date: "2026-04-25"
   - Class: "Grade 9 - Section A"
   - Subject: "Mathematics"
   - File Upload: assignment.pdf
→ Clicks "Create"
→ Frontend: POST /api/teacher/assignments (multipart/form-data)
   Headers: Authorization: Bearer <token>
   Body: {title, description, dueDate, classId, subjectId, file}
→ Backend middleware (upload.ts):
   - Saves file to uploads/assignments/12345.pdf
→ Backend TeacherController.createAssignment():
   - Gets file path from req.file
   - Calls assignmentService.createAssignment()
   - SQL: INSERT INTO assignments (title, description, due_date, class_id, subject_id, assignment_file_url, created_by)
   VALUES ("Math Homework...", "Solve...", "2026-04-25", 1, 2, "uploads/assignments/12345.pdf", 15)
   - Returns {id: 101, title, description, ...}
→ Frontend: Shows "Assignment created successfully"
→ Database: Assignment now visible to all students in Grade 9 Section A
```

#### Student Submitting Assignment
```
Student opens Assignments page
→ Backend: GET /api/student/assignments
→ Backend fetches all assignments for student's class
→ Shows: [
   {id: 101, title: "Math Homework...", dueDate: "2026-04-25", status: "pending", ...},
   ...
]
→ Student clicks on assignment
→ Sees:
   - Title, description, due date
   - Teacher name
   - "Download Assignment" button (downloads assignment.pdf)
   - File upload field: "Choose file to submit"
→ Student uploads solution.pdf
→ Clicks "Submit"
→ Frontend: POST /api/student/assignments/101/submit (multipart/form-data)
   Body: {file: solution.pdf}
→ Backend middleware:
   - Saves to uploads/submissions/solution.pdf
→ Backend StudentController.submitAssignment():
   - Gets student_id from user_id
   - SQL: INSERT INTO assignment_submissions (assignment_id, student_id, submission_file_url, submitted_at)
   VALUES (101, 25, "uploads/submissions/solution.pdf", NOW())
   - Updates status to "submitted"
→ Frontend: Shows "Submitted successfully"
→ Teacher Dashboard: Shows this student's submission
```

#### Teacher Grading Assignment
```
Teacher opens Assignments → "View Submissions" for an assignment
→ Backend: GET /api/teacher/assignments/101/submissions
→ Shows: [
   {studentName: "John", submissionFile: "solution.pdf", status: "submitted"},
   {studentName: "Sarah", status: "pending"},
   ...
]
→ Teacher clicks on John's submission
→ Can view/download solution.pdf
→ Enters:
   - Marks: 18/20
   - Feedback: "Good work, but solve problem 15 differently"
→ Clicks "Submit Grade"
→ Frontend: POST /api/teacher/submissions/1/mark
   Body: {marks: 18, feedback: "Good work..."}
→ Backend TeacherController.markAssignment():
   - SQL: INSERT INTO assignment_marks (assignment_submission_id, marks, feedback, reviewed_at)
   VALUES (1, 18, "Good work...", NOW())
→ Database updated
→ Student sees: status changed to "graded", marks: 18/20, feedback shown
```

---

### 4. ONLINE EXAMS

#### Teacher Creating Exam
```
Teacher clicks "Create Exam"
→ Step 1: Fill Basic Info
   - Title: "Math Final Exam"
   - Subject: Mathematics
   - Class: Grade 9 Section A
   - Date: 2026-05-15
   - Duration: 120 minutes
→ Step 2: Add Questions
   - Option A: Select from Question Bank
     - Shows filters: Subject, Difficulty Level, Type
     - Checkboxes for each question (with marks)
   - Option B: Use AI to generate questions
     - Upload PDF/images
     - Enter: "Generate 10 multiple choice questions, medium difficulty"
     - AI extracts and generates questions
→ Selects 20 questions, total marks = 100
→ Clicks "Create Exam"
→ Frontend: POST /api/teacher/exams
   Body: {title, examDate, duration, classId, subjectId, selectedQuestions}
→ Backend TeacherController.createExam():
   - SQL: INSERT INTO exams (...) VALUES (...)
   - For each question: INSERT INTO exam_questions (exam_id, question_id, marks)
   - Status = 'draft' (not yet available to students)
→ Exam created with 20 questions
→ Teacher can edit questions or publish
```

#### Teacher Publishing Exam
```
Teacher clicks "Publish" on exam
→ Frontend: PUT /api/teacher/exams/5/publish
→ Backend: UPDATE exams SET status = 'published' WHERE id = 5
→ Status changes to 'published'
→ Now visible to all students in that class
```

#### Student Taking Exam
```
Student opens Exams page
→ Backend: GET /api/student/exams
→ Shows published exams for their class
→ Student clicks on exam
→ Sees: "Math Final Exam - 120 minutes, 100 marks"
→ Clicks "Start Exam"
→ Frontend creates exam attempt
→ POST /api/student/exams/5/start
→ Backend:
   - SQL: INSERT INTO student_exam_attempts (student_id, exam_id, status='in_progress', start_time)
   - Returns: {attemptId: 42, questions: [...]}
→ Timer starts (120 minutes)
→ Student sees questions one by one
→ For each question:
   - If MCQ: shows radio buttons for options
   - If True/False: shows 2 buttons
   - If Short Answer: shows text field
   - If Essay: shows large text area
→ Student selects/enters answer
→ Clicks "Save & Next"
→ Frontend: POST /api/student/exams/5/answer
   Body: {attemptId: 42, questionId: 1, selectedOption: 'B'}
→ Backend StudentController.saveAnswer():
   - SQL: INSERT INTO student_exam_answers (attempt_id, question_id, selected_option)
→ Continues for all questions
→ After last question, shows "Review Answers" option
→ Student clicks "Submit Exam"
→ Frontend: POST /api/student/exams/5/submit-attempt
   Body: {attemptId: 42}
→ Backend:
   - SQL: UPDATE student_exam_attempts SET status='submitted', end_time=NOW()
   - Auto-grades MCQ/True-False questions
   - SQL: INSERT INTO online_exam_marks (student_id, exam_id, score)
→ Shows "Exam Submitted Successfully"
→ Student can view results after grading is complete
```

#### Automatic Grading
```
After exam submission, backend automatically grades:
- Multiple Choice: Checks selected_option == correct_answer
- True/False: Checks if answer matches
- Short Answer: Requires teacher review (marked as pending)
- Essay: Requires teacher review (marked as pending)

Example MCQ:
Question: "What is 2+2?"
Options: A=3, B=4, C=5, D=6
Student selected: B
Correct: B
Result: ✓ Correct, marks += 1

Teacher Reviews Later:
- For subjective questions
- Can override auto-grades if needed
- Adds feedback for each answer
```

---

### 5. ATTENDANCE MARKING

#### Teacher Marking Attendance
```
Teacher opens Attendance page
→ Selects date: 2026-04-15
→ System calculates: Day = Monday
→ Backend: GET /api/teacher/classes?day=Monday
→ Shows classes teacher teaches on Monday:
   [
     {id: 1, grade: "9", section: "A", subject: "English", time: "9:00-10:00"},
     {id: 2, grade: "10", section: "A", subject: "Math", time: "10:00-11:00"},
   ]
→ Teacher selects "Grade 9 Section A"
→ Backend: GET /api/teacher/classes/1/students
→ Shows all students in that class:
   [
     {id: 10, full_name: "John", roll_number: "001"},
     {id: 11, full_name: "Sarah", roll_number: "002"},
     {id: 12, full_name: "Mike", roll_number: "003"},
   ]
→ Teacher marks each student:
   - John: Present ✓
   - Sarah: Absent ✗
   - Mike: Late ⏱
→ Clicks "Save Attendance"
→ Frontend: POST /api/teacher/attendance
   Body: {
     classId: 1,
     date: "2026-04-15",
     subjectId: 5,
     attendance: [
       {studentId: 10, status: 'present'},
       {studentId: 11, status: 'absent'},
       {studentId: 12, status: 'late'},
     ]
   }
→ Backend AttendanceService.markBulkAttendance():
   - SQL: INSERT INTO attendance (student_id, status, date, class_id, subject_id)
   VALUES (10, 'present', '2026-04-15', 1, 5),
          (11, 'absent', '2026-04-15', 1, 5),
          (12, 'late', '2026-04-15', 1, 5)
→ Saves successfully
→ Student Dashboard shows updated attendance percentage
```

#### Student Viewing Attendance
```
Student opens Attendance page
→ Backend: GET /api/student/attendance
→ Backend StudentController:
   - Gets student_id from user_id
   - Queries: SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC
→ Shows:
   Date      | Subject    | Status
   2026-04-15| English    | Present ✓
   2026-04-14| English    | Absent ✗
   2026-04-13| Math       | Late ⏱
   ...
   Attendance %: 92%
```

---

### 6. GRADES & TERM MARKS

#### Teacher Uploading Marks (Bulk)
```
Teacher opens "Upload Marks"
→ Selects:
   - Term: "Term 1"
   - Subject: "Mathematics"
   - Class: "Grade 9 Section A"
→ Shows CSV template:
   roll_number, student_name, marks, feedback
   001, John, 85, Excellent
   002, Sarah, 78, Good
→ Teacher downloads, fills in Excel, uploads
→ Frontend: POST /api/teacher/term-marks/upload (multipart)
   Body: {classId, term, subjectId, csvFile}
→ Backend TeacherController.uploadTermMarks():
   - Parses CSV
   - For each row:
     - Finds student by roll_number
     - SQL: INSERT INTO term_marks (student_id, teacher_id, subject_id, term, marks, feedback)
→ Shows "20 marks uploaded successfully"
→ Student Dashboard shows updated marks
```

#### Student Viewing Grades
```
Student opens Results page
→ Backend: GET /api/student/results
→ Shows:
   Subject     | Term 1 | Term 2 | Grade
   English     | 85     | 88     | A
   Mathematics | 78     | 82     | B+
   Science     | 92     | 90     | A+
   ...
   Overall Grade: 87% (A)
```

---

### 7. PARENT-TEACHER MEETINGS (PTM)

#### Parent Booking PTM
```
Parent opens PTM Booking
→ Selects child from dropdown
→ Shows child's class teacher and other teachers
→ For each teacher, shows:
   - Available dates (from teacher's calendar)
   - Available time slots
→ Parent selects:
   - Teacher: Mr. Kumar (Math)
   - Date: 2026-05-20
   - Time: 3:00 PM - 3:30 PM
→ Adds notes: "Discuss exam preparation strategy"
→ Clicks "Request Meeting"
→ Frontend: POST /api/parent/ptm-booking
   Body: {teacherId, studentId, date, time, notes, initiator: 'parent'}
→ Backend:
   - SQL: INSERT INTO ptm_meetings (..., status='pending')
   - Notification sent to teacher
→ Shows "Meeting requested, awaiting teacher approval"
```

#### Teacher Approving/Rejecting PTM
```
Teacher opens PTM Requests
→ Shows pending requests:
   Student | Parent Name | Proposed Date | Action
   John    | Mr. Singh   | 2026-05-20    | [Approve][Reject][Reschedule]
→ Teacher clicks "Approve"
→ Frontend: PUT /api/teacher/ptm-requests/5
   Body: {status: 'approved'}
→ Backend:
   - SQL: UPDATE ptm_meetings SET status = 'approved'
   - Notification sent to parent: "Meeting approved"
→ Shows "Approved"

Or teacher clicks "Reschedule"
→ Opens modal to propose new date/time
→ Sends alternative suggestion
→ Parent gets notification with alternatives
```

#### PTM Feedback
```
After meeting is completed:
- Teacher adds feedback: POST /api/ptm-feedback
  Body: {meetingId, feedbackFrom: 'teacher', feedback: "John needs to focus on..."}
- Parent adds feedback: POST /api/ptm-feedback
  Body: {meetingId, feedbackFrom: 'parent', feedback: "Thank you for..."}
- Both can view feedback later
```

---

### 8. STUDENT PORTFOLIO & PROGRESS CARDS

#### Teacher Adding Portfolio Entry
```
Teacher opens Student Portfolio
→ Selects student: John (Grade 9)
→ Clicks "Add Entry"
→ Fills:
   - Type: "Academic Achievement"
   - Description: "Scored 95% in Math Midterm"
   - Category: "Academics"
→ Clicks "Save"
→ SQL: INSERT INTO portfolios (student_id, teacher_id, performance_summary/activities_achievements)
→ Entry added
```

#### Admin Generating Progress Cards
```
Admin opens Progress Card Generator
→ Selects:
   - Term: "Term 1"
   - Grade: "9"
   - Section: "A"
→ Clicks "Generate"
→ Backend queries:
   - Total marks for each student in each subject (from term_marks)
   - Attendance percentage
   - Assignment submission rate
   - Exam performance
   - Portfolio entries
   - Generates PDF report card for each student
→ Frontend:
   - Shows "20 progress cards generated"
   - Can download as PDF or print
```

---

## CRUD OPERATIONS IN DETAIL

### CREATE Operations

#### 1. Create User (Admin)
```
Route: POST /api/admin/users/student
Body: {email, fullName, dateOfBirth, grade, section, parentId}

Controller: AdminController.createStudent()
  ↓
Service: UserService.createUser({email, role: 'student', fullName, additionalData})
  ↓
Database:
  1. INSERT INTO users (email, password, role, active) 
     VALUES ('john@school.com', null, 'student', 2)
     → Gets user_id = 15
  
  2. Find class_id from grade & section:
     SELECT id FROM classes WHERE grade='9' AND section='A'
     → class_id = 5
  
  3. INSERT INTO students (user_id, full_name, class_id, parent_id, date_of_birth)
     VALUES (15, 'John Smith', 5, 12, '2010-05-15')
  
  4. Send activation email with token
     INSERT INTO activation_tokens (token, user_id, expires_at)

Response: {success: true, user: {id: 15, email, role, ...}}
```

#### 2. Create Assignment (Teacher)
```
Route: POST /api/teacher/assignments
Body: {title, description, dueDate, classId, subjectId, file}
Headers: Authorization: Bearer <token>

Controller: TeacherController.createAssignment()
  ↓
Service: AssignmentService.createAssignment()
  ↓
Database:
  INSERT INTO assignments (title, description, due_date, class_id, subject_id, assignment_file_url, created_by)
  VALUES ('Homework Ch5', 'Solve problems...', '2026-04-25', 1, 2, 'uploads/assignments/abc123.pdf', 8)
  → assignment_id = 101

Response: {id: 101, title, description, ...}
```

#### 3. Create Exam (Teacher)
```
Route: POST /api/teacher/exams
Body: {title, examDate, duration, classId, subjectId, selectedQuestions: [{questionId, marks}, ...]}

Database:
  1. INSERT INTO exams (title, exam_date, duration, total_marks, status, class_id, subject_id, teacher_id)
     VALUES ('Math Final', '2026-05-15', 120, 100, 'draft', 5, 2, 8)
     → exam_id = 42
  
  2. For each selected question:
     INSERT INTO exam_questions (exam_id, question_id, marks, question_order)
     VALUES (42, 10, 5, 1),
            (42, 11, 5, 2),
            ...

Response: {id: 42, title, totalMarks: 100, questionCount: 20, status: 'draft'}
```

#### 4. Create Announcement (Admin/Teacher)
```
Route: POST /api/admin/announcements
Body: {title, message}

Database:
  INSERT INTO announcements (title, message, posted_by, posted_at)
  VALUES ('School Holiday', 'School closed on...', 1, NOW())
  → id = 50

Response: {id: 50, title, message, posted_by: 'Admin', posted_at: '2026-04-15 10:30:00'}
```

---

### READ Operations

#### 1. Get All Users (Admin)
```
Route: GET /api/admin/users

Database:
  SELECT u.id, u.email, u.role, u.active, u.created_at,
         COALESCE(s.full_name, t.full_name, p.full_name) as full_name,
         s.roll_number, t.subject_id, p.phone
  FROM users u
  LEFT JOIN students s ON u.id = s.user_id
  LEFT JOIN teachers t ON u.id = t.user_id
  LEFT JOIN parents p ON u.id = p.user_id
  ORDER BY u.created_at DESC

Response: [
  {id: 1, email: 'admin@school.com', role: 'admin', full_name: 'Admin User', ...},
  {id: 8, email: 'john@school.com', role: 'teacher', full_name: 'John Teacher', ...},
  ...
]
```

#### 2. Get Student's Assignments (Student)
```
Route: GET /api/student/assignments

Database:
  SELECT a.*, 
         t.full_name as teacher_name,
         c.grade, c.section,
         sub.subject_name as subject,
         CASE 
           WHEN s.submitted_at <= a.due_date THEN 'on_time'
           WHEN s.submitted_at > a.due_date THEN 'late'
           ELSE NULL
         END as submission_status,
         s.submitted_at,
         s.submission_file_url,
         am.marks as obtained_marks,
         am.feedback
  FROM assignments a
  JOIN teachers t ON a.created_by = t.user_id
  JOIN classes c ON a.class_id = c.id
  JOIN subjects sub ON a.subject_id = sub.id
  LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = 25
  LEFT JOIN assignment_marks am ON s.id = am.assignment_submission_id
  WHERE a.class_id = (SELECT class_id FROM students WHERE user_id = 8)
  ORDER BY a.due_date DESC

Response: [
  {
    id: 101,
    title: 'Homework Ch5',
    description: 'Solve problems...',
    due_date: '2026-04-25',
    teacher_name: 'Mr. Kumar',
    subject: 'Math',
    submission_status: 'on_time',
    submitted_at: '2026-04-20',
    obtained_marks: 18,
    feedback: 'Good work'
  },
  ...
]
```

#### 3. Get Dashboard Data (Admin)
```
Route: GET /api/admin/dashboard

Database Queries:
  1. COUNT(DISTINCT id) as totalStudents FROM students
  2. COUNT(DISTINCT id) as totalTeachers FROM teachers
  3. COUNT(DISTINCT id) as totalParents FROM parents
  4. AVG(attendance_percent) as averageAttendance FROM [calculated]
  5. COUNT(*) as pendingLeavesCount FROM leave WHERE status = 'pending'
  6. COUNT(*) as certificatesThisMonth FROM certificate_issue WHERE MONTH(issue_date) = MONTH(NOW())
  7. SELECT * FROM announcements ORDER BY posted_at DESC LIMIT 5
  8. SELECT * FROM exams WHERE exam_date >= NOW() ORDER BY exam_date ASC LIMIT 10
  9. SELECT * FROM events WHERE event_date >= NOW() ORDER BY event_date ASC LIMIT 10
  10. Attendance chart data (last 7 days) - GROUP BY date, SUM(present), SUM(absent), SUM(late)

Response: {
  totalStudents: 250,
  totalTeachers: 30,
  totalParents: 200,
  averageAttendance: 92.5,
  pendingLeavesCount: 5,
  certificatesThisMonth: 15,
  recentAnnouncements: [...],
  upcomingExams: [...],
  upcomingEvents: [...],
  attendanceChartData: [
    {day: 'Monday', label: 'Apr 14', present: 480, absent: 30, late: 20},
    ...
  ]
}
```

#### 4. Get Exam Questions (Teacher/Student)
```
Route: GET /api/teacher/question-bank

Database:
  SELECT id, question_text, question_type, subject_id, difficulty_level, marks, options, correct_answer
  FROM question_bank
  WHERE teacher_id = 8
  ORDER BY created_at DESC

Response: [
  {
    id: 10,
    question_text: 'What is the capital of France?',
    question_type: 'multiple_choice',
    difficulty_level: 'easy',
    marks: 1,
    options: ['London', 'Paris', 'Berlin', 'Madrid'],
    correct_answer: 'Paris'
  },
  ...
]
```

---

### UPDATE Operations

#### 1. Update User (Admin)
```
Route: PUT /api/admin/users/:id
Body: {email, fullName, role, grade, section, subjectId, ...}

Database:
  1. UPDATE users SET email = ?, role = ? WHERE id = 15
  2. UPDATE students SET full_name = ?, class_id = ? WHERE user_id = 15
     (or UPDATE teachers/parents depending on role)

Response: {success: true, user: {...updated data...}}
```

#### 2. Update Assignment Submission Marks (Teacher)
```
Route: POST /api/teacher/submissions/:submissionId/mark
Body: {marks, feedback}

Database:
  INSERT INTO assignment_marks (assignment_submission_id, marks, feedback, reviewed_at)
  VALUES (1, 18, 'Good work but fix problem 5', NOW())

Response: {success: true, marks: 18, feedback: '...'}
```

#### 3. Update Exam Status (Teacher)
```
Route: PUT /api/teacher/exams/:id/publish
Body: {} (empty, just publishing)

Database:
  UPDATE exams SET status = 'published' WHERE id = 42

Response: {success: true, status: 'published'}
```

#### 4. Update PTM Status (Teacher)
```
Route: PUT /api/teacher/ptm-requests/:id
Body: {status, alternativeDate?, alternativeTime?, rejection_reason?}

Database:
  UPDATE ptm_meetings 
  SET status = 'approved' (or 'rejected' or 'reschedule_requested'),
      alternative_date = ?,
      alternative_time = ?,
      rejection_reason = ?
  WHERE id = 5

Response: {success: true, status: 'approved'}
```

#### 5. Update Student ToDo (Student)
```
Route: PUT /api/student/todos/:id
Body: {title, description, due_date, priority, status, category}

Database:
  UPDATE student_todos
  SET title = ?, description = ?, due_date = ?, priority = ?, status = ?, category = ?, updated_at = NOW()
  WHERE id = 10 AND student_id = 25

Response: {id: 10, title, status, ...}
```

---

### DELETE Operations

#### 1. Delete User (Admin)
```
Route: DELETE /api/admin/users/:id

Database:
  DELETE FROM users WHERE id = 15
  
  Due to ON DELETE CASCADE:
  - Deletes from students where user_id = 15
  - Deletes from teachers where user_id = 15
  - Deletes from parents where user_id = 15
  - Deletes all assignments created by this user
  - Deletes all attendance records for this student
  - Deletes all exam attempts
  - Etc. (all related records)

Response: {success: true, message: 'User deleted successfully'}
```

#### 2. Delete Assignment (Teacher)
```
Route: DELETE /api/teacher/assignments/:id

Database:
  DELETE FROM assignments WHERE id = 101
  
  Cascades:
  - Deletes all assignment_submissions for this assignment
  - Deletes all assignment_marks for those submissions
  - Deletes file from uploads folder

Response: {success: true}
```

#### 3. Delete Exam (Teacher)
```
Route: DELETE /api/teacher/exams/:id

Database:
  DELETE FROM exams WHERE id = 42
  
  Cascades:
  - Deletes all exam_questions linked to this exam
  - Deletes all student_exam_attempts
  - Deletes all student_exam_answers
  - Deletes all online_exam_marks

Response: {success: true}
```

#### 4. Delete Question from Exam (Teacher)
```
Route: DELETE /api/teacher/exams/:id/questions/:questionId

Database:
  DELETE FROM exam_questions WHERE exam_id = 42 AND question_id = 10
  
  Note: Question stays in question_bank, just removed from this exam

Response: {success: true}
```

#### 5. Delete Announcement (Admin/Teacher)
```
Route: DELETE /api/admin/announcements/:id

Database:
  DELETE FROM announcements WHERE id = 50 AND posted_by = (current user)

Response: {success: true}
```

---

## SECURITY & AUTHENTICATION

### Password Security
1. **Hashing:** Passwords hashed with bcryptjs (10 salt rounds)
2. **Storage:** Only hashed password stored in database
3. **Comparison:** `bcrypt.compare(plaintext, hash)` for login
4. **Reset:** Password reset tokens with expiration (not reusable)

### Authentication Flow
```
User Login:
1. POST /api/auth/login {email, password}
2. Find user by email in database
3. Compare password with bcrypt.compare()
4. If match: Generate JWT token
   jwt.sign({id, email, role}, secret, {expiresIn: '7d'})
5. Return {token, user}
6. Frontend saves token to localStorage
7. Every request: Authorization: Bearer <token>
8. Backend validates token before allowing access
9. If token expired: 401 response → automatic logout
```

### Role-Based Access Control
```
All protected routes use middleware:
router.use(authenticate);              // Check token
router.use(requireRole(['teacher']));  // Check role

Example:
POST /api/teacher/assignments
- authenticate() verifies JWT token
- requireRole(['teacher']) checks req.user.role == 'teacher'
- If not teacher: 403 Forbidden
- If teacher: Proceed to handler

Database also enforces:
- Admin can only view own data + all user data
- Teacher can only view own assignments, their class's attendance
- Student can only view own assignments, own grades
- Parent can only view own child's data
```

### Email Verification
```
User Creation:
1. User created with active = 2 (Pending)
2. Activation token generated with expiry (24 hours)
3. Email sent with activation link: /activate?token=xyz123
4. User clicks link, enters password
5. Token verified
6. Password hashed and saved
7. User status updated to active = 1
8. Can now login

If token expires:
- Request password reset instead
- New token generated
```

### Data Protection
```
1. Foreign Keys prevent orphaned records
2. ON DELETE CASCADE removes all related data
3. Unique constraints prevent duplicate emails
4. Timestamps track when records created/updated
5. Role-based query filtering:
   - Teachers see only their assignments
   - Students see only their assignments
   - Parents see only their child's grades
6. No sensitive data in JWT (only id, email, role)
```

---

## SUMMARY

**Total Tables:** 29  
**Total Controllers:** 11  
**Total Services:** 23  
**Total Routes:** 100+  
**Total Frontend Pages:** 50+  
**Authentication:** JWT (7-day expiration)  
**File Upload:** Multer (assignments, profiles, exams)  
**Database:** MySQL with relationships & cascading deletes  

This is a **professional-grade** school management system with:
- ✅ Complete CRUD operations for all entities
- ✅ Role-based access control
- ✅ Email authentication & password reset
- ✅ Real-time notifications
- ✅ File uploads (assignments, profiles)
- ✅ Online exams with auto-grading
- ✅ Attendance management
- ✅ Grade management
- ✅ Parent-teacher meetings
- ✅ Student portfolios
- ✅ AI-powered exam generation
- ✅ Comprehensive dashboards with analytics
- ✅ Responsive UI with Tailwind CSS

---

**Generated:** April 2026  
**For:** Code Review Preparation
