package fit.iuh.repositories;
import fit.iuh.models.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByClassIdOrderByCreatedAtDesc(String classId);
}