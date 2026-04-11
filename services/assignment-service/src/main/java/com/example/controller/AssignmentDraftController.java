/**
 * Assignment Draft API Endpoints
 * Backend implementation for draft management
 * 
 * Java Spring Boot example
 * Place this in: services/assignment-service/src/main/java/com/example/controller/AssignmentDraftController.java
 */

package com.example.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.service.AssignmentDraftService;
import com.example.dto.DraftAssignmentDTO;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api/assignments/drafts")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
        org.springframework.web.bind.annotation.RequestMethod.GET,
        org.springframework.web.bind.annotation.RequestMethod.POST,
        org.springframework.web.bind.annotation.RequestMethod.PUT,
        org.springframework.web.bind.annotation.RequestMethod.DELETE,
        org.springframework.web.bind.annotation.RequestMethod.OPTIONS
})
public class AssignmentDraftController {

    @Autowired
    private AssignmentDraftService draftService;

    @Value("${file.storage.path:./uploads/assignment-files}")
    private String fileStoragePath;

    /**
     * Save or update draft
     */
    @PostMapping
    public ResponseEntity<?> saveDraft(@RequestBody DraftAssignmentDTO draft) {
        try {
            DraftAssignmentDTO saved = draftService.saveDraft(draft);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Load draft by ID
     */
    @GetMapping("/{draftId}")
    public ResponseEntity<?> loadDraft(@PathVariable String draftId) {
        try {
            DraftAssignmentDTO draft = draftService.loadDraft(draftId);
            if (draft == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(draft);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * List drafts for a team
     */
    @GetMapping
    public ResponseEntity<?> listDrafts(@RequestParam Integer teamId) {
        try {
            List<DraftAssignmentDTO> drafts = draftService.listDraftsByTeam(teamId);
            return ResponseEntity.ok(Map.of("drafts", drafts));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete draft
     */
    @DeleteMapping("/{draftId}")
    public ResponseEntity<?> deleteDraft(@PathVariable String draftId) {
        try {
            draftService.deleteDraft(draftId);
            return ResponseEntity.ok(Map.of("message", "Draft deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Upload file to draft
     */
    @PostMapping("/{draftId}/files")
    public ResponseEntity<?> uploadFile(
            @PathVariable String draftId,
            @RequestParam("file") MultipartFile file) {
        try {
            var result = draftService.uploadFile(draftId, file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete file from draft
     */
    @DeleteMapping("/{draftId}/files/{fileId}")
    public ResponseEntity<?> deleteFile(
            @PathVariable String draftId,
            @PathVariable Long fileId) {
        try {
            draftService.deleteFile(draftId, fileId);
            return ResponseEntity.ok(Map.of("message", "File deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
