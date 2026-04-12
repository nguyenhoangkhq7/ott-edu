/**
 * Assignment Draft Service Interface
 * Place in: services/assignment-service/src/main/java/com/example/service/AssignmentDraftService.java
 */

package com.example.service;

import com.example.dto.DraftAssignmentDTO;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

public interface AssignmentDraftService {
    /**
     * Save or update a draft
     */
    DraftAssignmentDTO saveDraft(DraftAssignmentDTO draft) throws Exception;

    /**
     * Load a draft by ID
     */
    DraftAssignmentDTO loadDraft(String draftId) throws Exception;

    /**
     * List all drafts for a team
     */
    List<DraftAssignmentDTO> listDraftsByTeam(Integer teamId) throws Exception;

    /**
     * Delete a draft
     */
    void deleteDraft(String draftId) throws Exception;

    /**
     * Upload file to draft storage
     * Returns: { fileId, filename, url }
     */
    Map<String, Object> uploadFile(String draftId, MultipartFile file) throws Exception;

    /**
     * Delete file from draft
     */
    void deleteFile(String draftId, Long fileId) throws Exception;
}
