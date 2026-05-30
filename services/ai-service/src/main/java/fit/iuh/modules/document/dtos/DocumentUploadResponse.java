package fit.iuh.modules.document.dtos;

import fit.iuh.modules.document.entities.DocumentStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentUploadResponse {
    private UUID documentId;
    private String originalFilename;
    private String contentType;
    private Integer totalChunks;
    private DocumentStatus status;
    private LocalDateTime createdAt;
}
