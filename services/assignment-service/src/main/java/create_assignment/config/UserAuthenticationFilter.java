package create_assignment.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Filter đọc thông tin user từ header do Nginx gắn
 * Nginx nhận từ core-service /_auth/validate rồi gắn vào request
 * Header: X-User-Id, X-User-Email, X-User-Roles
 * 
 * Tạo UsernamePasswordAuthenticationToken để Spring Security biết
 */
@Component
public class UserAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_USER_EMAIL = "X-User-Email";
    private static final String HEADER_USER_ROLES = "X-User-Roles";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String email = request.getHeader(HEADER_USER_EMAIL);
        String userIdStr = request.getHeader(HEADER_USER_ID);
        String rolesStr = request.getHeader(HEADER_USER_ROLES);

        // Nếu header không tồn tại, bỏ qua filter
        if (!StringUtils.hasText(email) || !StringUtils.hasText(userIdStr)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Long userId = Long.parseLong(userIdStr);

            // Parse roles từ header (giả sử format: ROLE1,ROLE2,ROLE3)
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            if (StringUtils.hasText(rolesStr)) {
                authorities = Arrays.stream(rolesStr.split(","))
                        .map(String::trim)
                        .filter(role -> !role.isEmpty())
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .collect(Collectors.toList());
            }

            // Tạo custom principal object (có thể mở rộng sau)
            AuthenticatedUser principal = new AuthenticatedUser(userId, email);

            // Tạo authentication token
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (NumberFormatException ex) {
            // Invalid userId format, clear context
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

/**
 * Custom principal object chứa thông tin user
 */
public static class AuthenticatedUser {
    private final Long userId;
    private final String email;

    public AuthenticatedUser(Long userId, String email) {
        this.userId = userId;
        this.email = email;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public String toString() {
        return email;
    }
    }
}
