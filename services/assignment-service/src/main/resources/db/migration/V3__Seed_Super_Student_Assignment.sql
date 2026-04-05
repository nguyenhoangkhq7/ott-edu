-- Migration V3: Seed Additional Assignment for Super Student
-- This assignment is for Team 1 (Lớp học thử nghiệm Java)
INSERT INTO assignments (id, title, instructions, max_score, due_date, type, team_id, created_at)
VALUES (2, 'Bài tập thực hành Siêu học viên', 'Hoàn thành các câu hỏi trắc nghiệm Java nâng cao bên dưới. Chúc bạn may mắn!', 10.0, DATE_ADD(NOW(), INTERVAL 14 DAY), 'QUIZ', 1, NOW());

-- Questions for Assignment 2
INSERT INTO questions (id, assignment_id, content, points, question_type, display_order)
VALUES (3, 2, 'Ai là cha đẻ của Java?', 5.0, 'SINGLE_CHOICE', 1);

INSERT INTO answer_options (id, question_id, content, is_correct, display_order) VALUES
(9, 3, 'James Gosling', TRUE, 1),
(10, 3, 'Bill Gates', FALSE, 2),
(11, 3, 'Steve Jobs', FALSE, 3),
(12, 3, 'Mark Zuckerberg', FALSE, 4);

INSERT INTO questions (id, assignment_id, content, points, question_type, display_order)
VALUES (4, 2, 'Java ra đời chính thức vào năm nào?', 5.0, 'SINGLE_CHOICE', 2);

INSERT INTO answer_options (id, question_id, content, is_correct, display_order) VALUES
(13, 4, '1995', TRUE, 1),
(14, 4, '1991', FALSE, 2),
(15, 4, '2000', FALSE, 3),
(16, 4, '1985', FALSE, 4);
