package fit.iuh.services.impl;

import fit.iuh.models.Attachment;
import fit.iuh.models.Profile;
import fit.iuh.models.enums.AttachmentTargetType;
import fit.iuh.repositories.AttachmentRepository;
import fit.iuh.services.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import fit.iuh.repositories.ProfileRepository;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final ProfileRepository profileRepository;

    // 👉 1. KHAI BÁO S3 CLIENT VÀ CẤU HÌNH
    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.region}")
    private String region;

    @Override
    public Attachment uploadToClass(MultipartFile file, String classId, String userEmail) {
        try {
            // 2. Tạo tên file và đường dẫn thư mục riêng cho từng lớp trên S3
            String fileExtension = "";
            if (file.getOriginalFilename() != null && file.getOriginalFilename().contains(".")) {
                fileExtension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
            }
            // VD lưu vào: classes/DHKTPM18C/abc-xyz.pdf
            String key = "classes/" + classId + "/" + UUID.randomUUID() + fileExtension;

            // 3. Upload file TẬN TAY lên AWS S3
            s3Client.putObject(PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(file.getContentType()) // Bắt đúng định dạng (pdf, docx, img...)
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // 4. Lấy link S3 thật để trả về cho Frontend tải xuống
            String realUrl = String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);

            // 5. Lưu Database
            Attachment attachment = Attachment.builder()
                    .fileName(file.getOriginalFilename())
                    .fileType(file.getContentType())
                    .size(file.getSize())
                    .fileUrl(realUrl)
                    .classId(classId)
                    .userId(userEmail)
                    .targetType(AttachmentTargetType.CLASS_FOLDER)
                    .build();

            return attachmentRepository.save(attachment);

        } catch (IOException e) {
            throw new RuntimeException("Lỗi upload file tài liệu lên S3: " + e.getMessage());
        }
    }

    @Override
    public List<Attachment> getFilesByClass(String classId) {
        // 1. Lấy danh sách file từ MongoDB
        List<Attachment> attachments = attachmentRepository.findByClassIdAndTargetType(classId, AttachmentTargetType.CLASS_FOLDER);

        if (attachments.isEmpty()) return attachments;

        // 2. Gom danh sách email người đăng
        Set<String> userEmails = attachments.stream()
                .map(Attachment::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 3. Lấy Profile từ SQL
        List<Profile> profiles = profileRepository.findByAccount_EmailIn(new ArrayList<>(userEmails));

        // 4. Tạo Map tra cứu nhanh
        Map<String, String> nameMap = profiles.stream()
                .collect(Collectors.toMap(
                        p -> p.getAccount().getEmail(),
                        p -> (p.getLastName() != null ? p.getLastName() + " " : "") + p.getFirstName()
                ));

        // 5. Ghép tên vào từng file
        attachments.forEach(att -> {
            String fullName = nameMap.get(att.getUserId());
            att.setAuthorName(fullName != null ? fullName : att.getUserId());
        });

        return attachments;
    }

    @Override
    public void deleteAttachment(String attachmentId, String email) {
        // 1. Tìm thông tin file trong Database
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài liệu để xóa"));

        // (Tùy chọn: Bỏ comment nếu muốn BẮT BUỘC người nào up người đó mới được xóa)
        // if (attachment.getUserId() != null && !attachment.getUserId().equals(email)) {
        //     throw new RuntimeException("Bạn không có quyền xóa tài liệu này!");
        // }

        // 2. Xóa file vật lý trên AWS S3
        try {
            String fileUrl = attachment.getFileUrl();
            String s3Prefix = String.format("https://%s.s3.%s.amazonaws.com/", bucketName, region);

            // Tách lấy cái "Key" của S3 từ đường link URL
            if (fileUrl != null && fileUrl.startsWith(s3Prefix)) {
                String key = fileUrl.substring(s3Prefix.length());

                // Gửi lệnh chém file lên S3
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build());
            }
        } catch (Exception e) {
            System.err.println("Cảnh báo: Không thể xóa file vật lý trên S3 - " + e.getMessage());
        }

        // 3. Cuối cùng, xóa thông tin file trong Database
        attachmentRepository.deleteById(attachmentId);
    }
}