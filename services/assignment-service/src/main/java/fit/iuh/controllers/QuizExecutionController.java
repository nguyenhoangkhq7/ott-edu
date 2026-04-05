package fit.iuh.controllers;

import fit.iuh.dtos.SubmissionResultResponse;
import fit.iuh.dtos.SubmitQuizRequest;
import fit.iuh.dtos.responses.ApiResponse;
import fit.iuh.services.QuizExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/quiz")
@RequiredArgsConstructor
public class QuizExecutionController {

    private final QuizExecutionService quizExecutionService;

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<SubmissionResultResponse>> submitQuiz(@RequestBody SubmitQuizRequest request) {
        SubmissionResultResponse result = quizExecutionService.submitQuiz(request);
        return ResponseEntity.ok(ApiResponse.success(result, "Quiz submitted and graded successfully"));
    }
}
