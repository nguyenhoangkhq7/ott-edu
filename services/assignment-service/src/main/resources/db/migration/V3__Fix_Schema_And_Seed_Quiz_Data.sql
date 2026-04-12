-- V3: Thêm cột points cho questions và seed dữ liệu quiz hoàn chỉnh
-- Thêm cột points vào bảng questions (nếu chưa có)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS points DOUBLE DEFAULT 1.0;

-- ============================
-- DỮ LIỆU MẪU CHO TEST
-- team_id = 1 (lớp học đã có trong core-service)
-- ============================

-- Bài kiểm tra 3: Lập trình Java Cơ bản - Giữa kỳ (5 câu, mỗi câu 2 điểm = 10 điểm)
INSERT INTO assignments (team_id, title, instructions, assignment_type, due_date, max_score, created_at, archived, department_id)
VALUES (
    1,
    'Kiểm tra Giữa kỳ - Lập trình Java Cơ bản',
    'Bài kiểm tra gồm 5 câu hỏi trắc nghiệm về kiến thức lập trình Java cơ bản. Mỗi câu đúng được 2 điểm. Thời gian làm bài: 30 phút. Không được sử dụng tài liệu.',
    'QUIZ',
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    10.0,
    NOW(),
    FALSE,
    1
);

SET @asgn_id = LAST_INSERT_ID();

-- Câu hỏi 1
INSERT INTO questions (assignment_id, content, question_type, order_index, points)
VALUES (@asgn_id, 'Đâu là từ khóa dùng để khai báo một hằng số trong Java?', 'SINGLE_CHOICE', 1, 2.0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q_id, 'static', FALSE, 1),
(@q_id, 'final', TRUE, 2),
(@q_id, 'const', FALSE, 3),
(@q_id, 'fixed', FALSE, 4);

-- Câu hỏi 2
INSERT INTO questions (assignment_id, content, question_type, order_index, points)
VALUES (@asgn_id, 'Trong Java, phương thức nào dùng để so sánh nội dung hai chuỗi String?', 'SINGLE_CHOICE', 2, 2.0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q_id, '== operator', FALSE, 1),
(@q_id, 'equals()', TRUE, 2),
(@q_id, 'compare()', FALSE, 3),
(@q_id, 'compareTo()', FALSE, 4);

-- Câu hỏi 3
INSERT INTO questions (assignment_id, content, question_type, order_index, points)
VALUES (@asgn_id, 'Kết quả của biểu thức: System.out.println(10 / 3) là gì?', 'SINGLE_CHOICE', 3, 2.0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q_id, '3.33', FALSE, 1),
(@q_id, '3', TRUE, 2),
(@q_id, '3.0', FALSE, 3),
(@q_id, 'Lỗi biên dịch (Compile Error)', FALSE, 4);

-- Câu hỏi 4
INSERT INTO questions (assignment_id, content, question_type, order_index, points)
VALUES (@asgn_id, 'ArrayList trong Java có kích thước cố định (không thể thêm/xóa phần tử sau khi tạo)?', 'TRUE_FALSE', 4, 2.0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q_id, 'Đúng (True)', FALSE, 1),
(@q_id, 'Sai (False)', TRUE, 2);

-- Câu hỏi 5
INSERT INTO questions (assignment_id, content, question_type, order_index, points)
VALUES (@asgn_id, 'Đâu là những tính chất cốt lõi của OOP trong Java? (Chọn tất cả đáp án đúng)', 'MULTI_CHOICE', 5, 2.0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q_id, 'Encapsulation (Đóng gói)', TRUE, 1),
(@q_id, 'Inheritance (Kế thừa)', TRUE, 2),
(@q_id, 'Compilation (Biên dịch)', FALSE, 3),
(@q_id, 'Polymorphism (Đa hình)', TRUE, 4);

-- Bài kiểm tra 4: Cấu trúc dữ liệu (5 câu, mỗi câu 1 điểm = 5 điểm)
INSERT INTO assignments (team_id, title, instructions, assignment_type, due_date, max_score, created_at, archived, department_id)
VALUES (
    1,
    'Quiz Tuần 5 - Cấu trúc dữ liệu và Giải thuật',
    'Bài quiz ngắn gồm 5 câu hỏi về Cấu trúc dữ liệu và Giải thuật. Thời gian: 15 phút.',
    'QUIZ',
    DATE_ADD(NOW(), INTERVAL 3 DAY),
    5.0,
    NOW(),
    FALSE,
    1
);

SET @asgn_id = LAST_INSERT_ID();

INSERT INTO questions (assignment_id, content, question_type, order_index, points)
VALUES (@asgn_id, 'Độ phức tạp thời gian (time complexity) của thuật toán Binary Search là?', 'SINGLE_CHOICE', 1, 1.0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q_id, 'O(n)', FALSE, 1),
(@q_id, 'O(n²)', FALSE, 2),
(@q_id, 'O(log n)', TRUE, 3),
(@q_id, 'O(1)', FALSE, 4);

INSERT INTO questions (assignment_id, content, question_type, order_index, points)
VALUES (@asgn_id, 'Stack (Ngăn xếp) hoạt động theo nguyên tắc nào?', 'SINGLE_CHOICE', 2, 1.0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q_id, 'FIFO - First In First Out', FALSE, 1),
(@q_id, 'LIFO - Last In First Out', TRUE, 2),
(@q_id, 'Random Access', FALSE, 3),
(@q_id, 'Priority Based', FALSE, 4);

INSERT INTO questions (assignment_id, content, question_type, order_index, points)
VALUES (@asgn_id, 'Linked List cho phép truy cập ngẫu nhiên (random access) O(1) đến phần tử theo chỉ số?', 'TRUE_FALSE', 3, 1.0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q_id, 'Đúng (True)', FALSE, 1),
(@q_id, 'Sai (False)', TRUE, 2);

INSERT INTO questions (assignment_id, content, question_type, order_index, points)
VALUES (@asgn_id, 'Thuật toán sắp xếp nào đảm bảo độ phức tạp O(n log n) trong mọi trường hợp?', 'SINGLE_CHOICE', 4, 1.0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q_id, 'Bubble Sort', FALSE, 1),
(@q_id, 'Quick Sort', FALSE, 2),
(@q_id, 'Merge Sort', TRUE, 3),
(@q_id, 'Selection Sort', FALSE, 4);

INSERT INTO questions (assignment_id, content, question_type, order_index, points)
VALUES (@asgn_id, 'Cấu trúc dữ liệu nào phù hợp nhất để triển khai tính năng "Undo" (hoàn tác)?', 'SINGLE_CHOICE', 5, 1.0);
SET @q_id = LAST_INSERT_ID();
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q_id, 'Queue (Hàng đợi)', FALSE, 1),
(@q_id, 'Stack (Ngăn xếp)', TRUE, 2),
(@q_id, 'Array (Mảng)', FALSE, 3),
(@q_id, 'Tree (Cây)', FALSE, 4);
