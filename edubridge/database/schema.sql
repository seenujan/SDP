DROP DATABASE IF EXISTS school_management_system;
CREATE DATABASE school_management_system
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE school_management_system;

SET FOREIGN_KEY_CHECKS=0;

-- USERS
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255),
  role ENUM('admin','teacher','student','parent') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active TINYINT(1) DEFAULT 0
);

-- ACTIVATION TOKENS
CREATE TABLE activation_tokens (
  token VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ANNOUNCEMENTS
CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  posted_by INT NOT NULL,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- CLASSES
CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grade VARCHAR(50) NOT NULL,
  section VARCHAR(10) NOT NULL,
  class_teacher_id INT NOT NULL,
  UNIQUE (grade, section),
  FOREIGN KEY (class_teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- STUDENTS
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  roll_number VARCHAR(20),
  class_id INT NOT NULL,
  date_of_birth DATE,
  parent_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- SUBJECTS (New)
CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL UNIQUE
);

-- ASSIGNMENTS
CREATE TABLE assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  due_date DATETIME NOT NULL,
  due_date DATETIME NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  assignment_file_url VARCHAR(500),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- ASSIGNMENT SUBMISSIONS
CREATE TABLE assignment_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  submission_file_url VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ASSIGNMENT MARKS
CREATE TABLE assignment_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_submission_id INT NOT NULL,
  marks DECIMAL(5,2) NOT NULL,
  feedback TEXT,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_submission_id)
    REFERENCES assignment_submissions(id) ON DELETE CASCADE
);

-- ATTENDANCE
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  status ENUM('present','absent','late') NOT NULL,
  date DATE NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- CERTIFICATES
-- CERTIFICATE TYPES
CREATE TABLE certificate_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CERTIFICATE ISSUE
CREATE TABLE certificate_issue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  certificate_type_id INT NOT NULL,
  issue_date DATE NOT NULL,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  issued_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE CASCADE
);
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id)
);

-- EVENTS
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_by INT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- EXAMS
CREATE TABLE exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  exam_date DATE NOT NULL,
  duration INT NOT NULL,
  total_marks INT DEFAULT 0,
  status ENUM('draft','published','archived') DEFAULT 'draft',
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- QUESTION BANK
CREATE TABLE question_bank (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice','true_false','short_answer','essay') NOT NULL,
  subject_id INT,
  topic VARCHAR(150),
  difficulty_level ENUM('easy','medium','hard') DEFAULT 'medium',
  marks INT DEFAULT 1,
  options TEXT,
  correct_answer TEXT,
  teacher_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- EXAM QUESTIONS
CREATE TABLE exam_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  question_id INT NOT NULL,
  marks INT NOT NULL,
  question_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (exam_id, question_id),
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('ptm','system','assignment','exam') DEFAULT 'system',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ONLINE EXAM MARKS
CREATE TABLE online_exam_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  exam_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  entered_by INT,
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- PARENTS
CREATE TABLE parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- PASSWORD RESETS
CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TEACHERS
CREATE TABLE teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  subject_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- PORTFOLIOS
CREATE TABLE portfolios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  teacher_id INT,
  performance_summary TEXT,
  activities_achievements TEXT,
  areas_improvement TEXT,
  teacher_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- PTM MEETINGS
CREATE TABLE ptm_meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  teacher_id INT NOT NULL,
  parent_id INT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time VARCHAR(20) NOT NULL,
  status ENUM('pending','approved','rejected','completed','reschedule_requested') DEFAULT 'pending',
  initiator ENUM('parent','teacher') DEFAULT 'parent',
  notes TEXT,
  rejection_reason TEXT,
  alternative_date DATE,
  alternative_time VARCHAR(20),
  teacher_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES users(id)
);

-- PTM FEEDBACK
CREATE TABLE ptm_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ptm_meeting_id INT NOT NULL,
  feedback_from ENUM('teacher','parent') NOT NULL,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ptm_meeting_id) REFERENCES ptm_meetings(id) ON DELETE CASCADE
);

-- STUDENT EXAM ATTEMPTS
CREATE TABLE student_exam_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  exam_id INT NOT NULL,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  status ENUM('in_progress','submitted','evaluated') DEFAULT 'in_progress',
  total_score DECIMAL(10,2) DEFAULT 0.00,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- STUDENT EXAM ANSWERS
CREATE TABLE student_exam_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_option VARCHAR(255),
  text_answer TEXT,
  FOREIGN KEY (attempt_id) REFERENCES student_exam_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE
);

-- STUDENT TODOS
CREATE TABLE student_todos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  priority ENUM('high','medium','low') DEFAULT 'medium',
  status ENUM('pending','in_progress','completed') DEFAULT 'pending',
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- TERM MARKS
CREATE TABLE term_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  term VARCHAR(50) NOT NULL,
  marks DECIMAL(5,2) NOT NULL,
  feedback TEXT,
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- TIMETABLE
CREATE TABLE timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  teacher_id INT NOT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS=1;
