CREATE DATABASE IF NOT EXISTS school_management_system;
USE school_management_system;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table (Stores users: admin, teacher, student, parent)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Classes Table (Store class details and class teacher)
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade VARCHAR(50) NOT NULL,        -- e.g. "Grade 10"
    section VARCHAR(10) NOT NULL,      -- e.g. "A"
    class_teacher_id INT NOT NULL,
    UNIQUE (grade, section),           -- prevents duplicate Grade 10A
    FOREIGN KEY (class_teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    class_id INT NOT NULL,             -- FK to classes
    date_of_birth DATE,
    parent_id INT NOT NULL,
    roll_number VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT
);

-- 4. Parents Table
CREATE TABLE IF NOT EXISTS parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,  -- Foreign key to users table
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,  -- Foreign key to users table
    full_name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Term Marks Table (Teacher-Entered Marks)
CREATE TABLE IF NOT EXISTS term_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,  -- Foreign key to students table
    teacher_id INT NOT NULL,  -- Teacher who entered the marks
    subject VARCHAR(100) NOT NULL,  -- Subject for the term mark
    term VARCHAR(50) NOT NULL,  -- Term (e.g., "Term 1", "Final")
    marks DECIMAL(5,2) NOT NULL,  -- Marks entered by the teacher
    feedback TEXT DEFAULT NULL,  -- Feedback from the teacher
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When the marks were entered
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Assignments Table (Assignment Metadata with Deadline)
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date DATETIME NOT NULL,  -- Deadline for the assignment
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    section VARCHAR(10),
    created_by INT NOT NULL,  -- Teacher who created the assignment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Assignment Submissions Table (Student Assignment Submissions)
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,  -- Foreign key to assignments table
    student_id INT NOT NULL,  -- Foreign key to students table
    submission_file_url VARCHAR(255) NOT NULL,  -- URL or file path to the submitted file
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Time when the student submitted the assignment
    status ENUM('on_time', 'late', 'graded') NOT NULL DEFAULT 'on_time',  -- Whether the submission was on time or late
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 9. Assignment Marks Table (Teacher-entered marks for assignments)
CREATE TABLE IF NOT EXISTS assignment_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_submission_id INT NOT NULL,  -- Foreign key to assignment_submissions table
    marks DECIMAL(5,2) NOT NULL,  -- Marks awarded for the submission
    feedback TEXT DEFAULT NULL,  -- Feedback from the teacher
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When the teacher reviewed the assignment
    FOREIGN KEY (assignment_submission_id) REFERENCES assignment_submissions(id) ON DELETE CASCADE
);

-- 10. Attendance Table (Tracking student attendance)
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,  -- Foreign key to students table
    status ENUM('present', 'absent', 'late') NOT NULL,
    date DATE NOT NULL,
    class VARCHAR(50),
    subject VARCHAR(100),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 11. Exams Table (Storing exam details)
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    exam_date DATE NOT NULL,
    duration INT NOT NULL,  -- Duration in minutes
    grade VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Online Exam Marks Table (Auto-corrected marks for online exams)
CREATE TABLE IF NOT EXISTS online_exam_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,  -- Foreign key to students table
    exam_id INT NOT NULL,  -- Foreign key to exams table
    score DECIMAL(5,2) NOT NULL,  -- Automatically generated score
    entered_by INT DEFAULT NULL,  -- NULL means auto-generated, otherwise teacher-entered
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 13. Announcements Table (School-wide announcements)
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    posted_by INT NOT NULL,  -- Admin or Teacher
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. Events Table (School events like annual day, sports day)
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    created_by INT NOT NULL,  -- Admin or Teacher
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 15. Parent-Teacher Meeting (PTM) Table
CREATE TABLE IF NOT EXISTS ptm_meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    teacher_id INT NOT NULL,
    meeting_date DATE NOT NULL,
    status ENUM('pending', 'confirmed', 'completed') NOT NULL,
    notes TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- 16. PTM Feedback Table (Feedback from teacher and parent)
CREATE TABLE IF NOT EXISTS ptm_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ptm_meeting_id INT NOT NULL,  -- Foreign key to ptm_meetings table
    feedback_from ENUM('teacher', 'parent') NOT NULL,  -- Specifies feedback from teacher or parent
    feedback TEXT NOT NULL,  -- The actual feedback
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When the feedback was created
    FOREIGN KEY (ptm_meeting_id) REFERENCES ptm_meetings(id) ON DELETE CASCADE
);

-- 17. Portfolio Table (Storing student portfolios)
CREATE TABLE IF NOT EXISTS portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    teacher_id INT NOT NULL,
    performance_summary TEXT,
    activities_achievements TEXT,
    areas_improvement TEXT,
    teacher_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 18. Certificates Table (Storing student certificates)
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    certificate_type VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    issue_date DATE NOT NULL,
    certificate_number VARCHAR(50) NOT NULL UNIQUE,
    issued_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 19. Question Bank Table (Storing online exam questions)
CREATE TABLE IF NOT EXISTS question_bank (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,  -- The text of the question
    question_type ENUM('multiple_choice', 'short_answer', 'true_false') NOT NULL,  -- Type of the question
    options TEXT,  -- For multiple-choice questions, options will be stored as JSON or CSV string
    correct_answer TEXT NOT NULL,  -- The correct answer for this question
    created_by INT NOT NULL,  -- Teacher who created the question
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 20. Exam Questions Table (Linking exams and questions)
CREATE TABLE IF NOT EXISTS exam_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    question_id INT NOT NULL,
    marks INT NOT NULL,
    question_order INT NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE
);

-- 20. Timetable Table (Using class_id)
CREATE TABLE IF NOT EXISTS timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,  -- Foreign key to classes table
    subject VARCHAR(100) NOT NULL,  -- Subject taught
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    teacher_id INT NOT NULL,  -- Teacher who is assigned to this subject and class
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 21. Student Todos
CREATE TABLE IF NOT EXISTS student_todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 22. Student Exam Attempts
CREATE TABLE IF NOT EXISTS student_exam_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    exam_id INT NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    status ENUM('in_progress', 'submitted', 'evaluated') DEFAULT 'in_progress',
    total_score DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 23. Student Exam Answers
CREATE TABLE IF NOT EXISTS student_exam_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option VARCHAR(255) NULL,
    text_answer TEXT NULL,
    is_correct BOOLEAN DEFAULT NULL,
    marks_awarded DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (attempt_id) REFERENCES student_exam_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE
);

-- Adding indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_teachers_subject ON teachers(subject);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_exams_subject ON exams(subject);
CREATE INDEX idx_marks_exam_id ON online_exam_marks(exam_id);
CREATE INDEX idx_ptm_meetings_student_id ON ptm_meetings(student_id);
CREATE INDEX idx_classes_class_teacher_id ON classes(class_teacher_id);

SET FOREIGN_KEY_CHECKS = 1;
