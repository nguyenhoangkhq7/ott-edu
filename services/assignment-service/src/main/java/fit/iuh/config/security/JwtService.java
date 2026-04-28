package fit.iuh.config.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JwtService {

    private static final String CLAIM_ACCOUNT_ID = "accountId";
    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_TYPE = "type";

    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public boolean isTokenValid(String token, String expectedEmail) {
        String email = extractSubject(token);
        return expectedEmail.equals(email) && !isTokenExpired(token);
    }

    public String extractSubject(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Long extractAccountId(String token) {
        Object accountId = extractAllClaims(token).get(CLAIM_ACCOUNT_ID);
        if (accountId instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    public List<String> extractRoles(String token) {
        Object roles = extractAllClaims(token).get(CLAIM_ROLES);
        if (!(roles instanceof List<?> roleList)) {
            return List.of();
        }

        return roleList.stream()
                .filter(item -> item != null && !item.toString().isBlank())
                .map(Object::toString)
                .collect(Collectors.toList());
    }

    public boolean isAccessToken(String token) {
        String type = extractAllClaims(token).get(CLAIM_TYPE, String.class);
        return "access".equals(type);
    }

    public boolean isRefreshToken(String token) {
        String type = extractAllClaims(token).get(CLAIM_TYPE, String.class);
        return "refresh".equals(type);
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractAllClaims(token).getExpiration();
        return expiration.before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
