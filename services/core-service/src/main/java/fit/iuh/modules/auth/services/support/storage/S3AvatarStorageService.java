package fit.iuh.modules.auth.services.support.storage;

import fit.iuh.modules.auth.config.S3StorageProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3AvatarStorageService implements AvatarStorageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(S3AvatarStorageService.class);

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private final S3Client s3Client;
    private final S3StorageProperties properties;

    @Override
    public String uploadAvatar(Long accountId, MultipartFile file, String oldAvatarUrl) {
        validateFile(file);

        String extension = resolveExtension(file.getOriginalFilename(), file.getContentType());
        String key = buildObjectKey(accountId, extension);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.bucket())
                .key(key)
                .contentType(file.getContentType())
                .build();

        try {
            s3Client.putObject(request, RequestBody.fromBytes(file.getBytes()));
        } catch (IOException ex) {
            throw new RuntimeException("Khong the doc tep anh de tai len.");
        } catch (Exception ex) {
            throw new RuntimeException("Tai anh dai dien len S3 that bai. Vui long thu lai sau.");
        }

        deleteOldAvatarQuietly(oldAvatarUrl, key);

        return buildPublicUrl(key);
    }

    @Override
    public void deleteAvatarByUrl(String avatarUrl) {
        Optional<String> maybeKey = extractManagedKey(avatarUrl);
        if (maybeKey.isEmpty()) {
            return;
        }

        deleteObjectQuietly(maybeKey.get());
    }

    private void deleteOldAvatarQuietly(String oldAvatarUrl, String newKey) {
        Optional<String> maybeOldKey = extractManagedKey(oldAvatarUrl);
        if (maybeOldKey.isEmpty()) {
            return;
        }

        String oldKey = maybeOldKey.get();
        if (oldKey.equals(newKey)) {
            return;
        }

        deleteObjectQuietly(oldKey);
    }

    private void deleteObjectQuietly(String key) {
        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(properties.bucket())
                    .key(key)
                    .build();
            s3Client.deleteObject(request);
        } catch (Exception ex) {
            LOGGER.warn("Delete old avatar failed for key={}", key, ex);
        }
    }

    private Optional<String> extractManagedKey(String avatarUrl) {
        if (!StringUtils.hasText(avatarUrl)) {
            return Optional.empty();
        }

        String normalized = avatarUrl.trim();
        String prefix = resolveManagedPrefix();

        if (prefix != null && normalized.startsWith(prefix)) {
            String key = normalized.substring(prefix.length());
            return normalizeKey(key);
        }

        String defaultPrefix = String.format("https://%s.s3.%s.amazonaws.com/", properties.bucket(), properties.region());
        if (normalized.startsWith(defaultPrefix)) {
            String key = normalized.substring(defaultPrefix.length());
            return normalizeKey(key);
        }

        try {
            URI uri = URI.create(normalized);
            String host = uri.getHost();
            if (!StringUtils.hasText(host)) {
                return Optional.empty();
            }

            String expectedHost = String.format("%s.s3.%s.amazonaws.com", properties.bucket(), properties.region());
            if (!host.equalsIgnoreCase(expectedHost)) {
                return Optional.empty();
            }

            return normalizeKey(uri.getPath());
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private String resolveManagedPrefix() {
        if (!StringUtils.hasText(properties.publicBaseUrl())) {
            return null;
        }

        return properties.publicBaseUrl().replaceAll("/$", "") + "/";
    }

    private Optional<String> normalizeKey(String key) {
        if (!StringUtils.hasText(key)) {
            return Optional.empty();
        }

        String normalized = key.startsWith("/") ? key.substring(1) : key;
        if (!StringUtils.hasText(normalized)) {
            return Optional.empty();
        }

        return Optional.of(normalized);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Vui long chon tep anh truoc khi tai len.");
        }

        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new RuntimeException("Dinh dang anh khong ho tro. Chi chap nhan JPG, PNG, WEBP, GIF.");
        }

        if (file.getSize() > properties.maxFileSizeBytes()) {
            throw new RuntimeException("Anh vuot qua kich thuoc toi da cho phep.");
        }
    }

    private String resolveExtension(String originalFilename, String contentType) {
        if (StringUtils.hasText(originalFilename) && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
            if (!ext.isBlank()) {
                return ext;
            }
        }

        if ("image/jpeg".equals(contentType)) {
            return "jpg";
        }

        if ("image/png".equals(contentType)) {
            return "png";
        }

        if ("image/webp".equals(contentType)) {
            return "webp";
        }

        if ("image/gif".equals(contentType)) {
            return "gif";
        }

        return "bin";
    }

    private String buildObjectKey(Long accountId, String extension) {
        String folder = StringUtils.hasText(properties.avatarFolder()) ? properties.avatarFolder() : "avatars";
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return String.format("%s/%d/%s-%s.%s", folder, accountId, timestamp, UUID.randomUUID(), extension);
    }

    private String buildPublicUrl(String key) {
        if (StringUtils.hasText(properties.publicBaseUrl())) {
            String base = properties.publicBaseUrl().replaceAll("/$", "");
            return base + "/" + key;
        }

        return String.format(
                "https://%s.s3.%s.amazonaws.com/%s",
                properties.bucket(),
                properties.region(),
                key
        );
    }
}
