package create_assignment.repositories;

import create_assignment.entities.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    /**
     * Tìm nhiều Material theo danh sách ID.
     * Dùng findAllById thừa kế từ JpaRepository — thêm method này rõ nghĩa hơn.
     */
    List<Material> findAllByIdIn(List<Long> ids);
}
