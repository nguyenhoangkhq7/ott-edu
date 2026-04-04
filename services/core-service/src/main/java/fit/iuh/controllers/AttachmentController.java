package fit.iuh.controllers;

import fit.iuh.models.Attachment;
import fit.iuh.services.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    // API: Upload file vào kho (Giao diện nhấn nút Upload)
    @PostMapping("/class/{classId}")
    public ResponseEntity<Attachment> uploadFile(
            @PathVariable String classId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        String email = authentication.getName();
        return ResponseEntity.ok(attachmentService.uploadToClass(file, classId, email));
    }

    // API: Lấy toàn bộ tài liệu trong kho của lớp
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Attachment>> getResources(@PathVariable String classId) {
        return ResponseEntity.ok(attachmentService.getFilesByClass(classId));
    }
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable String attachmentId,
            Authentication authentication) {

        String email = authentication.getName();
        // Nhắc bạn code Service viết thêm hàm deleteAttachment(attachmentId, email) nhé!
        attachmentService.deleteAttachment(attachmentId, email);
        return ResponseEntity.noContent().build();
    }
}