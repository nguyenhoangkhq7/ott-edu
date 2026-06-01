package fit.iuh.modules.quiz.dtos;

import lombok.Data;

@Data
public class ProfileResponseDto {
    private Long accountId;
    private String fullName;
    private String code;
}
