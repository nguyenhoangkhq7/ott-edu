package fit.iuh.repositories;

import fit.iuh.models.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {

    boolean existsByJoinCode(String joinCode);

    Optional<Team> findByJoinCode(String joinCode);

    // Tìm tất cả lớp mà account là member
    @Query("""
        SELECT t FROM Team t
        JOIN t.members m
        WHERE m.account.id = :accountId
        ORDER BY t.createdAt DESC
    """)
    List<Team> findAllByMemberAccountId(@Param("accountId") Long accountId);
}
