BEGIN;

DROP TABLE IF EXISTS exam_rankings CASCADE;
DROP TABLE IF EXISTS attempt_questions CASCADE;
DROP TABLE IF EXISTS exam_attempts CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS faculty_courses CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS exam_status CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS answer_option CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM ('admin', 'faculty', 'student');
CREATE TYPE answer_option AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE difficulty_level AS ENUM ('Easy', 'Medium', 'Hard');
CREATE TYPE exam_status AS ENUM ('Upcoming', 'Ongoing', 'Completed');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  employee_id VARCHAR(50) UNIQUE,
  current_year VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    current_year IS NULL
    OR current_year IN ('1st Year', '2nd Year', '3rd Year', '4th Year')
  ),
  CHECK (
    role <> 'student'
    OR current_year IS NOT NULL
  )
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  course_name VARCHAR(150) NOT NULL,
  course_code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  student_year VARCHAR(20) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (student_year IN ('1st Year', '2nd Year', '3rd Year', '4th Year'))
);

CREATE TABLE faculty_courses (
  id SERIAL PRIMARY KEY,
  faculty_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE (faculty_id, course_id)
);

CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  academic_year VARCHAR(20) NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer answer_option NOT NULL,
  difficulty difficulty_level NOT NULL,
  uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exams (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  academic_year VARCHAR(20) NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes BETWEEN 10 AND 180),
  num_questions INT NOT NULL CHECK (num_questions > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_attempts (
  id SERIAL PRIMARY KEY,
  exam_id INT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  is_submitted BOOLEAN DEFAULT FALSE,
  score INT,
  time_taken_sec INT,
  UNIQUE (exam_id, student_id)
);

CREATE TABLE attempt_questions (
  id SERIAL PRIMARY KEY,
  attempt_id INT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  shuffled_order INT NOT NULL,
  opt1_text TEXT NOT NULL,
  opt2_text TEXT NOT NULL,
  opt3_text TEXT NOT NULL,
  opt4_text TEXT NOT NULL,
  opt1_original answer_option NOT NULL,
  opt2_original answer_option NOT NULL,
  opt3_original answer_option NOT NULL,
  opt4_original answer_option NOT NULL,
  student_answer INT CHECK (student_answer BETWEEN 1 AND 4),
  is_correct BOOLEAN
);

CREATE TABLE exam_rankings (
  id SERIAL PRIMARY KEY,
  exam_id INT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL,
  time_taken_sec INT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  rank INT NOT NULL,
  UNIQUE (exam_id, student_id)
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_current_year ON users(current_year);
CREATE INDEX idx_faculty_courses_faculty ON faculty_courses(faculty_id);
CREATE INDEX idx_faculty_courses_course ON faculty_courses(course_id);
CREATE INDEX idx_courses_student_year ON courses(student_year);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_questions_course_year ON questions(course_id, academic_year);
CREATE INDEX idx_exams_course_year ON exams(course_id, academic_year);
CREATE INDEX idx_exam_attempts_exam_student ON exam_attempts(exam_id, student_id);
CREATE INDEX idx_attempt_questions_attempt ON attempt_questions(attempt_id);
CREATE INDEX idx_exam_rankings_exam_rank ON exam_rankings(exam_id, rank);

COMMIT;
