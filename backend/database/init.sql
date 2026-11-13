CREATE DATABASE IF NOT EXISTS online_exam;
USE online_exam;

CREATE TABLE students (
 id INT AUTO_INCREMENT PRIMARY KEY,
 full_name VARCHAR(150) NOT NULL,
 email VARCHAR(150) NOT NULL UNIQUE,
 student_number VARCHAR(60) NOT NULL UNIQUE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exams (
 id INT AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(180) NOT NULL,
 description TEXT,
 duration_minutes INT NOT NULL,
 start_at DATETIME NOT NULL,
 end_at DATETIME NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
 id INT AUTO_INCREMENT PRIMARY KEY,
 exam_id INT NOT NULL,
 question_text TEXT NOT NULL,
 option_a VARCHAR(500) NOT NULL,
 option_b VARCHAR(500) NOT NULL,
 option_c VARCHAR(500) NOT NULL,
 option_d VARCHAR(500) NOT NULL,
 correct_option ENUM('A','B','C','D') NOT NULL,
 marks INT NOT NULL DEFAULT 1,
 FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE TABLE submissions (
 id INT AUTO_INCREMENT PRIMARY KEY,
 student_id INT NOT NULL,
 exam_id INT NOT NULL,
 answers_json JSON NOT NULL,
 score INT NOT NULL,
 total_marks INT NOT NULL,
 submitted_at DATETIME NOT NULL,
 UNIQUE KEY one_submission_per_exam(student_id,exam_id),
 FOREIGN KEY(student_id) REFERENCES students(id),
 FOREIGN KEY(exam_id) REFERENCES exams(id)
);

INSERT INTO students(full_name,email,student_number) VALUES
('Aline Mukamana','aline@example.com','STU001'),
('Eric Niyonzima','eric@example.com','STU002');

INSERT INTO exams(title,description,duration_minutes,start_at,end_at) VALUES
('Introduction to ICT','Sample multiple-choice examination',30,DATE_SUB(NOW(),INTERVAL 1 HOUR),DATE_ADD(NOW(),INTERVAL 30 DAY));

INSERT INTO questions(exam_id,question_text,option_a,option_b,option_c,option_d,correct_option,marks) VALUES
(1,'What does CPU stand for?','Central Processing Unit','Computer Personal Unit','Central Program Utility','Control Processing User','A',2),
(1,'Which one is an input device?','Monitor','Keyboard','Speaker','Projector','B',1),
(1,'Which language is used to structure web pages?','CSS','SQL','HTML','PHP','C',1);
