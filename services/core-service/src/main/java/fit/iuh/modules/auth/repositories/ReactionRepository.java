package fit.iuh.modules.auth.repositories;

import fit.iuh.models.Reaction;

import fit.iuh.models.TargetType;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface ReactionRepository extends MongoRepository<Reaction, String> {
    Optional<Reaction> findByTargetIdAndTargetTypeAndAuthorId(String targetId, TargetType targetType, String authorId);
    void deleteByTargetIdAndTargetType(String targetId, TargetType targetType);
}
