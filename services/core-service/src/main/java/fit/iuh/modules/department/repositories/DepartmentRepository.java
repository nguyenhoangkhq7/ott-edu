package fit.iuh.modules.department.repositories;

import fit.iuh.models.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findBySchoolId(Long schoolId);
}
