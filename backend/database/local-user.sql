CREATE DATABASE IF NOT EXISTS online_exam;
CREATE USER IF NOT EXISTS 'exam_user'@'localhost' IDENTIFIED BY 'exam_password';
CREATE USER IF NOT EXISTS 'exam_user'@'127.0.0.1' IDENTIFIED BY 'exam_password';
ALTER USER 'exam_user'@'localhost' IDENTIFIED BY 'exam_password';
ALTER USER 'exam_user'@'127.0.0.1' IDENTIFIED BY 'exam_password';
GRANT ALL PRIVILEGES ON online_exam.* TO 'exam_user'@'localhost';
GRANT ALL PRIVILEGES ON online_exam.* TO 'exam_user'@'127.0.0.1';
FLUSH PRIVILEGES;
