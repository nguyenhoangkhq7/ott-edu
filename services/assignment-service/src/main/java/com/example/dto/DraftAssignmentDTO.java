/**
 * Draft Assignment DTO
 * Place in: services/assignment-service/src/main/java/com/example/dto/DraftAssignmentDTO.java
 */

package com.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DraftAssignmentDTO {
    private String id;
    private Integer teamId;
    private String title;
    private String description;
    private String assignmentType; // QUIZ or ESSAY
    private Integer maxPoints;
    private String dueDate;
    private String dueTime;
    private List<Long> attachementIds;
    private String createdAt;
    private String updatedAt;
}
