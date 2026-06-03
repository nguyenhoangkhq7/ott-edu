package fit.iuh.modules.auth.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import fit.iuh.models.Profile;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {

    List<Profile> findByAccount_EmailIn(List<String> emails);

    Optional<Profile> findByAccount_Email(String email);

    boolean existsByCode(String code);

    // 🚀 QUERY NÂNG CẤP: Chỉ lấy người cùng Department HOẶC cùng Team
    // File: fit.iuh.modules.auth.repositories.ProfileRepository.java
    // Sửa p.id thành p.account_id
    @Query(value = "SELECT DISTINCT p.* FROM profiles p "
            + "JOIN accounts a ON p.account_id = a.id "
            + "WHERE a.email != :currentUserEmail "
            + "AND a.role != 'ROLE_ADMIN' "
            + "ORDER BY p.account_id DESC " // <--- SỬA CHỖ NÀY
            + "LIMIT 4", nativeQuery = true)
    List<Profile> findRelevantUsers(
            @Param("currentUserEmail") String currentUserEmail
    );

    // Tìm kiếm có từ khóa (vẫn lọc loại bỏ Admin và chính mình)
    @Query("SELECT DISTINCT p FROM Profile p "
            + "WHERE p.account.email != :currentUserEmail "
            + "AND p.account.role != 'ROLE_ADMIN' "
            + "AND ("
            + "  LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "  OR LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "  OR LOWER(p.account.email) LIKE LOWER(CONCAT('%', :keyword, '%'))"
            + ")")
    List<Profile> searchProfilesExcludingSelf(
            @Param("keyword") String keyword,
            @Param("currentUserEmail") String currentUserEmail
    );

        @Modifying
        @Transactional
        @Query("UPDATE Profile p SET p.department = null WHERE p.department.id = :departmentId")
        void nullifyDepartmentRelations(@Param("departmentId") Long departmentId);
}
