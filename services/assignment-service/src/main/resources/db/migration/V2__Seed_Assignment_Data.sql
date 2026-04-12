-- Seed assignments data
INSERT INTO assignments (team_id, title, instructions, assignment_type, due_date, max_score, archived) VALUES
(1, 'Java Basics Quiz', 'This assignment covers basic Java concepts including variables, data types, and control flow.', 'QUIZ', DATE_ADD(NOW(), INTERVAL 7 DAY), 100, FALSE),
(1, 'OOP Principles', 'Test your understanding of object-oriented programming concepts such as inheritance, polymorphism, and encapsulation.', 'QUIZ', DATE_ADD(NOW(), INTERVAL 14 DAY), 100, FALSE),
(1, 'Spring Framework Fundamentals', 'Assess your knowledge of Spring Boot, dependency injection, and REST API development.', 'ASSIGNMENT', DATE_ADD(NOW(), INTERVAL 21 DAY), 100, FALSE),
(1, 'Database Design', 'This assignment tests your SQL skills and understanding of database normalization and relationships.', 'QUIZ', DATE_ADD(NOW(), INTERVAL 10 DAY), 100, FALSE),
(1, 'Collection Framework', 'Test your knowledge of Java Collections API including Lists, Sets, and Maps.', 'QUIZ', DATE_ADD(NOW(), INTERVAL 5 DAY), 100, FALSE);

-- Get the ID of the first assignment to add questions
SET @assignment_id_1 = LAST_INSERT_ID() - 4;
SET @assignment_id_2 = LAST_INSERT_ID() - 3;
SET @assignment_id_3 = LAST_INSERT_ID() - 2;
SET @assignment_id_4 = LAST_INSERT_ID() - 1;
SET @assignment_id_5 = LAST_INSERT_ID();

-- Seed questions for Assignment 1 (Java Basics Quiz)
INSERT INTO questions (assignment_id, content, question_type, order_index) VALUES
(@assignment_id_1, 'What is the correct way to declare a variable in Java?', 'MULTIPLE_CHOICE', 1),
(@assignment_id_1, 'Which of the following is a primitive data type in Java?', 'MULTIPLE_CHOICE', 2),
(@assignment_id_1, 'What is the output of the following code: System.out.println(10 + 20 + "30");', 'MULTIPLE_CHOICE', 3),
(@assignment_id_1, 'Which keyword is used to create a class in Java?', 'MULTIPLE_CHOICE', 4),
(@assignment_id_1, 'What is the purpose of the main method in Java?', 'MULTIPLE_CHOICE', 5);

-- Get question IDs for first assignment
SET @q1_id = LAST_INSERT_ID() - 4;
SET @q2_id = LAST_INSERT_ID() - 3;
SET @q3_id = LAST_INSERT_ID() - 2;
SET @q4_id = LAST_INSERT_ID() - 1;
SET @q5_id = LAST_INSERT_ID();

-- Add options for Question 1
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q1_id, 'int x = 10;', TRUE, 1),
(@q1_id, 'variable x = 10;', FALSE, 2),
(@q1_id, 'declare x = 10;', FALSE, 3),
(@q1_id, 'var 10 x;', FALSE, 4);

-- Add options for Question 2
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q2_id, 'int', TRUE, 1),
(@q2_id, 'String', FALSE, 2),
(@q2_id, 'Object', FALSE, 3),
(@q2_id, 'Class', FALSE, 4);

-- Add options for Question 3
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q3_id, '3030', TRUE, 1),
(@q3_id, '60', FALSE, 2),
(@q3_id, '3060', FALSE, 3),
(@q3_id, '30', FALSE, 4);

-- Add options for Question 4
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q4_id, 'class', TRUE, 1),
(@q4_id, 'create', FALSE, 2),
(@q4_id, 'define', FALSE, 3),
(@q4_id, 'new', FALSE, 4);

-- Add options for Question 5
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q5_id, 'It is the entry point of the program execution', TRUE, 1),
(@q5_id, 'It is used to define variables', FALSE, 2),
(@q5_id, 'It creates instances of classes', FALSE, 3),
(@q5_id, 'It is used for inheritance', FALSE, 4);

-- Seed questions for Assignment 2 (OOP Principles)
INSERT INTO questions (assignment_id, content, question_type, order_index) VALUES
(@assignment_id_2, 'What is the purpose of the super keyword in Java?', 'MULTIPLE_CHOICE', 1),
(@assignment_id_2, 'Which of the following is NOT an access modifier in Java?', 'MULTIPLE_CHOICE', 2),
(@assignment_id_2, 'What is polymorphism?', 'MULTIPLE_CHOICE', 3);

