package create_assignment.controllers;

import create_assignment.config.UserAuthenticationFilter;
import create_assignment.entities.Material;
import create_assignment.repositories.MaterialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments/materials")
@RequiredArgsConstructor
@Slf4j
public class MaterialController {

    private final MaterialRepository materialRepository;

    /**
     * POST /api/assignments/materials
     * Mock upload material (TEACHER only).
     * Returns ID to be used when creating an assignment.
     * 
     * @param file           file upload
     * @param authentication thông tin người dùng từ header
     */
    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> uploadMaterial(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        log.info("Received request to upload material: {}", file.getOriginalFilename());
        // Lấy userId từ Authentication (kiểm tra là TEACHER hoặc STUDENT)
        Long userId = extractUserIdFromAuthentication(authentication);
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        }

        try {
            // Mock file storage - in a real application this would upload to S3 or save to
            // disk.
            String fileName = file.getOriginalFilename();
            String fileType = file.getContentType();
            String url = "/uploads/mock/" + System.currentTimeMillis() + "_" + fileName;

            Material material = Material.builder()
                    .name(fileName)
                    .url(url)
                    .type(fileType)
                    .build();

            Material saved = materialRepository.save(material);
            log.info("Material successfully saved with id: {}", saved.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "id", saved.getId(),
                            "name", saved.getName(),
                            "url", saved.getUrl()));
        } catch (Exception e) {
            log.error("Error uploading material", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error uploading material"));
        }
    }

    /**
     * Trích xuất userId từ Authentication object
     * Authentication principal là AuthenticatedUser (từ UserAuthenticationFilter)
     */
    private Long extractUserIdFromAuthentication(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalArgumentException("Không tìm thấy thông tin người dùng");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserAuthenticationFilter.AuthenticatedUser) {
            return ((UserAuthenticationFilter.AuthenticatedUser) principal).getUserId();
        }
        throw new IllegalArgumentException("Không thể trích xuất userId từ Authentication");
    }
}
