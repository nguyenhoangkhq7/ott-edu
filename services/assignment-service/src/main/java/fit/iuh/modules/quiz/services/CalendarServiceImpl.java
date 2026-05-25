package fit.iuh.modules.quiz.services;

import fit.iuh.modules.quiz.dtos.CalendarEventDto;
import fit.iuh.modules.quiz.dtos.TeamResponseDto;
import fit.iuh.modules.quiz.models.Assignment;
import fit.iuh.modules.quiz.models.AssignmentType;
import fit.iuh.modules.quiz.repositories.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementation of CalendarService aggregating events across databases.
 */
@Service
@RequiredArgsConstructor
public class CalendarServiceImpl implements CalendarService {

    private final CoreServiceClient coreServiceClient;
    private final AssignmentRepository assignmentRepository;

    @Override
    public List<CalendarEventDto> getStudentEvents(Long studentId, String authHeader, int month, int year) {
        // 1. Fetch student enrolled teams from core-service
        List<TeamResponseDto> teams = coreServiceClient.getStudentTeams(authHeader);
        if (teams == null || teams.isEmpty()) {
            return List.of();
        }

        // Map team IDs to team names for easy lookup
        Map<Long, String> teamIdToNameMap = teams.stream()
                .collect(Collectors.toMap(
                        TeamResponseDto::getId,
                        TeamResponseDto::getName,
                        (existing, replacement) -> existing
                ));

        List<Long> teamIds = new ArrayList<>(teamIdToNameMap.keySet());

        // 2. Query assignment-service for assignments matching teamIds, month, and year
        List<Assignment> assignments = assignmentRepository.findActiveByTeamIdsAndMonthAndYear(teamIds, month, year);

        // 3. Map to CalendarEventDto
        return assignments.stream()
                .map(assignment -> {
                    // Match course/team name
                    String courseName = "Lớp học";
                    Long matchedTeamId = null;
                    if (assignment.getTeamIds() != null) {
                        for (Long teamId : assignment.getTeamIds()) {
                            if (teamIdToNameMap.containsKey(teamId)) {
                                courseName = teamIdToNameMap.get(teamId);
                                matchedTeamId = teamId;
                                break;
                            }
                        }
                    }

                    // Map AssignmentType to 'ASSIGNMENT' | 'QUIZ'
                    String eventType = assignment.getType() == AssignmentType.QUIZ ? "QUIZ" : "ASSIGNMENT";

                    return CalendarEventDto.builder()
                            .id(assignment.getId())
                            .title(assignment.getTitle())
                            .type(eventType)
                            .courseName(courseName)
                            .teamId(matchedTeamId)
                            .dueDate(assignment.getDueDate())
                            .build();
                })
                .collect(Collectors.toList());
    }
}
