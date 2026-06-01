package fit.iuh.modules.quiz.services;

import fit.iuh.modules.quiz.dtos.CalendarEventDto;

import java.util.List;

/**
 * Service interface for calendar operations.
 */
public interface CalendarService {

    /**
     * Retrieve all calendar events (assignments and quizzes) for the student.
     *
     * @param studentId The student account ID
     * @param authHeader The authorization token to propagate to core-service
     * @param month The calendar month (1-12)
     * @param year The calendar year
     * @return List of aggregated calendar events
     */
    List<CalendarEventDto> getStudentEvents(Long studentId, String authHeader, int month, int year);
}
