package fit.iuh.config.security;

import io.jsonwebtoken.JwtException;
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
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            if (!jwtService.isAccessToken(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            String email = jwtService.extractSubject(token);
            Long accountId = jwtService.extractAccountId(token);
            List<String> roles = jwtService.extractRoles(token);

            if (!StringUtils.hasText(email) || accountId == null
                    || SecurityContextHolder.getContext().getAuthentication() != null) {
                filterChain.doFilter(request, response);
                return;
            }

            // Create UserPrincipal with accountId from JWT
            UserPrincipal userPrincipal = new UserPrincipal(
                    accountId,
                    email,
                    "",
                    roles.stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toSet()),
                    true);

            UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                    userPrincipal,
                    null,
                    userPrincipal.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authenticationToken);
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
