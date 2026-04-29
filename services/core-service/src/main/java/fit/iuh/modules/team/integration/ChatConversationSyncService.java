package fit.iuh.modules.team.integration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import fit.iuh.models.Profile;
import fit.iuh.models.Team;
import fit.iuh.models.TeamMember;
import fit.iuh.modules.auth.repositories.ProfileRepository;
import fit.iuh.modules.team.integration.dto.ChatClassConversationSyncRequest;
import fit.iuh.modules.team.integration.dto.ChatParticipantSyncRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Duration;
import java.util.List;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class ChatConversationSyncService {
    private final ProfileRepository profileRepository;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Value("${app.chat-service.base-url:http://localhost:3001/api}")
    private String chatServiceBaseUrl;

    public void syncClassConversation(Team team, boolean archived) {
        syncClassConversation(team, archived, team.getMembers());
    }

    public void syncClassConversation(Team team, boolean archived, List<TeamMember> members) {
        ChatClassConversationSyncRequest request = new ChatClassConversationSyncRequest(
                team.getId(),
                team.getName(),
                team.getDescription(),
                team.getDepartment() != null ? team.getDepartment().getId() : null,
                archived,
                (members == null ? List.<TeamMember>of() : members).stream()
                        .map(this::toParticipantSyncRequest)
                        .filter(participant -> StringUtils.hasText(participant.email()))
                        .toList()
        );

        sendJson("POST", "/conversations/class", request);
    }

    private ChatParticipantSyncRequest toParticipantSyncRequest(TeamMember member) {
        Long accountId = member.getAccount().getId();
        Profile profile = profileRepository.findById(accountId).orElse(null);

        String firstName = profile != null ? profile.getFirstName() : null;
        String lastName = profile != null ? profile.getLastName() : null;
        String fullName = normalizeFullName(firstName, lastName, member.getAccount().getEmail());
        String code = profile != null ? profile.getCode() : null;
        String avatarUrl = profile != null ? profile.getAvatarUrl() : null;

        return new ChatParticipantSyncRequest(
                accountId,
                member.getAccount().getEmail(),
                fullName,
                code,
                avatarUrl
        );
    }

    private String normalizeFullName(String firstName, String lastName, String fallbackEmail) {
        String combined = String.join(" ", List.of(
                firstName == null ? "" : firstName.trim(),
                lastName == null ? "" : lastName.trim()
        )).trim();

        if (StringUtils.hasText(combined)) {
            return combined;
        }

        int atIndex = fallbackEmail.indexOf('@');
        return atIndex > 0 ? fallbackEmail.substring(0, atIndex) : fallbackEmail;
    }

    private void sendJson(String method, String path, Object body) {
        try {
            String payload = objectMapper.writeValueAsString(body);
            IllegalStateException lastFailure = null;

            for (int attempt = 1; attempt <= 3; attempt++) {
                try {
                    HttpURLConnection connection = (HttpURLConnection) new URL(chatServiceBaseUrl + path).openConnection();
                    connection.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
                    connection.setReadTimeout((int) Duration.ofSeconds(15).toMillis());
                    connection.setRequestMethod(method);
                    connection.setDoOutput(true);
                    connection.setRequestProperty("Content-Type", "application/json");
                    connection.setRequestProperty("Accept", "application/json");

                    try (OutputStream outputStream = connection.getOutputStream()) {
                        outputStream.write(payload.getBytes(StandardCharsets.UTF_8));
                    }

                    int statusCode = connection.getResponseCode();
                    String responseBody = readResponseBody(connection, statusCode);
                    if (statusCode < 200 || statusCode >= 300) {
                        throw new IllegalStateException(
                                "Chat service sync failed with status " + statusCode + ": " + responseBody
                        );
                    }

                    return;
                } catch (IOException ex) {
                    lastFailure = new IllegalStateException("Failed to call chat service", ex);
                } catch (IllegalStateException ex) {
                    lastFailure = ex;
                }

                if (attempt < 3) {
                    try {
                        Thread.sleep(500L * attempt);
                    } catch (InterruptedException ex) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException("Chat service sync was interrupted", ex);
                    }
                }
            }

            throw lastFailure != null ? lastFailure : new IllegalStateException("Failed to call chat service");
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize chat sync payload", ex);
        }
    }

    private String readResponseBody(HttpURLConnection connection, int statusCode) throws IOException {
        InputStream inputStream = statusCode >= 400 ? connection.getErrorStream() : connection.getInputStream();
        if (inputStream == null) {
            return "";
        }

        try (InputStream stream = inputStream) {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
