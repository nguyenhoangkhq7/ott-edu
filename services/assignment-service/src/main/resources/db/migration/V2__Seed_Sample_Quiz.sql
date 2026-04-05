-- Thêm một bài tập mẫu (Quiz)
INSERT INTO assignments (id, title, instructions, max_score, due_date, type, team_id, created_at)
VALUES (1, 'Kiểm tra kiến thức Java cơ bản', 'Hãy chọn đáp án đúng nhất cho các câu hỏi sau. Thời gian làm bài 15 phút.', 10.0, DATE_ADD(NOW(), INTERVAL 7 DAY), 'QUIZ', 1, NOW());

-- Thêm câu hỏi số 1
INSERT INTO questions (id, assignment_id, content, points, question_type, display_order)
VALUES (1, 1, 'Ngôn ngữ Java được phát triển bởi công ty nào?', 5.0, 'SINGLE_CHOICE', 1);

-- Các lựa chọn cho câu hỏi 1
INSERT INTO answer_options (id, question_id, content, is_correct, display_order) VALUES
(1, 1, 'Microsoft', FALSE, 1),
(2, 1, 'Sun Microsystems (nay là Oracle)', TRUE, 2),
(3, 1, 'Google', FALSE, 3),
(4, 1, 'Apple', FALSE, 4);

-- Thêm câu hỏi số 2
INSERT INTO questions (id, assignment_id, content, points, question_type, display_order)
VALUES (2, 1, 'JDK là viết tắt của cụm từ nào?', 5.0, 'SINGLE_CHOICE', 2);

-- Các lựa chọn cho câu hỏi 2
INSERT INTO answer_options (id, question_id, content, is_correct, display_order) VALUES
(5, 2, 'Java Development Kit', TRUE, 1),
(6, 2, 'Java Design Kit', FALSE, 2),
(7, 2, 'Java Desktop Kit', FALSE, 3),
(8, 2, 'Java Deployment Kit', FALSE, 4);
