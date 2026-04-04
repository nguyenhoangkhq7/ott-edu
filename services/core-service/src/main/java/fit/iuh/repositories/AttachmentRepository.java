package fit.iuh.repositories;
import fit.iuh.models.Attachment;
import fit.iuh.models.enums.AttachmentTargetType;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AttachmentRepository extends MongoRepository<Attachment, String> {
    void deleteByTargetIdAndTargetType(String targetId, AttachmentTargetType targetType);
    List<Attachment> findByClassIdAndTargetType(String classId, AttachmentTargetType targetType);
    List<Attachment> findByTargetIdAndTargetType(String targetId, AttachmentTargetType targetType);
}