-- Get question IDs for second assignment
SET @q6_id = LAST_INSERT_ID() - 2;
SET @q7_id = LAST_INSERT_ID() - 1;
SET @q8_id = LAST_INSERT_ID();

-- Add options for Question 6 (OOP)
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q6_id, 'To call a method from the parent class', TRUE, 1),
(@q6_id, 'To declare a variable', FALSE, 2),
(@q6_id, 'To create an instance', FALSE, 3),
(@q6_id, 'To import packages', FALSE, 4);

-- Add options for Question 7 (OOP)
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q7_id, 'protected', FALSE, 1),
(@q7_id, 'public', FALSE, 2),
(@q7_id, 'private', FALSE, 3),
(@q7_id, 'global', TRUE, 4);

-- Add options for Question 8 (OOP)
INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q8_id, 'The ability of objects to take multiple forms', TRUE, 1),
(@q8_id, 'The ability to inherit properties', FALSE, 2),
(@q8_id, 'The ability to encapsulate data', FALSE, 3),
(@q8_id, 'The ability to abstract classes', FALSE, 4);

-- Seed questions for Assignment 3 (Spring Framework)
INSERT INTO questions (assignment_id, content, question_type, order_index) VALUES
(@assignment_id_3, 'What is Spring Boot primarily used for?', 'MULTIPLE_CHOICE', 1),
(@assignment_id_3, 'Which annotation is used to mark a class as a Spring component?', 'MULTIPLE_CHOICE', 2);

-- Seed questions for Assignment 4 (Database Design)
INSERT INTO questions (assignment_id, content, question_type, order_index) VALUES
(@assignment_id_4, 'What does ACID stand for in database transactions?', 'MULTIPLE_CHOICE', 1),
(@assignment_id_4, 'Which normal form eliminates redundant data dependencies?', 'MULTIPLE_CHOICE', 2);

-- Seed questions for Assignment 5 (Collection Framework)
INSERT INTO questions (assignment_id, content, question_type, order_index) VALUES
(@assignment_id_5, 'Which collection is ordered and allows duplicates?', 'MULTIPLE_CHOICE', 1),
(@assignment_id_5, 'Which collection does not allow duplicate elements?', 'MULTIPLE_CHOICE', 2);

-- Add more options for Spring Framework questions
SET @q9_id = LAST_INSERT_ID() - 3;
SET @q10_id = LAST_INSERT_ID() - 2;
SET @q11_id = LAST_INSERT_ID() - 1;
SET @q12_id = LAST_INSERT_ID() - 0;
SET @q13_id = LAST_INSERT_ID();

INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q9_id, 'To quickly build production-ready applications with minimal configuration', TRUE, 1),
(@q9_id, 'To compile Java code', FALSE, 2),
(@q9_id, 'To manage database transactions', FALSE, 3),
(@q9_id, 'To define object relationships', FALSE, 4);

INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q10_id, '@Component', TRUE, 1),
(@q10_id, '@Bean', FALSE, 2),
(@q10_id, '@Service', FALSE, 3),
(@q10_id, '@Repository', FALSE, 4);

INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q11_id, 'Atomicity, Consistency, Isolation, Durability', TRUE, 1),
(@q11_id, 'Accuracy, Consistency, Integration, Development', FALSE, 2),
(@q11_id, 'Architecture, Configuration, Installation, Documentation', FALSE, 3),
(@q11_id, 'Authentication, Certification, Authorization, Delegation', FALSE, 4);

INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q12_id, 'Third Normal Form (3NF)', TRUE, 1),
(@q12_id, 'First Normal Form (1NF)', FALSE, 2),
(@q12_id, 'Second Normal Form (2NF)', FALSE, 3),
(@q12_id, 'Boyce-Codd Normal Form (BCNF)', FALSE, 4);

INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q13_id, 'List', TRUE, 1),
(@q13_id, 'Set', FALSE, 2),
(@q13_id, 'Queue', FALSE, 3),
(@q13_id, 'Deque', FALSE, 4);

INSERT INTO answer_options (question_id, content, is_correct, order_index) VALUES
(@q13_id, 'Set', TRUE, 1),
(@q13_id, 'List', FALSE, 2),
(@q13_id, 'Collection', FALSE, 3),
(@q13_id, 'Vector', FALSE, 4);
