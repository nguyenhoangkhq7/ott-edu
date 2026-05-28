package fit.iuh.modules.auth.repositories;


import fit.iuh.models.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    List<Profile> findByAccount_EmailIn(List<String> emails);
    Optional<Profile> findByAccount_Email(String email);

    @Modifying
    @Query("UPDATE Profile p SET p.department = null WHERE p.department.id = :departmentId")
    void nullifyDepartmentRelations(@Param("departmentId") Long departmentId);

    @Modifying
    @Query("UPDATE Profile p SET p.school = null WHERE p.school.id = :schoolId")
    void nullifySchoolRelations(@Param("schoolId") Long schoolId);
}