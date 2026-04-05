-- Thêm cột duration_minutes vào bảng assignments
ALTER TABLE assignments ADD COLUMN duration_minutes INT DEFAULT 15;

-- Cập nhật bài tập mẫu với thời gian 15 phút
UPDATE assignments SET duration_minutes = 15 WHERE id = 1;

-- Thêm một bài tập mẫu khác để kiểm tra tính năng "Active Assessments" Dashboard
INSERT INTO assignments (id, title, instructions, max_score, due_date, type, team_id, duration_minutes, created_at)
VALUES (2, 'Midterm Calculus', 'Derivatives, Integrals and their applications in real-world scenarios.', 100.0, DATE_ADD(NOW(), INTERVAL 14 DAY), 'QUIZ', 1, 90, NOW());

-- Thêm câu hỏi cho bài Midterm Calculus (id=2)
INSERT INTO questions (id, assignment_id, content, points, question_type, display_order)
VALUES (3, 2, 'What is the derivative of sin(x)?', 10.0, 'SINGLE_CHOICE', 1);

INSERT INTO answer_options (id, question_id, content, is_correct, display_order) VALUES
(9, 3, 'cos(x)', TRUE, 1),
(10, 3, '-cos(x)', FALSE, 2),
(11, 3, 'tan(x)', FALSE, 3),
(12, 3, 'sec(x)', FALSE, 4);
