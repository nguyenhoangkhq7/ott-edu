package fit.iuh.modules.platform.api;

import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

public final class ApiResponseFactory {

    private ApiResponseFactory() {
    }

    public static <T> ApiSuccessResponse<T> success(HttpStatus status, String message, T data) {
        return ApiSuccessResponse.<T>builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .message(message)
                .data(data)
                .build();
    }
}
