-- Seed one online quiz for the active student team (team 2)
-- This matches the current live schema:
-- assignments(type), assignment_teams, questions(display_order, points, type), answer_options(display_order)

INSERT INTO assignments (
    title,
    instructions,
    max_score,
    due_date,
    created_at,
    archived_at,
    creator_id,
    department_id,
    type
)
VALUES (
    'Online Quiz - Java Basics for Class 2',
    'Practice quiz for the current class. Answer all questions and submit when finished.',
    10.0,
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    NOW(),
    NULL,
    NULL,
    NULL,
    'QUIZ'
);

SET @assignment_id = LAST_INSERT_ID();

INSERT INTO assignment_teams (assignment_id, team_id)
VALUES (@assignment_id, 2);

INSERT INTO questions (assignment_id, content, display_order, points, type)
VALUES
(@assignment_id, 'Which keyword declares a constant in Java?', 1, 2.0, 'SINGLE_CHOICE'),
(@assignment_id, 'Which method compares the content of two String values?', 2, 2.0, 'SINGLE_CHOICE'),
(@assignment_id, 'What is the result of System.out.println(10 + 20 + "30");?', 3, 2.0, 'SINGLE_CHOICE'),
(@assignment_id, 'Java is an object-oriented programming language.', 4, 2.0, 'TRUE_FALSE'),
(@assignment_id, 'Which principle means bundling data and behavior together?', 5, 2.0, 'SINGLE_CHOICE');

SET @question_1 = LAST_INSERT_ID() - 4;
SET @question_2 = LAST_INSERT_ID() - 3;
SET @question_3 = LAST_INSERT_ID() - 2;
SET @question_4 = LAST_INSERT_ID() - 1;
SET @question_5 = LAST_INSERT_ID();

INSERT INTO answer_options (question_id, content, display_order, is_correct) VALUES
(@question_1, 'final', 1, TRUE),
(@question_1, 'static', 2, FALSE),
(@question_1, 'const', 3, FALSE),
(@question_1, 'immutable', 4, FALSE);

INSERT INTO answer_options (question_id, content, display_order, is_correct) VALUES
(@question_2, 'equals()', 1, TRUE),
(@question_2, '==', 2, FALSE),
(@question_2, 'compare()', 3, FALSE),
(@question_2, 'same()', 4, FALSE);

INSERT INTO answer_options (question_id, content, display_order, is_correct) VALUES
(@question_3, '3030', 1, TRUE),
(@question_3, '60', 2, FALSE),
(@question_3, '3060', 3, FALSE),
(@question_3, '30', 4, FALSE);

INSERT INTO answer_options (question_id, content, display_order, is_correct) VALUES
(@question_4, 'True', 1, TRUE),
(@question_4, 'False', 2, FALSE);

INSERT INTO answer_options (question_id, content, display_order, is_correct) VALUES
(@question_5, 'Encapsulation', 1, TRUE),
(@question_5, 'Compilation', 2, FALSE),
(@question_5, 'Iteration', 3, FALSE),
(@question_5, 'Serialization', 4, FALSE);