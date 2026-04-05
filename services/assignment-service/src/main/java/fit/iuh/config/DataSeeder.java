package fit.iuh.config;

import fit.iuh.models.AnswerOption;
import fit.iuh.models.Assignment;
import fit.iuh.models.Question;
import fit.iuh.models.enums.AssignmentType;
import fit.iuh.models.enums.QuestionType;
import fit.iuh.repositories.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final AssignmentRepository assignmentRepository;

    @Override
    public void run(String... args) {
        if (assignmentRepository.count() == 0) {
            log.info("Database is empty. Seeding sample assignment...");

            Assignment assignment = Assignment.builder()
                    .title("Kiểm tra kiến thức Java cơ bản")
                    .instructions("Hãy chọn đáp án đúng nhất cho các câu hỏi sau. Thời gian làm bài 15 phút.")
                    .maxScore(10.0)
                    .dueDate(LocalDateTime.now().plusDays(7))
                    .type(AssignmentType.QUIZ)
                    .teamId(1L)
                    .createdAt(LocalDateTime.now())
                    .build();

            Question q1 = Question.builder()
                    .content("Ngôn ngữ Java được phát triển bởi công ty nào?")
                    .points(5.0)
                    .questionType(QuestionType.SINGLE_CHOICE)
                    .displayOrder(1)
                    .assignment(assignment)
                    .build();

            q1.setOptions(List.of(
                    AnswerOption.builder().content("Microsoft").correct(false).displayOrder(1).question(q1).build(),
                    AnswerOption.builder().content("Sun Microsystems (nay là Oracle)").correct(true).displayOrder(2).question(q1).build(),
                    AnswerOption.builder().content("Google").correct(false).displayOrder(3).question(q1).build(),
                    AnswerOption.builder().content("Apple").correct(false).displayOrder(4).question(q1).build()
            ));

            Question q2 = Question.builder()
                    .content("JDK là viết tắt của cụm từ nào?")
                    .points(5.0)
                    .questionType(QuestionType.SINGLE_CHOICE)
                    .displayOrder(2)
                    .assignment(assignment)
                    .build();

            q2.setOptions(List.of(
                    AnswerOption.builder().content("Java Development Kit").correct(true).displayOrder(1).question(q2).build(),
                    AnswerOption.builder().content("Java Design Kit").correct(false).displayOrder(2).question(q2).build(),
                    AnswerOption.builder().content("Java Desktop Kit").correct(false).displayOrder(3).question(q2).build(),
                    AnswerOption.builder().content("Java Deployment Kit").correct(false).displayOrder(4).question(q2).build()
            ));

            assignment.setQuestions(List.of(q1, q2));
            assignmentRepository.save(assignment);

            log.info("Sample assignment seeded successfully!");
        } else {
            log.info("Database already contains assignments. Skipping seeding.");
        }
    }
}
