package fit.iuh.modules.quiz.services;

import fit.iuh.modules.quiz.dtos.CalendarEventDto;
import fit.iuh.modules.quiz.dtos.TeamResponseDto;
import fit.iuh.modules.quiz.models.Assignment;
import fit.iuh.modules.quiz.models.AssignmentType;
import fit.iuh.modules.quiz.repositories.AssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CalendarServiceImplTest {

    @Mock
    private CoreServiceClient coreServiceClient;

    @Mock
    private AssignmentRepository assignmentRepository;

    @InjectMocks
    private CalendarServiceImpl calendarService;

    @Test
    void getStudentEvents_Success_WithTeamsAndAssignments() {
        // Arrange
        Long studentId = 1L;
        String authHeader = "Bearer test-token";
        int month = 5;
        int year = 2026;

        TeamResponseDto team1 = TeamResponseDto.builder().id(101L).name("Math 101").build();
        TeamResponseDto team2 = TeamResponseDto.builder().id(102L).name("History 102").build();
        List<TeamResponseDto> teams = List.of(team1, team2);

        Assignment assignment = new Assignment();
        assignment.setId(10L);
        assignment.setTitle("Math Homework");
        assignment.setType(AssignmentType.ESSAY);
        assignment.setTeamIds(List.of(101L));
        assignment.setDueDate(LocalDateTime.of(2026, 5, 20, 23, 59));

        when(coreServiceClient.getStudentTeams(authHeader)).thenReturn(teams);
        when(assignmentRepository.findActiveByTeamIdsAndMonthAndYear(List.of(101L, 102L), month, year))
                .thenReturn(List.of(assignment));

        // Act
        List<CalendarEventDto> events = calendarService.getStudentEvents(studentId, authHeader, month, year);

        // Assert
        assertNotNull(events);
        assertEquals(1, events.size());
        CalendarEventDto event = events.get(0);
        assertEquals(10L, event.getId());
        assertEquals("Math Homework", event.getTitle());
        assertEquals("ASSIGNMENT", event.getType());
        assertEquals("Math 101", event.getCourseName());
        assertEquals(101L, event.getTeamId());
        assertEquals(LocalDateTime.of(2026, 5, 20, 23, 59), event.getDueDate());

        verify(coreServiceClient, times(1)).getStudentTeams(authHeader);
        verify(assignmentRepository, times(1)).findActiveByTeamIdsAndMonthAndYear(List.of(101L, 102L), month, year);
    }

    @Test
    void getStudentEvents_Success_NoTeams() {
        // Arrange
        Long studentId = 1L;
        String authHeader = "Bearer test-token";
        int month = 5;
        int year = 2026;

        when(coreServiceClient.getStudentTeams(authHeader)).thenReturn(Collections.emptyList());

        // Act
        List<CalendarEventDto> events = calendarService.getStudentEvents(studentId, authHeader, month, year);

        // Assert
        assertNotNull(events);
        assertTrue(events.isEmpty());

        verify(coreServiceClient, times(1)).getStudentTeams(authHeader);
        verifyNoInteractions(assignmentRepository);
    }

    @Test
    void getStudentEvents_Success_NullTeams() {
        // Arrange
        Long studentId = 1L;
        String authHeader = "Bearer test-token";
        int month = 5;
        int year = 2026;

        when(coreServiceClient.getStudentTeams(authHeader)).thenReturn(null);

        // Act
        List<CalendarEventDto> events = calendarService.getStudentEvents(studentId, authHeader, month, year);

        // Assert
        assertNotNull(events);
        assertTrue(events.isEmpty());

        verify(coreServiceClient, times(1)).getStudentTeams(authHeader);
        verifyNoInteractions(assignmentRepository);
    }

    @Test
    void getStudentEvents_Failure_CoreServiceThrowsException() {
        // Arrange
        Long studentId = 1L;
        String authHeader = "Bearer test-token";
        int month = 5;
        int year = 2026;

        when(coreServiceClient.getStudentTeams(authHeader)).thenThrow(new RuntimeException("Core service unavailable"));

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            calendarService.getStudentEvents(studentId, authHeader, month, year);
        });

        assertEquals("Core service unavailable", exception.getMessage());
        verify(coreServiceClient, times(1)).getStudentTeams(authHeader);
        verifyNoInteractions(assignmentRepository);
    }
}
