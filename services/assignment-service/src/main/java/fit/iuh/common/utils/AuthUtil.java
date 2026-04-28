package fit.iuh.common.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Utility class for secure extraction of user information from Authentication
 * context.
 * 
 * Handles safe parsing and type checking to avoid IllegalArgumentException.
 */
public class AuthUtil {

    /**
     * Extract userId from Authentication principal safely.
     * 
     * Supports two principal types:
     * 1. UserPrincipal: Custom principal with userId
     * 2. UserDetails: Standard Spring principal with username
     * 
     * @param authentication The Authentication object from SecurityContext
     * @return The extracted user ID as Long
     * @throws IllegalArgumentException if principal cannot be parsed or is not set
     */
    public static Long extractUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Authentication is required and must be authenticated");
        }

        Object principal = authentication.getPrincipal();

        // Try custom UserPrincipal first
        if (principal instanceof UserPrincipal) {
            UserPrincipal userPrincipal = (UserPrincipal) principal;
            Long userId = userPrincipal.getId();
            if (userId != null) {
                return userId;
            }
        }

        // Try standard UserDetails (use username as fallback - convert to Long)
        if (principal instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) principal;
            String username = userDetails.getUsername();
            try {
                return Long.parseLong(username);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException(
                        "Username '" + username + "' cannot be parsed as Long user ID", e);
            }
        }

        // Try string principal
        if (principal instanceof String) {
            String username = (String) principal;
            try {
                return Long.parseLong(username);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException(
                        "Principal '" + username + "' cannot be parsed as Long user ID", e);
            }
        }

        throw new IllegalArgumentException(
                "Principal type '" + principal.getClass().getName() + "' is not supported. " +
                        "Expected UserPrincipal or UserDetails with numeric username");
    }

    /**
     * Custom UserPrincipal interface - implement in your security configuration.
     * 
     * Example:
     * 
     * <pre>
     * public class CustomUserPrincipal implements UserPrincipal, UserDetails {
     *     private Long id;
     *     private String username;
     *     // ... constructor, getters, etc.
     * }
     * </pre>
     */
    public interface UserPrincipal {
        Long getId();
    }
}
