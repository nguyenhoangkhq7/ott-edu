ALTER TABLE profiles
    ADD CONSTRAINT fk_profiles_school
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_profiles_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_profiles_department_id ON profiles(department_id);