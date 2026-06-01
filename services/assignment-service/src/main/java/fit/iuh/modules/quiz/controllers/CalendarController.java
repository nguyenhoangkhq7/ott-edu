package fit.iuh.modules.quiz.controllers;

import fit.iuh.common.utils.AuthUtil;
import fit.iuh.modules.quiz.dtos.CalendarEventDto;
import fit.iuh.modules.quiz.services.CalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Calendar deadlines and events aggregation.
 */
@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
@Tag(name = "Calendar", description = "Calendar and Deadline Aggregation APIs")
@SecurityRequirement(name = "Bearer Authentication")
public class CalendarController {

    private final CalendarService calendarService;

    /**
     * GET /api/v1/calendar/my-events
     * Retrieve aggregated list of assignments and quizzes for the student in a given month/year.
     */
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/my-events")
    @Operation(
            summary = "Get student calendar events",
            description = "Fetch all active assignments and quizzes with due dates in the specified month and year for all classes the student is enrolled in."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Events aggregated and retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - student role required")
    })
    public ResponseEntity<List<CalendarEventDto>> getMyEvents(
            @Parameter(description = "Month (1-12)", example = "5") @RequestParam int month,
            @Parameter(description = "Year", example = "2026") @RequestParam int year,
            @RequestHeader("Authorization") String authHeader,
            Authentication authentication) {

        Long studentId = AuthUtil.extractUserId(authentication);
        List<CalendarEventDto> events = calendarService.getStudentEvents(studentId, authHeader, month, year);
        return ResponseEntity.ok(events);
    }
}
