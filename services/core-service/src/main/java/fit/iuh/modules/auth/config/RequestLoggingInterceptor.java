package fit.iuh.modules.auth.config;

import java.util.Enumeration;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * ✅ RequestLoggingInterceptor: Log tất cả request details (Body, FormData,
 * Headers) Giúp debug asymmetry giữa Mobile và Web requests
 */
@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {

        String requestId = UUID.randomUUID().toString().substring(0, 8);
        long startTime = System.currentTimeMillis();

        // Lưu start time vào request attribute
        request.setAttribute("startTime", startTime);
        request.setAttribute("requestId", requestId);

        String method = request.getMethod();
        String uri = request.getRequestURI();
        String contentType = request.getContentType();

        System.out.println("\n" + "=".repeat(80));
        System.out.println("📨 [" + requestId + "] INCOMING REQUEST");
        System.out.println("=".repeat(80));
        System.out.println("🔹 METHOD: " + method);
        System.out.println("🔹 URI: " + uri);
        System.out.println("🔹 CONTENT-TYPE: " + contentType);

        // Log Headers
        logHeaders(request);

        // Log Request Body or FormData
        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)) {
            if (contentType != null && contentType.contains("multipart/form-data")) {
                logFormData(request, requestId);
            } else {
                logRequestBody(request);
            }
        }

        System.out.println("=".repeat(80) + "\n");

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
            Object handler, Exception ex) throws Exception {

        String requestId = (String) request.getAttribute("requestId");
        Long startTime = (Long) request.getAttribute("startTime");
        long duration = System.currentTimeMillis() - startTime;

        System.out.println("\n" + "=".repeat(80));
        System.out.println("📤 [" + requestId + "] RESPONSE COMPLETED");
        System.out.println("=".repeat(80));
        System.out.println("🔹 STATUS: " + response.getStatus());
        System.out.println("🔹 DURATION: " + duration + "ms");

        if (ex != null) {
            System.out.println("❌ EXCEPTION: " + ex.getMessage());
            ex.printStackTrace();
        }

        System.out.println("=".repeat(80) + "\n");
    }

    /**
     * Log HTTP Headers để detect Content-Type mismatch
     */
    private void logHeaders(HttpServletRequest request) {
        System.out.println("\n📋 HEADERS:");
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            String headerValue = request.getHeader(headerName);
            // Mask sensitive headers
            if (headerName.equalsIgnoreCase("Authorization")) {
                headerValue = headerValue.substring(0, Math.min(20, headerValue.length())) + "...";
            }
            System.out.println("   " + headerName + ": " + headerValue);
        }
    }

    /**
     * Log FormData parts (Mobile sẽ qua hàm này)
     */
    private void logFormData(HttpServletRequest request, String requestId) {
        try {
            System.out.println("\n📦 FORM DATA PARTS:");

            if (request instanceof MultipartHttpServletRequest) {
                MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) request;

                // Log mỗi form part
                multipartRequest.getFileMap().forEach((partName, multipartFile) -> {
                    System.out.println("   📎 Part: " + partName);
                    System.out.println("      - Original Filename: " + multipartFile.getOriginalFilename());
                    System.out.println("      - Content-Type: " + multipartFile.getContentType());
                    System.out.println("      - Size: " + multipartFile.getSize() + " bytes");
                });

                // Log text parameters
                multipartRequest.getParameterMap().forEach((paramName, paramValues) -> {
                    if (!multipartRequest.getFileMap().containsKey(paramName)) {
                        System.out.println("   📝 Param: " + paramName);
                        System.out.println("      - Value: " + String.join(", ", paramValues));
                    }
                });

                // 🔑 LOG "post" PART CONTENT (most important for debugging!)
                String postContent = multipartRequest.getParameter("post");
                if (postContent != null) {
                    System.out.println("\n🔍 SPECIAL DEBUG - 'post' Part Content:");
                    System.out.println("   Type: " + postContent.getClass().getName());
                    System.out.println("   Length: " + postContent.length() + " chars");
                    System.out.println("   Content (first 500 chars):\n");
                    System.out.println("   " + postContent.substring(0, Math.min(500, postContent.length())));
                    if (postContent.length() > 500) {
                        System.out.println("   ... (truncated)");
                    }
                } else {
                    System.out.println("\n⚠️  WARNING: 'post' part is NULL or not found!");
                    System.out.println("   Available parts: " + multipartRequest.getParameterNames());
                }

            } else {
                System.out.println("   ⚠️  Not a MultipartHttpServletRequest");
            }
        } catch (Exception e) {
            System.out.println("   ❌ Error logging FormData: " + e.getMessage());
        }
    }

    /**
     * Log JSON Request Body (Web sẽ qua hàm này)
     */
    private void logRequestBody(HttpServletRequest request) {
        // try {
        //     System.out.println("\n📄 REQUEST BODY:");

        //     // Wrap request để có thể đọc body nhiều lần
        //     String body = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
        //     if (body.isEmpty()) {
        //         System.out.println("   (empty body)");
        //     } else {
        //         System.out.println("   " + body.substring(0, Math.min(500, body.length())));
        //         if (body.length() > 500) {
        //             System.out.println("   ... (truncated)");
        //         }
        //     }
        // } catch (Exception e) {
        //     System.out.println("   ❌ Error reading body: " + e.getMessage());
        // }
    }
}
