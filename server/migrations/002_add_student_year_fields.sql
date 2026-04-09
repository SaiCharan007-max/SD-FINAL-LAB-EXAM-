ALTER TABLE users
ADD COLUMN IF NOT EXISTS current_year VARCHAR(20);

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS student_year VARCHAR(20);

UPDATE courses
SET student_year = CASE
  WHEN student_year IS NOT NULL THEN student_year
  ELSE '2nd Year'
END
WHERE student_year IS NULL;

ALTER TABLE courses
ALTER COLUMN student_year SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_current_year ON users(current_year);
CREATE INDEX IF NOT EXISTS idx_courses_student_year ON courses(student_year);
