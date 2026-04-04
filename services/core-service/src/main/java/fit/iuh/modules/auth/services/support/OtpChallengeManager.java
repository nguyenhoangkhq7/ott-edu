package fit.iuh.modules.auth.services.support;

import fit.iuh.modules.auth.dtos.auth.OtpPurpose;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OtpChallengeManager {

    private final ConcurrentHashMap<String, OtpChallenge> challenges = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> latestChallengeByScope = new ConcurrentHashMap<>();

    public OtpChallenge createChallenge(
            String email,
            OtpPurpose purpose,
            String otpHash,
            long ttlSeconds,
            int maxAttempts
    ) {
        cleanupExpired();

        String scopeKey = buildScopeKey(email, purpose);
        String previousChallengeId = latestChallengeByScope.remove(scopeKey);
        if (previousChallengeId != null) {
            challenges.remove(previousChallengeId);
        }

        String challengeId = UUID.randomUUID().toString();
        OtpChallenge challenge = OtpChallenge.builder()
                .id(challengeId)
                .email(email)
                .purpose(purpose)
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusSeconds(ttlSeconds))
                .attempts(0)
                .maxAttempts(maxAttempts)
                .used(false)
                .build();

        challenges.put(challengeId, challenge);
        latestChallengeByScope.put(scopeKey, challengeId);

        return challenge;
    }

    public String verifyAndConsume(
            String challengeId,
            OtpPurpose expectedPurpose,
            String otpCode,
            PasswordEncoder passwordEncoder
    ) {
        OtpChallenge challenge = challenges.get(challengeId);
        if (challenge == null) {
            throw new RuntimeException("Phiên xác thực OTP không tồn tại hoặc đã hết hạn.");
        }

        if (challenge.isUsed()) {
            throw new RuntimeException("Mã OTP đã được sử dụng.");
        }

        if (challenge.getPurpose() != expectedPurpose) {
            throw new RuntimeException("Mục đích xác thực OTP không hợp lệ.");
        }

        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            removeChallenge(challenge);
            throw new RuntimeException("Mã OTP đã hết hạn.");
        }

        if (challenge.getAttempts() >= challenge.getMaxAttempts()) {
            removeChallenge(challenge);
            throw new RuntimeException("Bạn đã nhập sai OTP quá số lần cho phép.");
        }

        if (!passwordEncoder.matches(otpCode, challenge.getOtpHash())) {
            challenge.setAttempts(challenge.getAttempts() + 1);
            if (challenge.getAttempts() >= challenge.getMaxAttempts()) {
                removeChallenge(challenge);
            } else {
                challenges.put(challenge.getId(), challenge);
            }

            throw new RuntimeException("Mã OTP không chính xác.");
        }

        removeChallenge(challenge);
        return challenge.getEmail();
    }

    public OtpChallenge getChallenge(String challengeId) {
        OtpChallenge challenge = challenges.get(challengeId);
        if (challenge == null || challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            if (challenge != null) {
                removeChallenge(challenge);
            }
            return null;
        }

        return challenge;
    }

    private void cleanupExpired() {
        LocalDateTime now = LocalDateTime.now();
        challenges.values().forEach(challenge -> {
            if (challenge.getExpiresAt().isBefore(now)) {
                removeChallenge(challenge);
            }
        });
    }

    private void removeChallenge(OtpChallenge challenge) {
        challenges.remove(challenge.getId());
        latestChallengeByScope.remove(buildScopeKey(challenge.getEmail(), challenge.getPurpose()), challenge.getId());
    }

    private String buildScopeKey(String email, OtpPurpose purpose) {
        return email.trim().toLowerCase() + "|" + purpose.name();
    }
}
