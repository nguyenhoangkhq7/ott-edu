package fit.iuh.modules.document.services;

import fit.iuh.modules.document.dtos.DocumentUploadResponse;
import fit.iuh.modules.document.entities.Document;
import fit.iuh.modules.document.entities.DocumentChunk;
import fit.iuh.modules.document.entities.DocumentStatus;
import fit.iuh.modules.document.repositories.DocumentChunkRepository;
import fit.iuh.modules.document.repositories.DocumentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentIngestionService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final DocumentReaderFactory readerFactory;
    private final SemanticChunker semanticChunker;
    private final VectorStore vectorStore;

    private static final List<String> SUPPORTED_TYPES = List.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );

    @Transactional
    public DocumentUploadResponse ingestDocument(MultipartFile file) {
        validateFile(file);

        // 1. Create Document entity
        Document document = Document.builder()
                .originalFilename(file.getOriginalFilename())
                .contentType(file.getContentType())
                .status(DocumentStatus.PROCESSING)
                .build();
        document = documentRepository.save(document);

        try {
            // 2. Extract text
            String rawText = readerFactory.extractText(file);
            log.info("Extracted {} characters from {}", rawText.length(), file.getOriginalFilename());

            // 3. Semantic chunking
            List<String> textChunks = semanticChunker.chunk(rawText);
            log.info("Created {} chunks from {}", textChunks.size(), file.getOriginalFilename());

            // 4. Save chunks + embeddings
            for (int i = 0; i < textChunks.size(); i++) {
                String chunkContent = textChunks.get(i);

                // Save JPA entity
                DocumentChunk chunk = DocumentChunk.builder()
                        .documentId(document.getId())
                        .chunkIndex(i)
                        .content(chunkContent)
                        .build();
                chunkRepository.save(chunk);

                // Save to VectorStore (computes embedding via CPU model automatically)
                var aiDoc = new org.springframework.ai.document.Document(
                        chunk.getId().toString(),
                        chunkContent,
                        Map.of(
                                "documentId", document.getId().toString(),
                                "chunkIndex", String.valueOf(i),
                                "source", file.getOriginalFilename()
                        )
                );
                vectorStore.add(List.of(aiDoc));
            }

            // 5. Update document status
            document.setTotalChunks(textChunks.size());
            document.setStatus(DocumentStatus.COMPLETED);
            documentRepository.save(document);

            log.info("Document {} ingested successfully with {} chunks",
                    document.getId(), textChunks.size());

        } catch (IOException e) {
            document.setStatus(DocumentStatus.FAILED);
            documentRepository.save(document);
            throw new RuntimeException("Failed to process document: " + e.getMessage(), e);
        }

        return toResponse(document);
    }

    public DocumentUploadResponse getDocumentInfo(UUID documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));
        return toResponse(doc);
    }

    public List<DocumentChunk> getChunks(UUID documentId) {
        return chunkRepository.findByDocumentIdOrderByChunkIndex(documentId);
    }

    @Transactional
    public void deleteDocument(UUID documentId) {
        // VectorStore cleanup: delete by metadata filter
        // Note: PgVectorStore supports delete by ID list
        List<DocumentChunk> chunks = chunkRepository.findByDocumentIdOrderByChunkIndex(documentId);
        List<String> vectorIds = chunks.stream()
                .map(c -> c.getId().toString())
                .toList();
        if (!vectorIds.isEmpty()) {
            vectorStore.delete(vectorIds);
        }
        chunkRepository.deleteByDocumentId(documentId);
        documentRepository.deleteById(documentId);
        log.info("Document {} and {} chunks deleted", documentId, chunks.size());
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !SUPPORTED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Unsupported file type: " + contentType + ". Supported: .pdf, .docx, .pptx");
        }
    }

    private DocumentUploadResponse toResponse(Document doc) {
        return DocumentUploadResponse.builder()
                .documentId(doc.getId())
                .originalFilename(doc.getOriginalFilename())
                .contentType(doc.getContentType())
                .totalChunks(doc.getTotalChunks())
                .status(doc.getStatus())
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
