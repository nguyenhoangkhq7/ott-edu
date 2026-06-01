package fit.iuh.modules.document.services;

import fit.iuh.modules.document.dtos.QuestionGenerationRequest;
import fit.iuh.modules.document.entities.DocumentChunk;
import fit.iuh.modules.document.entities.QuestionType;
import fit.iuh.modules.document.repositories.DocumentChunkRepository;
import org.springframework.ai.chat.client.ChatClient;
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
    private final DocumentChunkRepository chunkRepository;

    // Prompt templates
    private static final String MC_PROMPT = """
            Bạn là một chuyên gia khảo thí khắt khe. Dựa trên nội dung tài liệu sau đây, hãy tạo CHÍNH XÁC {questionCount} câu hỏi trắc nghiệm.

            === NỘI DUNG TÀI LIỆU ===
            {context}
            === KẾT THÚC NỘI DUNG ===

            YÊU CẦU TỐI THƯỢNG (VI PHẠM SẼ BỊ LOẠI BỎ KẾT QUẢ):
            1. ĐỒNG BỘ NGÔN NGỮ (QUAN TRỌNG NHẤT): Phân tích ngôn ngữ của đoạn tài liệu trên. Nếu tài liệu viết bằng TIẾNG ANH, toàn bộ JSON PHẢI được viết bằng TIẾNG ANH (TUYỆT ĐỐI KHÔNG ĐƯỢC DỊCH SANG TIẾNG VIỆT, DÙ PROMPT NÀY VIẾT BẰNG TIẾNG VIỆT).
            Nếu tài liệu bằng TIẾNG VIỆT, dùng TIẾNG VIỆT cho câu hỏi và đáp án. KHÔNG được phép tạo câu hỏi bằng ngôn ngữ khác với ngôn ngữ của tài liệu.
            2. CHỐNG LẶP LẠI (QUAN TRỌNG NHẤT): Mỗi câu hỏi phải khai thác một khái niệm HOÀN TOÀN KHÁC NHAU trong tài liệu. TUYỆT ĐỐI KHÔNG sử dụng lại bộ đáp án của câu trước cho câu sau. TUYỆT ĐỐI KHÔNG hỏi lại một ý đã hỏi.
            3. ĐỘ DÀI ĐÁP ÁN: Các đáp án (options) PHẢI LÀ CỤM TỪ NGẮN (tối đa 10 từ). TUYỆT ĐỐI KHÔNG copy nguyên câu văn dài làm đáp án.
               - MẪU ĐÁP ÁN TỐT: "A. Virtual teams", "B. Outsourcing", "C. Globalization".
               - MẪU ĐÁP ÁN XẤU (CẤM DÙNG): "A. Virtual teams are groups of individuals who work across time..."
            4. SỰ THẬT TỪ TÀI LIỆU: Chỉ hỏi những gì có trong đoạn tài liệu. Các đáp án nhiễu (sai) phải được lấy từ các khái niệm khác CÓ TRONG TÀI LIỆU để gây nhầm lẫn, không được tự bịa chữ.
            5. LỜI GIẢI THÍCH TRÁCH NHIỆM: Phải trích dẫn hoặc giải thích rõ tại sao đáp án đó đúng. TUYỆT ĐỐI KHÔNG sinh các câu vô nghĩa như "Explanation for the first question".
            6. CÚ PHÁP JSON: KHÔNG dùng dấu ngoặc kép (") bên trong nội dung các trường. Dùng dấu nháy đơn ('). Sinh chính xác {questionCount} đối tượng.

            VÍ DỤ CẤU TRÚC JSON:
            [
              {{
                "question": "Nội dung câu hỏi ngắn gọn?",
                "options": [
                  "A. Cụm từ 1",
                  "B. Cụm từ 2",
                  "C. Cụm từ 3",
                  "D. Cụm từ 4"
                ],
                "correctAnswer": "B",
                "explanation": "Giải thích chi tiết lý do B đúng dựa trên tài liệu."
              }}
            ]
            """;

    private static final String ESSAY_PROMPT = """
            Bạn là một giáo viên chuyên nghiệp. Dựa trên nội dung sau đây, hãy tạo CHÍNH XÁC {questionCount} câu hỏi tự luận.

            === NỘI DUNG TÀI LIỆU ===
            {context}
            === KẾT THÚC NỘI DUNG ===

            YÊU CẦU TỐI THƯỢNG:
            1. ĐỒNG BỘ NGÔN NGỮ: Nếu tài liệu bằng TIẾNG ANH, tạo câu hỏi và gợi ý bằng TIẾNG ANH. Nếu bằng TIẾNG VIỆT, dùng TIẾNG VIỆT.
            2. KHAI THÁC ĐA DẠNG: Mỗi câu hỏi tự luận phải tập trung vào một khía cạnh hoặc chương khác nhau của tài liệu. KHÔNG lặp lại nội dung đã hỏi.
            3. TRUNG THÀNH VỚI TÀI LIỆU: Gợi ý trả lời (suggestedAnswer) và các ý chính (keyPoints) phải được tóm tắt trực tiếp từ tài liệu, không tự biên soạn kiến thức ngoài.
            4. CÚ PHÁP JSON: Tuyệt đối không sử dụng dấu ngoặc kép (") bên trong nội dung các trường để tránh lỗi Parse JSON. Dùng dấu nháy đơn (').
            5. SỐ LƯỢNG: Tạo ra CHÍNH XÁC {questionCount} câu hỏi tự luận.
            
            Các trường cần có trong mỗi đối tượng JSON:
            - "question": Câu hỏi yêu cầu phân tích, tổng hợp.
            - "suggestedAnswer": Gợi ý trả lời chi tiết, thực tế.
            - "keyPoints": Mảng (Array) chứa các ý chính (cụm từ ngắn) cần có.
            """;

    public QuestionGenerationService(ChatClient chatClient,
                                      DocumentChunkRepository chunkRepository) {
        this.chatClient = chatClient;
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
            sendSseEvent(emitter, "progress", Map.of("message", "Bắt đầu khởi tạo ngân hàng câu hỏi..."));

            UUID docId = request.getDocumentId();
            List<DocumentChunk> allChunks = chunkRepository.findByDocumentIdOrderByChunkIndex(docId);
            
            if (allChunks.isEmpty()) {
                sendSseEvent(emitter, "error", Map.of("message", "Không tìm thấy nội dung tài liệu."));
                emitter.complete();
                return;
            }

            int totalQuestions = request.getQuestionCount(); 
            
            // Chọn prompt template dựa trên loại câu hỏi
            String promptTemplate = switch (request.getQuestionType()) {
                case MULTIPLE_CHOICE -> MC_PROMPT;
                case ESSAY -> ESSAY_PROMPT;
            };

            int totalChunks = allChunks.size();
            int generatedCount = 0;
            int iteration = 0;

            // VÒNG LẶP PHÂN BỔ ĐỘNG
            while (generatedCount < totalQuestions && iteration < totalChunks) {
                
                DocumentChunk currentChunk;
                int questionsToAskForThisChunk = 1;

                if (totalQuestions <= totalChunks) {
                    // TRƯỜNG HỢP 1: Tài liệu dài, ít câu -> Dùng Striding (Nhảy cóc)
                    int step = totalChunks / totalQuestions;
                    currentChunk = allChunks.get(iteration * step);
                } else {
                    // TRƯỜNG HỢP 2: Tài liệu ngắn, nhiều câu -> Dùng Batching (Vắt kiệt từng chunk)
                    currentChunk = allChunks.get(iteration);
                    int baseQuestions = totalQuestions / totalChunks;
                    int remainder = totalQuestions % totalChunks;
                    // Chia đều phần dư cho các chunk đầu tiên
                    questionsToAskForThisChunk = baseQuestions + (iteration < remainder ? 1 : 0);
                }

                String context = currentChunk.getContent();

                sendSseEvent(emitter, "progress", Map.of(
                        "step", generatedCount + 1,
                        "message", String.format("Đang xử lý tài liệu - Soạn lô câu hỏi từ đoạn %d/%d (Tiến độ: %d/%d)...", 
                                                 iteration + 1, totalChunks, generatedCount, totalQuestions)
                ));

                Object batchResult = null;
                int maxRetries = 2; 
                int attempts = 0;
                final int finalQuestionsCount = questionsToAskForThisChunk;

                while (attempts < maxRetries && batchResult == null) {
                    try {
                        if (request.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
                            batchResult = chatClient.prompt()
                                    .user(u -> u.text(promptTemplate)
                                            .param("questionCount", String.valueOf(finalQuestionsCount))
                                            .param("context", context))
                                    .call()
                                    .entity(new ParameterizedTypeReference<List<MultipleChoiceQuestion>>() {});
                        } else {
                            batchResult = chatClient.prompt()
                                    .user(u -> u.text(promptTemplate)
                                            .param("questionCount", String.valueOf(finalQuestionsCount))
                                            .param("context", context))
                                    .call()
                                    .entity(new ParameterizedTypeReference<List<EssayQuestion>>() {});
                        }
                    } catch (Exception parseException) {
                        attempts++;
                        String retryMsg = String.format(
                            "AI sinh lỗi JSON ở đoạn %d, đang thử lại... (Lần %d/%d)",
                            iteration + 1, attempts, maxRetries);
                        System.err.println(retryMsg);
                        try {
                            sendSseEvent(emitter, "progress", Map.of("message", retryMsg));
                        } catch (IOException ignored) {}
                    }
                }

                if (batchResult != null) {
                    sendSseEvent(emitter, "partial_result", Map.of(
                            "documentId", docId,
                            "questionType", request.getQuestionType(),
                            "questions", batchResult
                    ));
                    generatedCount += questionsToAskForThisChunk;
                } else {
                    // All retries exhausted for this chunk — notify the client and continue
                    sendSseEvent(emitter, "progress", Map.of(
                        "message", String.format("Bỏ qua đoạn %d sau %d lần thử (AI trả JSON không hợp lệ).",
                                                iteration + 1, maxRetries)));
                }

                iteration++;
                Thread.sleep(500); // Xả VRAM
            }

            sendSseEvent(emitter, "completed", Map.of("message", "Đã sinh thành công " + generatedCount + " câu hỏi."));
            emitter.complete();

        } catch (Exception e) {
            try {
                sendSseEvent(emitter, "error", Map.of("message", e.getMessage()));
            } catch (IOException ignored) {}
            emitter.completeWithError(e);
        }
    }

    // ── Helper methods ──

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
