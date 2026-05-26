package fit.iuh.modules.admin.repositories;

import fit.iuh.models.Profile;
import fit.iuh.models.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminUserRepository extends JpaRepository<Profile, Long> {

    @Query("SELECT p FROM Profile p JOIN p.account a WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(a.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:role IS NULL OR a.role = :role) AND " +
           "(:isLocked IS NULL OR a.isLocked = :isLocked)")
    Page<Profile> findAdminUsers(
            @Param("search") String search,
            @Param("role") Role role,
            @Param("isLocked") Boolean isLocked,
            Pageable pageable
    );

    @Query("SELECT COUNT(a) FROM Account a")
    long countAllAccounts();

    @Query("SELECT COUNT(a) FROM Account a WHERE a.isOnline = true")
    long countActiveAccounts();

    @Query("SELECT COUNT(a) FROM Account a WHERE a.isLocked = true")
    long countLockedAccounts();

    @Query("SELECT COUNT(a) FROM Account a WHERE a.createdAt <= :dateTime")
    long countAccountsBefore(@Param("dateTime") java.time.LocalDateTime dateTime);
}
