package fit.iuh.modules.auth.config;

import fit.iuh.models.Account;
import fit.iuh.modules.auth.dtos.auth.OtpPurpose;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {

    private static final String CLAIM_ACCOUNT_ID = "accountId";
    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_TYPE = "type";

    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public String generateAccessToken(Account account) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getAccessTokenExpirationMs());
        List<String> roles = List.of(account.getRole().name());

        return Jwts.builder()
                .subject(account.getEmail())
                .claim(CLAIM_ACCOUNT_ID, account.getId())
                .claim(CLAIM_ROLES, roles)
                .claim(CLAIM_TYPE, "access")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(Account account) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getRefreshTokenExpirationMs());

        return Jwts.builder()
                .subject(account.getEmail())
                .claim(CLAIM_ACCOUNT_ID, account.getId())
                .claim(CLAIM_TYPE, "refresh")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    public String generateOtpVerifiedToken(String email, OtpPurpose purpose) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getOtpVerifiedTokenExpirationMs());

        return Jwts.builder()
                .subject(email)
                .claim(CLAIM_TYPE, "otp_verified")
                .claim("otpPurpose", purpose.name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    public boolean isTokenValid(String token, String expectedEmail) {
        String email = extractSubject(token);
        return expectedEmail.equals(email) && !isTokenExpired(token);
    }

    public String extractSubject(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isAccessToken(String token) {
        String type = extractAllClaims(token).get(CLAIM_TYPE, String.class);
        return "access".equals(type);
    }

    public boolean isRefreshToken(String token) {
        String type = extractAllClaims(token).get(CLAIM_TYPE, String.class);
        return "refresh".equals(type);
    }

    public boolean isOtpVerifiedToken(String token) {
        String type = extractAllClaims(token).get(CLAIM_TYPE, String.class);
        return "otp_verified".equals(type) && !isTokenExpired(token);
    }

    public boolean isOtpVerifiedTokenForPurpose(String token, OtpPurpose purpose) {
        if (!isOtpVerifiedToken(token)) {
            return false;
        }

        String tokenPurpose = extractAllClaims(token).get("otpPurpose", String.class);
        return purpose.name().equals(tokenPurpose);
    }

    public long getOtpVerifiedTokenExpirationMs() {
        return jwtProperties.getOtpVerifiedTokenExpirationMs();
    }

    public long getAccessTokenExpirationMs() {
        return jwtProperties.getAccessTokenExpirationMs();
    }

    public long getRefreshTokenExpirationMs() {
        return jwtProperties.getRefreshTokenExpirationMs();
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
