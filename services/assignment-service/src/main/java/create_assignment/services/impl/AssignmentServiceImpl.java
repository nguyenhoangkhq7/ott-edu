package create_assignment.services.impl;

import create_assignment.dto.AssignmentRequestDTO;
import create_assignment.dto.AssignmentResponseDTO;
import create_assignment.dto.QuestionDTO;
import create_assignment.dto.AnswerOptionDTO;
import create_assignment.entities.AnswerOption;
import create_assignment.entities.Assignment;
import create_assignment.entities.Material;
import create_assignment.entities.Question;
import create_assignment.enums.AssignmentType;
import create_assignment.exceptions.BadRequestException;
import create_assignment.mapper.AssignmentMapper;
import create_assignment.repositories.AssignmentRepository;
import create_assignment.repositories.MaterialRepository;
import create_assignment.services.AssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final MaterialRepository materialRepository;
    private final AssignmentMapper assignmentMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentResponseDTO> getAllAssignments() {
        List<Assignment> assignments = assignmentRepository.findAll();
        return assignments.stream()
                .map(assignmentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentResponseDTO> getAssignmentsByTeam(Long teamId) {
        List<Assignment> assignments = assignmentRepository.findByTeamId(teamId);
        return assignments.stream()
                .map(assignmentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentResponseDTO getAssignmentById(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy bài tập với ID: " + id));

        return assignmentMapper.toResponseDTO(assignment);
    }

    @Override
    @Transactional
    public AssignmentResponseDTO createAssignment(AssignmentRequestDTO dto) {
        try {
            // ---- Validation ----
            log.info("🔍 Validating assignment request: title={}, teamId={}, dueDate={}",
                    dto.getTitle(), dto.getTeamId(), dto.getDueDate());
            validateRequest(dto);
            log.info("✅ Validation passed");

            // ---- Build Assignment entity ----
            log.info("🔨 Building assignment entity with maxScore type: {}",
                    dto.getMaxScore() != null ? dto.getMaxScore().getClass().getSimpleName() : "null");

            Assignment assignment = Assignment.builder()
                    .title(dto.getTitle().trim())
                    .instructions(dto.getInstructions())
                    .maxScore(dto.getMaxScore())
                    .dueDate(dto.getDueDate())
                    .type(dto.getType())
                    .teamId(dto.getTeamId())
                    .build();
            log.info("✅ Assignment entity created successfully");

            // ---- Link existing Materials ----
            if (dto.getMaterialIds() != null && !dto.getMaterialIds().isEmpty()) {
                log.info("🔗 Linking {} materials...", dto.getMaterialIds().size());
                List<Material> materials = materialRepository.findAllByIdIn(dto.getMaterialIds());

                if (materials.size() != dto.getMaterialIds().size()) {
                    throw new BadRequestException(
                            "Một hoặc nhiều tài liệu (materialIds) không tồn tại trong hệ thống.");
                }

                assignment.setMaterials(materials);
                log.info("✅ Materials linked");
            }

            // ---- Build Questions (chỉ khi type == QUIZ) ----
            if (AssignmentType.QUIZ.equals(dto.getType())
                    && dto.getQuestions() != null
                    && !dto.getQuestions().isEmpty()) {
                log.info("❓ Building {} quiz questions...", dto.getQuestions().size());
                List<Question> questions = buildQuestions(dto.getQuestions(), assignment);
                assignment.setQuestions(questions);
                log.info("✅ Questions built");
            }

            // ---- Persist ----
            log.info("💾 Saving assignment to database...");
            Assignment saved = assignmentRepository.save(assignment);
            log.info("✅ Assignment saved successfully: id={}, title={}", saved.getId(), saved.getTitle());

            return assignmentMapper.toResponseDTO(saved);
        } catch (BadRequestException e) {
            log.error("❌ Bad request: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Unexpected error in createAssignment:", e);
            log.error("Exception type: {}", e.getClass().getName());
            log.error("Exception message: {}", e.getMessage());
            throw new RuntimeException("Lỗi tạo bài tập: " + e.getMessage(), e);
        }
    }

    // ---- Private helpers ----

    private void validateRequest(AssignmentRequestDTO dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new BadRequestException("Tiêu đề bài tập không được để trống.");
        }

        if (dto.getDueDate() == null) {
            throw new BadRequestException("Hạn nộp bài (due_date) không được để trống.");
        }

        LocalDateTime now = LocalDateTime.now();
        log.debug("⏰ Date check - Now: {}, DueDate: {}", now, dto.getDueDate());

        if (!dto.getDueDate().isAfter(now)) {
            throw new BadRequestException(
                    String.format("Hạn nộp bài phải lớn hơn thời điểm hiện tại. (Now: %s, Due: %s)", now,
                            dto.getDueDate()));
        }

        if (dto.getMaxScore() == null || dto.getMaxScore() <= 0) {
            throw new BadRequestException("Điểm tối đa phải lớn hơn 0. Nhận được: " + dto.getMaxScore());
        }

        if (dto.getType() == null) {
            throw new BadRequestException("Loại bài tập (type) không được để trống.");
        }

        if (dto.getTeamId() == null) {
            throw new BadRequestException("teamId không được để trống.");
        }

        if (AssignmentType.QUIZ.equals(dto.getType())
                && (dto.getQuestions() == null || dto.getQuestions().isEmpty())) {
            throw new BadRequestException("Bài tập Quiz phải có ít nhất một câu hỏi.");
        }
    }

    private List<Question> buildQuestions(List<QuestionDTO> questionDTOs, Assignment assignment) {
        List<Question> questions = new ArrayList<>();

        for (QuestionDTO qDTO : questionDTOs) {
            if (qDTO.getContent() == null || qDTO.getContent().isBlank()) {
                throw new BadRequestException("Nội dung câu hỏi không được để trống.");
            }

            Question question = Question.builder()
                    .content(qDTO.getContent().trim())
                    .assignment(assignment)
                    .build();

            if (qDTO.getAnswerOptions() != null && !qDTO.getAnswerOptions().isEmpty()) {
                List<AnswerOption> options = buildAnswerOptions(qDTO.getAnswerOptions(), question);
                question.setAnswerOptions(options);
            }

            questions.add(question);
        }

        return questions;
    }

    private List<AnswerOption> buildAnswerOptions(List<AnswerOptionDTO> optionDTOs, Question question) {
        List<AnswerOption> options = new ArrayList<>();

        for (AnswerOptionDTO oDTO : optionDTOs) {
            if (oDTO.getContent() == null || oDTO.getContent().isBlank()) {
                throw new BadRequestException("Nội dung đáp án không được để trống.");
            }

            options.add(AnswerOption.builder()
                    .content(oDTO.getContent().trim())
                    .isCorrect(oDTO.getIsCorrect())
                    .question(question)
                    .build());
        }

        return options;
    }
}
