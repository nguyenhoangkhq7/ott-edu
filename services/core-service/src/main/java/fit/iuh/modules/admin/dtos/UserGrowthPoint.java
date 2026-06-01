package fit.iuh.modules.admin.dtos;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserGrowthPoint {
    private String month;
    private long count;
}
