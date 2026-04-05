CREATE TABLE assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    max_score DOUBLE NOT NULL DEFAULT 10.0,
    due_date DATETIME,
    type VARCHAR(20) NOT NULL DEFAULT 'QUIZ',
    team_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    points DOUBLE NOT NULL DEFAULT 1.0,
    question_type VARCHAR(20) NOT NULL DEFAULT 'SINGLE_CHOICE',
    display_order INT DEFAULT 0,
    CONSTRAINT fk_questions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

CREATE TABLE answer_options (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT DEFAULT 0,
    CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    team_member_id BIGINT NOT NULL,
    score DOUBLE DEFAULT 0.0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    is_late BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

CREATE TABLE student_answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    earned_points DOUBLE DEFAULT 0.0,
    content TEXT,
    CONSTRAINT fk_student_answers_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_answers_question FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE student_answer_selected_options (
    student_answer_id BIGINT NOT NULL,
    answer_option_id BIGINT NOT NULL,
    PRIMARY KEY (student_answer_id, answer_option_id),
    CONSTRAINT fk_selected_student_answer FOREIGN KEY (student_answer_id) REFERENCES student_answers(id) ON DELETE CASCADE,
    CONSTRAINT fk_selected_option FOREIGN KEY (answer_option_id) REFERENCES answer_options(id)
);
