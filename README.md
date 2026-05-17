# EduBridge — School Management System

> A comprehensive, full-stack, role-based School Management System that digitizes every core academic operation — from AI-powered exam creation to parent-teacher meeting workflows.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Demo Credentials](#-demo-credentials)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Acknowledgements](#-acknowledgements)

---

## 🌟 Overview

EduBridge is a production-ready, full-stack school management platform built with **React 18**, **TypeScript**, **Node.js/Express**, and **MySQL**. It provides four dedicated role-based portals (Admin, Teacher, Student, Parent), each with a tailored feature set that covers the complete academic lifecycle of a school.

Key highlights:
- 🤖 **AI-powered question extraction** using Google Gemini (upload PDF/PPT → generate exam questions)
- 📊 **Analytics & reporting** across 6 report types with interactive charts and PDF/CSV export
- 🤝 **Smart PTM system** — a full parent-teacher communication workflow with rescheduling and feedback
- 🔐 **JWT-based auth** with role-based access control across all API routes
- 📄 **PDF generation** for progress cards, certificates, and analytics reports

---

## 🚀 Features

### 🔵 Admin Portal
| Module | Description |
|---|---|
| Dashboard | System-wide KPIs — active users, pending leaves, attendance overview |
| User Management | Full CRUD for Students, Teachers, and Parents with role-specific data |
| Timetable | Create and manage weekly class schedules per teacher and class |
| Leave Approval | Review, approve, reject, or cancel teacher leave requests |
| Scholarship Engine | Dynamically filter and award scholarships based on configurable eligibility criteria (income, rank, grade) |
| Certificate Management | Issue certificates by type per student, generate styled PDF certificates |
| Progress Card Generation | Per-student, per-term academic progress card with PDF export |
| Student Portfolio | View and manage student achievement and portfolio entries |
| Reports & Analytics | 6 report types (Attendance, Exam, Certificate, Scholarship, User, PTM Feedback) with Recharts visualizations + PDF & CSV export |
| Announcements & Events | Post school-wide announcements and events |

### 🟢 Teacher Portal
| Module | Description |
|---|---|
| Dashboard | Class overview, pending tasks, quick stats |
| Attendance | Mark daily attendance per class |
| Assignments | Full lifecycle — create, assign, review submissions, mark with late detection |
| Exam Builder | Multi-step wizard: setup → pick from Question Bank or extract via AI → publish |
| Question Bank | Manual entry (MCQ, True/False, Short Answer) or AI-powered extraction from uploaded lesson files |
| AI Question Extraction | Upload PDF/PPT/TXT → instruct Gemini (e.g. "10 MCQs, medium difficulty") → review & save |
| Mark Upload | Submit term exam marks and CA marks per student |
| Leave Management | Apply for leave with leave balance tracking, half-day support, relief teacher assignment |
| PTM Management | Initiate or respond to parent meetings, approve/reject/reschedule, submit post-meeting feedback + star rating |
| Student Portfolio | View and manage student portfolio for assigned classes |
| Reports | Student performance and class progress analytics |

### 🟡 Student Portal
| Module | Description |
|---|---|
| Dashboard | Pending assignments, upcoming exams, recent announcements |
| To-Do List | Personal task manager with priority levels, categories, and due dates |
| Assignments | View, submit, and track submission status with grade visibility |
| Online Exams | Timed exam-taking interface with live countdown and auto-submit |
| Results | View marks and grades per subject per term |
| Attendance | Full personal attendance history with percentage tracking |
| Portfolio | View own achievement entries |
| Timetable | Weekly class schedule |

### 🟠 Parent Portal
| Module | Description |
|---|---|
| Dashboard | Child's real-time performance and attendance snapshot |
| Attendance | Full child attendance history |
| Results | Child's exam scores and subject-wise marks |
| PTM Booking | Request meetings, propose alternative slots, leave post-meeting feedback + star rating |
| Portfolio | View child's achievement portfolio |
| Timetable | Child's weekly schedule |
| Announcements & Events | School-wide communication |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & HMR dev server |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| Recharts | Data visualization (Bar, Pie, Line charts) |
| jsPDF + AutoTable | PDF generation |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | HTTP server & REST API |
| TypeScript | Type safety |
| MySQL2 | Database driver |
| JSON Web Token (JWT) | Stateless authentication |
| Bcryptjs | Password hashing |
| Multer | File upload handling |
| Nodemailer | Email service (account activation) |
| ts-node-dev | Hot-reload dev server |

### External Services
| Service | Purpose |
|---|---|
| Google Gemini API | AI-powered question extraction from lesson files |

---

## 📁 Project Structure

```
edubridge/
├── frontend/                    # React + TypeScript + Tailwind CSS
│   └── src/
│       ├── components/
│       │   ├── common/          # Toast, modals, shared UI
│       │   └── layout/          # DashboardLayout, Sidebar, Navbar
│       ├── context/             # AuthContext (JWT & user state)
│       ├── pages/
│       │   ├── admin/           # Admin portal pages
│       │   ├── teacher/         # Teacher portal pages
│       │   ├── student/         # Student portal pages
│       │   └── parent/          # Parent portal pages
│       ├── services/            # Axios API client (api.ts)
│       └── types/               # TypeScript interfaces & types
│
└── backend/                     # Node.js + Express + TypeScript
    ├── src/
    │   ├── config/              # Database pool, environment
    │   ├── controllers/         # Request handlers (thin layer)
    │   ├── services/            # Business logic (thick layer)
    │   ├── routes/              # Route definitions per role
    │   └── middleware/          # Auth, role guards
    ├── database/
    │   ├── schema.sql           # Full DB schema (20+ tables)
    │   └── seed-data.sql        # Sample data for all roles
    └── scripts/                 # Utility/migration scripts
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **MySQL** v8 or higher
- **npm** v9 or higher
- A **Google Gemini API key** (for AI question extraction)

---

### 1. Clone & Install

```bash
git clone <repository-url>
cd edubridge
```

### 2. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run schema and seed data
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed-data.sql
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=edubridge

JWT_SECRET=your_jwt_secret_key
PORT=5000

GEMINI_API_KEY=your_google_gemini_api_key

# Email (for account activation)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
```

```bash
# Start backend dev server
npm run dev
# Runs on http://localhost:5000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start frontend dev server
npm run dev
# Runs on http://localhost:5173
```

---

## 🔐 Demo Credentials

> **Default password for all accounts:** `password123`

| Role | Email |
|---|---|
| Admin | `admin@edubridge.com` |
| Teacher | `prakash.saneshan@gmail.com` |
| Student | `kavingj.suthakaran@gmail.com` |
| Parent | `suthaseena@hotamail.com` |

---

## 📡 API Reference

All routes are prefixed with `/api`. Protected routes require a `Bearer <token>` Authorization header.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/activate` | Activate account via email token |

### Admin — Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/users/:id` | Get user by ID |
| POST | `/api/admin/users/student` | Create student |
| POST | `/api/admin/users/teacher` | Create teacher |
| POST | `/api/admin/users/parent` | Create parent |
| PUT | `/api/admin/users/:id` | Update user |
| PATCH | `/api/admin/users/:id/status` | Toggle user active status |
| DELETE | `/api/admin/users/:id` | Delete user |

### Admin — Academic
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET/POST/PUT/DELETE | `/api/admin/timetable` | Timetable CRUD |
| GET/POST/PUT/DELETE | `/api/admin/announcements` | Announcements CRUD |
| GET/POST/PUT/DELETE | `/api/admin/events` | Events CRUD |
| GET | `/api/admin/progress-card/:studentId` | Student progress card data |
| GET/POST/DELETE | `/api/admin/certificates` | Certificate management |
| GET | `/api/admin/scholarships/eligible` | Get scholarship-eligible students |

### Admin — Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/reports/attendance` | Attendance report |
| GET | `/api/admin/reports/exams` | Exam performance report |
| GET | `/api/admin/reports/certificates` | Certificate issuance report |
| GET | `/api/admin/reports/scholarships` | Scholarship report |
| GET | `/api/admin/reports/users` | User report |
| GET | `/api/admin/reports/ptm-feedback` | PTM feedback report |

### Teacher
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/teacher/dashboard` | Teacher dashboard |
| POST | `/api/teacher/attendance` | Mark attendance |
| GET/POST/PUT/DELETE | `/api/teacher/assignments` | Assignment management |
| GET/POST | `/api/teacher/exams` | Exam management |
| POST | `/api/teacher/ai/extract-questions` | AI question extraction |
| GET/POST | `/api/teacher/question-bank` | Question bank management |
| POST | `/api/teacher/marks` | Upload student marks |
| GET/POST | `/api/teacher/leave` | Leave management |
| GET/PUT | `/api/teacher/ptm` | PTM management |

### Student
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/student/dashboard` | Student dashboard |
| GET/POST | `/api/student/assignments` | View & submit assignments |
| GET/POST | `/api/student/exams` | View & take exams |
| GET | `/api/student/results` | View exam results |
| GET | `/api/student/attendance` | View attendance |
| GET/POST/DELETE | `/api/student/todos` | Personal to-do list |

### Parent
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/parent/dashboard` | Parent dashboard |
| GET | `/api/parent/child/attendance` | Child attendance |
| GET | `/api/parent/child/results` | Child results |
| GET/POST/PUT | `/api/parent/ptm` | PTM booking & management |

---

## 🗄️ Database Schema

The database consists of **20+ normalized relational tables**:

```
Core
├── users                    # All user accounts (role-based)
├── students                 # Student profile & class assignment
├── teachers                 # Teacher profile & subject assignment
├── parents                  # Parent profile & contact info
└── classes                  # Grade-section class definitions

Academic
├── subjects                 # Subject master list
├── timetable                # Weekly schedule per class
├── attendance               # Daily attendance records
├── assignments              # Assignment definitions
├── assignment_submissions   # Student submissions
├── assignment_marks         # Graded results
├── exams                    # Exam definitions
├── exam_questions           # Questions linked to exams
├── question_bank            # Teacher question repository
├── exam_submissions         # Student exam attempts
└── marks                    # Term & CA marks per student

Administration
├── announcements            # School announcements
├── events                   # School events
├── ptm_meetings             # Parent-teacher meeting requests
├── ptm_feedback             # Post-meeting feedback & ratings
├── leaves                   # Teacher leave applications
├── leave_types              # Leave type definitions (Annual, Medical, etc.)
├── leave_balances           # Per-teacher leave quotas
├── certificates             # Issued certificates
├── certificate_types        # Certificate type definitions
├── scholarships             # Scholarship awards
├── student_portfolio        # Student achievement entries
└── activation_tokens        # Email activation tokens
```

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────┐
                    │        React Frontend         │
                    │  (Vite + TypeScript + Tailwind)│
                    └────────────┬────────────────-─┘
                                 │ HTTP / Axios
                    ┌────────────▼─────────────────┐
                    │     Express REST API          │
                    │  Routes → Controllers → Services│
                    └────────────┬─────────────────┘
                                 │ MySQL2
                    ┌────────────▼─────────────────┐
                    │         MySQL Database         │
                    │      (20+ normalized tables)   │
                    └──────────────────────────────-─┘
                                 │
                    ┌────────────▼─────────────────┐
                    │      Google Gemini API         │
                    │   (AI Question Extraction)     │
                    └──────────────────────────────-─┘
```

- **Authentication:** Stateless JWT — token verified on every protected route via `authenticate` middleware
- **Authorization:** Role-based guard via `requireRole(['admin'])` / `requireRole(['teacher'])` etc.
- **Business Logic:** Thin controllers delegate all logic to service classes
- **Transactions:** All multi-table write operations use MySQL transactions with rollback on failure

---

## 🙏 Acknowledgements

Special thanks to **Chalani Oruthotaarachchi**, project supervisor, for her continuous guidance, encouragement, and support throughout the development of this project.

---

## 📄 License

This project is developed for educational purposes as part of an academic software development project.
