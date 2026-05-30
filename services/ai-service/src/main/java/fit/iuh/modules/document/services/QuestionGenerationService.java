package fit.iuh.modules.document.services;

import fit.iuh.modules.document.dtos.QuestionGenerationRequest;
import fit.iuh.modules.document.entities.DocumentChunk;
import fit.iuh.modules.document.entities.QuestionType;
import fit.iuh.modules.document.repositories.DocumentChunkRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class QuestionGenerationService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final DocumentChunkRepository chunkRepository;

    // Prompt templates
    private static final String MC_PROMPT = """
            Bạn là một giáo viên chuyên nghiệp. Dựa trên nội dung sau đây,
            hãy tạo CHÍNH XÁC {questionCount} câu hỏi trắc nghiệm (multiple choice).

            === NỘI DUNG TÀI LIỆU ===
            {context}
            === KẾT THÚC NỘI DUNG ===

            YÊU CẦU NGHIÊM NGẶT:
            1. Tạo ra CHÍNH XÁC {questionCount} câu hỏi trắc nghiệm (tương ứng với {questionCount} đối tượng trong JSON array). Tuyệt đối không sinh thiếu và không sinh thừa.
            2. Trường "question": Bắt buộc phải là một câu hỏi có dấu chấm hỏi (?), không được copy nguyên xi câu trần thuật từ tài liệu.
            3. Trường "options": Bắt buộc phải chứa 4 chuỗi văn bản, MỖI CHUỖI LÀ NỘI DUNG CHI TIẾT CỦA MỘT ĐÁP ÁN (phải có tiền tố A., B., C., D.). Tuyệt đối KHÔNG ĐƯỢC chỉ trả về ["A", "B", "C", "D"].
            4. Trường "correctAnswer": Chỉ ghi 1 ký tự duy nhất (A, B, C hoặc D).
            5. Trường "explanation": Giải thích ngắn gọn vì sao đáp án đó đúng.
            6. Chỉ sử dụng kiến thức có trong tài liệu được cung cấp.

            VÍ DỤ ĐỊNH DẠNG MONG MUỐN:
            [
              {{
                "question": "Kiến trúc Flynn phân loại máy tính song song dựa trên yếu tố nào?",
                "options": [
                  "A. Tốc độ xung nhịp của CPU",
                  "B. Sự đa dạng của luồng lệnh và luồng dữ liệu",
                  "C. Dung lượng bộ nhớ RAM",
                  "D. Băng thông mạng lưới"
                ],
                "correctAnswer": "B",
                "explanation": "Theo tài liệu, kiến trúc Flynn (1966) dựa trên sự đa dạng của luồng lệnh và luồng dữ liệu quan sát được bởi CPU."
              }}
            ]
            """;

    private static final String ESSAY_PROMPT = """
            Bạn là một giáo viên chuyên nghiệp. Dựa trên nội dung sau đây,
            hãy tạo CHÍNH XÁC {questionCount} câu hỏi tự luận (essay).

            === NỘI DUNG TÀI LIỆU ===
            {context}
            === KẾT THÚC NỘI DUNG ===

            YÊU CẦU NGHIÊM NGẶT:
            1. Tạo ra CHÍNH XÁC {questionCount} câu hỏi tự luận (tương ứng với {questionCount} đối tượng trong JSON array). Tuyệt đối không sinh thiếu và không sinh thừa.
            2. Trường "question": Bắt buộc phải là một câu hỏi yêu cầu phân tích, tổng hợp kiến thức.
            3. Trường "suggestedAnswer": Cung cấp gợi ý trả lời chi tiết.
            4. Trường "keyPoints": Mảng chứa các ý chính cần có trong câu trả lời.
            5. Câu hỏi bám sát nội dung, không suy diễn ngoài tài liệu.
            6. Trả lời bằng tiếng Việt.
            """;

    public QuestionGenerationService(ChatClient chatClient,
                                      VectorStore vectorStore,
                                      DocumentChunkRepository chunkRepository) {
        this.chatClient = chatClient;
        this.vectorStore = vectorStore;
        this.chunkRepository = chunkRepository;
    }

    /**
     * §4: Xử lý sinh câu hỏi bất đồng bộ, stream kết quả qua SSE.
     *
     * @Async đẩy method này chạy trên thread pool (ai-async-*)
     * thay vì chiếm Tomcat request thread.
     */
    @Async
    public void generateQuestionsAsync(QuestionGenerationRequest request, SseEmitter emitter) {
        try {
            // 1. Emit start event
            sendSseEvent(emitter, "started", Map.of(
                    "message", "Bắt đầu xử lý yêu cầu sinh câu hỏi..."
            ));

            // 2. Lấy chunks của document → build context query
            UUID docId = request.getDocumentId();
            List<DocumentChunk> chunks = chunkRepository.findByDocumentIdOrderByChunkIndex(docId);
            if (chunks.isEmpty()) {
                sendSseEvent(emitter, "error", Map.of("message", "Không tìm thấy nội dung tài liệu."));
                emitter.complete();
                return;
            }

            sendSseEvent(emitter, "progress", Map.of(
                    "step", 1,
                    "message", "Đang tìm kiếm nội dung liên quan..."
            ));

            // 3. Similarity Search qua PgVectorStore
            String searchQuery = buildSearchQuery(chunks);
            var searchResults = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(searchQuery)
                            .topK(Math.min(chunks.size(), 10))
                            .similarityThreshold(0.5)
                            .build()
            );

            // 4. Build context từ search results
            String context = searchResults.stream()
                    .map(doc -> doc.getText())
                    .collect(Collectors.joining("\n\n---\n\n"));

            int totalNeeded = request.getQuestionCount();
            int batchSize = 10;
            int numBatches = (int) Math.ceil((double) totalNeeded / batchSize);
            java.util.ArrayList<Object> allQuestions = new java.util.ArrayList<>();

            // 5. Chọn prompt template theo question type
            String promptTemplate = switch (request.getQuestionType()) {
                case MULTIPLE_CHOICE -> MC_PROMPT;
                case ESSAY -> ESSAY_PROMPT;
            };

            // 6. Gọi ChatClient (GPU) theo từng lô (Batching)
            for (int batch = 0; batch < numBatches; batch++) {
                int currentBatchCount = Math.min(batchSize, totalNeeded - batch * batchSize);
                int startIdx = batch * batchSize + 1;
                int endIdx = startIdx + currentBatchCount - 1;

                sendSseEvent(emitter, "progress", Map.of(
                        "step", 2,
                        "message", String.format("Đang sinh câu hỏi từ %d đến %d...", startIdx, endIdx)
                ));

                // Phân bổ ngữ cảnh động (sliding window) theo từng lô để tối đa hóa độ phủ tài liệu
                int chunkOffset = (batch * 3) % Math.max(1, searchResults.size());
                String contextForBatch = searchResults.stream()
                        .skip(chunkOffset)
                        .limit(4)
                        .map(doc -> doc.getText())
                        .collect(Collectors.joining("\n\n---\n\n"));

                if (contextForBatch.isBlank()) {
                    contextForBatch = context;
                }

                final String finalContext = contextForBatch;

                if (request.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
                    List<MultipleChoiceQuestion> batchQuestions = chatClient.prompt()
                            .user(u -> u.text(promptTemplate)
                                    .param("questionCount", String.valueOf(currentBatchCount))
                                    .param("context", finalContext))
                            .call()
                            .entity(new ParameterizedTypeReference<List<MultipleChoiceQuestion>>() {});
                    if (batchQuestions != null) {
                        allQuestions.addAll(batchQuestions);
                    }
                } else {
                    List<EssayQuestion> batchQuestions = chatClient.prompt()
                            .user(u -> u.text(promptTemplate)
                                    .param("questionCount", String.valueOf(currentBatchCount))
                                    .param("context", finalContext))
                            .call()
                            .entity(new ParameterizedTypeReference<List<EssayQuestion>>() {});
                    if (batchQuestions != null) {
                        allQuestions.addAll(batchQuestions);
                    }
                }
            }

            // 7. Emit result
            sendSseEvent(emitter, "result", Map.of(
                    "documentId", docId,
                    "questionType", request.getQuestionType(),
                    "questions", allQuestions
            ));

            emitter.complete();

        } catch (Exception e) {
            try {
                sendSseEvent(emitter, "error", Map.of("message", e.getMessage()));
            } catch (IOException ignored) {}
            emitter.completeWithError(e);
        }
    }

    // ── Helper methods ──

    private String buildSearchQuery(List<DocumentChunk> chunks) {
        // Dùng nội dung 3 chunk đầu làm query hint cho similarity search
        return chunks.stream()
                .limit(3)
                .map(DocumentChunk::getContent)
                .collect(Collectors.joining(" "));
    }

    private void sendSseEvent(SseEmitter emitter, String eventName, Object data) throws IOException {
        emitter.send(SseEmitter.event()
                .name(eventName)
                .data(data));
    }

    // ── Structured Output Records ──

    public record MultipleChoiceQuestion(
            String question,
            List<String> options,
            String correctAnswer,
            String explanation
    ) {}

    public record EssayQuestion(
            String question,
            String suggestedAnswer,
            List<String> keyPoints
    ) {}
}
