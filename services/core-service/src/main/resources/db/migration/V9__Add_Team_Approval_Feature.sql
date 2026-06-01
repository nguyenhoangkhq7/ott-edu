ALTER TABLE teams ADD COLUMN is_approval_required BOOLEAN DEFAULT FALSE;

CREATE TABLE team_join_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_join_request_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_join_request_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    UNIQUE KEY uk_team_account_request (team_id, account_id)
);
