/**
 * Assignment Draft Service Implementation
 * Uses local file storage (in Docker volume)
 * Place in: services/assignment-service/src/main/java/com/example/service/impl/AssignmentDraftServiceImpl.java
 */

package com.example.service.impl;

import com.example.dto.DraftAssignmentDTO;
import com.example.service.AssignmentDraftService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AssignmentDraftServiceImpl implements AssignmentDraftService {

    @Value("${file.storage.path:./uploads/assignment-files}")
    private String fileStoragePath;

    @Value("${draft.storage.path:./uploads/assignment-drafts}")
    private String draftStoragePath;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Path getDraftPath(String draftId) {
        Path baseDir = Paths.get(draftStoragePath).toAbsolutePath();
        return baseDir.resolve(draftId + ".json");
    }

    private Path getFilesDir(String draftId) {
        Path baseDir = Paths.get(fileStoragePath).toAbsolutePath();
        return baseDir.resolve(draftId);
    }

    @Override
    public DraftAssignmentDTO saveDraft(DraftAssignmentDTO draft) throws Exception {
        // Create directories if they don't exist
        Files.createDirectories(Paths.get(draftStoragePath));

        // Set timestamps
        if (draft.getCreatedAt() == null) {
            draft.setCreatedAt(LocalDateTime.now().toString());
        }
        draft.setUpdatedAt(LocalDateTime.now().toString());

        // Write to file
        Path draftPath = getDraftPath(draft.getId());
        Files.write(draftPath, objectMapper.writeValueAsBytes(draft));

        log.info("✅ Draft saved: {}", draft.getId());
        return draft;
    }

    @Override
    public DraftAssignmentDTO loadDraft(String draftId) throws Exception {
        Path draftPath = getDraftPath(draftId);

        if (!Files.exists(draftPath)) {
            log.warn("⚠️  Draft not found: {}", draftId);
            return null;
        }

        byte[] data = Files.readAllBytes(draftPath);
        DraftAssignmentDTO draft = objectMapper.readValue(data, DraftAssignmentDTO.class);

        log.info("📂 Draft loaded: {}", draftId);
        return draft;
    }

    @Override
    public List<DraftAssignmentDTO> listDraftsByTeam(Integer teamId) throws Exception {
        Path draftsDir = Paths.get(draftStoragePath);

        if (!Files.exists(draftsDir)) {
            return Collections.emptyList();
        }

        return Files.list(draftsDir)
                .filter(p -> p.toString().endsWith(".json"))
                .map(p -> {
                    try {
                        byte[] data = Files.readAllBytes(p);
                        return objectMapper.readValue(data, DraftAssignmentDTO.class);
                    } catch (IOException e) {
                        log.error("❌ Error reading draft file: {}", p, e);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .filter(draft -> draft.getTeamId().equals(teamId))
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteDraft(String draftId) throws Exception {
        Path draftPath = getDraftPath(draftId);

        // Delete draft JSON file
        if (Files.exists(draftPath)) {
            try {
                Files.delete(draftPath);
            } catch (IOException e) {
                log.error("❌ Error deleting draft file: {}", draftPath, e);
            }
        }

        // Delete all associated files
        Path filesDir = getFilesDir(draftId);
        if (Files.exists(filesDir)) {
            try (var stream = Files.walk(filesDir)) {
                stream.sorted(Comparator.reverseOrder())
                        .forEach(path -> {
                            try {
                                Files.delete(path);
                                log.debug("File deleted: {}", path.getFileName());
                            } catch (IOException e) {
                                log.error("❌ Error deleting file: {}", path, e);
                            }
                        });
            } catch (IOException e) {
                log.error("❌ Error walking directory: {}", filesDir, e);
            }
        }
    }

    public Map<String, Object> uploadFile(String draftId, MultipartFile file) throws Exception {
        // Create nested directory structure
        Path filesDir = getFilesDir(draftId);
        Files.createDirectories(filesDir);

        // Generate unique file ID
        Long fileId = System.currentTimeMillis();
        String filename = file.getOriginalFilename();
        String extension = filename != null ? filename.substring(filename.lastIndexOf(".")) : "";
        String savedFilename = fileId + extension;

        Path filePath = filesDir.resolve(savedFilename);
        Files.write(filePath, file.getBytes());

        log.info("✅ File uploaded: {} ({})", draftId, filename);

        return Map.of(
                "fileId", fileId,
                "filename", filename,
                "url", "/api/files/" + fileId);
    }

    @Override
    public void deleteFile(String draftId, Long fileId) throws Exception {
        Path filesDir = getFilesDir(draftId);

        // Try to find and delete the file
        if (Files.exists(filesDir)) {
            Files.list(filesDir)
                    .filter(p -> p.getFileName().toString().startsWith(fileId.toString()))
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            log.info("✅ File deleted: {}", path.getFileName());
                        } catch (IOException e) {
                            log.error("❌ Error deleting file: {}", path, e);
                        }
                    });
        }
    }
}
