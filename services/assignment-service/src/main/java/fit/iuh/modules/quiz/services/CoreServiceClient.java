package fit.iuh.modules.quiz.services;

import fit.iuh.modules.quiz.dtos.TeamResponseDto;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Service client to communicate with core-service internally.
 */
@Service
public class CoreServiceClient {

    private final RestTemplate restTemplate;
    private final String coreServiceUrl;

    public CoreServiceClient(RestTemplate restTemplate,
                             @Value("${app.core-service-url:http://core-service:8080}") String coreServiceUrl) {
        this.restTemplate = restTemplate;
        this.coreServiceUrl = coreServiceUrl;
    }

    /**
     * Fetch enrolled classes/teams for the student using the active JWT token.
     *
     * @param authHeader The Authorization Bearer token header
     * @return List of TeamResponseDto representing student classes
     */
    public List<TeamResponseDto> getStudentTeams(String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        String url = coreServiceUrl + "/teams";

        try {
            ResponseEntity<ApiSuccessResponse<List<TeamResponseDto>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<ApiSuccessResponse<List<TeamResponseDto>>>() {}
            );

            if (response.getBody() != null && response.getBody().getData() != null) {
                return response.getBody().getData();
            }
        } catch (Exception e) {
            System.err.println("❌ [CoreServiceClient] Error fetching student classes: " + e.getMessage());
        }
        return List.of();
    }

    /**
     * Helper response envelope matching core-service's ApiSuccessResponse wrapper.
     */
    @Getter
    @Setter
    public static class ApiSuccessResponse<T> {
        private String timestamp;
        private int status;
        private String message;
        private T data;
    }
}
