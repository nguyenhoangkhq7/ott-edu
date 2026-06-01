package fit.iuh.modules.auth.config;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import fit.iuh.modules.auth.services.CustomUserDetailsService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, CustomUserDetailsService customUserDetailsService) {
        this.jwtService = jwtService;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String contentType = request.getContentType();

        System.out.println("\n" + "=".repeat(80));
        System.out.println("🔐 [JwtAuthenticationFilter] Processing request");
        System.out.println("   Method: " + method);
        System.out.println("   URI: " + uri);
        System.out.println("   Content-Type: " + contentType);

        String authHeader = request.getHeader("Authorization");

        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            System.out.println("   ℹ️  No Authorization header found → Passing through (permitAll?)");
            System.out.println("=".repeat(80) + "\n");
            filterChain.doFilter(request, response);
            return;
        }

        System.out.println("   ✅ Authorization header found");
        String token = authHeader.substring(7);
        System.out.println("   Token length: " + token.length() + " chars");

        try {
            System.out.println("   🔍 Step 1: Checking if token is AccessToken...");
            if (!jwtService.isAccessToken(token)) {
                System.out.println("   ⚠️  Token is NOT an AccessToken (maybe RefreshToken?) → Passing through");
                System.out.println("=".repeat(80) + "\n");
                filterChain.doFilter(request, response);
                return;
            }
            System.out.println("   ✅ Token is AccessToken");

            System.out.println("   🔍 Step 2: Extracting email from token...");
            String email = jwtService.extractSubject(token);
            if (!StringUtils.hasText(email) || SecurityContextHolder.getContext().getAuthentication() != null) {
                System.out.println("   ⚠️  Email is empty or already authenticated → Passing through");
                System.out.println("=".repeat(80) + "\n");
                filterChain.doFilter(request, response);
                return;
            }
            System.out.println("   ✅ Email extracted: " + email);

            System.out.println("   🔍 Step 3: Loading user details for: " + email);
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
            System.out.println("   ✅ User loaded successfully");

            System.out.println("   🔍 Step 4: Validating token...");
            if (!jwtService.isTokenValid(token, userDetails.getUsername())) {
                System.out.println("   ❌ Token validation FAILED → Passing through");
                System.out.println("=".repeat(80) + "\n");
                filterChain.doFilter(request, response);
                return;
            }
            System.out.println("   ✅ Token is VALID");

            System.out.println("   🔍 Step 5: Creating authentication token...");
            UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );
            authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            System.out.println("   ✅ Authentication set successfully for: " + email);

        } catch (JwtException ex) {
            System.err.println("   ❌ JwtException caught: " + ex.getMessage());
            ex.printStackTrace();
            SecurityContextHolder.clearContext();

        } catch (IllegalArgumentException ex) {
            System.err.println("   ❌ IllegalArgumentException caught: " + ex.getMessage());
            ex.printStackTrace();
            SecurityContextHolder.clearContext();

        } catch (UsernameNotFoundException ex) {
            System.err.println("   ❌ UsernameNotFoundException caught: " + ex.getMessage());
            ex.printStackTrace();
            SecurityContextHolder.clearContext();

        } catch (Exception ex) {
            System.err.println("   ❌ UNEXPECTED Exception caught: " + ex.getClass().getSimpleName());
            System.err.println("   Message: " + ex.getMessage());
            ex.printStackTrace();
            SecurityContextHolder.clearContext();
        }

        System.out.println("=".repeat(80) + "\n");
        filterChain.doFilter(request, response);
    }
}
