package fit.iuh.services;

import fit.iuh.models.Attachment;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface AttachmentService {
    // Upload 1 file vào kho của lớp
    Attachment uploadToClass(MultipartFile file, String classId, String userEmail);

    // Lấy danh sách tài liệu của lớp
    List<Attachment> getFilesByClass(String classId);

    void deleteAttachment(String attachmentId, String email);
}