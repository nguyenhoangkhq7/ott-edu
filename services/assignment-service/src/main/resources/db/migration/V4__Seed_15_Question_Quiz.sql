-- V4__Seed_15_Question_Quiz.sql

-- 1. Create the Assignment (Duration: 30 minutes, 15 questions, Total Points: 100)
INSERT INTO assignments (team_id, creator_id, title, description, start_time, end_time, duration_minutes, status, created_at)
VALUES (
    1, 
    1, 
    'Kiểm tra định kỳ: Lập trình Java nâng cao', 
    'Bài kiểm tra tổng hợp kiến thức về OOP, Collections, và Exception Handling. Gồm 15 câu hỏi.', 
    NOW(), 
    DATE_ADD(NOW(), INTERVAL 7 DAY), 
    30, 
    'ACTIVE', 
    NOW()
);

SET @assignment_id = LAST_INSERT_ID();

-- 2. Insert 15 Questions
-- Question 1
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Cú pháp nào được dùng để khai báo một mảng trong Java?', 'SINGLE_CHOICE', 7, 1);
SET @q1 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q1, 'int[] arr;', true), (@q1, 'int arr();', false), (@q1, 'array int arr;', false), (@q1, 'int arr[];', true);

-- Question 2
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Trong Java, từ khóa "final" dùng cho class có ý nghĩa gì?', 'SINGLE_CHOICE', 7, 2);
SET @q2 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q2, 'Class không thể bị kế thừa', true), (@q2, 'Class không thể khởi tạo đối tượng', false), (@q2, 'Các phương thức trong class đều là static', false), (@q2, 'Class không thể có constructor', false);

-- Question 3
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'ArrayList trong Java thuộc package nào?', 'SINGLE_CHOICE', 6, 3);
SET @q3 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q3, 'java.util', true), (@q3, 'java.lang', false), (@q3, 'java.io', false), (@q3, 'java.sql', false);

-- Question 4
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Phương thức nào được gọi tự động khi một đối tượng được tạo ra?', 'SINGLE_CHOICE', 6, 4);
SET @q4 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q4, 'Constructor', true), (@q4, 'Main method', false), (@q4, 'Static method', false), (@q4, 'Finalizer', false);

-- Question 5
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Đâu là một Interface trong Java?', 'SINGLE_CHOICE', 6, 5);
SET @q5 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q5, 'List', true), (@q5, 'ArrayList', false), (@q5, 'HashMap', false), (@q5, 'Integer', false);

-- Question 6
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Từ khóa nào dùng để kế thừa một Class?', 'SINGLE_CHOICE', 7, 6);
SET @q6 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q6, 'extends', true), (@q6, 'implements', false), (@q6, 'inherits', false), (@q6, 'this', false);

-- Question 7
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Kích thước của biến kiểu char trong Java là bao nhiêu bit?', 'SINGLE_CHOICE', 6, 7);
SET @q7 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q7, '16 bit', true), (@q7, '8 bit', false), (@q7, '32 bit', false), (@q7, '64 bit', false);

-- Question 8
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Exception nào xảy ra khi truy cập mảng vượt quá chỉ số?', 'SINGLE_CHOICE', 7, 8);
SET @q8 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q8, 'ArrayIndexOutOfBoundsException', true), (@q8, 'NullPointerException', false), (@q8, 'ClassCastException', false), (@q8, 'IOException', false);

-- Question 9
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Từ khóa "static" có ý nghĩa gì đối với một biến?', 'SINGLE_CHOICE', 7, 9);
SET @q9 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q9, 'Biến thuộc về class, không phải đối tượng', true), (@q9, 'Biến không thể thay đổi giá trị', false), (@q9, 'Biến chỉ có thể dùng trong hàm main', false), (@q9, 'Biến được lưu trong bộ nhớ Stack', false);

-- Question 10
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Để so sánh hai chuỗi trong Java, ta nên dùng phương thức nào?', 'SINGLE_CHOICE', 7, 10);
SET @q10 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q10, 'equals()', true), (@q10, '==', false), (@q10, 'compare()', false), (@q10, 'isEqual()', false);

-- Question 11
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Phương thức nào dùng để dừng một luồng (thread) một cách an toàn?', 'SINGLE_CHOICE', 6, 11);
SET @q11 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q11, 'Sử dụng cờ (flag) hoặc interrupt()', true), (@q11, 'stop()', false), (@q11, 'suspend()', false), (@q11, 'destroy()', false);

-- Question 12
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Lớp nào là lớp cha của tất cả các lớp trong Java?', 'SINGLE_CHOICE', 6, 12);
SET @q12 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q12, 'Object', true), (@q12, 'Class', false), (@q12, 'Main', false), (@q12, 'System', false);

-- Question 13
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Đâu không phải là tính chất của OOP?', 'SINGLE_CHOICE', 7, 13);
SET @q13 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q13, 'Compilation', true), (@q13, 'Abstration', false), (@q13, 'Inheritance', false), (@q13, 'Polymorphism', false);

-- Question 14
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'Đâu là kiểu dữ liệu tham chiếu trong Java?', 'SINGLE_CHOICE', 6, 14);
SET @q14 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q14, 'String', true), (@q14, 'int', false), (@q14, 'float', false), (@q14, 'boolean', false);

-- Question 15
INSERT INTO questions (assignment_id, content, question_type, points, position) VALUES (@assignment_id, 'JVM là viết tắt của từ gì?', 'SINGLE_CHOICE', 7, 15);
SET @q15 = LAST_INSERT_ID();
INSERT INTO question_options (question_id, content, is_correct) VALUES (@q15, 'Java Virtual Machine', true), (@q15, 'Java Visual Machine', false), (@q15, 'Java Variable Manager', false), (@q15, 'Java Version Manager', false);
