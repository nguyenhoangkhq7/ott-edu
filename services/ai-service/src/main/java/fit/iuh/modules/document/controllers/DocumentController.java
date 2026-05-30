package fit.iuh.modules.document.controllers;

import fit.iuh.modules.document.dtos.*;
import fit.iuh.modules.document.services.DocumentIngestionService;
import fit.iuh.modules.document.services.QuestionGenerationService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai/documents")
public class DocumentController {

    private final DocumentIngestionService ingestionService;
    private final QuestionGenerationService questionService;

    public DocumentController(DocumentIngestionService ingestionService,
                               QuestionGenerationService questionService) {
        this.ingestionService = ingestionService;
        this.questionService = questionService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentUploadResponse> uploadDocument(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ingestionService.ingestDocument(file));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable UUID id) {
        return ResponseEntity.ok(ingestionService.getDocumentInfo(id));
    }

    @GetMapping("/{id}/chunks")
    public ResponseEntity<?> getDocumentChunks(@PathVariable UUID id) {
        return ResponseEntity.ok(ingestionService.getChunks(id));
    }

    /**
     * §4: API sinh câu hỏi trả về SSE stream.
     *
     * Client dùng EventSource API (JavaScript):
     *   const es = new EventSource('/api/ai/documents/generate-questions?...');
     *   es.addEventListener('result', (e) => { ... });
     *
     * Hoặc gọi bằng fetch/axios:
     *   POST với Accept: text/event-stream
     *
     * Timeout: 2 phút (cấu hình trong application.yaml)
     */
    @PostMapping(value = "/generate-questions", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateQuestions(@Valid @RequestBody QuestionGenerationRequest request) {
        // Timeout 2 phút cho SSE connection
        SseEmitter emitter = new SseEmitter(300_000L);

        // Đẩy xử lý sang async thread, trả SseEmitter ngay cho client
        questionService.generateQuestionsAsync(request, emitter);

        return emitter;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID id) {
        ingestionService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
