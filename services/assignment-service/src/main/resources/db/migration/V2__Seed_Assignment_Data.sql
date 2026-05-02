-- Seed assignments data
INSERT INTO assignments (title, instructions, type, due_date, max_score, created_at) VALUES
('Java Basics Quiz', 'This assignment covers basic Java concepts including variables, data types, and control flow.', 'QUIZ', DATE_ADD(NOW(), INTERVAL 7 DAY), 100, NOW()),
('OOP Principles', 'Test your understanding of object-oriented programming concepts such as inheritance, polymorphism, and encapsulation.', 'QUIZ', DATE_ADD(NOW(), INTERVAL 14 DAY), 100, NOW()),
('Spring Framework Fundamentals', 'Assess your knowledge of Spring Boot, dependency injection, and REST API development.', 'ESSAY', DATE_ADD(NOW(), INTERVAL 21 DAY), 100, NOW()),
('Database Design', 'This assignment tests your SQL skills and understanding of database normalization and relationships.', 'QUIZ', DATE_ADD(NOW(), INTERVAL 10 DAY), 100, NOW()),
('Collection Framework', 'Test your knowledge of Java Collections API including Lists, Sets, and Maps.', 'QUIZ', DATE_ADD(NOW(), INTERVAL 5 DAY), 100, NOW());

-- Get the ID of the first assignment to add questions
SET @assignment_id_1 = LAST_INSERT_ID();
SET @assignment_id_2 = LAST_INSERT_ID() + 1;
SET @assignment_id_3 = LAST_INSERT_ID() + 2;
SET @assignment_id_4 = LAST_INSERT_ID() + 3;
SET @assignment_id_5 = LAST_INSERT_ID() + 4;

-- Seed assignment_teams
INSERT INTO assignment_teams (assignment_id, team_id) VALUES
(@assignment_id_1, 1),
(@assignment_id_2, 1),
(@assignment_id_3, 1),
(@assignment_id_4, 1),
(@assignment_id_5, 1);

-- Seed questions for Assignment 1 (Java Basics Quiz)
INSERT INTO questions (assignment_id, content, type, display_order, points) VALUES
(@assignment_id_1, 'What is the correct way to declare a variable in Java?', 'SINGLE_CHOICE', 1, 20.0),
(@assignment_id_1, 'Which of the following is a primitive data type in Java?', 'SINGLE_CHOICE', 2, 20.0),
(@assignment_id_1, 'What is the output of the following code: System.out.println(10 + 20 + "30");', 'SINGLE_CHOICE', 3, 20.0),
(@assignment_id_1, 'Which keyword is used to create a class in Java?', 'SINGLE_CHOICE', 4, 20.0),
(@assignment_id_1, 'What is the purpose of the main method in Java?', 'SINGLE_CHOICE', 5, 20.0);

-- Get question IDs for first assignment
SET @q1_id = LAST_INSERT_ID();
SET @q2_id = LAST_INSERT_ID() + 1;
SET @q3_id = LAST_INSERT_ID() + 2;
SET @q4_id = LAST_INSERT_ID() + 3;
SET @q5_id = LAST_INSERT_ID() + 4;

-- Add options for Question 1
INSERT INTO answer_options (question_id, content, is_correct, display_order) VALUES
(@q1_id, 'int x = 10;', TRUE, 1),
(@q1_id, 'variable x = 10;', FALSE, 2),
(@q1_id, 'declare x = 10;', FALSE, 3),
(@q1_id, 'var 10 x;', FALSE, 4);

-- Add options for Question 2
INSERT INTO answer_options (question_id, content, is_correct, display_order) VALUES
(@q2_id, 'int', TRUE, 1),
(@q2_id, 'String', FALSE, 2),
(@q2_id, 'Integer', FALSE, 3),
(@q2_id, 'Array', FALSE, 4);

-- Add options for Question 3
INSERT INTO answer_options (question_id, content, is_correct, display_order) VALUES
(@q3_id, '3030', TRUE, 1),
(@q3_id, '102030', FALSE, 2),
(@q3_id, '60', FALSE, 3),
(@q3_id, 'Compilation Error', FALSE, 4);

-- Add options for Question 4
INSERT INTO answer_options (question_id, content, is_correct, display_order) VALUES
(@q4_id, 'class', TRUE, 1),
(@q4_id, 'new', FALSE, 2),
(@q4_id, 'struct', FALSE, 3),
(@q4_id, 'object', FALSE, 4);

-- Add options for Question 5
INSERT INTO answer_options (question_id, content, is_correct, display_order) VALUES
(@q5_id, 'Entry point of the program', TRUE, 1),
(@q5_id, 'To initialize variables', FALSE, 2),
(@q5_id, 'To define object properties', FALSE, 3),
(@q5_id, 'To handle exceptions', FALSE, 4);

-- Seed questions for Assignment 2 (OOP Principles)
INSERT INTO questions (assignment_id, content, type, display_order, points) VALUES
(@assignment_id_2, 'Which principle hides the internal implementation details?', 'SINGLE_CHOICE', 1, 50.0),
(@assignment_id_2, 'Inheritance models a "has-a" relationship.', 'TRUE_FALSE', 2, 50.0);

SET @q6_id = LAST_INSERT_ID();
SET @q7_id = LAST_INSERT_ID() + 1;

INSERT INTO answer_options (question_id, content, is_correct, display_order) VALUES
(@q6_id, 'Encapsulation', TRUE, 1),
(@q6_id, 'Polymorphism', FALSE, 2),
(@q6_id, 'Inheritance', FALSE, 3),
(@q6_id, 'Abstraction', FALSE, 4);

INSERT INTO answer_options (question_id, content, is_correct, display_order) VALUES
(@q7_id, 'True', FALSE, 1),
(@q7_id, 'False', TRUE, 2);
